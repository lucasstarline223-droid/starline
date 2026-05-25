import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KanbanBoard from '../components/comercial/KanbanBoard';
import HandoffCard from '../components/comercial/HandoffCard';
import HandoffModal from '../components/comercial/HandoffModal';

export default function Handoff() {
  const [viewMode, setViewMode] = useState('kanban');
  const [selectedHandoff, setSelectedHandoff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: handoffs = [], isLoading } = useQuery({
    queryKey: ['handoffs'],
    queryFn: () => base44.entities.HandoffSDD.list()
  });

  const columns = [
    { label: 'Coleta de Dados', value: 'coleta_dados' },
    { label: 'Pronto p/ Assinatura', value: 'pronto_assinatura' },
    { label: 'Aguard. Assinatura', value: 'aguardando_assinatura' },
    { label: 'Ordem de Ativação', value: 'order_to_activation' },
    { label: 'Concluído', value: 'concluido' }
  ];

  const handleItemClick = (handoff) => {
    setSelectedHandoff(handoff);
    setIsModalOpen(true);
  };

  const handleNewHandoff = () => {
    setSelectedHandoff(null);
    setIsModalOpen(true);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Handoff SDD</h1>
            <p className="text-gray-600 mt-1">Coleta de dados para ativação</p>
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
              onClick={handleNewHandoff}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Handoff
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            columns={columns}
            items={handoffs}
            onItemClick={handleItemClick}
            renderCard={(handoff) => <HandoffCard handoff={handoff} />}
            statusField="etapa_atual"
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Razão Social
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CNPJ/CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {handoffs.map((handoff) => (
                  <tr
                    key={handoff.id}
                    onClick={() => handleItemClick(handoff)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{handoff.razao_social}</div>
                      {handoff.nome_fantasia && (
                        <div className="text-xs text-gray-500">{handoff.nome_fantasia}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{handoff.cnpj_cpf}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{handoff.categoria}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{handoff.responsavel_coleta}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs font-medium">
                        {handoff.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <HandoffModal
          handoff={selectedHandoff}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedHandoff(null);
          }}
        />
      )}
    </div>
  );
}