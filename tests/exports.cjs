const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {check} = require('../scripts/check-deck.cjs');

(async()=>{
  const work=path.resolve(__dirname,'../work/test-export');await fs.mkdir(work,{recursive:true});
  const html=await fs.readFile(path.resolve(__dirname,'../work/test/demo.html'),'utf8');
  const input=path.join(work,'shapes.html');
  await fs.writeFile(input,html.replace('<p class="footer">01', '<div data-pptx-shape style="position:absolute;left:1500px;top:650px;width:180px;height:120px;background:#ff9900;border:4px solid #111"></div><p class="footer">01'));
  const result=await check(input,path.join(work,'good'),{pdf:true,pptx:true});
  assert.equal(result.status,'PASS');assert.equal(result.slides,3);assert.equal(result.notes,3);
  const pdf=await fs.readFile(path.join(work,'good/presentation.pdf'));assert.equal(pdf.subarray(0,4).toString(),'%PDF');
  execFileSync(process.env.PYTHON||'python',['-c',`import sys,zipfile,xml.etree.ElementTree as E
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
with zipfile.ZipFile(sys.argv[1]) as z:
 s=[n for n in z.namelist() if n.startswith('ppt/slides/slide') and n.endswith('.xml')]
 n=[n for n in z.namelist() if n.startswith('ppt/notesSlides/notesSlide') and n.endswith('.xml')]
 assert len(s)==len(n)==3
 first=E.fromstring(z.read('ppt/slides/slide1.xml'))
 assert len(first.findall('.//p:sp',ns))>=5
 assert any('FF9900' in E.tostring(e).decode().upper() for e in first.findall('.//p:sp',ns))
 assert any('让内容成为' in (e.text or '') for e in first.findall('.//a:t',ns))
 assert any('这是一份功能演示' in (e.text or '') for name in n for e in E.fromstring(z.read(name)).findall('.//a:t',ns))
`,path.join(work,'good/presentation.pptx')]);
  const clipped=path.join(work,'clipped.html');await fs.writeFile(clipped,html.replace('</head>','<style>[data-edit-id=opening-title]{height:10px;overflow:hidden}</style></head>'));
  const bad=await check(clipped,path.join(work,'bad'));
  assert.equal(bad.status,'FAIL');assert.ok(bad.faults.some(f=>f.includes('Clipped text')));
  console.log('PASS: PDF, native PPTX text/shape/notes, and real clipping detection');
})().catch(e=>{console.error(e);process.exitCode=1});
