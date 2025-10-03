// assets/js/auth.js
window.Auth = (function(){
  function openLogin(){
    UI.sheet(`
      <div class="vstack">
        <div class="section-title">Вход</div>
        <input id="login_email" class="input" placeholder="Email" inputmode="email" autocomplete="email">
        <input id="login_pass" class="input" type="password" placeholder="Пароль" autocomplete="current-password">
        <div class="hstack">
          <button class="btn" onclick="Auth.doLogin()">Войти</button>
          <button class="btn ghost" onclick="Auth.openRegister()">Регистрация</button>
        </div>
      </div>
    `);
  }

  function openRegister(){
    UI.sheet(`
      <div class="vstack">
        <div class="section-title">Регистрация</div>
        <input id="r_email" class="input" placeholder="Email" inputmode="email" autocomplete="email">
        <input id="r_pass" class="input" type="password" placeholder="Пароль" autocomplete="new-password">
        <input id="r_last" class="input" placeholder="Фамилия">
        <input id="r_first" class="input" placeholder="Имя">
        <input id="r_pat" class="input" placeholder="Отчество (необязательно)">
        <input id="r_dob" class="input" type="date" placeholder="Дата рождения">
        <input id="r_city" class="input" placeholder="Город">
        <div class="hstack">
          <button class="btn" onclick="Auth.doRegister()">Создать аккаунт</button>
          <button class="btn ghost" onclick="Auth.openLogin()">У меня уже есть аккаунт</button>
        </div>
      </div>
    `);
  }

  async function doRegister(){
    const email = val('r_email'), password = val('r_pass');
    const lastname = val('r_last'), firstname = val('r_first'), patronymic = val('r_pat');
    const dob = val('r_dob'), city = val('r_city');
    if(!email || !password || !lastname || !firstname){ alert('Заполните обязательные поля'); return; }
    try{
      await DBAPI.signUp({ email, password, lastname, firstname, patronymic, dob, city });
      UI.close();
      await App.afterAuth(); // продолжим загрузку приложения
    }catch(e){ console.error(e); alert('Регистрация не удалась: '+(e?.message||e)); }
  }

  async function doLogin(){
    const email = val('login_email'), password = val('login_pass');
    if(!email || !password){ alert('Введите email и пароль'); return; }
    try{
      await DBAPI.signIn({ email, password });
      UI.close();
      await App.afterAuth();
    }catch(e){ console.error(e); alert('Вход не удался: '+(e?.message||e)); }
  }

  function val(id){ return (document.getElementById(id)?.value||'').trim(); }

  return { openLogin, openRegister, doLogin, doRegister };
})();
