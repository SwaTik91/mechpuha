/* FamilyTreeJS integration: full logic + nicer template */
window.Tree = (function () {
  let family = null;
  let isBalkanReady = false;
  let selectedUser = null;

  async function page() {
    autoMergeDuplicates();

    UI.title('Семейное древо');
    UI.action('<button class="btn ghost" onclick="Tree.openAdd()">Добавить родственника</button>');

    const v = UI.view();
    v.innerHTML = `
      <div id="treeContainer"
           style="width:100%;height:72vh;background:#fff;border-radius:12px;border:1px solid #e5e7eb;
                  position:relative;overflow:hidden;touch-action:pan-y;">
      </div>`;

    if (!isBalkanReady) {
      await ensureBalkanLoaded();
      isBalkanReady = true;
    }
    renderFamilyTree();
  }

  async function ensureBalkanLoaded() {
    // CSS
    if (!document.querySelector('link[data-ftcss]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('data-ftcss', '1');
      link.href = './familytree.css'; // положи рядом с index.html
      document.head.appendChild(link);
    }
    // JS
    if (!window.FamilyTree) {
      const script = document.createElement('script');
      script.async = false;
      script.src = './familytree.js';
      await new Promise((res, rej) => {
        script.onload = res;
        script.onerror = () => rej(new Error('familytree.js not loaded'));
        document.head.appendChild(script);
      });
    }

    // Красивый шаблон "shalom"
    if (!FamilyTree.templates.shalom) {
      const base = FamilyTree.templates.base;
      FamilyTree.templates.shalom = Object.assign({}, base);
      FamilyTree.templates.shalom.size = [280, 120];
      FamilyTree.templates.shalom.defs = `
        <filter id="ftShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".12"/>
        </filter>
      `;
      FamilyTree.templates.shalom.node =
        `<rect x="0" y="0" rx="14" ry="14" width="{w}" height="{h}"
               fill="#ffffff" stroke="#e6e6e6" filter="url(#ftShadow)"></rect>`;
      FamilyTree.templates.shalom.field_0 =
        `<text ${FamilyTree.attr.width}="250" x="16" y="76"
               style="font-size:17px;font-weight:700;fill:#1f2937" text-anchor="start">{val}</text>`;
      FamilyTree.templates.shalom.field_1 =
        `<text ${FamilyTree.attr.width}="250" x="16" y="54"
               style="font-size:12px;fill:#6b7280" text-anchor="start">{val}</text>`;
      FamilyTree.templates.shalom.link =
        `<path stroke="#e9a25b" stroke-width="2.5" fill="none"></path>`;
      FamilyTree.templates.shalom.partnerConnector = { stroke: "#d68d4a", "stroke-width": 2.5 };
      FamilyTree.templates.shalom.plus =
        `<circle cx="15" cy="15" r="15" fill="#ff7a00"></circle><text x="15" y="20" fill="#fff" text-anchor="middle" font-size="20">+</text>`;
    }
  }

function renderFamilyTree() {
  const container = document.getElementById('treeContainer');
  const data = buildBalkanData(DB); // { nodes, num2id, rootNum, roots }

  if (!data.nodes.length) {
    container.innerHTML = `<div class="card" style="margin:12px">Нет данных для отображения</div>`;
    return;
  }

  if (!family) {
    family = new window.FamilyTree(container, {
      template: 'shalom',
      nodeBinding: { field_0: 'name', field_1: 'subtitle' },
      mouseScrool: window.FamilyTree.action.zoom,
      minZoom: .5, maxZoom: 2, scaleInitial: window.innerWidth < 768 ? 0.8 : 1,
      siblingSeparation: 90, levelSeparation: 80, subtreeSeparation: 110,
      nodes: data.nodes,
      roots: data.roots && data.roots.length ? data.roots : undefined, // ⬅️ добавили
      nodeMouseClick: (args) => { if (args && args.node) openProfile(data.num2id.get(args.node.id)); }
    });
  } else {
    family.load(data.nodes);
  }

// показать всё и сфокусироваться на тебе
setTimeout(() => {
  try { family.fit(); } catch(e) {}
  if (data.rootNum) {
    try { family.center(data.rootNum); family.select(data.rootNum); } catch(e) {}
  }
}, 0);
}


/* ----- Адаптер: строки -> числа, связи -> fid/mid/pids (минимально и устойчиво) ----- */
function buildBalkanData(DB) {
  // 1) строки id -> числа
  const id2num = new Map(), num2id = new Map(); let seq = 1;
  for (const u of DB.users) { if (!id2num.has(u.id)) { id2num.set(u.id, seq); num2id.set(seq, u.id); seq++; } }
  for (const r of DB.rels) {
    if (!id2num.has(r.a)) { id2num.set(r.a, seq); num2id.set(seq, r.a); seq++; }
    if (!id2num.has(r.b)) { id2num.set(r.b, seq); num2id.set(seq, r.b); seq++; }
  }

  // 2) индексы
  const parentsByChild = new Map();   // num(child) -> Set(num(parent))
  const partners = new Map();         // num -> Set(numPartner)
  const siblings = [];                // [ [a,b], ... ]
  const setAdd = (m, k, v) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(v); };

  for (const r of DB.rels) {
    const a = id2num.get(r.a), b = id2num.get(r.b);
    if (r.type === 'parent') setAdd(parentsByChild, b, a);
    else if (r.type === 'child') setAdd(parentsByChild, b, a);         // трактуем как parent->child
    else if (r.type === 'spouse') {
      if (!partners.has(a)) partners.set(a, new Set());
      if (!partners.has(b)) partners.set(b, new Set());
      partners.get(a).add(b); partners.get(b).add(a);
    } else if (r.type === 'sibling') siblings.push([a, b]);
  }

  // 3) если у брата/сестры нет родителей — наследуем от другого
  for (const [a, b] of siblings) {
    const pa = parentsByChild.get(a), pb = parentsByChild.get(b);
    if (pa && (!pb || pb.size === 0)) parentsByChild.set(b, new Set(pa));
    if (pb && (!pa || pa.size === 0)) parentsByChild.set(a, new Set(pb));
  }

  // 4) если у ребёнка один родитель и у него ровно один супруг — добавим ко-родителя
  for (const [child, set] of parentsByChild.entries()) {
    if (set.size === 1) {
      const [p] = Array.from(set);
      const ps = partners.get(p);
      if (ps && ps.size === 1) { const [co] = Array.from(ps); if (co !== p) set.add(co); }
    }
  }

  // 5) максимум два родителя; если >2 — предпочесть супружескую пару, иначе первые два по возрастанию
  const chooseParents = (child) => {
    const s = parentsByChild.get(child);
    if (!s) return [];
    if (s.size <= 2) return Array.from(s);
    const arr = Array.from(s);
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++)
        if (partners.has(arr[i]) && partners.get(arr[i]).has(arr[j])) return [arr[i], arr[j]];
    return arr.sort((x, y) => x - y).slice(0, 2);
  };

  // 6) собрать ноды (ВАЖНО: fid/mid)
  const nodes = DB.users.map(u => {
    const id = id2num.get(u.id);
    const ps = chooseParents(id).sort((a, b) => a - b);
    const fid = ps[0], mid = ps[1];
    const pids = partners.has(id) ? Array.from(partners.get(id)).sort((a, b) => a - b) : undefined;

    const subtitle = [
      u.dob ? fmt(u.dob) : '',
      u.dod ? `– ${fmt(u.dod)}` : '',
      u.city ? ` • ${u.city}` : ''
    ].join(' ').trim();

    const n = { id, name: u.name, subtitle };
    if (fid) n.fid = fid;
    if (mid) n.mid = mid;
    if (pids && pids.length) n.pids = pids;
    return n;
  });

  const rootNum = id2num.get(DB.currentUserId);
  return { nodes, num2id, rootNum };
}



  function fmt(iso){ if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}.${m}.${y}`; }


  /* ======== UI: профиль / добавление ======== */
  function openProfile(id) {
    const u = DB.users.find(x => x.id === id);
    const dob = u.dob ? fmt(u.dob) : '';
    const dod = u.dod ? (' – ' + fmt(u.dod)) : '';
    UI.sheet(`<div class="vstack">
      <div class="section-title">${u.name}</div>
      <div class="small">${[dob,dod,u.city?` • ${u.city}`:''].join('')}</div>
      <div class="section-title">Действия</div>
      <div class="hstack">
        <button class="btn" onclick="Tree.openAdd('${id}')">Добавить родственника</button>
        <button class="btn ghost" onclick="UI.close()">Отменить</button>
      </div>
    </div>`);
  }

  function openAdd(contextId, selectedType) {
    const me = contextId || DB.currentUserId;
    const type = selectedType || 'parent';

    const parents = DB.rels.filter(r => r.type==='parent' && r.b===DB.currentUserId).map(r=>r.a);
    const parentOptions = parents.map(pid => {
      const u = DB.users.find(x => x.id === pid);
      return `<option value="${pid}">${u ? u.name : "Родитель"}</option>`;
    }).join('');
    const auntsUncles = getAuntsUncles(DB.currentUserId);
    const auntOptions = auntsUncles.map(id => {
      const u = DB.users.find(x => x.id === id);
      return `<option value="${id}">${u ? u.name : "—"}</option>`;
    }).join('');

    UI.sheet(`<div class="vstack">
      <div class="section-title">Добавить родственника</div>
      <div class="typeahead">
        <input id="rel_query" class="input" placeholder="Поиск: ФИО или ФИО + дата (YYYY-MM-DD)" oninput="Tree._hint()">
        <div id="rel_suggest" class="suggest hidden"></div>
      </div>
      <div class="small muted">…или создать нового</div>
      <input id="rel_name" class="input" placeholder="ФИО">
      <input id="rel_dob" class="input" placeholder="Дата рождения (YYYY-MM-DD)">
      <input id="rel_city" class="input" placeholder="Город (необязательно)">

      <select id="rel_type" class="select" onchange="Tree.openAdd('${me}', this.value)">
        <option value="parent" ${type==='parent'?'selected':''}>Мать/Отец</option>
        <option value="child" ${type==='child'?'selected':''}>Сын/Дочь</option>
        <option value="spouse" ${type==='spouse'?'selected':''}>Супруг/Супруга</option>
        <option value="sibling" ${type==='sibling'?'selected':''}>Брат/Сестра</option>
        <option value="grandparent" ${type==='grandparent'?'selected':''}>Дедушка/Бабушка</option>
        <option value="grandchild" ${type==='grandchild'?'selected':''}>Внук/Внучка</option>
        <option value="auntuncle" ${type==='auntuncle'?'selected':''}>Дядя/Тётя</option>
        <option value="cousin" ${type==='cousin'?'selected':''}>Двоюродный(ая)</option>
      </select>

      ${type==='auntuncle' ? `
        <div class="section-title">Через кого (мой родитель)</div>
        <select id="rel_side_parent" class="select">
          ${parentOptions || '<option value="">(Сначала добавьте родителей)</option>'}
        </select>` : ''}

      ${type==='cousin' ? `
        <div class="section-title">Ребёнок кого (мои дядя/тётя)</div>
        <select id="rel_aunt" class="select">
          ${auntOptions || '<option value="">(Сначала добавьте дядю/тётю)</option>'}
        </select>` : ''}

      <div class="hstack">
        <button class="btn" onclick="Tree._saveAdd('${me}')">Сохранить</button>
        <button class="btn ghost" onclick="UI.close()">Отменить</button>
      </div>
    </div>`);

    selectedUser = null;
  }

  function _hint() {
    const q = (document.getElementById('rel_query').value||'').trim().toLowerCase();
    const box = document.getElementById('rel_suggest');
    if (!q) { box.classList.add('hidden'); box.innerHTML=''; return; }

    const m = q.match(/(.+)\s+(\d{4}-\d{2}-\d{2})$/);
    const namePart = (m?m[1]:q).replace(/\s+/g,' ').trim();
    const dobPart  = m?m[2]:'';

    const results = DB.users.filter(u=>{
      const nm = u.name.toLowerCase();
      const nameHit = nm.includes(namePart);
      const dobHit  = !dobPart || (u.dob||'')===dobPart;
      return nameHit && dobHit;
    }).slice(0,12);

    box.classList.remove('hidden');
    box.innerHTML = results.length
      ? results.map(u=>`<div class="opt" onclick="Tree._pick('${u.id}')">${u.name}${u.dob?` • ${u.dob}`:''}</div>`).join('')
      : '<div class="opt muted">Ничего не найдено</div>';
  }

  function _pick(id) {
    const u = DB.users.find(x=>x.id===id);
    selectedUser = u;
    document.getElementById('rel_query').value = `${u.name}${u.dob?` ${u.dob}`:''}`;
    const box = document.getElementById('rel_suggest'); box.classList.add('hidden'); box.innerHTML='';
  }

  function _saveAdd(contextId) {
    const me = contextId || DB.currentUserId;
    const type = document.getElementById('rel_type').value;

    let user = selectedUser;
    if (!user) {
      const name = (document.getElementById('rel_name').value||'').trim();
      const dob  = (document.getElementById('rel_dob').value||'').trim();
      const city = (document.getElementById('rel_city').value||'').trim();
      if (!name) { alert('Введите ФИО или выберите из списка.'); return; }
      const existing = findExisting(name, dob);
      user = existing && confirm(`Найден ${existing.name}${existing.dob?` • ${existing.dob}`:''}. Связать?`)
        ? existing
        : ({ id: 'u'+(DB.users.length+1), name, dob, city });
      if (!existing) DB.users.push(user);
    }

    linkByRelation(me, user.id, type);

    if (type==='auntuncle') {
      const sideParent = (document.getElementById('rel_side_parent')||{}).value || getDefaultParent(me);
      if (!sideParent) { alert('Сначала добавьте родителей.'); return; }
      DB.rels.push({ type:'sibling', a:sideParent, b:user.id });
      DB.rels.push({ type:'sibling', a:user.id,     b:sideParent });
    }
    if (type==='cousin') {
      const auntId = (document.getElementById('rel_aunt')||{}).value;
      if (!auntId) { alert('Выберите дядю/тётю'); return; }
      DB.rels.push({ type:'child', a:auntId, b:user.id });
    }

    UI.close();
    renderFamilyTree();
  }

  function linkByRelation(me, otherId, type) {
    if (type==='parent')      DB.rels.push({ type:'parent', a:otherId, b:me });
    else if (type==='child')  DB.rels.push({ type:'child',  a:me,      b:otherId });
    else if (type==='spouse'){ DB.rels.push({ type:'spouse', a:me, b:otherId }); DB.rels.push({ type:'spouse', a:otherId, b:me }); }
    else if (type==='sibling'){DB.rels.push({ type:'sibling', a:me, b:otherId }); DB.rels.push({ type:'sibling', a:otherId, b:me }); }
    else if (type==='grandparent'){ const p=getOrCreateParent(me); DB.rels.push({ type:'parent', a:otherId, b:p }); }
    else if (type==='grandchild'){ const c=getOrCreateChild(me);   DB.rels.push({ type:'child',  a:c,      b:otherId }); }
  }

  function getOrCreateParent(me){
    const p = DB.rels.find(r=>r.type==='parent' && r.b===me);
    if (p) return p.a;
    const u = { id:'u'+(DB.users.length+1), name:'Родитель', dob:'' };
    DB.users.push(u); DB.rels.push({ type:'parent', a:u.id, b:me });
    return u.id;
  }
  function getOrCreateChild(me){
    const c = DB.rels.find(r=>r.type==='child' && r.a===me);
    if (c) return c.b;
    const u = { id:'u'+(DB.users.length+1), name:'Ребёнок', dob:'' };
    DB.users.push(u); DB.rels.push({ type:'child', a:me, b:u.id });
    return u.id;
  }

  function getDefaultParent(me){
    const parents = DB.rels.filter(r=>r.type==='parent' && r.b===me).map(r=>r.a);
    return parents[0] || null;
  }
  function getAuntsUncles(me){
    const r = DB.rels;
    const parents = r.filter(x=>x.type==='parent' && x.b===me).map(x=>x.a);
    const auByEdges = parents.flatMap(p=>[
      ...r.filter(x=>x.type==='sibling' && x.a===p).map(x=>x.b),
      ...r.filter(x=>x.type==='sibling' && x.b===p).map(x=>x.a),
    ]);
    const auByGP = parents.flatMap(p=>{
      const gp = r.filter(x=>x.type==='parent' && x.b===p).map(x=>x.a);
      const kids = gp.flatMap(g=> r.filter(x=>x.type==='parent' && x.a===g).map(x=>x.b));
      return kids.filter(x=>x!==p);
    });
    return uniq([...auByEdges, ...auByGP]);
  }

  function findExisting(name, dob){
    const n = name.toLowerCase().replace(/\s+/g,' ').trim();
    return DB.users.find(u =>
      u.name.toLowerCase().replace(/\s+/g,' ').trim() === n &&
      (u.dob||'') === (dob||'')
    );
  }
  function autoMergeDuplicates(){
    const key = u => (u.name||'').toLowerCase().replace(/\s+/g,' ').trim() + '|' + (u.dob||'');
    const seen = new Map(); const replace = new Map();
    for (const u of DB.users){ const k=key(u); if(!seen.has(k)) seen.set(k,u.id); else if(seen.get(k)!==u.id) replace.set(u.id, seen.get(k)); }
    if (!replace.size) return;
    DB.rels.forEach(r=>{ if(replace.has(r.a)) r.a=replace.get(r.a); if(replace.has(r.b)) r.b=replace.get(r.b); });
    DB.users = DB.users.filter(u=>!replace.has(u.id));
    const e = new Set(); DB.rels = DB.rels.filter(r=>{ const k=`${r.type}|${r.a}|${r.b}`; if(e.has(k)) return false; e.add(k); return true; });
  }
  function uniq(arr){ return Array.from(new Set(arr)); }

  return { page, openAdd, openProfile, _saveAdd, _hint, _pick };
})();
