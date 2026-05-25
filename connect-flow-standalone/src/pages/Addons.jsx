import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Puzzle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProdutoServicoModal from '@/components/produto/ProdutoServicoModal';

export default function Addons() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos-addons'],
    queryFn: async () => {
      const all = await base44.entities.ProdutoServico.list();
      return all.filter(p => p.tipo === 'Unidade (Atom)');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProdutoServico.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-addons'] });
    }
  });

  const filteredProdutos = produtos.filter(p => 
    p.item_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (produto) => {
    setSelectedItem(produto);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedItem({ tipo: 'Unidade (Atom)' });
    setShowModal(true);
  };

  const getCategoriaColor = (categoria) => {
    const colors = {
      'Telefonia': 'bg-blue-100 text-blue-700',
      'WhatsApp': 'bg-green-100 text-green-700',
      'Internet': 'bg-purple-100 text-purple-700'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Puzzle className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Addons</h1>
        </div>
        <p className="text-gray-600">Gerencie addons e complementos unitários</p>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar addons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleAdd}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Addon
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProdutos.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum addon encontrado
          </div>
        ) : (
          filteredProdutos.map((produto) => (
            <div key={produto.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{produto.nome_item || produto.item_id}</h3>
                  <p className="text-xs text-gray-500 mb-1">{produto.item_id}</p>
                  <Badge className={getCategoriaColor(produto.categoria)}>
                    {produto.categoria}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(produto)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este addon?')) {
                        deleteMutation.mutate(produto.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Unidade:</span>
                  <span className="font-medium">{produto.unidade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preço Mensal:</span>
                  <span className="font-semibold text-green-600">
                    R$ {produto.preco_mensal_tabela_r?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Disponível:</span>
                  <Badge className={produto.disponivel_a_venda === 'Sim' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {produto.disponivel_a_venda}
                  </Badge>
                </div>
              </div>

              {produto.observacoes && (
                <p className="mt-3 text-xs text-gray-500 line-clamp-2">
                  {produto.observacoes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ProdutoServicoModal
          item={selectedItem}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}