import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Box, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProdutoServicoModal from '@/components/produto/ProdutoServicoModal';

export default function ProdutosSKUs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos-skus'],
    queryFn: () => base44.entities.ProdutoServico.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProdutoServico.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-skus'] });
    }
  });

  const filteredProdutos = produtos.filter(p => {
    const matchesSearch = p.item_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = categoriaFilter === 'todos' || p.categoria === categoriaFilter;
    return matchesSearch && matchesCategoria;
  });

  const handleEdit = (produto) => {
    setSelectedItem(produto);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
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

  const getTipoColor = (tipo) => {
    const colors = {
      'Unidade (Atom)': 'bg-orange-100 text-orange-700',
      'Pacote (Bundle)': 'bg-blue-100 text-blue-700',
      'Grupo (Package)': 'bg-purple-100 text-purple-700'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
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
            <Box className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos & SKUs</h1>
        </div>
        <p className="text-gray-600">Catálogo completo de produtos, pacotes e SKUs</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Categorias</SelectItem>
            <SelectItem value="Telefonia">Telefonia</SelectItem>
            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
            <SelectItem value="Internet">Internet</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleAdd}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo SKU
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total SKUs</div>
          <div className="text-2xl font-bold text-gray-900">{produtos.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Disponíveis</div>
          <div className="text-2xl font-bold text-green-600">
            {produtos.filter(p => p.disponivel_a_venda === 'Sim').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Telefonia</div>
          <div className="text-2xl font-bold text-blue-600">
            {produtos.filter(p => p.categoria === 'Telefonia').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">WhatsApp</div>
          <div className="text-2xl font-bold text-green-600">
            {produtos.filter(p => p.categoria === 'WhatsApp').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo Fixo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProdutos.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : (
              filteredProdutos.map((produto) => (
                <tr key={produto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {produto.item_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {produto.nome_item}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge className={getCategoriaColor(produto.categoria)}>
                      {produto.categoria}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge className={getTipoColor(produto.tipo)}>
                      {produto.tipo?.split(' ')[0]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {produto.unidade}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    R$ {produto.preco_mensal_tabela_r?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    R$ {produto.custo_fixo_mensal_r?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge className={produto.disponivel_a_venda === 'Sim' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {produto.disponivel_a_venda}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
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
                          if (confirm('Tem certeza que deseja excluir este SKU?')) {
                            deleteMutation.mutate(produto.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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