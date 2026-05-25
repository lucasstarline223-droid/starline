import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, Search, Plus, ArrowRight, Pencil, Trash2, Save } from 'lucide-react';
import NovoItemModal from './NovoItemModal';
import TransferirTecnicoModal from './TransferirTecnicoModal';
import HardwareDetailModal from './HardwareDetailModal';

const getStatus = (item) => {
  const qtd = item.quantidade_estoque || 0;
  const min = item.estoque_minimo ?? 2;
  if (qtd === 0) return { label: 'Esgotado', color: 'bg-red-100 text-red-700 border border-red-200' };
  if (qtd <= min) return { label: 'Baixo', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' };
  return { label: 'Disponível', color: 'bg-green-100 text-green-700 border border-green-200' };
};

export default function EstoqueGeralTab({ itens, isLoading }) {
  const [busca, setBusca] = useState('');
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [transferirItem, setTransferirItem] = useState(null);
  const [editandoQtd, setEditandoQtd] = useState({});
  const [detalheItem, setDetalheItem] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hardware.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hardware'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Hardware.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hardware'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Hardware.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hardware'] })
  });

  const itensFiltrados = itens.filter(i =>
    i.nome_produto?.toLowerCase().includes(busca.toLowerCase()) ||
    i.fabricante?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalModelos = itens.length;
  const totalUnidades = itens.reduce((s, i) => s + (i.quantidade_estoque || 0), 0);
  const estoqueBaixo = itens.filter(i => {
    const qtd = i.quantidade_estoque || 0;
    const min = i.estoque_minimo ?? 2;
    return qtd > 0 && qtd <= min;
  }).length;
  const esgotados = itens.filter(i => (i.quantidade_estoque || 0) === 0).length;

  const handleSalvarQtd = (item) => {
    const novaQtd = editandoQtd[item.id];
    if (novaQtd === undefined) return;
    updateMutation.mutate({ id: item.id, data: { ...item, quantidade_estoque: Number(novaQtd) } });
    setEditandoQtd(prev => { const n = { ...prev }; delete n[item.id]; return n; });
  };

  const handleTransferir = async (hardware, tecnico, quantidade) => {
    // Subtrai do estoque central
    await base44.entities.Hardware.update(hardware.id, {
      ...hardware,
      quantidade_estoque: (hardware.quantidade_estoque || 0) - quantidade
    });

    // Verifica se já existe registro para esse técnico + hardware
    const existentes = await base44.entities.EstoqueTecnico.filter({
      tecnico_email: tecnico.email,
      hardware_id: hardware.id
    });

    if (existentes.length > 0) {
      await base44.entities.EstoqueTecnico.update(existentes[0].id, {
        ...existentes[0],
        quantidade: (existentes[0].quantidade || 0) + quantidade
      });
    } else {
      await base44.entities.EstoqueTecnico.create({
        tecnico_nome: tecnico.nome,
        tecnico_email: tecnico.email,
        hardware_id: hardware.id,
        hardware_nome: hardware.nome_produto,
        hardware_fabricante: hardware.fabricante,
        hardware_url_foto: hardware.url_foto || '',
        quantidade
      });
    }

    queryClient.invalidateQueries({ queryKey: ['hardware'] });
    queryClient.invalidateQueries({ queryKey: ['estoque-tecnico'] });
    setTransferirItem(null);
  };

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Modelos', value: totalModelos, color: 'text-blue-600' },
          { label: 'Total Unid.', value: totalUnidades, color: 'text-green-600' },
          { label: 'Estoque Baixo', value: estoqueBaixo, color: 'text-yellow-600' },
          { label: 'Esgotados', value: esgotados, color: 'text-red-600' }
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de busca + botão novo */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Pesquisar modelo ou fabricante..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowNovoModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Novo Item
        </button>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Carregando estoque...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_180px_180px_140px_auto] gap-0 text-xs font-bold text-gray-400 uppercase tracking-widest px-6 py-3 border-b bg-gray-50">
            <span>Foto</span>
            <span>Modelo</span>
            <span>Fabricante</span>
            <span className="text-center">Quantidade</span>
            <span className="text-center">Status</span>
            <span className="text-center">Ações</span>
          </div>

          {itensFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhum item encontrado</div>
          ) : (
            itensFiltrados.map((item) => {
              const status = getStatus(item);
              const qtdEditando = editandoQtd[item.id] !== undefined ? editandoQtd[item.id] : item.quantidade_estoque || 0;

              return (
                <div key={item.id} className="grid grid-cols-[80px_1fr_180px_180px_140px_auto] gap-0 items-center px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  {/* Foto */}
                  <div className="flex items-center">
                    <button onClick={() => setDetalheItem(item)} title="Ver detalhes" className="focus:outline-none group">
                      {item.url_foto ? (
                        <img src={item.url_foto} alt={item.nome_produto} className="w-14 h-14 object-contain rounded-xl bg-gray-50 border border-gray-200 p-1 group-hover:ring-2 group-hover:ring-blue-400 transition-all cursor-pointer" />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-2xl border border-gray-200 group-hover:ring-2 group-hover:ring-blue-400 transition-all cursor-pointer">📦</div>
                      )}
                    </button>
                  </div>

                  {/* Modelo + categoria */}
                  <div className="pl-2">
                    <p className="font-bold text-gray-900 text-base leading-tight">{item.nome_produto}</p>
                    {item.categoria_produto && (
                      <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{item.categoria_produto}</span>
                    )}
                  </div>

                  {/* Fabricante */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                      {item.fabricante?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.fabricante}</span>
                  </div>

                  {/* Quantidade inline edit */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditandoQtd(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] ?? item.quantidade_estoque ?? 0) - 1) }))}
                      className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                    >−</button>
                    <input
                      type="number"
                      min="0"
                      value={qtdEditando}
                      onChange={e => setEditandoQtd(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      className="w-14 text-center border border-gray-200 rounded px-1 py-1 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <button
                      onClick={() => setEditandoQtd(prev => ({ ...prev, [item.id]: (prev[item.id] ?? item.quantidade_estoque ?? 0) + 1 }))}
                      className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                    >+</button>
                  </div>

                  {/* Status */}
                  <div className="flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-center gap-1">
                    {editandoQtd[item.id] !== undefined && (
                      <button
                        onClick={() => handleSalvarQtd(item)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                      >
                        <Save className="w-3 h-3" />
                        Salvar
                      </button>
                    )}
                    <button
                      onClick={() => setTransferirItem(item)}
                      title="Transferir para técnico"
                      className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Excluir "${item.nome_produto}"?`)) deleteMutation.mutate(item.id); }}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showNovoModal && (
        <NovoItemModal
          onClose={() => setShowNovoModal(false)}
          onSave={async (data) => {
            await createMutation.mutateAsync(data);
            setShowNovoModal(false);
          }}
        />
      )}

      {transferirItem && (
        <TransferirTecnicoModal
          hardware={transferirItem}
          onClose={() => setTransferirItem(null)}
          onTransferir={handleTransferir}
        />
      )}

      {detalheItem && (
        <HardwareDetailModal
          item={detalheItem}
          onClose={() => setDetalheItem(null)}
        />
      )}
    </div>
  );
}