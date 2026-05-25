import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import PortabilidadeModal from '@/components/comercial/PortabilidadeModal';
import { format } from 'date-fns';

export default function Portabilidade() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortabilidade, setSelectedPortabilidade] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('todos');

  const { data: portabilidades = [], isLoading } = useQuery({
    queryKey: ['portabilidades'],
    queryFn: () => base44.entities.Portabilidade.list('-created_date')
  });

  const createNumeroMutation = useMutation({
    mutationFn: async (portabilidade) => {
      return await base44.entities.NumeroDID.create({
        numero: portabilidade.numero_solicitado,
        tipo: portabilidade.tipo_numero_port,
        cliente: portabilidade.cliente_nome,
        status: 'Ativo',
        fornecedor: portabilidade.operadora_destino,
        operadora: portabilidade.operadora_destino,
        observacoes: `Portado de ${portabilidade.operadora_origem} - Chamado: ${portabilidade.id_chamado || 'N/A'}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['numeros']);
    }
  });

  const handleConcluirPortabilidade = async (portabilidade) => {
    if (confirm('Deseja criar o número DID para esta portabilidade concluída?')) {
      try {
        await createNumeroMutation.mutateAsync(portabilidade);
        alert('Número DID criado com sucesso!');
      } catch (error) {
        alert('Erro ao criar número: ' + error.message);
      }
    }
  };

  const filteredPortabilidades = portabilidades.filter(port => {
    const matchesSearch = 
      port.numero_solicitado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      port.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      port.id_chamado?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || port.status_portability === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Solicitado': { color: 'bg-blue-100 text-blue-700', icon: Clock },
      'Em Andamento': { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
      'Recusado': { color: 'bg-red-100 text-red-700', icon: XCircle },
      'Concluído': { color: 'bg-green-100 text-green-700', icon: CheckCircle2 }
    };
    
    const config = statusConfig[status] || statusConfig['Solicitado'];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
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
            <h1 className="text-3xl font-bold text-gray-900">Portabilidades</h1>
            <p className="text-gray-600 mt-1">{filteredPortabilidades.length} solicitações</p>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedPortabilidade(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Portabilidade
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número, cliente, chamado..."
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'todos' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('todos')}
              size="sm"
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'Solicitado' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('Solicitado')}
              size="sm"
            >
              Solicitado
            </Button>
            <Button
              variant={statusFilter === 'Em Andamento' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('Em Andamento')}
              size="sm"
            >
              Em Andamento
            </Button>
            <Button
              variant={statusFilter === 'Concluído' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('Concluído')}
              size="sm"
            >
              Concluído
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origem → Destino</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Janela</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SLA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chamado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPortabilidades.map((port) => (
                  <tr
                    key={port.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedPortabilidade(port);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{port.numero_solicitado}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{port.cliente_nome || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{port.tipo_numero_port}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {port.operadora_origem} → {port.operadora_destino || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(port.status_portability)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {port.janela_inicio && port.janela_fim ? (
                        <div>
                          <p>{format(new Date(port.janela_inicio), 'dd/MM/yyyy')}</p>
                          <p className="text-xs text-gray-400">até {format(new Date(port.janela_fim), 'dd/MM/yyyy')}</p>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {port.prazo_sla_portabilidade ? format(new Date(port.prazo_sla_portabilidade), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{port.id_chamado || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {port.fatura_operadora && (
                          <a
                            href={port.fatura_operadora}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Ver Fatura"
                          >
                            <FileText className="w-4 h-4 text-gray-600" />
                          </a>
                        )}
                        {port.termo_portabilidade && (
                          <a
                            href={port.termo_portabilidade}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Ver Termo"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                          </a>
                        )}
                        {port.status_portability === 'Concluído' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConcluirPortabilidade(port);
                            }}
                            disabled={createNumeroMutation.isPending}
                          >
                            Criar DID
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPortabilidades.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma portabilidade encontrada</p>
          </div>
        )}
      </div>

      <PortabilidadeModal
        portabilidade={selectedPortabilidade}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPortabilidade(null);
        }}
      />
    </div>
  );
}