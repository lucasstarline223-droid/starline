import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PricingModal from '@/components/comercial/PricingModal';

export default function GerenciarPrecosDID() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);

  const { data: pricingRules = [], isLoading } = useQuery({
    queryKey: ['pricingRules'],
    queryFn: () => base44.entities.NumeroDIDPricing.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NumeroDIDPricing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
    }
  });

  const handleEdit = (pricing) => {
    setSelectedPricing(pricing);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Deseja realmente excluir esta regra de preço?')) {
      deleteMutation.mutate(id);
    }
  };

  const getTipoClienteColor = (tipo) => {
    const colors = {
      'Pessoa Jurídica': 'bg-blue-100 text-blue-700',
      'Pessoa Física': 'bg-purple-100 text-purple-700',
      'Ambos': 'bg-green-100 text-green-700'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
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
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Preços DID/DDR</h1>
            <p className="text-gray-600 mt-1">Configure os preços recorrentes mensais por fornecedor e tipo</p>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedPricing(null);
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Regra de Preço
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Mensal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observações</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pricingRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {rule.tipo_numero}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{rule.fornecedor_numero}</td>
                    <td className="px-6 py-4">
                      <Badge className={`${getTipoClienteColor(rule.tipo_cliente)} border`}>
                        {rule.tipo_cliente === 'Pessoa Jurídica' ? 'PJ' : rule.tipo_cliente === 'Pessoa Física' ? 'PF' : 'PJ/PF'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">
                          R$ {rule.preco_mensal.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {rule.observacoes || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                          className="hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id)}
                          className="hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pricingRules.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma regra de preço cadastrada</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Nova Regra de Preço" para começar</p>
            </div>
          )}
        </div>
      </div>

      <PricingModal
        pricing={selectedPricing}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPricing(null);
        }}
      />
    </div>
  );
}