import React from 'react';
import { Building2, DollarSign, Calendar, User, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function DealCard({ deal }) {
  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTipoColor = (tipo) => {
    const colors = {
      'Nova venda': 'bg-green-50 text-green-700',
      'Upsell': 'bg-blue-50 text-blue-700',
      'Cross-sell': 'bg-purple-50 text-purple-700',
      'Renovação': 'bg-orange-50 text-orange-700'
    };
    return colors[tipo] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all hover:border-gray-300">
      {/* Header */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 truncate mb-1">
          {deal.nome_empresa || 'Sem nome'}
        </h4>
        {deal.tipo_oportunidade && (
          <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${getTipoColor(deal.tipo_oportunidade)}`}>
            {deal.tipo_oportunidade}
          </span>
        )}
      </div>

      {/* Values */}
      <div className="space-y-2 mb-3">
        {deal.valor_mrr && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span>MRR</span>
            </div>
            <span className="font-semibold text-green-600">
              {formatCurrency(deal.valor_mrr)}
            </span>
          </div>
        )}
        
        {deal.cobranca_unica > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-3.5 h-3.5 text-blue-500" />
              <span>Setup</span>
            </div>
            <span className="font-semibold text-blue-600">
              {formatCurrency(deal.cobranca_unica)}
            </span>
          </div>
        )}
      </div>

      {/* Dates */}
      {deal.data_fechamento_prevista && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Calendar className="w-3.5 h-3.5 text-orange-500" />
          <span>Fechamento: {format(new Date(deal.data_fechamento_prevista), 'dd/MM/yyyy')}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {deal.account_executive && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{deal.account_executive}</span>
          </div>
        )}
        
        {deal.segmento && (
          <div className="px-2 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs">
            {deal.segmento}
          </div>
        )}
      </div>
    </div>
  );
}