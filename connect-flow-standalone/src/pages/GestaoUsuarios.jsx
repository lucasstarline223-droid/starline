import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, UserPlus, Trash2, Shield, User, Copy, Check, RefreshCw, Crown, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function GestaoUsuarios() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('usuarios');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Edit user
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      setCurrentUser(me);
      const u = await base44.auth.listUsers();
      setUsers(u);
      const inv = await base44.auth.listInvites();
      setInvites(inv);
    } finally { setLoading(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { inviteUrl } = await base44.auth.createInvite({ email: inviteEmail, role: inviteRole });
      setInviteLink(inviteUrl);
      await load();
    } finally { setInviting(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Remover este usuário?')) return;
    await base44.auth.deleteUser(id);
    await load();
  };

  const handleDeleteInvite = async (token) => {
    await base44.auth.deleteInvite(token);
    await load();
  };

  const handleUpdateUser = async (id) => {
    await base44.auth.updateUser(id, { full_name: editName, role: editRole });
    setEditingId(null);
    await load();
  };

  const isAdmin = currentUser?.role === 'admin';

  const roleColor = (role) => role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600';
  const roleIcon = (role) => role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />;
  const inviteStatusColor = (status) => status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';

  if (!isAdmin && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Acesso restrito</p>
          <p className="text-slate-400 text-sm">Apenas administradores podem gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Gestão de Usuários
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os usuários e convites do sistema</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-1">
        {[['usuarios', 'Usuários', users.length], ['convites', 'Convites', invites.filter(i => i.status === 'pending').length]].map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
            {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Usuários Tab */}
      {tab === 'usuarios' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-slate-400">Nenhum usuário cadastrado</div>
          ) : users.map(u => (
            <div key={u.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(u.full_name || u.email).charAt(0).toUpperCase()}
              </div>
              {editingId === u.id ? (
                <div className="flex-1 flex items-center gap-3">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" placeholder="Nome" />
                  <select value={editRole} onChange={e => setEditRole(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="user">Usuário</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button size="sm" onClick={() => handleUpdateUser(u.id)} className="h-8 text-xs">Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 text-xs">Cancelar</Button>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 text-sm truncate">{u.full_name || '—'}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColor(u.role)}`}>
                      {roleIcon(u.role)} {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                    {u.id === currentUser?.id && <span className="text-xs text-blue-500 font-medium">(você)</span>}
                  </div>
                  <p className="text-slate-400 text-xs truncate">{u.email}</p>
                </div>
              )}
              {editingId !== u.id && u.id !== currentUser?.id && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(u.id); setEditName(u.full_name || ''); setEditRole(u.role); }}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(u.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Convites Tab */}
      {tab === 'convites' && (
        <div className="space-y-5">
          {/* Form de convite */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" /> Convidar novo usuário
            </h3>
            <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="email@empresa.com" required className="flex-1 min-w-48" />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit" disabled={inviting} className="gap-2">
                <Mail className="w-4 h-4" /> {inviting ? 'Gerando...' : 'Gerar convite'}
              </Button>
            </form>

            {inviteLink && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-medium text-green-800 mb-2">✅ Link de convite gerado! Copie e envie para o usuário:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border border-green-200 rounded px-2 py-1.5 text-green-900 break-all">{inviteLink}</code>
                  <button onClick={copyLink} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {copied ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de convites */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-700 text-sm">Convites enviados</h3>
            {invites.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">Nenhum convite enviado ainda</div>
            ) : invites.map(inv => (
              <div key={inv.token} className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center gap-4 shadow-sm">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inviteStatusColor(inv.status)}`}>
                      {inv.status === 'pending' ? 'Pendente' : 'Aceito'}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{inv.role}</span>
                    <span className="text-xs text-slate-400">· Expira {new Date(inv.expires_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                {inv.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setInviteLink(window.location.origin + '/aceitar-convite?token=' + inv.token); setTab('convites'); }}
                      className="h-8 text-xs text-blue-600 hover:bg-blue-50">
                      <Copy className="w-3 h-3 mr-1" /> Link
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteInvite(inv.token)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
