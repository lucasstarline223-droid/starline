import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, UserPlus, Mail, Edit2, Save, X, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GestaoUsuarios() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios-gestao'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-gestao'] });
      setEditingUser(null);
    }
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, inviteRole);
    setInviteEmail('');
    setInviteRole('user');
    setShowInviteForm(false);
    setInviting(false);
    queryClient.invalidateQueries({ queryKey: ['usuarios-gestao'] });
  };

  const handleEditSave = () => {
    updateMutation.mutate({ id: editingUser.id, data: editForm });
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditForm({ role: user.role });
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Acesso Restrito</h2>
          <p className="text-gray-500 text-lg">
            Apenas administradores podem gerenciar usuários.
          </p>
          <p className="text-gray-400 mt-2">
            Entre em contato com um administrador para obter acesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            Gestão de Usuários
          </h1>
          <p className="text-gray-500 mt-1">Gerencie os membros da equipe e suas permissões</p>
        </div>
        <Button
          onClick={() => setShowInviteForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 rounded-xl"
        >
          <UserPlus className="w-4 h-4" />
          Convidar Usuário
        </Button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Convidar Novo Usuário
          </h3>
          <form onSubmit={handleInvite} className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-purple-800">E-mail</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@empresa.com"
                required
                className="mt-1"
              />
            </div>
            <div className="w-40">
              <Label className="text-purple-800">Perfil</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={inviting} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
              {inviting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)} className="rounded-xl">
              Cancelar
            </Button>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{usuarios.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total de Usuários</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{usuarios.filter(u => u.role === 'admin').length}</p>
          <p className="text-sm text-gray-500 mt-1">Administradores</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{usuarios.filter(u => u.role !== 'admin').length}</p>
          <p className="text-sm text-gray-500 mt-1">Usuários</p>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Carregando usuários...</div>
      ) : (
        <div className="space-y-3">
          {usuarios.map((user) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-lg ${user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                {(user.full_name || user.email || '?')[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{user.full_name || '(sem nome)'}</p>
                  {user.id === currentUser?.id && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Você</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>

              {/* Role Badge */}
              {editingUser?.id === user.id ? (
                <div className="flex items-center gap-2">
                  <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={handleEditSave} className="text-green-600 hover:bg-green-50">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingUser(null)} className="text-gray-400 hover:bg-gray-50">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge className={user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 border-purple-200 flex items-center gap-1'
                    : 'bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1'
                  }>
                    {user.role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {user.role === 'admin' ? 'Admin' : 'Usuário'}
                  </Badge>
                  {user.id !== currentUser?.id && (
                    <Button size="icon" variant="ghost" onClick={() => startEdit(user)} className="text-gray-400 hover:bg-gray-100">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}