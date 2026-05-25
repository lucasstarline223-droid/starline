import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Package, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProdutoServicoModal from '@/components/produto/ProdutoServicoModal';
import { toast } from 'sonner';

export default function PlanosServicos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.ProdutoServico.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProdutoServico.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
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
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Upload file first
      const uploadResult = { file_url: URL.createObjectURL(file) };
      
      // Call import function
      const result = await base44.functions.invoke('importarProdutosCsv', {
        file_url: uploadResult.file_url
      });

      if (result.data.success) {
        toast.success(result.data.message);
        queryClient.invalidateQueries({ queryKey: ['produtos'] });
      } else {
        toast.error(result.data.error || 'Erro ao importar produtos');
      }
    } catch (error) {
      toast.error('Erro ao importar CSV: ' + error.message);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
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
            <Package className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Planos & Serviços</h1>
        </div>
        <p className="text-gray-600">Gerencie os planos, serviços e produtos disponíveis</p>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por ID ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <label htmlFor="csv-upload">
            <Button
              type="button"
              variant="outline"
              disabled={isImporting}
              onClick={() => document.getElementById('csv-upload').click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importando...' : 'Importar CSV'}
            </Button>
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleImportCsv}
            className="hidden"
          />
          
          <Button
            onClick={handleAdd}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Serviço
          </Button>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Mensal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponível</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProdutos.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  Nenhum produto/serviço encontrado
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
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {produto.tipo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    R$ {produto.preco_mensal_tabela_r?.toFixed(2) || '0.00'}
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
                          if (confirm('Tem certeza que deseja excluir este item?')) {
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