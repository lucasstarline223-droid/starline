import React, { useState } from 'react';
import { X, ArrowRight, User } from 'lucide-react';

const TECNICOS = [
  { nome: 'Iohann Palm', email: '__iohann__' },
  { nome: 'Lucas Wiebusch', email: '__lucas__' },
  { nome: 'Junior Vargas', email: '__junior__' }
];

export default function TransferirTecnicoModal({ hardware, onClose, onTransferir }) {
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);

  const tecnico = TECNICOS.find(t => t.email === tecnicoSelecionado);
  const maxQtd = hardware.quantidade_estoque || 0;

  const handleTransferir = async () => {
    if (!tecnicoSelecionado || quantidade < 1 || quantidade > maxQtd) return;
    setLoading(true);
    await onTransferir(hardware, tecnico, Number(quantidade));
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-gray-900">Transferir para Técnico</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Info do item */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            {hardware.url_foto ? (
              <img src={hardware.url_foto} alt={hardware.nome_produto} className="w-12 h-12 object-contain rounded bg-white border border-gray-200" />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xl">📦</div>
            )}
            <div>
              <p className="font-bold text-gray-900 text-sm">{hardware.nome_produto}</p>
              <p className="text-xs text-gray-500">{hardware.fabricante}</p>
              <p className="text-xs text-gray-400">Disponível: <strong className="text-gray-700">{maxQtd} un.</strong></p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Técnico</label>
            <div className="space-y-2">
              {TECNICOS.map(t => (
                <button
                  key={t.email}
                  onClick={() => setTecnicoSelecionado(t.email)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    tecnicoSelecionado === t.email
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {t.nome[0]}
                  </div>
                  {t.nome}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Quantidade</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={maxQtd}
                value={quantidade}
                onChange={e => setQuantidade(Math.min(maxQtd, Math.max(1, Number(e.target.value))))}
                className="w-20 text-center border border-gray-200 rounded-lg px-2 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={() => setQuantidade(q => Math.min(maxQtd, q + 1))}
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
              <span className="text-xs text-gray-400">de {maxQtd} disponíveis</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={handleTransferir}
            disabled={loading || !tecnicoSelecionado || quantidade < 1 || quantidade > maxQtd}
            className="px-4 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-lg flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            {loading ? 'Transferindo...' : 'Transferir'}
          </button>
        </div>
      </div>
    </div>
  );
}