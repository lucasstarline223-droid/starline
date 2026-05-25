import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Search, XCircle, ExternalLink } from 'lucide-react';

export default function NumeroDIDModal({ numero, isOpen, onClose, onSuccess, defaultClientId, defaultClientName }) {
  const queryClient = useQueryClient();
  const [clientSearch, setClientSearch] = useState('');
  const [existingNumero, setExistingNumero] = useState(null);
  const [checkingNumero, setCheckingNumero] = useState(false);

  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'DID',
    client_id: '',
    cliente: '',
    status: 'Ativo',
    fornecedor_id: '',
    fornecedor: '',
    operadora: '',
    preco_mensal_unitario: null,
    data_ativacao: '',
    observacoes: ''
  });

  // Load clients for the select
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: isOpen
  });

  // Load fornecedores de telefonia
  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const allFornecedores = await base44.entities.Fornecedor.list();
      return allFornecedores.filter(f => f.categoria === 'Telefonia');
    },
    enabled: isOpen
  });

  // Load pricing rules
  const { data: pricingRules = [] } = useQuery({
    queryKey: ['pricingRules'],
    queryFn: () => base44.entities.NumeroDIDPricing.list(),
    enabled: isOpen
  });

  useEffect(() => {
    if (numero) {
      // Se o registro tem nome do fornecedor mas não tem fornecedor_id, tenta resolver pelo nome
      const data = { ...numero };
      if (!data.fornecedor_id && data.fornecedor && fornecedores.length > 0) {
        const found = fornecedores.find(f => f.nome === data.fornecedor);
        if (found) data.fornecedor_id = found.id;
      }
      setFormData(data);
    } else {
      setFormData({
        numero: '',
        tipo: 'DID',
        client_id: defaultClientId || '',
        cliente: defaultClientName || '',
        status: 'Ativo',
        fornecedor_id: '',
        fornecedor: '',
        operadora: '',
        preco_mensal_unitario: null,
        data_ativacao: '',
        observacoes: ''
      });
    }
  }, [numero, isOpen, fornecedores, defaultClientId, defaultClientName]);

  // Auto-calculate price when tipo, fornecedor_id, and client change
  useEffect(() => {
    if (formData.tipo && formData.fornecedor_id && formData.client_id) {
      const selectedClient = clients.find(c => c.id === formData.client_id);
      if (selectedClient) {
        const regra = pricingRules.find(r => 
          r.tipo_numero === formData.tipo && 
          r.fornecedor_id === formData.fornecedor_id &&
          (r.tipo_cliente === selectedClient.pj_ou_pf || r.tipo_cliente === 'Ambos')
        );
        
        if (regra) {
          setFormData(prev => ({...prev, preco_mensal_unitario: regra.preco_mensal}));
        } else {
          setFormData(prev => ({...prev, preco_mensal_unitario: null}));
        }
      }
    }
  }, [formData.tipo, formData.fornecedor_id, formData.client_id, clients, pricingRules]);

  // Check if numero already exists when user types
  useEffect(() => {
    const checkNumero = async () => {
      if (formData.numero && formData.numero.length >= 8 && !numero) {
        setCheckingNumero(true);
        try {
          const allNumeros = await base44.entities.NumeroDID.list();
          const found = allNumeros.find(n => n.numero === formData.numero);
          setExistingNumero(found || null);
        } catch (error) {
          console.error('Error checking numero:', error);
          setExistingNumero(null);
        } finally {
          setCheckingNumero(false);
        }
      } else {
        setExistingNumero(null);
      }
    };

    const timer = setTimeout(checkNumero, 500);
    return () => clearTimeout(timer);
  }, [formData.numero, numero]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (numero) {
        return base44.entities.NumeroDID.update(numero.id, data);
      }
      if (existingNumero) {
        // Número já existe, apenas atualiza o client_id
        return base44.entities.NumeroDID.update(existingNumero.id, {
          ...existingNumero,
          client_id: data.client_id,
          cliente: data.cliente
        });
      }
      return base44.entities.NumeroDID.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numeros'] });
      queryClient.invalidateQueries({ queryKey: ['clientNumbers'] });
      if (onSuccess) onSuccess();
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleClientChange = (clientId) => {
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData({
      ...formData,
      client_id: clientId,
      cliente: selectedClient ? (selectedClient.nome_fantasia || selectedClient.razao_social) : ''
    });
  };

  const handleFornecedorChange = (fornecedorId) => {
    const selectedFornecedor = fornecedores.find(f => f.id === fornecedorId);
    setFormData({
      ...formData,
      fornecedor_id: fornecedorId,
      fornecedor: selectedFornecedor ? selectedFornecedor.nome : ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col [&_label]:text-gray-700 [&_input]:text-gray-900 [&_input]:bg-white [&_textarea]:text-gray-900 [&_textarea]:bg-white [&_[data-placeholder]]:text-gray-400 [&_[role=combobox]]:text-gray-900 [&_[role=combobox]]:bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {numero ? 'Editar Número' : 'Novo Número DID/DDR'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Aviso de Cancelamento - Topo */}
          {numero?.cancelamento_id && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Número Cancelado
              </div>
              {numero.cancelamento_motivo && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Motivo:</span> {numero.cancelamento_motivo}
                </div>
              )}
              {numero.cancelamento_data && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Data:</span> {numero.cancelamento_data}
                </div>
              )}
              <a
                href={`/Cancelamentos?cancelamento_id=${numero.cancelamento_id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline font-medium mt-1"
              >
                Ver detalhes do Cancelamento <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Número *</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData({...formData, numero: e.target.value})}
                placeholder="Ex: (51) 3333-4444"
                required
              />
              {checkingNumero && (
                <p className="text-xs text-gray-500 mt-1">Verificando se número já existe...</p>
              )}
              {existingNumero && !checkingNumero && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">
                    ✓ Este número já está cadastrado
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {existingNumero.cliente ? `Atualmente vinculado a: ${existingNumero.cliente}` : 'Sem cliente vinculado'}
                  </p>
                  <p className="text-xs text-blue-600">
                    Ao salvar, ele será associado a este cliente.
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({...formData, tipo: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DID">DID</SelectItem>
                  <SelectItem value="DDR">DDR</SelectItem>
                  <SelectItem value="0800">0800</SelectItem>
                  <SelectItem value="Móvel">Móvel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Portabilidade">Portabilidade</SelectItem>
                  <SelectItem value="Aguardando Ativação">Aguardando Ativação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Cliente</Label>
              <Select
                value={formData.client_id}
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 sticky top-0 bg-white border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="Buscar cliente..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {clients
                    .filter(c => {
                      const name = (c.nome_fantasia || c.razao_social || '').toLowerCase();
                      return name.includes(clientSearch.toLowerCase());
                    })
                    .map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nome_fantasia || client.razao_social}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fornecedor</Label>
              <Select
                value={formData.fornecedor_id}
                onValueChange={handleFornecedorChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Operadora</Label>
              <Select
                value={formData.operadora}
                onValueChange={(value) => setFormData({...formData, operadora: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ligue Ai">Ligue Ai</SelectItem>
                  <SelectItem value="Depositar">Depositar</SelectItem>
                  <SelectItem value="Starline">Starline</SelectItem>
                  <SelectItem value="Meu SYS">Meu SYS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Ativação</Label>
              <Input
                type="date"
                value={formData.data_ativacao}
                onChange={(e) => setFormData({...formData, data_ativacao: e.target.value})}
              />
            </div>

            <div>
              <Label>Preço Mensal Unitário (R$)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.preco_mensal_unitario || ''}
                  readOnly
                  className="bg-gray-50"
                  placeholder="Calculado automaticamente"
                />
                {formData.preco_mensal_unitario !== null && formData.preco_mensal_unitario !== undefined && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-sm font-semibold text-green-600">
                      R$ {formData.preco_mensal_unitario.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Preenchido automaticamente com base no tipo, fornecedor e cliente
              </p>
            </div>

            <div>
              <Label>Tipo de Titularidade</Label>
              <Select
                value={formData.pj_ou_pf || ''}
                onValueChange={(value) => setFormData({...formData, pj_ou_pf: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                  <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Endereço Telefônico</Label>
              <Input
                value={formData.endereco_telefonico || ''}
                onChange={(e) => setFormData({...formData, endereco_telefonico: e.target.value})}
                placeholder="Ex: Porto Alegre - RS"
              />
            </div>

            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                rows={3}
                placeholder="Observações sobre o número..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Número'}
          </Button>
        </div>
      </div>
    </div>
  );
}