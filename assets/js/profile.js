
window.Profile = (function(){
  function page(){
    UI.title('Профиль');
    UI.action('<button class="btn ghost" onclick="Profile.switchUser()">Сменить</button>');
    const me = DB.users.find(u=>u.id===DB.currentUserId);
    const v = UI.view();
    v.innerHTML = `
      <div class="card vstack">
        <div class="hstack">
          <div class="vstack">
            <div style="font-weight:700">${me.name}</div>
            <div class="small">${me.dob||''} • ${me.city||'—'}</div>
          </div>
        </div>
      </div>
      <div class="card vstack">
        <div class="section-title">Редактирование</div>
        <input id="pname" class="input" value="${me.name}">
        <input id="pdob" class="input" value="${me.dob||''}" placeholder="Дата рождения">
        <input id="pcity" class="input" value="${me.city||''}" placeholder="Город">
        <button class="btn" onclick="Profile.save()">Сохранить</button>
      </div>
    `;
  }
  function save(){
    const me = DB.users.find(u=>u.id===DB.currentUserId);
    me.name = document.getElementById('pname').value;
    me.dob  = document.getElementById('pdob').value;
    me.city = document.getElementById('pcity').value;
    alert('Сохранено');
    page();
  }
  function switchUser(){
    localStorage.removeItem('mt_user');
    showLogin();
  }
  return { page, save, switchUser };
})();
