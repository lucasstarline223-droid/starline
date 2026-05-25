import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, XCircle, Filter, Trash2 } from 'lucide-react';
import SolicitarCancelamentoModal from '@/components/cancelamentos/SolicitarCancelamentoModal';
import CancelamentoCard from '@/components/cancelamentos/CancelamentoCard';

const TABS = [
  { key: 'Em Análise', label: 'Em Análise', color: 'text-yellow-700', activeBg: 'bg-yellow-50', activeBorder: 'border-yellow-400', activeCount: 'text-yellow-700' },
  { key: 'Offboarding Financeiro', label: 'Offboarding Financeiro', color: 'text-blue-700', activeBg: 'bg-blue-50', activeBorder: 'border-blue-500', activeCount: 'text-blue-700' },
  { key: 'Offboarding Técnico', label: 'Offboarding Técnico', color: 'text-orange-700', activeBg: 'bg-orange-50', activeBorder: 'border-orange-400', activeCount: 'text-orange-700' },
  { key: 'Cancelado', label: 'Cancelados', color: 'text-red-700', activeBg: 'bg-red-50', activeBorder: 'border-red-400', activeCount: 'text-red-700' },
];

const MOTIVOS = ['Todos', 'Preço', 'Problema Técnico', 'Falta de Uso', 'Encerramento de Atividade', 'Portabilidade', 'Inadimplência', 'Outro'];

export default function Cancelamentos() {
  const [activeTab, setActiveTab] = useState('Em Análise');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMotivo, setFilterMotivo] = useState('Todos');
  const [selected, setSelected] = useState([]);
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cancelamentoId = params.get('cancelamento_id');
    if (cancelamentoId) {
      setActiveTab('Cancelado');
      setHighlightId(cancelamentoId);
      setTimeout(() => {
        document.getElementById(`cancelamento-${cancelamentoId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, []);
  const queryClient = useQueryClient();

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Deletar ${selected.length} cancelamento(s)?`)) return;
    await Promise.all(selected.map(id => base44.entities.Cancelamento.delete(id)));
    setSelected([]);
    queryClient.invalidateQueries({ queryKey: ['cancelamentos'] });
  };

  const { data: cancelamentos = [], isLoading } = useQuery({
    queryKey: ['cancelamentos'],
    queryFn: () => base44.entities.Cancelamento.list('-created_date', 500),
  });

  const byStatus = (status) => cancelamentos.filter(c => c.status === status);

  const filtered = cancelamentos
    .filter(c => c.status === activeTab)
    .filter(c => !search || (c.nome_cliente || '').toLowerCase().includes(search.toLowerCase()) || (c.cnpj_cpf || '').includes(search))
    .filter(c => filterMotivo === 'Todos' || c.motivo_cancelamento === filterMotivo);

  return (
    <div className="p-6 min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-500" />
            Cancelamentos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie o fluxo de cancelamento de clientes</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Deletar ({selected.length})
            </Button>
          )}
          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Resumo por status */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`border-2 rounded-xl p-4 text-left transition-all ${
              activeTab === tab.key
                ? `${tab.activeBg} ${tab.activeBorder} shadow-sm`
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`text-2xl font-bold ${activeTab === tab.key ? tab.activeCount : 'text-gray-700'}`}>
              {byStatus(tab.key).length}
            </div>
            <div className={`text-xs mt-1 ${activeTab === tab.key ? tab.color : 'text-gray-500'}`}>{tab.label}</div>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterMotivo} onValueChange={setFilterMotivo}>
          <SelectTrigger className="w-56">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOTIVOS.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <XCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum cancelamento encontrado nesta etapa.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-4 w-4 h-4 cursor-pointer accent-red-600"
                checked={selected.includes(c.id)}
                onChange={() => toggleSelect(c.id)}
              />
              <div id={`cancelamento-${c.id}`} className={`flex-1 transition-all ${highlightId === c.id ? 'ring-2 ring-red-400 rounded-xl' : ''}`}>
                <CancelamentoCard cancelamento={c} />
              </div>
            </div>
          ))}
        </div>
      )}

      <SolicitarCancelamentoModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}