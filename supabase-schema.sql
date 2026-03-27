create type dream_status as enum ('published', 'flagged', 'hidden', 'rejected');
create type dream_language as enum ('id', 'en');

create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dream text not null,
  reason text not null,
  language dream_language not null,
  status dream_status not null default 'published',
  ip_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint dreams_name_len check (char_length(name) between 2 and 40),
  constraint dreams_dream_len check (char_length(dream) between 10 and 140),
  constraint dreams_reason_len check (char_length(reason) between 20 and 500)
);

create index if not exists dreams_public_feed_idx
  on public.dreams (created_at desc)
  where status = 'published';
