
window.Feed = (function(){
  function page(){
    UI.title('Лента');
    UI.action('<button class="btn ghost" onclick="Events.openCreate()">Создать событие</button>');
    const v = UI.view();
    const items = DB.events.map(e=>renderEvent(e)).join('');
    v.innerHTML = `
      <div class="list">
        ${items || '<div class="muted">Пока пусто</div>'}
      </div>
    `;
  }
  function renderEvent(e){
    const emoji = e.type==='wedding'?'💍': e.type==='brit'?'✂️': e.type==='barmitzvah'?'📜': e.type==='mourning'?'🕯️':'📌';
    return `<div class="item" onclick="Events.open('${e.id}')">
      <div style="font-size:20px">${emoji}</div>
      <div class="vstack">
        <div><b>${e.title}</b></div>
        <div class="small">${e.date} • ${e.place||''}</div>
      </div>
    </div>`;
  }
  return { page };
})();
