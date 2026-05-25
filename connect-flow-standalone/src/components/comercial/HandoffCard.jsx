import React from 'react';
import { DollarSign, Calendar, User, AlertTriangle, CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

const ETAPAS = [
  { key: 'coleta_dados', label: 'Coleta de Dados', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  { key: 'pronto_assinatura', label: 'Pronto p/ Assinatura', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  { key: 'aguardando_assinatura', label: 'Aguard. Assinatura', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  { key: 'order_to_activation', label: 'Order to Activation', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  { key: 'concluido', label: 'Concluído', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' }
];

export default function HandoffCard({ handoff }) {
  const etapaIndex = ETAPAS.findIndex(e => e.key === handoff.etapa_atual);
  const etapaInfo = ETAPAS[etapaIndex] || ETAPAS[0];
  const progressoPct = Math.round((etapaIndex / (ETAPAS.length - 1)) * 100);

  // Dias aguardando assinatura
  const diasAguardando = handoff.data_envio_contrato
    ? differenceInDays(new Date(), parseISO(handoff.data_envio_contrato))
    : null;

  const alertaAssinatura = handoff.etapa_atual === 'aguardando_assinatura' && diasAguardando !== null;
  const corAlertaAssinatura = diasAguardando >= 4 ? 'text-red-600 bg-red-50 border-red-200' :
    diasAguardando >= 2 ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
    'text-gray-500 bg-gray-50 border-gray-200';

  // Alerta coleta atrasada
  const diasFechamento = handoff.data_fechamento
    ? differenceInDays(new Date(), parseISO(handoff.data_fechamento))
    : null;
  const alertaColeta = handoff.etapa_atual === 'coleta_dados' && diasFechamento !== null && diasFechamento > 5;

  return (
    <div className={`bg-white rounded-xl p-4 border hover:shadow-md transition-all hover:border-gray-300 ${
      alertaColeta || (alertaAssinatura && diasAguardando >= 4) ? 'border-red-300' : 'border-gray-200'
    }`}>
      {/* Alerta coleta atrasada */}
      {alertaColeta && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
          <AlertTriangle className="w-3.5 h-3.5" />
          {diasFechamento}d sem avançar na coleta!
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{handoff.nome_empresa || 'Sem nome'}</h4>
          {handoff.produto_contratado && (
            <p className="text-xs text-gray-500 truncate">{handoff.produto_contratado}</p>
          )}
        </div>
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${etapaInfo.color}`}>
          {etapaInfo.label}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-1.5 mb-3">
        {handoff.valor_mrr > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-3.5 h-3.5 text-green-500" />
            <span className="font-semibold text-green-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(handoff.valor_mrr)}/mês
            </span>
          </div>
        )}
        {handoff.data_fechamento && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            Fechado em {handoff.data_fechamento}
            {diasFechamento !== null && (
              <span className={`font-medium ${diasFechamento > 5 ? 'text-red-600' : ''}`}>({diasFechamento}d)</span>
            )}
          </div>
        )}
        {handoff.responsavel_coleta && handoff.etapa_atual === 'coleta_dados' && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User className="w-3.5 h-3.5 text-blue-400" />
            {handoff.responsavel_coleta}
          </div>
        )}
        {handoff.responsavel_tecnico && handoff.etapa_atual === 'order_to_activation' && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User className="w-3.5 h-3.5 text-purple-400" />
            Técnico: {handoff.responsavel_tecnico}
          </div>
        )}
      </div>

      {/* Alerta aguardando assinatura */}
      {alertaAssinatura && (
        <div className={`flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg text-xs font-semibold border ${corAlertaAssinatura}`}>
          <Clock className="w-3.5 h-3.5" />
          Aguardando há {diasAguardando} dia{diasAguardando !== 1 ? 's' : ''}
        </div>
      )}

      {/* Ícone WhatsApp se foi enviado */}
      {handoff.data_envio_contrato && handoff.etapa_atual === 'aguardando_assinatura' && (
        <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
          <MessageCircle className="w-3.5 h-3.5" />
          Contrato enviado via WhatsApp
        </div>
      )}

      {/* Progresso */}
      <div className="mt-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all ${progressoPct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressoPct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          {ETAPAS.map((etapa, idx) => (
            <div key={etapa.key} className={`w-2 h-2 rounded-full ${idx <= etapaIndex ? etapa.dot : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}