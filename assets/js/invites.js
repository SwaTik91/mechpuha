// assets/js/invites.js
window.Invites = (function(){
  function page(){
    UI.title('Приглашения');
    UI.action('');
    const v = UI.view();
    const me = DB.currentUserId;

    const eventInvites = (DB.events||[]).filter(e => (e.invited||[]).includes(me));

    v.innerHTML = `
      <div class="vstack">
        <div class="card vstack">
          <div class="section-title">События</div>
          <div class="list">${
            eventInvites.length
              ? eventInvites.map(e=>(
                `<div class="item"><div><b>${e.title}</b><div class="small">${e.date||''}${e.place? ' • '+e.place:''}</div></div></div>`
              )).join('')
              : '<div class="muted">Пока нет приглашений</div>'
          }</div>
        </div>

        <div class="card vstack">
          <div class="section-title">Группы</div>
          <div class="list"><div class="muted">Пока нет приглашений</div></div>
        </div>
      </div>
    `;
  }
  return { page };
})();
