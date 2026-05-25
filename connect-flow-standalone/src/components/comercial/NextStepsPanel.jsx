import React, { useState } from 'react';
import { Lightbulb, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function NextStepsPanel({ prospectId }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('suggestNextSteps', {
        prospect_id: prospectId
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (prioridade) => {
    const colors = {
      'Alta': 'text-red-600 bg-red-50',
      'Média': 'text-yellow-600 bg-yellow-50',
      'Baixa': 'text-blue-600 bg-blue-50'
    };
    return colors[prioridade] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Próximos Passos Sugeridos</h3>
        </div>
        <Button
          onClick={loadSuggestions}
          disabled={loading}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            'Gerar Sugestões ✨'
          )}
        </Button>
      </div>

      {suggestions && (
        <div className="space-y-3">
          {suggestions.days_since_last_contact !== null && (
            <div className="text-sm text-gray-600 flex items-center gap-2 mb-3 bg-white/50 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4" />
              Último contato há {suggestions.days_since_last_contact} dias
            </div>
          )}

          {suggestions.suggestions?.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-gray-900 flex-1">{step.acao}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(step.prioridade)}`}>
                  {step.prioridade}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{step.razao}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Prazo sugerido: {step.prazo_dias} {step.prazo_dias === 1 ? 'dia' : 'dias'}
              </div>
            </div>
          ))}
        </div>
      )}

      {!suggestions && !loading && (
        <div className="text-center py-6 text-gray-400">
          <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Clique para gerar sugestões inteligentes</p>
        </div>
      )}
    </div>
  );
}