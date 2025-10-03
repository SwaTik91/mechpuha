// assets/js/db.js
(function () {
  // --- PUBLIC API -----------------------------------------------------------
  const DBAPI = {
    /** Инициализация: передай url и anonKey из настроек Supabase */
    init,
    /** Загрузить все данные (users, rels) */
    loadAll,
    /** Поиск пользователя (точный: ФИО + dob) */
    findUserExact,
    /** Поиск по части имени (для подсказок) */
    searchUsers,
    /** Создать пользователя (name, dob, city?) -> user */
    addUser,
    /** Обновить пользователя по id (partial) -> user */
    updateUser,
    /** Добавить связь (type, a, b) */
    addRel,
    /** Удалить связь по id */
    deleteRel,
    /** Полная перезагрузка из БД */
    reloadIntoWindowDB,
      // NEW:
    signUp,
    signIn,
    signOut,
    getSession,
    updatePassword,
  };

  // --- INTERNAL STATE -------------------------------------------------------
  let supabase = null;
  let config = { url: null, anonKey: null };

  // --- IMPLEMENTATION -------------------------------------------------------
  function requireInit() {
    if (!supabase) throw new Error('DBAPI: not initialized. Call DBAPI.init({url, anonKey}) first.');
  }

  async function init({ url, anonKey }) {
    if (!window.supabase) throw new Error('Supabase JS not found. Include @supabase/supabase-js before db.js');
    config = { url, anonKey };
    supabase = window.supabase.createClient(url, anonKey);
    return true;
  }

  async function signUp({ email, password, lastname, firstname, patronymic, dob, city }) {
  requireInit();
  const { data: auth, error: e1 } = await supabase.auth.signUp({ email, password });
  if (e1) throw e1;
  const uid = auth.user?.id;
  const fullName = [lastname, firstname, patronymic].filter(Boolean).join(' ').trim();
  // создаём запись пользователя в таблице users (id = uid)
  const payload = { id: uid, name: fullName, dob: dob || null, city: city || null };
  const { error: e2 } = await supabase.from('users').insert(payload);
  if (e2) throw e2;
  return { id: uid, email };
}

async function signIn({ email, password }) {
  requireInit();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session || null;
}

async function signOut() {
  requireInit();
  await supabase.auth.signOut();
  return true;
}

async function getSession() {
  requireInit();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

async function updatePassword({ oldPassword, newPassword, email }) {
  requireInit();
  // 1) верифицируем старый пароль
  if (email && oldPassword) {
    const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
    if (e1) throw e1;
  }
  // 2) меняем пароль
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return true;
}


  
  async function loadAll() {
    requireInit();
    const [{ data: users, error: eu }, { data: rels, error: er }] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('rels').select('*').order('created_at', { ascending: true }),
    ]);
    if (eu) throw eu;
    if (er) throw er;
    // Приводим даты к ISO yyyy-mm-dd (если приходят с временем)
    const norm = (d) => (d ? String(d).slice(0, 10) : undefined);
    const U = (users || []).map(u => ({
      id: u.id,
      name: u.name,
      dob: norm(u.dob),
      dod: norm(u.dod),
      city: u.city || ''
    }));
    const R = (rels || []).map(r => ({
      id: r.id,
      type: r.type,
      a: r.a,
      b: r.b
    }));
    return { users: U, rels: R };
  }

  async function findUserExact(name, dob) {
    requireInit();
    let q = supabase.from('users').select('*').eq('name', name);
    if (dob) q = q.eq('dob', dob);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error; // ignore "Results contain 0 rows"
    return data ? mapUser(data) : null;
  }

  async function searchUsers(query, limit = 12) {
    requireInit();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);
    if (error) throw error;
    return (data || []).map(mapUser);
  }

  async function addUser({ name, dob, city }) {
    requireInit();
    const payload = { name, dob: dob || null, city: city || null };
    const { data, error } = await supabase.from('users').insert(payload).select().single();
    if (error) throw error;
    return mapUser(data);
  }

  async function updateUser(id, patch) {
    requireInit();
    const payload = {};
    if ('name' in patch) payload.name = patch.name;
    if ('dob' in patch) payload.dob = patch.dob || null;
    if ('dod' in patch) payload.dod = patch.dod || null;
    if ('city' in patch) payload.city = patch.city || null;

    const { data, error } = await supabase.from('users').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return mapUser(data);
  }

  async function addRel({ type, a, b }) {
    requireInit();
    const { data, error } = await supabase.from('rels').insert({ type, a, b }).select().single();
    if (error) throw error;
    return { id: data.id, type: data.type, a: data.a, b: data.b };
  }

  async function deleteRel(id) {
    requireInit();
    const { error } = await supabase.from('rels').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async function reloadIntoWindowDB() {
    const { users, rels } = await loadAll();
    window.DB = window.DB || {};
    window.DB.users = users;
    window.DB.rels = rels;
    // currentUserId оставляем как есть (из localStorage/логина)
    return window.DB;
  }

  // --- helpers --------------------------------------------------------------
  function mapUser(u) {
    const norm = (d) => (d ? String(d).slice(0, 10) : undefined);
    return { id: u.id, name: u.name, dob: norm(u.dob), dod: norm(u.dod), city: u.city || '' };
  }

  // expose
  window.DBAPI = DBAPI;
})();
