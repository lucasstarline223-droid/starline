import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContactModal({ contact, isOpen, onClose, initialData = {} }) {
  const [formData, setFormData] = useState({
    nome: '',
    cargo: '',
    telefone: '',
    email: '',
    empresa: '',
    principal: false
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setFormData(contact);
      } else {
        setFormData({
          nome: initialData.nome || '',
          cargo: initialData.cargo || '',
          telefone: initialData.telefone || '',
          email: initialData.email || '',
          empresa: initialData.empresa || '',
          principal: false
        });
      }
    }
  }, [isOpen, contact, initialData]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (contact?.id) {
        return base44.entities.Contact.update(contact.id, data);
      }
      return base44.entities.Contact.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      
      // Se está editando, fecha o modal
      if (contact?.id) {
        onClose();
      } else {
        // Se está criando novo, limpa os campos e mantém modal aberto
        setFormData({
          nome: '',
          cargo: '',
          telefone: '',
          email: '',
          empresa: initialData.empresa || '',
          principal: false
        });
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {contact ? 'Editar Contato' : 'Novo Contato'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded"></span>
              Informações do Contato
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div>
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@empresa.com"
                  required
                />
              </div>

              <div>
                <Label>Telefone</Label>
                <PhoneInput
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>

              <div>
                <Label>Cargo</Label>
                <Select
                  value={formData.cargo}
                  onValueChange={(value) => setFormData({...formData, cargo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diretor">Diretor</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Coordenador">Coordenador</SelectItem>
                    <SelectItem value="Analista">Analista</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Secretária">Secretária</SelectItem>
                    <SelectItem value="CEO/Proprietário">CEO/Proprietário</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Empresa</Label>
                <Input
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.principal}
                    onChange={(e) => setFormData({...formData, principal: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Contato principal da empresa</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            {!contact && saveMutation.isSuccess && (
              <p className="text-sm text-green-600">✓ Contato adicionado com sucesso!</p>
            )}
            <div className={`flex gap-3 ${!contact && saveMutation.isSuccess ? 'ml-auto' : 'w-full justify-end'}`}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl"
              >
                {contact ? 'Cancelar' : 'Fechar'}
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
                disabled={saveMutation.isLoading}
              >
                <Save className="w-4 h-4" />
                {saveMutation.isLoading ? 'Salvando...' : (contact ? 'Salvar' : 'Adicionar')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}