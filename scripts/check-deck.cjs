// Render and inspect an authored, trusted PPT Studio deck. No network access.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function check(input, out, { pdf = false, pptx = false } = {}) {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const faults = [];
  const report = { slides: 0, notes: 0, faults, screenshots: [], limits: ['Visual hierarchy, overlap and typography still require screenshot review.'] };
  try {
    const context = await browser.newContext({viewport:{width:1280,height:720}, reducedMotion:'reduce'});
    await context.route(/^https?:/, route => { faults.push(`External resource: ${route.request().url()}`); return route.abort(); });
    const page = await context.newPage();
    page.on('pageerror', e => faults.push(e.message));
    page.on('requestfailed', request => faults.push(`Resource failed: ${request.url()}`));
    await page.goto(pathToFileURL(path.resolve(input)).href);
    await page.waitForFunction(() => window.PPTStudio, null, {timeout:10000});
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.body.classList.add('studio-static'));
    await page.addStyleTag({content:'[data-studio-ui]{visibility:hidden!important}*,*::before,*::after{animation:none!important;transition:none!important}'});
    report.slides = await page.locator('.slide').count();
    report.notes = await page.locator('.slide template[data-notes]').count();
    let deck;
    if (pptx) {
      const PptxGenJS = require('pptxgenjs'); deck = new PptxGenJS();
      deck.layout = 'LAYOUT_WIDE'; deck.author = 'PPT Studio'; deck.subject = 'Editable text over rasterized complex visuals';
      report.limits.push('PPTX: annotated text and rectangles are editable; other visuals are rasterized. Browser interactions and animation are not exported. Check font metrics in PowerPoint.');
    }
    for (let index = 0; index < report.slides; index++) {
      await page.evaluate(i => window.PPTStudio.go(i), index);
      const state = await page.evaluate(() => {
        const slide = document.querySelector('.slide.active');
        const rect = slide.getBoundingClientRect();
        const factor = rect.width / 1920;
        const issues = [];
        const visible = [...document.querySelectorAll('.slide')].filter(e => getComputedStyle(e).visibility !== 'hidden' && Number(getComputedStyle(e).opacity) > 0);
        if (visible.length !== 1) issues.push('Expected exactly one visible slide');
        if (!slide.querySelector('template[data-notes]').content.textContent.trim()) issues.push('Empty speaker notes');
        for (const e of slide.querySelectorAll('[data-edit-id],img,svg,[data-qa-box]')) {
          const b = e.getBoundingClientRect();
          if (b.left < rect.left-1 || b.top < rect.top-1 || b.right > rect.right+1 || b.bottom > rect.bottom+1) issues.push(`Outside stage: ${e.dataset.editId || e.tagName}`);
          if (e.matches('[data-edit-id]')) {
            const c = getComputedStyle(e);
            if ((c.overflowX !== 'visible' && e.scrollWidth > e.clientWidth+2) || (c.overflowY !== 'visible' && e.scrollHeight > e.clientHeight+2)) issues.push(`Clipped text: ${e.dataset.editId}`);
            const range = document.createRange(); range.selectNodeContents(e);
            const text = range.getBoundingClientRect(), box = e.closest('[data-qa-box]')?.getBoundingClientRect() || rect;
            if (text.left < box.left-1 || text.top < box.top-1 || text.right > box.right+1 || text.bottom > box.bottom+1) issues.push(`Text outside container: ${e.dataset.editId}`);
          }
          if (e.tagName === 'IMG' && (!e.complete || !e.naturalWidth)) issues.push('Broken image');
        }
        const elements = [...slide.querySelectorAll('[data-edit-id],[data-pptx-shape]')].map(e => {
          const b = e.getBoundingClientRect(), c = getComputedStyle(e);
          const shape = e.hasAttribute('data-pptx-shape');
          const left = shape ? 0 : parseFloat(c.paddingLeft)+parseFloat(c.borderLeftWidth);
          const top = shape ? 0 : parseFloat(c.paddingTop)+parseFloat(c.borderTopWidth);
          const right = shape ? 0 : parseFloat(c.paddingRight)+parseFloat(c.borderRightWidth);
          const bottom = shape ? 0 : parseFloat(c.paddingBottom)+parseFloat(c.borderBottomWidth);
          return {kind:shape?'rect':'text', text:e.innerText, x:((b.left-rect.left)/factor+left)/144, y:((b.top-rect.top)/factor+top)/144, w:(b.width/factor-left-right)/144, h:(b.height/factor-top-bottom)/144,
            size:parseFloat(c.fontSize)/2, font:c.fontFamily.split(',')[0].replace(/["']/g,''), bold:Number(c.fontWeight)>=600, color:c.color, fill:c.backgroundColor, border:c.borderTopColor, borderWidth:parseFloat(c.borderTopWidth)/2, align:c.textAlign, opacity:Number(c.opacity)};
        });
        return {id:slide.dataset.slideId, issues, elements, notes:slide.querySelector('template[data-notes]').content.textContent};
      });
      faults.push(...state.issues.map(f => `${state.id}: ${f}`));
      const filename = `${String(index+1).padStart(2,'0')}.png`;
      await page.locator('.deck-stage').screenshot({path:path.join(out, filename)});
      report.screenshots.push(filename);
      if (deck) {
        // Keep complex CSS/SVG as a backdrop; explicit editable elements remain native.
        const style = await page.addStyleTag({content:'.slide.active [data-edit-id]{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}.slide.active [data-pptx-shape]{background:transparent!important;border-color:transparent!important;box-shadow:none!important}'});
        const backdrop = await page.locator('.deck-stage').screenshot();
        await style.evaluate(e => e.remove());
        const s = deck.addSlide(); s.addImage({data:'data:image/png;base64,'+backdrop.toString('base64'), x:0,y:0,w:13.333333,h:7.5});
        const color = value => {
          const numbers = value.match(/[\d.]+/g)?.map(Number) || [0,0,0];
          return {hex:numbers.slice(0,3).map(n=>Math.round(n).toString(16).padStart(2,'0')).join(''), transparency:Math.round((1-(numbers[3] ?? 1))*100)};
        };
        for (const e of state.elements.filter(e => e.kind === 'rect')) s.addShape(deck.ShapeType.rect, {x:e.x,y:e.y,w:e.w,h:e.h,fill:{color:color(e.fill).hex,transparency:color(e.fill).transparency},line:{color:color(e.border).hex,width:e.borderWidth,transparency:e.borderWidth ? color(e.border).transparency : 100}});
        for (const e of state.elements.filter(e => e.kind === 'text')) s.addText(e.text, {x:e.x,y:e.y,w:e.w,h:e.h,fontSize:e.size,fontFace:e.font,bold:e.bold,color:color(e.color).hex,transparency:Math.max(color(e.color).transparency,Math.round((1-e.opacity)*100)),align:['left','center','right','justify'].includes(e.align)?e.align:'left',margin:0,breakLine:false,valign:'top',paraSpaceAfterPt:0});
        s.addNotes(state.notes);
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    const ratio = await page.locator('.deck-stage').evaluate(e => {const r=e.getBoundingClientRect();return r.width/r.height;});
    if (Math.abs(ratio-16/9)>0.001) faults.push('Phone stage ratio is not 16:9');
    report.phone16by9 = Math.abs(ratio-16/9)<0.001;
    if (faults.length === 0) {
      if (pdf) {
        await page.setViewportSize({width:1920,height:1080});
        await page.pdf({path:path.join(out,'presentation.pdf'),width:'1920px',height:'1080px',printBackground:true,margin:{top:0,bottom:0,left:0,right:0}});
      }
      if (deck) await deck.writeFile({fileName:path.join(out,'presentation.pptx')});
    }
    report.status = faults.length ? 'FAIL' : 'PASS';
    await fs.writeFile(path.join(out,'qa-report.json'),JSON.stringify(report,null,2));
    return report;
  } catch (error) {
    faults.push(error.message); report.status = 'FAIL';
    await fs.writeFile(path.join(out,'qa-report.json'),JSON.stringify(report,null,2));
    throw error;
  } finally { await browser.close(); }
}
module.exports = { check };
if (require.main === module) {
  const [input,out,...flags]=process.argv.slice(2);
  if (!input || !out || flags.some(f=>!['--pdf','--pptx'].includes(f))) {console.error('Usage: node scripts/check-deck.cjs deck.html output-folder [--pdf] [--pptx]');process.exitCode=1;}
  else check(input,path.resolve(out),{pdf:flags.includes('--pdf'),pptx:flags.includes('--pptx')}).then(report=>{console.log(JSON.stringify(report,null,2));if(report.faults.length)process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});
}
