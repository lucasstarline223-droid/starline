import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Save, ArrowRight, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import UserSelect from './UserSelect';
import CommentsSection from './CommentsSection';

export default function ProspectModal({ prospect, isOpen, onClose }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(prospect || {
    nome_empresa: '',
    endereco_empresa: '',
    segmento: '',
    tamanho_empresa: '',
    sdr: '',
    servicos_interessados: [],
    historico_comentarios: [],
    nome_contato: '',
    telefone_contato: '',
    site_empresa: '',
    email_contato: '',
    cargo_contato: '',
    fonte_lead: '',
    telefone_empresa: '',
    email_empresa: '',
    data_reuniao_ae: '',
    status: 'em_qualificacao'
  });

  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (prospect) {
      setFormData(prospect);
    }
  }, [prospect]);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (prospect?.id) {
        return base44.entities.Prospect.update(prospect.id, data);
      }
      return base44.entities.Prospect.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      onClose();
    }
  });

  const convertToOportunidadeMutation = useMutation({
    mutationFn: async () => {
      // Update prospect status to convertido
      await base44.entities.Prospect.update(prospect.id, {
        ...formData,
        status: 'convertido'
      });

      // Create new Deal
      return base44.entities.Deal.create({
        nome_empresa: formData.nome_empresa,
        site_empresa: formData.site_empresa,
        segmento: formData.segmento,
        tamanho_empresa: formData.tamanho_empresa,
        data_apresentacao: formData.data_reuniao_ae,
        status: 'qualificacao_ae'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      queryClient.invalidateQueries(['deals']);
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleConvertToOportunidade = () => {
    if (window.confirm('Converter este prospect em oportunidade?')) {
      convertToOportunidadeMutation.mutate();
    }
  };

  const handleAddContact = () => {
    const params = new URLSearchParams({
      empresa: formData.nome_empresa || '',
      nome: formData.nome_contato || '',
      email: formData.email_contato || '',
      telefone: formData.telefone_contato || '',
      cargo: formData.cargo_contato || ''
    });
    navigate(`${createPageUrl('Contatos')}?${params.toString()}`);
  };

  const handleAddComment = (comment) => {
    const updatedComments = [...(formData.historico_comentarios || []), comment];
    
    setFormData(prev => ({
      ...prev,
      historico_comentarios: updatedComments
    }));
  };

  const toggleServico = (servico) => {
    const servicos = formData.servicos_interessados || [];
    if (servicos.includes(servico)) {
      setFormData({
        ...formData,
        servicos_interessados: servicos.filter(s => s !== servico)
      });
    } else {
      setFormData({
        ...formData,
        servicos_interessados: [...servicos, servico]
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {prospect ? 'Editar Prospect' : 'Novo Prospect'}
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
          {/* Empresa Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-600 rounded"></span>
              Informações da Empresa
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  value={formData.nome_empresa}
                  onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})}
                  placeholder="Nome da empresa"
                  required
                />
              </div>

              <div>
                <Label>Site</Label>
                <Input
                  value={formData.site_empresa}
                  onChange={(e) => setFormData({...formData, site_empresa: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Endereço</Label>
                <Input
                  value={formData.endereco_empresa}
                  onChange={(e) => setFormData({...formData, endereco_empresa: e.target.value})}
                  placeholder="Endereço completo"
                />
              </div>

              <div>
                <Label>E-mail Empresa</Label>
                <Input
                  type="email"
                  value={formData.email_empresa}
                  onChange={(e) => setFormData({...formData, email_empresa: e.target.value})}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div>
                <Label>Telefone Empresa</Label>
                <PhoneInput
                  value={formData.telefone_empresa}
                  onChange={(e) => setFormData({...formData, telefone_empresa: e.target.value})}
                />
              </div>

              <div>
                <Label>Segmento</Label>
                <Select
                  value={formData.segmento}
                  onValueChange={(value) => setFormData({...formData, segmento: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Saúde">Saúde</SelectItem>
                    <SelectItem value="Indústria">Indústria</SelectItem>
                    <SelectItem value="Comércio">Comércio</SelectItem>
                    <SelectItem value="Governamental">Governamental</SelectItem>
                    <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Serviços">Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tamanho da Empresa</Label>
                <Select
                  value={formData.tamanho_empresa}
                  onValueChange={(value) => setFormData({...formData, tamanho_empresa: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Micro">Micro</SelectItem>
                    <SelectItem value="Pequena">Pequena</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Grande">Grande</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contato Principal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-green-600 rounded"></span>
              Contato Principal
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Contato</Label>
                <Input
                  value={formData.nome_contato}
                  onChange={(e) => setFormData({...formData, nome_contato: e.target.value})}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label>Cargo</Label>
                <Select
                  value={formData.cargo_contato}
                  onValueChange={(value) => setFormData({...formData, cargo_contato: value})}
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
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email_contato}
                  onChange={(e) => setFormData({...formData, email_contato: e.target.value})}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div>
                <Label>Telefone</Label>
                <PhoneInput
                  value={formData.telefone_contato}
                  onChange={(e) => setFormData({...formData, telefone_contato: e.target.value})}
                />
              </div>
              </div>

              <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddContact}
                className="w-full rounded-xl flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Adicionar este contato na lista de contatos
              </Button>
              </div>
              </div>

          {/* Qualificação */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded"></span>
              Qualificação
            </h3>

            {/* Serviços Interessados */}
            <div>
              <Label>Serviços de Interesse</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {['API de WhatsApp', 'Telefonia', 'PABX', 'Números DID/DDR', '0800', 'Portabilidade'].map((servico) => (
                  <div key={servico} className="flex items-center space-x-2">
                    <Checkbox
                      id={servico}
                      checked={(formData.servicos_interessados || []).includes(servico)}
                      onCheckedChange={() => toggleServico(servico)}
                    />
                    <label
                      htmlFor={servico}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {servico}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <CommentsSection
              comments={formData.historico_comentarios || []}
              onAddComment={handleAddComment}
              currentUser={currentUser}
            />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>SDR Responsável</Label>
                <UserSelect
                  value={formData.sdr || ''}
                  onChange={(email) => setFormData({...formData, sdr: email})}
                  placeholder="Selecionar SDR"
                />
              </div>

              <div>
                <Label>
                  Data Reunião AE
                  {formData.status === 'qualificado' && (
                    <span className="text-xs text-blue-600 ml-2">
                      (AE será notificado automaticamente)
                    </span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={formData.data_reuniao_ae}
                  onChange={(e) => setFormData({...formData, data_reuniao_ae: e.target.value})}
                />
                {formData.data_reuniao_ae && formData.status === 'qualificado' && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Tarefa será criada automaticamente no calendário do AE
                  </p>
                )}
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
                    <SelectItem value="em_qualificacao">Em Qualificação</SelectItem>
                    <SelectItem value="em_contato">Em Contato (MQL)</SelectItem>
                    <SelectItem value="qualificado">Qualificado (SQL)</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                    <SelectItem value="convertido">Convertido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <div>
              {prospect && formData.status === 'qualificado' && (
                <Button
                  type="button"
                  onClick={handleConvertToOportunidade}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2"
                  disabled={convertToOportunidadeMutation.isLoading}
                >
                  <ArrowRight className="w-4 h-4" />
                  {convertToOportunidadeMutation.isLoading ? 'Convertendo...' : 'Converter em Oportunidade'}
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-2"
                disabled={saveMutation.isLoading}
              >
                <Save className="w-4 h-4" />
                {saveMutation.isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}