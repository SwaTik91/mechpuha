
(function(){
  if(!localStorage.getItem('mt_invited')){
    UI.sheet(`<div class="vstack">
      <div class="section-title">Вход по инвайту</div>
      <input id="invite" class="input" placeholder="Код приглашения">
      <button class="btn" onclick="(function(){ const code=document.getElementById('invite').value.trim(); if(DB.invites.includes(code)){ localStorage.setItem('mt_invited','1'); UI.close(); } else { alert('Неверный инвайт'); } })()">Продолжить</button>
    </div>`);
  }
})();
