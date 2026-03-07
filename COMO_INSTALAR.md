# Como Instalar e Rodar o Gestão Venha Ver

## Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)

---

## 1. Instalar dependências

```bash
npm install
```

## 2. Configurar o Supabase

1. Crie um projeto em https://supabase.com
2. Copie `.env.local.example` para `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
3. Preencha as variáveis com as chaves do seu projeto Supabase

## 3. Criar o banco de dados

No painel do Supabase → **SQL Editor**, cole e execute o conteúdo de:
```
supabase/migrations/001_schema_inicial.sql
```

## 4. Criar o primeiro usuário

No painel do Supabase → **Authentication → Users** → **Invite user**

Após criar, acesse a tabela `profiles` e defina o `role` como `administrador`.

## 5. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Módulos do Sistema

| Rota | Módulo |
|------|--------|
| `/dashboard` | Dashboard gerencial |
| `/pdv` | Ponto de Venda |
| `/produtos` | Cadastro de produtos |
| `/estoque` | Controle de estoque |
| `/estoque/movimentacoes` | Entradas e saídas |
| `/clientes` | Cadastro de clientes |
| `/fornecedores` | Cadastro de fornecedores |
| `/financeiro/caixa` | Controle de caixa |
| `/financeiro/contas-pagar` | Contas a pagar |
| `/financeiro/contas-receber` | Contas a receber (fiado) |
| `/relatorios` | Relatórios gerenciais |
| `/configuracoes/loja` | Configurações da loja |
| `/configuracoes/usuarios` | Usuários e permissões |

## Stack Tecnológica

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Estado PDV**: Zustand
- **Backend/Banco**: Supabase (PostgreSQL + Auth + Storage)
- **Gráficos**: Recharts
- **Deploy**: Vercel + Supabase Cloud
