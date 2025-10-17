/*
  assets/js/db.js — версия для MVP (каждый пользователь видит только своё древо)

  Требования в Supabase:
    - таблица public.persons (
        id uuid primary key default gen_random_uuid(),
        owner_auth uuid references auth.users(id) on delete cascade,
        name text,
        dob date,
        city text,
        is_deceased boolean default false,
        created_at timestamp default now()
      )

    - таблица public.person_rels (
        id uuid primary key default gen_random_uuid(),
        owner_auth uuid references auth.users(id) on delete cascade,
        a uuid references public.persons(id) on delete cascade,
        b uuid references public.persons(id) on delete cascade,
        rel_type text,
        created_at timestamp default now()
      )

    - функция ensure_me(p_name text default 'Я') returns uuid
      создаёт или возвращает «своего» пользователя:
        select id from persons where owner_auth = auth.uid() limit 1;
        если нет → insert into persons(name, owner_auth) values (p_name, auth.uid()) returning id;

    - RLS:
        enable row level security;
        policy select_own on persons for select using (owner_auth = auth.uid());
        policy modify_own on persons for all using (owner_auth = auth.uid());
        аналогично для person_rels
*/

console.log('[db.js] init');

// создаём клиент Supabase (UMD версия)
const sb = window.supabase.createClient(window.__SUPA_URL__, window.__SUPA_ANON__);

// глобальный объект DBAPI
window.DBAPI = {

  // гарантирует, что у текущего пользователя есть запись «Я»
  async ensureMe(name = 'Я') {
    const { data, error } = await sb.rpc('ensure_me', { p_name: name });
    if (error) throw error;
    console.log('[ensureMe] got id', data);
    return data; // uuid
  },

  // загружает всех людей и связи из моей приватной области
  async loadAll() {
    const [{ data: persons, error: e1 }, { data: rels, error: e2 }] = await Promise.all([
      sb.from('persons').select('*').order('created_at', { ascending: true }),
      sb.from('person_rels').select('*')
    ]);
    if (e1) throw e1;
    if (e2) throw e2;

    window.DB = window.DB || {};
    DB.users = persons || [];
    DB.rels  = (rels || []).map(r => ({ a: r.a, b: r.b, type: r.rel_type }));
    console.log('[DBAPI.loadAll]', DB.users.length, 'users /', DB.rels.length, 'rels');
    return DB;
  },

  // добавляет нового человека
  async addPerson(p) {
    const payload = {
      name: p.name,
      dob: p.dob || null,
      city: p.city || null,
      is_deceased: !!p.is_deceased
    };
    const { data, error } = await sb.from('persons')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    console.log('[DBAPI.addPerson]', data);
    return data;
  },

  // добавляет связь
  async addRel(row) {
    const { error } = await sb.from('person_rels')
      .insert({ a: row.a, b: row.b, rel_type: row.type });
    if (error) throw error;
    console.log('[DBAPI.addRel]', row);
  },

  // удаляет связь
  async removeRel(row) {
    const { error } = await sb.from('person_rels')
      .delete()
      .match({ a: row.a, b: row.b, rel_type: row.type });
    if (error) throw error;
    console.log('[DBAPI.removeRel]', row);
  },

  // перезагрузка в window.DB
  async reloadIntoWindowDB() {
    return this.loadAll();
  },
};

// для отладки можно вызвать из консоли:
// DBAPI.ensureMe().then(id=>{DB.currentUserId=id;DBAPI.loadAll();})
