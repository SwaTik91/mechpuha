
window.UI = (function(){
  const view = ()=>document.getElementById('view');
  const title = t => document.getElementById('title').textContent = t||"MishpuchaTech";
  const action = html => document.getElementById('header-action').innerHTML = html||"";
  const sheet = (html)=>{ document.getElementById('sheet-content').innerHTML = html;
    document.getElementById('sheet').classList.remove('hidden');
    document.getElementById('backdrop').classList.remove('hidden'); };
  const close = ()=>{ document.getElementById('sheet').classList.add('hidden');
    document.getElementById('backdrop').classList.add('hidden'); };
  window.addEventListener('load', ()=>{
    const tabs = document.querySelectorAll('.tabbar .tab');
    tabs.forEach(btn=>btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); route(btn.getAttribute('data-tab'));
    }));
    route('feed');
  });
  window.route = function(tab){
    switch(tab){ case 'feed': Feed.page(); break; case 'tree': Tree.page(); break; case 'calendar': Calendar.page(); break; case 'groups': Groups.page(); break; case 'profile': Profile.page(); break; default: Feed.page(); }
  }
  return {view, title, action, sheet, close};
})();
