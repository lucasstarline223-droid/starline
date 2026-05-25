import React, { useState } from 'react';
import { Plus, Check, Trash2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export default function SdrChecklist({ user }) {
  const queryClient = useQueryClient();
  const [novoItem, setNovoItem] = useState('');
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['sdrChecklist', user?.email],
    queryFn: () => base44.entities.SdrChecklistItem.filter({ sdr_email: user?.email }),
    enabled: !!user?.email
  });

  // Itens ativos: criados hoje ou não concluídos de dias anteriores (excluindo aprovados para exclusão)
  const itemsAtivos = items.filter(i => !i.aprovado_exclusao);

  const criarItem = useMutation({
    mutationFn: async (titulo) => {
      const item = await base44.entities.SdrChecklistItem.create({
        titulo,
        concluido: false,
        sdr_email: user.email,
        sdr_nome: user.full_name,
        data_criacao: hoje
      });

      // Notificar admin
      await base44.functions.invoke('notificarAdminChecklist', {
        tipo: 'novo_item',
        item_titulo: titulo,
        sdr_nome: user.full_name
      });

      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sdrChecklist']);
      setNovoItem('');
    }
  });

  const toggleItem = useMutation({
    mutationFn: ({ id, concluido }) => base44.entities.SdrChecklistItem.update(id, {
      concluido: !concluido,
      data_conclusao: !concluido ? hoje : null
    }),
    onSuccess: () => queryClient.invalidateQueries(['sdrChecklist'])
  });

  const solicitarExclusao = useMutation({
    mutationFn: async (item) => {
      await base44.entities.SdrChecklistItem.update(item.id, { solicitar_exclusao: true });
      await base44.functions.invoke('notificarAdminChecklist', {
        tipo: 'solicitar_exclusao',
        item_titulo: item.titulo,
        sdr_nome: user.full_name
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['sdrChecklist'])
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && novoItem.trim()) {
      criarItem.mutate(novoItem.trim());
    }
  };

  const itensHoje = itemsAtivos.filter(i => i.data_criacao === hoje);
  const itensAnteriores = itemsAtivos.filter(i => i.data_criacao !== hoje && !i.concluido);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Checklist do Dia</h2>
        <p className="text-xs text-gray-500 mt-0.5">Seus compromissos e tarefas pessoais</p>
      </div>

      {/* Input novo item */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-2">
          <Input
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Adicionar item ao checklist..."
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={() => novoItem.trim() && criarItem.mutate(novoItem.trim())}
            disabled={!novoItem.trim() || criarItem.isPending}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-1 max-h-80 overflow-y-auto">
        {isLoading && <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>}

        {/* Itens de dias anteriores não concluídos */}
        {itensAnteriores.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-orange-600 mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pendentes de dias anteriores
            </p>
            {itensAnteriores.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                onToggle={() => toggleItem.mutate({ id: item.id, concluido: item.concluido })}
                onSolicitarExclusao={() => solicitarExclusao.mutate(item)}
                isPending={solicitarExclusao.isPending}
              />
            ))}
          </div>
        )}

        {/* Itens de hoje */}
        {itensHoje.length > 0 && (
          <div>
            {itensAnteriores.length > 0 && (
              <p className="text-xs font-medium text-gray-500 mb-2">Hoje</p>
            )}
            {itensHoje.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                onToggle={() => toggleItem.mutate({ id: item.id, concluido: item.concluido })}
                onSolicitarExclusao={() => solicitarExclusao.mutate(item)}
                isPending={solicitarExclusao.isPending}
              />
            ))}
          </div>
        )}

        {!isLoading && itemsAtivos.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            Nenhum item no checklist.<br />
            <span className="text-xs">Adicione tarefas para o seu dia!</span>
          </p>
        )}
      </div>
    </div>
  );
}

function ChecklistItem({ item, onToggle, onSolicitarExclusao, isPending }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group ${item.solicitar_exclusao ? 'opacity-60' : ''}`}>
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
          item.concluido
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {item.concluido && <Check className="w-3 h-3 text-white" />}
      </button>

      <span className={`text-sm flex-1 min-w-0 truncate ${item.concluido ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {item.titulo}
      </span>

      {item.solicitar_exclusao ? (
        <span className="text-xs text-orange-500 flex items-center gap-1 flex-shrink-0">
          <AlertCircle className="w-3 h-3" /> Aguardando
        </span>
      ) : (
        <button
          onClick={onSolicitarExclusao}
          disabled={isPending}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity flex-shrink-0"
          title="Solicitar exclusão"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      )}
    </div>
  );
}