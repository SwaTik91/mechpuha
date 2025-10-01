
window.DB = {
  currentUserId: "u1",
  users: [
    { id:"u1", name:"Шальмиев", dob:"1985-05-10", city:"Москва", photo:"", origin:"Дербент" },
    { id:"u2", name:"Шальмиева Анна", dob:"1987-07-21", city:"Москва", photo:"" },
    { id:"u3", name:"Шальмиева Николь", dob:"1990-02-14", city:"Москва", photo:"" },
    { id:"u4", name:"Ицхак Абрамов", dob:"1958-01-02", city:"Москва" },
    { id:"u5", name:"Сара Абрамова", dob:"1961-08-12", city:"Москва" },
    { id:"u6", name:"Давид Шальмиев", dob:"2014-09-03", city:"Москва" }
  ],
  rels: [
    {type:"spouse", a:"u1", b:"u2"},
    {type:"sibling", a:"u1", b:"u3"},
    {type:"parent", a:"u4", b:"u1"}, /* u4 -> parent of u1 */
    {type:"parent", a:"u5", b:"u1"},
    {type:"child", a:"u1", b:"u6"}   /* u6 is child of u1 */
  ],
  groups: [
    {id:"g1", name:"Семья Шальмиевых", last:"Фото с Шаббата"},
    {id:"g2", name:"Выпускники 2005", last:"Встреча в пятницу"}
  ],
  messages: {
    g1: [{from:"Анна", text:"Завтра в 19:00 у мамы!", ts:"16:10"}],
    g2: [{from:"Николь", text:"Кто идёт на встречу?", ts:"15:22"}]
  },
  synagogues: [
    {id:"s1", name:"Синагога «Дербент»", city:"Москва", schedule:[
      {day:"Пн–Чт", time:"07:30 Шахарит"},
      {day:"Пт", time:"18:30 Каббат Шаббат"},
      {day:"Сб", time:"09:00 Шахарит"}
    ]}
  ],
  events: [
    {id:"e1", type:"wedding", title:"Свадьба Давида и Леи", date:"2025-10-10", place:"Парадайз", owner:"u1"},
    {id:"e2", type:"mourning", title:"Похороны Ицхака", date:"2025-10-05", person:"u4"}
  ],
  invites: ["MT-ABCD-2025"]
};
