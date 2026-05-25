import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function DunningCobrancas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: cobrancas = [], isLoading } = useQuery({
    queryKey: ['cobrancas'],
    queryFn: () => base44.entities.Cobranca.list()
  });

  const filteredCobrancas = cobrancas.filter(cobranca => {
    const matchSearch = cobranca.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       cobranca.numero_fatura?.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || cobranca.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Pago': 'bg-green-100 text-green-700 border-green-200',
      'Pendente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Atrasado': 'bg-red-100 text-red-700 border-red-200',
      'Cancelado': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTotalAtrasado = () => {
    return cobrancas
      .filter(c => c.status === 'Atrasado')
      .reduce((sum, c) => sum + (c.valor || 0), 0);
  };

  const getTotalPendente = () => {
    return cobrancas
      .filter(c => c.status === 'Pendente')
      .reduce((sum, c) => sum + (c.valor || 0), 0);
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
            <h1 className="text-3xl font-bold text-gray-900">Dunning & Cobranças</h1>
            <p className="text-gray-600 mt-1">{filteredCobrancas.length} cobranças no sistema</p>
          </div>
          
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Cobrança
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-red-700 font-medium">Valor Atrasado</p>
              <p className="text-lg font-bold text-red-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getTotalAtrasado())}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-yellow-700 font-medium">Pendente</p>
              <p className="text-lg font-bold text-yellow-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getTotalPendente())}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-orange-700 font-medium">Cobranças em Atraso</p>
              <p className="text-lg font-bold text-orange-900">
                {cobrancas.filter(c => c.status === 'Atrasado').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou fatura..."
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fatura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Atraso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tentativas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCobrancas.map((cobranca) => (
                <tr
                  key={cobranca.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{cobranca.cliente}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{cobranca.numero_fatura}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobranca.valor || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {cobranca.data_vencimento ? format(new Date(cobranca.data_vencimento), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {cobranca.dias_atraso > 0 && (
                      <span className="text-sm font-medium text-red-600">
                        {cobranca.dias_atraso} dias
                      </span>
                    )}
                    {cobranca.dias_atraso === 0 && (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {cobranca.tentativas_cobranca || 0}x
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusColor(cobranca.status)} border`}>
                      {cobranca.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCobrancas.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma cobrança encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}