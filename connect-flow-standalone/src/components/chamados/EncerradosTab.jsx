import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, ClipboardList, Package, User, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import HistoricoModal from './HistoricoModal';

const STATUS_COLORS = {
  'Resolvido': 'bg-green-100 text-green-700',
  'Fechado': 'bg-gray-100 text-gray-700'
};

const PRIORIDADE_COLORS = {
  Baixa: 'bg-gray-100 text-gray-600',
  Média: 'bg-yellow-100 text-yellow-700',
  Alta: 'bg-orange-100 text-orange-700',
  Urgente: 'bg-red-100 text-red-700'
};

export default function EncerradosTab() {
  const [busca, setBusca] = useState('');
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [filtroComEquip, setFiltroComEquip] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setIsAdmin(u?.role === 'admin')).catch(() => {});
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Chamado.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chamados'] })
  });

  const { data: chamados = [], isLoading } = useQuery({
    queryKey: ['chamados'],
    queryFn: () => base44.entities.Chamado.list('-updated_date')
  });

  const { data: equipamentosAlocados = [] } = useQuery({
    queryKey: ['equipamentos-alocados'],
    queryFn: () => base44.entities.EquipamentoAlocado.list()
  });

  // Mapa: chamado_id -> lista de equipamentos
  const equipPorChamado = equipamentosAlocados.reduce((acc, eq) => {
    if (!acc[eq.chamado_id]) acc[eq.chamado_id] = [];
    acc[eq.chamado_id].push(eq);
    return acc;
  }, {});

  const encerrados = chamados.filter(c => ['Resolvido', 'Fechado'].includes(c.status));

  // Lista de técnicos únicos
  const tecnicos = [...new Set(encerrados.map(c => c.responsavel_nome).filter(Boolean))].sort();

  const filtrados = encerrados.filter(c => {
    const termo = busca.toLowerCase().trim();
    const numeroOS = c.id.slice(-8).toUpperCase();
    const textoOk = !termo || (
      c.nome_conta?.toLowerCase().includes(termo) ||
      c.nome_solicitante?.toLowerCase().includes(termo) ||
      c.number_problem?.toLowerCase().includes(termo) ||
      c.contato_resposta?.toLowerCase().includes(termo) ||
      c.responsavel_nome?.toLowerCase().includes(termo) ||
      numeroOS.includes(termo.toUpperCase())
    );
    const tecnicoOk = !filtroTecnico || c.responsavel_nome === filtroTecnico;
    const equipOk = !filtroComEquip || (equipPorChamado[c.id]?.length > 0);
    return textoOk && tecnicoOk && equipOk;
  });

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, solicitante, telefone ou número da OS..."
            className="pl-10"
          />
        </div>

        {/* Filtro por técnico */}
        <div className="relative">
          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={filtroTecnico}
            onChange={(e) => setFiltroTecnico(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none"
          >
            <option value="">Todos os técnicos</option>
            {tecnicos.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Filtro com equipamentos */}
        <button
          onClick={() => setFiltroComEquip(!filtroComEquip)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
            filtroComEquip
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Com equipamentos
        </button>

        <span className="text-sm text-gray-500 ml-auto">{filtrados.length} chamado(s) encerrado(s)</span>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
          {busca || filtroTecnico || filtroComEquip ? 'Nenhum chamado encontrado para este filtro.' : 'Nenhum chamado encerrado.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtrados.map((chamado) => {
            const equips = equipPorChamado[chamado.id] || [];
            const temEquip = equips.length > 0;
            return (
              <div key={chamado.id} className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-2 hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{chamado.nome_conta}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                    {temEquip && (
                      <div title={`${equips.length} equipamento(s) alocado(s)`} className="flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded text-xs font-semibold">
                        <Package className="w-3 h-3" />
                        {equips.length}
                      </div>
                    )}
                    {isAdmin && (
                      <button
                        title="Excluir chamado"
                        onClick={() => { if (confirm('Excluir este chamado encerrado?')) deleteMutation.mutate(chamado.id); }}
                        className="p-1 text-red-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PRIORIDADE_COLORS[chamado.prioridade]}`}>
                      {chamado.prioridade}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[chamado.status]}`}>
                      {chamado.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                    {chamado.nome_solicitante && <p>👤 {chamado.nome_solicitante}</p>}
                    {chamado.number_problem && <p>📞 {chamado.number_problem}</p>}
                    {chamado.responsavel_nome && (
                      <p className="flex items-center gap-1">
                        <User className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-700 font-medium">{chamado.responsavel_nome}</span>
                      </p>
                    )}
                    {chamado.updated_date && (
                      <p className="text-gray-400">
                        {format(new Date(chamado.updated_date), "dd/MM", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setChamadoSelecionado(chamado)}
                  className="w-full px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded transition-colors"
                >
                  <ClipboardList className="w-3 h-3 inline mr-1" />
                  Histórico
                </button>
              </div>
            );
          })}
        </div>
      )}

      {chamadoSelecionado && (
        <HistoricoModal
          chamado={chamadoSelecionado}
          onClose={() => setChamadoSelecionado(null)}
        />
      )}
    </div>
  );
}