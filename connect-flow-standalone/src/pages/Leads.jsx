import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, LayoutGrid, List, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import KanbanBoard from '../components/comercial/KanbanBoard';
import LeadCard from '../components/comercial/LeadCard';
import LeadModal from '../components/comercial/LeadModal';
import ActivityModal from '../components/comercial/ActivityModal';
import DescartarLeadModal from '../components/comercial/DescartarLeadModal';
import { differenceInDays, parseISO } from 'date-fns';

const FONTES = ['Site', 'Indicação', 'Cold Call', 'Lista Speedio', 'WhatsApp', 'Redes Sociais', 'Evento', 'Outro'];

const TEMPO_CONTATO_OPTIONS = [
  { label: 'Todos', value: '__all__' },
  { label: 'Até 2 dias', value: 'verde' },
  { label: '3 a 5 dias', value: 'amarelo' },
  { label: 'Mais de 5 dias', value: 'vermelho' },
  { label: 'Sem contato', value: 'sem_contato' },
];

function getTempoContato(ultimoContato) {
  if (!ultimoContato) return 'sem_contato';
  const dias = differenceInDays(new Date(), parseISO(ultimoContato));
  if (dias <= 2) return 'verde';
  if (dias <= 5) return 'amarelo';
  return 'vermelho';
}

export default function Leads() {
  const [viewMode, setViewMode] = useState('kanban');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityData, setActivityData] = useState({ entityId: '', entityType: '', entityName: '', preSelectedType: '' });
  const [user, setUser] = useState(null);
  const [descartarLead, setDescartarLead] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  // Filtros
  const [filtroSdr, setFiltroSdr] = useState('');
  const [filtroFonte, setFiltroFonte] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroTempo, setFiltroTempo] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => base44.entities.User.list()
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  });

  const convertToProspectMutation = useMutation({
    mutationFn: (leadId) => base44.functions.invoke('convertLeadToProspect', {
      event: { type: 'update', entity_name: 'Lead', entity_id: leadId },
      data: leads.find(l => l.id === leadId)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
    }
  });

  const columns = [
    { label: 'Novo', value: 'novo' },
    { label: 'Em Prospecção', value: 'em_prospeccao' },
    { label: 'Convertido', value: 'convertido' },
    { label: 'Descartado', value: 'descartado' }
  ];

  const handleStatusChange = async (lead, newStatus) => {
    if (newStatus === 'descartado') {
      setDescartarLead(lead);
      setPendingStatus(newStatus);
      return;
    }
    await updateLeadMutation.mutateAsync({ id: lead.id, data: { status: newStatus } });
    if (newStatus === 'convertido') convertToProspectMutation.mutate(lead.id);
  };

  const handleConfirmarDescarte = async (motivo) => {
    if (!descartarLead) return;
    await updateLeadMutation.mutateAsync({
      id: descartarLead.id,
      data: { status: 'descartado', motivo_descarte: motivo }
    });
    setDescartarLead(null);
    setPendingStatus(null);
  };

  const handleItemClick = (lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleNewLead = () => {
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  const handleRegisterActivity = (lead, activityType) => {
    setActivityData({ entityId: lead.id, entityType: 'Lead', entityName: lead.nome_empresa || 'Sem nome', preSelectedType: activityType });
    setIsActivityModalOpen(true);
  };

  // SDRs únicos para o filtro
  const sdrsUnicos = useMemo(() => {
    const map = new Map();
    leads.forEach(l => {
      if (l.sdr) map.set(l.sdr, l.sdr_nome || l.sdr);
    });
    return Array.from(map.entries()).map(([email, nome]) => ({ email, nome }));
  }, [leads]);

  const temFiltros = (filtroSdr && filtroSdr !== '__all__') || (filtroFonte && filtroFonte !== '__all__') || filtroDataInicio || filtroDataFim || (filtroTempo && filtroTempo !== '__all__');

  const leadsFiltrados = useMemo(() => {
    return leads.filter(l => {
      if (filtroSdr && filtroSdr !== '__all__' && l.sdr !== filtroSdr) return false;
      if (filtroFonte && filtroFonte !== '__all__' && l.fonte_lead !== filtroFonte) return false;
      if (filtroDataInicio && l.created_date < filtroDataInicio) return false;
      if (filtroDataFim && l.created_date > filtroDataFim + 'T23:59:59') return false;
      if (filtroTempo && filtroTempo !== '__all__' && getTempoContato(l.ultimo_contato) !== filtroTempo) return false;
      return true;
    });
  }, [leads, filtroSdr, filtroFonte, filtroDataInicio, filtroDataFim, filtroTempo]);

  const limparFiltros = () => {
    setFiltroSdr('');
    setFiltroFonte('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroTempo('');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><div className="text-gray-500">Carregando...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600 mt-1">{leadsFiltrados.length} leads {temFiltros ? 'filtrados' : 'no total'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={handleNewLead} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>Filtros:</span>
          </div>

          <Select value={filtroSdr} onValueChange={setFiltroSdr}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="SDR Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os SDRs</SelectItem>
              {sdrsUnicos.map(s => <SelectItem key={s.email} value={s.email}>{s.nome}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filtroFonte} onValueChange={setFiltroFonte}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Fonte do Lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as fontes</SelectItem>
              {FONTES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filtroTempo} onValueChange={setFiltroTempo}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Tempo sem contato" />
            </SelectTrigger>
            <SelectContent>
              {TEMPO_CONTATO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">De:</span>
            <Input type="date" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} className="w-36 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Até:</span>
            <Input type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} className="w-36 h-8 text-xs" />
          </div>

          {temFiltros && (
            <button onClick={limparFiltros} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors">
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            columns={columns}
            items={leadsFiltrados}
            onStatusChange={handleStatusChange}
            onItemClick={handleItemClick}
            renderCard={(lead) => <LeadCard lead={lead} onRegisterActivity={handleRegisterActivity} />}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fonte</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SDR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leadsFiltrados.map((lead) => {
                  const tempo = getTempoContato(lead.ultimo_contato);
                  const tempoCor = { verde: 'text-green-600', amarelo: 'text-yellow-600', vermelho: 'text-red-600', sem_contato: 'text-gray-400' }[tempo];
                  return (
                    <tr key={lead.id} onClick={() => handleItemClick(lead)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-6 py-4"><div className="font-medium text-gray-900">{lead.nome_empresa}</div></td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{lead.nome_contato}</div>
                        <div className="text-xs text-gray-500">{lead.email_contato}</div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-gray-700">{lead.fonte_lead}</span></td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">{lead.status?.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.sdr_nome || lead.sdr}</td>
                      <td className={`px-6 py-4 text-sm font-medium ${tempoCor}`}>
                        {lead.ultimo_contato ? new Date(lead.ultimo_contato).toLocaleDateString('pt-BR') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <LeadModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedLead(null); }}
        />
      )}

      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => { setIsActivityModalOpen(false); setActivityData({ entityId: '', entityType: '', entityName: '', preSelectedType: '' }); }}
        entityId={activityData.entityId}
        entityType={activityData.entityType}
        entityName={activityData.entityName}
        preSelectedType={activityData.preSelectedType}
        user={user}
      />

      {descartarLead && (
        <DescartarLeadModal
          lead={descartarLead}
          onConfirm={handleConfirmarDescarte}
          onCancel={() => { setDescartarLead(null); setPendingStatus(null); }}
        />
      )}
    </div>
  );
}