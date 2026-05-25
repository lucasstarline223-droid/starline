import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, FileText, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Contratos() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ['contratos'],
    queryFn: () => base44.entities.Contrato.list()
  });

  const filteredContratos = contratos.filter(contrato => 
    contrato.numero_contrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      'Ativo': 'bg-green-100 text-green-700 border-green-200',
      'Vencido': 'bg-red-100 text-red-700 border-red-200',
      'Cancelado': 'bg-gray-100 text-gray-700 border-gray-200',
      'Aguardando Assinatura': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTotalMRR = () => {
    return contratos
      .filter(c => c.status === 'Ativo')
      .reduce((sum, c) => sum + (c.valor_mensal || 0), 0);
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
            <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
            <p className="text-gray-600 mt-1">{filteredContratos.length} contratos cadastrados</p>
          </div>
          
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Contrato
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-green-700 font-medium">MRR Total</p>
              <p className="text-lg font-bold text-green-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getTotalMRR())}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Contratos Ativos</p>
              <p className="text-lg font-bold text-blue-900">
                {contratos.filter(c => c.status === 'Ativo').length}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número ou cliente..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Valor Mensal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Início
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Término
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContratos.map((contrato) => (
                <tr
                  key={contrato.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-gray-900">{contrato.numero_contrato}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{contrato.cliente}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor_mensal || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {contrato.data_inicio ? format(new Date(contrato.data_inicio), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {contrato.data_fim ? format(new Date(contrato.data_fim), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusColor(contrato.status)} border`}>
                      {contrato.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContratos.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum contrato encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}