
window.Admin = (function(){
  function page(){
    UI.title('Админка');
    UI.action('');
    const v = UI.view();
    v.innerHTML = `<div class="card vstack">
        <div class="section-title">Траур</div>
        <input id="m_name" class="input" placeholder="ФИО усопшего">
        <input id="m_date" class="input" placeholder="Дата похорон (YYYY-MM-DD)">
        <button class="btn" onclick="Admin.addMourning()">Создать траур</button>
      </div>`;
  }
  function addMourning(){
    const name = document.getElementById('m_name').value.trim();
    const date = document.getElementById('m_date').value.trim();
    if(!name||!date){alert('Заполните поля'); return;}
    Events.createMourning('Траур: '+name, date);
    alert('Создано'); Feed.page();
  }
  return { page, addMourning };
})();
