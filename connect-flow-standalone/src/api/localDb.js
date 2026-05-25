// ============================================================
// LOCAL DATABASE - Substitui o @base44/sdk
// Usa localStorage para persistência de dados
// ============================================================

const DB_PREFIX = 'cfcrm_';

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getCollection(name) {
  try {
    const data = localStorage.getItem(DB_PREFIX + name);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCollection(name, data) {
  localStorage.setItem(DB_PREFIX + name, JSON.stringify(data));
}

function createEntityApi(entityName) {
  return {
    list: async (options = {}) => {
      let items = getCollection(entityName);
      return items;
    },

    filter: async (filters = {}, options = {}) => {
      let items = getCollection(entityName);
      if (filters && Object.keys(filters).length > 0) {
        items = items.filter(item => {
          return Object.entries(filters).every(([key, value]) => {
            if (Array.isArray(value)) return value.includes(item[key]);
            return item[key] === value;
          });
        });
      }
      if (options.sort) {
        const [field, dir] = options.sort.split(' ');
        items = [...items].sort((a, b) => {
          if (a[field] < b[field]) return dir === 'desc' ? 1 : -1;
          if (a[field] > b[field]) return dir === 'desc' ? -1 : 1;
          return 0;
        });
      }
      if (options.limit) items = items.slice(0, options.limit);
      return items;
    },

    get: async (id) => {
      const items = getCollection(entityName);
      return items.find(i => i.id === id) || null;
    },

    create: async (data) => {
      const items = getCollection(entityName);
      const newItem = {
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      items.push(newItem);
      saveCollection(entityName, items);
      return newItem;
    },

    update: async (id, data) => {
      const items = getCollection(entityName);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) throw new Error('Item not found');
      items[idx] = { ...items[idx], ...data, updated_date: new Date().toISOString() };
      saveCollection(entityName, items);
      return items[idx];
    },

    delete: async (id) => {
      const items = getCollection(entityName);
      const filtered = items.filter(i => i.id !== id);
      saveCollection(entityName, filtered);
      return true;
    },

    bulkCreate: async (dataArray) => {
      const items = getCollection(entityName);
      const newItems = dataArray.map(data => ({
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      }));
      items.push(...newItems);
      saveCollection(entityName, items);
      return newItems;
    },

    bulkUpdate: async (updates) => {
      const items = getCollection(entityName);
      updates.forEach(({ id, data }) => {
        const idx = items.findIndex(i => i.id === id);
        if (idx !== -1) items[idx] = { ...items[idx], ...data, updated_date: new Date().toISOString() };
      });
      saveCollection(entityName, items);
      return items;
    },
  };
}

// Auth simples baseado em localStorage
const AUTH_KEY = DB_PREFIX + 'current_user';
const USERS_KEY = DB_PREFIX + 'auth_users';

function getAuthUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch { return []; }
}

function initDefaultUser() {
  const users = getAuthUsers();
  if (users.length === 0) {
    const defaultUser = {
      id: 'user_admin',
      email: 'admin@connectflow.com',
      password: 'admin123',
      full_name: 'Administrador',
      role: 'admin',
      created_date: new Date().toISOString(),
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser]));
  }
}

const auth = {
  me: async () => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) throw new Error('Not authenticated');
    const user = JSON.parse(stored);
    const { password, ...safeUser } = user;
    return safeUser;
  },

  login: async (email, password) => {
    initDefaultUser();
    const users = getAuthUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Credenciais inválidas');
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  logout: (redirectUrl) => {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = '/login';
  },

  redirectToLogin: (returnUrl) => {
    window.location.href = '/login';
  },

  updateMe: async (data) => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) throw new Error('Not authenticated');
    const user = JSON.parse(stored);
    const users = getAuthUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(AUTH_KEY, JSON.stringify(users[idx]));
    }
    const { password, ...safeUser } = users[idx] || user;
    return safeUser;
  },

  isLoggedIn: () => {
    return !!localStorage.getItem(AUTH_KEY);
  }
};

const functions = {
  invoke: async (name, payload) => {
    console.log(`[LocalDB] Function invoked: ${name}`, payload);
    // Stub para funções do base44 - retorna resposta simulada
    const stubs = {
      generateProspectSummary: { summary: 'Resumo gerado localmente.' },
      calculateProspectScore: { score: 75, details: {} },
      suggestNextSteps: { steps: ['Agendar reunião', 'Enviar proposta'] },
      notifyAeOnQualifiedProspect: { sent: true },
      autoCreateFollowupTask: { task: null },
      notificarAdminChecklist: { sent: true },
      gerarOrdemServico: { pdf_url: null, message: 'Função não disponível no modo offline' },
      notifyOnChamadoResolved: { sent: true },
      consultarChamadoPublico: { chamado: null },
      criarChamadoPublico: { chamado: null },
      resolverEnderecoMaps: { address: payload?.address || '' },
      sincronizarNumerosDID: { synced: 0 },
      handleHandoffConcluido: { done: true },
      notificarFinanceiroHandoff: { sent: true },
      linkDidToClient: { linked: true },
      importarContatos: { imported: 0 },
      importarClientes: { imported: 0 },
      notificarTecnicoAtivacao: { sent: true },
      importarNumerosDID: { imported: 0 },
      convertLeadToProspect: { prospect: null },
      importarProdutosCsv: { imported: 0 },
    };
    return stubs[name] || { success: true };
  }
};

// Entidades disponíveis
const entities = {
  Client: createEntityApi('Client'),
  Contact: createEntityApi('Contact'),
  Deal: createEntityApi('Deal'),
  Lead: createEntityApi('Lead'),
  Prospect: createEntityApi('Prospect'),
  Chamado: createEntityApi('Chamado'),
  Cancelamento: createEntityApi('Cancelamento'),
  Cobranca: createEntityApi('Cobranca'),
  Contrato: createEntityApi('Contrato'),
  Fornecedor: createEntityApi('Fornecedor'),
  HandoffSDD: createEntityApi('HandoffSDD'),
  Hardware: createEntityApi('Hardware'),
  ItemHardware: createEntityApi('ItemHardware'),
  ItemServico: createEntityApi('ItemServico'),
  NumeroDID: createEntityApi('NumeroDID'),
  NumeroDIDPricing: createEntityApi('NumeroDIDPricing'),
  Onboarding: createEntityApi('Onboarding'),
  Portabilidade: createEntityApi('Portabilidade'),
  ProdutoServico: createEntityApi('ProdutoServico'),
  RequisicaoCompraHardware: createEntityApi('RequisicaoCompraHardware'),
  SdrActivity: createEntityApi('SdrActivity'),
  SdrChecklistItem: createEntityApi('SdrChecklistItem'),
  SdrTask: createEntityApi('SdrTask'),
  User: createEntityApi('User'),
  UserFavorite: createEntityApi('UserFavorite'),
  EstoqueTecnico: createEntityApi('EstoqueTecnico'),
  EquipamentoAlocado: createEntityApi('EquipamentoAlocado'),
};

export const base44 = { auth, entities, functions };
export { auth, entities, functions };

// Inicializa usuário padrão
initDefaultUser();
