import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function QualificarProspectModal({ isOpen, onClose, prospect, user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    novo_status: 'qualificado',
    observacao: ''
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Atualizar status do prospect
      await base44.entities.Prospect.update(prospect.id, { status: data.novo_status });

      // Registrar atividade de qualificação
      if (data.observacao) {
        const historico = prospect.historico_comentarios || [];
        await base44.entities.Prospect.update(prospect.id, {
          historico_comentarios: [
            ...historico,
            {
              conteudo: `[Qualificação] ${data.observacao}`,
              autor_email: user.email,
              autor_nome: user.full_name,
              data: new Date().toISOString(),
              tipo_autor: 'sdr'
            }
          ]
        });
      }

      // Se qualificado, notificar AE
      if (data.novo_status === 'qualificado') {
        await base44.functions.invoke('notifyAeOnQualifiedProspect', { prospect_id: prospect.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      queryClient.invalidateQueries(['prospectsConvertidosHoje']);
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Qualificar Prospect</h2>
            <p className="text-sm text-gray-500">{prospect?.nome_empresa}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Novo status</label>
            <Select value={form.novo_status} onValueChange={(v) => setForm({ ...form, novo_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="qualificado">✅ Qualificado (SQL)</SelectItem>
                <SelectItem value="em_contato">📞 Em contato</SelectItem>
                <SelectItem value="descartado">❌ Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
            <Textarea
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              placeholder="Descreva o resultado da qualificação..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  );
}