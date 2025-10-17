/* MVP Family Tree (personal, private). No merging/components.
   Renders all persons from DB.users (your private garden) and relations from DB.rels.

   Expected globals:
     - window.DB { users: Person[], rels: {a,b,type}[], currentUserId: uuid }
     - window.DBAPI with methods: ensureMe, loadAll, addPerson, addRel, removeRel
     - window.UI with helpers: title, action, view, sheet, toast, close
*/

window.Tree = (function(){
  let family = null;

  async function page(){
    UI.title('Моё древо');
    UI.action('<button class="btn" onclick="Tree.openAdd()">Добавить родственника</button>');

    const v = UI.view();
    v.innerHTML = `<div id="treeContainer" style="width:100%;height:76vh;background:#fff;border:1px solid #e5e7eb;border-radius:12px;position:relative;overflow:hidden"></div>`;

    await ensureBalkanLoaded();
    const ok = await waitForLayout(document.getElementById('treeContainer'));
    if (!ok) { v.innerHTML = '<div class="card">Нет места для отрисовки</div>'; return; }

    const data = buildBalkanData(DB);
    if (!data.nodes.length) { v.innerHTML = '<div class="card">Начните с добавления себя 👋</div>'; return; }

    await render(data);
  }

  async function ensureBalkanLoaded(){
    if (!document.querySelector('link[data-ftcss]')){
      const link = document.createElement('link'); link.rel='stylesheet'; link.href='./familytree.css'; link.setAttribute('data-ftcss','1'); document.head.appendChild(link);
    }
    if (!window.FamilyTree){
      const s = document.createElement('script'); s.src = './familytree.js'; await new Promise((res,rej)=>{ s.onload=res; s.onerror=()=>rej(new Error('familytree.js')); document.head.appendChild(s); });
    }
    // Use built-in template to keep it simple
    if (window.FamilyTree) window.FamilyTree.LAZY_LOADING = true; // play nice with tabs
  }

  async function waitForLayout(el, tries=60){
    for (let i=0;i<tries;i++){ const {width:w,height:h}=el.getBoundingClientRect(); if (w>0 && h>0) return true; await new Promise(r=>requestAnimationFrame(r)); }
    return false;
  }

  function observeVisibility(el, onVisible){
    const io = new IntersectionObserver((ents)=>{ const e=ents[0]; if (e && e.isIntersecting){ io.disconnect(); requestAnimationFrame(()=>onVisible&&onVisible()); } }, {threshold:0.01});
    io.observe(el);
  }

  async function render(data){
    const container = document.getElementById('treeContainer');
    if (!container) return;

    if (!family){
      family = new FamilyTree(container, {
        template: 'tommy',
        nodeBinding: { field_0: 'nameTop', field_1: 'subtitle' },
        nodes: data.nodes,
        roots: (data.roots && data.roots.length) ? data.roots : undefined,
        mouseScrool: FamilyTree.action.zoom,
        minZoom:.5, maxZoom:2,
        siblingSeparation: 90, levelSeparation: 80, subtreeSeparation: 110
      });
    } else {
      family.load(data.nodes);
      await new Promise(r=>requestAnimationFrame(r));
    }

    setTimeout(()=>{
      const w=container.offsetWidth,h=container.offsetHeight; const root = Number.isFinite(data.rootNum)?data.rootNum:null;
      const run=()=>{ try{ family.fit(); }catch(e){} if (root){ try{ family.center(root); family.select(root);}catch(e){} } };
      if (w>0 && h>0) run(); else observeVisibility(container, run);
    },0);
  }

  // Build nodes from my private persons and relations
  function buildBalkanData(DB){
    const id2num = new Map(), num2id = new Map(); let seq=1;
    for (const u of (DB.users||[])){ id2num.set(u.id, seq); num2id.set(seq, u.id); seq++; }

    const parentsByChild = new Map(), partners = new Map();
    const setAdd=(m,k,v)=>{ if(!m.has(k)) m.set(k,new Set()); m.get(k).add(v); };

    for (const r of (DB.rels||[])){
      const a=id2num.get(r.a), b=id2num.get(r.b); if(!a||!b) continue;
      if (r.type==='parent') setAdd(parentsByChild,b,a);
      if (r.type==='spouse') setAdd(partners,a,b);
      if (r.type==='sibling'){ /* optional sibling logic */ }
    }

    const nodes = (DB.users||[]).map(u=>{
      const id = id2num.get(u.id);
      const parents = Array.from(parentsByChild.get(id)||[]);
      const [fid, mid] = parents.slice(0,2);
      const pids = partners.get(id) ? Array.from(partners.get(id)) : undefined;
      return {
        id,
        nameTop: (u.name||'Без имени') + (u.is_deceased?' †':''),
        subtitle: [u.dob||'', u.city?`• ${u.city}`:''].filter(Boolean).join(' '),
        ...(fid?{fid}:{}), ...(mid?{mid}:{}), ...(pids?.length?{pids}:{}),
      };
    });

    const rootNum = id2num.get(DB.currentUserId);
    return { nodes, rootNum, roots: rootNum ? [rootNum] : [] };
  }

  // ===== UI: add relative =====
  function openAdd(){
    const me = DB.currentUserId;
    UI.sheet(`
      <div class="vstack">
        <div class="section-title">Добавить родственника</div>
        <input id="p_name" class="input" placeholder="ФИО">
        <input id="p_dob" class="input" placeholder="Дата рождения (YYYY-MM-DD)">
        <input id="p_city" class="input" placeholder="Город (необязательно)">
        <label class="hstack"><input id="p_dead" type="checkbox"> <span>Покойный (†)</span></label>
        <select id="rel_type" class="select">
          <option value="parent">Мать/Отец</option>
          <option value="child">Сын/Дочь</option>
          <option value="spouse">Супруг/Супруга</option>
          <option value="sibling">Брат/Сестра</option>
        </select>
        <div class="hstack">
          <button class="btn" onclick="Tree._saveAdd('${me}')">Сохранить</button>
          <button class="btn ghost" onclick="UI.close()">Отмена</button>
        </div>
      </div>`);
  }

  async function _saveAdd(me){
    try{
      const name = (document.getElementById('p_name').value||'').trim();
      if (!name) { UI.toast?.('Введите ФИО'); return; }
      const dob  = (document.getElementById('p_dob').value||'').trim() || null;
      const city = (document.getElementById('p_city').value||'').trim() || null;
      const is_deceased = !!document.getElementById('p_dead').checked;
      const type = (document.getElementById('rel_type')||{}).value || 'parent';

      // 1) create person
      const p = await DBAPI.addPerson({ name, dob, city, is_deceased });

      // 2) link relation
      if (type==='parent')      await DBAPI.addRel({ type:'parent', a:p.id, b:me });
      else if (type==='child')  await DBAPI.addRel({ type:'parent', a:me, b:p.id });
      else if (type==='spouse'){ await DBAPI.addRel({ type:'spouse', a:me, b:p.id }); await DBAPI.addRel({ type:'spouse', a:p.id, b:me }); }
      else if (type==='sibling'){ await DBAPI.addRel({ type:'sibling', a:me, b:p.id }); await DBAPI.addRel({ type:'sibling', a:p.id, b:me }); }

      // 3) reload and redraw
      await DBAPI.loadAll();
      UI.close();
      page();
    } catch(e){ console.error(e); UI.toast?.('Не удалось добавить: '+(e?.message||e)); }
  }

  return { page, openAdd, _saveAdd };
})();
