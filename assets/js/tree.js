window.Tree = (function(){
  function page(){
    UI.title('Семейное древо');
    UI.action('<button class="btn ghost" onclick="Tree.openAdd()">Добавить родственника</button>');
    const v = UI.view();
    const me = DB.currentUserId;

    const L = buildLayers(me);
    const order = ['-2','-1','0','1','2'].filter(k=>L[k] && L[k].length);

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

  function buildLayers(root){
    const r = DB.rels;
    const parents   = r.filter(x=>x.type==='parent'&&x.b===root).map(x=>x.a);
    const spouse    = r.filter(x=>x.type==='spouse'&&(x.a===root||x.b===root)).map(x=> x.a===root?x.b:x.a);
    const siblings  = Array.from(new Set(parents.flatMap(p=> r.filter(x=>x.type==='parent'&&x.a===p).map(x=>x.b)))).filter(id=>id!==root);
    const children  = r.filter(x=>x.type==='child'&&x.a===root).map(x=>x.b);
    const grandchildren = children.flatMap(c=> r.filter(x=>x.type==='child'&&x.a===c).map(x=>x.b));
    const grandparents  = parents.flatMap(p=> r.filter(x=>x.type==='parent'&&x.b===p).map(x=>x.a));
    const L={};
    if(grandparents.length) L['-2']=uniq(grandparents);
    if(parents.length)      L['-1']=uniq(parents);
    L['0']=uniq([root,...spouse,...siblings]);
    if(children.length)     L['1']=uniq(children);
    if(grandchildren.length)L['2']=uniq(grandchildren);
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
    return "";
  }

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
      </select>
      <div class="hstack">
        <button class="btn" onclick="Tree._saveAdd('${contextId||''}')">Сохранить</button>
        <button class="btn ghost" onclick="UI.close()">Отменить</button>
      </div>
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
    UI.close(); page();
  }

  function formatDate(iso){ if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}.${m}.${y}`; }
  function uniq(arr){ return Array.from(new Set(arr)); }
  return { page, openProfile, openAdd, _saveAdd };
})();
