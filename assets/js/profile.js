
window.Profile = (function(){
  function page(){
    UI.title('Профиль');
    UI.action('<button class="btn ghost" onclick="Admin.page()">Админка</button>');
    const me = DB.users.find(u=>u.id===DB.currentUserId);
    const v = UI.view();
    v.innerHTML = `
      <div class="card vstack">
        <div class="hstack">
          <img class="avatar" src="${me.photo||''}" onerror="this.style.display='none'">
          <div class="vstack">
            <div style="font-weight:700">${me.name}</div>
            <div class="small">${me.city||'—'}</div>
          </div>
        </div>
      </div>
      <div class="card vstack">
        <div class="section-title">Данные</div>
        <input id="pname" class="input" value="${me.name}">
        <input id="pdob" class="input" value="${me.dob||''}" placeholder="Дата рождения">
        <input id="pcity" class="input" value="${me.city||''}" placeholder="Город">
        <input id="porigin" class="input" value="${me.origin||''}" placeholder="Место происхождения">
        <button class="btn" onclick="Profile.save()">Сохранить</button>
      </div>
      <div class="card vstack">
        <div class="section-title">Разделы</div>
        <button class="btn" onclick="Synagogues.page()">Синагоги</button>
        <button class="btn ghost" onclick="Events.openCreate()">Создать событие</button>
      </div>
    `;
  }
  function save(){
    const me = DB.users.find(u=>u.id===DB.currentUserId);
    me.name = document.getElementById('pname').value;
    me.dob = document.getElementById('pdob').value;
    me.city = document.getElementById('pcity').value;
    me.origin = document.getElementById('porigin').value;
    alert('Сохранено');
    page();
  }
  return { page, save };
})();
