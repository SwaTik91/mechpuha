// assets/js/app.js
(function(){
  // универсальная навигация
  window.route = async function(tab){
    switch(tab){
      case 'profile':    Profile.page(); break;
      case 'synagogues': Synagogues.page(); break;
      case 'tree':       Tree.page(); break;
      case 'invites':    Invites.page(); break;
      case 'messages':   Messages.page(); break;
      case 'calendar':   Calendar.page(); break;
      default:           Profile.page();
    }
  };

  window.App = window.App || {};
  App.afterAuth = async function(){
    try{
      const { users, rels } = await DBAPI.loadAll();
      window.DB.users = users || [];
      window.DB.rels  = rels  || [];
    }catch(e){
      console.warn('LoadAll failed, fallback to local data', e);
      window.DB.users = window.DB.users || [];
      window.DB.rels  = window.DB.rels  || [];
    }
    const session = await DBAPI.getSession();
    const uid = session?.user?.id;
    if (uid) window.DB.currentUserId = uid;
    route('profile');
  };

  window.addEventListener('load', async ()=>{
    // на всякий: чистим старые флаги
    try { localStorage.removeItem('mt_user'); } catch {}
    // таббар
    const tabs = document.querySelectorAll('.tabbar .tab');
    tabs.forEach(btn=>btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      route(btn.getAttribute('data-tab'));
    }));

    // инициализация Supabase и старт
    try {
      await DBAPI.init({ url: window.__SUPA_URL__, anonKey: window.__SUPA_ANON__ });

      // если вернёшь email-confirm — можно слушать событие:
      // window.supabase.auth.onAuthStateChange(async (event) => {
      //   if (event === 'SIGNED_IN') { UI.close(); await App.afterAuth(); }
      // });

      const session = await DBAPI.getSession();
      if (session?.user) {
        await App.afterAuth();
      } else {
        Auth.openStart(); // новый стартовый экран
      }
    } catch (e) {
      console.warn('Supabase init failed', e);
      Auth.openStart();
    }
  });
})();
