
window.Feed = (function(){
  function page(){
    UI.title('Лента');
    UI.action('<button class="btn ghost" onclick="Events.openCreate()">Создать событие</button>');
    const me = DB.currentUserId;
    const v = UI.view();
    const visible = DB.events.filter(e => e.type!=='mourning' ? (e.owner===me || (e.invited||[]).includes(me)) : (e.invited||[]).includes(me));
    v.innerHTML = `<div class="list">${visible.length? visible.map(render).join('') : '<div class="muted">Пока нет событий</div>'}</div>`;
  }
  function render(e){
    const emoji = e.type==='wedding'?'💍': e.type==='brit'?'✂️': e.type==='barmitzvah'?'📜': e.type==='mourning'?'🕯️':'📌';
    const place = e.place? ' • '+e.place : '';
    return `<div class="item" onclick="Events.open('${e.id}')">
      <div style="font-size:20px">${emoji}</div>
      <div class="vstack"><div><b>${e.title}</b></div><div class="small">${e.date||''}${place}</div></div>
    </div>`;
  }
  return { page };
})();
