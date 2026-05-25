import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserSelect from './UserSelect';

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function MaskedInput({ value, onChange, placeholder, ...props }) {
  const handleChange = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1)$2-$3');
    } else {
      v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1)$2-$3');
    }
    onChange(v);
  };
  return <Input value={value} onChange={handleChange} placeholder={placeholder} maxLength={15} {...props} />;
}

export default function LeadModal({ lead, isOpen, onClose }) {
  const [formData, setFormData] = useState(lead || {
    nome_empresa: '',
    nome_contato: '',
    email_contato: '',
    telefone_contato: '',
    whatsapp: '',
    email_empresa: '',
    telefone_empresa: '',
    segmento: '',
    cidade: '',
    estado: '',
    observacoes_iniciais: '',
    fonte_lead: '',
    sdr: '',
    sdr_nome: '',
    status: 'novo'
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (lead?.id) return base44.entities.Lead.update(lead.id, data);
      return base44.entities.Lead.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.fonte_lead) newErrors.fonte_lead = 'Selecione a fonte do lead';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    saveMutation.mutate(formData);
  };

  const set = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Empresa */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informações da Empresa</h3>
            <div>
              <Label>Nome da Empresa *</Label>
              <Input value={formData.nome_empresa} onChange={(e) => set('nome_empresa', e.target.value)} placeholder="Nome da empresa" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>E-mail Empresa</Label>
                <Input type="email" value={formData.email_empresa} onChange={(e) => set('email_empresa', e.target.value)} placeholder="contato@empresa.com" />
              </div>
              <div>
                <Label>Telefone Empresa</Label>
                <MaskedInput value={formData.telefone_empresa || ''} onChange={(v) => set('telefone_empresa', v)} placeholder="(00)00000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Segmento</Label>
                <Select value={formData.segmento} onValueChange={(v) => set('segmento', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar segmento" /></SelectTrigger>
                  <SelectContent>
                    {['Comércio','Indústria','Serviços','Saúde','Educação','Tecnologia','Outro'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Cidade</Label>
                  <Input value={formData.cidade || ''} onChange={(e) => set('cidade', e.target.value)} placeholder="São Paulo" />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={formData.estado} onValueChange={(v) => set('estado', v)}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Contato Principal</h3>
            <div>
              <Label>Nome do Contato</Label>
              <Input value={formData.nome_contato} onChange={(e) => set('nome_contato', e.target.value)} placeholder="João Silva" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>E-mail Contato</Label>
                <Input type="email" value={formData.email_contato} onChange={(e) => set('email_contato', e.target.value)} placeholder="joao@empresa.com" />
              </div>
              <div>
                <Label>Telefone Contato</Label>
                <MaskedInput value={formData.telefone_contato || ''} onChange={(v) => set('telefone_contato', v)} placeholder="(00)00000-0000" />
              </div>
            </div>
            <div>
              <Label>WhatsApp</Label>
              <MaskedInput value={formData.whatsapp || ''} onChange={(v) => set('whatsapp', v)} placeholder="(00)00000-0000" />
            </div>
          </div>

          {/* Classificação */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Classificação</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fonte do Lead *</Label>
                <Select value={formData.fonte_lead} onValueChange={(v) => set('fonte_lead', v)}>
                  <SelectTrigger className={errors.fonte_lead ? 'border-red-400' : ''}>
                    <SelectValue placeholder="Selecionar fonte..." />
                  </SelectTrigger>
                  <SelectContent>
                    {['Site','Indicação','Cold Call','Lista Speedio','WhatsApp','Redes Sociais','Evento','Outro'].map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fonte_lead && <p className="text-xs text-red-500 mt-1">{errors.fonte_lead}</p>}
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="em_prospeccao">Em Prospecção</SelectItem>
                    <SelectItem value="convertido">Convertido</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>SDR Responsável</Label>
              <UserSelect
                value={formData.sdr || ''}
                onChange={(email, nome) => setFormData(prev => ({ ...prev, sdr: email, sdr_nome: nome || '' }))}
                placeholder="Selecionar SDR"
              />
            </div>
            <div>
              <Label>Observações Iniciais</Label>
              <textarea
                value={formData.observacoes_iniciais || ''}
                onChange={(e) => set('observacoes_iniciais', e.target.value)}
                placeholder="Contexto inicial, como o lead chegou, interesse demonstrado..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2" disabled={saveMutation.isPending}>
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}