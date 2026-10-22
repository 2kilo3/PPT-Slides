/* Copyright (c) 2026 2kilo3. MIT. Independently implemented PPT Studio runtime. */
(() => {
  'use strict';
  const stage = document.querySelector('.deck-stage');
  const slides = [...document.querySelectorAll('.slide')];
  const fields = [...document.querySelectorAll('[data-edit-id]')];
  const ids = slides.map(s => s.dataset.slideId);
  if (!stage || !slides.length || ids.some(id => !id) || new Set(ids).size !== ids.length)
    throw new Error('Every slide needs a unique data-slide-id and a .deck-stage parent.');
  if (!document.documentElement.dataset.deckId || fields.some(e => !e.dataset.editId) ||
      new Set(fields.map(e => e.dataset.editId)).size !== fields.length)
    throw new Error('A unique deck ID and unique edit IDs are required.');
  if (slides.some(s => s.querySelectorAll('template[data-notes]').length !== 1))
    throw new Error('Each slide needs exactly one template[data-notes].');
  const key = 'ppt-studio:' + document.documentElement.dataset.deckId;
  const original = new Map(fields.map(e => [e.dataset.editId, e.textContent]));
  const note = s => s.querySelector('template[data-notes]');
  const originalNotes = new Map(slides.map(s => [s.dataset.slideId, note(s).content.textContent]));
  let index = 0, editing = false, presenter = null, elapsed = 0, started = null;
  const toolbar = document.createElement('nav');
  toolbar.className = 'studio-toolbar';
  toolbar.dataset.studioUi = '';
  toolbar.setAttribute('aria-label', '演示控制');
  toolbar.innerHTML = '<button data-action="previous" aria-label="上一页">←</button><span data-count></span><button data-action="next" aria-label="下一页">→</button><button data-action="presenter">演讲者 N</button><button data-action="edit" aria-pressed="false">编辑 E</button><button data-action="export">保存 HTML</button><button data-action="notes">导出讲稿</button><span role="status" aria-live="polite"></span>';
  document.body.append(toolbar);
  const status = message => { toolbar.querySelector('[role=status]').textContent = message; };
  const getNotes = s => note(s).content.textContent;
  const setNotes = (s, value) => { note(s).content.textContent = value; };
  const title = s => s.querySelector('h1,h2')?.textContent || s.dataset.slideTitle || s.dataset.slideId;
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (!saved || saved.version !== 1) return;
      let conflicts = 0;
      for (const e of fields) {
        const change = saved.fields?.[e.dataset.editId];
        if (change && typeof change.value === 'string') {
          if (e.textContent === change.base && e.textContent !== change.value) e.textContent = change.value;
          else if (e.textContent !== change.value) conflicts++;
        }
      }
      for (const s of slides) {
        const change = saved.notes?.[s.dataset.slideId];
        if (change && typeof change.value === 'string') {
          if (getNotes(s) === change.base && getNotes(s) !== change.value) setNotes(s, change.value);
          else if (getNotes(s) !== change.value) conflicts++;
        }
      }
      if (conflicts) status(`源文件已更新；${conflicts} 处旧草稿未覆盖新内容。`);
    } catch { status('本地草稿不可用；仍可编辑并保存 HTML。'); }
  }
  function save() {
    const data = {version: 1, fields: {}, notes: {}};
    for (const e of fields) data.fields[e.dataset.editId] = {base: original.get(e.dataset.editId), value: e.textContent};
    for (const s of slides) data.notes[s.dataset.slideId] = {base: originalNotes.get(s.dataset.slideId), value: getNotes(s)};
    try { localStorage.setItem(key, JSON.stringify(data)); status('草稿已保存在此浏览器；保存 HTML 可携带修改。'); }
    catch { status('浏览器无法保存草稿，请保存 HTML 以保留修改。'); }
  }
  function scale() {
    const factor = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${(innerWidth-1920*factor)/2}px,${(innerHeight-1080*factor)/2}px) scale(${factor})`;
  }
  function go(next) {
    if (!Number.isFinite(next)) return;
    index = Math.max(0, Math.min(Math.trunc(next), slides.length - 1));
    slides.forEach((s,i) => {
      s.classList.toggle('active', i === index);
      s.classList.toggle('visible', i === index);
      s.setAttribute('aria-hidden', String(i !== index));
      s.inert = i !== index;
    });
    toolbar.querySelector('[data-count]').textContent = `${index + 1} / ${slides.length}`;
    toolbar.querySelector('[data-action=previous]').disabled = index === 0;
    toolbar.querySelector('[data-action=next]').disabled = index === slides.length - 1;
    refreshPresenter();
  }
  function edit(value = !editing) {
    editing = value;
    document.body.classList.toggle('studio-editing', editing);
    for (const e of fields) {
      if (editing) e.setAttribute('contenteditable', 'plaintext-only');
      else e.removeAttribute('contenteditable');
    }
    toolbar.querySelector('[data-action=edit]').setAttribute('aria-pressed', String(editing));
    if (!editing) save();
  }
  function snapshot(preview = false) {
    const root = document.documentElement.cloneNode(true);
    root.querySelectorAll('[data-studio-ui]').forEach(e => e.remove());
    root.querySelector('body').classList.remove('studio-editing', 'studio-static');
    root.querySelectorAll('[data-edit-id]').forEach(e => e.removeAttribute('contenteditable'));
    root.querySelector('.deck-stage').style.removeProperty('transform');
    root.querySelectorAll('.slide').forEach((s, i) => {
      const active = i === (preview ? index : 0);
      s.classList.toggle('active', active); s.classList.toggle('visible', active);
      s.setAttribute('aria-hidden', String(!active));
      s.toggleAttribute('inert', !active);
    });
    if (preview) {
      root.querySelectorAll('script').forEach(e => e.remove());
      root.querySelector('body').classList.add('studio-static');
    }
    return '<!doctype html>\n' + root.outerHTML;
  }
  function download(text, mime, suffix) {
    const url = URL.createObjectURL(new Blob([text], {type: mime}));
    const a = document.createElement('a'); a.href = url;
    a.download = (document.title || 'presentation').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-') + suffix;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportHTML() { save(); download(snapshot(), 'text/html;charset=utf-8', '.html'); }
  function exportNotes() {
    download(slides.map((s,i) => `## ${i+1}. ${title(s)}\n\n${getNotes(s)}\n`).join('\n'), 'text/markdown;charset=utf-8', '-讲稿.md');
  }
  function timerText() {
    const seconds = Math.floor((elapsed + (started === null ? 0 : Date.now()-started)) / 1000);
    return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
  }
  function updateTimer() {
    if (presenter && !presenter.closed) {
      presenter.document.querySelector('[data-timer]').textContent = timerText();
      presenter.document.querySelector('[data-clock]').textContent = started === null ? '开始 / 继续' : '暂停';
    }
  }
  function refreshPresenter() {
    if (!presenter || presenter.closed) return;
    const d = presenter.document;
    d.querySelector('h1').textContent = `${index+1} / ${slides.length} · ${title(slides[index])}`;
    d.querySelector('[data-next]').textContent = index+1 < slides.length ? `下一页：${title(slides[index+1])}` : '已到最后一页';
    const textarea = d.querySelector('textarea');
    if (d.activeElement !== textarea || textarea.dataset.slideId !== slides[index].dataset.slideId)
      textarea.value = getNotes(slides[index]);
    textarea.dataset.slideId = slides[index].dataset.slideId;
    d.querySelector('iframe').srcdoc = snapshot(true);
    updateTimer();
  }
  function openPresenter() {
    if (presenter && !presenter.closed) { presenter.focus(); return; }
    presenter = window.open('', '', 'popup,width=1120,height=850');
    if (!presenter) { status('演讲者窗口被拦截，请允许弹窗后再按 N。'); return; }
    const d = presenter.document;
    d.open();
    d.write('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>演讲者</title><style>*{box-sizing:border-box}body{margin:24px;background:#eef2f5;color:#172934;font:18px/1.5 system-ui,sans-serif}h1{font-size:24px}button{font:inherit;padding:6px 12px;margin:4px;border:1px solid #748594;border-radius:5px;background:white}button:focus-visible,textarea:focus-visible{outline:3px solid #1672bc}textarea{width:100%;min-height:220px;font:24px/1.65 system-ui,sans-serif;padding:16px;border:1px solid #748594;border-radius:6px;resize:vertical}.preview{width:100%;aspect-ratio:16/9;max-height:340px;overflow:hidden;position:relative;background:#172934}iframe{position:absolute;width:1920px;height:1080px;border:0;transform-origin:0 0}output{font:32px monospace;margin-right:16px}</style><h1></h1><div class="preview"><iframe sandbox="" title="当前页预览"></iframe></div><p data-next></p><nav aria-label="演讲控制"><button data-prev>上一页</button><button data-forward>下一页</button><output data-timer></output><button data-clock>开始</button><button data-reset>重置计时</button><button data-smaller aria-label="减小讲稿字号">A−</button><button data-larger aria-label="增大讲稿字号">A＋</button><button data-save>保存 HTML</button></nav><label for="notes">当前页讲稿（修改后自动保存草稿）</label><textarea id="notes"></textarea></html>');
    d.close();
    const resize = () => {
      const box = d.querySelector('.preview');
      const ratio = Math.min(box.clientWidth/1920, box.clientHeight/1080);
      d.querySelector('iframe').style.transform = `scale(${ratio})`;
    };
    presenter.addEventListener('resize', resize); resize();
    d.querySelector('[data-prev]').onclick = () => { d.activeElement.blur(); go(index-1); };
    d.querySelector('[data-forward]').onclick = () => { d.activeElement.blur(); go(index+1); };
    d.querySelector('[data-clock]').onclick = () => {
      if (started === null) started = Date.now();
      else { elapsed += Date.now()-started; started = null; }
      updateTimer();
    };
    d.querySelector('[data-reset]').onclick = () => { elapsed = 0; started = null; updateTimer(); };
    for (const [selector, delta] of [['[data-smaller]', -2], ['[data-larger]', 2]])
      d.querySelector(selector).onclick = () => {
        const e = d.querySelector('textarea');
        e.style.fontSize = Math.max(16, Math.min(48, parseFloat(presenter.getComputedStyle(e).fontSize)+delta)) + 'px';
      };
    d.querySelector('textarea').oninput = e => { setNotes(slides.find(s => s.dataset.slideId === e.target.dataset.slideId), e.target.value); save(); };
    d.querySelector('[data-save]').onclick = exportHTML;
    d.addEventListener('keydown', keyboard);
    refreshPresenter();
  }
  function keyboard(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); exportHTML(); return; }
    if (e.key === 'Escape' && editing) { e.preventDefault(); edit(false); return; }
    if (e.target.closest('input,textarea,select,[contenteditable],button,a') || e.altKey || e.ctrlKey || e.metaKey) return;
    const actions = {ArrowRight: () => go(index+1), ArrowDown: () => go(index+1), PageDown: () => go(index+1), ' ': () => go(index+1), ArrowLeft: () => go(index-1), ArrowUp: () => go(index-1), PageUp: () => go(index-1), Home: () => go(0), End: () => go(slides.length-1), n: openPresenter, e: () => edit(), Escape: () => edit(false), f: () => {
      const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      action?.catch(() => status('此浏览器暂时无法全屏。'));
    }};
    const action = actions[e.key] || actions[e.key.toLowerCase()];
    if (action) { e.preventDefault(); action(); }
  }
  toolbar.addEventListener('click', e => {
    const actions = {previous: () => go(index-1), next: () => go(index+1), presenter: openPresenter, edit: () => edit(), export: exportHTML, notes: exportNotes};
    actions[e.target.dataset.action]?.();
  });
  document.addEventListener('keydown', keyboard);
  document.addEventListener('input', e => { if (e.target.matches('[data-edit-id]')) { save(); refreshPresenter(); } });
  document.addEventListener('paste', e => {
    if (!e.target.matches('[data-edit-id]')) return;
    e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  });
  let start = null, lastWheel = 0;
  stage.addEventListener('touchstart', e => { if (!editing && e.touches.length === 1) start = [e.touches[0].clientX, e.touches[0].clientY]; }, {passive:true});
  stage.addEventListener('touchend', e => {
    if (!start || editing) return;
    const dx = e.changedTouches[0].clientX-start[0], dy = e.changedTouches[0].clientY-start[1]; start = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
  }, {passive:true});
  stage.addEventListener('wheel', e => {
    if (editing || Math.abs(e.deltaY) < 20 || Date.now()-lastWheel < 500) return;
    lastWheel = Date.now(); go(index+(e.deltaY > 0 ? 1 : -1));
  }, {passive:true});
  addEventListener('resize', scale);
  addEventListener('beforeunload', () => { if (presenter && !presenter.closed) presenter.close(); });
  setInterval(updateTimer, 250);
  restore(); scale(); go(0);
  window.PPTStudio = {go, openPresenter, exportHTML, exportNotes, snapshot, get index(){return index;}, get count(){return slides.length;}};
})();
