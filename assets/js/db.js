/*
  Minimal DB layer for the MVP: each user has a private "garden" (persons + person_rels)
  Requirements on DB (run once in Supabase SQL):
    - tables: public.persons, public.person_rels
    - RPC: public.ensure_me(p_name text default 'Я') returns uuid
    - RLS: owner_auth = auth.uid() on both tables

  Usage after auth:
    DB.currentUserId = await DBAPI.ensureMe('Ваше имя');
    await DBAPI.loadAll();
    Tree.page();
*/

export const DBAPI = {
  // Ensure "me" person exists for the current auth user and return its UUID
  async ensureMe(name = 'Я') {
    const { data, error } = await supabase.rpc('ensure_me', { p_name: name });
    if (error) throw error;
    return data; // uuid
  },

  // Load all private persons + relations into global DB {users, rels}
  async loadAll() {
    const [{ data: persons, error: e1 }, { data: rels, error: e2 }] = await Promise.all([
      supabase.from('persons').select('*').order('created_at', { ascending: true }),
      supabase.from('person_rels').select('*')
    ]);
    if (e1) throw e1; if (e2) throw e2;
    window.DB = window.DB || {};
    DB.users = persons || [];
    // Normalized rels for tree.js ({a,b,type})
    DB.rels = (rels || []).map(r => ({ a: r.a, b: r.b, type: r.rel_type }));
    return DB;
  },

  // Create a person in my private garden
  async addPerson(p) {
    const payload = {
      name: p.name,
      dob: p.dob || null,
      city: p.city || null,
      is_deceased: !!p.is_deceased
    };
    const { data, error } = await supabase
      .from('persons')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data; // full row from persons
  },

  // Create a relation in my private garden
  async addRel(row) {
    const { error } = await supabase
      .from('person_rels')
      .insert({ a: row.a, b: row.b, rel_type: row.type });
    if (error) throw error;
  },

  async removeRel(row) {
    const { error } = await supabase
      .from('person_rels')
      .delete()
      .match({ a: row.a, b: row.b, rel_type: row.type });
    if (error) throw error;
  },

  // Back-compat alias
  async reloadIntoWindowDB() { return this.loadAll(); },
};
