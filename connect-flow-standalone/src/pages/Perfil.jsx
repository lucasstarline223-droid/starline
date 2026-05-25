import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Upload, Save, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Perfil() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    profile_picture: ''
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        profile_picture: user.profile_picture || ''
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['users']);
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      full_name: formData.full_name,
      profile_picture: formData.profile_picture
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const file_url = URL.createObjectURL(file);
      setFormData({ ...formData, profile_picture: file_url });
      
      // Salvar automaticamente no banco de dados
      await base44.auth.updateMe({ profile_picture: file_url });
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['users']);
      
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar foto de perfil');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Perfil e Configurações</h1>
          <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 h-32"></div>
            
            <div className="px-8 pb-8">
              {/* Avatar */}
              <div className="relative -mt-16 mb-6">
                <div className="relative inline-block">
                  {formData.profile_picture ? (
                    <img
                      src={formData.profile_picture}
                      alt={formData.full_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-semibold border-4 border-white shadow-lg">
                      {getInitials(formData.full_name)}
                    </div>
                  )}
                  
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Camera className="w-5 h-5 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label>Nome Completo</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Seu nome completo"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>E-mail</Label>
                  <Input
                    value={formData.email}
                    disabled
                    className="mt-1 bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O e-mail não pode ser alterado
                  </p>
                </div>

                <div>
                  <Label>Função</Label>
                  <Input
                    value={user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                    disabled
                    className="mt-1 bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
                    disabled={updateMutation.isLoading || uploading}
                  >
                    <Save className="w-4 h-4" />
                    {updateMutation.isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informações da Conta</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Criado em:</span>
                <span className="font-medium text-gray-900">
                  {user?.created_date ? new Date(user.created_date).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID da Conta:</span>
                <span className="font-mono text-xs text-gray-900">{user?.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}