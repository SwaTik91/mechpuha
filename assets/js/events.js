
window.Events = (function(){
  function openCreate(){
    UI.sheet(`<div class="vstack">
      <div class="section-title">Создать событие</div>
      <select id="etype" class="select">
        <option value="wedding">Свадьба</option>
        <option value="brit">Брит Мила</option>
        <option value="barmitzvah">Бар Мицва</option>
      </select>
      <input id="etitle" class="input" placeholder="Заголовок">
      <input id="edate" class="input" placeholder="Дата (YYYY-MM-DD)">
      <input id="eplace" class="input" placeholder="Место (адрес)">
      <div class="section-title">Приглашения</div>
      <div class="typeahead">
        <input id="search" class="input" placeholder="Поиск по имени/фамилии" oninput="Events.searchUsers(this.value)">
        <div id="suggest" class="suggest"></div>
      </div>
      <div id="selected" class="list"></div>
      <button class="btn" onclick="Events.create()">Создать</button>
    </div>`);
    window._invitees = new Set();
  }
  function searchUsers(q){
    q = (q||'').trim().toLowerCase();
    const box = document.getElementById('suggest');
    if(!q){ box.innerHTML=''; return; }
    const found = DB.users.filter(u => u.name.toLowerCase().includes(q)).slice(0,20);
    box.innerHTML = found.map(u=>`<div class="opt" onclick="Events.toggleInvite('${u.id}','${u.name}')">${u.name}</div>`).join('');
  }
  function toggleInvite(id, name){
    if(!_invitees) window._invitees = new Set();
    if(_invitees.has(id)) _invitees.delete(id); else _invitees.add(id);
    const sel = document.getElementById('selected');
    const arr = Array.from(_invitees);
    sel.innerHTML = arr.length? arr.map(uid=>{
      const u = DB.users.find(x=>x.id===uid);
      return `<div class="item"><input type="checkbox" checked onclick="Events.toggleInvite('${uid}','${u.name}')"> ${u.name}</div>`;
    }).join('') : '<div class="muted">Пока никого не выбрали</div>';
  }
  function create(){
    const type = document.getElementById('etype').value;
    const title = document.getElementById('etitle').value.trim() || defaultTitle(type);
    const date = document.getElementById('edate').value.trim();
    const place = document.getElementById('eplace').value.trim();
    const id = 'e'+(DB.events.length+1);
    const invited = Array.from(_invitees||[]);
    DB.events.push({id,type,title,date,place,owner:DB.currentUserId,invited});
    UI.close(); Feed.page();
  }
  function defaultTitle(t){ return t==='wedding'?'Свадьба': t==='brit'?'Брит Мила':'Бар Мицва'; }
  function open(id){
    const e = DB.events.find(x=>x.id===id);
    if(!e) return;
    UI.sheet(`<div class="vstack">
      <div class="section-title">${icon(e.type)} ${e.title}</div>
      <div class="kv"><div>Дата</div><div>${e.date||'—'}</div><div>Место</div><div>${e.place||'—'}</div></div>
      <div class="section-title">Приглашены</div>
      <div class="list">${(e.invited||[]).map(uid=>{ const u=DB.users.find(x=>x.id===uid); return u? `<div class="item">${u.name}</div>`:''; }).join('')||'<div class="muted">никого</div>'}</div>
    </div>`);
  }
  function icon(t){return t==='wedding'?'💍': t==='brit'?'✂️': t==='barmitzvah'?'📜':'📌'}
  function createMourning(title, date){
    const id='e'+(DB.events.length+1);
    const invited = DB.users.map(u=>u.id);
    DB.events.push({id,type:'mourning',title,date,owner:'admin',invited});
  }
  return { openCreate, create, open, searchUsers, toggleInvite, createMourning };
})();
