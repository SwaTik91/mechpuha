
window.Events = (function(){
  function openCreate(){
    UI.sheet(`<div class="vstack">
      <div class="section-title">Создать событие</div>
      <select id="etype" class="select">
        <option value="wedding">Свадьба</option>
        <option value="brit">Брит Мила</option>
        <option value="barmitzvah">Бар Мицва</option>
        <option value="mourning">Траур</option>
      </select>
      <input id="etitle" class="input" placeholder="Заголовок">
      <input id="edate" class="input" placeholder="Дата (YYYY-MM-DD)">
      <input id="eplace" class="input" placeholder="Место (адрес)">
      <button class="btn" onclick="Events.create()">Создать</button>
    </div>`);
  }
  function create(){
    const type = q('#etype').value;
    const title = q('#etitle').value.trim() || defaultTitle(type);
    const date = q('#edate').value.trim();
    const place = q('#eplace').value.trim();
    const id = 'e'+(DB.events.length+1);
    DB.events.push({id,type,title,date,place,owner:DB.currentUserId});
    UI.close(); Feed.page();
  }
  function defaultTitle(t){
    return t==='wedding'?'Свадьба': t==='brit'?'Брит Мила': t==='barmitzvah'?'Бар Мицва': 'Траур';
  }
  function open(id, typeHint){
    const e = DB.events.find(x=>x.id===id) || {type:typeHint,title:'Событие'};
    UI.sheet(`<div class="vstack">
      <div class="section-title">${icon(e.type)} ${e.title}</div>
      <div class="kv"><div>Дата</div><div>${e.date||'—'}</div><div>Место</div><div>${e.place||'—'}</div></div>
      ${e.type==='mourning'? mourningCalc(e): ''}
      <div class="section-title">Пригласить</div>
      <div class="hstack">
        <button class="btn" onclick="Events.inviteRelatives('${e.id}')">Родственников</button>
        <button class="btn ghost" onclick="Events.inviteCustom('${e.id}')">По списку</button>
      </div>
    </div>`);
  }
  function icon(t){
    return t==='wedding'?'💍': t==='brit'?'✂️': t==='barmitzvah'?'📜': t==='mourning'?'🕯️':'📌';
  }
  function mourningCalc(e){
    if(!e.date) return '';
    const base = new Date(e.date);
    function addDays(d){ const x=new Date(base); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10); }
    return `<div class="card"><b>Даты траура</b>
      <div class="small">Похороны: ${e.date}</div>
      <div class="small">Шива (7 дней): ${addDays(7)}</div>
      <div class="small">Сорок дней: ${addDays(40)}</div>
      <div class="small">Годовщина: ${addDays(365)}</div>
    </div>`;
  }
  function inviteRelatives(eid){
    UI.sheet(`<div class="vstack">
      <div class="section-title">Приглашения родственникам</div>
      ${DB.users.map(u=>`<label class="item"><input type="checkbox" data-id="${u.id}"> ${u.name}</label>`).join('')}
      <button class="btn" onclick="Events._send('${eid}')">Отправить</button>
    </div>`);
  }
  function inviteCustom(eid){
    UI.sheet(`<div class="vstack">
      <div class="section-title">Вставьте список телефонов/почт</div>
      <textarea id="custom" class="textarea" rows="5" placeholder="+7..., имя..."></textarea>
      <button class="btn" onclick="(function(){ alert('Приглашения отправлены'); UI.close(); })()">Отправить</button>
    </div>`);
  }
  function _send(eid){
    const checks = Array.from(document.querySelectorAll('input[type=checkbox][data-id]:checked')).map(x=>x.getAttribute('data-id'));
    alert('Отправлено приглашений: '+checks.length);
    UI.close();
  }
  function q(sel){return document.querySelector(sel)}
  return { openCreate, create, open, inviteRelatives, inviteCustom, _send };
})();
