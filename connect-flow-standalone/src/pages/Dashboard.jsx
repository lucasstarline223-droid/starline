import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

const STATUS_LABELS = {
  // Leads
  novo: 'Novo',
  em_prospeccao: 'Em Prospecção',
  descartado: 'Descartado',
  convertido: 'Convertido',
  // Prospects
  em_qualificacao: 'Em Qualificação',
  em_contato: 'Em Contato',
  qualificado: 'Qualificado',
  // Deals
  qualificacao_ae: 'Qualificação AE',
  apresentacao: 'Apresentação',
  proposta_enviada: 'Proposta Enviada',
  em_negociacao: 'Em Negociação',
  coleta_dados: 'Coleta de Dados',
  arquivado: 'Arquivado',
  fechado_perdido: 'Fechado — Perdido',
  fechado_ganho: 'Fechado — Ganho',
};

export default function Dashboard() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list()
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list()
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list()
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: followupsVencidos = [] } = useQuery({
    queryKey: ['followups-vencidos'],
    queryFn: () => base44.entities.SdrTask.filter({ tipo: 'Follow-up' })
  });
  const followupsAtrasados = followupsVencidos.filter(t =>
    !['Concluída', 'Cancelada'].includes(t.status) && t.data_vencimento && t.data_vencimento <= today
  );

  const stats = [
    {
      label: 'Leads',
      value: leads.length,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+12%',
      positive: true
    },
    {
      label: 'Prospects',
      value: prospects.length,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+8%',
      positive: true
    },
    {
      label: 'Oportunidades',
      value: deals.length,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '+15%',
      positive: true
    },
    {
      label: 'MRR Total',
      value: `R$ ${deals.reduce((sum, d) => sum + (d.valor_mrr || 0), 0).toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+23%',
      positive: true
    }
  ];

  const getLeadsByStatus = () => {
    const statusCount = {};
    leads.forEach(lead => {
      statusCount[lead.status] = (statusCount[lead.status] || 0) + 1;
    });
    return statusCount;
  };

  const getProspectsByStatus = () => {
    const statusCount = {};
    prospects.forEach(prospect => {
      statusCount[prospect.status] = (statusCount[prospect.status] || 0) + 1;
    });
    return statusCount;
  };

  const getDealsByStatus = () => {
    const statusCount = {};
    deals.forEach(deal => {
      statusCount[deal.status] = (statusCount[deal.status] || 0) + 1;
    });
    return statusCount;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Comercial</h1>
        <p className="text-gray-600 mt-1">Visão geral do pipeline de vendas</p>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {stat.positive ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={stat.positive ? 'text-green-600' : 'text-red-600'}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Alerta Follow-ups */}
        <Link to="/SdrDashboard" className="block mb-8">
          <div className={`rounded-2xl p-5 border flex items-center gap-4 transition-all hover:shadow-md ${
            followupsAtrasados.length > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}>
            {followupsAtrasados.length > 0 ? (
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
            )}
            <div>
              <p className={`font-semibold text-base ${followupsAtrasados.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {followupsAtrasados.length > 0
                  ? `${followupsAtrasados.length} follow-up${followupsAtrasados.length > 1 ? 's' : ''} vencido${followupsAtrasados.length > 1 ? 's' : ''} hoje`
                  : 'Nenhum follow-up vencido hoje'}
              </p>
              <p className={`text-sm mt-0.5 ${followupsAtrasados.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {followupsAtrasados.length > 0 ? 'Clique para ver a lista' : 'Tudo em dia!'}
              </p>
            </div>
          </div>
        </Link>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leads Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads por Status</h3>
            <div className="space-y-3">
              {Object.entries(getLeadsByStatus()).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {STATUS_LABELS[status] || status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prospects Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prospects por Status</h3>
            <div className="space-y-3">
              {Object.entries(getProspectsByStatus()).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {STATUS_LABELS[status] || status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deals Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Oportunidades por Status</h3>
            <div className="space-y-3">
              {Object.entries(getDealsByStatus()).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {STATUS_LABELS[status] || status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}