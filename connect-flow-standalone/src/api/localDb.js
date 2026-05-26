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
const INVITES_KEY = DB_PREFIX + 'invites';

function getAuthUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveAuthUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getInvites() {
  try { return JSON.parse(localStorage.getItem(INVITES_KEY) || '[]'); } catch { return []; }
}
function saveInvites(invites) {
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
}

function initDefaultUser() {
  // Sem usuário padrão — primeiro acesso cria conta pelo formulário
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
      saveAuthUsers(users);
      localStorage.setItem(AUTH_KEY, JSON.stringify(users[idx]));
    }
    const { password, ...safeUser } = users[idx] || user;
    return safeUser;
  },

  isLoggedIn: () => {
    return !!localStorage.getItem(AUTH_KEY);
  },

  // Gestão de usuários (admin)
  listUsers: async () => {
    const users = getAuthUsers();
    return users.map(({ password, ...u }) => u);
  },

  createUser: async ({ email, password, full_name, role }) => {
    const users = getAuthUsers();
    if (users.find(u => u.email === email)) throw new Error('E-mail já cadastrado');
    const newUser = {
      id: generateId(),
      email,
      password,
      full_name: full_name || email,
      role: role || 'user',
      created_date: new Date().toISOString(),
      status: 'active',
    };
    saveAuthUsers([...users, newUser]);
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  updateUser: async (id, data) => {
    const users = getAuthUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    users[idx] = { ...users[idx], ...data };
    saveAuthUsers(users);
    const { password, ...safeUser } = users[idx];
    return safeUser;
  },

  deleteUser: async (id) => {
    const users = getAuthUsers();
    saveAuthUsers(users.filter(u => u.id !== id));
    return true;
  },

  // Convites
  createInvite: async ({ email, role }) => {
    const token = 'inv_' + generateId();
    const invites = getInvites();
    const existing = invites.findIndex(i => i.email === email);
    const invite = {
      token,
      email,
      role: role || 'user',
      created_date: new Date().toISOString(),
      expires_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    };
    if (existing !== -1) invites[existing] = invite;
    else invites.push(invite);
    saveInvites(invites);
    const inviteUrl = window.location.origin + '/aceitar-convite?token=' + token;
    return { token, inviteUrl };
  },

  getInvite: async (token) => {
    const invites = getInvites();
    const invite = invites.find(i => i.token === token);
    if (!invite) throw new Error('Convite não encontrado');
    if (new Date(invite.expires_date) < new Date()) throw new Error('Convite expirado');
    if (invite.status === 'accepted') throw new Error('Convite já utilizado');
    return invite;
  },

  acceptInvite: async ({ token, password, full_name }) => {
    const invites = getInvites();
    const idx = invites.findIndex(i => i.token === token);
    if (idx === -1) throw new Error('Convite não encontrado');
    const invite = invites[idx];
    if (new Date(invite.expires_date) < new Date()) throw new Error('Convite expirado');
    if (invite.status === 'accepted') throw new Error('Convite já utilizado');

    const users = getAuthUsers();
    let user = users.find(u => u.email === invite.email);
    if (!user) {
      user = {
        id: generateId(),
        email: invite.email,
        password,
        full_name: full_name || invite.email,
        role: invite.role || 'user',
        created_date: new Date().toISOString(),
        status: 'active',
      };
      saveAuthUsers([...users, user]);
    } else {
      const uidx = users.findIndex(u => u.email === invite.email);
      users[uidx] = { ...users[uidx], password, full_name: full_name || users[uidx].full_name };
      saveAuthUsers(users);
      user = users[uidx];
    }

    invites[idx] = { ...invite, status: 'accepted' };
    saveInvites(invites);

    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  listInvites: async () => {
    return getInvites();
  },

  deleteInvite: async (token) => {
    saveInvites(getInvites().filter(i => i.token !== token));
    return true;
  },
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


