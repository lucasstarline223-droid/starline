import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const MOTIVOS = ['Sem interesse', 'Sem perfil', 'Concorrente', 'Não atendeu', 'Outro'];

export default function DescartarLeadModal({ lead, onConfirm, onCancel }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!motivo) {
      setError('Selecione o motivo do descarte');
      return;
    }
    onConfirm(motivo);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Descartar Lead</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Você está descartando <strong>{lead?.nome_empresa}</strong>. Informe o motivo:
          </p>
          <div>
            <Label>Motivo do Descarte *</Label>
            <Select value={motivo} onValueChange={(v) => { setMotivo(v); setError(''); }}>
              <SelectTrigger className={error ? 'border-red-400' : ''}>
                <SelectValue placeholder="Selecionar motivo..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={handleConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl">
            Confirmar Descarte
          </Button>
        </div>
      </div>
    </div>
  );
}