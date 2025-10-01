
window.Tree = (function(){
  function page(){
    UI.title('Семейное древо');
    UI.action('<button class="btn ghost" onclick="Tree.addRelative()">Добавить</button>');
    const v = UI.view();
    const rootId = DB.currentUserId;
    const layers = buildLayers(rootId); // { '-1': parents, '0': root+siblings, '1': children, '2': grandchildren ... }
    const html = Object.keys(layers).sort((a,b)=>parseInt(a)-parseInt(b)).map(level=>{
      const row = layers[level].map(id=>renderPerson(id)).join('');
      return `<div class="generation">${row}</div>`;
    }).join('');
    v.innerHTML = `<div class="tree-grid">${html}</div>`;
  }

  function buildLayers(rootId){
    const users = Object.fromEntries(DB.users.map(u=>[u.id,u]));
    const rels = DB.rels;
    const parents = rels.filter(r=>r.type==='parent' && r.b===rootId).map(r=>r.a);
    const children = rels.filter(r=>r.type==='child' && r.a===rootId).map(r=>r.b);
    const spouse = rels.filter(r=>r.type==='spouse' && (r.a===rootId||r.b===rootId))
                      .map(r=> r.a===rootId ? r.b : r.a);
    // siblings: share a parent
    const siblings = Array.from(new Set(parents.flatMap(p => rels.filter(r=>r.type==='parent' && r.a===p).map(r=>r.b))))
                     .filter(id => id!==rootId);

    // grandchildren
    const grandchildren = children.flatMap(c => rels.filter(r=>r.type==='child' && r.a===c).map(r=>r.b));

    const layers = {};
    if(parents.length) layers['-1'] = parents;
    layers['0'] = [rootId, ...spouse, ...siblings];
    if(children.length) layers['1'] = children;
    if(grandchildren.length) layers['2'] = grandchildren;
    return layers;
  }

  function renderPerson(id){
    const u = DB.users.find(x=>x.id===id);
    const sub = u.dob ? u.dob : '';
    return `<div class="person" onclick="Tree.openProfile('${id}')">
      <img class="avatar" src="${u.photo||''}" onerror="this.style.display='none'">
      <div class="name">${u.name}</div>
      <div class="sub">${sub}</div>
      ${renderBadges(id)}
    </div>`;
  }

  function renderBadges(id){
    const rels = DB.rels;
    let out = '';
    if(rels.some(r=>r.type==='spouse' && (r.a===id||r.b===id))) out += `<div class="badge">Супруг/а</div>`;
    return out;
  }

  function openProfile(id){
    const u = DB.users.find(x=>x.id===id);
    const isDeceased = !!u.dod;
    UI.sheet(`
      <div class="vstack">
        <div class="hstack"><img class="avatar" src="${u.photo||''}" onerror="this.style.display='none'"><div>
          <div style="font-weight:700">${u.name}</div>
          <div class="small">${u.dob||''}${isDeceased? ' • † '+u.dod : ''}</div>
        </div></div>
        <div class="kv">
          <div>Город</div><div>${u.city||'—'}</div>
          <div>Происхождение</div><div>${u.origin||'—'}</div>
        </div>
        <div class="section-title">Действия</div>
        <div class="hstack">
          <button class="btn" onclick="Tree.addRelative('${id}')">Добавить родственника</button>
          <button class="btn ghost" onclick="UI.close()">Закрыть</button>
        </div>
      </div>
    `);
  }

  function addRelative(contextId){
    UI.sheet(`
      <div class="vstack">
        <div class="section-title">Добавить родственника</div>
        <input id="rel_name" class="input" placeholder="ФИО">
        <input id="rel_dob" class="input" placeholder="Дата рождения (YYYY-MM-DD)">
        <select id="rel_type" class="select">
          <option value="parent">Мать/Отец</option>
          <option value="child">Сын/Дочь</option>
          <option value="sibling">Брат/Сестра</option>
          <option value="spouse">Супруг/Супруга</option>
        </select>
        <button class="btn" onclick="Tree._saveRelative('${contextId||''}')">Сохранить</button>
      </div>
    `);
  }

  function _saveRelative(contextId){
    const name = document.getElementById('rel_name').value.trim();
    const dob = document.getElementById('rel_dob').value.trim();
    const type = document.getElementById('rel_type').value;
    if(!name){ alert('Введите имя'); return; }
    // find or create
    let user = DB.users.find(u=>u.name.toLowerCase()===name.toLowerCase() && (u.dob||'')===dob);
    if(!user){
      user = { id: 'u'+(DB.users.length+1), name, dob };
      DB.users.push(user);
    }
    const me = contextId || DB.currentUserId;
    const rel = {type, a: type==='parent'? user.id : me, b: type==='parent'? me : (type==='spouse'? user.id : (type==='sibling'? user.id : user.id))};
    // normalize for sibling/spouse bi-directional & child inverse
    if(type==='sibling'){
      DB.rels.push({type:'sibling', a:me, b:user.id});
      DB.rels.push({type:'sibling', a:user.id, b:me});
    } else if(type==='spouse'){
      DB.rels.push({type:'spouse', a:me, b:user.id});
      DB.rels.push({type:'spouse', a:user.id, b:me});
    } else if(type==='parent'){
      DB.rels.push({type:'parent', a:user.id, b:me});
    } else if(type==='child'){
      DB.rels.push({type:'child', a:me, b:user.id});
    } else {
      DB.rels.push(rel);
    }
    UI.close();
    page();
  }

  return { page, openProfile, addRelative, _saveRelative };
})();
