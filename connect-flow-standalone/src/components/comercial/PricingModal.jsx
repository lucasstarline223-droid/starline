import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

export default function PricingModal({ pricing, isOpen, onClose }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    tipo_numero: '',
    fornecedor_id: '',
    fornecedor_numero: '',
    tipo_cliente: '',
    preco_mensal: '',
    observacoes: ''
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

  useEffect(() => {
    if (pricing) {
      setFormData(pricing);
    } else {
      setFormData({
        tipo_numero: '',
        fornecedor_id: '',
        fornecedor_numero: '',
        tipo_cliente: '',
        preco_mensal: '',
        observacoes: ''
      });
    }
  }, [pricing, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (pricing) {
        return base44.entities.NumeroDIDPricing.update(pricing.id, data);
      }
      return base44.entities.NumeroDIDPricing.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const cleanedData = { ...formData };
    if (cleanedData.preco_mensal === '' || cleanedData.preco_mensal === null) {
      alert('Por favor, informe o preço mensal');
      return;
    }
    
    saveMutation.mutate(cleanedData);
  };

  const handleFornecedorChange = (fornecedorId) => {
    const selectedFornecedor = fornecedores.find(f => f.id === fornecedorId);
    setFormData({
      ...formData,
      fornecedor_id: fornecedorId,
      fornecedor_numero: selectedFornecedor ? selectedFornecedor.nome : ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {pricing ? 'Editar Regra de Preço' : 'Nova Regra de Preço'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Número *</Label>
              <Select
                value={formData.tipo_numero}
                onValueChange={(value) => setFormData({...formData, tipo_numero: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
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
              <Label>Fornecedor *</Label>
              <Select
                value={formData.fornecedor_id}
                onValueChange={handleFornecedorChange}
                required
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
              <Label>Tipo de Cliente *</Label>
              <Select
                value={formData.tipo_cliente}
                onValueChange={(value) => setFormData({...formData, tipo_cliente: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pessoa Jurídica">Pessoa Jurídica (PJ)</SelectItem>
                  <SelectItem value="Pessoa Física">Pessoa Física (PF)</SelectItem>
                  <SelectItem value="Ambos">Ambos (PJ e PF)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                "Ambos" aplica o mesmo preço para PJ e PF
              </p>
            </div>

            <div>
              <Label>Preço Mensal (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_mensal}
                onChange={(e) => setFormData({...formData, preco_mensal: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                rows={3}
                placeholder="Informações adicionais sobre esta regra de preço..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Regra'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}