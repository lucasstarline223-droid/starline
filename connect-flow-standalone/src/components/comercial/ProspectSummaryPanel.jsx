import React, { useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function ProspectSummaryPanel({ prospectId, prospectName }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateProspectSummary', {
        prospect_id: prospectId
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadSummary = () => {
    if (!summary) return;
    
    const text = `RESUMO EXECUTIVO - ${prospectName}\n\nGerado em: ${new Date(summary.generated_at).toLocaleString('pt-BR')}\n\n${summary.summary}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumo-${prospectName.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-4 border border-green-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Resumo para Reunião com AE</h3>
        </div>
        <div className="flex gap-2">
          {summary && (
            <Button
              onClick={downloadSummary}
              size="sm"
              variant="outline"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={loadSummary}
            disabled={loading}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Resumo 📄'
            )}
          </Button>
        </div>
      </div>

      {summary && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-[500px] overflow-y-auto">
          <ReactMarkdown className="prose prose-sm max-w-none">
            {summary.summary}
          </ReactMarkdown>
          <div className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-200">
            Gerado em: {new Date(summary.generated_at).toLocaleString('pt-BR')}
          </div>
        </div>
      )}

      {!summary && !loading && (
        <div className="text-center py-6 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Clique para gerar resumo executivo</p>
          <p className="text-xs">Ideal para preparar reuniões com AEs</p>
        </div>
      )}
    </div>
  );
}