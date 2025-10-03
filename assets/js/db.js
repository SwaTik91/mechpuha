// assets/js/db.js
(function(){
  let supabase = null;

  function requireInit(){
    if(!supabase) throw new Error('Supabase is not initialized');
  }

  async function init({ url, anonKey }){
    if(!url || !anonKey) throw new Error('Missing Supabase config');
    supabase = window.supabase.createClient(url, anonKey);
    window.supabase = supabase; // экспорт для resend() и т.п.
    return true;
  }

  // --------- AUTH ---------
  async function signUp({ email, password, lastname, firstname, patronymic, dob, city }){
    requireInit();
    const { data: auth, error: e1 } = await supabase.auth.signUp({
      email, password,
      // Если вернёшь подтверждение e-mail, добавь emailRedirectTo:
      // options: { emailRedirectTo: window.location.origin }
    });
    if (e1) throw e1;
    const uid = auth.user?.id;
    if (!uid) throw new Error('No user id from auth.signUp');

    const name = [lastname, firstname, patronymic].filter(Boolean).join(' ').trim();
    const payload = { id: uid, name, dob: dob || null, city: city || null };
    const { error: e2 } = await supabase.from('users').insert(payload);
    if (e2) throw e2;
    return { id: uid, email };
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
    try{
      if (email && oldPassword) {
        const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
        if (e1) throw e1;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return true;
    }catch(e){ throw e; }
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
  async function addUser({ id, name, dob, city }){
    requireInit();
    const payload = { name, dob: dob || null, city: city || null };
    if (id) payload.id = id;
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
    addUser, updateUser, findUserExact, searchUsers,
    addRel, deleteRel
  };
})();
