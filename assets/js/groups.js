
window.Groups = (function(){
  function page(){
    UI.title('Группы и чаты');
    UI.action('<button class="btn ghost" onclick="Groups.create()">Создать группу</button>');
    const v = UI.view();
    v.innerHTML = `<div class="list">${DB.groups.map(g=>`
      <div class="item" onclick="Groups.open('${g.id}')"><div class="vstack"><div><b>${g.name}</b></div><div class="small">${g.last||''}</div></div></div>`).join('')}</div>`;
  }
  function open(id){
    const g = DB.groups.find(x=>x.id===id);
    const msgs = (DB.messages[id]||[]);
    UI.sheet(`<div class="vstack">
      <div class="section-title">${g.name}</div>
      <div id="chat" class="vstack" style="max-height:50vh; overflow:auto">${msgs.map(m=>`<div class="card"><b>${m.from}</b><div class="small">${m.ts}</div><div>${m.text}</div></div>`).join('')}</div>
      <div class="hstack"><input id="m" class="input" placeholder="Сообщение"><button class="btn" onclick="Groups.send('${id}')">Отправить</button></div>
    </div>`);
  }
  function send(id){
    const v = document.getElementById('m').value.trim(); if(!v) return;
    DB.messages[id] = DB.messages[id]||[];
    DB.messages[id].push({from:"Вы", text:v, ts:new Date().toLocaleTimeString().slice(0,5)});
    open(id);
  }
  function create(){
    UI.sheet(`<div class="vstack">
      <div class="section-title">Новая группа</div>
      <input id="gname" class="input" placeholder="Название">
      <button class="btn" onclick="(function(){ const n=document.getElementById('gname').value.trim(); if(!n) return; DB.groups.push({id:'g'+(DB.groups.length+1), name:n}); UI.close(); Groups.page(); })()">Создать</button>
    </div>`);
  }
  return { page, open, send, create };
})();
