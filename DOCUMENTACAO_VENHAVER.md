# 🛒 Sistema Gestão Venha Ver

## 1. Descrição Geral do Projeto
O **Gestão Venha Ver** é um sistema completo e integrado de gestão comercial, projetado especificamente para o Mercadinho Venha Ver. O sistema possui versões web (para operações de retaguarda, cadastro e relatórios) e uma interface de Ponto de Venda (PDV) otimizada para Desktop/Tablet, focada em velocidade de atendimento no balcão. Seu principal objetivo é centralizar frente de caixa, estoque, financeiro e controle operacional em uma única plataforma, reduzindo erros, agilizando processos e oferecendo clareza financeira para o proprietário.

Visando um uso prático mesmo por pessoas com pouca experiência técnica, a plataforma contará com uma **interface moderna, responsiva, com botões grandes e navegação intuitiva**.

---

## 2. Lista Completa de Funcionalidades

### 1️⃣ Dashboard Gerencial
- Resumo de Vendas (Diário, Semanal e Mensal).
- Faturamento e Lucro Estimado em tempo real.
- Top 10 Produtos Mais Vendidos.
- Alertas de Estoque Baixo / Reposição.
- Resumo Financeiro: Contas a Pagar (próximas ao vencimento) e Contas a Receber pendientes.
- Gráficos de Fluxo de Caixa Diário.

### 2️⃣ PDV (Ponto de Venda)
- Interface de venda em tela cheia com grandes botões.
- Busca por código de barras, código interno ou nome do produto.
- Carrinho de compras com edição rápida de quantidade.
- Sangria (retirada) e Suprimento (entrada) de caixa.
- Múltiplas formas de pagamento: Dinheiro, Pix, Débito, Crédito e Fiado.
- Aplicação de descontos e acréscimos ao total.
- Cancelamento de venda (requer senha de Gerente/Admin).
- Fechamento de venda com emissão de comprovante em impressora térmica (via WebUSB/Bluetooth ou Print Spooler).
- Abertura e fechamento diário de caixa.

### 3️⃣ Controle de Estoque
- Registro de Entrada e Saída.
- Ajustes Manuais para correções de balanço e avarias.
- Módulo de Inventário (contagem periódica).
- Movimentação por produto e Histórico detalhado.
- Métricas: Custo Médio, Margem de Lucro Bruta e Alertas de Estoque Mínimo.
- Suporte a vendas fracionadas (Kg, Litro) ou unitárias/pacote.

### 4️⃣ Cadastro de Produtos
- Campos: Nome, Código Interno, Código de Barras, Categoria, Marca, Unidade de Medida, Preço de Custo, Preço de Venda, Margem de Lucro (% e R$), Estoque Atual, Estoque Mínimo, Validade (opcional), Descrição, Status e Imagem.

### 5️⃣ Cadastro de Fornecedores
- Campos: Razão Social, Nome Fantasia, CNPJ/CPF, Telefone, WhatsApp, E-mail, Endereço, Contato responsável e Observações. Histórico de compras vinculado ao fornecedor.

### 6️⃣ Contas a Pagar
- Agendamento de despesas fixas (Luz, Água, Aluguel) e variáveis (Estoque).
- Campos: Descrição, Categoria, Fornecedor Vinculado, Valor, Vencimento, Data de Pagamento, Status (Pendente/Pago/Vencido).

### 7️⃣ Contas a Receber & Fiados
- Controle de receitas pendentes e vendas a prazo (Fiado).
- Histórico de pagamentos parciais (abatimentos).
- Baixa no sistema quando o cliente acertar a conta.

### 8️⃣ Cadastro de Clientes
- Campos: Nome, CPF/CNPJ, Telefone, WhatsApp, Endereço, Data de Nascimento, ***Limite de Crédito para Fiado*** e Histórico de Compras e Pagamentos.

### 9️⃣ Controle de Caixa (Tesouraria)
- Rotina de conciliação de caixa diária.
- Saldo inicial, registro de Vendas e outras Entradas.
- Saídas (Troco, Sangrias, Pagamentos emergenciais no caixa).
- Resumo por forma de pagamento e detecção de diferença/quebra de caixa no fechamento.

### 🔟 Relatórios
- Vendas por período.
- Curva ABC de Produtos (Mais Vendidos).
- Extrato de Estoque.
- Fluxo de Caixa e DRE Gerencial (Lucro Estimado).
- Relatórios detalhados por Cliente (Inadimplentes e Melhores Clientes).

### 1️⃣1️⃣ Usuários e Permissões
- Perfis de acesso baseado no modelo RBAC (Role-Based Access Control).
- Perfis: **Administrador, Gerente, Caixa, Estoquista**.
- Log de Auditoria: qual usuário excluiu, alterou ou autorizou operações de risco.

---

## 3. Estrutura de Menus

```text
≡ Menu Principal
 ├── 📊 Dashboard
 ├── 🛒 Ponto de Venda (PDV)
 ├── 📦 Estoque
 │    ├── Inventário
 │    └── Movimentações
 ├── 📋 Cadastros
 │    ├── Produtos
 │    ├── Categorias & Marcas
 │    ├── Clientes
 │    └── Fornecedores
 ├── 💰 Financeiro
 │    ├── Controle de Caixa
 │    ├── Contas a Pagar
 │    └── Contas a Receber
 ├── 📑 Relatórios
 └── ⚙️ Configurações
      ├── Usuários & Permissões
      └── Configurações da Loja / Impressora
```

---

## 4. Fluxo de Uso do Sistema (Dia a Dia)

1. **Abertura:** O *Caixa* ou *Gerente* inicia o expediente abrindo seu caixa e lançando o "Fundo de Troco" (Saldo Inicial).
2. **Reposição/Recepção:** O *Estoquista* recebe mercadorias, insere no sistema (Controle de Estoque/Produtos) e gera contas em "Contas a Pagar" caso seja prazo.
3. **Vendas:** O *Caixa* bipa os itens via leitor de código de barras. O cliente leva no Fiado? Ele escolhe "Fiado", seleciona o cliente cadastrado, e o valor vai automaticamente para Contas a Receber. Subtrai-se automaticamente do Estoque e atualiza-se o limite do cliente.
4. **Alerta:** Ao fim do dia, o Administrador visualiza o app/Dashboard e vê o que está "Acabando", gerando a lista de compras para segunda de manhã.
5. **Fechamento:** O *Caixa* clica em "Fechar Caixa", confere todas as maquininhas de cartão, PIX da conta e as notas físicas. Salva o registro e o Gerente imprime o relatório final do dia.

---

## 5. Modelagem do Banco de Dados (Entidades Principais)

*   `users`: id, name, email, role, password_hash, created_at
*   `products`: id, name, barcode, sku, category_id, brand_id, cost_price, sale_price, stock_qty, min_stock, unit, status
*   `categories`: id, name
*   `brands`: id, name
*   `customers`: id, name, document, phone, credit_limit, current_debt
*   `suppliers`: id, trade_name, document, phone, email
*   `sales`: id, user_id, customer_id, total_amount, discount, payment_method, status, created_at
*   `sale_items`: id, sale_id, product_id, quantity, unit_price, subtotal
*   `stock_movements`: id, product_id, user_id, type (in/out/adjust), quantity, reason, created_at
*   `cash_registers`: id, user_id, opened_at, closed_at, initial_balance, final_balance, status
*   `accounts_payable`: id, supplier_id, description, amount, due_date, paid_date, status
*   `accounts_receivable`: id, customer_id, sale_id, amount, due_date, paid_date, status

---

## 6. Telas Principais
1. **Login e Recuperação de Senha**
2. **Dashboard de Resumo Financeiro e Vendas** (Gráficos, KPIs).
3. **Ponto de Venda (PDV):** Layout dividido: Carrinho à direita e catálogo à esquerda. Campo de busca em foco no topo.
4. **Listagem e Formulário de Produtos:** Com suporte para upload de fotos.
5. **Ficha do Cliente:** Mostrando o limite de crédito e o saldo devido.
6. **Fechamento de Caixa:** Tela de conciliação modal ou separada para input de valores apurados em maquininha e gaveta.

---

## 7. Regras de Negócio Críticas
*   **Fiado (Venda a Prazo):** Só pode ser realizado se o `Cliente` estiver vinculado à venda e se o valor da compra + `current_debt` for menor ou igual ao `credit_limit`.
*   **Cancelamentos e Descontos:** Apenas os perfis `Administrador` e `Gerente` podem cancelar uma venda após ser finalizada ou dar descontos que ultrapassem XX%. O perfil `Caixa` só pode abater itens do carrinho antes do fechamento.
*   **Caixa Fechado:** Não é possível emitir Vendas Se o Usuário logado não possuir um `cash_register` aberto.
*   **Alteração de Estoque:** Não pode ser feita livremente. Devese gerar uma `stock_movement` obrigatoriamente vinculada a um motivo (venda, entrada física, avaria, validade).

---

## 8. Perfis de Usuários
*   **Administrador:** Acesso a tudo (Relatórios, alteração de permissões de Gerentes, exclusão definitiva de registros, DRE).
*   **Gerente:** Operação geral da loja, abertura e fechamento de todos os caixas, aprovação de cancelamentos de venda, entrada de notas fiscais, contas a pagar e receber. Sem acesso ao DRE completo.
*   **Caixa:** Somente módulo de Ponto de Venda. Pode abrir ou fechar seu próprio caixa, e ver "Contas a Receber" apenas na tela do Fiado para aceitar pagamentos atrasados de clientes.
*   **Estoquista:** Acesso ao Cadastro de Produtos, Fornecedores e Controle de Estoque de reposições. Sem acesso ao painel financeiro.

---

## 9. Sugestão de Stack Tecnológica
Considerando o ambiente de pequenos mercados (necessidade de agilidade e disponibilidade sem grandes custos fixos de hardware) e visando a escalabilidade do sistema.

**Frontend (Web & PDV):**
*   *Framework:* **React com Next.js** (ou Vite)
*   *Componentes / Estilização:* **Tailwind CSS + shadcn/ui** (Design System moderno, responsivo e agradável)
*   *Gerenciamento de Estado:* **Zustand** (Leve e rápido para o carrinho do PDV).
*   *PDV:* Pode ser encapsulado como **PWA** para cache e funcionamento mais rápido na máquina do balcão (ou **Electron**, se integrações complexas de impressora de rede e balança no futuro forem estritamente exigidas, porém um PWA simples com a _Web Serial API_ cobre a maioria das impressoras térmicas diretas).

**Backend:**
*   *Framework:* **Node.js com NestJS** ou **Express / Fastify** (Alta performance e grande comunidade).
*   *Banco de Dados:* **PostgreSQL** (Relacional, garante integridade financeira total).
*   *ORM:* **Prisma** (Facilidade nas migrações e modelagem rápida).
*   *Autenticação:* **JWT + Bcrypt**.

**Infraestrutura e Hospedagem (Cloud):**
*   *Frontend:* **Vercel** ou **Netlify** (Altíssima velocidade global, custo base quase zerado).
*   *Backend & BD:* **Render, Railway** ou **Supabase**. (Custo acessível, escalável, backups automatizados).

---

## 10. Sugestão de Cronograma de Desenvolvimento (Sprint Base)
A arquitetura proposta foi pensada para entregar valor de ponta a ponta desde as primeiras semanas.

*   **Meses 1-2 (MVP / Fundação):**
    *   Setup do Projeto (Front, Back, BD, Auth).
    *   Módulo Cadastro de Produtos (Categorias, Marcas) e Estoque Básico.
    *   Dashboard Base e Tabelas Principais.
*   **Mês 3 (Vendas e Frente de Loja):**
    *   PDV Operacional Completo.
    *   Suporte a Dinheiro, PIX, Cartão.
    *   Cadastro de Clientes e Módulo "Fiado".
*   **Mês 4 (Financeiro e Gestão):**
    *   Módulo Contas a Receber, Pagar e Fluxo de Caixa.
    *   Testes de Integração com Impressoras Térmicas Genéricas.
*   **Mês 5 (Polimento e Lançamento):**
    *   Relatórios, Filtros e Exportações Excel/PDF.
    *   Log de Auditoria e Refinamento do Layout Mobile (Responsividade focada em relatórios pro Dono via celular).

---

## 11. Diferenciais do Sistema
1.  **"UX Anti-Confusão":** Cores muito nítidas. O PDV terá modo tela cheia, sem barra de endereços atrapalhando, teclado acelerador ativo (F10 finaliza, F4 busca, Esc cancela).
2.  **Operação Cloud-Native:** O proprietário viaja e acompanha em tempo real o fluxo de vendas pelo celular (Dashboard Mobile Ultra Responsivo).
3.  **Gestão Descomplicada do Fiado:** Um cliente não vira um mero "número contábil". Tem sua tela simplificada para ir pagando seu saldo como se fosse um controle de "caderneta", mas seguro e blindado.

---

## 12. Ideias de Monetização ou Expansão Futura (V2.0 e além)
1.  **Cardápio / Prateleira Online:** Geração automática de um link estilo "Linktree" ou "Delivery" (`venhaver.com.br/pedir`) puxando o estoque do sistema. Clientes pedem por ali e o pedido cai direto no PDV num sininho de "Pendentes".
2.  **Integração WhatsApp API:** O sistema pode disparar cobranças educadas ou ofertas para clientes da lista.
3.  **Clube de Fidelidade:** A cada R$ 100 em compras, o cliente ganha 2 pontos para trocar por prêmios do próprio mercado (incentiva a troca do concorrente pro seu estabelecimento).
4.  **Integração com Balanças:** Extração automática de peso (exemplo: balanças Toledo/Filizola via integração desktop).
