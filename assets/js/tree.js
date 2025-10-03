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
    // safety guards: library, auth, data
    if (!window.FamilyTree) {
      v.innerHTML = `<div class="card"><div class="section-title">Дерево недоступно</div><div class="muted">Не загружена библиотека FamilyTree.</div></div>`;
      return;
    }
    if (!window.DB || !DB.currentUserId) {
      v.innerHTML = `<div class="card"><div class="section-title">Нет профиля</div><div class="muted">Войдите и заполните профиль.</div></div>`;
      return;
    }
    if (!Array.isArray(DB.users) || DB.users.length === 0) {
      v.innerHTML = `<div class="card"><div class="section-title">Пока пусто</div><div class="muted">Добавьте хотя бы одного человека.</div></div>`;
      return;
    }

    v.innerHTML = `
    <div id="treeContainer"
           style="width:100%;height:76vh;background:#fff;border-radius:12px;border:1px solid #e5e7eb;
                  position:relative;overflow:hidden;touch-action:pan-x pan-y;"
      </div>`;

    if (!isBalkanReady) {
      await ensureBalkanLoaded();
      isBalkanReady = true;
    }

    await renderFamilyTree();
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
        script.onerror = () => rej(new Error('familytree.js не загрузился'));
        document.head.appendChild(script);
      });
    }

    // Нежно допилим шаблон (один раз)
    if (!FamilyTree.templates.shalom) {
      const base = FamilyTree.templates.base;
      FamilyTree.templates.shalom = Object.assign({}, base);

      FamilyTree.templates.shalom.size = [340, 164];

      FamilyTree.templates.shalom.defs = `
        <filter id="ftShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".12"/>
        </filter>
      `;

      // фон
      FamilyTree.templates.shalom.node =
        `<rect x="0" y="0" rx="16" ry="16" width="{w}" height="{h}"
               fill="#ffffff" stroke="#e5e7eb" filter="url(#ftShadow)"></rect>`;

      // даты/город
      FamilyTree.templates.shalom.field_1 =
        `<text ${FamilyTree.attr.width}="300" ${FamilyTree.attr.wrap}="true"
               x="18" y="42"
               style="font-size:12px;fill:#6b7280" text-anchor="start">{val}</text>`;

      // ФИО (верхняя строка)
      FamilyTree.templates.shalom.field_0 =
        `<text ${FamilyTree.attr.width}="300" ${FamilyTree.attr.wrap}="true"
               x="18" y="66"
               style="font-size:18px;font-weight:700;fill:#111827;line-height:1.15"
               text-anchor="start">{val}</text>`;

      // отчество
      FamilyTree.templates.shalom.field_2 =
        `<text ${FamilyTree.attr.width}="300" ${FamilyTree.attr.wrap}="true"
               x="18" y="92"
               style="font-size:13px;fill:#374151;line-height:1.1"
               text-anchor="start">{val}</text>`;

      // бейдж родства (под отчество, внизу слева)
      FamilyTree.templates.shalom.field_3 =
        `<text ${FamilyTree.attr.width}="300" ${FamilyTree.attr.wrap}="true"
               x="18" y="118"
               style="font-size:12px;font-weight:600;fill:#2563eb"
               text-anchor="start">{val}</text>`;

      // настройки линий
      FamilyTree.templates.shalom.link = {
        "stroke": "#e58529",
        "stroke-width": 3,
        "stroke-linecap": "round"
      };


      FamilyTree.templates.shalom.plus =
        `<circle cx="15" cy="15" r="15" fill="#ff7a00"></circle>
         <text x="15" y="20" fill="#fff" text-anchor="middle" font-size="20">+</text>`;
    }


  }

  async function renderFamilyTree() {
    const container = document.getElementById('treeContainer');
    const data = buildBalkanData(DB); // { nodes, num2id, rootNum, roots }

    if (!data.nodes.length) {
      container.innerHTML = `<div class="card" style="margin:12px">Нет данных для отображения</div>`;
      return;
    }

    if (!family) {
    family = new window.FamilyTree(container, {
        template: 'shalom',
        nodeBinding: { field_0: 'nameTop', field_2: 'nameBottom', field_1: 'subtitle', field_3: 'relation' },
        mouseScrool: window.FamilyTree.action.zoom,
        minZoom: .5, maxZoom: 2, scaleInitial: window.innerWidth < 768 ? 0.8 : 1,
        siblingSeparation: 90, levelSeparation: 80, subtreeSeparation: 110,
        nodes: data.nodes,
        // roots убираем полностью, иначе дерево обрезается и показываются только ближайшие
        nodeMouseClick: (args) => { 
          if (args && args.node) openProfile(data.num2id.get(args.node.id)); 
        }
      });
  } else {
      family.load(data.nodes);
      // форсируем перерисовку, чтобы подтянулись новые стили шаблона
      try { family.draw(1); } catch(e) {}
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
    // Filter: only my family component
    const meId = DB && DB.currentUserId;
    let keep = null;
    if (meId) {
      keep = new Set([meId]);
      const adj = new Map();
      for (const r of (DB.rels||[])){
        if(!adj.has(r.a)) adj.set(r.a, new Set());
        if(!adj.has(r.b)) adj.set(r.b, new Set());
        if (r.type==='parent' || r.type==='child' || r.type==='sibling' || r.type==='spouse') {
          adj.get(r.a).add(r.b);
          adj.get(r.b).add(r.a);
        }
      }
      const q=[meId];
      while(q.length){
        const cur=q.shift();
        const ns=adj.get(cur)||new Set();
        for(const n of ns){ if(!keep.has(n)){ keep.add(n); q.push(n);} }
      }
    }
    const usersList = keep ? (DB.users||[]).filter(u=>keep.has(u.id)) : (DB.users||[]);

    // 1) Маппинг строковых id -> числовых id (требование FamilyTreeJS)
    const id2num = new Map(), num2id = new Map();
    let seq = 1;
    for (const u of usersList) {
      if (!id2num.has(u.id)) { id2num.set(u.id, seq); num2id.set(seq, u.id); seq++; }
    }
    // учтем id из rels, если там есть "временные" узлы без записи в users
    for (const r of (DB.rels || [])) {
      if (keep && (!keep.has(r.a) || !keep.has(r.b))) continue;
      if (!id2num.has(r.a)) { id2num.set(r.a, seq); num2id.set(seq, r.a); seq++; }
      if (!id2num.has(r.b)) { id2num.set(r.b, seq); num2id.set(seq, r.b); seq++; }
    }

    // 2) Индексы связей
    const parentsByChild = new Map();   // num(child) -> Set(num(parent))
    const partners       = new Map();   // явные супруги из rels: num -> Set(numPartner)
    const inferredPartners = new Map(); // партнёры по детям (инферим супругов): num -> Set(numPartner)
    const siblings       = [];          // пары брат/сестра

    const setAdd = (map, key, val) => {
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(val);
    };

    for (const r of (DB.rels || [])) {
      const a = id2num.get(r.a);
      const b = id2num.get(r.b);
      if (!a || !b) continue;

      if (r.type === 'parent') {
        // a — родитель b
        setAdd(parentsByChild, b, a);
      } else if (r.type === 'child') {
        // a — ребенок, b — родитель (реже встречается)
        setAdd(parentsByChild, a, b);
      } else if (r.type === 'spouse') {
        setAdd(partners, a, b);
      } else if (r.type === 'sibling') {
        siblings.push([a, b]);
      }
    }

    // 3) Если у брата/сестры нет родителей — наследуем от другого
    for (const [a, b] of siblings) {
      const pa = parentsByChild.get(a);
      const pb = parentsByChild.get(b);
      if (pa && (!pb || pb.size === 0)) parentsByChild.set(b, new Set(pa));
      if (pb && (!pa || pa.size === 0)) parentsByChild.set(a, new Set(pb));
    }

    // 4) Если у ребенка один родитель и у него ровно один супруг — добавим ко-родителя
    for (const [child, set] of parentsByChild.entries()) {
      if (set.size === 1) {
        const [p] = Array.from(set);
        const ps = partners.get(p);
        if (ps && ps.size === 1) {
          const [co] = Array.from(ps);
          if (co !== p) set.add(co);
        }
      }
    }

    // 5) Выбор максимум двух родителей; если >2 — предпочесть супружескую пару, иначе первые два по возрастанию
    const chooseParents = (child) => {
      const s = parentsByChild.get(child);
      if (!s) return [];
      if (s.size <= 2) return Array.from(s);
      const arr = Array.from(s);
      // попробуем найти пару супругов среди родителей
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i], b = arr[j];
          if ((partners.get(a)?.has(b)) || (partners.get(b)?.has(a))) return [a, b];
        }
      }
      return arr.slice(0, 2).sort((x, y) => x - y);
    };

    // 6) Построение узлов FT
    const usersNums = Array.from(id2num.values()).sort((a, b) => a - b);
    const nodes = usersNums.map(id => {
      const uid = num2id.get(id);
      const u = (DB.users || []).find(x => x.id === uid) || { id: uid, name: '—' };

      const [fid, mid] = chooseParents(id);
      const explicitPids = partners.has(id)
        ? Array.from(partners.get(id)).sort((a, b) => a - b)
        : undefined;

      const subtitle = [
        u.dob ? fmt(u.dob) : '',
        u.dod ? `– ${fmt(u.dod)}` : '',
        u.city ? ` • ${u.city}` : ''
      ].join(' ').trim();

      let [nameTop, nameBottom] = splitName(u.name);
      if (u.is_deceased) nameTop = nameTop + ' †';
      const relation = kinLabel(DB, num2id, id2num, u.id, DB.currentUserId);
      const n = { id, nameTop, nameBottom, subtitle, relation };
      if (fid) n.fid = fid;
      if (mid) n.mid = mid;
      if (explicitPids && explicitPids.length) n.pids = explicitPids;
      return n;
    });

    // 7) Применяем инференс супругов: добавим виртуальные pids там, где явных spouse нет
    const byId = new Map(nodes.map(n => [n.id, n]));
    for (const [a, setB] of inferredPartners.entries()) {
      const nodeA = byId.get(a);
      if (!nodeA) continue;
      const explicit = partners.has(a) ? partners.get(a) : new Set();
      const aPids = new Set(nodeA.pids || []);
      for (const b of setB) {
        if (!explicit.has(b)) aPids.add(b);
      }
      nodeA.pids = Array.from(aPids).sort((x, y) => x - y);
    }

    // корень: текущий пользователь
    const rootNum = id2num.get(DB.currentUserId);

    return { nodes, num2id, rootNum, roots: rootNum ? [rootNum] : [] };
  }

  function splitName(fullname = '') {
    const parts = (fullname || '').trim().split(/\s+/);
    if (parts.length === 1) return [parts[0] || 'Без имени', ''];
    if (parts.length === 2) return [`${parts[1]} ${parts[0]}`, '']; // «Фамилия Имя»
    // 3+: фамилию наверх, остальное вниз
    return [`${parts[1]} ${parts[0]}`, parts.slice(2).join(' ')];
  }

  function kinLabel(DB, num2id, id2num, uid, meId) {
    if (!meId || uid === meId) return '';
    const rels = DB.rels || [];

    // прямые роли
    const parentsOfUid = rels.filter(r=>r.type==='parent'&&r.b===uid).map(r=>r.a);
    const childrenOfUid = rels.filter(r=>r.type==='parent'&&r.a===uid).map(r=>r.b);
    if (parentsOfUid.includes(meId)) return 'ребёнок';
    if (childrenOfUid.includes(meId)) return 'родитель';

    // супруг(а)
    const spouses = rels.filter(r=>r.type==='spouse'&&r.a===uid).map(r=>r.b)
      .concat(rels.filter(r=>r.type==='spouse'&&r.b===uid).map(r=>r.a));
    if (spouses.includes(meId)) return 'супруг(а)';

    // брат/сестра
    const parentsOfMe = rels.filter(r=>r.type==='parent'&&r.b===meId).map(r=>r.a);
    const parentsOfUid2 = parentsOfUid;
    if (parentsOfMe.some(p=>parentsOfUid2.includes(p))) return 'брат/сестра';

    // дед/бабушка
    const gps = parentsOfMe.flatMap(p=> rels.filter(r=>r.type==='parent'&&r.b===p).map(r=>r.a));
    if (gps.includes(uid)) return 'дед/бабушка';
    // внук/внучка
    const childrenOfMe = rels.filter(r=>r.type==='parent'&&r.a===meId).map(r=>r.b);
    const gc = childrenOfMe.flatMap(c=> rels.filter(r=>r.type==='parent'&&r.a===c).map(r=>r.b));
    if (gc.includes(uid)) return 'внук/внучка';
    // дядя/тётя
    const siblingsOfParents = parentsOfMe.flatMap(p=>[
      ...rels.filter(r=>r.type==='sibling'&&r.a===p).map(r=>r.b),
      ...rels.filter(r=>r.type==='sibling'&&r.b===p).map(r=>r.a),
    ]);
    if (siblingsOfParents.includes(uid)) return 'дядя/тётя';
    // двоюродный(ая)
    const cousins = siblingsOfParents.flatMap(auntUncle =>
      rels.filter(r=>r.type==='parent'&&r.a===auntUncle).map(r=>r.b)
    );
    if (cousins.includes(uid)) return 'двоюродный(ая)';

    return '';
  }

  function fmt(d) {
    if (!d) return '';
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return d;
    return `${m[3]}.${m[2]}.${m[1]}`;
  }

  function openProfile(id) {
    const u = (DB.users || []).find(x => x.id === id);
    if (!u) return;
    const sub = [u.dob ? fmt(u.dob) : '', u.city || ''].filter(Boolean).join(' • ');
    UI.sheet(`
      <div class="vstack">
        <div class="section-title">Профиль</div>
        <div class="card vstack">
          <div class="section-title">${u.name || '(без имени)'}${u.is_deceased ? ' †' : ''}</div>
          <div class="muted">${sub || '—'}</div>
        </div>
        <div class="hstack">
          <button class="btn" onclick="Tree.openAdd('${id}')">Добавить связь</button>
          <span class="spacer"></span>
          <button class="btn ghost" onclick="UI.close()">Закрыть</button>
        </div>
      </div>
    `);
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
      <label class="hstack"><input id="rel_deceased" type="checkbox"> <span>Покойный (†)</span></label>
      <label class="hstack"><input id="rel_placeholder" type="checkbox" checked> <span>Создать черновик (без аккаунта)</span></label>

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
  }

  function _hint() {
    const q = (document.getElementById('rel_query').value||'').trim().toLowerCase();
    const box = document.getElementById('rel_suggest');
    if (!q) { box.classList.add('hidden'); box.innerHTML=''; return; }

    const m = q.match(/(.+)\s+(\d{4}-\d{2}-\d{2})$/);
    const namePart = (m ? m[1] : q).replace(/\s+/g,' ').trim();
    const dobPart  = m ? m[2] : '';

    const results = (DB.users||[]).filter(u=>{
      const nm = (u.name||'').toLowerCase();
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
    document.getElementById('rel_query').value = u ? `${u.name}${u.dob?` ${u.dob}`:''}` : '';
    const box = document.getElementById('rel_suggest'); box.classList.add('hidden'); box.innerHTML='';
  }

  async function _saveAdd(contextId) {
    const me = contextId || DB.currentUserId;
    const type = (document.getElementById('rel_type') || {}).value;

    try {
      // 1) определить пользователя: выбран из подсказки или создаём нового
      let user = selectedUser;
      if (!user) {
        const name = (document.getElementById('rel_name').value || '').trim();
        const dob  = (document.getElementById('rel_dob').value || '').trim();
        const city = (document.getElementById('rel_city').value || '').trim();
        if (!name) { alert('Введите ФИО или выберите из списка.'); return; }

        // попытаемся найти точное совпадение в Supabase (ФИО + дата)
        let existing = null;
        if (window.DBAPI?.findUserExact) {
          try {
            existing = await DBAPI.findUserExact(name, dob || null);
          } catch (e) {
            console.warn('findUserExact failed', e);
          }
        }

        if (existing) {
          user = existing; // нашли в облаке
        } else {
          // создаём черновик без аккаунта (с пометкой † при необходимости)
          if (!window.DBAPI?.addUserPlaceholder) { alert('База не инициализирована. Проверь подключение Supabase.'); return; }
          const created = await DBAPI.addUserPlaceholder({ name, dob: dob || null, city: city || null, is_deceased: document.getElementById('rel_deceased')?.checked });
          user = created;
          // в локальной копии тоже обновим
          DB.users.push(created);
        }
      } else {
        // если выбран локальный (временный) пользователь вида "u7" — создадим запись в облаке
        if (user.id && /^u\d+$/.test(user.id)) {
          if (!window.DBAPI?.addUser) { alert('База не инициализирована. Проверь подключение Supabase.'); return; }
          const created = await DBAPI.addUser({ name: user.name, dob: user.dob || null, city: user.city || null });
          // заменим id на UUID
          const oldId = user.id;
          user.id = created.id;
          // Подчистим локальные связи на старый id (если вдруг были)
          DB.rels.forEach(r => { if (r.a === oldId) r.a = user.id; if (r.b === oldId) r.b = user.id; });
          // и в локальных users заменим
          const idx = DB.users.findIndex(x => x.id === oldId);
          if (idx >= 0) DB.users[idx] = created;
        }
      }

      // 2) добавить связь в Supabase (включая специальные типы "auntuncle" и "cousin")
      await addRelationSupa(me, user.id, type);

      // 3) локальный линк, перерисовка
      linkByRelation(me, user.id, type);
      await DBAPI.reloadIntoWindowDB().catch(()=>{});
      UI.close();
      renderFamilyTree();
    } catch (e) {
      console.error(e);
      alert('Не удалось добавить родственника: ' + (e?.message || e));
    }
  }

  // ДОБАВЬ ЭТУ ФУНКЦИЮ (рядом с linkByRelation)
  async function addRelationSupa(me, otherId, type) {
    if (!window.DBAPI?.addRel) throw new Error('DBAPI.addRel не найден (Supabase не инициализирован).');

    if (type === 'parent') {
      await DBAPI.addRel({ type: 'parent', a: otherId, b: me });
    } else if (type === 'child') {
      // в таблице храним родителя в поле a, ребёнка в b
      await DBAPI.addRel({ type: 'parent', a: me, b: otherId });
    } else if (type === 'spouse') {
      await DBAPI.addRel({ type: 'spouse', a: me, b: otherId });
      await DBAPI.addRel({ type: 'spouse', a: otherId, b: me });
    } else if (type === 'sibling') {
      await DBAPI.addRel({ type: 'sibling', a: me, b: otherId });
      await DBAPI.addRel({ type: 'sibling', a: otherId, b: me });
    } else if (type === 'auntuncle') {
      // нужно знать "через какого родителя" — берём из выпадашки
      const sideParent = (document.getElementById('rel_side_parent') || {}).value || getDefaultParent(me);
      if (!sideParent) { alert('Сначала добавьте родителей.'); return; }
      await DBAPI.addRel({ type: 'sibling', a: sideParent, b: otherId });
      await DBAPI.addRel({ type: 'sibling', a: otherId,   b: sideParent });
    } else if (type === 'cousin') {
      // двоюродный = ребёнок моего дяди/тёти
      const auntId = (document.getElementById('rel_aunt') || {}).value;
      if (!auntId) { alert('Выберите дядю/тётю'); return; }
      await DBAPI.addRel({ type: 'parent', a: auntId, b: otherId });
    } else {
      console.warn('Неизвестный тип связи:', type);
    }
  }

  function linkByRelation(me, otherId, type) {
    const rel = (a, b, t) => ({ a, b, type: t });

    if (type === 'parent') {
      DB.rels.push(rel(otherId, me, 'parent'));
    } else if (type === 'child') {
      DB.rels.push(rel(me, otherId, 'parent'));
    } else if (type === 'spouse') {
      DB.rels.push(rel(me, otherId, 'spouse'));
      DB.rels.push(rel(otherId, me, 'spouse'));
    } else if (type === 'sibling') {
      DB.rels.push(rel(me, otherId, 'sibling'));
      DB.rels.push(rel(otherId, me, 'sibling'));
    } else if (type === 'auntuncle') {
      const sideParent = (document.getElementById('rel_side_parent') || {}).value || getDefaultParent(me);
      if (sideParent) {
        DB.rels.push(rel(sideParent, otherId, 'sibling'));
        DB.rels.push(rel(otherId, sideParent, 'sibling'));
      }
    } else if (type === 'cousin') {
      const auntId = (document.getElementById('rel_aunt') || {}).value;
      if (auntId) {
        DB.rels.push(rel(auntId, otherId, 'parent'));
      }
    }
  }

  function getOrCreateParent(me) {
    const p = DB.rels.find(r=>r.type==='parent' && r.b===me);
    if (p) return p.a;
    const u = { id:'u'+(DB.users.length+1), name:'Родитель', dob:'' };
    DB.users.push(u); DB.rels.push({ type:'parent', a:u.id, b:me });
    return u.id;
  }
  function getOrCreateChild(me) {
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
    // (оставлено как заглушка: поиск дубликатов внутри локальной DB, если надо)
    return null;
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
