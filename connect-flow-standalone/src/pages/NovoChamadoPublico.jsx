import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, HeadphonesIcon, Paperclip, X, Search, AlertCircle, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const initialForm = {
  nome_conta: '',
  number_problem: '',
  produto: '',
  canal_entrada: '',
  prioridade: 'Média',
  nome_solicitante: '',
  contato_resposta: '',
  descricao: '',
};

export default function NovoChamadoPublico() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successId, setSuccessId] = useState('');
  const [error, setError] = useState('');
  const [anexos, setAnexos] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [chamadoEncontrado, setChamadoEncontrado] = useState(null);
  const [activeTab, setActiveTab] = useState('novo');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingFile(true);
    for (const file of files) {
      const file_url = URL.createObjectURL(file);
      setAnexos(prev => [...prev, { url: file_url, nome: file.name, tipo: file.type }]);
    }
    setUploadingFile(false);
    e.target.value = '';
  };

  const removeAnexo = (idx) => setAnexos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nome_conta || !form.descricao || !form.nome_solicitante) {
      setError('Por favor, preencha os campos obrigatórios: Nome da Conta, Solicitante e Descrição.');
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('criarChamadoPublico', { ...form, anexos });
      setSuccessId(res.data.chamado_id);
      setSuccess(true);
    } catch (err) {
      setError('Erro ao enviar o chamado. Tente novamente.');
    }
    setLoading(false);
  };

  const handleSearchChamado = async (e) => {
    e.preventDefault();
    setSearchError('');
    setChamadoEncontrado(null);
    
    if (!searchId.trim()) {
      setSearchError('Por favor, insira o ID do chamado.');
      return;
    }

    setSearchLoading(true);
    try {
      const res = await base44.functions.invoke('consultarChamadoPublico', { chamado_id: searchId.trim() });
      setChamadoEncontrado(res.data.chamado);
    } catch (err) {
      setSearchError('Chamado não encontrado. Verifique o ID e tente novamente.');
    }
    setSearchLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Chamado Aberto!</h2>
          <p className="text-gray-500 mb-6 text-center">Seu chamado foi registrado com sucesso e já está na nossa fila de atendimento. Em breve nossa equipe entrará em contato.</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-xs font-medium text-blue-600 mb-2">ID DO SEU CHAMADO</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-blue-900 font-mono">{successId}</p>
              <button
                onClick={() => navigator.clipboard.writeText(successId)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                Copiar
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">Use este ID para pesquisar o status do seu chamado</p>
          </div>

          <Button onClick={() => { setForm(initialForm); setSuccess(false); setActiveTab('novo'); }} className="w-full">
            Abrir Novo Chamado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl">
        {/* Header */}
        <div className="bg-[#1460f5] rounded-t-2xl p-6 text-white">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <img
              src="/logo.svg"
              alt="Starline Telefonia"
              className="h-16 w-auto"
            />
          </div>
          {/* Título */}
          <div className="flex items-center gap-3 justify-center">
            <div className="bg-white/20 rounded-xl p-2">
              <HeadphonesIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Suporte - Starline Telefonia</h1>
              <p className="text-blue-100 text-xs">Abra um novo chamado ou consulte um existente</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none border-b border-gray-200 bg-gray-50">
            <TabsTrigger value="novo" className="flex-1">Novo Chamado</TabsTrigger>
            <TabsTrigger value="consultar" className="flex-1">Consultar Chamado</TabsTrigger>
          </TabsList>

          {/* Tab: Novo Chamado */}
          <TabsContent value="novo">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome da Conta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Empresa / Conta <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Ex: Empresa Exemplo Ltda"
              value={form.nome_conta}
              onChange={e => set('nome_conta', e.target.value)}
            />
          </div>

          {/* Solicitante e Contato */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seu Nome <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Nome do solicitante"
                value={form.nome_solicitante}
                onChange={e => set('nome_solicitante', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
              <Input
                placeholder="(XX) XXXXX-XXXX"
                value={form.contato_resposta}
                onChange={e => set('contato_resposta', e.target.value)}
              />
            </div>
          </div>

          {/* Produto e Canal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
              <Select value={form.produto} onValueChange={v => set('produto', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {['PABX', 'Telefonia', 'WhatsApp', 'Internet', 'DDR/DID', '0800', 'Outro'].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canal de Contato</label>
              <Select value={form.canal_entrada} onValueChange={v => set('canal_entrada', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {['WhatsApp', 'Telefone', 'E-mail', 'Portal', 'Presencial'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Número com Problema e Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número com Problema</label>
              <Input
                placeholder="Ex: 51 3762-5000"
                value={form.number_problem}
                onChange={e => set('number_problem', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <Select value={form.prioridade} onValueChange={v => set('prioridade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Baixa', 'Média', 'Alta', 'Urgente'].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do Problema <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              className="h-28 resize-none"
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
            />
          </div>

          {/* Anexos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anexos (opcional)</label>
            <label className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploadingFile ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {uploadingFile ? 'Enviando arquivo...' : 'Clique para anexar imagens ou arquivos'}
              </span>
              {uploadingFile && <Loader2 className="w-4 h-4 animate-spin text-blue-500 ml-auto" />}
              <input
                type="file"
                multiple
                className="hidden"
                disabled={uploadingFile}
                onChange={handleFileChange}
              />
            </label>
            {anexos.length > 0 && (
              <div className="mt-2 space-y-1">
                {anexos.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                    <span className="text-gray-700 truncate max-w-xs">{a.nome}</span>
                    <button type="button" onClick={() => removeAnexo(i)} className="ml-2 text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</> : 'Enviar Chamado'}
              </Button>
            </form>
          </TabsContent>

          {/* Tab: Consultar Chamado */}
          <TabsContent value="consultar">
            <div className="p-6 space-y-4">
              <form onSubmit={handleSearchChamado} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID do Chamado <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: abc123def456"
                      value={searchId}
                      onChange={e => setSearchId(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={searchLoading} className="px-6">
                      {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {searchError && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {searchError}
                  </div>
                )}
              </form>

              {chamadoEncontrado && (
                <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                  {/* Resumo do Chamado */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-medium text-blue-600 uppercase">ID</p>
                        <p className="text-lg font-mono font-bold text-blue-900">{chamadoEncontrado.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-600 mb-1">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          chamadoEncontrado.status === 'Aberto' ? 'bg-red-100 text-red-700' :
                          chamadoEncontrado.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-700' :
                          chamadoEncontrado.status === 'Resolvido' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {chamadoEncontrado.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações Gerais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Empresa</p>
                      <p className="text-sm font-semibold text-gray-800">{chamadoEncontrado.nome_conta}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Solicitante</p>
                      <p className="text-sm font-semibold text-gray-800">{chamadoEncontrado.nome_solicitante}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Produto</p>
                      <p className="text-sm text-gray-700">{chamadoEncontrado.produto || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Prioridade</p>
                      <p className="text-sm text-gray-700">{chamadoEncontrado.prioridade}</p>
                    </div>
                    {chamadoEncontrado.number_problem && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Número</p>
                        <p className="text-sm text-gray-700">{chamadoEncontrado.number_problem}</p>
                      </div>
                    )}
                    {chamadoEncontrado.contato_resposta && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Contato</p>
                        <p className="text-sm text-gray-700">{chamadoEncontrado.contato_resposta}</p>
                      </div>
                    )}
                  </div>

                  {/* Descrição */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Descrição do Problema</p>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{chamadoEncontrado.descricao}</p>
                    </div>
                  </div>

                  {/* Histórico de Ações */}
                  {chamadoEncontrado.historico_acoes && chamadoEncontrado.historico_acoes.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-3">Histórico de Atendimento</p>
                      <div className="space-y-3">
                        {chamadoEncontrado.historico_acoes.map((acao, idx) => (
                          <div key={idx} className="border-l-2 border-blue-300 pl-4 py-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs font-bold text-gray-800">{acao.nivel}</p>
                                <p className="text-xs text-gray-500 mt-1">{acao.responsavel}</p>
                              </div>
                              <p className="text-xs text-gray-400">
                                {acao.data ? format(new Date(acao.data), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '—'}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 mt-2">{acao.acao}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                      <p className="text-sm text-gray-500">Nenhuma ação registrada até o momento</p>
                    </div>
                  )}

                  {/* Anexos */}
                  {chamadoEncontrado.anexos && chamadoEncontrado.anexos.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Anexos</p>
                      <div className="space-y-1">
                        {chamadoEncontrado.anexos.map((anexo, idx) => (
                          <a
                            key={idx}
                            href={anexo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm py-1"
                          >
                            <Eye className="w-3 h-3" />
                            {anexo.nome}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data de Criação */}
                  <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                    Criado em: {format(new Date(chamadoEncontrado.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}