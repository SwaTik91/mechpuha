/* assets/js/tree.js
 * Семейное древо: полноценная версия с безопасными гвардами и UI добавления родственников
 * Требует: window.UI, window.DB, window.DBAPI, FamilyTree (подключён раньше), familytree.css
 */
window.Tree = (function () {
  // --- состояние модуля ---
  let selectedUser = null;     // выбранный в подсказке пользователь
  let ft = null;               // инстанс FamilyTree
  let isTemplateReady = false; // один раз настраиваем шаблон

  // =========================
  // ПУБЛИЧНАЯ ТОЧКА ВХОДА
  // =========================
  async function page() {
    UI.title('Семейное древо');
    UI.action('<button class="btn ghost" onclick="Tree.openAdd()">Добавить родственника</button>');
    const v = UI.view();

    // --- ГВАРДЫ ---
    // 1) Проверка наличия FamilyTree
    if (!window.FamilyTree) {
      v.innerHTML = `<div class="card">
        <div class="section-title">Дерево недоступно</div>
        <div class="muted">Библиотека FamilyTree не загружена. Проверьте подключение к интернету или CDN.</div>
      </div>`;
      return;
    }

    // 2) Проверка авторизации
    const meId = window.DB?.currentUserId;
    if (!meId) {
      v.innerHTML = `<div class="card">
        <div class="section-title">Нет профиля</div>
        <div class="muted">Войдите и заполните профиль, чтобы увидеть древо.</div>
      </div>`;
      return;
    }

    // 3) Проверка наличия данных
    if (!Array.isArray(DB.users) || DB.users.length === 0) {
      v.innerHTML = `<div class="card">
        <div class="section-title">Пока пусто</div>
        <div class="muted">Добавьте хотя бы одного человека в разделе «Профиль» и вернитесь.</div>
      </div>`;
      return;
    }

    // 4) Автослияние дублей (мягкое)
    autoMergeDuplicates();

    // 5) Разметка контейнера
    v.innerHTML = `
      <div id="treeContainer"
           style="width:100%;height:76vh;background:#fff;border-radius:12px;border:1px solid #e5e7eb;
                  position:relative;overflow:hidden;touch-action:pan-x pan-y;">
      </div>`;

    // 6) Рендер FT с защитой
    try {
      // настройка шаблона (однократно)
      setupTemplateOnce();

      // Построение узлов FT
      const meId = DB.currentUserId;
      const { nodes } = buildFamilyTreeData(DB, meId);


      // Инициализация FamilyTree
      const el = document.getElementById('treeContainer');
      ft?.destroy?.(); // на всякий — если уже был инстанс
      ft = new FamilyTree(el, {
        template: 'shalom',
        mode: 'tree',
        mouseScrool: FamilyTree.none,
        enableSearch: true,
        toolbar: false,
        siblingSeparation: 30,
        levelSeparation: 50,
        scaleInitial: FamilyTree.match.boundary, // вместить в экран
        nodeBinding: {
          field_0: 'name',
          field_1: 'dob',
          field_2: 'city'
        }
      });

      // Клики по узлам
      ft.onNodeClick(function (args) {
        const id = args?.id;
        if (!id) return;
        const u = DB.users.find(x => x.id === id);
        if (!u) return;
        openCard(u);
      });

      // Загрузка узлов
      ft.load(nodes);
    } catch (err) {
      console.error('FamilyTree init failed', err);
      v.innerHTML = `<div class="card">
        <div class="section-title">Ошибка при инициализации</div>
        <div class="muted">Проверьте данные и подключение. Детали в консоли.</div>
      </div>`;
    }
  }

  // =========================
  // ШАБЛОН ОТРИСОВКИ
  // =========================
  function setupTemplateOnce() {
    if (isTemplateReady) return;
    isTemplateReady = true;

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

    // вспомогательные поля
    FamilyTree.templates.shalom.field_1 =
      `<text ${FamilyTree.attr.width}="300" ${FamilyTree.attr.wrap}="true"
             x="18" y="42"
             style="font-size:12px;fill:#6b7280" text-anchor="start">{val}</text>`;

    FamilyTree.templates.shalom.field_0 =
      `<text ${FamilyTree.attr.width}="300" ${FamilyTree.attr.wrap}="true"
             x="18" y="66"
             style="font-size:18px;font-weight:700;fill:#111827;line-height:1.15"
             text-anchor="start">{val}</text>`;

    FamilyTree.templates.shalom.field_2 =
      `<text ${FamilyTree.attr.width}="300" ${FamilyTree.attr.wrap}="true"
             x="18" y="90"
             style="font-size:12px;fill:#6b7280" text-anchor="start">{val}</text>`;
  }

  // =========================
  // СБОР ДАННЫХ ДЛЯ FT
  // =========================
function buildFamilyTreeData(DB, meId) {
  const allUsers = DB.users || [];
  const rels = DB.rels || [];

  // строим неориентированный граф соседей по связям
  const adj = new Map(); // id -> Set(neighbors)
  function link(a,b){
    if(!a||!b) return;
    if(!adj.has(a)) adj.set(a,new Set());
    if(!adj.has(b)) adj.set(b,new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  }

  // parent/child/sibling/spouse считаем связями «родства» в обе стороны
  for (const r of rels) {
    if (r.type === 'parent' || r.type === 'child' || r.type === 'sibling' || r.type === 'spouse') {
      link(r.a, r.b);
    }
  }

  // BFS/DFS от meId → собираем только «мою компоненту»
  const keep = new Set();
  if (meId) {
    const q = [meId];
    keep.add(meId);
    while (q.length) {
      const cur = q.shift();
      const nexts = adj.get(cur) || new Set();
      for (const n of nexts) {
        if (!keep.has(n)) { keep.add(n); q.push(n); }
      }
    }
  }

  // фильтруем пользователей: только те, кто достижим от меня
  const users = meId ? allUsers.filter(u => keep.has(u.id)) : allUsers;

  // супруги для FamilyTree (pids)
  const spouses = {};
  rels.filter(r => r.type === 'spouse' && keep.has(r.a) && keep.has(r.b)).forEach(r => {
    (spouses[r.a] = spouses[r.a] || []).push(r.b);
    (spouses[r.b] = spouses[r.b] || []).push(r.a);
  });

  const nodes = users.map(u => {
    const n = {
      id: u.id,
      name: u.name || '(без имени)',
      dob: u.dob || '',
      city: u.city || ''
    };
    if (spouses[u.id]?.length) n.pids = spouses[u.id];
    return n;
  });

  return { nodes };
}


  // =========================
  // UI «карточка» пользователя
  // =========================
  function openCard(user) {
    const name = user.name || '(без имени)';
    const sub = [user.dob, user.city].filter(Boolean).join(' • ');
    UI.sheet(`
      <div class="vstack">
        <div class="section-title">Профиль</div>
        <div class="card vstack">
          <div class="section-title">${name}</div>
          <div class="muted">${sub || '—'}</div>
        </div>

        <div class="hstack">
          <button class="btn" onclick="Tree.openAdd('${user.id}')">Добавить связь</button>
          <span class="spacer"></span>
          <button class="btn ghost" onclick="UI.close()">Закрыть</button>
        </div>
      </div>
    `);
  }

  // =========================
  // АВТОСЛИЯНИЕ ДУБЛЕЙ
  // =========================
  function autoMergeDuplicates() {
    if (!Array.isArray(DB.users) || DB.users.length < 2) return;
    const seen = new Map(); // key -> id
    const toRemoveIds = [];

    for (const u of DB.users) {
      const key = `${(u.name || '').trim().toLowerCase()}|${u.dob || ''}`;
      if (!key.trim()) continue;
      if (seen.has(key)) {
        const keepId = seen.get(key);
        const removeId = u.id;
        // перенесём связи removeId -> keepId
        DB.rels.forEach(r => {
          if (r.a === removeId) r.a = keepId;
          if (r.b === removeId) r.b = keepId;
        });
        toRemoveIds.push(removeId);
      } else {
        seen.set(key, u.id);
      }
    }

    if (toRemoveIds.length) {
      DB.users = DB.users.filter(u => !toRemoveIds.includes(u.id));
    }
  }

  // =========================
  // UI «Добавить родственника»
  // =========================
  function openAdd(contextId) {
    const me = contextId || DB.currentUserId;
    const myParents = listParentsOf(me);
    const auntsUncles = listAuntsUncles(me);

    const parentOptions = myParents.map(p => `<option value="${p.id}">${p.name}${p.dob ? ` • ${p.dob}` : ''}</option>`).join('');
    const auntOptions = auntsUncles.map(p => `<option value="${p.id}">${p.name}${p.dob ? ` • ${p.dob}` : ''}</option>`).join('');

    UI.sheet(`
      <div class="vstack">
        <div class="section-title">Добавить родственника</div>

        <div class="typeahead">
          <input id="rel_query" class="input" placeholder="Имя Фамилия [ГГГГ-ММ-ДД]" oninput="Tree._hint()">
          <div id="rel_suggest" class="suggest hidden"></div>
        </div>

        <div class="section-title">Тип связи</div>
        <select id="rel_type" class="select" onchange="Tree._renderTypeFields()">
          <option value="spouse">Супруг(а)</option>
          <option value="parent">Родитель</option>
          <option value="child">Ребёнок</option>
          <option value="sibling">Брат/Сестра</option>
          <option value="auntuncle">Дядя/Тётя</option>
          <option value="cousin">Двоюродный(ая)</option>
        </select>

        <div id="rel_type_fields" class="vstack"></div>

        <div class="hstack">
          <button class="btn" onclick="Tree._saveAdd('${me}')">Сохранить</button>
          <button class="btn ghost" onclick="UI.close()">Отменить</button>
        </div>
      </div>
    `);

    // Рендерим поля под выбранный тип (по умолчанию spouse)
    _renderTypeFields();
    selectedUser = null;
  }

  // поля под тип связи
  function _renderTypeFields() {
    const type = (document.getElementById('rel_type') || {}).value || 'spouse';
    const me = DB.currentUserId;
    const myParents = listParentsOf(me);
    const auntsUncles = listAuntsUncles(me);

    const parentOptions = myParents.map(p => `<option value="${p.id}">${p.name}${p.dob ? ` • ${p.dob}` : ''}</option>`).join('');
    const auntOptions = auntsUncles.map(p => `<option value="${p.id}">${p.name}${p.dob ? ` • ${p.dob}` : ''}</option>`).join('');

    const box = document.getElementById('rel_type_fields');
    box.innerHTML = `
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
    `;
  }

  // подсказки в поле поиска человека
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

  // выбор из подсказки
  function _pick(id) {
    const u = DB.users.find(x=>x.id===id);
    selectedUser = u || null;
    document.getElementById('rel_query').value = u ? `${u.name}${u.dob?` ${u.dob}`:''}` : '';
    const box = document.getElementById('rel_suggest'); box.classList.add('hidden'); box.innerHTML='';
  }

  // СОХРАНЕНИЕ новой связи (+создание пользователя при необходимости)
  async function _saveAdd(contextId) {
    const me = contextId || DB.currentUserId;
    const type = (document.getElementById('rel_type') || {}).value;

    // 1) получить/создать второго участника
    let other = selectedUser;
    if (!other) {
      const raw = (document.getElementById('rel_query') || {}).value || '';
      const { name, dob } = parseNameDob(raw);
      if (!name) { alert('Укажите имя/фамилию родственника'); return; }

      // пробуем найти точное совпадение
      try {
        const exact = await DBAPI.findUserExact(name, dob);
        if (exact) {
          other = exact;
        } else {
          // создаём нового
          other = await DBAPI.addUser({ name, dob });
          // обновляем локальный кеш
          await DBAPI.reloadIntoWindowDB();
        }
      } catch (e) {
        console.warn('find/create user failed', e);
        alert('Не удалось создать профиль родственника'); return;
      }
    }

    // 2) пишем связь(и)
    try {
      if (type === 'spouse') {
        await DBAPI.addRel({ type:'spouse', a: me, b: other.id });
      } else if (type === 'parent') {
        await DBAPI.addRel({ type:'parent', a: other.id, b: me }); // other — родитель me
      } else if (type === 'child') {
        await DBAPI.addRel({ type:'parent', a: me, b: other.id }); // me — родитель other
      } else if (type === 'sibling') {
        // брат/сестра — через общих родителей: если они есть, система покажет корректно; здесь просто отметим как sibling (опционально)
        await DBAPI.addRel({ type:'sibling', a: me, b: other.id });
      } else if (type === 'auntuncle') {
        // Дядя/тётя — брат/сестра моего родителя (нужен rel_side_parent)
        const side = (document.getElementById('rel_side_parent') || {}).value;
        if (!side) { alert('Выберите: через какого из ваших родителей эта связь'); return; }
        // отметим как sibling между other и выбранным родителем
        await DBAPI.addRel({ type:'sibling', a: side, b: other.id });
      } else if (type === 'cousin') {
        // Двоюродный(ая) — ребёнок моего дяди/тёти
        const aunt = (document.getElementById('rel_aunt') || {}).value;
        if (!aunt) { alert('Выберите: ребёнок какого дяди/тёти'); return; }
        await DBAPI.addRel({ type:'parent', a: aunt, b: other.id }); // aunt -> parent of other
      }

      // 3) перезагрузка данных и перерисовка
      await DBAPI.reloadIntoWindowDB();
      UI.close();
      page();
    } catch (e) {
      console.error('add relation failed', e);
      alert('Не удалось сохранить связь: ' + (e?.message || e));
    }
  }

  // =========================
  // ВСПОМОГАТЕЛЬНЫЕ
  // =========================
  function parseNameDob(raw) {
    const s = (raw || '').trim();
    const m = s.match(/(.+?)\s+(\d{4}-\d{2}-\d{2})$/);
    if (m) return { name: m[1].replace(/\s+/g, ' ').trim(), dob: m[2] };
    return { name: s.replace(/\s+/g, ' ').trim(), dob: '' };
  }

  function listParentsOf(id) {
    if (!id) return [];
    const ps = [];
    (DB.rels || []).forEach(r => {
      // parent: a -> parent, b -> child
      if (r.type === 'parent' && r.b === id) {
        const u = (DB.users || []).find(x => x.id === r.a);
        if (u) ps.push(u);
      }
      // child: a -> child, b -> parent
      if (r.type === 'child' && r.a === id) {
        const u = (DB.users || []).find(x => x.id === r.b);
        if (u) ps.push(u);
      }
    });
    // уникальные
    const seen = new Set(); const out = [];
    for (const u of ps) { if (!seen.has(u.id)) { seen.add(u.id); out.push(u); } }
    return out;
  }

  function listChildrenOf(id) {
    if (!id) return [];
    const cs = [];
    (DB.rels || []).forEach(r => {
      if (r.type === 'parent' && r.a === id) {
        const u = (DB.users || []).find(x => x.id === r.b);
        if (u) cs.push(u);
      }
      if (r.type === 'child' && r.b === id) {
        const u = (DB.users || []).find(x => x.id === r.a);
        if (u) cs.push(u);
      }
    });
    const seen = new Set(); const out = [];
    for (const u of cs) { if (!seen.has(u.id)) { seen.add(u.id); out.push(u); } }
    return out;
  }

  function listSiblingsOf(id) {
    if (!id) return [];
    const parents = listParentsOf(id).map(p => p.id);
    if (!parents.length) return [];
    const sibIds = new Set();
    // все дети моих родителей
    parents.forEach(pid => {
      listChildrenOf(pid).forEach(ch => {
        if (ch.id !== id) sibIds.add(ch.id);
      });
    });
    // плюс явные связи sibling
    (DB.rels || []).forEach(r => {
      if (r.type === 'sibling') {
        if (r.a === id) sibIds.add(r.b);
        if (r.b === id) sibIds.add(r.a);
      }
    });
    return (DB.users || []).filter(u => sibIds.has(u.id));
  }

  function listAuntsUncles(id) {
    // Дяди/тёти — братья/сестры моих родителей
    const out = [];
    listParentsOf(id).forEach(p => {
      listSiblingsOf(p.id).forEach(a => out.push(a));
    });
    const seen = new Set(); const uniq = [];
    for (const u of out) if (!seen.has(u.id)) { seen.add(u.id); uniq.push(u); }
    return uniq;
  }

  // =========================
  // ПУБЛИЧНЫЙ API
  // =========================
  return {
    page,
    openAdd,
    _hint,
    _pick,
    _saveAdd,
    _renderTypeFields
  };
})();
