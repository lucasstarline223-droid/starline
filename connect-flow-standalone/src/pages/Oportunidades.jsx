import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, LayoutGrid, List, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KanbanBoard from '../components/comercial/KanbanBoard';
import DealCard from '../components/comercial/DealCard';
import DealModal from '../components/comercial/DealModal';

export default function Oportunidades() {
  const [viewMode, setViewMode] = useState('kanban');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list()
  });

  const columns = [
    { label: 'Qualificação AE', value: 'qualificacao_ae' },
    { label: 'Apresentação', value: 'apresentacao' },
    { label: 'Proposta Enviada', value: 'proposta_enviada' },
    { label: 'Em Negociação', value: 'em_negociacao' },
    { label: 'Fechado Ganho', value: 'fechado_ganho' },
    { label: 'Fechado Perdido', value: 'fechado_perdido' }
  ];

  const handleItemClick = (deal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const handleNewDeal = () => {
    setSelectedDeal(null);
    setIsModalOpen(true);
  };

  const getTotalMRR = () => {
    return deals
      .filter(d => d.status === 'fechado_ganho')
      .reduce((sum, d) => sum + (d.valor_mrr || 0), 0);
  };

  const getTotalPipeline = () => {
    return deals
      .filter(d => !['fechado_ganho', 'fechado_perdido'].includes(d.status))
      .reduce((sum, d) => sum + (d.valor_mrr || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Oportunidades</h1>
            <p className="text-gray-600 mt-1">{deals.length} oportunidades no pipeline</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={handleNewDeal}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Oportunidade
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-green-700 font-medium">MRR Fechado</p>
              <p className="text-lg font-bold text-green-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getTotalMRR())}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Pipeline Total</p>
              <p className="text-lg font-bold text-blue-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getTotalPipeline())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            columns={columns}
            items={deals}
            onItemClick={handleItemClick}
            renderCard={(deal) => <DealCard deal={deal} />}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    MRR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fechamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    AE
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => handleItemClick(deal)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{deal.nome_empresa}</div>
                      <div className="text-xs text-gray-500">{deal.segmento}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{deal.tipo_oportunidade}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.valor_mrr || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {deal.data_fechamento_prevista}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                        {deal.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{deal.account_executive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <DealModal
          deal={selectedDeal}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDeal(null);
          }}
        />
      )}
    </div>
  );
}