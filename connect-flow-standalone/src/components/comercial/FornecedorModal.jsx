import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';

export default function FornecedorModal({ fornecedor, isOpen, onClose }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nome: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    email: '',
    site: '',
    categoria: '',
    status: 'Ativo',
    endereco: '',
    contato_comercial: '',
    telefone_comercial: '',
    email_comercial: '',
    observacoes: ''
  });

  useEffect(() => {
    if (fornecedor) {
      setFormData(fornecedor);
    } else {
      setFormData({
        nome: '',
        razao_social: '',
        cnpj: '',
        telefone: '',
        email: '',
        site: '',
        categoria: '',
        status: 'Ativo',
        endereco: '',
        contato_comercial: '',
        telefone_comercial: '',
        email_comercial: '',
        observacoes: ''
      });
    }
  }, [fornecedor, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (fornecedor) {
        return base44.entities.Fornecedor.update(fornecedor.id, data);
      }
      return base44.entities.Fornecedor.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <Tabs defaultValue="dados-gerais" className="w-full">
            <div className="px-6 pt-4 border-b border-gray-200">
              <TabsList>
                <TabsTrigger value="dados-gerais">Dados Gerais</TabsTrigger>
                <TabsTrigger value="contato-comercial">Contato Comercial</TabsTrigger>
              </TabsList>
            </div>

            {/* Dados Gerais */}
            <TabsContent value="dados-gerais" className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do Fornecedor *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label>Razão Social</Label>
                  <Input
                    value={formData.razao_social}
                    onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                  />
                </div>

                <div>
                  <Label>CNPJ</Label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({...formData, categoria: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Telefonia">Telefonia</SelectItem>
                      <SelectItem value="Internet">Internet</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(00) 0000-0000"
                  />
                </div>

                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Site</Label>
                  <Input
                    value={formData.site}
                    onChange={(e) => setFormData({...formData, site: e.target.value})}
                    placeholder="https://..."
                  />
                </div>

                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Contato Comercial */}
            <TabsContent value="contato-comercial" className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do Contato Comercial</Label>
                  <Input
                    value={formData.contato_comercial}
                    onChange={(e) => setFormData({...formData, contato_comercial: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Telefone Comercial</Label>
                  <Input
                    value={formData.telefone_comercial}
                    onChange={(e) => setFormData({...formData, telefone_comercial: e.target.value})}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label>E-mail Comercial</Label>
                  <Input
                    type="email"
                    value={formData.email_comercial}
                    onChange={(e) => setFormData({...formData, email_comercial: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Fornecedor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}