import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, Loader2, ChevronRight, Trash2, PlusCircle, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Parse CSV text into array of objects
function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  let i = 1;
  while (i < lines.length) {
    let line = lines[i].trim();
    if (!line) { i++; continue; }
    while ((line.match(/"/g) || []).length % 2 !== 0 && i + 1 < lines.length) {
      i++;
      line += '\n' + lines[i].trim();
    }
    const values = parseCSVLine(line);
    const record = {};
    headers.forEach((h, idx) => { record[h] = values[idx] !== undefined ? values[idx] : ''; });
    rows.push(record);
    i++;
  }
  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

const DID_FIELDS = [
  { key: 'numero', label: 'Número (DID)' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'status', label: 'Status' },
  { key: 'operadora', label: 'Operadora' },
  { key: 'pj_ou_pf', label: 'PJ/PF' },
  { key: 'preco_mensal_unitario', label: 'Preço Mensal' },
  { key: 'endereco_telefonico', label: 'Endereço Telefônico' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'data_ativacao', label: 'Data de Ativação' },
  { key: 'observacoes', label: 'Observações' },
];

const STEPS = ['upload', 'options', 'preview', 'importing', 'done'];

export default function ImportarNumerosDIDModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState('upload'); // upload | options | preview | importing | done
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null); // { headers, rows }
  const [importMode, setImportMode] = useState('append'); // append | replace
  const [columnMap, setColumnMap] = useState({}); // { did_field: csv_column }
  const [progress, setProgress] = useState({ current: 0, total: 0, created: 0, failed: 0 });
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const text = await f.text();
    const parsed = parseCSV(text);
    setCsvData(parsed);

    // Auto-map known columns
    const autoMap = {};
    const knownMappings = {
      'Task Name': 'numero',
      'Número': 'numero',
      'Status Number  (drop down)': 'status',
      'Status': 'status',
      'Tipo de Numero (drop down)': 'tipo',
      'Fornecedor Atual (drop down)': 'operadora',
      'PF/PJ Number (drop down)': 'pj_ou_pf',
      'Custo_Recorrente_DID/DDR_Moeda (currency)': 'preco_mensal_unitario',
      'Endereço Telefônico  (phone)': 'endereco_telefonico',
    };
    parsed.headers.forEach(h => {
      if (knownMappings[h]) autoMap[knownMappings[h]] = h;
    });
    setColumnMap(autoMap);
    setStep('options');
  };

  const handleStartImport = async () => {
    setStep('importing');
    setProgress({ current: 0, total: 0, created: 0, failed: 0 });

    const file_url = URL.createObjectURL(file);

    let offset = 0;
    const batchSize = 80;
    let totalCreated = 0;
    let totalFailed = 0;
    let totalRows = 0;
    let totalByStatus = {};
    let done = false;

    while (!done) {
      const resp = await base44.functions.invoke('importarNumerosDID', {
        csv_url: file_url,
        batch_offset: offset,
        batch_size: batchSize,
        delete_all: importMode === 'replace' && offset === 0,
        column_map: columnMap,
      });
      const data = resp.data;
      totalRows = data.total_rows;
      totalCreated += data.created;
      totalFailed += data.failed;
      totalByStatus = data.total_by_status_in_csv || {};
      done = data.done;
      offset = data.next_offset;
      setProgress({ current: Math.min(offset, totalRows), total: totalRows, created: totalCreated, failed: totalFailed });
    }

    setResult({ totalCreated, totalFailed, totalRows, totalByStatus });
    setStep('done');
    onComplete?.();
  };

  const handleClose = () => {
    setFile(null);
    setCsvData(null);
    setImportMode('append');
    setColumnMap({});
    setProgress({ current: 0, total: 0, created: 0, failed: 0 });
    setResult(null);
    setStep('upload');
    onClose();
  };

  const previewRows = csvData?.rows?.slice(0, 5) || [];
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {(step === 'options' || step === 'preview') && (
              <button
                onClick={() => setStep(step === 'preview' ? 'options' : 'upload')}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">Importar Números DID/DDR</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Clique para selecionar o arquivo CSV</p>
              <p className="text-xs text-gray-400 mt-1">Exportado do ClickUp ou outro sistema</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* STEP 2: Options + Column Mapping */}
          {step === 'options' && csvData && (
            <div className="space-y-6">
              {/* Mode Selection */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Como deseja importar?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setImportMode('append')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${importMode === 'append' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <PlusCircle className={`w-5 h-5 ${importMode === 'append' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-semibold text-sm text-gray-800">Adicionar números</span>
                    </div>
                    <p className="text-xs text-gray-500">Mantém os números existentes e adiciona os novos do CSV</p>
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${importMode === 'replace' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Trash2 className={`w-5 h-5 ${importMode === 'replace' ? 'text-red-600' : 'text-gray-400'}`} />
                      <span className="font-semibold text-sm text-gray-800">Deletar e reimportar</span>
                    </div>
                    <p className="text-xs text-gray-500">⚠️ Remove todos os números existentes e reimporta do CSV</p>
                  </button>
                </div>
              </div>

              {/* Column Mapping */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Mapeamento de colunas</p>
                <p className="text-xs text-gray-500 mb-3">Associe as colunas do CSV com os campos do sistema</p>
                <div className="space-y-2">
                  {DID_FIELDS.map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-44 flex-shrink-0">{field.label}</span>
                      <Select
                        value={columnMap[field.key] || '__none__'}
                        onValueChange={(val) => {
                          setColumnMap(prev => {
                            const next = { ...prev };
                            if (val === '__none__') delete next[field.key];
                            else next[field.key] = val;
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1 text-sm">
                          <SelectValue placeholder="Não importar" />
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
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 'preview' && csvData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                <span>Pré-visualização — primeiras {previewRows.length} de {csvData.rows.length} linhas</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {DID_FIELDS.filter(f => columnMap[f.key]).map(f => (
                        <th key={f.key} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {DID_FIELDS.filter(f => columnMap[f.key]).map(f => (
                          <td key={f.key} className="px-3 py-2 text-gray-700 max-w-[150px] truncate">
                            {row[columnMap[f.key]] || <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importMode === 'replace' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  ⚠️ <strong>Atenção:</strong> Todos os números existentes serão deletados antes de importar.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Importing */}
          {step === 'importing' && (
            <div className="space-y-4 py-6">
              <div className="flex items-center gap-3 justify-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="text-sm font-medium text-gray-700">
                  Importando... {progress.current}/{progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-500">
                {percent}% · {progress.created} criados · {progress.failed} falhos
              </p>
            </div>
          )}

          {/* STEP 5: Done */}
          {step === 'done' && result && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Importação concluída!</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total importado:</span>
                  <span className="font-bold">{result.totalCreated}</span>
                </div>
                {result.totalFailed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-500">Com erro:</span>
                    <span className="font-bold text-red-500">{result.totalFailed}</span>
                  </div>
                )}
                {Object.entries(result.totalByStatus).map(([s, count]) => (
                  <div key={s} className="flex justify-between">
                    <span className="text-gray-500">{s}:</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(step === 'options' || step === 'preview' || step === 'done') && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            {step === 'done' ? (
              <Button onClick={handleClose} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Fechar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
                {step === 'options' && (
                  <Button
                    onClick={() => setStep('preview')}
                    disabled={!columnMap['numero']}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Pré-visualizar
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
                {step === 'preview' && (
                  <Button
                    onClick={handleStartImport}
                    className={`flex-1 text-white flex items-center gap-2 ${importMode === 'replace' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {importMode === 'replace' ? <Trash2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                    {importMode === 'replace' ? 'Deletar e Importar' : 'Importar Números'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}