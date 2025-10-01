
window.UI = (function(){
  const view = ()=>document.getElementById('view');
  const title = t => document.getElementById('title').textContent = t||"MishpuchaTech";
  const action = html => document.getElementById('header-action').innerHTML = html||"";
  const sheet = (html)=>{
    document.getElementById('sheet-content').innerHTML = html;
    document.getElementById('sheet').classList.remove('hidden');
    document.getElementById('backdrop').classList.remove('hidden');
  };
  const close = ()=>{
    document.getElementById('sheet').classList.add('hidden');
    document.getElementById('backdrop').classList.add('hidden');
  };
  document.getElementById('backdrop').addEventListener('click', close);
  return {view, title, action, sheet, close};
})();
