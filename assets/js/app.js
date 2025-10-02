
(function(){
  function showInvite(){
    window.UI.sheet(`
      <div class="vstack">
        <div class="section-title">Вход по инвайту</div>
        <input id="invite" class="input" placeholder="Код приглашения">
        <button class="btn" onclick="(function(){ 
          const code=document.getElementById('invite').value.trim();
          if(window.DB.invites.includes(code)){ 
            localStorage.setItem('mt_invited','1'); 
            window.UI.close(); 
            showLogin();
          } else { alert('Неверный инвайт'); } 
        })()">Продолжить</button>
      </div>
    `);
  }

  window.showLogin = function(){
    const users = window.DB.users;
    const render = (arr)=>{
      return arr.map(u=>`<div class="login-item" onclick="selectUser('${u.id}')">${u.name}${u.dob? ' • '+u.dob : ''}</div>`).join('');
    };
    window.UI.sheet(`
      <div class="vstack">
        <div class="section-title">Выберите пользователя</div>
        <div class="login-search"><input id="login_q" class="input" placeholder="Поиск по имени/фамилии" oninput="filterLogin()"></div>
        <div id="login_list" class="login-list">${render(users)}</div>
        <div class="section-title">Или создать нового</div>
        <input id="new_name" class="input" placeholder="ФИО">
        <input id="new_dob" class="input" placeholder="Дата рождения (YYYY-MM-DD)">
        <button class="btn" onclick="createUser()">Создать и войти</button>
      </div>
    `);
    window.filterLogin = function(){
      const q = (document.getElementById('login_q').value||'').toLowerCase();
      const f = users.filter(u => u.name.toLowerCase().includes(q));
      document.getElementById('login_list').innerHTML = render(f);
    };
    window.selectUser = function(id){
      localStorage.setItem('mt_user', id);
      window.DB.currentUserId = id;
      window.UI.close();
      route('feed');
    };
    window.createUser = function(){
      const name = (document.getElementById('new_name').value||'').trim();
      const dob = (document.getElementById('new_dob').value||'').trim();
      if(!name){ alert('Введите ФИО'); return; }
      const id = 'u'+(window.DB.users.length+1);
      window.DB.users.push({id, name, dob});
      localStorage.setItem('mt_user', id);
      window.DB.currentUserId = id;
      window.UI.close();
      route('feed');
    };
  };

  // Boot
  window.addEventListener('load', ()=>{
    const tabs = document.querySelectorAll('.tabbar .tab');
     // Инициализация Supabase
   try {
     await DBAPI.init({ url: window.__SUPA_URL__, anonKey: window.__SUPA_ANON__ });
     const { users, rels } = await DBAPI.loadAll();
    window.DB.users = users;
     window.DB.rels = rels;
   } catch (e) {
     console.warn('Supabase init/load failed, falling back to local data', e);
   }
    tabs.forEach(btn=>btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); route(btn.getAttribute('data-tab'));
    }));
    // Invite & login flow
    if(!localStorage.getItem('mt_invited')){
      showInvite();
    } else {
      const uid = localStorage.getItem('mt_user');
      if(uid){
        window.DB.currentUserId = uid;
        route('feed');
      } else {
        showLogin();
      }
    }
  });

  window.route = function(tab){
    switch(tab){
      case 'feed': Feed.page(); break;
      case 'tree': Tree.page(); break;
      case 'calendar': Calendar.page(); break;
      case 'groups': Groups.page(); break;
      case 'profile': Profile.page(); break;
      default: Feed.page();
    }
  };
})();
