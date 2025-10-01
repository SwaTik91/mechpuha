/* Balkan FamilyTreeJS integration + full add/search/merge logic */
window.Tree = (function () {
  let family = null;               // экземпляр Balkan FamilyTree
  let isBalkanReady = false;       // флаг «скрипт/стили подгружены»
  let selectedUser = null;         // выбранный из подсказок при добавлении

  /* ===================== PUBLIC: PAGE ===================== */
  async function page() {
    // 1) авто-слияние дублей (если кто-то зарегистрировался позже)
    autoMergeDuplicates();

    // 2) UI шапка/кнопки
    UI.title('Семейное древо');
    UI.action('<button class="btn ghost" onclick="Tree.openAdd()">Добавить родственника</button>');

    // 3) Вставляем контейнер
    const v = UI.view();
    v.innerHTML = `
      <div id="treeContainer" style="width:100%;height:72vh;background:#fff;border-radius:12px;border:1px solid #e5e7eb"></div>
    `;

    // 4) Грузим Balkan (если ещё не)
    if (!isBalkanReady) {
      await ensureBalkanLoaded();
      isBalkanReady = true;
    }

    // 5) Старт/перерисовка дерева
    renderFamilyTree();
  }

  /* ===================== LOAD BALKAN ===================== */
  async function ensureBalkanLoaded() {
    // CSS
    if (!document.querySelector('link[data-ftcss]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('data-ftcss', '1');
      // Попробуем 2 варианта путей
      link.href = await probeUrl([
        './familytree.css',
        '/assets/vendor/balkan/familytree.css'
      ]);
      document.head.appendChild(link);
    }
    // JS
    if (!window.FamilyTree) {
      const script = document.createElement('script');
      script.setAttribute('data-ftjs', '1');
      script.async = false;
      script.src = await probeUrl([
        './familytree.js',
        '/assets/vendor/balkan/familytree.js'
      ]);
      await new Promise((res, rej) => {
        script.onload = () => res();
        script.onerror = () => rej(new Error('Не удалось загрузить familytree.js'));
        document.head.appendChild(script);
      });
    }
  }

  async function probeUrl(candidates) {
    for (const url of candidates) {
      try {
        // «Пробный» запрос через <link rel=preload> не всегда доступен.
        // Поэтому просто возвращаем первый — если он 404, onerror у <script>/<link> дернется,
        // а мы попробуем следующий.
        return url;
      } catch(_) { /* noop */ }
    }
    // если что — оставим первый, пусть падение будет явным
    return candidates[0];
  }

  /* ===================== BUILD NODES ===================== */
  function renderFamilyTree() {
    const container = document.getElementById('treeContainer');
    const { nodes } = buildBalkanData(DB);

    // первый запуск
    if (!family) {
      family = new window.FamilyTree(container, {
        // управление
        mouseScrool: window.FamilyTree.action.zoom,
        enableSearch: true,
        // внешний вид
        template: 'olivia', // если в дистрибутиве другая тема — просто поставь её имя
        nodeBinding: {
          field_0: 'name',
          field_1: 'subtitle'
        },
        toolbar: true,
        scaleInitial: window.innerWidth < 768 ? 0.7 : 0.9,
        siblingSeparation: 80,
        levelSeparation: 70,
        subtreeSeparation: 100,
        // клики по узлам — открываем наш «профиль»
        nodeMouseClick: (args) => {
          if (!args || !args.node) return;
          openProfile(args.node.id);
        }
      });
    }

    // подстановка данных
    family.load(nodes);
  }

  function buildBalkanData(DB) {
    // 1) Индексы
    const usersById = new Map(DB.users.map(u => [u.id, u]));
    const parentsByChild = new Map(); // childId -> [parentIds...]
    const partners = new Map();       // id -> Set(partnerIds)

    DB.rels.forEach(r => {
      if (r.type === 'parent') {
        if (!parentsByChild.has(r.b)) parentsByChild.set(r.b, []);
        parentsByChild.get(r.b).push(r.a);
      } else if (r.type === 'spouse') {
        if (!partners.has(r.a)) partners.set(r.a, new Set());
        if (!partners.has(r.b)) partners.set(r.b, new Set());
        partners.get(r.a).add(r.b);
        partners.get(r.b).add(r.a);
      }
    });

    // 2) Ноды для Balkan
    const nodes = DB.users.map(u => {
      const p = parentsByChild.get(u.id) || [];
      // Balkan ждёт pid(«father») + mid(«mother»). Пол нам неизвестен,
      // поэтому просто раскладываем первых двоих как pid/mid — библиотеке норм.
      const pid = p[0] || undefined;
      const mid = p[1] || undefined;
      const pids = partners.has(u.id) ? Array.from(partners.get(u.id)) : undefined;

      const subtitle = [u.dob ? fmtDateRu(u.dob) : '', u.dod ? `– ${fmtDateRu(u.dod)}` : '']
        .join(' ').trim();

      const node = { id: u.id, name: u.name, subtitle };
      if (pid) node.pid = pid;
      if (mid) node.mid = mid;
      if (pids && pids.length) node.pids = pids;
      return node;
    });

    return { nodes };
  }

  function fmtDateRu(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  /* ===================== ADDING / SEARCH / MERGE ===================== */
  function openProfile(id) {
    const u = DB.users.find(x => x.id === id);
    const dob = u.dob ? fmtDateRu(u.dob) : '';
    const dod = u.dod ? (' – ' + fmtDateRu(u.dod)) : '';
    UI.sheet(`<div class="vstack">
      <div class="section-title">${u.name}</div>
      <div class="small">${[dob, dod].join('')}</div>
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

    // родители текущего — пригодится в «дядя/тётя»
    const parents = DB.rels.filter(r => r.type === 'parent' && r.b === DB.currentUserId).map(r => r.a);
    const parentOptions = parents.map(pid => {
      const u = DB.users.find(x => x.id === pid);
      return `<option value="${pid}">${u ? u.name : "Родитель"}</option>`;
    }).join('');

    // список тёть/дядь — пригодится для «двоюродного»
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

      <select id="rel_type" class="select" onchange="Tree.openAdd('${me}', this.value)">
        <option value="parent" ${type === "parent" ? "selected" : ""}>Мать/Отец</option>
        <option value="child" ${type === "child" ? "selected" : ""}>Сын/Дочь</option>
        <option value="spouse" ${type === "spouse" ? "selected" : ""}>Супруг/Супруга</option>
        <option value="sibling" ${type === "sibling" ? "selected" : ""}>Брат/Сестра</option>
        <option value="grandparent" ${type === "grandparent" ? "selected" : ""}>Дедушка/Бабушка</option>
        <option value="grandchild" ${type === "grandchild" ? "selected" : ""}>Внук/Внучка</option>
        <option value="auntuncle" ${type === "auntuncle" ? "selected" : ""}>Дядя/Тётя</option>
        <option value="cousin" ${type === "cousin" ? "selected" : ""}>Двоюродный(ая)</option>
      </select>

      ${type === "auntuncle" ? `
        <div class="section-title">Через кого (мой родитель)</div>
        <select id="rel_side_parent" class="select">
          ${parentOptions || '<option value="">(Сначала добавьте родителей)</option>'}
        </select>` : ''}

      ${type === "cousin" ? `
        <div class="section-title">Ребёнок кого (мои дядя/тётя)</div>
        <select id="rel_aunt" class="select">
          ${auntOptions || '<option value="">(Сначала добавьте дядю/тётю)</option>'}
        </select>` : ''}

      <div class="hstack">
        <button class="btn" onclick="Tree._saveAdd('${me}')">Сохранить</button>
        <button class="btn ghost" onclick="UI.close()">Отменить</button>
      </div>
    </div>`);

    selectedUser = null; // сброс выбора
  }

  function _hint() {
    const q = (document.getElementById('rel_query').value || '').trim().toLowerCase();
    const box = document.getElementById('rel_suggest');
    if (!q) { box.classList.add('hidden'); box.innerHTML = ''; return; }

    const m = q.match(/(.+)\s+(\d{4}-\d{2}-\d{2})$/);
    const namePart = (m ? m[1] : q).replace(/\s+/g, ' ').trim();
    const dobPart  = m ? m[2] : '';

    const results = DB.users.filter(u => {
      const nm = u.name.toLowerCase();
      const nameHit = nm.includes(namePart);
      const dobHit  = !dobPart || (u.dob || '') === dobPart;
      return nameHit && dobHit;
    }).slice(0, 12);

    if (!results.length) {
      box.classList.remove('hidden');
      box.innerHTML = '<div class="opt muted">Ничего не найдено</div>';
      return;
    }

    box.classList.remove('hidden');
    box.innerHTML = results
      .map(u => `<div class="opt" onclick="Tree._pick('${u.id}')">${u.name}${u.dob ? ` • ${u.dob}` : ''}</div>`)
      .join('');
  }

  function _pick(id) {
    const u = DB.users.find(x => x.id === id);
    selectedUser = u;
    document.getElementById('rel_query').value = `${u.name}${u.dob ? ` ${u.dob}` : ''}`;
    const box = document.getElementById('rel_suggest');
    box.classList.add('hidden'); box.innerHTML = '';
  }

  function _saveAdd(contextId) {
    const me = contextId || DB.currentUserId;
    const type = document.getElementById('rel_type').value;

    // выбран существующий?
    let user = selectedUser;

    if (!user) {
      const name = (document.getElementById('rel_name').value || '').trim();
      const dob  = (document.getElementById('rel_dob').value || '').trim();
      if (!name) { alert('Введите ФИО или выберите из списка.'); return; }

      const existing = findExisting(name, dob);
      if (existing && confirm(`Найден ${existing.name}${existing.dob ? ` • ${existing.dob}` : ''}. Связать с ним?`)) {
        user = existing;
      } else {
        user = { id: 'u' + (DB.users.length + 1), name, dob };
        DB.users.push(user);
      }
    }

    // Проставляем связи
    linkByRelation(me, user.id, type);

    // спец-случаи с доп.параметрами
    if (type === 'auntuncle') {
      const sideParent = (document.getElementById('rel_side_parent') || {}).value || getDefaultParent(me);
      if (!sideParent) { alert('Сначала добавьте родителей.'); return; }
      DB.rels.push({ type: 'sibling', a: sideParent, b: user.id });
      DB.rels.push({ type: 'sibling', a: user.id,     b: sideParent });
    }
    if (type === 'cousin') {
      const auntId = (document.getElementById('rel_aunt') || {}).value;
      if (!auntId) { alert('Выберите дядю/тётю, чьим ребёнком является двоюродный/ая.'); return; }
      DB.rels.push({ type: 'child', a: auntId, b: user.id });
    }

    UI.close();
    // перерисовать дерево
    renderFamilyTree();
  }

  /* ====== RELATION WRITER ====== */
  function linkByRelation(me, otherId, type) {
    if (type === 'parent') {
      DB.rels.push({ type: 'parent', a: otherId, b: me });
    } else if (type === 'child') {
      DB.rels.push({ type: 'child', a: me, b: otherId });
    } else if (type === 'spouse') {
      DB.rels.push({ type: 'spouse', a: me, b: otherId });
      DB.rels.push({ type: 'spouse', a: otherId, b: me });
    } else if (type === 'sibling') {
      DB.rels.push({ type: 'sibling', a: me, b: otherId });
      DB.rels.push({ type: 'sibling', a: otherId, b: me });
    } else if (type === 'grandparent') {
      // дед/бабушка: other -> parent -> me
      const parent = getOrCreateParent(me);
      DB.rels.push({ type: 'parent', a: otherId, b: parent });
    } else if (type === 'grandchild') {
      // внук: me -> child -> other
      const child = getOrCreateChild(me);
      DB.rels.push({ type: 'child', a: child, b: otherId });
    }
  }

  function getOrCreateParent(me) {
    const p = DB.rels.find(r => r.type === 'parent' && r.b === me);
    if (p) return p.a;
    const u = { id:'u' + (DB.users.length + 1), name: 'Родитель', dob:'' };
    DB.users.push(u);
    DB.rels.push({ type: 'parent', a: u.id, b: me });
    return u.id;
    // (это вспомогательно — чтобы можно было указать дедушку/бабушку без заполненных родителей)
  }
  function getOrCreateChild(me) {
    const c = DB.rels.find(r => r.type === 'child' && r.a === me);
    if (c) return c.b;
    const u = { id:'u' + (DB.users.length + 1), name: 'Ребёнок', dob:'' };
    DB.users.push(u);
    DB.rels.push({ type: 'child', a: me, b: u.id });
    return u.id;
  }

  /* ====== HELPERS / LAYERS ====== */
  function getDefaultParent(me) {
    const parents = DB.rels.filter(r => r.type === 'parent' && r.b === me).map(r => r.a);
    return parents[0] || null;
  }
  function getAuntsUncles(me) {
    const r = DB.rels;
    const parents = r.filter(x => x.type === 'parent' && x.b === me).map(x => x.a);
    const auByEdges = parents.flatMap(p => [
      ...r.filter(x => x.type === 'sibling' && x.a === p).map(x => x.b),
      ...r.filter(x => x.type === 'sibling' && x.b === p).map(x => x.a),
    ]);
    const auByGP = parents.flatMap(p => {
      const gp = r.filter(x => x.type === 'parent' && x.b === p).map(x => x.a);
      const kids = gp.flatMap(g => r.filter(x => x.type === 'parent' && x.a === g).map(x => x.b));
      return kids.filter(x => x !== p);
    });
    return uniq([...auByEdges, ...auByGP]);
  }
  function findExisting(name, dob) {
    const n = name.toLowerCase().replace(/\s+/g,' ').trim();
    return DB.users.find(u =>
      u.name.toLowerCase().replace(/\s+/g,' ').trim() === n &&
      (u.dob || '') === (dob || '')
    );
  }
  function autoMergeDuplicates() {
    // простое объединение по ключу (ФИО+ДР)
    const key = u => (u.name||'').toLowerCase().replace(/\s+/g,' ').trim() + '|' + (u.dob||'');
    const seen = new Map(); // key -> keepUserId
    const replace = new Map(); // oldId -> keepId

    for (const u of DB.users) {
      const k = key(u);
      if (!seen.has(k)) { seen.set(k, u.id); continue; }
      const keep = seen.get(k);
      if (keep === u.id) continue;
      replace.set(u.id, keep);
    }
    if (!replace.size) return;

    // Переносим ребра
    DB.rels.forEach(r => {
      if (replace.has(r.a)) r.a = replace.get(r.a);
      if (replace.has(r.b)) r.b = replace.get(r.b);
    });
    // Удаляем дубликаты users
    DB.users = DB.users.filter(u => !replace.has(u.id));
    // Чистим дубликаты рёбер
    const seenEdge = new Set();
    DB.rels = DB.rels.filter(r => {
      const k = `${r.type}|${r.a}|${r.b}`;
      if (seenEdge.has(k)) return false;
      seenEdge.add(k);
      return true;
    });
  }
  function uniq(arr){ return Array.from(new Set(arr)); }

  /* ===================== EXPORT ===================== */
  return { page, openAdd, openProfile, _saveAdd, _hint, _pick };
})();
