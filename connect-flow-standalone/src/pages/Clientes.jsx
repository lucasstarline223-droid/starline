import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Plus, Search, Building2, Trash2, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ClientModal from '@/components/comercial/ClientModal';
import ImportarClientesModal from '@/components/comercial/ImportarClientesModal';

const STATUS_TABS = [
  { key: 'todos', label: 'Todos', color: 'text-gray-700' },
  { key: 'Ativo', label: 'Ativo', color: 'text-green-600' },
  { key: 'Inativo', label: 'Inativo', color: 'text-yellow-600' },
  { key: 'Cancelado', label: 'Cancelado', color: 'text-red-600' },
];

const STATUS_BADGE = {
  Ativo: 'bg-green-100 text-green-700 border-green-200',
  Cadastrado: 'bg-blue-100 text-blue-700 border-blue-200',
  Inativo: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Cancelado: 'bg-red-100 text-red-700 border-red-200',
  'Em cadastro': 'bg-blue-100 text-blue-700 border-blue-200',
};

const getHealthScoreColor = (score) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

export default function Clientes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const undoRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('clientes_page');
    return saved ? parseInt(saved, 10) : 1;
  });

  const goToPage = (page) => {
    setCurrentPage(page);
    sessionStorage.setItem('clientes_page', page);
  };
  const [sortBy, setSortBy] = useState(null); // null, 'asc', 'desc'
  const PAGE_SIZE = 50;

  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 10000)
  });

  const { data: allDIDs = [] } = useQuery({
    queryKey: ['allNumeroDID'],
    queryFn: () => base44.entities.NumeroDID.list('-created_date', 5000)
  });

  const { data: cancelamentos = [] } = useQuery({
    queryKey: ['cancelamentos'],
    queryFn: () => base44.entities.Cancelamento.list('-created_date', 5000)
  });

  const cancelamentoByClient = useMemo(() => {
    const map = {};
    cancelamentos.forEach(c => {
      if (c.client_id && !map[c.client_id]) map[c.client_id] = c;
    });
    return map;
  }, [cancelamentos]);

  const didsByClient = useMemo(() => {
    const map = {};
    allDIDs.forEach(d => {
      if (d.client_id) {
        if (!map[d.client_id]) map[d.client_id] = [];
        map[d.client_id].push(d);
      }
    });
    return map;
  }, [allDIDs]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
  });

  const restoreMutation = useMutation({
    mutationFn: (clientData) => {
      const { id, created_date, updated_date, created_by, ...data } = clientData;
      return base44.entities.Client.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
  });

  const handleDelete = (e, client) => {
    e.stopPropagation();
    const name = client.nome_fantasia || client.razao_social || client.task_name || 'este cliente';
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      // Cancela undo anterior se ainda estiver pendente
      if (undoRef.current) {
        clearTimeout(undoRef.current.timeoutId);
        deleteMutation.mutate(undoRef.current.client.id);
      }

      // Remove da lista visualmente
      queryClient.setQueryData(['clients'], (old = []) => old.filter(c => c.id !== client.id));

      // Agenda exclusão real após 4s
      const timeoutId = setTimeout(() => {
        deleteMutation.mutate(client.id);
        setUndoToast(null);
        undoRef.current = null;
      }, 4000);

      undoRef.current = { client, timeoutId };
      setUndoToast({ client, name });
    }
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
  });

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pagedClients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pagedClients.map(c => c.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Excluir ${selectedIds.length} cliente(s) selecionado(s)?`)) {
      selectedIds.forEach(id => deleteMutation.mutate(id));
      setSelectedIds([]);
    }
  };

  const handleBulkStatus = (status) => {
    selectedIds.forEach(id => updateMutation.mutate({ id, data: { status } }));
    setSelectedIds([]);
  };

  const handleUndo = () => {
    if (!undoRef.current) return;
    clearTimeout(undoRef.current.timeoutId);
    // Restaura na lista visualmente
    queryClient.setQueryData(['clients'], (old = []) => [undoRef.current.client, ...old]);
    undoRef.current = null;
    setUndoToast(null);
  };

  // Normaliza status do CSV para os valores novos
  const normalizeStatus = (s) => {
    if (!s) return 'Cadastrado';
    const map = {
      'ativo': 'Ativo',
      'inativo': 'Inativo',
      'cancelado': 'Cancelado',
      'cadastrado': 'Cadastrado',
      'em cadastro': 'Cadastrado',
    };
    return map[s.toLowerCase()] || s;
  };

  const countByStatus = (statusKey) =>
    clients.filter(c => normalizeStatus(c.status) === statusKey).length;

  const normalizePhone = (phone) => (phone || '').replace(/\D/g, '');

  const filteredClients = clients.filter(client => {
    const clientStatus = normalizeStatus(client.status);
    const matchTab = activeTab === 'todos' || clientStatus === activeTab;

    if (!searchTerm.trim()) return matchTab;

    const term = searchTerm.toLowerCase().trim();
    const termDigits = normalizePhone(searchTerm);

    const matchSearch = [
      client.razao_social,
      client.nome_fantasia,
      client.cnpj_cpf,
      client.email_financeiro,
      client.email_acesso_wati,
      client.telefone_contato,
      client.csm_responsavel,
      client.owner_comercial,
      client.endereco,
      client.dominio_pabx,
      client.account_id,
      client.segmento
    ].some(field => field && field.toLowerCase().includes(term)) ||
      (termDigits.length >= 4 && normalizePhone(client.telefone_contato).includes(termDigits));

    return matchSearch && matchTab;
  });

  const sortedClients = sortBy ? [...filteredClients].sort((a, b) => {
    const aName = (a.nome_fantasia || a.razao_social || '').toLowerCase();
    const bName = (b.nome_fantasia || b.razao_social || '').toLowerCase();
    return sortBy === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
  }) : filteredClients;

  const totalPages = Math.max(1, Math.ceil(sortedClients.length / PAGE_SIZE));
  const pagedClients = sortedClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = () => {
    setSortBy(sortBy === null ? 'asc' : sortBy === 'asc' ? 'desc' : null);
    goToPage(1);
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
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-1">{filteredClients.length} cliente(s) encontrado(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar CSV
            </Button>
            <Button
              onClick={() => { setSelectedClient(null); setShowModal(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); goToPage(1); }}
            placeholder="Buscar por nome, telefone (ex: 5137625719), email, CNPJ..."
            className="pl-10"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_TABS.map(tab => {
            const count = tab.key === 'todos' ? clients.length : countByStatus(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); goToPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-8 py-3 flex items-center gap-3">
          <span className="text-sm font-semibold text-blue-700">{selectedIds.length} selecionado(s)</span>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-500">Alterar status para:</span>
            {['Ativo', 'Inativo', 'Cancelado', 'Cadastrado'].map(s => (
              <button
                key={s}
                onClick={() => handleBulkStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${STATUS_BADGE[s] || 'bg-gray-100 text-gray-700'} hover:opacity-80`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir selecionados
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

      {/* Table */}
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-8">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                      checked={pagedClients.length > 0 && selectedIds.length === pagedClients.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={toggleSort}
                    title={sortBy ? `Ordenar ${sortBy === 'asc' ? 'descendente' : 'padrão'}` : 'Ordenar A-Z'}
                  >
                    Cliente {sortBy === 'asc' ? '↑' : sortBy === 'desc' ? '↓' : ''}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ/CPF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DID/DDR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segmento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-green-600">Health Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedClients.map((client) => {
                  const displayName = client.nome_fantasia || client.razao_social || client.task_name;
                  const statusNorm = normalizeStatus(client.status);
                  return (
                    <tr
                      key={client.id}
                      onClick={() => navigate(createPageUrl('ClientProfile') + `?id=${client.id}`)}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedIds.includes(client.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="pl-4 pr-2 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                          checked={selectedIds.includes(client.id)}
                          onChange={(e) => toggleSelect(e, client.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{displayName}</p>
                          {client.razao_social && client.nome_fantasia && (
                            <p className="text-sm text-gray-500">{client.razao_social}</p>
                          )}
                          {activeTab === 'Cancelado' && statusNorm === 'Cancelado' && cancelamentoByClient[client.id] && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full text-xs text-red-600 font-medium">
                              Motivo: {cancelamentoByClient[client.id].motivo_cancelamento || 'Não informado'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{client.cnpj_cpf || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {client.email_financeiro && (
                            <p className="text-sm text-gray-600 truncate max-w-xs">{client.email_financeiro}</p>
                          )}
                          {client.telefone_contato && (
                            <p className="text-sm text-gray-500">{client.telefone_contato}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {(didsByClient[client.id] || []).filter(d => d.status === 'Ativo').length > 0 ? (
                            (didsByClient[client.id] || []).filter(d => d.status === 'Ativo').slice(0, 3).map(d => (
                              <p key={d.id} className="text-sm text-gray-700 font-mono">{d.numero}</p>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{client.segmento || '-'}</td>
                      <td className="px-6 py-4">
                        {client.health_score != null ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getHealthScoreColor(client.health_score)}`}></div>
                            <span className="text-sm font-semibold text-gray-700">{client.health_score}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={statusNorm}
                          onValueChange={(val) => updateMutation.mutate({ id: client.id, data: { status: val } })}
                        >
                          <SelectTrigger className="h-8 text-xs border-0 shadow-none bg-transparent hover:bg-gray-100 px-1 w-auto focus:ring-0">
                            <Badge className={`${STATUS_BADGE[statusNorm] || 'bg-gray-100 text-gray-700'} border cursor-pointer`}>
                              {statusNorm}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent onClick={(e) => e.stopPropagation()}>
                            {['Ativo', 'Cadastrado', 'Inativo', 'Cancelado'].map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDelete(e, client)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              Página {currentPage} de {totalPages} · {filteredClients.length} registros
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {(() => {
                const pages = [];
                const delta = 2;
                const left = Math.max(2, currentPage - delta);
                const right = Math.min(totalPages - 1, currentPage + delta);
                pages.push(1);
                if (left > 2) pages.push('...');
                for (let i = left; i <= right; i++) pages.push(i);
                if (right < totalPages - 1) pages.push('...');
                if (totalPages > 1) pages.push(totalPages);
                return pages.map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                        currentPage === p
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      <ClientModal
        client={selectedClient}
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedClient(null); }}
      />

      <ImportarClientesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onComplete={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
      />

      {/* Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm animate-in fade-in slide-in-from-bottom-4">
          <span>🗑️ <strong>{undoToast.name}</strong> excluído</span>
          <button
            onClick={handleUndo}
            className="ml-2 px-3 py-1 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-xs"
          >
            Desfazer
          </button>
        </div>
      )}
    </div>
  );
}