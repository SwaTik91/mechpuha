/*
  assets/js/db.js — MVP: личное древо (persons + person_rels) и обёртки Auth.

  Требуется в Supabase:
    • public.persons, public.person_rels (RLS owner_auth = auth.uid())
    • RPC public.ensure_me(p_name text default 'Я') returns uuid
*/

console.log('[db.js] init');

// ── Supabase UMD клиент
if (!window.supabase) {
  console.error('[db.js] Supabase SDK не найден — проверь <script src="@supabase/supabase-js">');
}
const sb = window.supabase.createClient(window.__SUPA_URL__, window.__SUPA_ANON__);
window.__sb__ = sb; // на всякий для отладки из консоли

// ── Глобальный API
window.DBAPI = {
  // ---------- AUTH (совместимо со старым auth.js) ----------
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
  // ----------------------------------------------------------

  // гарантирует наличие собственной персоны «Я» и возвращает её uuid
  async ensureMe(name = 'Я') {
    const { data, error } = await sb.rpc('ensure_me', { p_name: name });
    if (error) throw error;
    console.log('[ensureMe] →', data);
    return data; // uuid
  },

  // загрузка всех моих персон и связей
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

  // создание персоны
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

  // бэк-компат alias
  async reloadIntoWindowDB() { return this.loadAll(); },
};

// Подсказка для быстрого старта из консоли:
// DBAPI.signIn('mail@example.com','pass').then(()=>DBAPI.ensureMe('Я')).then(id=>{DB.currentUserId=id; return DBAPI.loadAll();}).then(()=>Tree.page());
