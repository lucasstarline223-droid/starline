import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShoppingCart, Package, ExternalLink, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_CONFIG = {
  'Pendente':     { label: 'Pendente',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  'Em Andamento': { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: ShoppingCart },
  'A Caminho':    { label: 'A Caminho',    color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck },
  'Recebido':     { label: 'Recebido',     color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  'Cancelada':    { label: 'Cancelada',    color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

export default function RequisicaoCompraTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const { data: requisicoes = [], isLoading } = useQuery({
    queryKey: ['requisicoes_compra'],
    queryFn: () => base44.entities.RequisicaoCompraHardware.list('-created_date', 500)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RequisicaoCompraHardware.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisicoes_compra'] });
      setEditingId(null);
    }
  });

  const handleEdit = (req) => {
    setEditingId(req.id);
    setEditData({
      status_compra: req.status_compra || 'Pendente',
      link_rastreamento: req.link_rastreamento || '',
      fornecedor_compra: req.fornecedor_compra || '',
      data_pedido: req.data_pedido || '',
      data_previsao_entrega: req.data_previsao_entrega || '',
      observacoes: req.observacoes || '',
    });
  };

  const handleSave = (id) => {
    updateMutation.mutate({ id, data: editData });
  };

  const handleReceberConfirmar = async (req) => {
    if (!confirm(`Confirmar recebimento de ${req.quantidade_a_comprar}x ${req.hardware_nome}?`)) return;
    // Atualiza estoque do hardware
    const hardware = await base44.entities.Hardware.get(req.hardware_id);
    if (hardware) {
      await base44.entities.Hardware.update(req.hardware_id, {
        quantidade_estoque: (hardware.quantidade_estoque || 0) + req.quantidade_a_comprar
      });
    }
    updateMutation.mutate({ id: req.id, data: { status_compra: 'Recebido', data_recebimento: new Date().toISOString().split('T')[0] } });
    queryClient.invalidateQueries({ queryKey: ['hardware'] });
  };

  const pendentes = requisicoes.filter(r => r.status_compra !== 'Recebido' && r.status_compra !== 'Cancelada');
  const concluidas = requisicoes.filter(r => r.status_compra === 'Recebido' || r.status_compra === 'Cancelada');

  if (isLoading) return <div className="text-center py-10 text-gray-400">Carregando...</div>;

  const renderCard = (req) => {
    const statusCfg = STATUS_CONFIG[req.status_compra] || STATUS_CONFIG['Pendente'];
    const StatusIcon = statusCfg.icon;
    const isEditing = editingId === req.id;

    return (
      <div key={req.id} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        {/* Header do card */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{req.hardware_nome}</p>
              <p className="text-sm text-gray-500">{req.hardware_fabricante}</p>
            </div>
          </div>
          <Badge className={`${statusCfg.color} border flex items-center gap-1.5 text-xs font-semibold`}>
            <StatusIcon className="w-3 h-3" />
            {statusCfg.label}
          </Badge>
        </div>

        {/* Info do cliente */}
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Cliente</p>
          <p className="font-semibold text-gray-800">{req.cliente_nome}</p>
        </div>

        {/* Resumo de quantidade */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 rounded-xl py-2">
            <p className="text-xs text-blue-500 font-medium">Necessário</p>
            <p className="text-xl font-bold text-blue-700">{req.quantidade_necessaria}</p>
          </div>
          <div className="bg-green-50 rounded-xl py-2">
            <p className="text-xs text-green-500 font-medium">Em Estoque</p>
            <p className="text-xl font-bold text-green-700">{req.quantidade_em_estoque}</p>
          </div>
          <div className="bg-red-50 rounded-xl py-2">
            <p className="text-xs text-red-500 font-medium">A Comprar</p>
            <p className="text-xl font-bold text-red-700">{req.quantidade_a_comprar}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center italic">
          Cliente precisa de <strong>{req.quantidade_necessaria}x {req.hardware_nome}</strong>.
          Estoque disponível: <strong>{req.quantidade_em_estoque}</strong>.
          Faltam comprar: <strong>{req.quantidade_a_comprar}</strong>.
        </p>

        {/* Campos editáveis */}
        {isEditing ? (
          <div className="space-y-3 border-t border-gray-100 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Status da Compra</p>
                <Select value={editData.status_compra} onValueChange={v => setEditData(p => ({ ...p, status_compra: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Fornecedor</p>
                <Input value={editData.fornecedor_compra} onChange={e => setEditData(p => ({ ...p, fornecedor_compra: e.target.value }))} className="h-8 text-sm" placeholder="Nome do fornecedor" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Data do Pedido</p>
                <Input type="date" value={editData.data_pedido} onChange={e => setEditData(p => ({ ...p, data_pedido: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Previsão de Entrega</p>
                <Input type="date" value={editData.data_previsao_entrega} onChange={e => setEditData(p => ({ ...p, data_previsao_entrega: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-500 mb-1">Link de Rastreamento</p>
                <Input value={editData.link_rastreamento} onChange={e => setEditData(p => ({ ...p, link_rastreamento: e.target.value }))} className="h-8 text-sm" placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-500 mb-1">Observações</p>
                <Input value={editData.observacoes} onChange={e => setEditData(p => ({ ...p, observacoes: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
              <Button size="sm" onClick={() => handleSave(req.id)} disabled={updateMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">Salvar</Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {req.link_rastreamento && (
              <a href={req.link_rastreamento} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                <ExternalLink className="w-3.5 h-3.5" />
                Ver rastreamento
              </a>
            )}
            {req.data_previsao_entrega && (
              <p className="text-xs text-gray-500">Previsão de entrega: <strong>{new Date(req.data_previsao_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></p>
            )}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(req)} className="text-xs flex-1">Editar</Button>
              {req.status_compra !== 'Recebido' && req.status_compra !== 'Cancelada' && (
                <Button size="sm" onClick={() => handleReceberConfirmar(req)} className="bg-green-600 text-white hover:bg-green-700 text-xs flex-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Marcar Recebido
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{requisicoes.filter(r => r.status_compra === 'Pendente').length}</p>
          <p className="text-xs text-yellow-600 font-medium mt-1">Pendentes</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{requisicoes.filter(r => r.status_compra === 'A Caminho').length}</p>
          <p className="text-xs text-purple-600 font-medium mt-1">A Caminho</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{requisicoes.filter(r => r.status_compra === 'Recebido').length}</p>
          <p className="text-xs text-green-600 font-medium mt-1">Recebidos</p>
        </div>
      </div>

      {/* Em aberto */}
      {pendentes.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Em Aberto ({pendentes.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendentes.map(renderCard)}
          </div>
        </div>
      )}

      {/* Concluídas */}
      {concluidas.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-400 mb-3 text-sm uppercase tracking-wide">Concluídas / Canceladas ({concluidas.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {concluidas.map(renderCard)}
          </div>
        </div>
      )}

      {requisicoes.length === 0 && (
        <div className="text-center py-16">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma requisição de compra</p>
          <p className="text-gray-400 text-sm mt-1">As requisições aparecem automaticamente quando o estoque é insuficiente.</p>
        </div>
      )}
    </div>
  );
}