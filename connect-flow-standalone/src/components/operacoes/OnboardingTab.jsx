import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import HandoffModal from '@/components/comercial/HandoffModal';
import { CheckCircle2, Circle, AlertCircle, Rocket, Settings, PackageCheck, User, Calendar, Wrench } from 'lucide-react';

const CHECKLIST_LABELS = {
  ambiente_configurado: 'Ambiente configurado',
  ramais_provisionados: 'Ramais provisionados',
  portabilidade_concluida: 'Portabilidade concluída',
  testes_realizados: 'Testes realizados',
  cliente_treinado: 'Cliente treinado'
};

function getPhase(handoff) {
  const cl = handoff.checklist_ativacao || {};
  const keys = Object.keys(CHECKLIST_LABELS);
  const done = keys.filter(k => cl[k]).length;
  if (done === keys.length) return 'concluido';
  if (done > 0) return 'configuracao';
  return 'analise';
}

const PHASES = [
  {
    key: 'analise',
    label: 'Análise',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700'
  },
  {
    key: 'configuracao',
    label: 'Configuração de Ambiente',
    icon: Settings,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700'
  },
  {
    key: 'concluido',
    label: 'Concluído',
    icon: PackageCheck,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700'
  }
];

function ChecklistProgress({ checklist }) {
  const keys = Object.keys(CHECKLIST_LABELS);
  const done = keys.filter(k => checklist?.[k]).length;
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Checklist</span>
        <span className="text-xs font-medium text-gray-700">{done}/{keys.length}</span>
      </div>
      <div className="flex gap-1">
        {keys.map(k => (
          <div
            key={k}
            className={`flex-1 h-1.5 rounded-full ${checklist?.[k] ? 'bg-green-500' : 'bg-gray-200'}`}
            title={CHECKLIST_LABELS[k]}
          />
        ))}
      </div>
    </div>
  );
}

function ActivationCard({ handoff, onClick }) {
  const phase = getPhase(handoff);
  const phaseInfo = PHASES.find(p => p.key === phase);

  return (
    <div
      onClick={() => onClick(handoff)}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
            {handoff.nome_empresa || handoff.razao_social}
          </h3>
          {handoff.cnpj_cpf && (
            <p className="text-xs text-gray-500 mt-0.5">{handoff.cnpj_cpf}</p>
          )}
        </div>
        {handoff.categoria && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
            {handoff.categoria}
          </span>
        )}
      </div>

      {handoff.produto_contratado && (
        <p className="text-xs text-gray-600 mb-2">{handoff.produto_contratado}</p>
      )}

      <div className="flex flex-col gap-1.5 text-xs text-gray-500">
        {handoff.responsavel_tecnico && (
          <div className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" />
            <span>{handoff.responsavel_tecnico}</span>
          </div>
        )}
        {handoff.data_fechamento && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Fechamento: {new Date(handoff.data_fechamento).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
        {handoff.valor_mrr > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-green-600">
              MRR: R$ {handoff.valor_mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      <ChecklistProgress checklist={handoff.checklist_ativacao} />

      {handoff.hardware_status_estoque === 'Indisponível' && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5" />
          Aguardando hardware
        </div>
      )}
    </div>
  );
}

export default function OnboardingTab() {
  const [selectedHandoff, setSelectedHandoff] = useState(null);
  const queryClient = useQueryClient();

  const { data: handoffs = [], isLoading } = useQuery({
    queryKey: ['handoffs-ativacao'],
    queryFn: () => base44.entities.HandoffSDD.filter({ etapa_atual: 'order_to_activation' })
  });

  const handleClose = () => {
    setSelectedHandoff(null);
    queryClient.invalidateQueries({ queryKey: ['handoffs-ativacao'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Carregando...
      </div>
    );
  }

  if (handoffs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Nenhum cliente em ativação no momento</p>
        <p className="text-gray-400 text-sm mt-1">Os handoffs avançados para "Ordem de Ativação" aparecerão aqui</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PHASES.map(phase => {
          const Icon = phase.icon;
          const items = handoffs.filter(h => getPhase(h) === phase.key);
          return (
            <div key={phase.key} className={`rounded-xl border ${phase.border} ${phase.bg} p-4`}>
              <div className={`flex items-center gap-2 mb-4`}>
                <Icon className={`w-5 h-5 ${phase.color}`} />
                <h2 className={`font-semibold ${phase.color}`}>{phase.label}</h2>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${phase.badge}`}>
                  {items.length}
                </span>
              </div>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Nenhum item</p>
                ) : (
                  items.map(h => (
                    <ActivationCard key={h.id} handoff={h} onClick={setSelectedHandoff} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedHandoff && (
        <HandoffModal
          handoff={selectedHandoff}
          isOpen={!!selectedHandoff}
          onClose={handleClose}
        />
      )}
    </>
  );
}