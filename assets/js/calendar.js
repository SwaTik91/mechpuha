// assets/js/calendar.js
window.Calendar = (function(){
  function page(){
    UI.title('Календарь');
    UI.action('<button class="btn ghost" onclick="Events.openCreate()">Добавить</button>');
    const v = UI.view();

    const me = DB.currentUserId;
    const today = new Date();
    const startY = today.getFullYear();

    const birthdays = (DB.users||[])
      .filter(u => u.dob)
      .map(u => {
        const [y,m,d] = u.dob.split('-').map(Number);
        const next = new Date(startY, m-1, d);
        if (isPast(next, today)) next.setFullYear(startY + 1);
        return {
          kind: 'birthday',
          title: 'День рождения: ' + (u.name||''),
          date: next,
          dateText: formatDate(next),
          place: ''
        };
      });

    const events = (DB.events||[])
      .filter(e => e.owner === me || (e.invited||[]).includes(me))
      .map(e => {
        const dt = parseYMD(e.date);
        const next = dt ? new Date(dt) : new Date(2100,0,1);
        return {
          kind: e.type,
          title: e.title,
          date: next,
          dateText: e.date || '',
          place: e.place || ''
        };
      });

    const items = [...birthdays, ...events].sort((a,b)=> a.date - b.date);
    v.innerHTML = `<div class="list">${
      items.length ? items.map(renderItem).join('') : '<div class="muted">Пока пусто</div>'
    }</div>`;
  }

  function renderItem(e){
    const dot = e.kind==='mourning' ? '#4a4a4a'
              : e.kind==='wedding' ? '#E08E45'
              : e.kind==='brit'    ? '#6C8EAD'
              : e.kind==='barmitzvah' ? '#6C8EAD'
              : '#9AA4B2';
    const place = e.place ? ' • ' + e.place : '';
    return `<div class="item">
      <div style="width:10px;height:10px;border-radius:50%;background:${dot}"></div>
      <div><b>${e.title}</b><div class="small">${e.dateText}${place}</div></div>
    </div>`;
  }

  // helpers
  function parseYMD(s){
    if(!s) return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return null;
    return new Date(+m[1], +m[2]-1, +m[3]);
  }
  function isPast(a,b){ return a.setHours(0,0,0,0) < b.setHours(0,0,0,0); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function formatDate(d){ return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`; }

  return { page };
})();
