import React, { useState } from 'react';
import { X, Plus, Package } from 'lucide-react';

const CATEGORIAS = ['Telefone IP', 'ATA', 'ONU', 'Gateway', 'Roteador', 'Switch', 'Acessório'];

export default function NovoItemModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    nome_produto: '',
    fabricante: '',
    categoria_produto: '',
    quantidade_estoque: 0,
    estoque_minimo: 2,
    url_foto: '',
    valor_venda: '',
    descricao: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nome_produto.trim() || !form.fabricante.trim()) return;
    setSaving(true);
    await onSave({
      ...form,
      quantidade_estoque: Number(form.quantidade_estoque) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 2,
      valor_venda: form.valor_venda ? Number(form.valor_venda) : undefined
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900">Novo Item de Estoque</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Modelo *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Ex: GXP2135"
              value={form.nome_produto}
              onChange={e => setForm({ ...form, nome_produto: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fabricante *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Ex: Grandstream"
              value={form.fabricante}
              onChange={e => setForm({ ...form, fabricante: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Quantidade</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.quantidade_estoque}
                onChange={e => setForm({ ...form, quantidade_estoque: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estoque Mínimo</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.estoque_minimo}
                onChange={e => setForm({ ...form, estoque_minimo: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categoria</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              value={form.categoria_produto}
              onChange={e => setForm({ ...form, categoria_produto: e.target.value })}
            >
              <option value="">Selecionar...</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">URL da Foto (opcional)</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="https://exemplo.com/foto.jpg"
              value={form.url_foto}
              onChange={e => setForm({ ...form, url_foto: e.target.value })}
            />
            {form.url_foto && (
              <div className="mt-2 flex justify-center">
                <img
                  src={form.url_foto}
                  alt="preview"
                  className="w-20 h-20 object-contain border border-gray-200 rounded-lg bg-gray-50"
                  onError={e => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Valor de Venda (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="0,00"
              value={form.valor_venda}
              onChange={e => setForm({ ...form, valor_venda: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.nome_produto.trim() || !form.fabricante.trim()}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}