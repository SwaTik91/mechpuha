window.Tree = (function(){
  function page(){
    UI.title('Семейное древо');
    UI.action('<button class="btn ghost" onclick="Tree.openAdd()">Добавить родственника</button>');
    const v = UI.view();
    const me = DB.currentUserId;

    const L = buildLayers(me);
    const order = ['-2','-1','-1u','0','0c','1','2'].filter(k=>L[k] && L[k].length);

    const html = ['<div class="tree">']
      .concat(order.map((lvl, i) => {
        const row = `<div class="gen-row">${L[lvl].map(id => renderPerson(id, relationToMe(me, id))).join('')}</div>`;
        const arrow = (i < order.length - 1) ? `<div class="arrow-row"><div class="arrow"></div></div>` : '';
        return row + arrow;
      }))
      .concat(['<div class="hstack" style="justify-content:center"><button class="btn" onclick="Tree.openAdd()">Добавить родственника</button></div>'])
      .concat(['</div>'])
      .join('');

    v.innerHTML = html;
  }

  /* ---------- Лэйаут слоёв ---------- */
  function buildLayers(root){
    const r = DB.rels;

    const parents = r.filter(x=>x.type==='parent'&&x.b===root).map(x=>x.a);

    const spouse  = r.filter(x=>x.type==='spouse'&&(x.a===root||x.b===root))
                     .map(x=> x.a===root?x.b:x.a);

    // сиблинги: по общим родителям + по явным рёбрам sibling
    const siblingsFromParents = Array.from(new Set(
      parents.flatMap(p=> r.filter(x=>x.type==='parent'&&x.a===p).map(x=>x.b))
    )).filter(id=>id!==root);
    const siblingsFromEdges = [
      ...r.filter(x=>x.type==='sibling'&&x.a===root).map(x=>x.b),
      ...r.filter(x=>x.type==='sibling'&&x.b===root).map(x=>x.a),
    ];
    const siblings = uniq([...siblingsFromParents, ...siblingsFromEdges]).filter(id=>id!==root);

    const grandparents = parents.flatMap(p=> r.filter(x=>x.type==='parent'&&x.b===p).map(x=>x.a));

    // дяди/тёти: сиблинги каждого родителя
    const auntsUncles = parents.flatMap(p=>{
      const gp = r.filter(x=>x.type==='parent'&&x.b===p).map(x=>x.a);
      const kids = gp.flatMap(g=> r.filter(x=>x.type==='parent'&&x.a===g).map(x=>x.b));
      return kids.filter(x=>x!==p);
    });

    // двоюродные: дети тёть/дядь
    const cousins = auntsUncles.flatMap(au=> r.filter(x=>x.type==='child'&&x.a===au).map(x=>x.b));

    const children = r.filter(x=>x.type==='child'&&x.a===root).map(x=>x.b);
    const grandchildren = children.flatMap(c=> r.filter(x=>x.type==='child'&&x.a===c).map(x=>x.b));

    const L={};
    if(grandparents.length)  L['-2']=uniq(grandparents);
    if(parents.length)       L['-1']=uniq(parents);
    if(auntsUncles.length)   L['-1u']=uniq(auntsUncles);
    L['0']=uniq([root,...spouse,...siblings]);
    if(cousins.length)       L['0c']=uniq(cousins);
    if(children.length)      L['1']=uniq(children);
    if(grandchildren.length) L['2']=uniq(grandchildren);
    return L;
  }

  /* ---------- Бейдж отношения ---------- */
  function relationToMe(me, id){
    if(me===id) return "Я";
    const r = DB.rels;

    if(r.some(x=>x.type==='spouse'&&((x.a===me&&x.b===id)||(x.b===me&&x.a===id)))) return "Супруг/а";
    if(r.some(x=>x.type==='parent'&&x.a===id&&x.b===me)) return "Отец/Мать";
    if(r.some(x=>x.type==='child'&&x.a===me&&x.b===id))  return "Сын/Дочь";
    if(r.some(x=>x.type==='sibling'&&((x.a===me&&x.b===id)||(x.b===me&&x.a===id)))) return "Брат/Сестра";

    const parents = r.filter(x=>x.type==='parent'&&x.b===me).map(x=>x.a);
    const gp = parents.flatMap(p=> r.filter(x=>x.type==='parent'&&x.b===p).map(x=>x.a));
    if(gp.includes(id)) return "Дедушка/Бабушка";

    const aunts = parents.flatMap(p=>{
      const gp2 = r.filter(x=>x.type==='parent'&&x.b===p).map(x=>x.a);
      const kids = gp2.flatMap(g=> r.filter(x=>x.type==='parent'&&x.a===g).map(x=>x.b));
      return kids.filter(x=>x!==p);
    });
    if(aunts.includes(id)) return "Дядя/Тётя";

    const cousins = aunts.flatMap(au=> r.filter(x=>x.type==='child'&&x.a===au).map(x=>x.b));
    if(cousins.includes(id)) return "Двоюродный брат/сестра";

    return "";
  }

  /* ---------- Рендер карточки ---------- */
  function renderPerson(id, rel){
    const u = DB.users.find(x=>x.id===id);
    const dob = u.dob ? formatDate(u.dob) : '';
    const dod = u.dod ? (' – '+formatDate(u.dod)) : '';
    return `<div class="person" onclick="Tree.openProfile('${id}')">
      <div class="name">${u.name}</div>
      <div class="sub">${[dob, dod].join('')}</div>
      ${rel? `<div class="rel">${rel}</div>`:''}
    </div>`;
  }

  function openProfile(id){
    const u = DB.users.find(x=>x.id===id);
    const dob = u.dob ? formatDate(u.dob) : '';
    const dod = u.dod ? (' – '+formatDate(u.dod)) : '';
    UI.sheet(`<div class="vstack">
      <div class="section-title">${u.name}</div>
      <div class="small">${[dob,dod].join('')}</div>
      <div class="section-title">Действия</div>
      <div class="hstack">
        <button class="btn" onclick="Tree.openAdd('${id}')">Добавить родственника</button>
        <button class="btn ghost" onclick="UI.close()">Отменить</button>
      </div>
    </div>`);
  }

  /* ---------- Добавление родственника ---------- */
  function openAdd(contextId, selectedType){
    const me = contextId || DB.currentUserId;
    const parents = DB.rels.filter(r=>r.type==='parent' && r.b===DB.currentUserId).map(r=>r.a);
    const parentOptions = parents.map(pid=>{
      const u = DB.users.find(x=>x.id===pid); return `<option value="${pid}">${u?u.name:'Родитель'}</option>`;
    }).join('');

    const auntsUncles = getAuntsUncles(DB.currentUserId);
    const auntOptions = auntsUncles.map(id=>{
      const u = DB.users.find(x=>x.id===id); return `<option value="${id}">${u?u.name:'—'}</option>`;
    }).join('');

    const type = selectedType || 'parent';

    UI.sheet(`<div class="vstack">
      <div class="section-title">Добавить родственника</div>
      <input id="rel_name" class="input" placeholder="ФИО">
      <input id="rel_dob" class="input" placeholder="Дата рождения (YYYY-MM-DD)">
      <select id="rel_type" class="select" onchange="Tree.openAdd('${me}', this.value)">
        <option value="parent" ${type==='parent'?'selected':''}>Мать/Отец</option>
        <option value="child"  ${type==='child'?'selected':''}>Сын/Дочь</option>
        <option value="sibling"${type==='sibling'?'selected':''}>Брат/Сестра</option>
        <option value="spouse" ${type==='spouse'?'selected':''}>Супруг/Супруга</option>
        <option value="auntuncle" ${type==='auntuncle'?'selected':''}>Дядя/Тётя</option>
        <option value="cousin" ${type==='cousin'?'selected':''}>Двоюродный(ая)</option>
      </select>

      ${type==='auntuncle' ? `
        <div class="section-title">Через кого</div>
        <select id="rel_side_parent" class="select">
          ${parentOptions || '<option value="">(Сначала добавьте родителей)</option>'}
        </select>` : ''}

      ${type==='cousin' ? `
        <div class="section-title">Ребёнок кого</div>
        <select id="rel_aunt" class="select">
          ${auntOptions || '<option value="">(Сначала добавьте дядю/тётю)</option>'}
        </select>` : ''}

      <div class="hstack">
        <button class="btn" onclick="Tree._saveAdd('${me}')">Сохранить</button>
        <button class="btn ghost" onclick="UI.close()">Отменить</button>
      </div>
    </div>`);
  }

  function _saveAdd(contextId){
    const name = (document.getElementById('rel_name').value||'').trim();
    const dob  = (document.getElementById('rel_dob').value||'').trim();
    const type = document.getElementById('rel_type').value;
    if(!name){ alert('Введите ФИО'); return; }

    // проверка на существующего пользователя (ФИО + дата рождения)
    const existing = findExisting(name, dob);
    let user;
    if(existing && confirm(`Похоже, ${existing.name} уже есть в базе. Использовать существующего?`)){
      user = existing;
    } else {
      user = { id: 'u'+(DB.users.length+1), name, dob };
      DB.users.push(user);
    }

    const me = contextId || DB.currentUserId;

    if(type==='parent'){
      DB.rels.push({type:'parent', a:user.id, b:me});
    } else if(type==='child'){
      DB.rels.push({type:'child', a:me, b:user.id});
    } else if(type==='sibling'){
      DB.rels.push({type:'sibling', a:me, b:user.id});
      DB.rels.push({type:'sibling', a:user.id, b:me});
    } else if(type==='spouse'){
      DB.rels.push({type:'spouse', a:me, b:user.id});
      DB.rels.push({type:'spouse', a:user.id, b:me});
    } else if(type==='auntuncle'){
      const sideParent = (document.getElementById('rel_side_parent')||{}).value || getDefaultParent(me);
      if(!sideParent){ alert('Сначала добавьте хотя бы одного родителя.'); return; }
      // дядя/тётя — это брат/сестра выбранного родителя
      DB.rels.push({type:'sibling', a:sideParent, b:user.id});
      DB.rels.push({type:'sibling', a:user.id,     b:sideParent});
    } else if(type==='cousin'){
      const auntId = (document.getElementById('rel_aunt')||{}).value;
      if(!auntId){ alert('Выберите дядю/тётю, чьим ребёнком является двоюродный/ая.'); return; }
      DB.rels.push({type:'child', a:auntId, b:user.id});
    }

    UI.close(); page();
  }

  /* ---------- helpers ---------- */
  function getDefaultParent(me){
    const parents = DB.rels.filter(r=>r.type==='parent' && r.b===me).map(r=>r.a);
    return parents[0] || null;
  }
  function getAuntsUncles(me){
    const parents = DB.rels.filter(r=>r.type==='parent' && r.b===me).map(r=>r.a);
    const gpKids = parents.flatMap(p=>{
      const gp = DB.rels.filter(r=>r.type==='parent' && r.b===p).map(r=>r.a);
      return gp.flatMap(g=> DB.rels.filter(r=>r.type==='parent' && r.a===g).map(r=>r.b));
    });
    return uniq(gpKids.filter(x=>!parents.includes(x)));
  }
  function findExisting(name, dob){
    const n = name.toLowerCase().replace(/\s+/g,' ').trim();
    return DB.users.find(u =>
      u.name.toLowerCase().replace(/\s+/g,' ').trim() === n &&
      (u.dob||'') === (dob||'')
    );
  }

  function formatDate(iso){ if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}.${m}.${y}`; }
  function uniq(arr){ return Array.from(new Set(arr)); }

  return { page, openProfile, openAdd, _saveAdd };
})();
