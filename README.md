# FinanAppDeep

FinanAppDeep is a professional, comprehensive SaaS application for extreme personal finance management. Unlike conventional systems that focus solely on cash flow, FinanAppDeep supports complex rules including accrual vs. cash flow views, credit card invoice matching, installment plans, and advanced debts tracking.

## Architecture

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Alembic.
- **Frontend**: Next.js 14 App Router, React, TailwindCSS, TypeScript.

### Main Features
- Autenticação e Autorização (JWT com HttpOnly Cookies)
- Gestão de Contas (Wallets)
- Gestão de Categorias e Classificações (Income, Expense, Transfer)
- Cartões de Crédito (Due dates, Closing dates, Invoices, Parcelamento)
- Gestão de Dívidas e Empréstimos (Amortização, Unpay, Juros)
- Invoices Automáticos (baseado nas datas de fechamento do cartão)
- Visão de Caixa (Settled) vs Competência (Occurred)
- UX Dinâmica e Premium

## Startup

### Backend
1. `cd backend`
2. `python -m venv .venv`
3. `source .venv/bin/activate` (or `.venv\Scripts\Activate` on Windows)
4. `pip install -r requirements.txt`
5. Configure `.env` using `.env.example`.
6. `alembic upgrade head`
7. `uvicorn app.main:app --reload`
(Or just use `docker-compose up -d`)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

Visit [http://localhost:3000](http://localhost:3000)

## Design Decisions
- Utilização de `UUID` nativo no PostgreSQL garantindo robustez na camada de dados.
- O Frontend se comunica diretamente com a API mapeando IDs e Enums de forma centralizada.
- `withCredentials = True` no Axios para passar o Cookie seguro de Refresh Token.
- Rotinas do cartão se comportam calculando a fatura baseada no dia de fechamento vs data da transação, gerando lançamentos consolidados no fechamento e parcelamentos na rota de `/installment_plans`.
