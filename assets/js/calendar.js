
window.Calendar = (function(){
  function page(){
    UI.title('Календарь');
    UI.action('<button class="btn ghost" onclick="Events.openCreate()">Добавить</button>');
    const v = UI.view();
    const me = DB.currentUserId;
    const birthdays = DB.users.filter(u=>u.dob).map(u=>({type:'birthday',title:'День рождения: '+u.name,date:u.dob.slice(5)}));
    const events = DB.events.filter(e => e.owner===me || (e.invited||[]).includes(me));
    const items = [...birthdays, ...events].sort((a,b)=> (a.date||'').localeCompare(b.date||''));
    v.innerHTML = `<div class="list">${items.map(render).join('')}</div>`;
  }
  function render(e){
    const dot = e.type==='mourning'?'#4a4a4a': (e.type==='wedding'?'#E08E45':'#6C8EAD');
    const place = e.place? ' • '+e.place : '';
    return `<div class="item"><div style="width:10px;height:10px;border-radius:50%;background:${dot}"></div><div><b>${e.title}</b><div class="small">${e.date||''}${place}</div></div></div>`;
  }
  return { page };
})();
