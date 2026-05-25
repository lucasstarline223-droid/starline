import React, { useState } from 'react';
import { X, Package, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TECNICOS = [
  { nome: 'Iohann Palm', email: '__iohann__' },
  { nome: 'Lucas Wiebusch', email: '__lucas__' },
  { nome: 'Junior Vargas', email: '__junior__' }
];

export default function AlocarEquipamentoModal({ chamado, onClose, onAlocar, isAdmin = false }) {
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState(
    chamado.responsavel_id || ''
  );
  const [hardwareSelecionado, setHardwareSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  const tecnicoEmail = tecnicoSelecionado;

  const { data: estoquesTecnico = [] } = useQuery({
    queryKey: ['estoque-tecnico', tecnicoEmail],
    queryFn: () => base44.entities.EstoqueTecnico.filter({ tecnico_email: tecnicoEmail }),
    enabled: !!tecnicoEmail
  });

  const itemSelecionado = estoquesTecnico.find(e => e.hardware_id === hardwareSelecionado);
  const maxQtd = itemSelecionado?.quantidade || 0;
  const tecnico = TECNICOS.find(t => t.email === tecnicoSelecionado);

  const handleAlocar = async () => {
    if (!hardwareSelecionado || quantidade < 1 || quantidade > maxQtd || !tecnico) return;
    setLoading(true);
    await onAlocar({
      hardware_id: hardwareSelecionado,
      hardware_nome: itemSelecionado.hardware_nome,
      hardware_fabricante: itemSelecionado.hardware_fabricante,
      hardware_url_foto: itemSelecionado.hardware_url_foto,
      tecnico_nome: tecnico.nome,
      tecnico_email: tecnico.email,
      quantidade: Number(quantidade),
      observacoes
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-900">Alocar Equipamento ao Cliente</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Chamado info */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <p className="font-semibold text-blue-800">{chamado.nome_conta}</p>
            <p className="text-blue-600 text-xs mt-0.5">Visita Presencial · {chamado.responsavel_nome || 'Sem responsável'}</p>
          </div>

          {/* Técnico (apenas admin pode mudar) */}
          {isAdmin ? (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Técnico</label>
              <div className="space-y-2">
                {TECNICOS.map(t => (
                  <button
                    key={t.email}
                    onClick={() => { setTecnicoSelecionado(t.email); setHardwareSelecionado(''); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      tecnicoSelecionado === t.email
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {t.nome[0]}
                    </div>
                    {t.nome}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {tecnico?.nome?.[0] || '?'}
              </div>
              <span>Técnico: <strong>{tecnico?.nome}</strong></span>
            </div>
          )}

          {/* Equipamentos disponíveis */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Equipamento do técnico
            </label>
            {estoquesTecnico.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg">
                {tecnicoSelecionado ? 'Nenhum equipamento disponível com este técnico' : 'Selecione um técnico'}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {estoquesTecnico.filter(e => e.quantidade > 0).map(item => (
                  <button
                    key={item.hardware_id}
                    onClick={() => { setHardwareSelecionado(item.hardware_id); setQuantidade(1); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-all ${
                      hardwareSelecionado === item.hardware_id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {item.hardware_url_foto ? (
                      <img src={item.hardware_url_foto} alt="" className="w-10 h-10 object-contain rounded bg-white border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">📦</div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{item.hardware_nome}</p>
                      <p className="text-xs text-gray-500">{item.hardware_fabricante} · {item.quantidade} disponíveis</p>
                    </div>
                    {hardwareSelecionado === item.hardware_id && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantidade */}
          {hardwareSelecionado && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Quantidade</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantidade(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50">−</button>
                <input
                  type="number"
                  min="1"
                  max={maxQtd}
                  value={quantidade}
                  onChange={e => setQuantidade(Math.min(maxQtd, Math.max(1, Number(e.target.value))))}
                  className="w-20 text-center border border-gray-200 rounded-lg px-2 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <button onClick={() => setQuantidade(q => Math.min(maxQtd, q + 1))} className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50">+</button>
                <span className="text-xs text-gray-400">de {maxQtd} disponíveis</span>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Observações (opcional)</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Ex: Substituição do ramal 201..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={handleAlocar}
            disabled={loading || !hardwareSelecionado || quantidade < 1 || quantidade > maxQtd}
            className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 rounded-lg flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            {loading ? 'Alocando...' : 'Alocar Equipamento'}
          </button>
        </div>
      </div>
    </div>
  );
}