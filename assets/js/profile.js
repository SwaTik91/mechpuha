window.Profile = (function(){
  function page(){
    UI.title('Профиль');
    UI.action('');

    const me = DB.users.find(u=>u.id===DB.currentUserId) || {};
    const fio = me.name||'';
    const [lastname='', firstname='', ...rest] = fio.split(/\s+/);
    const patronymic = rest.join(' ');
    const v = UI.view();

    v.innerHTML = `
      <div class="card vstack">
        <div class="section-title">Мои данные</div>
        <input id="p_last" class="input" value="${lastname}" placeholder="Фамилия">
        <input id="p_first" class="input" value="${firstname}" placeholder="Имя">
        <input id="p_pat" class="input" value="${patronymic}" placeholder="Отчество">
        <input id="p_dob" class="input" type="date" value="${me.dob||''}" placeholder="Дата рождения">
        <input id="p_city" class="input" value="${me.city||''}" placeholder="Город">
        <div class="hstack">
          <button class="btn" onclick="Profile.save()">Сохранить</button>
          <button class="btn ghost" onclick="Profile.logout()">Выйти</button>
        </div>
      </div>

      <div class="card vstack">
        <div class="section-title">Сменить пароль</div>
        <input id="old_pass" class="input" type="password" placeholder="Старый пароль">
        <input id="new_pass" class="input" type="password" placeholder="Новый пароль">
        <button class="btn" onclick="Profile.changePassword()">Сменить пароль</button>
      </div>
    `;
  }

  async function save(){
    const meId = DB.currentUserId;
    const name = [val('p_last'), val('p_first'), val('p_pat')].filter(Boolean).join(' ').trim();
    const dob  = val('p_dob') || null;
    const city = val('p_city') || null;
    try{
      const u = await DBAPI.updateUser(meId, { name, dob, city });
      // обновляем локально
      const i = DB.users.findIndex(x=>x.id===meId);
      if (i>=0) DB.users[i] = u; else DB.users.push(u);
      alert('Сохранено');
      page();
    }catch(e){ console.error(e); alert('Ошибка сохранения: '+(e?.message||e)); }
  }

  async function logout(){
    await DBAPI.signOut();
    Auth.openLogin();
  }

  async function changePassword(){
    const oldPass = val('old_pass'), newPass = val('new_pass');
    if (!newPass) { alert('Введите новый пароль'); return; }
    // для проверки старого нам нужен email — возьмём из сессии
    const session = await DBAPI.getSession();
    const email = session?.user?.email || null;
    try{
      await DBAPI.updatePassword({ oldPassword: oldPass, newPassword: newPass, email });
      alert('Пароль обновлён');
      page();
    }catch(e){ console.error(e); alert('Не удалось сменить пароль: '+(e?.message||e)); }
  }

  function val(id){ return (document.getElementById(id)?.value||'').trim(); }

  return { page, save, logout, changePassword };
})();
