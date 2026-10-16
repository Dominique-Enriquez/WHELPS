alter table public.users
  add column if not exists account_status text not null default 'active' check (account_status in ('active','suspended','banned')),
  add column if not exists verification_status text not null default 'not_requested' check (verification_status in ('not_requested','pending','verified','rejected')),
  add column if not exists organization_name text,
  add column if not exists deleted_at timestamptz;

create table if not exists public.favorite_pets (
  user_id text not null references public.users(id) on delete cascade,
  pet_id text not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pet_id)
);

create table if not exists public.rehoming_submissions (
  id text primary key, submitted_by text not null references public.users(id), pet_name text not null,
  species text not null, breed text not null, age_months integer not null check (age_months between 0 and 600),
  sex text not null, size text not null, location text not null, vaccination_status text not null,
  fixed_status text not null, health_notes text, personality text not null, compatibility text not null,
  reason text not null, carer_name text not null, carer_email text not null, carer_phone text not null,
  relationship text not null, image_data text not null, status text not null default 'Submitted'
    check (status in ('Submitted','Under Review','Additional Information Required','Approved','Rejected','Cancelled')),
  review_note text, submitted_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.application_documents (
  id text primary key, application_id text not null references public.adoption_applications(id) on delete cascade,
  uploaded_by text not null references public.users(id), original_name text not null, mime_type text not null,
  file_size bigint not null check (file_size between 1 and 5242880), data_base64 text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.welfare_reports (
  id text primary key, reported_by text references public.users(id) on delete set null,
  category text not null, location text not null, details text not null,
  status text not null default 'new' check (status in ('new','under_review','resolved','dismissed')),
  resolution_note text, resolved_by text references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key, actor_user_id text references public.users(id) on delete set null,
  action_type text not null, entity_type text not null, entity_id text, details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.password_reset_tokens (
  token_hash text primary key, user_id text not null references public.users(id) on delete cascade,
  expires_at timestamptz not null, used_at timestamptz, created_at timestamptz not null default now()
);

create index if not exists favorite_pets_user_idx on public.favorite_pets(user_id, created_at desc);
create index if not exists rehoming_submissions_user_idx on public.rehoming_submissions(submitted_by, submitted_at desc);
create index if not exists rehoming_submissions_status_idx on public.rehoming_submissions(status, submitted_at desc);
create index if not exists application_documents_application_idx on public.application_documents(application_id, created_at);
create index if not exists welfare_reports_status_idx on public.welfare_reports(status, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
create index if not exists password_reset_tokens_user_idx on public.password_reset_tokens(user_id, created_at desc);

alter table public.favorite_pets enable row level security;
alter table public.rehoming_submissions enable row level security;
alter table public.application_documents enable row level security;
alter table public.welfare_reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.password_reset_tokens enable row level security;
revoke all on public.favorite_pets, public.rehoming_submissions, public.application_documents, public.welfare_reports, public.audit_logs, public.password_reset_tokens from anon, authenticated;
revoke all on sequence public.audit_logs_id_seq from anon, authenticated;
