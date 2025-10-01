
// Tab routing
(function(){
  const tabs = document.querySelectorAll('.tabbar .tab');
  tabs.forEach(btn=>btn.addEventListener('click', ()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.getAttribute('data-tab');
    route(tab);
  }));

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

  // First-run: invite gate (MVP registration)
  if(!localStorage.getItem('mt_invited')){
    UI.sheet(`
      <div class="vstack">
        <div class="section-title">Вход по инвайту</div>
        <input id="invite" class="input" placeholder="Код приглашения">
        <button class="btn" onclick="(function(){ 
          const code=document.getElementById('invite').value.trim();
          if(DB.invites.includes(code)){ localStorage.setItem('mt_invited','1'); UI.close(); } 
          else { alert('Неверный инвайт'); } 
        })()">Продолжить</button>
      </div>
    `);
  }

  // default tab
  route('feed');
})();
