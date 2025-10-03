// assets/js/messages.js
window.Messages = (function(){
  function page(tab='groups'){
    UI.title('Сообщения');
    UI.action(`
      <div class="hstack">
        <button class="btn ${tab==='dm' ? '' : 'ghost'}" onclick="Messages.page('dm')">Личные</button>
        <button class="btn ${tab==='groups' ? '' : 'ghost'}" onclick="Messages.page('groups')">Группы</button>
      </div>
    `);
    if (tab==='dm') renderDM(); else renderGroups();
  }

  function renderGroups(){
    const v = UI.view();
    v.innerHTML = `<div class="list">
      ${(DB.groups||[]).map(g=>`<div class="item" onclick="Groups.open('${g.id}')">
        <div class="vstack"><div><b>${g.name}</b></div><div class="small">${g.last||''}</div></div>
      </div>`).join('')}
    </div>`;
  }

  function renderDM(){
    const v = UI.view();
    v.innerHTML = `<div class="card"><div class="muted">Личные сообщения пока не подключены</div></div>`;
  }

  return { page };
})();
