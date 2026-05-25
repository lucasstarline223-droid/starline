import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronDown, ChevronUp, Building2, Phone, Mail, User,
  ArrowRight, CheckCircle2, DollarSign, Wrench, Paperclip, X
} from 'lucide-react';
import UserSelect from '@/components/comercial/UserSelect';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MOTIVOS = ['Preço','Problema Técnico','Falta de Uso','Encerramento de Atividade','Portabilidade','Inadimplência','Outro'];

const MOTIVO_COLORS = {
  'Preço': 'bg-orange-100 text-orange-700',
  'Problema Técnico': 'bg-red-100 text-red-700',
  'Falta de Uso': 'bg-gray-100 text-gray-700',
  'Encerramento de Atividade': 'bg-purple-100 text-purple-700',
  'Portabilidade': 'bg-blue-100 text-blue-700',
  'Inadimplência': 'bg-pink-100 text-pink-700',
  'Outro': 'bg-yellow-100 text-yellow-700',
};

export default function CancelamentoCard({ cancelamento, onUpdated }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [obsFinanceiro, setObsFinanceiro] = useState(cancelamento.etapa_financeira?.observacoes || '');
  const [savingObs, setSavingObs] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Cancelamento.update(cancelamento.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancelamentos'] });
      if (onUpdated) onUpdated();
    },
  });

  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const etapaFinanceira = cancelamento.etapa_financeira || { status: 'Em Análise', observacoes: '' };
  const etapas = cancelamento.etapas_tecnicas || {};
  const [outrosObs, setOutrosObs] = useState(cancelamento.etapas_tecnicas?.outros_observacao || '');
  const [protocolo, setProtocolo] = useState(cancelamento.etapas_tecnicas?.cancelamento_operadora_protocolo || '');
  const allTecnicoDone = etapas.excluir_pabx && etapas.cancelamento_operadora && etapas.verificar_equipamentos;
  const financeiroConcludo = etapaFinanceira.status === 'Concluído';

  const CHECKLIST_FIN_KEYS = ['ultima_cobranca', 'termo_cancelamento', 'encerramento_conta_azul'];

  const handleCheckFinanceiro = (field, value) => {
    const updated = { ...etapaFinanceira, [field]: value };
    const allDone = CHECKLIST_FIN_KEYS.every(k => updated[k]);
    if (allDone) updated.status = 'Concluído';
    else updated.status = 'Em Análise';
    updateMutation.mutate({ etapa_financeira: updated });
  };

  const handleResponsavelFinanceiro = (responsavel) => {
    const updated = { ...etapaFinanceira, responsavel: responsavel };
    updateMutation.mutate({ etapa_financeira: updated });
  };

  const handleResponsavelTecnico = (responsavel) => {
    updateMutation.mutate({ responsavel_tecnico: responsavel });
  };

  const handleAnexo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAnexo(true);
    const file_url = URL.createObjectURL(file);
    updateMutation.mutate(
      { etapa_financeira: { ...etapaFinanceira, anexo_url: file_url, anexo_nome: file.name } },
      { onSettled: () => setUploadingAnexo(false) }
    );
  };

  const handleRemoveAnexo = () => {
    updateMutation.mutate({ etapa_financeira: { ...etapaFinanceira, anexo_url: '', anexo_nome: '' } });
  };

  const handleSaveObsFinanceiro = () => {
    setSavingObs(true);
    updateMutation.mutate(
      { etapa_financeira: { ...etapaFinanceira, observacoes: obsFinanceiro } },
      { onSettled: () => setSavingObs(false) }
    );
  };

  const handlePasteAnexo = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        setUploadingAnexo(true);
        const fileName = `print_${Date.now()}.png`;
        const namedFile = new File([file], fileName, { type: file.type });
        const file_url = URL.createObjectURL(namedFile);
        updateMutation.mutate(
          { etapa_financeira: { ...etapaFinanceira, anexo_url: file_url, anexo_nome: fileName } },
          { onSettled: () => setUploadingAnexo(false) }
        );
        return;
      }
    }
  };

  const handleMotivoChange = (motivo) => {
    updateMutation.mutate({ motivo_cancelamento: motivo });
  };

  const handleMoveNext = async () => {
    const NEXT_STATUS = {
      'Em Análise': 'Offboarding Financeiro',
      'Offboarding Financeiro': 'Offboarding Técnico',
      'Offboarding Técnico': 'Cancelado',
    };
    const next = NEXT_STATUS[cancelamento.status];
    if (!next) return;
    const today = new Date().toISOString().split('T')[0];
    const extra = next === 'Cancelado' ? { data_conclusao: today } : {};
    updateMutation.mutate({ status: next, ...extra });

    if (next === 'Cancelado') {
      // 1. Cancelar os números DID deste cancelamento
      if (cancelamento.numeros_did?.length > 0) {
        for (const didId of cancelamento.numeros_did) {
          await base44.entities.NumeroDID.update(didId, {
            status: 'Cancelado',
            cancelamento_id: cancelamento.id,
            cancelamento_motivo: cancelamento.motivo_cancelamento || '',
            cancelamento_data: today,
          });
        }
      }

      // 2. Verificar se o cliente ainda tem números DID ativos após este cancelamento
      if (cancelamento.client_id) {
        const todosDidsCliente = await base44.entities.NumeroDID.filter({ client_id: cancelamento.client_id });
        const canceladosAgora = new Set(cancelamento.numeros_did || []);
        const didAtivosRestantes = todosDidsCliente.filter(
          d => !canceladosAgora.has(d.id) && d.status !== 'Cancelado'
        );
        // Só move o cliente para Cancelado se não restar nenhum número ativo
        if (didAtivosRestantes.length === 0) {
          await base44.entities.Client.update(cancelamento.client_id, { status: 'Cancelado' });
        }
      }
    }
  };

  const handleCheckTecnico = (field, value) => {
    const etapasAtualizadas = { ...etapas, [field]: value };
    updateMutation.mutate({ etapas_tecnicas: etapasAtualizadas });
  };

  const handleSaveOutrosObs = () => {
    updateMutation.mutate({ etapas_tecnicas: { ...etapas, outros_observacao: outrosObs } });
  };

  const handleSaveProtocolo = () => {
    updateMutation.mutate({ etapas_tecnicas: { ...etapas, cancelamento_operadora_protocolo: protocolo } });
  };

  const NEXT_LABEL = {
    'Em Análise': 'Iniciar Offboarding Financeiro',
    'Offboarding Financeiro': 'Mover para Offboarding Técnico',
    'Offboarding Técnico': 'Concluir Cancelamento',
  };

  const canMoveNext =
    cancelamento.status === 'Offboarding Financeiro'
      ? financeiroConcludo
      : cancelamento.status === 'Offboarding Técnico'
      ? allTecnicoDone
      : true;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <Building2 className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{cancelamento.nome_cliente}</div>
            <div className="text-xs text-gray-400">
              Solicitado por {cancelamento.solicitante || '—'} •{' '}
              {cancelamento.data_solicitacao
                ? format(new Date(cancelamento.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })
                : '—'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cancelamento.motivo_cancelamento && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${MOTIVO_COLORS[cancelamento.motivo_cancelamento] || 'bg-gray-100 text-gray-700'}`}>
              {cancelamento.motivo_cancelamento}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-4">

          {/* Dados do cliente */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {cancelamento.cnpj_cpf && (
              <div className="flex gap-1 items-center text-gray-600"><User className="w-3.5 h-3.5" />{cancelamento.cnpj_cpf}</div>
            )}
            {cancelamento.telefone_contato && (
              <div className="flex gap-1 items-center text-gray-600"><Phone className="w-3.5 h-3.5" />{cancelamento.telefone_contato}</div>
            )}
            {cancelamento.email_financeiro && (
              <div className="flex gap-1 items-center text-gray-600 col-span-2"><Mail className="w-3.5 h-3.5" />{cancelamento.email_financeiro}</div>
            )}
          </div>

          {/* Números sendo cancelados */}
          {cancelamento.numeros_did_info?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <div className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                Números sendo cancelados ({cancelamento.numeros_did_info.length})
              </div>
              <div className="space-y-1">
                {cancelamento.numeros_did_info.map(n => (
                  <div key={n.id} className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">{n.numero}</span>
                    <Badge className={`text-xs border ${n.tipo === 'DID' ? 'bg-blue-100 text-blue-700 border-blue-200' : n.tipo === 'DDR' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>{n.tipo}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ETAPA FINANCEIRA ── */}
          {(cancelamento.status === 'Offboarding Financeiro' || cancelamento.status === 'Offboarding Técnico' || cancelamento.status === 'Cancelado') && (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* Sub-header financeiro */}
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <DollarSign className="w-4 h-4" />
                  Offboarding Financeiro
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${financeiroConcludo ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {etapaFinanceira.status || 'Em Análise'}
                </span>
              </div>

              {/* Conteúdo financeiro */}
              <div className="px-3 py-2 space-y-3">

                {/* Checklist financeiro */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-gray-500 mb-1">Checklist</div>
                  {[
                    { key: 'ultima_cobranca', label: 'Última cobrança' },
                    { key: 'termo_cancelamento', label: 'Termo de cancelamento' },
                    { key: 'encerramento_conta_azul', label: 'Encerramento do contrato no Conta Azul' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`${cancelamento.id}-fin-${key}`}
                        checked={!!etapaFinanceira[key]}
                        disabled={cancelamento.status !== 'Offboarding Financeiro'}
                        onCheckedChange={(v) => handleCheckFinanceiro(key, v)}
                      />
                      <label
                        htmlFor={`${cancelamento.id}-fin-${key}`}
                        className={`text-sm cursor-pointer ${etapaFinanceira[key] ? 'line-through text-gray-400' : 'text-gray-700'}`}
                      >
                        {label}
                      </label>
                      {etapaFinanceira[key] && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                  ))}
                </div>

                {/* Motivo */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">Motivo do Cancelamento</div>
                  {cancelamento.status === 'Offboarding Financeiro' ? (
                    <Select value={cancelamento.motivo_cancelamento || ''} onValueChange={handleMotivoChange}>
                      <SelectTrigger className="w-full text-sm h-8">
                        <SelectValue placeholder="Selecionar motivo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MOTIVOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${MOTIVO_COLORS[cancelamento.motivo_cancelamento] || 'bg-gray-100 text-gray-600'}`}>
                      {cancelamento.motivo_cancelamento || 'Não informado'}
                    </span>
                  )}
                </div>

                {/* Anexo */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">Anexo</div>
                  {etapaFinanceira.anexo_url ? (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <a
                        href={etapaFinanceira.anexo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {etapaFinanceira.anexo_nome || 'Arquivo anexado'}
                      </a>
                      {cancelamento.status === 'Offboarding Financeiro' && (
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveAnexo(); }}>
                          <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  ) : cancelamento.status === 'Offboarding Financeiro' ? (
                    <label
                      className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors w-fit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">{uploadingAnexo ? 'Enviando...' : 'Anexar arquivo'}</span>
                      <input type="file" className="hidden" onChange={handleAnexo} disabled={uploadingAnexo} />
                    </label>
                  ) : (
                    <p className="text-xs text-gray-400">Sem anexo</p>
                  )}
                </div>

                {/* Responsável financeiro */}
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <div className="text-xs font-medium text-gray-500">Responsável</div>
                  {cancelamento.status === 'Offboarding Financeiro' ? (
                    <UserSelect
                      value={etapaFinanceira.responsavel || ''}
                      onChange={(email, name) => handleResponsavelFinanceiro(email)}
                      placeholder="Selecionar responsável..."
                    />
                  ) : (
                    <p className="text-xs text-gray-600 font-medium">{etapaFinanceira.responsavel || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">Observações</div>
                  {cancelamento.status === 'Offboarding Financeiro' ? (
                    <div className="space-y-1">
                      <Textarea
                        className="text-xs min-h-[60px] resize-none"
                        placeholder="Adicionar observações do financeiro..."
                        value={obsFinanceiro}
                        onChange={(e) => setObsFinanceiro(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onPaste={handlePasteAnexo}
                        onBlur={() => {
                          if (obsFinanceiro !== (etapaFinanceira.observacoes || '')) {
                            handleSaveObsFinanceiro();
                          }
                        }}
                      />
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        Cole uma print com <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">Ctrl+V</kbd> para anexar automaticamente
                      </p>
                      {obsFinanceiro !== (etapaFinanceira.observacoes || '') && (
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={handleSaveObsFinanceiro} disabled={savingObs}>
                          {savingObs ? 'Salvando...' : 'Salvar'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    etapaFinanceira.observacoes
                      ? <p className="text-xs text-gray-500 italic">"{etapaFinanceira.observacoes}"</p>
                      : <p className="text-xs text-gray-400">Sem observações</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ETAPA TÉCNICA ── */}
          {(cancelamento.status === 'Offboarding Técnico' || cancelamento.status === 'Cancelado') && (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border-b border-gray-200 text-sm font-medium text-orange-700">
                <Wrench className="w-4 h-4" />
                Offboarding Técnico
              </div>
              <div className="px-3 py-2 space-y-3">
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <div className="text-xs font-medium text-gray-500">Responsável</div>
                  {cancelamento.status === 'Offboarding Técnico' ? (
                    <UserSelect
                      value={cancelamento.responsavel_tecnico || ''}
                      onChange={(email, name) => handleResponsavelTecnico(email)}
                      placeholder="Selecionar responsável..."
                    />
                  ) : (
                    <p className="text-xs text-gray-600 font-medium">{cancelamento.responsavel_tecnico || 'Não informado'}</p>
                  )}
                </div>

                {/* Excluir PABX */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${cancelamento.id}-excluir_pabx`}
                    checked={!!etapas.excluir_pabx}
                    disabled={cancelamento.status === 'Cancelado'}
                    onCheckedChange={(v) => handleCheckTecnico('excluir_pabx', v)}
                  />
                  <label htmlFor={`${cancelamento.id}-excluir_pabx`} className={`text-sm cursor-pointer ${etapas.excluir_pabx ? 'line-through text-gray-400' : 'text-gray-700'}`}>Excluir PABX</label>
                  {etapas.excluir_pabx && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>

                {/* Cancelamento com a operadora + protocolo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${cancelamento.id}-cancelamento_operadora`}
                      checked={!!etapas.cancelamento_operadora}
                      disabled={cancelamento.status === 'Cancelado'}
                      onCheckedChange={(v) => handleCheckTecnico('cancelamento_operadora', v)}
                    />
                    <label htmlFor={`${cancelamento.id}-cancelamento_operadora`} className={`text-sm cursor-pointer ${etapas.cancelamento_operadora ? 'line-through text-gray-400' : 'text-gray-700'}`}>Cancelamento com a operadora</label>
                    {etapas.cancelamento_operadora && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                  {etapas.cancelamento_operadora && (
                    cancelamento.status === 'Offboarding Técnico' ? (
                      <div className="ml-6 flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 h-8 px-3 text-xs bg-white text-gray-900 border border-gray-300 rounded-md placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          placeholder="Número do protocolo..."
                          value={protocolo}
                          onChange={(e) => setProtocolo(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => { if (protocolo !== (etapas.cancelamento_operadora_protocolo || '')) handleSaveProtocolo(); }}
                        />
                        {protocolo !== (etapas.cancelamento_operadora_protocolo || '') && (
                          <Button size="sm" className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white border-0" onClick={handleSaveProtocolo}>
                            Salvar
                          </Button>
                        )}
                      </div>
                    ) : etapas.cancelamento_operadora_protocolo ? (
                      <div className="ml-6 flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Protocolo:</span>
                        <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{etapas.cancelamento_operadora_protocolo}</span>
                      </div>
                    ) : null
                  )}
                </div>

                {/* Verificar equipamentos */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${cancelamento.id}-verificar_equipamentos`}
                    checked={!!etapas.verificar_equipamentos}
                    disabled={cancelamento.status === 'Cancelado'}
                    onCheckedChange={(v) => handleCheckTecnico('verificar_equipamentos', v)}
                  />
                  <label htmlFor={`${cancelamento.id}-verificar_equipamentos`} className={`text-sm cursor-pointer ${etapas.verificar_equipamentos ? 'line-through text-gray-400' : 'text-gray-700'}`}>Verificar equipamentos</label>
                  {etapas.verificar_equipamentos && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>

                {/* Item Outros */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${cancelamento.id}-outros`}
                      checked={!!etapas.outros}
                      disabled={cancelamento.status === 'Cancelado'}
                      onCheckedChange={(v) => handleCheckTecnico('outros', v)}
                    />
                    <label
                      htmlFor={`${cancelamento.id}-outros`}
                      className={`text-sm cursor-pointer ${etapas.outros ? 'line-through text-gray-400' : 'text-gray-700'}`}
                    >
                      Outros
                    </label>
                    {etapas.outros && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                  {etapas.outros && (
                    cancelamento.status === 'Offboarding Técnico' ? (
                      <div className="ml-6 space-y-1">
                        <Textarea
                          className="text-xs min-h-[60px] resize-none bg-white text-gray-900 border-gray-300 placeholder:text-gray-400"
                          placeholder="Descreva o que foi feito..."
                          value={outrosObs}
                          onChange={(e) => setOutrosObs(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => {
                            if (outrosObs !== (etapas.outros_observacao || '')) handleSaveOutrosObs();
                          }}
                        />
                        {outrosObs !== (etapas.outros_observacao || '') && (
                          <Button size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white border-0" onClick={handleSaveOutrosObs}>
                            Salvar
                          </Button>
                        )}
                      </div>
                    ) : etapas.outros_observacao ? (
                      <div className="ml-6 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-700">{etapas.outros_observacao}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resumo final - Cancelado */}
          {cancelamento.status === 'Cancelado' && (
            <div className="border border-green-200 bg-green-50 rounded-lg px-3 py-2 space-y-2">
              <div className="text-xs font-semibold text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Cancelamento Concluído
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Solicitado por:</span>
                  <p className="text-gray-700 ml-2">{cancelamento.solicitante || '—'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Offboarding Financeiro:</span>
                  <p className="text-gray-700 ml-2">{etapaFinanceira.responsavel || '—'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Offboarding Técnico:</span>
                  <p className="text-gray-700 ml-2">{cancelamento.responsavel_tecnico || '—'}</p>
                </div>
                {cancelamento.data_conclusao && (
                  <div>
                    <span className="font-medium text-gray-600">Data de Conclusão:</span>
                    <p className="text-gray-700 ml-2">{format(new Date(cancelamento.data_conclusao), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações gerais */}
          {cancelamento.observacoes && (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg px-3 py-2">
              <div className="text-xs font-semibold text-yellow-700 mb-1">Observação</div>
              <p className="text-sm text-gray-700">{cancelamento.observacoes}</p>
            </div>
          )}

          {/* Botão avançar */}
          {cancelamento.status !== 'Cancelado' && (
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                className={
                  cancelamento.status === 'Offboarding Técnico'
                    ? `bg-green-600 hover:bg-green-700 text-white ${!allTecnicoDone ? 'opacity-50 cursor-not-allowed' : ''}`
                    : cancelamento.status === 'Offboarding Financeiro'
                    ? `bg-blue-600 hover:bg-blue-700 text-white ${!financeiroConcludo ? 'opacity-50 cursor-not-allowed' : ''}`
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
                onClick={handleMoveNext}
                disabled={updateMutation.isPending || !canMoveNext}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                {NEXT_LABEL[cancelamento.status]}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}