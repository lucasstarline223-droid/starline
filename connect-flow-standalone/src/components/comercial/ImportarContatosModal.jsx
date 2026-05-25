import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const CONTACT_FIELDS = [
  { key: 'nome', label: 'Nome *' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'email', label: 'E-mail' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'principal', label: 'Contato Principal (sim/não)' },
  { key: 'client_id', label: 'Client ID (vínculo com cliente)' },
];

function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
    } else { current += ch; }
  }
  if (current.trim()) lines.push(current);

  const parseRow = (row) => {
    const cols = [];
    let col = '';
    let inQ = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cols.push(col.trim()); col = ''; }
      else { col += c; }
    }
    cols.push(col.trim());
    return cols;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(line => {
    const vals = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

const KNOWN_MAPPINGS = {
  'nome': 'nome',
  'nomecompleto': 'nome',
  'nomecontato': 'nome',
  'cargo': 'cargo',
  'funcao': 'cargo',
  'função': 'cargo',
  'telefone': 'telefone',
  'telefonecontato': 'telefone',
  'celular': 'telefone',
  'fone': 'telefone',
  'email': 'email',
  'emailcontato': 'email',
  'emai': 'email',
  'empresa': 'empresa',
  'nomeempresa': 'empresa',
  'principal': 'principal',
  'contatoprincipal': 'principal',
  'clientid': 'client_id',
  'client_id': 'client_id',
};

export default function ImportarContatosModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [columnMap, setColumnMap] = useState({});
  const [importMode, setImportMode] = useState('append');
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const text = await f.text();
    const parsed = parseCSV(text);
    setCsvData(parsed);

    const autoMap = {};
    parsed.headers.forEach(h => {
      const normalized = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedKey = KNOWN_MAPPINGS[normalized];
      if (matchedKey) {
        autoMap[matchedKey] = h;
        return;
      }
      const fieldMatch = CONTACT_FIELDS.find(field =>
        field.key === normalized ||
        field.label.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\*/g, '') === normalized
      );
      if (fieldMatch) autoMap[fieldMatch.key] = h;
    });
    setColumnMap(autoMap);
    setStep('options');
  };

  const handleImport = async () => {
    setStep('importing');
    setError(null);
    setProgress({ imported: 0, failed: 0, total: csvData.rows.length });

    const file_url = URL.createObjectURL(file);

    const BATCH_SIZE = 50;
    let batchStart = 0;
    let totalImported = 0;
    let totalFailed = 0;
    let isFirst = true;

    while (true) {
      const res = await base44.functions.invoke('importarContatos', {
        file_url,
        column_map: columnMap,
        replace_all: isFirst && importMode === 'replace',
        batch_start: batchStart,
        batch_size: BATCH_SIZE,
      });

      const data = res.data;
      totalImported += data.imported;
      totalFailed += data.failed;
      setProgress({ imported: totalImported, failed: totalFailed, total: data.total });
      isFirst = false;

      if (!data.has_more) break;
      batchStart = data.batch_end;
    }

    setResult({ imported: totalImported, failed: totalFailed });
    setStep('done');
  };

  const previewRows = csvData?.rows.slice(0, 3) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {step !== 'upload' && step !== 'importing' && step !== 'done' && (
              <button onClick={() => setStep(step === 'mapping' ? 'options' : 'upload')} className="p-1 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900">Importar Contatos</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload */}
          {step === 'upload' && (
            <div>
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Clique para selecionar um arquivo CSV</p>
                <p className="text-sm text-gray-400 mt-1">Formato: .csv</p>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          )}

          {/* Options + Mapping */}
          {step === 'options' && csvData && (
            <>
              <div>
                <p className="text-sm text-gray-500 mb-2">Arquivo: <span className="font-medium text-gray-700">{file?.name}</span> — <span className="font-medium">{csvData.rows.length}</span> registros encontrados</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setImportMode('append')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${importMode === 'append' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <p className="font-semibold text-gray-800 text-sm">Adicionar</p>
                  <p className="text-xs text-gray-500 mt-1">Mantém os contatos existentes e adiciona os novos do CSV</p>
                </div>
                <div
                  onClick={() => setImportMode('replace')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${importMode === 'replace' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <p className="font-semibold text-gray-800 text-sm">⚠️ Substituir</p>
                  <p className="text-xs text-gray-500 mt-1">Remove todos os contatos existentes e reimporta do CSV</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">Mapeamento de colunas</p>
                <p className="text-sm text-gray-500 mb-4">Associe as colunas do CSV com os campos do sistema</p>
                <div className="space-y-3">
                  {CONTACT_FIELDS.map(field => (
                    <div key={field.key} className="flex items-center gap-4">
                      <span className="w-52 text-sm text-gray-700 flex-shrink-0">{field.label}</span>
                      <Select value={columnMap[field.key] || '__none__'} onValueChange={val => setColumnMap(prev => ({ ...prev, [field.key]: val === '__none__' ? undefined : val }))}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="— Não importar —" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Não importar —</SelectItem>
                          {csvData.headers.map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {previewRows.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-800 mb-2 text-sm">Pré-visualização (3 primeiros registros)</p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="text-xs w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {csvData.headers.map(h => <th key={h} className="px-3 py-2 text-left text-gray-600 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            {csvData.headers.map(h => <td key={h} className="px-3 py-2 text-gray-700 truncate max-w-[150px]">{row[h]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Importing */}
          {step === 'importing' && progress && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
              <p className="text-gray-700 font-medium">Importando contatos...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((progress.imported + progress.failed) / progress.total * 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{progress.imported + progress.failed} de {progress.total} registros processados</p>
            </div>
          )}

          {/* Done */}
          {step === 'done' && result && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
              <p className="text-xl font-semibold text-gray-800">Importação concluída!</p>
              <div className="flex justify-center gap-8 text-sm">
                <div><p className="text-3xl font-bold text-green-600">{result.imported}</p><p className="text-gray-500">importados</p></div>
                {result.failed > 0 && <div><p className="text-3xl font-bold text-red-500">{result.failed}</p><p className="text-gray-500">falhas</p></div>}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {step === 'options' && (
            <Button onClick={handleImport} disabled={!columnMap.nome}>
              Importar Contatos →
            </Button>
          )}
          {step === 'done' && (
            <Button onClick={() => { onSuccess?.(); onClose(); }}>
              Concluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}