import React from 'react';
import { X, ClipboardList, ArrowRight, Image, FileText, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NIVEL_COLORS = {
  'N1 - Suporte': 'bg-blue-100 text-blue-700 border-blue-200',
  'N2 - Avançado': 'bg-amber-100 text-amber-700 border-amber-200',
  'N3 - Especialista': 'bg-orange-100 text-orange-700 border-orange-200',
  'Visita Presencial': 'bg-purple-100 text-purple-700 border-purple-200',
  'Encerramento': 'bg-green-100 text-green-700 border-green-200'
};

export default function HistoricoModal({ chamado, onClose }) {
  const historico = chamado.historico_acoes || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">O que foi feito</h2>
              <p className="text-sm text-gray-500">{chamado.nome_conta}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Descrição original */}
        <div className="px-5 pt-4 pb-2">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Descrição original do problema</p>
            <p className="text-sm font-semibold text-gray-800">{chamado.descricao || '—'}</p>
          </div>
        </div>

        {/* Histórico de ações */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {historico.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma ação registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historico.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  {/* linha do tempo */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                      {idx + 1}
                    </div>
                    {idx < historico.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                   <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-md">
                     <div className="flex items-center gap-2 mb-2 flex-wrap">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${NIVEL_COLORS[item.nivel] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                         {item.nivel}
                       </span>
                       {item.responsavel && (
                         <span className="text-xs text-gray-500">por <span className="font-medium text-gray-700">{item.responsavel}</span></span>
                       )}
                       {item.data && (
                         <span className="text-xs text-gray-400 ml-auto">
                           {format(new Date(item.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                         </span>
                       )}
                     </div>
                     <p className="text-sm text-gray-700">
                       {item.acao}
                     </p>
                   </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anexos */}
        {chamado.anexos?.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Anexos do Chamado</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {chamado.anexos.map((anexo, idx) => (
                <a
                  key={idx}
                  href={anexo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {anexo.tipo?.startsWith('image/') ? (
                    <Image className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  {anexo.nome}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Status atual */}
        <div className="px-5 pb-5 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Status atual:</span>
            <span className="font-semibold text-gray-800">{chamado.status}</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-gray-800">{chamado.tipo_suporte}</span>
          </div>
        </div>
      </div>
    </div>
  );
}