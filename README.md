# Agenda CER4

Sistema de agendamentos para clínica multidisciplinar com painel administrativo
e tela de visualização ao vivo. Construído com **Next.js 15 (App Router)**,
**TypeScript**, **Tailwind + shadcn/ui**, **Supabase (Auth + Postgres + Realtime)**
e pronto para deploy na **Vercel**.

## Recursos

- Login único de administrador (Supabase Auth)
- CRUD de profissionais (com cor, especialidade, sala, duração padrão)
- CRUD de pacientes com **SPP único** (número de prontuário)
- Disponibilidade semanal por profissional + bloqueios fixos/pontuais
- Agenda diária com criação rápida via drawer e validação de conflitos
  (na aplicação **e** no banco via constraint GiST)
- Tela `/admin/ao-vivo` com **Supabase Realtime**, modo TV, tema claro/escuro,
  fullscreen, indicador de conexão e destaque do horário atual
- Auditoria automática de criação/edição/exclusão de agendamentos
- Exibição **SPP — Nome Sobrenome** do paciente em todas as telas

## Stack

| Camada       | Tecnologia                                  |
| ------------ | ------------------------------------------- |
| Frontend     | Next.js 15 (App Router), React 19, TS       |
| Estilo       | Tailwind CSS + tokens semânticos shadcn-like|
| Formulários  | React Hook Form + Zod                       |
| Banco        | Supabase Postgres (RLS + GiST + triggers)   |
| Auth         | Supabase Auth (e-mail/senha)                |
| Realtime     | Supabase Realtime (postgres_changes)        |
| Datas        | date-fns + locale `pt-BR`                   |
| Ícones       | Lucide React                                |
| Toasts       | Sonner                                      |

## Estrutura

```
src/
  app/
    layout.tsx, page.tsx, globals.css
    login/page.tsx
    admin/
      layout.tsx (sidebar + auth guard)
      page.tsx                        # Dashboard
      agenda/                         # Agenda diária
      profissionais/                  # CRUD + disponibilidade
      pacientes/                      # CRUD com SPP
      bloqueios/                      # Visão consolidada
      ao-vivo/                        # Tela TV com Realtime
      configuracoes/
  components/
    ui/        # button, input, dialog, select, card, badge...
    admin/     # sidebar, page-header, formulários
    agenda/    # day-grid, appointment-drawer
    ao-vivo/   # live-grid, useRealtimeAgenda
  lib/
    supabase/  # client.ts, server.ts, middleware.ts
    auth/guard.ts
    validators/  # Zod (professional, patient, availability, appointment)
    utils/       # cn, dates
    constants/   # status
  services/
    professionals/, patients/, availability/, appointments/  (Server Actions)
  types/database.ts
  middleware.ts
supabase/
  migrations/
    0001_init.sql            # tabelas, índices, EXCLUDE constraint GiST
    0002_rls.sql             # Row Level Security (admin only)
    0003_triggers_audit.sql  # updated_at + audit log
  seed.sql                   # 5 profissionais, 8 pacientes, 1 dia de exemplos
  seed_admin.sql             # bootstrap do admin via psql
```

## Setup local

### 1. Pré-requisitos

- Node.js 20+
- Conta Supabase (free tier serve)
- (Opcional) Supabase CLI para aplicar migrations

### 2. Clone e instale

```bash
git clone <repo-url>
cd agendaCER4
npm install
cp .env.example .env.local
```

Preencha o `.env.local` com as chaves do projeto Supabase.

### 3. Aplicar migrations

**Via Supabase Dashboard (mais simples):**

1. Acesse o SQL Editor do projeto
2. Cole e execute, em ordem:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_triggers_audit.sql`
3. (Opcional) Execute `supabase/seed.sql` para dados de exemplo

**Via Supabase CLI:**

```bash
supabase link --project-ref <ref>
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql   # opcional
```

### 4. Criar o administrador inicial

Use o helper SQL com privilégios de service role (ou rode no SQL Editor
substituindo as variáveis):

```bash
psql "$SUPABASE_DB_URL" \
  -v admin_email="'admin@cer4.local'" \
  -v admin_password="'ChangeMe!2026'" \
  -v admin_name="'Administrador CER4'" \
  -f supabase/seed_admin.sql
```

> Esse script cria o usuário em `auth.users` (com hash bcrypt) e o registro
> correspondente em `public.admin_users`. **Troque a senha após o primeiro login.**

### 5. Rodar

```bash
npm run dev
```

Abra http://localhost:3000 — você será redirecionado para `/login`.

## Deploy na Vercel via GitHub

### 1. Subir o projeto para o GitHub

```bash
git remote add origin git@github.com:<sua-org>/agenda-cer4.git
git push -u origin main
```

> O repositório local já vem inicializado com o commit inicial.

### 2. Importar na Vercel

1. https://vercel.com/new → Import Git Repository
2. Framework: **Next.js** (auto-detectado)
3. Root Directory: `./` (ou subpasta `agendaCER4` se importado de mono-repo)
4. Adicione as variáveis de ambiente:

| Variável                          | Valor                              |
| --------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | URL do projeto Supabase            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | anon key                           |
| `SUPABASE_SERVICE_ROLE_KEY`       | service role key                   |
| `NEXT_PUBLIC_APP_NAME`            | `Agenda CER4`                      |
| `NEXT_PUBLIC_TIMEZONE`            | `America/Sao_Paulo`                |

5. Deploy.

### 3. Habilitar Realtime no Supabase

No painel Supabase: **Database → Replication → supabase_realtime** → marque
as tabelas `appointments` e `professional_blocks`.

## Meilisearch (busca de pacientes)

A partir desta versão, a busca inline de pacientes não bate mais
direto no SIGH a cada caractere — em vez disso, consulta um índice
**Meilisearch** local (sub-segundo, tolerante a typos). O SIGH é lido
periodicamente em batch para reabastecer esse índice.

### Subir o container

```bash
docker compose up -d
docker compose logs -f meilisearch   # acompanha boot
```

Confirme em http://localhost:7700 (deve responder `{"status":"available"}` em `/health`).

### Primeira sincronização (manual)

```bash
curl -X POST http://localhost:3000/api/cron/sync-patients \
  -H "Authorization: Bearer $CRON_SECRET"
```

A resposta traz `count`, `durationMs` e `taskUid` do Meilisearch.

### Sync periódica (crontab)

Edite o `crontab -e` na máquina e adicione (a cada 15 minutos):

```cron
*/15 * * * * curl -fsS -X POST http://localhost:3000/api/cron/sync-patients \
  -H "Authorization: Bearer SUA_CRON_SECRET" >/var/log/agenda-cer4-sync.log 2>&1
```

> Outras frequências comuns: `0 * * * *` (a cada hora) ou `0 4 * * *` (madrugada).

### Inspecionar índice

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/sync-patients
# → { "ok": true, "numberOfDocuments": 12345, "isIndexing": false }
```

### Variáveis de ambiente

```env
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=...     # mínimo 16 chars, obrigatório
MEILI_PATIENTS_INDEX=patients
CRON_SECRET=...          # protege /api/cron/*
```

## Comandos úteis

```bash
npm run dev         # dev server
npm run build       # build de produção
npm run start       # start em produção
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
```

## Decisões de arquitetura

- **Tela ao vivo dentro do admin** — exige login. A subscription Realtime
  roda no cliente autenticado, respeitando RLS automaticamente.
- **Constraint GiST `tstzrange`** em `appointments` impede sobreposição mesmo
  sob race conditions, complementando a validação na Server Action.
- **Soft delete de profissionais** (`is_active = false`) preserva o histórico
  de agendamentos.
- **SPP obrigatório e único** em `patients`, exibido sempre junto com o nome
  para identificação rápida na recepção.
- **RLS unificado**: apenas usuários presentes em `admin_users` (helper
  `public.is_admin()`) têm CRUD. Não há acesso anônimo.
- **Auditoria automática** via trigger em `appointments` → grava
  insert/update/delete em `appointment_audit_logs` com `previous_data`,
  `new_data` e `performed_by`.

## Próximos passos sugeridos

- Visão semanal da agenda (estrutura já preparada)
- Múltiplos administradores (UI de gestão)
- Exportação CSV / impressão da agenda do dia
- Notificações por WhatsApp/SMS antes do atendimento
- App mobile leve para profissionais consultarem a própria agenda
