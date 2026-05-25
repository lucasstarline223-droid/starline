import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PortabilidadeModal({ portabilidade, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    handoff_id: '',
    numero_solicitado: '',
    cliente_nome: '',
    prazo_sla_portabilidade: '',
    fatura_operadora: '',
    termo_portabilidade: '',
    status_portability: 'Solicitado',
    operadora_origem: '',
    operadora_destino: '',
    id_chamado: '',
    motivos_reject: '',
    janela_inicio: '',
    janela_fim: '',
    tipo_numero_port: ''
  });

  useEffect(() => {
    if (portabilidade) {
      setFormData(portabilidade);
    } else {
      setFormData({
        handoff_id: '',
        numero_solicitado: '',
        cliente_nome: '',
        prazo_sla_portabilidade: '',
        fatura_operadora: '',
        termo_portabilidade: '',
        status_portability: 'Solicitado',
        operadora_origem: '',
        operadora_destino: '',
        id_chamado: '',
        motivos_reject: '',
        janela_inicio: '',
        janela_fim: '',
        tipo_numero_port: ''
      });
    }
  }, [portabilidade, isOpen]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (portabilidade) {
        return base44.entities.Portabilidade.update(portabilidade.id, data);
      }
      return base44.entities.Portabilidade.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['portabilidades']);
      onClose();
    }
  });

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const file_url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, [field]: file_url }));
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {portabilidade ? 'Editar Portabilidade' : 'Nova Portabilidade'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Número Solicitado */}
            <div>
              <Label>Número Solicitado *</Label>
              <Input
                value={formData.numero_solicitado}
                onChange={(e) => setFormData({ ...formData, numero_solicitado: e.target.value })}
                placeholder="Ex: (11) 98765-4321"
                required
              />
            </div>

            {/* Cliente Nome */}
            <div>
              <Label>Nome do Cliente</Label>
              <Input
                value={formData.cliente_nome}
                onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>

            {/* Tipo de Número */}
            <div>
              <Label>Tipo de Número *</Label>
              <Select
                value={formData.tipo_numero_port}
                onValueChange={(value) => setFormData({ ...formData, tipo_numero_port: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DID">DID</SelectItem>
                  <SelectItem value="DDR">DDR</SelectItem>
                  <SelectItem value="0800">0800</SelectItem>
                  <SelectItem value="Sip Movel">Sip Móvel</SelectItem>
                  <SelectItem value="Movel">Móvel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Operadora Origem */}
            <div>
              <Label>Operadora Origem *</Label>
              <Select
                value={formData.operadora_origem}
                onValueChange={(value) => setFormData({ ...formData, operadora_origem: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oi Telecom">Oi Telecom</SelectItem>
                  <SelectItem value="Embratel/Claro">Embratel/Claro</SelectItem>
                  <SelectItem value="Vivo/Telefonica">Vivo/Telefonica</SelectItem>
                  <SelectItem value="Depositar">Depositar</SelectItem>
                  <SelectItem value="Ligue Ai">Ligue Ai</SelectItem>
                  <SelectItem value="BrasRede">BrasRede</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Operadora Destino */}
            <div>
              <Label>Operadora Destino</Label>
              <Select
                value={formData.operadora_destino}
                onValueChange={(value) => setFormData({ ...formData, operadora_destino: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starline">Starline</SelectItem>
                  <SelectItem value="Ligue Ai">Ligue Ai</SelectItem>
                  <SelectItem value="Meu SYS">Meu SYS</SelectItem>
                  <SelectItem value="Depositar">Depositar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status_portability}
                onValueChange={(value) => setFormData({ ...formData, status_portability: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solicitado">Solicitado</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Recusado">Recusado</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ID Chamado */}
            <div>
              <Label>ID Chamado</Label>
              <Input
                value={formData.id_chamado}
                onChange={(e) => setFormData({ ...formData, id_chamado: e.target.value })}
                placeholder="ID do ticket/chamado"
              />
            </div>

            {/* Motivo Rejeição */}
            {formData.status_portability === 'Recusado' && (
              <div>
                <Label>Motivo da Rejeição</Label>
                <Select
                  value={formData.motivos_reject}
                  onValueChange={(value) => setFormData({ ...formData, motivos_reject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dados Divergentes">Dados Divergentes</SelectItem>
                    <SelectItem value="Numero Vago">Número Vago</SelectItem>
                    <SelectItem value="Ticket de Portabilidade">Ticket de Portabilidade</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Prazo SLA */}
            <div>
              <Label>Prazo SLA</Label>
              <Input
                type="date"
                value={formData.prazo_sla_portabilidade}
                onChange={(e) => setFormData({ ...formData, prazo_sla_portabilidade: e.target.value })}
              />
            </div>

            {/* Janela Início */}
            <div>
              <Label>Janela Início</Label>
              <Input
                type="date"
                value={formData.janela_inicio}
                onChange={(e) => setFormData({ ...formData, janela_inicio: e.target.value })}
              />
            </div>

            {/* Janela Fim */}
            <div>
              <Label>Janela Fim</Label>
              <Input
                type="date"
                value={formData.janela_fim}
                onChange={(e) => setFormData({ ...formData, janela_fim: e.target.value })}
              />
            </div>

            {/* Fatura Operadora */}
            <div className="md:col-span-2">
              <Label>Fatura Operadora</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'fatura_operadora')}
                  className="flex-1"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {formData.fatura_operadora && (
                  <a
                    href={formData.fatura_operadora}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                  </a>
                )}
              </div>
            </div>

            {/* Termo Portabilidade */}
            <div className="md:col-span-2">
              <Label>Termo de Portabilidade</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'termo_portabilidade')}
                  className="flex-1"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {formData.termo_portabilidade && (
                  <a
                    href={formData.termo_portabilidade}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                  </a>
                )}
              </div>
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
            disabled={saveMutation.isPending || uploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveMutation.isPending || uploading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}