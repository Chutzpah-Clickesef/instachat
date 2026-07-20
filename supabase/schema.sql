-- ==========================================================================
-- InstaChat — schema do banco (Supabase / Postgres)
--
-- Como usar: no painel do Supabase, abra SQL Editor > New query, cole TUDO
-- isto e clique em Run. Pode rodar de novo sem medo (é idempotente).
--
-- Segurança: RLS LIGADO e SEM POLÍTICAS em todas as tabelas. Isso bloqueia
-- qualquer acesso via chave pública (anon). Só o servidor, usando a
-- service_role key, enxerga os dados.
-- ==========================================================================

create extension if not exists pgcrypto;      -- gen_random_uuid()

-- --------------------------------------------------------------------------
-- config: 1 única linha, guarda a conexão com o Instagram
-- --------------------------------------------------------------------------
create table if not exists config (
  id                  int primary key default 1 check (id = 1),
  ig_user_id          text,
  username            text,
  name                text,
  profile_picture_url text,
  access_token        text,
  token_expires_at    timestamptz,
  updated_at          timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- automations: cada regra "palavra-chave -> DM"
-- --------------------------------------------------------------------------
create table if not exists automations (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  active               boolean not null default true,

  -- gatilhos
  trigger_comment      boolean not null default true,
  trigger_story        boolean not null default false,
  trigger_dm           boolean not null default false,

  -- casamento de palavra-chave
  keywords             text[] not null default '{}',
  match_type           text not null default 'contains'
                         check (match_type in ('contains','exact','any')),
  media_id             text,               -- post específico (null = qualquer post)

  -- resposta pública no comentário (sorteia entre as variações)
  public_replies       text[] not null default '{}',

  -- DM de boas-vindas + botão de resposta rápida
  welcome_message      text,
  quick_reply_label    text,

  -- DM com o link (enviada depois que a pessoa toca no botão)
  link_message         text,
  link_button_label    text,
  link_url             text,

  -- lembrete (dispara por tempo, já que não dá pra saber se clicou)
  reminder_message     text,
  reminder_delay_seconds int not null default 0,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- followups: sequência de envio DERIVADA de cada automação
-- (regenerada toda vez que a automação é salva)
-- --------------------------------------------------------------------------
create table if not exists followups (
  id             uuid primary key default gen_random_uuid(),
  automation_id  uuid not null references automations(id) on delete cascade,
  position       int not null,               -- ordem na sequência (0,1,2...)
  delay_seconds  int not null default 0,     -- atraso após abrir a janela 24h
  label          text,                       -- 'link' | 'lembrete' (só p/ humano)
  message        jsonb not null,             -- payload pronto p/ a API
  created_at     timestamptz not null default now()
);
create index if not exists followups_automation_idx
  on followups (automation_id, position);

-- --------------------------------------------------------------------------
-- contacts: quem já falou com a gente
-- --------------------------------------------------------------------------
create table if not exists contacts (
  ig_user_id          text primary key,      -- id do Instagram da pessoa (único)
  username            text,
  first_contact_at    timestamptz not null default now(),
  last_inbound_at     timestamptz,           -- última resposta (abre janela 24h)
  last_automation_id  uuid references automations(id) on delete set null,
  updated_at          timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- queue: fila de envio com trava atômica
-- --------------------------------------------------------------------------
create table if not exists queue (
  id                    uuid primary key default gen_random_uuid(),
  status                text not null default 'pending'
                          check (status in ('pending','sending','sent','failed','skipped')),
  claimed_at            timestamptz,          -- quando um worker travou esta linha
  run_at                timestamptz not null default now(),  -- só envia a partir daqui

  recipient             jsonb not null,       -- {comment_id:...} ou {id:...}
  message               jsonb not null,       -- payload da mensagem
  kind                  text not null
                          check (kind in ('private_reply','public_reply','welcome_dm','followup')),

  automation_id         uuid references automations(id) on delete set null,
  contact_ig_id         text,
  comment_id            text,                 -- p/ dedupe de resposta privada

  -- controle da janela de 24h: se true, só envia se o contato estiver dentro
  requires_open_window  boolean not null default false,

  attempts              int not null default 0,
  last_error            text,
  dedupe_key            text,                 -- evita enfileirar o mesmo evento 2x

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Não enfileirar duas respostas privadas para o mesmo comentário.
create unique index if not exists queue_private_reply_once
  on queue (comment_id) where kind = 'private_reply';

-- Dedupe geral por chave (quando informada).
create unique index if not exists queue_dedupe_key_once
  on queue (dedupe_key) where dedupe_key is not null;

-- Índice do worker: pega os prontos primeiro.
create index if not exists queue_ready_idx
  on queue (status, run_at) where status = 'pending';

-- --------------------------------------------------------------------------
-- events: log cru de tudo que chega (auditoria/depuração)
-- --------------------------------------------------------------------------
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  type        text,                            -- ex: 'comments', 'messages'
  ig_user_id  text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists events_created_idx on events (created_at desc);

-- --------------------------------------------------------------------------
-- claim_queue: trava atômica. Marca até N itens prontos como 'sending' e os
-- devolve. FOR UPDATE SKIP LOCKED garante que dois workers nunca peguem o
-- mesmo item — é o que impede envio em dobro.
-- --------------------------------------------------------------------------
create or replace function claim_queue(batch_size int)
returns setof queue
language sql
as $$
  update queue
  set status = 'sending', claimed_at = now(), updated_at = now()
  where id in (
    select id from queue
    where status = 'pending' and run_at <= now()
    order by run_at
    for update skip locked
    limit batch_size
  )
  returning *;
$$;

-- --------------------------------------------------------------------------
-- requeue_stale: se um worker morreu no meio (item preso em 'sending' há mais
-- de 5 min), devolve pra fila. Rodamos no começo de cada drenagem.
-- --------------------------------------------------------------------------
create or replace function requeue_stale()
returns void
language sql
as $$
  update queue
  set status = 'pending', claimed_at = null, updated_at = now()
  where status = 'sending' and claimed_at < now() - interval '5 minutes';
$$;

-- --------------------------------------------------------------------------
-- Permissões: como desligamos "expose new tables", precisamos conceder acesso
-- explicitamente à service_role (a role do servidor). anon/authenticated
-- continuam SEM nenhum grant -> não leem nada, mesmo com a Data API ligada.
-- --------------------------------------------------------------------------
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

-- --------------------------------------------------------------------------
-- RLS: ligar em todas, sem políticas -> acesso só pela service_role.
-- --------------------------------------------------------------------------
alter table config      enable row level security;
alter table automations enable row level security;
alter table followups   enable row level security;
alter table contacts    enable row level security;
alter table queue       enable row level security;
alter table events      enable row level security;

-- Semente da linha única de config.
insert into config (id) values (1) on conflict (id) do nothing;
