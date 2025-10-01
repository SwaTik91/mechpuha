window.UI = (function(){
  const view   = ()=>document.getElementById('view');
  const title  = t => document.getElementById('title').textContent = t||"MishpuchaTech";
  const action = html => document.getElementById('header-action').innerHTML = html||"";

  const sheetEl    = ()=>document.getElementById('sheet');
  const backdropEl = ()=>document.getElementById('backdrop');

  // Показ шторки: убираем hidden, добавляем visible (на всякий)
  const sheet = (html)=>{
    document.getElementById('sheet-content').innerHTML = html;
    sheetEl().classList.remove('hidden');
    backdropEl().classList.remove('hidden');
    sheetEl().classList.add('visible');
    backdropEl().classList.add('visible');
  };

  // Закрытие шторки: убираем visible, добавляем hidden (обратно)
  const close = ()=>{
    sheetEl().classList.remove('visible');
    backdropEl().classList.remove('visible');
    sheetEl().classList.add('hidden');
    backdropEl().classList.add('hidden');
  };

  // Закрытие по клику на фон и по Esc
  window.addEventListener('load', ()=>{
    backdropEl().addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
  });

  // Роутер остаётся как есть
  window.route = function(tab){
    switch(tab){
      case 'feed':     Feed.page(); break;
      case 'tree':     Tree.page(); break;
      case 'calendar': Calendar.page(); break;
      case 'groups':   Groups.page(); break;
      case 'profile':  Profile.page(); break;
      default:         Feed.page();
    }
  };

  return {view, title, action, sheet, close};
})();
