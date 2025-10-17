/*
  assets/js/db.js — финальная версия для MVP MishpuchaTech
  ---------------------------------------------------------
  ✔ Работает с Supabase (UMD-версия SDK)
  ✔ Оборачивает auth (signUp, signIn, getSession и т.д.)
  ✔ Реализует работу с таблицами persons / person_rels (приватное древо)
  ✔ Никаких import/export — просто <script defer src="...">

  Требования в Supabase:
    ▪ таблица public.persons (
         id uuid primary key default gen_random_uuid(),
         owner_auth uuid references auth.users(id) on delete cascade,
         name text,
         dob date,
         city text,
         is_deceased boolean default false,
         created_at timestamp default now()
       );

    ▪ таблица public.person_rels (
         id uuid primary key default gen_random_uuid(),
         owner_auth uuid references auth.users(id) on delete cascade,
         a uuid references public.persons(id) on delete cascade,
         b uuid references public.persons(id) on delete cascade,
         rel_type text,
         created_at timestamp default now()
       );

    ▪ функция ensure_me(p_name text default 'Я') returns uuid
         возвращает id своей персоны или создаёт новую (owner_auth = auth.uid()).

    ▪ RLS:
         enable row level security;
         policy select_own on persons for select using (owner_auth = auth.uid());
         policy modify_own on persons for all using (owner_auth = auth.uid());
         (аналогично для person_rels)
*/

console.log('[db.js] init');

// ── Supabase UMD client
if (!window.supabase) {
  console.error('[db.js] Supabase SDK не найден — проверь <script src=\"@supabase/supabase-js\">");
}
const sb = window.supabase.createClient(window.__SUPA_URL__, window.__SUPA_ANON__);
window.__sb__ = sb; // для отладки в консоли

// ── Глобальный API
window.DBAPI = {
  // ---------- AUTH ----------
  async signUp(emailOrObj, passwordMaybe) {
    const email = typeof emailOrObj === 'string' ? emailOrObj : emailOrObj?.email;
    const password = typeof emailOrObj === 'string' ? passwordMaybe : emailOrObj?.password;
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    return data; // { user, session }
  },

  async signIn(emailOrObj, passwordMaybe) {
    const email = typeof emailOrObj === 'string' ? emailOrObj : emailOrObj?.email;
    const password = typeof emailOrObj === 'string' ? passwordMaybe : emailOrObj?.password;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  },

  async getUser() {
    const { data, error } = await sb.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  },

  async getSession() {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    return data; // { session, user }
  },

  onAuthStateChange(callback) {
    return sb.auth.onAuthStateChange((_event, session) => callback?.(session));
  },
  // ---------- /AUTH ----------

  // гарантирует наличие своей персоны «Я»
  async ensureMe(name = 'Я') {
    const { data, error } = await sb.rpc('ensure_me', { p_name: name });
    if (error) throw error;
    console.log('[ensureMe] →', data);
    return data; // uuid
  },

  // загрузка всех персон и связей (только своих)
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

    console.log(`[DBAPI.loadAll] ${DB.users.length} persons, ${DB.rels.length} rels`);
    return DB;
  },

  // добавление человека
  async addPerson(p) {
    const payload = {
      name: p.name,
      dob: p.dob || null,
      city: p.city || null,
      is_deceased: !!p.is_deceased
    };
    const { data, error } = await sb
      .from('persons')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    console.log('[DBAPI.addPerson]', data);
    return data;
  },

  // добавление связи
  async addRel(row) {
    const { error } = await sb
      .from('person_rels')
      .insert({ a: row.a, b: row.b, rel_type: row.type });
    if (error) throw error;
    console.log('[DBAPI.addRel]', row);
  },

  // удаление связи
  async removeRel(row) {
    const { error } = await sb
      .from('person_rels')
      .delete()
      .match({ a: row.a, b: row.b, rel_type: row.type });
    if (error) throw error;
    console.log('[DBAPI.removeRel]', row);
  },

  // перезагрузка
  async reloadIntoWindowDB() {
    return this.loadAll();
  },
};

// ── Быстрый тест из консоли:
// DBAPI.signIn('mail@example.com','pass')
//   .then(()=>DBAPI.ensureMe('Я'))
//   .then(id=>{DB.currentUserId=id;return DBAPI.loadAll();})
//   .then(()=>Tree.page());
