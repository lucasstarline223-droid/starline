# ConnectFlow CRM — Versão Standalone

CRM completo exportado do Base44, agora funcionando de forma independente com dados armazenados localmente (localStorage).

---

## 🚀 Como rodar localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- npm (vem junto com o Node.js)

### Passo a passo

```bash
# 1. Entre na pasta do projeto
cd connect-flow-crm

# 2. Instale as dependências
npm install

# 3. Rode o servidor de desenvolvimento
npm run dev
```

Acesse em: **http://localhost:5173**

---

## 🔐 Login padrão

| Campo | Valor |
|-------|-------|
| E-mail | `admin@connectflow.com` |
| Senha | `admin123` |

---

## 🏗️ Build para produção

```bash
npm run build
```

Os arquivos gerados ficam na pasta `dist/`. Você pode hospedar em qualquer servidor estático:
- **Netlify**: arraste a pasta `dist/` no painel
- **Vercel**: `vercel --prod`
- **GitHub Pages**: use a pasta `dist/`
- **Servidor próprio**: sirva a pasta `dist/` com nginx/apache

> ⚠️ Para subir em produção com React Router, configure o servidor para redirecionar todas as rotas para `index.html`.

---

## 💾 Armazenamento de dados

Esta versão usa **localStorage** do navegador como banco de dados. Os dados ficam salvos no próprio navegador. Não há sincronização entre dispositivos.

Todos os dados são armazenados com o prefixo `cfcrm_` no localStorage.

---

## 📁 Estrutura do projeto

```
src/
├── api/
│   ├── base44Client.js     # Ponte para implementação local
│   └── localDb.js          # Banco de dados localStorage (substitui @base44/sdk)
├── components/             # Componentes React
├── pages/                  # Páginas da aplicação
├── lib/
│   ├── AuthContext.jsx      # Autenticação local
│   └── ...
└── ...
```

---

## ⚙️ Funcionalidades disponíveis

- ✅ Dashboard
- ✅ Clientes (CRUD completo)
- ✅ Leads e Prospectos
- ✅ Oportunidades (Kanban)
- ✅ Chamados de suporte
- ✅ Portabilidade
- ✅ Handoff / Ativação
- ✅ Cancelamentos
- ✅ Contratos
- ✅ Números DID
- ✅ Fornecedores
- ✅ Produtos/SKUs e Planos
- ✅ SDR Dashboard
- ✅ Cobrança/Dunning
- ✅ Gestão de usuários

## ⚠️ Funções não disponíveis no modo standalone

- Envio de e-mails automáticos
- Upload de arquivos para nuvem (usa URL local temporária)
- Sincronização com APIs externas (DID, Maps, etc.)
- Notificações push

