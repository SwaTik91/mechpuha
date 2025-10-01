
window.Calendar = (function(){
  function page(){
    UI.title('Календарь');
    UI.action('<button class="btn ghost" onclick="Events.openCreate()">Добавить</button>');
    const v = UI.view();
    const items = [...birthdays(), ...DB.events].sort((a,b)=> (a.date||'').localeCompare(b.date||''));
    v.innerHTML = `<div class="calendar">${items.map(render).join('')}</div>`;
  }
  function birthdays(){
    return DB.users.filter(u=>u.dob).map(u=>({
      type:'birthday', title:`День рождения: ${u.name}`, date:u.dob.slice(5), person:u.id
    }));
  }
  function render(e){
    const dot = e.type==='mourning'?'#4a4a4a': (e.type==='wedding'?'#E08E45':'#6C8EAD');
    const place = e.place? ` • ${e.place}`:'';
    return `<div class="event" onclick="Events.open('${e.id||''}','${e.type}')">
      <div class="dot" style="background:${dot}"></div>
      <div><div><b>${e.title}</b></div><div class="small">${e.date||''}${place}</div></div>
    </div>`;
  }
  return { page };
})();
