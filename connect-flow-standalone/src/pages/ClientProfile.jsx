import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  DollarSign, 
  Activity,
  Ticket,
  Clock,
  ClipboardList,
  Package,
  Plus,
  Pencil,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ClientModal from '@/components/comercial/ClientModal';
import NumeroDIDModal from '@/components/comercial/NumeroDIDModal';
import HistoricoModal from '@/components/chamados/HistoricoModal';

export default function ClientProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [chamadoHistorico, setChamadoHistorico] = useState(null);
  const [showDIDModal, setShowDIDModal] = useState(false);
  const [editingDID, setEditingDID] = useState(null);
  
  // Get clientId from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId,
  });

  const { data: clientNumbers = [], isLoading: isLoadingNumbers } = useQuery({
    queryKey: ['clientNumbers', clientId],
    queryFn: () => base44.entities.NumeroDID.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const { data: pricingRules = [] } = useQuery({
    queryKey: ['pricingRules'],
    queryFn: () => base44.entities.NumeroDIDPricing.list(),
  });

  const { data: chamados = [] } = useQuery({
    queryKey: ['clientChamados', clientId],
    queryFn: async () => {
      if (!client) return [];
      return base44.entities.Chamado.filter({ client_id: clientId });
    },
    enabled: !!clientId && !!client,
  });

  const { data: equipamentosAlocados = [] } = useQuery({
    queryKey: ['equipamentos-alocados', clientId],
    queryFn: () => base44.entities.EquipamentoAlocado.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const resolverMutation = useMutation({
    mutationFn: (chamadoId) => base44.entities.Chamado.update(chamadoId, { status: 'Resolvido' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientChamados'] });
    }
  });

  const calcularCustoMensal = (numero) => {
    if (!client || !numero.tipo || !numero.fornecedor) return null;
    
    const regra = pricingRules.find(r => 
      r.tipo_numero === numero.tipo && 
      r.fornecedor_numero === numero.fornecedor &&
      (r.tipo_cliente === client.pj_ou_pf || r.tipo_cliente === 'Ambos')
    );
    
    return regra ? regra.preco_mensal : null;
  };

  const getNumeroDidTipoColor = (tipo) => {
    const colors = {
      'DID': 'bg-blue-100 text-blue-700',
      'DDR': 'bg-purple-100 text-purple-700',
      '0800': 'bg-green-100 text-green-700',
      'Móvel': 'bg-orange-100 text-orange-700'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  };

  const getNumeroDidStatusColor = (status) => {
    const colors = {
      'Ativo': 'bg-green-100 text-green-700',
      'Inativo': 'bg-gray-100 text-gray-700',
      'Portabilidade': 'bg-yellow-100 text-yellow-700',
      'Aguardando Ativação': 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando perfil do cliente...</div>;
  }

  if (!client) {
    return <div className="p-8 text-center">Cliente não encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-8 py-4 border-b border-gray-200 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(createPageUrl('Clientes'))} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button className="flex items-center gap-2" onClick={() => setShowEditModal(true)}>
          <Edit className="w-4 h-4" />
          Editar
        </Button>
      </div>

      {/* Client Overview */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-8 text-white flex items-center gap-6">
        <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center text-5xl font-bold text-indigo-700">
          {client.razao_social ? client.razao_social.charAt(0) : '?'}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{client.razao_social}</h1>
          {client.nome_fantasia && (
            <p className="text-lg mt-1 opacity-90">{client.nome_fantasia}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            {client.pj_ou_pf && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                {client.pj_ou_pf === 'Pessoa Jurídica' ? 'PJ' : 'PF'}
              </Badge>
            )}
            {client.status && (
              <Badge variant="secondary" className="bg-green-500/80 text-white border-green-400 hover:bg-green-500">
                {client.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact, Details, etc. */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contato</h2>
            <div className="space-y-3">
              {client.telefone_contato && (
                <div className="flex items-center gap-3 text-gray-700 text-base">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span>{client.telefone_contato}</span>
                </div>
              )}
              {client.email_financeiro && (
                <div className="flex items-center gap-3 text-gray-700 text-base">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span>{client.email_financeiro}</span>
                </div>
              )}
              {client.site_cliente && (
                <div className="flex items-center gap-3 text-gray-700 text-base">
                  <Activity className="w-5 h-5 text-gray-500" />
                  <a href={client.site_cliente} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {client.site_cliente}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* General Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações Gerais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-base">
              <div>
                <p className="font-medium text-gray-600">CNPJ/CPF:</p>
                <p>{client.cnpj_cpf}</p>
              </div>
              {client.segmento && (
                <div>
                  <p className="font-medium text-gray-600">Segmento:</p>
                  <p>{client.segmento}</p>
                </div>
              )}
              {client.tamanho_empresa && (
                <div>
                  <p className="font-medium text-gray-600">Tamanho da Empresa:</p>
                  <p>{client.tamanho_empresa}</p>
                </div>
              )}
              {client.endereco && (
                <div className="md:col-span-2">
                  <p className="font-medium text-gray-600">Endereço:</p>
                  <p>{client.endereco}</p>
                  {client.endereco_completo && <p className="text-sm text-gray-500">{client.endereco_completo}</p>}
                </div>
              )}
              {client.observacoes && (
                <div className="md:col-span-2">
                  <p className="font-medium text-gray-600">Observações:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.observacoes}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Números DID/DDR */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Números DID/DDR</h2>
            <Button size="sm" variant="outline" className="flex items-center gap-1.5" onClick={() => { setEditingDID(null); setShowDIDModal(true); }}>
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </div>
            {isLoadingNumbers ? (
              <p className="text-gray-500">Carregando números...</p>
            ) : clientNumbers.length > 0 ? (
              <div className="space-y-4">
                {clientNumbers.map((num) => {
                  const custoMensal = calcularCustoMensal(num);
                  return (
                    <div key={num.id} className={`p-3 border rounded-lg transition-colors ${num.status === 'Cancelado' ? 'border-red-200 bg-red-50/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Phone className="w-5 h-5 text-blue-500" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{num.numero}</p>
                            <p className="text-sm text-gray-500">
                              Fornecedor: {num.fornecedor || '-'} | Operadora: {num.operadora || '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {custoMensal !== null && (
                            <div className="text-right mr-2">
                              <p className="text-sm font-semibold text-green-600">
                                R$ {custoMensal.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">por mês</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge className={`${getNumeroDidTipoColor(num.tipo)} border`}>{num.tipo}</Badge>
                            <Badge className={`${getNumeroDidStatusColor(num.status)} border`}>{num.status}</Badge>
                          </div>
                          <button
                            onClick={() => { setEditingDID(num); setShowDIDModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
                            title="Editar número"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {num.status === 'Cancelado' && (num.cancelamento_motivo || num.cancelamento_data) && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-1.5 text-red-700 font-semibold text-sm mb-1.5">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            Número Cancelado
                          </div>
                          {num.cancelamento_motivo && (
                            <p className="text-sm text-gray-700">Motivo: {num.cancelamento_motivo}</p>
                          )}
                          {num.cancelamento_data && (
                            <p className="text-sm text-gray-700">Data: {num.cancelamento_data}</p>
                          )}
                          {num.cancelamento_id && (
                            <a
                              href={`/Cancelamentos?highlight=${num.cancelamento_id}`}
                              className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline mt-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver detalhes do Cancelamento
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum número DID/DDR registrado para este cliente.</p>
            )}
          </div>

          {/* Equipamentos Alocados */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              Equipamentos Instalados
            </h2>
            {equipamentosAlocados.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum equipamento registrado para este cliente.</p>
            ) : (
              <div className="space-y-3">
                {equipamentosAlocados.map(eq => {
                  const chamadoRef = chamados.find(c => c.id === eq.chamado_id);
                  return (
                    <div key={eq.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                      {eq.hardware_url_foto ? (
                        <img src={eq.hardware_url_foto} alt={eq.hardware_nome} className="w-12 h-12 object-contain rounded-lg bg-gray-50 border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">📦</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{eq.hardware_nome}</p>
                        <p className="text-xs text-gray-500">{eq.hardware_fabricante} · {eq.quantidade} un.</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Instalado por <strong>{eq.tecnico_nome}</strong> em {eq.data_alocacao}
                        </p>
                        {eq.observacoes && <p className="text-xs text-gray-400 italic">{eq.observacoes}</p>}
                      </div>
                      {chamadoRef && (
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => setChamadoHistorico(chamadoRef)}
                            className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            {chamadoRef.tipo_suporte}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chamados Recentes */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Chamados Recentes</h2>
            {chamados.length === 0 ? (
              <p className="text-amber-600 text-sm">Nenhum chamado registrado ainda.</p>
            ) : (
              <div className="space-y-3">
                {chamados.slice().sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(chamado => {
                  const statusColors = {
                    'Aberto': 'bg-blue-100 text-blue-700',
                    'Em Andamento': 'bg-yellow-100 text-yellow-700',
                    'Aguardando Cliente': 'bg-orange-100 text-orange-700',
                    'Resolvido': 'bg-green-100 text-green-700',
                    'Fechado': 'bg-gray-100 text-gray-600',
                  };
                  const prioColors = {
                    'Baixa': 'bg-gray-100 text-gray-600',
                    'Média': 'bg-blue-100 text-blue-600',
                    'Alta': 'bg-orange-100 text-orange-700',
                    'Urgente': 'bg-red-100 text-red-700',
                  };
                  return (
                    <div key={chamado.id} className="flex items-start justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Ticket className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{chamado.descricao}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(chamado.created_date).toLocaleDateString('pt-BR')}</span>
                            {chamado.produto && <><span>·</span><span>{chamado.produto}</span></>}
                            {chamado.tipo_suporte && <><span>·</span><span>{chamado.tipo_suporte}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <Badge className={`${prioColors[chamado.prioridade] || 'bg-gray-100 text-gray-600'} border text-xs`}>{chamado.prioridade}</Badge>
                        <Badge className={`${statusColors[chamado.status] || 'bg-gray-100 text-gray-600'} border text-xs`}>{chamado.status}</Badge>
                        <button
                           onClick={() => setChamadoHistorico(chamado)}
                           className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                           title="Ver o que foi feito"
                         >
                           <ClipboardList className="w-3.5 h-3.5" />
                           Ver
                         </button>
                         {chamado.status !== 'Resolvido' && chamado.status !== 'Fechado' && (
                           <button
                             onClick={() => resolverMutation.mutate(chamado.id)}
                             disabled={resolverMutation.isPending}
                             className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                             title="Marcar como resolvido"
                           >
                             <CheckCircle2 className="w-3.5 h-3.5" />
                             {resolverMutation.isPending ? 'Resolvendo...' : 'Resolvido'}
                           </button>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Important Dates, Contributions, etc. */}
        <div className="lg:col-span-1 space-y-6">
          {/* Health Score */}
          {client.health_score !== null && client.health_score !== undefined && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Health Score</h2>
              <div className="flex items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{client.health_score}</span>
                </div>
                <p className="text-gray-600">Pontuação de saúde do cliente</p>
              </div>
            </div>
          )}

          {/* Placeholder for Important Dates */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Datas Importantes</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700 text-base">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Nascimento</p>
                  <p className="font-medium">--/--/----</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 text-base">
                <Calendar className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Aniversário de Contrato</p>
                  <p className="font-medium">--/--/----</p>
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder for Contributions / Financeiro */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contribuições</h2>
            <div className="text-center bg-green-50 rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-600 mb-1">Total em Doações</p>
              <p className="text-3xl font-bold text-green-600">R$ 0,00</p>
            </div>
            <p className="text-gray-500 text-sm">0 contribuições registradas</p>
          </div>

          {/* Placeholder for Meeting Frequency */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Frequência nas Reuniões</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-xs text-gray-500">Presenças</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">0</p>
                <p className="text-xs text-gray-500">Justificadas</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">0</p>
                <p className="text-xs text-gray-500">Faltas</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Taxa de Presença</span>
                <span className="font-semibold text-gray-900">0%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClientModal 
        client={client} 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
      />

      <NumeroDIDModal
        numero={editingDID}
        isOpen={showDIDModal}
        onClose={() => { setShowDIDModal(false); setEditingDID(null); queryClient.invalidateQueries({ queryKey: ['clientNumbers', clientId] }); }}
        defaultClientId={clientId}
        defaultClientName={client?.nome_fantasia || client?.razao_social}
      />

      {chamadoHistorico && (
        <HistoricoModal
          chamado={chamadoHistorico}
          onClose={() => setChamadoHistorico(null)}
        />
      )}
    </div>
  );
}