// Supabase removido conforme solicitado.
// Este arquivo permanece apenas para evitar erros de importação em arquivos não migrados, 
// mas não executa nenhuma conexão real.

export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    admin: {
      createUser: () => Promise.resolve({ data: { user: null }, error: null }),
      inviteUserByEmail: () => Promise.resolve({ data: { user: null }, error: null }),
      deleteUser: () => Promise.resolve({ error: null })
    }
  }
};