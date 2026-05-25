import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Phone, Building2, DollarSign, Edit, Trash2, ChevronLeft, ChevronRight, Upload, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NumeroDIDModal from '@/components/comercial/NumeroDIDModal';
import PricingModal from '@/components/comercial/PricingModal';
import ImportarNumerosDIDModal from '@/components/comercial/ImportarNumerosDIDModal';

const PAGE_SIZE = 50;

const TIPO_COLORS = {
  'DID': 'bg-blue-100 text-blue-700',
  'DDR': 'bg-purple-100 text-purple-700',
  '0800': 'bg-green-100 text-green-700',
  'Móvel': 'bg-orange-100 text-orange-700',
};

const STATUS_COLORS = {
  'Ativo': 'bg-green-100 text-green-700',
  'Inativo': 'bg-gray-100 text-gray-700',
  'Portabilidade': 'bg-yellow-100 text-yellow-700',
  'Aguardando Ativação': 'bg-blue-100 text-blue-700',
  'Cancelado': 'bg-red-100 text-red-700',
  'Vago': 'bg-orange-100 text-orange-700',
  'Em Portabilidade': 'bg-purple-100 text-purple-700',
};

const TIPO_CLIENTE_COLORS = {
  'Pessoa Jurídica': 'bg-blue-100 text-blue-700',
  'Pessoa Física': 'bg-purple-100 text-purple-700',
  'Ambos': 'bg-green-100 text-green-700',
};

const STATUS_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'Ativo', label: 'Ativo' },
  { key: 'Vago', label: 'Vago' },
  { key: 'Cancelado', label: 'Cancelado' },
];

const OPERADORA_OPTIONS = ['Ligue Ai', 'Depositar', 'Starline', 'Meu SYS'];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function NumerosDID() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('numeros');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeStatusTab, setActiveStatusTab] = useState('todos');
  const [showNumeroModal, setShowNumeroModal] = useState(false);
  const [selectedNumero, setSelectedNumero] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [undoToast, setUndoToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(null); // null, 'asc', 'desc'
  const undoRef = useRef(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterTipo, filterStatus, activeStatusTab]);

  const { data: numeros = [], isLoading: isLoadingNumeros } = useQuery({
    queryKey: ['numeros'],
    queryFn: () => base44.entities.NumeroDID.list('-created_date', 2000),
    staleTime: 60_000,
  });

  const { data: pricingRules = [], isLoading: isLoadingPricing } = useQuery({
    queryKey: ['pricingRules'],
    queryFn: () => base44.entities.NumeroDIDPricing.list(),
    staleTime: 60_000,
    enabled: activeTab === 'precos',
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
    staleTime: 300_000,
  });

  const fornecedorMap = useMemo(() => {
    const map = {};
    fornecedores.forEach(f => { map[f.id] = f.nome; });
    return map;
  }, [fornecedores]);

  const getFornecedorNome = useCallback((id) => fornecedorMap[id] || 'N/A', [fornecedorMap]);

  // Status tab counts (computed from full list)
  const statusCounts = useMemo(() => {
    const counts = { todos: numeros.length };
    STATUS_TABS.slice(1).forEach(t => {
      counts[t.key] = numeros.filter(n => n.status === t.key).length;
    });
    return counts;
  }, [numeros]);

  // Client-side filtering + pagination
  const filteredNumeros = useMemo(() => {
    return numeros.filter((n) => {
      if (debouncedSearch && !n.numero?.includes(debouncedSearch) && !n.cliente?.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (filterTipo !== 'all' && n.tipo !== filterTipo) return false;
      if (filterStatus !== 'all' && n.status !== filterStatus) return false;
      if (activeStatusTab !== 'todos' && n.status !== activeStatusTab) return false;
      return true;
    });
  }, [numeros, debouncedSearch, filterTipo, filterStatus, activeStatusTab]);

  const sortedNumeros = useMemo(() => {
    if (!sortBy) return filteredNumeros;
    return [...filteredNumeros].sort((a, b) => {
      const aNum = (a.numero || '').toLowerCase();
      const bNum = (b.numero || '').toLowerCase();
      return sortBy === 'asc' ? aNum.localeCompare(bNum) : bNum.localeCompare(aNum);
    });
  }, [filteredNumeros, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedNumeros.length / PAGE_SIZE));
  const pagedNumeros = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedNumeros.slice(start, start + PAGE_SIZE);
  }, [sortedNumeros, currentPage]);

  const toggleSort = () => {
    setSortBy(sortBy === null ? 'asc' : sortBy === 'asc' ? 'desc' : null);
    setCurrentPage(1);
  };

  const deleteNumeroMutation = useMutation({
    mutationFn: (id) => base44.entities.NumeroDID.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['numeros'] }),
  });

  const deletePricingMutation = useMutation({
    mutationFn: (id) => base44.entities.NumeroDIDPricing.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricingRules'] }),
  });

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pagedNumeros.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pagedNumeros.map(n => n.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Excluir ${selectedIds.length} número(s) selecionado(s)?`)) {
      selectedIds.forEach(id => deleteNumeroMutation.mutate(id));
      setSelectedIds([]);
    }
  };

  const handleDeleteNumero = (e, numero) => {
    e.stopPropagation();
    if (!confirm(`Excluir o número "${numero.numero}"?`)) return;
    if (undoRef.current) {
      clearTimeout(undoRef.current.timeoutId);
      deleteNumeroMutation.mutate(undoRef.current.numero.id);
    }
    queryClient.setQueryData(['numeros'], (old = []) => old.filter(n => n.id !== numero.id));
    const timeoutId = setTimeout(() => {
      deleteNumeroMutation.mutate(numero.id);
      setUndoToast(null);
      undoRef.current = null;
    }, 4000);
    undoRef.current = { numero, timeoutId };
    setUndoToast({ numero });
  };

  const handleUndo = () => {
    if (!undoRef.current) return;
    clearTimeout(undoRef.current.timeoutId);
    queryClient.setQueryData(['numeros'], (old = []) => [undoRef.current.numero, ...old]);
    undoRef.current = null;
    setUndoToast(null);
  };

  const handleLinkClients = async () => {
    setIsLinking(true);
    try {
      const res = await base44.functions.invoke('linkDidToClient', {});
      const { updates } = res.data;
      queryClient.invalidateQueries({ queryKey: ['numeros'] });
      alert(`Vinculação concluída! ${updates} número(s) atualizado(s).`);
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeletePricing = (id) => {
    if (confirm('Deseja realmente excluir esta regra de preço?')) {
      deletePricingMutation.mutate(id);
    }
  };

  const updateNumeroMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NumeroDID.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['numeros'] }),
  });

  const handleInlineUpdate = (id, field, value) => {
    updateNumeroMutation.mutate({ id, data: { [field]: value } });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Números</h1>
            <p className="text-gray-600 mt-1">
              {activeTab === 'numeros'
                ? `${filteredNumeros.length} número(s) encontrado(s)`
                : `${pricingRules.length} regras de preço`}
            </p>
          </div>

          {activeTab === 'numeros' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleLinkClients}
                disabled={isLinking}
                className="rounded-xl px-4 py-2 flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
              >
                <Link2 className="w-4 h-4" />
                {isLinking ? 'Vinculando...' : 'Vincular Clientes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImportModal(true)}
                className="rounded-xl px-4 py-2 flex items-center gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <Upload className="w-4 h-4" /> Importar CSV
              </Button>
              <Button
                onClick={() => { setSelectedNumero(null); setShowNumeroModal(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Novo Número
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => { setSelectedPricing(null); setShowPricingModal(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nova Regra de Preço
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="numeros">Números</TabsTrigger>
            <TabsTrigger value="precos">Preços</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-8">
        <Tabs value={activeTab} className="w-full">
          {/* Tab: Números */}
          <TabsContent value="numeros">
            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-700">{selectedIds.length} selecionado(s)</span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir selecionados
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 text-gray-500 text-xs font-semibold hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Status Tabs */}
            <div className="flex items-center gap-1 flex-wrap mb-4">
              {STATUS_TABS.map(tab => {
                const isActive = activeStatusTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveStatusTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                      isActive ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'}`}>
                      {statusCounts[tab.key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por número ou cliente..."
                  className="pl-10"
                />
              </div>

              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="DID">DID</SelectItem>
                  <SelectItem value="DDR">DDR</SelectItem>
                  <SelectItem value="0800">0800</SelectItem>
                  <SelectItem value="Móvel">Móvel</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Aguardando Ativação">Aguardando Ativação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {isLoadingNumeros ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                  <span className="text-gray-500 text-sm">Carregando números...</span>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="pl-4 pr-2 py-3 w-8">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                          checked={pagedNumeros.length > 0 && selectedIds.length === pagedNumeros.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={toggleSort}
                        title={sortBy ? `Ordenar ${sortBy === 'asc' ? 'descendente' : 'padrão'}` : 'Ordenar A-Z'}
                      >
                        Número {sortBy === 'asc' ? '↑' : sortBy === 'desc' ? '↓' : ''}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operadora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Mensal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativação</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagedNumeros.map((numero) => (
                      <tr
                        key={numero.id}
                        onClick={() => { setSelectedNumero(numero); setShowNumeroModal(true); }}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedIds.includes(numero.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="pl-4 pr-2 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                            checked={selectedIds.includes(numero.id)}
                            onChange={(e) => toggleSelect(e, numero.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-gray-900">{numero.numero}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${TIPO_COLORS[numero.tipo] || 'bg-gray-100 text-gray-700'} border`}>{numero.tipo}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {numero.cliente && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span>{numero.cliente}</span>
                            </div>
                          )}
                        </td>
                        {/* Fornecedor dropdown inline */}
                        <td className="px-6 py-4 text-sm text-gray-700" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={numero.fornecedor_id || '__none__'}
                            onValueChange={(val) => handleInlineUpdate(numero.id, 'fornecedor_id', val === '__none__' ? '' : val)}
                          >
                            <SelectTrigger className="h-8 text-xs border-0 shadow-none bg-transparent hover:bg-gray-100 px-2 w-36 focus:ring-0">
                              <SelectValue>
                                {numero.fornecedor_id ? getFornecedorNome(numero.fornecedor_id) : (numero.fornecedor || '-')}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent onClick={(e) => e.stopPropagation()}>
                              <SelectItem value="__none__">-</SelectItem>
                              {fornecedores.map(f => (
                                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        {/* Operadora dropdown inline */}
                        <td className="px-6 py-4 text-sm text-gray-700" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={numero.operadora || '__none__'}
                            onValueChange={(val) => handleInlineUpdate(numero.id, 'operadora', val === '__none__' ? '' : val)}
                          >
                            <SelectTrigger className="h-8 text-xs border-0 shadow-none bg-transparent hover:bg-gray-100 px-2 w-32 focus:ring-0">
                              <SelectValue>
                                {numero.operadora || '-'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent onClick={(e) => e.stopPropagation()}>
                              <SelectItem value="__none__">-</SelectItem>
                              {OPERADORA_OPTIONS.map(op => (
                                <SelectItem key={op} value={op}>{op}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4">
                          {numero.preco_mensal_unitario != null ? (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-600">
                                R$ {numero.preco_mensal_unitario.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{numero.data_ativacao || '-'}</td>
                        {/* Status dropdown inline */}
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={numero.status || 'Ativo'}
                            onValueChange={(val) => handleInlineUpdate(numero.id, 'status', val)}
                          >
                            <SelectTrigger className="h-8 text-xs border-0 shadow-none bg-transparent hover:bg-gray-100 px-1 w-auto focus:ring-0">
                              <Badge className={`${STATUS_COLORS[numero.status] || 'bg-gray-100 text-gray-700'} border cursor-pointer`}>
                                {numero.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent onClick={(e) => e.stopPropagation()}>
                              {Object.keys(STATUS_COLORS).map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleDeleteNumero(e, numero)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir número"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {!isLoadingNumeros && pagedNumeros.length === 0 && (
                <div className="text-center py-12">
                  <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum número encontrado</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages} · {filteredNumeros.length} registros
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab: Preços */}
          <TabsContent value="precos">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {isLoadingPricing ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                  <span className="text-gray-500 text-sm">Carregando preços...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Número</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Mensal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observações</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pricingRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">{rule.tipo_numero}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {rule.fornecedor_id ? getFornecedorNome(rule.fornecedor_id) : rule.fornecedor_numero}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${TIPO_CLIENTE_COLORS[rule.tipo_cliente] || 'bg-gray-100 text-gray-700'} border`}>
                              {rule.tipo_cliente === 'Pessoa Jurídica' ? 'PJ' : rule.tipo_cliente === 'Pessoa Física' ? 'PF' : 'PJ/PF'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-600">R$ {rule.preco_mensal.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{rule.observacoes || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => { setSelectedPricing(rule); setShowPricingModal(true); }}
                                className="hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => handleDeletePricing(rule.id)}
                                className="hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoadingPricing && pricingRules.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma regra de preço cadastrada</p>
                  <p className="text-sm text-gray-400 mt-1">Clique em "Nova Regra de Preço" para começar</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm">
          <span>🗑️ <strong>{undoToast.numero.numero}</strong> excluído</span>
          <button
            onClick={handleUndo}
            className="ml-2 px-3 py-1 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-xs"
          >
            Desfazer
          </button>
        </div>
      )}

      <NumeroDIDModal
        numero={selectedNumero}
        isOpen={showNumeroModal}
        onClose={() => { setShowNumeroModal(false); setSelectedNumero(null); }}
      />

      <PricingModal
        pricing={selectedPricing}
        isOpen={showPricingModal}
        onClose={() => { setShowPricingModal(false); setSelectedPricing(null); }}
      />

      <ImportarNumerosDIDModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onComplete={() => {
          setShowImportModal(false);
          queryClient.invalidateQueries({ queryKey: ['numeros'] });
        }}
      />
    </div>
  );
}