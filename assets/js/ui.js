window.UI = (function(){
  const view = ()=>document.getElementById('view');
  const title = t => document.getElementById('title').textContent = t||"MishpuchaTech";
  const action = html => document.getElementById('header-action').innerHTML = html||"";

  const sheetEl = ()=>document.getElementById('sheet');
  const backdropEl = ()=>document.getElementById('backdrop');

  const sheet = (html)=>{
    document.getElementById('sheet-content').innerHTML = html;
    sheetEl().classList.add('visible');
    backdropEl().classList.add('visible');
  };
  const close = ()=>{
    sheetEl().classList.remove('visible');
    backdropEl().classList.remove('visible');
  };

  // Закрытие по клику на фон и по Esc
  window.addEventListener('load', ()=>{
    backdropEl().addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
  });

  // Роутер не трогаем — он у тебя в app.js
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

  return {view, title, action, sheet, close};
})();
