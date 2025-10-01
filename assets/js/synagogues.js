
window.Synagogues = (function(){
  function page(){
    UI.title('Синагоги');
    UI.action('<button class="btn ghost" onclick="Admin.openSynagogueAdmin()">Админ</button>');
    const v = UI.view();
    v.innerHTML = DB.synagogues.map(s=>`
      <div class="card">
        <div class="hstack"><div class="vstack">
          <div style="font-weight:700">${s.name}</div>
          <div class="small">${s.city}</div>
        </div></div>
        <div class="list" style="margin-top:8px">
          ${s.schedule.map(x=>`<div class="item"><div>${x.day}</div><div class="small">${x.time}</div></div>`).join('')}
        </div>
      </div>
    `).join('');
  }
  return { page };
})();
