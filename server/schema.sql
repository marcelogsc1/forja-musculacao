-- Banco do Forja (PostgreSQL 14+; testado com PGlite e compatível com Neon/Vercel, Supabase, RDS)
-- Executado automaticamente na primeira requisição. Pode rodar quantas vezes quiser.

create table if not exists users (
  id            text primary key,                  -- 'u_' + aleatório
  email         text not null unique,              -- sempre minúsculo
  name          text not null default '',
  pass_hash     text not null,                     -- scrypt$N$r$p$sal$hash
  failed_logins int  not null default 0,
  locked_until  timestamptz,
  created_at    timestamptz not null default now()
);

-- Tokens de renovação: guardamos só o hash. Cada uso gera um novo (rotação).
create table if not exists refresh_tokens (
  id          text primary key,                    -- sha256 do token
  user_id     text not null references users(id) on delete cascade,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists refresh_tokens_user on refresh_tokens(user_id);

-- Tudo o que o usuário grava no app, um registro por item:
--   profile/me, prefs/me, routine/<id>, exercise/<id>, measurement/<AAAA-MM-DD>, media/<exercício>, session/<id>
-- rev cresce a cada gravação e permite que cada aparelho baixe só o que mudou (sincronização incremental).
create sequence if not exists records_rev;
create table if not exists records (
  user_id     text not null references users(id) on delete cascade,
  type        text not null check (type in ('profile','prefs','routine','exercise','measurement','media','session')),
  id          text not null,
  data        jsonb,                               -- null quando apagado
  deleted     boolean not null default false,      -- exclusão lógica: avisa os outros aparelhos
  updated_at  timestamptz not null,                -- horário da alteração no aparelho (última escrita vence)
  rev         bigint not null default nextval('records_rev'),
  server_at   timestamptz not null default now(),
  primary key (user_id, type, id)
);
create index if not exists records_user_rev on records(user_id, rev);
-- consultas futuras por data de treino (relatórios, painel)
create index if not exists records_session_date on records(user_id, (data->>'date')) where type = 'session' and not deleted;
