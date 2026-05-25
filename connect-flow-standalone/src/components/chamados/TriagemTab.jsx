import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, ArrowRight, Link2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChamadoCard from './ChamadoCard';
import NovoChamadoModal from './NovoChamadoModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TriagemTab({ viewMode = 'compact' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/novo-chamado`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const queryClient = useQueryClient();

  const { data: chamados = [], isLoading } = useQuery({
    queryKey: ['chamados'],
    queryFn: () => base44.entities.Chamado.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Chamado.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chamados'] })
  });

  // Chamados na triagem = tipo_suporte "Triagem" ou sem tipo_suporte definido, não encerrados
  const chamadosTriagem = chamados.filter(c =>
    (c.tipo_suporte === 'Triagem' || !c.tipo_suporte) && !['Resolvido', 'Fechado'].includes(c.status)
  );

  const encaminharParaNivel = (chamado, nivel, canal = 'pabx') => {
    const historico = chamado.historico_acoes || [];
    const destino = canal === 'wati' ? 'Suporte API/WhatsApp' : 'Suporte PABX/Voz';
    const entrada = {
      nivel: nivel,
      acao: `Chamado encaminhado da Triagem para ${destino}`,
      responsavel: chamado.responsavel_nome || '',
      data: new Date().toISOString()
    };
    updateMutation.mutate({
      id: chamado.id,
      data: { ...chamado, tipo_suporte: nivel, canal_suporte: canal, historico_acoes: [...historico, entrada] }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Triagem</h2>
          <p className="text-sm text-gray-500">{chamadosTriagem.length} chamado(s) aguardando triagem</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="rounded-xl flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
            {copied ? 'Link copiado!' : 'Link p/ Cliente'}
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Chamado
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Carregando chamados...</div>
      ) : chamadosTriagem.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
          <p className="font-medium">Nenhum chamado aguardando triagem</p>
          <p className="text-xs mt-1">Novos chamados aparecerão aqui para serem roteados</p>
        </div>
      ) : (
        <div className={viewMode === 'expanded' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3'}>
          {chamadosTriagem.map((chamado) => (
            <div key={chamado.id} className="flex flex-col">
              <ChamadoCard chamado={chamado} viewMode={viewMode} />
              {/* Barra de encaminhamento */}
              <div className="px-3 py-2 bg-amber-50 border border-t-0 border-amber-200 rounded-b-lg flex flex-col gap-2">
                <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  Encaminhar:
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => encaminharParaNivel(chamado, 'N1 - Suporte')}
                    disabled={updateMutation.isPending}
                    className="flex-1 px-2 py-1 rounded text-xs font-semibold border border-blue-300 text-blue-700 bg-white hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    PABX
                  </button>
                  <button
                    onClick={() => encaminharParaNivel(chamado, 'N1 - WhatsApp', 'wati')}
                    disabled={updateMutation.isPending}
                    className="flex-1 px-2 py-1 rounded text-xs font-semibold border border-green-300 text-green-700 bg-white hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NovoChamadoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}