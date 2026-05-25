import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowRight } from 'lucide-react';
import ChamadoCard from './ChamadoCard';

export default function WarRoomTab({ viewMode = 'compact' }) {
  const queryClient = useQueryClient();

  const { data: chamados = [], isLoading } = useQuery({
    queryKey: ['chamados'],
    queryFn: () => base44.entities.Chamado.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Chamado.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chamados'] })
  });

  // Chamados no War Room = tipo_suporte "War Room", não encerrados
  const chamadosWarRoom = chamados.filter(c =>
    c.tipo_suporte === 'War Room' && !['Resolvido', 'Fechado'].includes(c.status)
  );

  const encaminharParaN1 = (chamado) => {
    const historico = chamado.historico_acoes || [];
    const entrada = {
      nivel: 'N1 - Suporte',
      acao: 'Chamado encaminhado do War Room para N1 - Suporte (após resolução da massiva)',
      responsavel: chamado.responsavel_nome || '',
      data: new Date().toISOString()
    };
    updateMutation.mutate({
      id: chamado.id,
      data: { ...chamado, tipo_suporte: 'N1 - Suporte', historico_acoes: [...historico, entrada] }
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">War Room - Gestão de Massivas</h2>
        <p className="text-sm text-gray-500">{chamadosWarRoom.length} chamado(s) em War Room</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Carregando chamados...</div>
      ) : chamadosWarRoom.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
          <p className="font-medium">Nenhum chamado em War Room</p>
          <p className="text-xs mt-1">Novos chamados de massivas aparecerão aqui para coordenação</p>
        </div>
      ) : (
        <div className={viewMode === 'expanded' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3'}>
          {chamadosWarRoom.map((chamado) => (
            <div key={chamado.id} className="flex flex-col">
              <ChamadoCard chamado={chamado} viewMode={viewMode} />
              {/* Barra de encaminhamento */}
              <div className="px-3 py-2 bg-red-50 border border-t-0 border-red-200 rounded-b-lg flex flex-col gap-2">
                <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  Resolvido?
                </span>
                <button
                  onClick={() => encaminharParaN1(chamado)}
                  disabled={updateMutation.isPending}
                  className="w-full px-2 py-1 rounded text-xs font-semibold border border-blue-300 text-blue-700 bg-white hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  Para N1
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}