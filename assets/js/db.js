// assets/js/db.js
(function(){
  let supabase = null;

  function requireInit(){
    if(!supabase) throw new Error('Supabase is not initialized');
  }

  async function init({ url, anonKey }){
    if(!url || !anonKey) throw new Error('Missing Supabase config');
    supabase = window.supabase.createClient(url, anonKey);
    window.supabase = supabase;
    return true;
  }

  // --------- AUTH ---------
  async function signUp({ email, password, lastname, firstname, patronymic, dob, city }){
    requireInit();
    // 1) создаём аккаунт
    const { data: auth, error: e1 } = await supabase.auth.signUp({ email, password });
    if (e1) throw e1;
    const uid = auth.user?.id;
    if (!uid) throw new Error('No user id from auth.signUp');

    const name = [lastname, firstname, patronymic].filter(Boolean).join(' ').trim() || email;

    // 2) пробуем "забрать" существующий черновик по (name+dob)
    let claimedId = null;
    try{
      const { data, error } = await supabase.rpc('claim_placeholder', { p_name: name, p_dob: dob || null });
      if (error) console.warn('claim_placeholder error', error);
      if (data) claimedId = data;
    }catch(e){ console.warn('claim_placeholder failed', e); }

    if (claimedId) {
      // обновим данные карточки (auth_id уже проставлен на стороне БД)
      const patch = { name, dob: dob || null, city: city || null, is_placeholder: false };
      const { data, error } = await supabase.from('users').update(patch).eq('id', claimedId).select().single();
      if (error) throw error;
      return { id: claimedId, email };
    }

    // 3) черновик не найден → создаём полноценный профиль, привязанный к аккаунту
    const payload = {
      auth_id: uid,
      name,
      dob: dob || null,
      city: city || null,
      is_placeholder: false,
      is_deceased: false,
      created_by_auth: uid
    };
    const { data: row, error: e2 } = await supabase.from('users').insert(payload).select().single();
    if (e2) throw e2;
    return { id: row.id, email };
  }

  async function signIn({ email, password }){
    requireInit();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session || null;
  }

  async function signOut(){
    requireInit();
    await supabase.auth.signOut();
    return true;
  }

  async function getSession(){
    requireInit();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function updatePassword({ oldPassword, newPassword, email }){
    requireInit();
    if (email && oldPassword) {
      const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
      if (e1) throw e1;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  }

  // --------- DATA LOADING ---------
  async function loadAll(){
    requireInit();
    const { data: users, error: e1 } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    if (e1) throw e1;
    const { data: rels, error: e2 }  = await supabase.from('rels').select('*').order('id', { ascending: true });
    if (e2) throw e2;
    return { users, rels };
  }

  async function reloadIntoWindowDB(){
    const { users, rels } = await loadAll();
    window.DB.users = users || [];
    window.DB.rels  = rels  || [];
    return true;
  }

  // --------- USERS ---------
  // Создание "черновика" родственника (без аккаунта)
  async function addUserPlaceholder({ name, dob, city, is_deceased }){
    requireInit();
    const session = await getSession();
    const uid = session?.user?.id;
    if (!uid) throw new Error('Not authenticated');

    const payload = {
      name: name || '(без имени)',
      dob: dob || null,
      city: city || null,
      is_placeholder: true,
      is_deceased: !!is_deceased,
      created_by_auth: uid,
      auth_id: null
    };
    const { data, error } = await supabase.from('users').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async function addUser({ id, name, dob, city }){
    // оставляем как "полный" профиль (редко нужен напрямую)
    requireInit();
    const session = await getSession();
    const uid = session?.user?.id;
    if (!uid) throw new Error('Not authenticated');

    const payload = {
      auth_id: uid,
      name, dob: dob || null, city: city || null,
      is_placeholder: false, is_deceased: false,
      created_by_auth: uid
    };
    const { data, error } = await supabase.from('users').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async function updateUser(id, patch){
    requireInit();
    const { data, error } = await supabase.from('users').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function findUserExact(name, dob){
    requireInit();
    let q = supabase.from('users').select('*').eq('name', name);
    if (dob) q = q.eq('dob', dob);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function searchUsers(query){
    requireInit();
    if (!query) return [];
    const { data, error } = await supabase.from('users')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(25);
    if (error) throw error;
    return data || [];
  }

  // --------- RELS ---------
  async function addRel({ type, a, b }){
    requireInit();
    const { data, error } = await supabase.from('rels').insert({ type, a, b }).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteRel(id){
    requireInit();
    const { error } = await supabase.from('rels').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  window.DBAPI = {
    init, getSession, signUp, signIn, signOut, updatePassword,
    loadAll, reloadIntoWindowDB,
    addUser, addUserPlaceholder, updateUser, findUserExact, searchUsers,
    addRel, deleteRel
  };
})();
