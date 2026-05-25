import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Save, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserSelect from './UserSelect';

export default function DealModal({ deal, isOpen, onClose, initialData, onSaveSuccess }) {
  const defaultForm = {
    nome_empresa: '',
    account_executive: '',
    data_fechamento_prevista: '',
    data_apresentacao: '',
    tipo_oportunidade: 'Nova venda',
    site_empresa: '',
    segmento: '',
    tamanho_empresa: '',
    moeda: 'BRL',
    valor_mrr: 0,
    cobranca_unica: 0,
    total_equipamentos: 0,
    prazo_contrato: '12 meses',
    motivo_perdido: '',
    status: 'qualificacao_ae'
  };
  const [formData, setFormData] = useState(deal || (initialData ? { ...defaultForm, ...initialData } : defaultForm));

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const prevStatus = deal?.status;
      let savedDeal;

      if (deal?.id) {
        savedDeal = await base44.entities.Deal.update(deal.id, data);
      } else {
        savedDeal = await base44.entities.Deal.create(data);
      }

      // Se fechou ganho e ainda não tem handoff, criar automaticamente
      if (data.status === 'fechado_ganho' && !deal?.handoff_id) {
        const today = new Date().toISOString().split('T')[0];
        const handoff = await base44.entities.HandoffSDD.create({
          deal_id: savedDeal.id,
          nome_empresa: data.nome_empresa,
          valor_mrr: data.valor_mrr,
          data_fechamento: today,
          account_executive: data.account_executive,
          etapa_atual: 'coleta_dados',
          categoria: 'Telefonia'
        });
        // Vincular handoff ao deal
        await base44.entities.Deal.update(savedDeal.id, { handoff_id: handoff.id });
        queryClient.invalidateQueries(['handoffs']);
      }

      return savedDeal;
    },
    onSuccess: (savedDeal) => {
      queryClient.invalidateQueries(['deals']);
      if (onSaveSuccess) onSaveSuccess(savedDeal);
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!isOpen) return null;

  const isFechadoGanho = formData.status === 'fechado_ganho';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {deal ? 'Editar Oportunidade' : initialData ? '🏆 Nova Oportunidade (Prospect Convertido)' : 'Nova Oportunidade'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Aviso fechado ganho */}
        {isFechadoGanho && !deal?.handoff_id && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800 text-sm">
            <Trophy className="w-4 h-4 text-green-600 flex-shrink-0" />
            Ao salvar como <strong>Fechado Ganho</strong>, um Handoff de onboarding será criado automaticamente.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-orange-600 rounded"></span>
              Informações da Oportunidade
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
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
                <Label>Tipo de Oportunidade</Label>
                <Select value={formData.tipo_oportunidade} onValueChange={(v) => setFormData({...formData, tipo_oportunidade: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nova venda">Nova venda</SelectItem>
                    <SelectItem value="Upsell">Upsell</SelectItem>
                    <SelectItem value="Cross-sell">Cross-sell</SelectItem>
                    <SelectItem value="Renovação">Renovação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Account Executive *</Label>
                <UserSelect
                  value={formData.account_executive || ''}
                  onChange={(email) => setFormData({...formData, account_executive: email})}
                  placeholder="Selecionar Account Executive"
                />
              </div>

              <div>
                <Label>Segmento</Label>
                <Select value={formData.segmento} onValueChange={(v) => setFormData({...formData, segmento: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                <Label>Tamanho</Label>
                <Select value={formData.tamanho_empresa} onValueChange={(v) => setFormData({...formData, tamanho_empresa: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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

          {/* Valores */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-green-600 rounded"></span>
              Valores e Proposta
            </h3>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Valor MRR</Label>
                <Input type="number" step="0.01" value={formData.valor_mrr}
                  onChange={(e) => setFormData({...formData, valor_mrr: parseFloat(e.target.value) || 0})} placeholder="0,00" />
              </div>
              <div>
                <Label>Cobrança Única (Setup)</Label>
                <Input type="number" step="0.01" value={formData.cobranca_unica}
                  onChange={(e) => setFormData({...formData, cobranca_unica: parseFloat(e.target.value) || 0})} placeholder="0,00" />
              </div>
              <div>
                <Label>Total Equipamentos</Label>
                <Input type="number" step="0.01" value={formData.total_equipamentos}
                  onChange={(e) => setFormData({...formData, total_equipamentos: parseFloat(e.target.value) || 0})} placeholder="0,00" />
              </div>
              <div>
                <Label>Prazo do Contrato</Label>
                <Select value={formData.prazo_contrato} onValueChange={(v) => setFormData({...formData, prazo_contrato: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12 meses">12 meses</SelectItem>
                    <SelectItem value="24 meses">24 meses</SelectItem>
                    <SelectItem value="36 meses">36 meses</SelectItem>
                    <SelectItem value="Sem fidelidade">Sem fidelidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Valor Total Anual</p>
                  <p className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      (formData.valor_mrr * 12) + formData.cobranca_unica + formData.total_equipamentos
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-700">MRR × 12 meses + Setup + Equipamentos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Datas e Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded"></span>
              Datas e Status
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Data Apresentação</Label>
                <Input type="date" value={formData.data_apresentacao}
                  onChange={(e) => setFormData({...formData, data_apresentacao: e.target.value})} />
              </div>
              <div>
                <Label>Data Fechamento Prevista</Label>
                <Input type="date" value={formData.data_fechamento_prevista}
                  onChange={(e) => setFormData({...formData, data_fechamento_prevista: e.target.value})} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualificacao_ae">Qualificação AE</SelectItem>
                    <SelectItem value="apresentacao">Apresentação</SelectItem>
                    <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
                    <SelectItem value="em_negociacao">Em Negociação</SelectItem>
                    <SelectItem value="fechado_ganho">Fechado Ganho</SelectItem>
                    <SelectItem value="fechado_perdido">Fechado Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.status === 'fechado_perdido' && (
              <div>
                <Label>Motivo Perdido</Label>
                <Select value={formData.motivo_perdido} onValueChange={(v) => setFormData({...formData, motivo_perdido: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preço">Preço</SelectItem>
                    <SelectItem value="Concorrência">Concorrência</SelectItem>
                    <SelectItem value="Timing">Timing</SelectItem>
                    <SelectItem value="Orçamento">Orçamento</SelectItem>
                    <SelectItem value="Sem fit">Sem fit</SelectItem>
                    <SelectItem value="Sem decisão">Sem decisão</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex items-center gap-2"
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Salvando...' : isFechadoGanho && !deal?.handoff_id ? 'Salvar e Criar Handoff' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}