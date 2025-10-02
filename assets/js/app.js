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
    const users = window.DB.users || [];
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
      const f = (window.DB.users||[]).filter(u => (u.name||'').toLowerCase().includes(q));
      document.getElementById('login_list').innerHTML = render(f);
    };
    window.selectUser = function(id){
      localStorage.setItem('mt_user', id);
      window.DB.currentUserId = id;
      window.UI.close();
      route('feed');
    };
    window.createUser = async function(){
      const name = (document.getElementById('new_name').value||'').trim();
      const dob = (document.getElementById('new_dob').value||'').trim();
      if(!name){ alert('Введите ФИО'); return; }
      try {
        // создаём пользователя в Supabase
        const created = await DBAPI.addUser({ name, dob: dob || null });
        // перезагружаем облачные данные в локальную копию
        const { users, rels } = await DBAPI.loadAll();
        window.DB.users = users;
        window.DB.rels  = rels;
        // запоминаем текущего пользователя
        localStorage.setItem('mt_user', created.id);
        window.DB.currentUserId = created.id;
        window.UI.close();
        route('feed');
      } catch (e) {
        console.error(e);
        alert('Не удалось создать пользователя в базе. Проверь подключение Supabase и политики RLS.');
      }
    };
  };

  // утилита ожидания (на случай, если модуль ещё не успел инициализироваться)
  function waitFor(cond, timeout=5000, interval=30){
    return new Promise((resolve, reject)=>{
      const start = Date.now();
      const t = setInterval(()=>{
        if (cond()) { clearInterval(t); resolve(true); }
        else if (Date.now() - start > timeout) { clearInterval(t); reject(new Error('waitFor timeout')); }
      }, interval);
    });
  }

  // Boot
  window.addEventListener('load', async ()=>{
    const tabs = document.querySelectorAll('.tabbar .tab');
    tabs.forEach(btn=>btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      route(btn.getAttribute('data-tab'));
    }));

    // Инициализация Supabase и первичная загрузка данных
    try {
      await DBAPI.init({ url: window.__SUPA_URL__, anonKey: window.__SUPA_ANON__ });
      const { users, rels } = await DBAPI.loadAll();
      window.DB.users = users || [];
      window.DB.rels  = rels  || [];
    } catch (e) {
      console.warn('Supabase init/load failed, fallback to local data', e);
      // на случай оффлайна/ошибки оставляем data.js
      window.DB.users = window.DB.users || [];
      window.DB.rels  = window.DB.rels  || [];
    }

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

  window.route = async function(tab){
    switch(tab){
      case 'feed':     Feed.page(); break;
      case 'tree':
        // ждём, пока инициализируется модуль дерева
        if (!window.Tree || !Tree.page) {
          try { await waitFor(()=> window.Tree && typeof Tree.page === 'function'); }
          catch(e){ console.warn('Tree still not ready:', e); return; }
        }
        Tree.page();
        break;
      case 'calendar': Calendar.page(); break;
      case 'groups':   Groups.page(); break;
      case 'profile':  Profile.page(); break;
      default:         Feed.page();
    }
  };
})();
