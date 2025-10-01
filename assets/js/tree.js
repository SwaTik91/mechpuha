
window.Tree = (function(){
  function page(){
    UI.title('Семейное древо');
    UI.action('<button class="btn ghost" onclick="Tree.openAdd()">Добавить родственника</button>');
    const v = UI.view();
    const me = DB.currentUserId;
    const layers = buildLayers(me);
    const order = Object.keys(layers).sort((a,b)=>{
      const na = a.replace('u','').replace('c',''); const nb = b.replace('u','').replace('c','');
      return parseInt(na)-parseInt(nb);
    });
    const html = order.map((lvl,i)=>{
      const row = layers[lvl].map(id=>renderPerson(id, relationToMe(me,id))).join('');
      const arrows = (i < order.length-1) ? '<div class="arrow-down"></div>' : '';
      return `<div class="generation">${row}${arrows}</div>`;
    }).join('');
    v.innerHTML = `<div class="tree-grid">${html}</div>`;
  }

  function buildLayers(root){
    const r = DB.rels;
    const parents = r.filter(x=>x.type==='parent'&&x.b===root).map(x=>x.a);
    const spouse = r.filter(x=>x.type==='spouse'&&(x.a===root||x.b===root)).map(x=> x.a===root?x.b:x.a);
    const siblings = Array.from(new Set(parents.flatMap(p=> r.filter(x=>x.type==='parent'&&x.a===p).map(x=>x.b)))).filter(id=>id!==root);
    const children = r.filter(x=>x.type==='child'&&x.a===root).map(x=>x.b);
    const grandchildren = children.flatMap(c=> r.filter(x=>x.type==='child'&&x.a===c).map(x=>x.b));
    const grandparents = parents.flatMap(p=> r.filter(x=>x.type==='parent'&&x.b===p).map(x=>x.a));
    const auntsUncles = parents.flatMap(p=>{
      const gp = r.filter(x=>x.type==='parent'&&x.b===p).map(x=>x.a);
      const kids = gp.flatMap(g=> r.filter(x=>x.type==='parent'&&x.a===g).map(x=>x.b));
      return kids.filter(x=>x!==p);
    });
    const cousins = auntsUncles.flatMap(au=> r.filter(x=>x.type==='child'&&x.a===au).map(x=>x.b));
    const L={};
    if(grandparents.length) L['-2']=uniq(grandparents);
    if(parents.length) L['-1']=uniq(parents);
    if(auntsUncles.length) L['-1u']=uniq(auntsUncles);
    L['0']=uniq([root,...spouse,...siblings]);
    if(children.length) L['1']=uniq(children);
    if(cousins.length) L['1c']=uniq(cousins);
    if(grandchildren.length) L['2']=uniq(grandchildren);
    return L;
  }
  function relationToMe(me, id){
    if(me===id) return "Я";
    const r = DB.rels;
    if(r.some(x=>x.type==='spouse'&&((x.a===me&&x.b===id)||(x.b===me&&x.a===id)))) return "Супруг/а";
    if(r.some(x=>x.type==='parent'&&x.a===id&&x.b===me)) return "Отец/Мать";
    if(r.some(x=>x.type==='child'&&x.a===me&&x.b===id)) return "Сын/Дочь";
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
  function renderPerson(id, rel){
    const u = DB.users.find(x=>x.id===id);
    const dates = (u.dob||'') + (u.dod? (' • † '+u.dod): '');
    return `<div class="person" onclick="Tree.openProfile('${id}')">
      <div class="name">${u.name}</div>
      <div class="sub">${dates}</div>
      ${rel? `<div class="rel">${rel}</div>`:''}
    </div>`;
  }
  function openProfile(id){
    const u = DB.users.find(x=>x.id===id);
    const dates = (u.dob||'') + (u.dod? (' • † '+u.dod): '');
    UI.sheet(`<div class="vstack">
      <div class="section-title">${u.name}</div>
      <div class="small">${dates}</div>
      <div class="section-title">Действия</div>
      <div class="hstack">
        <button class="btn" onclick="Tree.openAdd('${id}')">Добавить родственника</button>
        <button class="btn ghost" onclick="UI.close()">Закрыть</button>
      </div>
    </div>`);
  }
  function openAdd(contextId){
    UI.sheet(`<div class="vstack">
      <div class="section-title">Добавить родственника</div>
      <input id="rel_name" class="input" placeholder="ФИО">
      <input id="rel_dob" class="input" placeholder="Дата рождения (YYYY-MM-DD)">
      <select id="rel_type" class="select">
        <option value="parent">Мать/Отец</option>
        <option value="child">Сын/Дочь</option>
        <option value="sibling">Брат/Сестра</option>
        <option value="spouse">Супруг/Супруга</option>
        <option value="grandparent">Дедушка/Бабушка</option>
        <option value="auntuncle">Дядя/Тётя</option>
        <option value="cousin">Двоюродный брат/сестра</option>
      </select>
      <button class="btn" onclick="Tree._saveAdd('${contextId||''}')">Сохранить</button>
    </div>`);
  }
  function _saveAdd(contextId){
    const name = document.getElementById('rel_name').value.trim();
    const dob = document.getElementById('rel_dob').value.trim();
    const type = document.getElementById('rel_type').value;
    if(!name){ alert('Введите ФИО'); return; }
    let user = DB.users.find(u=>u.name.toLowerCase()===name.toLowerCase() && (u.dob||'')===dob);
    if(!user){ user = {id:'u'+(DB.users.length+1), name, dob}; DB.users.push(user); }
    const me = contextId || DB.currentUserId;
    if(type==='parent'){ DB.rels.push({type:'parent', a:user.id, b:me}); }
    else if(type==='child'){ DB.rels.push({type:'child', a:me, b:user.id}); }
    else if(type==='sibling'){ DB.rels.push({type:'sibling', a:me, b:user.id}); DB.rels.push({type:'sibling', a:user.id, b:me}); }
    else if(type==='spouse'){ DB.rels.push({type:'spouse', a:me, b:user.id}); DB.rels.push({type:'spouse', a:user.id, b:me}); }
    else if(type==='grandparent'){ const parents = DB.rels.filter(r=>r.type==='parent' && r.b===me).map(r=>r.a); if(parents[0]) DB.rels.push({type:'parent', a:user.id, b:parents[0]}); }
    else if(type==='auntuncle'){ const parents = DB.rels.filter(r=>r.type==='parent' && r.b===me).map(r=>r.a); if(parents[0]){ DB.rels.push({type:'sibling', a:parents[0], b:user.id}); DB.rels.push({type:'sibling', a:user.id, b:parents[0]}); } }
    else if(type==='cousin'){ const parents = DB.rels.filter(r=>r.type==='parent' && r.b===me).map(r=>r.a); const aunts = parents.flatMap(p => { const gp = DB.rels.filter(r=>r.type==='parent' && r.b===p).map(r=>r.a); const kids = gp.flatMap(g=> DB.rels.filter(r=>r.type==='parent' && r.a===g).map(r=>r.b)); return kids.filter(x=>x!==p); }); if(aunts[0]) DB.rels.push({type:'child', a:aunts[0], b:user.id}); }
    UI.close(); page();
  }
  function uniq(arr){ return Array.from(new Set(arr)); }
  return { page, openProfile, openAdd, _saveAdd };
})();
