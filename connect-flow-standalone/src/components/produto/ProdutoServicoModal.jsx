import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProdutoServicoModal({ item, isOpen, onClose }) {
  const [formData, setFormData] = useState(item || {
    item_id: '',
    nome_item: '',
    categoria: '',
    tipo: '',
    cobranca_tipo: '',
    unidade: '',
    preco_mensal_tabela_r: 0,
    observacoes: '',
    fornecedor_id: '',
    fornecedor_nome: '',
    cost_model_type: '',
    custo_fixo_mensal_r: 0,
    custo_anual_r: 0,
    moeda_fornecedor: 'BRL',
    versao_plano: '',
    disponivel_a_venda: 'Sim',
    custo_var_unit_r: 0
  });

  const queryClient = useQueryClient();

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list()
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (item?.id) {
        return base44.entities.ProdutoServico.update(item.id, data);
      }
      return base44.entities.ProdutoServico.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-addons'] });
      queryClient.invalidateQueries({ queryKey: ['produtos-skus'] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleFornecedorChange = (fornecedorId) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    setFormData({
      ...formData,
      fornecedor_id: fornecedorId,
      fornecedor_nome: fornecedor?.nome || ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {item ? 'Editar Produto/Serviço' : 'Novo Produto/Serviço'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Identificação */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-600 rounded"></span>
              Identificação
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Item ID *</Label>
                <Input
                  value={formData.item_id}
                  onChange={(e) => setFormData({...formData, item_id: e.target.value})}
                  placeholder="Ex: TEL-RAMAL-001"
                  required
                />
              </div>

              <div>
                <Label>Nome do Item</Label>
                <Input
                  value={formData.nome_item}
                  onChange={(e) => setFormData({...formData, nome_item: e.target.value})}
                  placeholder="Ex: Growth | API Oficial WhatsApp | 5 Users"
                />
              </div>

              <div>
                <Label>Versão Plano</Label>
                <Input
                  value={formData.versao_plano}
                  onChange={(e) => setFormData({...formData, versao_plano: e.target.value})}
                  placeholder="Ex: v2.0"
                />
              </div>
              
              <div></div>

              <div>
                <Label>Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({...formData, categoria: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Telefonia">Telefonia</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Internet">Internet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({...formData, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unidade (Atom)">Unidade (Atom)</SelectItem>
                    <SelectItem value="Pacote (Bundle)">Pacote (Bundle)</SelectItem>
                    <SelectItem value="Grupo (Package)">Grupo (Package)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Unidade</Label>
                <Select
                  value={formData.unidade}
                  onValueChange={(value) => setFormData({...formData, unidade: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Canal">Canal</SelectItem>
                    <SelectItem value="Ramal">Ramal</SelectItem>
                    <SelectItem value="Bloco DDR">Bloco DDR</SelectItem>
                    <SelectItem value="DID">DID</SelectItem>
                    <SelectItem value="Plano">Plano</SelectItem>
                    <SelectItem value="Usuário">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Cobrança</Label>
                <Select
                  value={formData.cobranca_tipo}
                  onValueChange={(value) => setFormData({...formData, cobranca_tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Única">Única</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preços */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-green-600 rounded"></span>
              Preços e Custos
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Preço Mensal Tabela (BRL) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.preco_mensal_tabela_r}
                  onChange={(e) => setFormData({...formData, preco_mensal_tabela_r: parseFloat(e.target.value)})}
                  required
                />
              </div>

              <div>
                <Label>Custo Fixo Mensal (BRL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.custo_fixo_mensal_r}
                  onChange={(e) => setFormData({...formData, custo_fixo_mensal_r: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <Label>Custo Anual (BRL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.custo_anual_r}
                  onChange={(e) => setFormData({...formData, custo_anual_r: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <Label>Custo Variável Unitário (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.custo_var_unit_r}
                  onChange={(e) => setFormData({...formData, custo_var_unit_r: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <Label>Modelo de Custo</Label>
                <Select
                  value={formData.cost_model_type}
                  onValueChange={(value) => setFormData({...formData, cost_model_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FixedMonthly">Fixed Monthly</SelectItem>
                    <SelectItem value="AnnualPrepay">Annual Prepay</SelectItem>
                    <SelectItem value="PerUser">Per User</SelectItem>
                    <SelectItem value="PerWorkflow">Per Workflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Moeda Fornecedor</Label>
                <Input
                  value={formData.moeda_fornecedor}
                  onChange={(e) => setFormData({...formData, moeda_fornecedor: e.target.value})}
                  placeholder="BRL"
                />
              </div>
            </div>
          </div>

          {/* Fornecedor */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded"></span>
              Fornecedor
            </h3>
            
            <div>
              <Label>Fornecedor</Label>
              <Select
                value={formData.fornecedor_id}
                onValueChange={handleFornecedorChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
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
          </div>

          {/* Observações e Status */}
          <div className="space-y-4">
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>

            <div>
              <Label>Disponível à Venda</Label>
              <Select
                value={formData.disponivel_a_venda}
                onValueChange={(value) => setFormData({...formData, disponivel_a_venda: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center gap-2"
              disabled={saveMutation.isLoading}
            >
              <Save className="w-4 h-4" />
              {saveMutation.isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}