import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, User, Building2, Pencil, Check, Phone } from 'lucide-react';

export default function SolicitarCancelamentoModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [form, setForm] = useState({
    motivo_cancelamento: '',
    observacoes: '',
  });
  const [editingClient, setEditingClient] = useState(false);
  const [clientEdits, setClientEdits] = useState({});
  const [selectedDIDs, setSelectedDIDs] = useState([]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 500),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clientNumeros = [] } = useQuery({
    queryKey: ['client-numeros', selectedClient?.id],
    queryFn: () => base44.entities.NumeroDID.filter({ client_id: selectedClient.id }),
    enabled: !!selectedClient?.id,
  });

  const toggleDID = (id) => setSelectedDIDs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = search.length >= 2
    ? clients.filter(c =>
        (c.razao_social || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.nome_fantasia || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.cnpj_cpf || '').includes(search)
      ).slice(0, 8)
    : [];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cancelamento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancelamentos'] });
      handleClose();
    },
  });

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSearch(client.nome_fantasia || client.razao_social);
    setShowSuggestions(false);
    setEditingClient(false);
    setClientEdits({});
    setSelectedDIDs([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    const merged = { ...selectedClient, ...clientEdits };
    createMutation.mutate({
      client_id: selectedClient.id,
      nome_cliente: merged.nome_fantasia || merged.razao_social,
      cnpj_cpf: merged.cnpj_cpf || '',
      telefone_contato: merged.telefone_contato || '',
      email_financeiro: merged.email_financeiro || '',
      csm_responsavel: merged.csm_responsavel || '',
      motivo_cancelamento: form.motivo_cancelamento || undefined,
      observacoes: form.observacoes,
      solicitante: currentUser?.full_name || currentUser?.email || '',
      data_solicitacao: new Date().toISOString().split('T')[0],
      status: 'Em Análise',
      etapas_tecnicas: {
        excluir_pabx: false,
        cancelamento_operadora: false,
        verificar_equipamentos: false,
      },
      numeros_did: selectedDIDs,
      numeros_did_info: clientNumeros.filter(n => selectedDIDs.includes(n.id)).map(n => ({ id: n.id, numero: n.numero, tipo: n.tipo })),
    });
  };

  const handleClose = () => {
    setSearch('');
    setSelectedClient(null);
    setShowSuggestions(false);
    setForm({ motivo_cancelamento: '', observacoes: '' });
    setEditingClient(false);
    setClientEdits({});
    setSelectedDIDs([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-500" />
            Solicitar Cancelamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Busca de cliente */}
          <div className="space-y-1 relative">
            <Label>Cliente *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome ou CNPJ/CPF..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedClient(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
            </div>
            {showSuggestions && filtered.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                    onClick={() => handleSelectClient(c)}
                  >
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">{c.nome_fantasia || c.razao_social}</div>
                      {c.cnpj_cpf && <div className="text-xs text-gray-400">{c.cnpj_cpf}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dados autopreenchidos */}
          {selectedClient && (() => {
            const merged = { ...selectedClient, ...clientEdits };
            const fields = [
              { key: 'razao_social', label: 'Razão Social' },
              { key: 'cnpj_cpf', label: 'CNPJ/CPF' },
              { key: 'telefone_contato', label: 'Telefone' },
              { key: 'email_financeiro', label: 'E-mail' },
              { key: 'csm_responsavel', label: 'CSM' },
            ];
            return (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">Dados do cliente</span>
                  <button
                    type="button"
                    onClick={() => setEditingClient(!editingClient)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                      editingClient
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {editingClient ? <><Check className="w-3 h-3" /> Concluído</> : <><Pencil className="w-3 h-3" /> Editar</>}
                  </button>
                </div>
                {fields.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                    {editingClient ? (
                      <Input
                        className="h-7 text-xs"
                        value={merged[key] || ''}
                        onChange={(e) => setClientEdits(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    ) : (
                      <span className={merged[key] ? '' : 'text-gray-300 italic'}>{merged[key] || 'Não informado'}</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Seleção de Números */}
          {selectedClient && (
            <div className="space-y-1">
              <Label>Números DID/DDR para Cancelar *</Label>
              {clientNumeros.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">Nenhum número DID/DDR encontrado para este cliente.</p>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Selecione apenas os números a serem cancelados:</p>
                  {clientNumeros.map(n => (
                    <div key={n.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`did-${n.id}`}
                        checked={selectedDIDs.includes(n.id)}
                        onCheckedChange={() => toggleDID(n.id)}
                      />
                      <label htmlFor={`did-${n.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium">{n.numero}</span>
                        <Badge className={`text-xs border ${n.tipo === 'DID' ? 'bg-blue-100 text-blue-700' : n.tipo === 'DDR' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{n.tipo}</Badge>
                        <span className="text-xs text-gray-400">{n.status}</span>
                      </label>
                    </div>
                  ))}
                  {selectedDIDs.length > 0 && (
                    <p className="text-xs text-blue-600 font-medium pt-1">{selectedDIDs.length} número(s) selecionado(s) para cancelamento</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-1">
            <Label>Motivo do Cancelamento</Label>
            <Select value={form.motivo_cancelamento} onValueChange={(v) => setForm(f => ({ ...f, motivo_cancelamento: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {['Preço','Problema Técnico','Falta de Uso','Encerramento de Atividade','Portabilidade','Inadimplência','Outro'].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              placeholder="Detalhes adicionais sobre o cancelamento..."
              value={form.observacoes}
              onChange={(e) => setForm(f => ({ ...f, observacoes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!selectedClient || selectedDIDs.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? 'Enviando...' : 'Solicitar Cancelamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}