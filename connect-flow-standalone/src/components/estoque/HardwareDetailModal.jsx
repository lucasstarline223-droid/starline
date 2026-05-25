import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Package, Camera, Link as LinkIcon, Upload, History, User, ArrowRight, Check } from 'lucide-react';

export default function HardwareDetailModal({ item, onClose }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(item.url_foto || '');
  const [urlInput, setUrlInput] = useState(item.url_foto || '');
  const [uploading, setUploading] = useState(false);

  const { data: alocacoes = [] } = useQuery({
    queryKey: ['equipamentos-alocados', item.id],
    queryFn: () => base44.entities.EquipamentoAlocado.filter({ hardware_id: item.id }),
  });

  const { data: estoquesTecnicos = [] } = useQuery({
    queryKey: ['estoque-tecnico-item', item.id],
    queryFn: () => base44.entities.EstoqueTecnico.filter({ hardware_id: item.id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Hardware.update(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware'] });
    }
  });

  const handleSavePhotoUrl = async () => {
    await updateMutation.mutateAsync({ ...item, url_foto: urlInput });
    setPhotoUrl(urlInput);
    setEditingPhoto(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const file_url = URL.createObjectURL(file);
    await updateMutation.mutateAsync({ ...item, url_foto: file_url });
    setPhotoUrl(file_url);
    setUrlInput(file_url);
    setUploading(false);
    setEditingPhoto(false);
  };

  const movimentacoes = [
    ...estoquesTecnicos.map(et => ({
      tipo: 'transferencia',
      descricao: `Transferido para ${et.tecnico_nome}`,
      quantidade: et.quantidade,
      data: et.created_date,
      icone: <ArrowRight className="w-4 h-4 text-orange-500" />,
    })),
    ...alocacoes.map(al => ({
      tipo: 'alocacao',
      descricao: `Alocado ao cliente ${al.client_nome}`,
      quantidade: al.quantidade,
      data: al.data_alocacao || al.created_date,
      tecnico: al.tecnico_nome,
      chamado: al.chamado_descricao,
      icone: <User className="w-4 h-4 text-blue-500" />,
    })),
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

  const fotoAtual = photoUrl || item.url_foto;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            {item.nome_produto}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Foto + info principal */}
          <div className="flex gap-5 items-start">
            {/* Foto clicável/editável */}
            <div className="relative flex-shrink-0">
              {fotoAtual ? (
                <img
                  src={fotoAtual}
                  alt={item.nome_produto}
                  className="w-32 h-32 object-contain rounded-xl border border-gray-200 bg-gray-50 p-2"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center text-4xl border border-gray-200">
                  📦
                </div>
              )}
              <button
                onClick={() => setEditingPhoto(!editingPhoto)}
                className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors"
                title="Editar foto"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Detalhes */}
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Fabricante</p>
                <p className="text-sm font-medium text-gray-800">{item.fabricante || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Categoria</p>
                <p className="text-sm font-medium text-gray-800">{item.categoria_produto || '—'}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Estoque Central</p>
                  <p className="text-2xl font-extrabold text-blue-600">{item.quantidade_estoque || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Mínimo</p>
                  <p className="text-2xl font-extrabold text-gray-500">{item.estoque_minimo ?? 2}</p>
                </div>
                {item.valor_venda && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Valor Venda</p>
                    <p className="text-sm font-bold text-green-600">R$ {item.valor_venda.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editar foto */}
          {editingPhoto && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Camera className="w-4 h-4" /> Editar Foto
              </p>
              {/* URL da internet */}
              <div className="flex gap-2 items-center">
                <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="Cole a URL da imagem..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  onClick={handleSavePhotoUrl}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar
                </button>
              </div>
              {/* Upload do computador */}
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-50"
                >
                  {uploading ? 'Enviando...' : 'Ou fazer upload do computador'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>
          )}

          {/* Distribuição por técnicos */}
          {estoquesTecnicos.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" /> Com Técnicos
              </p>
              <div className="space-y-2">
                {estoquesTecnicos.map(et => (
                  <div key={et.id} className="flex items-center justify-between bg-orange-50 rounded-lg px-4 py-2 border border-orange-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-200 flex items-center justify-center text-xs font-bold text-orange-700">
                        {et.tecnico_nome?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{et.tecnico_nome}</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600">{et.quantidade} unid.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de movimentação */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" /> Histórico de Movimentação
            </p>
            {movimentacoes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">Nenhuma movimentação registrada.</p>
            ) : (
              <div className="space-y-2">
                {movimentacoes.map((mov, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                    <div className="mt-0.5">{mov.icone}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{mov.descricao}</p>
                      {mov.tecnico && (
                        <p className="text-xs text-gray-500">Técnico: {mov.tecnico}</p>
                      )}
                      {mov.chamado && (
                        <p className="text-xs text-gray-400 truncate">Chamado: {mov.chamado}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-gray-600">{mov.quantidade} unid.</span>
                      <p className="text-xs text-gray-400">
                        {mov.data ? new Date(mov.data).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}