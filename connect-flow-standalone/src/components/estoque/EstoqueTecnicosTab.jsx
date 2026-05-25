import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, ChevronDown, Package, Trash2, Plus, ArrowLeft } from 'lucide-react';

const TECNICOS = [
  { nome: 'Iohann Palm', email: '__iohann__', cor: 'bg-blue-500' },
  { nome: 'Lucas Wiebusch', email: '__lucas__', cor: 'bg-purple-500' },
  { nome: 'Junior Vargas', email: '__junior__', cor: 'bg-green-500' }
];

export default function EstoqueTecnicosTab({ isAdmin }) {
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState(TECNICOS[0].email);
  const queryClient = useQueryClient();

  const tecnico = TECNICOS.find(t => t.email === tecnicoSelecionado);

  const { data: estoques = [], isLoading } = useQuery({
    queryKey: ['estoque-tecnico', tecnicoSelecionado],
    queryFn: () => base44.entities.EstoqueTecnico.filter({ tecnico_email: tecnicoSelecionado })
  });

  const { data: hardwareDisponivel = [] } = useQuery({
    queryKey: ['hardware'],
    queryFn: () => base44.entities.Hardware.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EstoqueTecnico.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estoque-tecnico'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EstoqueTecnico.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque-tecnico'] });
      queryClient.invalidateQueries({ queryKey: ['hardware'] });
    }
  });

  // Devolver item ao estoque central
  const handleDevolverAoEstoque = async (item, quantidade) => {
    if (quantidade < 1 || quantidade > item.quantidade) return;
    // Subtrai do técnico
    const novaQtdTecnico = item.quantidade - quantidade;
    if (novaQtdTecnico <= 0) {
      await base44.entities.EstoqueTecnico.delete(item.id);
    } else {
      await base44.entities.EstoqueTecnico.update(item.id, { ...item, quantidade: novaQtdTecnico });
    }
    // Adiciona ao estoque central
    const hw = hardwareDisponivel.find(h => h.id === item.hardware_id);
    if (hw) {
      await base44.entities.Hardware.update(hw.id, {
        ...hw,
        quantidade_estoque: (hw.quantidade_estoque || 0) + quantidade
      });
    }
    queryClient.invalidateQueries({ queryKey: ['estoque-tecnico'] });
    queryClient.invalidateQueries({ queryKey: ['hardware'] });
  };

  const totalItens = estoques.reduce((s, e) => s + (e.quantidade || 0), 0);

  return (
    <div>
      {/* Seletor de técnico */}
      <div className="flex flex-wrap gap-3 mb-6">
        {TECNICOS.map(t => (
          <button
            key={t.email}
            onClick={() => setTecnicoSelecionado(t.email)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
              tecnicoSelecionado === t.email
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-9 h-9 rounded-full ${t.cor} flex items-center justify-center text-white font-bold`}>
              {t.nome[0]}
            </div>
            <div className="text-left">
              <p className={`font-bold text-sm ${tecnicoSelecionado === t.email ? 'text-blue-700' : 'text-gray-800'}`}>
                {t.nome}
              </p>
              <p className="text-xs text-gray-400">Técnico</p>
            </div>
          </button>
        ))}
      </div>

      {/* Cabeçalho do técnico selecionado */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">Estoque de {tecnico?.nome}</h3>
          <p className="text-sm text-gray-500">{estoques.length} modelo(s) · {totalItens} unidade(s) total</p>
        </div>
      </div>

      {/* Lista de itens */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : estoques.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-medium">Nenhum item no estoque deste técnico</p>
          <p className="text-xs mt-1">Transfira itens do estoque central para este técnico</p>
        </div>
      ) : (
        <div className="space-y-3">
          {estoques.map(item => (
            <EstoqueTecnicoCard
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              onDevolver={handleDevolverAoEstoque}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EstoqueTecnicoCard({ item, isAdmin, onDevolver }) {
  const [qtdDevolver, setQtdDevolver] = useState(1);
  const [showDevolver, setShowDevolver] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        {item.hardware_url_foto ? (
          <img src={item.hardware_url_foto} alt={item.hardware_nome} className="w-14 h-14 object-contain rounded-lg bg-gray-50 border border-gray-100" />
        ) : (
          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">📦</div>
        )}
        <div className="flex-1">
          <p className="font-bold text-gray-900">{item.hardware_nome}</p>
          <p className="text-sm text-gray-500">{item.hardware_fabricante}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {item.quantidade} unidade(s)
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDevolver(!showDevolver)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Devolver
            </button>
          </div>
        )}
      </div>

      {isAdmin && showDevolver && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
          <p className="text-xs text-gray-500 flex-shrink-0">Devolver ao estoque central:</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setQtdDevolver(q => Math.max(1, q - 1))} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-50">−</button>
            <input
              type="number"
              min="1"
              max={item.quantidade}
              value={qtdDevolver}
              onChange={e => setQtdDevolver(Math.min(item.quantidade, Math.max(1, Number(e.target.value))))}
              className="w-14 text-center border border-gray-200 rounded px-1 py-1 text-sm font-bold focus:outline-none"
            />
            <button onClick={() => setQtdDevolver(q => Math.min(item.quantidade, q + 1))} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-50">+</button>
          </div>
          <button
            onClick={() => { onDevolver(item, qtdDevolver); setShowDevolver(false); }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
          >
            Confirmar
          </button>
          <button onClick={() => setShowDevolver(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
        </div>
      )}
    </div>
  );
}