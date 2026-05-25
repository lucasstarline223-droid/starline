import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building2, Phone, Mail } from 'lucide-react';
import FornecedorModal from '@/components/comercial/FornecedorModal';

export default function Fornecedores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState(null);

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list()
  });

  const filteredFornecedores = fornecedores.filter(fornecedor => 
    fornecedor.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.cnpj?.includes(searchTerm)
  );

  const getCategoriaColor = (categoria) => {
    const colors = {
      'Telefonia': 'bg-blue-100 text-blue-700',
      'Internet': 'bg-green-100 text-green-700',
      'Hardware': 'bg-purple-100 text-purple-700',
      'Software': 'bg-indigo-100 text-indigo-700',
      'Infraestrutura': 'bg-orange-100 text-orange-700',
      'Outros': 'bg-gray-100 text-gray-700'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fornecedores</h1>
            <p className="text-gray-600 mt-1">{filteredFornecedores.length} fornecedores cadastrados</p>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedFornecedor(null);
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CNPJ..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFornecedores.map((fornecedor) => (
                  <tr
                    key={fornecedor.id}
                    onClick={() => {
                      setSelectedFornecedor(fornecedor);
                      setShowModal(true);
                    }}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{fornecedor.nome}</p>
                          {fornecedor.razao_social && (
                            <p className="text-sm text-gray-500">{fornecedor.razao_social}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fornecedor.cnpj || '-'}</td>
                    <td className="px-6 py-4">
                      {fornecedor.categoria ? (
                        <Badge className={`${getCategoriaColor(fornecedor.categoria)} border`}>
                          {fornecedor.categoria}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {fornecedor.telefone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{fornecedor.telefone}</span>
                          </div>
                        )}
                        {fornecedor.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-xs">{fornecedor.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={fornecedor.status === 'Ativo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                        {fornecedor.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredFornecedores.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum fornecedor encontrado</p>
            </div>
          )}
        </div>
      </div>

      <FornecedorModal
        fornecedor={selectedFornecedor}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedFornecedor(null);
        }}
      />
    </div>
  );
}