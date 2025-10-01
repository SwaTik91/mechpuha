
window.Admin = (function(){
  function page(){
    UI.title('Админка');
    UI.action('');
    const v = UI.view();
    v.innerHTML = `
      <div class="vstack">
        <div class="card">
          <div class="section-title">Общинные события</div>
          <button class="btn" onclick="Admin.addCommunityEvent()">Добавить событие</button>
        </div>
        <div class="card">
          <div class="section-title">Трауры</div>
          <button class="btn" onclick="Admin.addMourning()">Добавить траур (7/40/год)</button>
        </div>
        <div class="card">
          <div class="section-title">Синагоги</div>
          <button class="btn" onclick="Admin.openSynagogueAdmin()">Управление расписанием</button>
        </div>
      </div>
    `;
  }
  function addCommunityEvent(){
    Events.openCreate();
  }
  function addMourning(){
    UI.sheet(`<div class="vstack">
      <div class="section-title">Добавить траур</div>
      <input id="pname" class="input" placeholder="ФИО усопшего">
      <input id="pdate" class="input" placeholder="Дата похорон (YYYY-MM-DD)">
      <button class="btn" onclick="(function(){
        const n=document.getElementById('pname').value.trim();
        const d=document.getElementById('pdate').value.trim();
        if(!n||!d){alert('Заполните поля');return;}
        DB.events.push({id:'e'+(DB.events.length+1),type:'mourning',title:'Траур: '+n,date:d});
        UI.close(); Feed.page();
      })()">Сохранить</button>
    </div>`);
  }
  function openSynagogueAdmin(){
    const s = DB.synagogues[0];
    UI.sheet(`<div class="vstack">
      <div class="section-title">Редактировать расписание: ${s.name}</div>
      <div id="rows">${s.schedule.map((x,i)=>row(i,x.day,x.time)).join('')}</div>
      <button class="btn" onclick="(function(){
        const rows = Array.from(document.querySelectorAll('[data-row]')).map(r=>({day:r.querySelector('.day').value, time:r.querySelector('.time').value}));
        s.schedule = rows; UI.close(); Synagogues.page();
      })()">Сохранить</button>
    </div>`);
  }
  function row(i,day,time){
    return `<div class="hstack card" data-row>
      <input class="input day" value="${day}">
      <input class="input time" value="${time}">
    </div>`;
  }
  return { page, addCommunityEvent, addMourning, openSynagogueAdmin };
})();
