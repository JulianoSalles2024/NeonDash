// MOCK SUPABASE - Modo Offline/Local
// Impede erros ao tentar conectar sem credenciais.

export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) })
  }),
  auth: {
    admin: {
      createUser: () => Promise.resolve({ data: { user: null }, error: null }),
      inviteUserByEmail: () => Promise.resolve({ data: { user: null }, error: null }),
      deleteUser: () => Promise.resolve({ error: null })
    },
    signInWithPassword: () => Promise.resolve({ data: { user: { id: 'mock-user' } }, error: null }),
    signOut: () => Promise.resolve({ error: null })
  }
};