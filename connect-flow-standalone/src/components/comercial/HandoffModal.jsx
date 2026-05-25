import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Save, CheckCircle2, Circle, AlertTriangle, ChevronRight, Lock, MessageCircle, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserSelect from './UserSelect';
import { differenceInDays, parseISO } from 'date-fns';

const ETAPAS = [
  { key: 'coleta_dados', label: 'Coleta de Dados', color: 'yellow' },
  { key: 'pronto_assinatura', label: 'Pronto p/ Assinatura', color: 'blue' },
  { key: 'aguardando_assinatura', label: 'Aguard. Assinatura', color: 'orange' },
  { key: 'order_to_activation', label: 'Ordem de Ativação', color: 'purple' },
  { key: 'concluido', label: 'Concluído', color: 'green' }
];

const CAMPOS_CHECKLIST_COLETA = [
  { field: 'cnpj_cpf', label: 'CNPJ/CPF' },
  { field: 'razao_social', label: 'Razão Social' },
  { field: 'endereco', label: 'Endereço completo' },
  { field: 'email_cobranca', label: 'E-mail de cobrança' },
  { field: 'responsavel_financeiro_cliente', label: 'Responsável financeiro do cliente' },
  { field: 'ramais_configurar', label: 'Qtd. de ramais (se PABX)' },
  { field: 'numeros_portar', label: 'Número(s) para portabilidade' },
  { field: 'waba_id', label: 'WABA ID (se WhatsApp API)' }
];

const MSG_WHATSAPP_CONTRATO = (nome, link) =>
  `Olá ${nome || '[Nome]'}, tudo certo! Segue o link para assinatura do seu contrato com a Starline: ${link || '[link do contrato]'}. Qualquer dúvida estou à disposição!`;

export default function HandoffModal({ handoff, isOpen, onClose }) {
  const [formData, setFormData] = useState(handoff || {
    nome_empresa: '',
    etapa_atual: 'coleta_dados',
    cnpj_cpf: '',
    razao_social: '',
    endereco: '',
    email_cobranca: '',
    responsavel_financeiro_cliente: '',
    ramais_configurar: '',
    numeros_portar: '',
    waba_id: '',
    responsavel_coleta: '',
    contrato_url: '',
    telefone_contato: '',
    nome_contato: '',
    data_envio_contrato: '',
    responsavel_tecnico: '',
    checklist_ativacao: {
      ambiente_configurado: false,
      ramais_provisionados: false,
      portabilidade_concluida: false,
      testes_realizados: false,
      cliente_treinado: false
    },
    data_ativacao_confirmada: '',
    categoria: 'Telefonia',
    valor_mrr: 0,
    produto_contratado: '',
    data_fechamento: '',
    observacoes: ''
  });

  const queryClient = useQueryClient();

  const { data: hardwareList = [] } = useQuery({
    queryKey: ['hardware'],
    queryFn: () => base44.entities.Hardware.list('-created_date', 500)
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list('-created_date', 200)
  });

  const hardwareSelecionado = hardwareList.find(h => h.id === formData.hardware_id);
  const estoqueDisponivel = hardwareSelecionado?.quantidade_estoque || 0;
  const qtdNecessaria = formData.hardware_quantidade || 0;
  const estoqueInsuficiente = hardwareSelecionado && qtdNecessaria > 0 && estoqueDisponivel < qtdNecessaria;
  const estoqueOk = hardwareSelecionado && qtdNecessaria > 0 && estoqueDisponivel >= qtdNecessaria;

  const criarRequisicaoCompra = useMutation({
    mutationFn: (data) => base44.entities.RequisicaoCompraHardware.create(data),
    onSuccess: (data) => {
      set('requisicao_compra_id', data.id);
      queryClient.invalidateQueries({ queryKey: ['requisicoes_compra'] });
      alert('Requisição de compra criada com sucesso! Acesse Estoque > Requisições de Compra para acompanhar.');
    }
  });

  const handleRequisitarCompra = () => {
    if (!hardwareSelecionado) return;
    criarRequisicaoCompra.mutate({
      cliente_nome: formData.razao_social || formData.nome_empresa,
      handoff_id: formData.id || '',
      hardware_id: hardwareSelecionado.id,
      hardware_nome: hardwareSelecionado.nome_produto,
      hardware_fabricante: hardwareSelecionado.fabricante || '',
      quantidade_necessaria: qtdNecessaria,
      quantidade_em_estoque: estoqueDisponivel,
      quantidade_a_comprar: qtdNecessaria - estoqueDisponivel,
      status_compra: 'Pendente'
    });
  };

  const saveMutation = useMutation({
    mutationFn: (data) => handoff?.id
      ? base44.entities.HandoffSDD.update(handoff.id, data)
      : base44.entities.HandoffSDD.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['handoffs']);
      onClose();
    }
  });

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const etapaIndex = ETAPAS.findIndex(e => e.key === formData.etapa_atual);

  // Checklist coleta
  const camposPreenchidos = CAMPOS_CHECKLIST_COLETA.filter(c => formData[c.field] && String(formData[c.field]).trim() !== '').length;
  const coletaCompleta = camposPreenchidos === CAMPOS_CHECKLIST_COLETA.length;
  const progresso = Math.round((camposPreenchidos / CAMPOS_CHECKLIST_COLETA.length) * 100);

  // Dias aguardando assinatura
  const diasAguardando = formData.data_envio_contrato
    ? differenceInDays(new Date(), typeof formData.data_envio_contrato === 'string' ? parseISO(formData.data_envio_contrato) : formData.data_envio_contrato)
    : null;

  const podeAvancar = formData.etapa_atual !== 'coleta_dados' || coletaCompleta;

  const handleAvancarEtapa = () => {
    if (!podeAvancar) return;
    const next = ETAPAS[etapaIndex + 1];
    if (next) set('etapa_atual', next.key);
  };

  // Enviar contrato via WhatsApp
  const handleEnviarContrato = () => {
    const numero = (formData.telefone_contato || '').replace(/\D/g, '');
    const msg = encodeURIComponent(MSG_WHATSAPP_CONTRATO(formData.nome_contato, formData.contrato_url));
    const url = `https://wa.me/55${numero}?text=${msg}`;
    window.open(url, '_blank');

    const agora = new Date().toISOString();
    const novaEtapa = formData.etapa_atual === 'pronto_assinatura' ? 'aguardando_assinatura' : formData.etapa_atual;
    setFormData(prev => ({ ...prev, data_envio_contrato: agora, etapa_atual: novaEtapa }));
    // Salvar imediatamente
    saveMutation.mutate({ ...formData, data_envio_contrato: agora, etapa_atual: novaEtapa });
  };

  // Confirmar assinatura
  const handleConfirmarAssinatura = () => {
    setFormData(prev => ({ ...prev, etapa_atual: 'order_to_activation' }));
  };

  // Confirmar ativação + notificar financeiro
  const handleConfirmarAtivacao = async () => {
    if (!formData.data_ativacao_confirmada) {
      alert('Informe a Data de Ativação antes de confirmar.');
      return;
    }
    const novoFormData = { ...formData, etapa_atual: 'concluido' };
    setFormData(novoFormData);

    // Salvar imediatamente
    saveMutation.mutate(novoFormData);

    // Notificar responsável financeiro (interno)
    if (formData.responsavel_coleta) {
      try {
        // Email sending not available in standalone mode
        console.log('Notificação de ativação seria enviada para:', formData.responsavel_coleta);
      } catch (e) {
        console.error('Erro ao enviar notificação ao financeiro:', e);
      }
    }
  };

  // Checklist ativação — auto-salva ao marcar/desmarcar
  const setChecklist = (key, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        checklist_ativacao: { ...prev.checklist_ativacao, [key]: value }
      };
      if (handoff?.id) {
        base44.entities.HandoffSDD.update(handoff.id, updated).catch(console.error);
      }
      return updated;
    });
  };

  const setChecklistText = (value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        checklist_ativacao: { ...prev.checklist_ativacao, outros_detalhes: value }
      };
      return updated;
    });
  };
  const checklistAtivacao = formData.checklist_ativacao || {};
  const checklistItems = [
    { key: 'ambiente_configurado', label: 'Ambiente configurado' },
    { key: 'ramais_provisionados', label: 'Ramais provisionados' },
    { key: 'portabilidade_concluida', label: 'Portabilidade concluída' },
    { key: 'testes_realizados', label: 'Testes realizados' },
    { key: 'cliente_treinado', label: 'Cliente treinado' },
    { key: 'outros', label: 'Outros' }
  ];
  const checklistCompleto = checklistItems.filter(i => i.key !== 'outros').every(i => checklistAtivacao[i.key]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {handoff ? `Handoff — ${handoff.nome_empresa}` : 'Novo Handoff'}
            </h2>
            {formData.valor_mrr > 0 && (
              <p className="text-green-600 font-semibold mt-0.5">
                MRR: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.valor_mrr)}/mês
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {ETAPAS.map((etapa, idx) => {
              const isActive = idx === etapaIndex;
              const isDone = idx < etapaIndex;
              return (
                <React.Fragment key={etapa.key}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {etapa.label}
                  </div>
                  {idx < ETAPAS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="p-6 space-y-6">
          {/* Info básica */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label>Nome da Empresa *</Label>
              <Input value={formData.nome_empresa} onChange={e => set('nome_empresa', e.target.value)} required />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={formData.categoria} onValueChange={v => set('categoria', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Telefonia">Telefonia</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Internet">Internet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Produto Contratado</Label>
              <Input value={formData.produto_contratado} onChange={e => set('produto_contratado', e.target.value)} placeholder="Ex: PABX + Telefonia" />
            </div>
            <div>
              <Label>MRR</Label>
              <Input type="number" step="0.01" value={formData.valor_mrr} onChange={e => set('valor_mrr', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Data Fechamento</Label>
              <Input type="date" value={formData.data_fechamento} onChange={e => set('data_fechamento', e.target.value)} />
            </div>
          </div>

          {/* ===== ETAPA 1: COLETA DE DADOS ===== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-yellow-500 rounded"></span>
                Etapa 1 — Coleta de Dados
                <span className="text-xs font-normal text-gray-500">(Responsável: Financeiro)</span>
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-28 bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${coletaCompleta ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${progresso}%` }} />
                </div>
                <span className={`text-xs font-semibold ${coletaCompleta ? 'text-green-600' : 'text-yellow-700'}`}>
                  {camposPreenchidos}/{CAMPOS_CHECKLIST_COLETA.length}
                </span>
              </div>
            </div>

            {/* Checklist visual */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-yellow-800 mb-3">Campos obrigatórios para avançar:</p>
              <div className="grid grid-cols-4 gap-2">
                {CAMPOS_CHECKLIST_COLETA.map(c => {
                  const ok = formData[c.field] && String(formData[c.field]).trim() !== '';
                  return (
                    <div key={c.field} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-700' : 'text-gray-500'}`}>
                      {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                      {c.label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Razão Social *</Label>
                <Input value={formData.razao_social} onChange={e => set('razao_social', e.target.value)} />
              </div>
              <div>
                <Label>CNPJ/CPF *</Label>
                <Input value={formData.cnpj_cpf} onChange={e => set('cnpj_cpf', e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="col-span-3">
                <Label>Endereço Completo *</Label>
                <Input value={formData.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade, CEP" />
              </div>
              <div>
                <Label>E-mail de Cobrança *</Label>
                <Input type="email" value={formData.email_cobranca} onChange={e => set('email_cobranca', e.target.value)} />
              </div>
              <div>
                <Label>Responsável Financeiro do Cliente *</Label>
                <Input value={formData.responsavel_financeiro_cliente} onChange={e => set('responsavel_financeiro_cliente', e.target.value)} />
              </div>
              <div>
                <Label>Responsável Financeiro (interno)</Label>
                <UserSelect value={formData.responsavel_coleta || ''} onChange={v => set('responsavel_coleta', v)} placeholder="Selecionar" />
              </div>
              <div>
                <Label>Ramais a Configurar (se PABX) *</Label>
                <Input value={formData.ramais_configurar} onChange={e => set('ramais_configurar', e.target.value)} placeholder="Ex: 10 ramais, 1001-1010" />
              </div>
              <div>
                <Label>Números para Portabilidade *</Label>
                <Input value={formData.numeros_portar} onChange={e => set('numeros_portar', e.target.value)} placeholder="Ex: 11 3000-0000" />
              </div>
              <div>
                <Label>WABA ID (se WhatsApp API) *</Label>
                <Input value={formData.waba_id} onChange={e => set('waba_id', e.target.value)} placeholder="ID da conta WABA" />
              </div>
            </div>
          </div>

          {/* ===== ETAPA 2: PRONTO PARA ASSINATURA ===== */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded"></span>
              Etapa 2 — Pronto para Assinatura
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Contato (para WhatsApp)</Label>
                <Input value={formData.nome_contato} onChange={e => set('nome_contato', e.target.value)} placeholder="Ex: João Silva" />
              </div>
              <div>
                <Label>Telefone do Contato (WhatsApp)</Label>
                <Input value={formData.telefone_contato} onChange={e => set('telefone_contato', e.target.value)} placeholder="11999990000" />
              </div>
              <div className="col-span-2">
                <Label>Link do Contrato</Label>
                <Input value={formData.contrato_url} onChange={e => set('contrato_url', e.target.value)} placeholder="https://..." />
              </div>
            </div>

            {(formData.etapa_atual === 'pronto_assinatura') && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Enviar contrato via WhatsApp</p>
                  <p className="text-xs text-blue-700 mt-0.5">Abrirá o WhatsApp com a mensagem pré-preenchida e registrará a data/hora de envio.</p>
                </div>
                <Button type="button" onClick={handleEnviarContrato} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Enviar Contrato
                </Button>
              </div>
            )}
          </div>

          {/* ===== ETAPA 3: AGUARDANDO ASSINATURA ===== */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-orange-500 rounded"></span>
              Etapa 3 — Aguardando Assinatura
            </h3>

            {formData.data_envio_contrato && (
              <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
                diasAguardando >= 4 ? 'bg-red-50 border-red-300' :
                diasAguardando >= 2 ? 'bg-yellow-50 border-yellow-300' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <p className={`font-semibold text-sm ${diasAguardando >= 4 ? 'text-red-700' : diasAguardando >= 2 ? 'text-yellow-700' : 'text-gray-700'}`}>
                    {diasAguardando === 0 ? 'Enviado hoje' : `Aguardando há ${diasAguardando} dia${diasAguardando !== 1 ? 's' : ''}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Enviado em: {new Date(formData.data_envio_contrato).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {formData.etapa_atual === 'aguardando_assinatura' && (
                    <>
                      <Button type="button" variant="outline" onClick={handleEnviarContrato} className="flex items-center gap-2 text-sm">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reenviar
                      </Button>
                      <Button type="button" onClick={handleConfirmarAssinatura} className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar Assinatura
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {formData.etapa_atual === 'aguardando_assinatura' && !formData.data_envio_contrato && (
              <p className="text-sm text-gray-500 italic">Retorne à etapa anterior e envie o contrato primeiro.</p>
            )}
          </div>

          {/* ===== ETAPA 4: ORDEM DE ATIVAÇÃO ===== */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-500 rounded"></span>
              Etapa 4 — Ordem de Ativação
              <span className="text-xs font-normal text-gray-500">(Responsável: Técnico)</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Responsável Técnico</Label>
                <UserSelect value={formData.responsavel_tecnico || ''} onChange={v => set('responsavel_tecnico', v)} placeholder="Selecionar técnico" />
              </div>
              <div>
                <Label>Fornecedor de Serviço</Label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={formData.fornecedor_id || ''}
                  onChange={e => {
                    const f = fornecedores.find(x => x.id === e.target.value);
                    set('fornecedor_id', e.target.value);
                    set('fornecedor_nome', f?.nome || '');
                  }}
                >
                  <option value="">Selecionar fornecedor</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Números DID/DDR do Cliente</Label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: 11 3000-0001, 11 3000-0002"
                  value={(formData.numeros_did || []).join(', ')}
                  onChange={e => set('numeros_did', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
                <p className="text-xs text-gray-400 mt-1">Separe múltiplos números por vírgula</p>
              </div>
            </div>

            {/* Seleção de Equipamento */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Equipamento Necessário</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Modelo do Equipamento</Label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={formData.hardware_id || ''}
                    onChange={e => {
                      const h = hardwareList.find(x => x.id === e.target.value);
                      set('hardware_id', e.target.value);
                      set('hardware_nome', h?.nome_produto || '');
                      set('hardware_fabricante', h?.fabricante || '');
                    }}
                  >
                    <option value="">Nenhum equipamento</option>
                    {hardwareList.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.nome_produto} — {h.fabricante} (Estoque: {h.quantidade_estoque || 0})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={formData.hardware_quantidade || ''}
                    onChange={e => set('hardware_quantidade', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Status do estoque */}
              {hardwareSelecionado && qtdNecessaria > 0 && (
                <div>
                  {estoqueOk && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
                      <span className="text-green-600 text-lg">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-green-800">Estoque disponível</p>
                        <p className="text-xs text-green-600">{estoqueDisponivel} unidades em estoque · necessário: {qtdNecessaria}</p>
                      </div>
                    </div>
                  )}
                  {estoqueInsuficiente && (
                    <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500 text-lg">⚠️</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-800">Estoque insuficiente</p>
                          <p className="text-xs text-red-600">
                            Necessário: <strong>{qtdNecessaria}</strong> ·
                            Em estoque: <strong>{estoqueDisponivel}</strong> ·
                            Faltam comprar: <strong>{qtdNecessaria - estoqueDisponivel}</strong>
                          </p>
                        </div>
                      </div>
                      {formData.requisicao_compra_id ? (
                        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          ✅ Requisição de compra já criada. Acompanhe em Estoque → Requisições de Compra.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequisitarCompra}
                          disabled={criarRequisicaoCompra.isPending}
                          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          🛒 {criarRequisicaoCompra.isPending ? 'Criando...' : 'Requisitar Compra'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Checklist de ativação */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-purple-800">Checklist de Ativação:</p>
              {checklistItems.map(item => (
                <div key={item.key}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={item.key}
                      checked={checklistAtivacao[item.key] || false}
                      onCheckedChange={v => setChecklist(item.key, v)}
                    />
                    <Label htmlFor={item.key} className={`cursor-pointer text-sm ${checklistAtivacao[item.key] && item.key !== 'outros' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.label}
                    </Label>
                  </div>
                  {item.key === 'outros' && checklistAtivacao['outros'] && (
                    <textarea
                      className="mt-2 ml-7 w-full border border-purple-200 rounded-lg px-3 py-2 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                      rows={3}
                      placeholder="Descreva os detalhes adicionais da ativação..."
                      value={checklistAtivacao['outros_detalhes'] || ''}
                      onChange={e => setChecklistText(e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            {formData.etapa_atual === 'order_to_activation' && checklistCompleto && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="font-semibold text-green-800 text-sm">✅ Checklist completo! Pronto para confirmar ativação.</p>
                <div className="flex items-center gap-3">
                  <div>
                    <Label className="text-xs">Data de Ativação</Label>
                    <Input type="date" value={formData.data_ativacao_confirmada} onChange={e => set('data_ativacao_confirmada', e.target.value)} className="w-40" />
                  </div>
                  <Button
                    type="button"
                    onClick={handleConfirmarAtivacao}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={saveMutation.isPending}
                  >
                    Confirmar Ativação
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <div>
              {etapaIndex < ETAPAS.length - 1 && formData.etapa_atual !== 'pronto_assinatura' && formData.etapa_atual !== 'aguardando_assinatura' && formData.etapa_atual !== 'order_to_activation' && (
                <Button
                  type="button"
                  onClick={handleAvancarEtapa}
                  disabled={!podeAvancar}
                  className={`rounded-xl flex items-center gap-2 ${podeAvancar ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  {!podeAvancar && <Lock className="w-4 h-4" />}
                  Avançar para {ETAPAS[etapaIndex + 1]?.label}
                  {!podeAvancar && <span className="text-xs">({camposPreenchidos}/{CAMPOS_CHECKLIST_COLETA.length})</span>}
                </Button>
              )}
              {!podeAvancar && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Preencha todos os campos obrigatórios para avançar.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl flex items-center gap-2" disabled={saveMutation.isPending}>
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}