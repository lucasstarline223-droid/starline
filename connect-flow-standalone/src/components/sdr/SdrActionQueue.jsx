import React, { useState } from 'react';
import { AlertTriangle, Users, Target, ChevronDown, ChevronUp, Phone, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RegistrarContatoModal from './RegistrarContatoModal';
import QualificarProspectModal from './QualificarProspectModal';

export default function SdrActionQueue({ user }) {
  const queryClient = useQueryClient();
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const [expanded, setExpanded] = useState({ overdue: true, leads: true, prospects: true });
  const [contatoModal, setContatoModal] = useState({ open: false, item: null, type: null });
  const [qualModal, setQualModal] = useState({ open: false, prospect: null });

  const { data: tasks = [] } = useQuery({
    queryKey: ['sdrTasks', user?.email],
    queryFn: () => base44.entities.SdrTask.filter({ sdr_responsavel: user?.email }),
    enabled: !!user?.email
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads', user?.email],
    queryFn: () => base44.entities.Lead.filter({ sdr: user?.email }),
    enabled: !!user?.email
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects', user?.email],
    queryFn: () => base44.entities.Prospect.filter({ sdr: user?.email }),
    enabled: !!user?.email
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['sdrActivities', user?.email],
    queryFn: () => base44.entities.SdrActivity.filter({ sdr_email: user?.email }),
    enabled: !!user?.email
  });

  const convertLeadMutation = useMutation({
    mutationFn: (lead) => base44.functions.invoke('convertLeadToProspect', { lead_id: lead.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['prospects']);
      queryClient.invalidateQueries(['leadsConvertidosHoje']);
    }
  });

  // Follow-ups vencidos
  const overdueFollowups = tasks.filter(t =>
    t.status === 'Pendente' && t.data_vencimento && t.data_vencimento < hoje
  );

  // Leads sem nenhum contato
  const leadsComContato = new Set(
    activities.filter(a => a.related_entity_type === 'Lead').map(a => a.related_entity_id)
  );
  const leadsSemContato = leads.filter(l =>
    ['novo', 'em_prospeccao'].includes(l.status) && !leadsComContato.has(l.id)
  );

  // Prospects em qualificação
  const prospectsParaQualificar = prospects.filter(p =>
    ['em_qualificacao', 'em_contato'].includes(p.status)
  );

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const Section = ({ id, icon: Icon, title, count, color, bgColor, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count > 0 ? `${bgColor} ${color}` : 'bg-gray-100 text-gray-500'}`}>
            {count}
          </span>
        </div>
        {expanded[id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded[id] && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {count === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center">Nenhum item nesta fila ✅</p>
          ) : children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Fila de Ações</h2>

      {/* Follow-ups vencidos */}
      <Section
        id="overdue"
        icon={AlertTriangle}
        title="Follow-ups Vencidos"
        count={overdueFollowups.length}
        color="text-red-600"
        bgColor="bg-red-50"
      >
        {overdueFollowups.map(task => (
          <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{task.titulo}</p>
              <p className="text-xs text-gray-500">
                {task.prospect_nome && <span>{task.prospect_nome} · </span>}
                Venceu em {format(new Date(task.data_vencimento + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-3 shrink-0 text-xs border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setContatoModal({ open: true, item: { ...task, nome_empresa: task.prospect_nome }, type: 'Lead' })}
            >
              <Phone className="w-3 h-3 mr-1" /> Registrar
            </Button>
          </div>
        ))}
      </Section>

      {/* Leads sem contato */}
      <Section
        id="leads"
        icon={Users}
        title="Leads Sem Contato"
        count={leadsSemContato.length}
        color="text-yellow-600"
        bgColor="bg-yellow-50"
      >
        {leadsSemContato.map(lead => (
          <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{lead.nome_empresa}</p>
              <p className="text-xs text-gray-500">
                {lead.fonte_lead && <span>{lead.fonte_lead} · </span>}
                {lead.nome_contato}
              </p>
            </div>
            <div className="flex gap-2 ml-3 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                onClick={() => setContatoModal({ open: true, item: lead, type: 'Lead' })}
              >
                <Phone className="w-3 h-3 mr-1" /> Contatar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                disabled={convertLeadMutation.isPending}
                onClick={() => convertLeadMutation.mutate(lead)}
              >
                <UserPlus className="w-3 h-3 mr-1" /> Converter
              </Button>
            </div>
          </div>
        ))}
      </Section>

      {/* Prospects para qualificar */}
      <Section
        id="prospects"
        icon={Target}
        title="Prospects para Qualificar"
        count={prospectsParaQualificar.length}
        color="text-green-600"
        bgColor="bg-green-50"
      >
        {prospectsParaQualificar.map(prospect => (
          <div key={prospect.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{prospect.nome_empresa}</p>
              <p className="text-xs text-gray-500">
                {prospect.servicos_interessados?.join(', ') || 'Serviços não definidos'}
              </p>
            </div>
            <div className="flex gap-2 ml-3 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => setContatoModal({ open: true, item: prospect, type: 'Prospect' })}
              >
                <Phone className="w-3 h-3 mr-1" /> Contatar
              </Button>
              <Button
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setQualModal({ open: true, prospect })}
              >
                <Target className="w-3 h-3 mr-1" /> Qualificar
              </Button>
            </div>
          </div>
        ))}
      </Section>

      {/* Modais */}
      {contatoModal.open && (
        <RegistrarContatoModal
          isOpen={contatoModal.open}
          onClose={() => setContatoModal({ open: false, item: null, type: null })}
          item={contatoModal.item}
          itemType={contatoModal.type}
          user={user}
        />
      )}

      {qualModal.open && (
        <QualificarProspectModal
          isOpen={qualModal.open}
          onClose={() => setQualModal({ open: false, prospect: null })}
          prospect={qualModal.prospect}
          user={user}
        />
      )}
    </div>
  );
}