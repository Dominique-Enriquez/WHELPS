create table public.users (
  id text primary key, name text not null, email text not null unique, password_hash text not null,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  phone text, region text, city text, created_at timestamptz not null default now()
);

create table public.sessions (
  token_hash text primary key, user_id text not null references public.users(id) on delete cascade,
  expires_at timestamptz not null, created_at timestamptz not null default now()
);

create table public.pets (
  id text primary key, name text not null, image text not null, type text not null, breed text not null,
  age text not null, gender text not null, fixed_status text not null, vaccination_status text not null,
  health_notes text, health_verification text not null default 'Verified' check (health_verification in ('Pending Verification', 'Requires Update', 'Verified')),
  description text not null, availability text not null default 'Available' check (availability in ('Available', 'On Hold', 'Adopted', 'Archived')),
  published integer not null default 1 check (published in (0, 1)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.adoption_applications (
  id text primary key, applicant_user_id text not null references public.users(id), pet_id text not null references public.pets(id),
  full_name text not null, email text not null, contact text not null, address text not null, reason text not null,
  housing_type text not null, pets_allowed text not null check (pets_allowed in ('Yes', 'No')), housing_details text,
  income_range text not null, financial_support text not null, pet_experience text not null check (pet_experience in ('Yes', 'No')),
  experience_details text not null,
  status text not null default 'Submitted' check (status in ('Submitted', 'Under Review', 'Additional Information Required', 'Approved — Awaiting Placement', 'Rejected', 'Cancelled by Applicant', 'Adoption Completed')),
  submitted_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  cancelled_at timestamptz, decision_at timestamptz, latest_update text not null,
  version integer not null default 1 check (version > 0)
);

create unique index one_active_application_per_user on public.adoption_applications(applicant_user_id)
  where status in ('Submitted', 'Under Review', 'Additional Information Required', 'Approved — Awaiting Placement');

create table public.administrative_reviews (
  id text primary key, application_id text not null unique references public.adoption_applications(id) on delete cascade,
  reviewer_admin_id text not null references public.users(id), housing_evaluation text, financial_evaluation text,
  experience_evaluation text, readiness_evaluation text, internal_notes text, decision text, decision_reason text,
  reviewed_at timestamptz not null default now(), decision_at timestamptz
);

create table public.application_status_history (
  id bigint generated always as identity primary key,
  application_id text not null references public.adoption_applications(id) on delete cascade,
  previous_status text, new_status text not null, updated_by text not null references public.users(id),
  updated_at timestamptz not null default now(), reason text
);

create table public.notifications (
  id text primary key, recipient_user_id text not null references public.users(id) on delete cascade,
  application_id text references public.adoption_applications(id) on delete cascade, conversation_id text,
  type text not null, message text not null, is_read integer not null default 0 check (is_read in (0, 1)),
  created_at timestamptz not null default now()
);

create table public.conversations (
  id text primary key, adopter_user_id text not null references public.users(id),
  application_id text not null unique references public.adoption_applications(id) on delete cascade,
  created_at timestamptz not null default now(), last_activity_at timestamptz not null default now(), closed_at timestamptz
);

alter table public.notifications add constraint notifications_conversation_id_fkey
  foreign key (conversation_id) references public.conversations(id) on delete cascade;

create table public.messages (
  id text primary key, conversation_id text not null references public.conversations(id) on delete cascade,
  sender_user_id text not null references public.users(id), content text not null check (char_length(content) between 1 and 2000),
  message_kind text not null default 'MESSAGE', created_at timestamptz not null default now(), read_at timestamptz,
  client_request_id text, unique (conversation_id, sender_user_id, client_request_id)
);

create table public.attachments (
  id text primary key, message_id text not null references public.messages(id) on delete cascade,
  storage_key text not null, mime_type text not null, file_size bigint not null check (file_size >= 0), original_name text not null
);

create table public.adoption_placements (
  id text primary key, application_id text not null unique references public.adoption_applications(id),
  pet_id text not null unique references public.pets(id), adopter_user_id text not null references public.users(id),
  recorded_by text not null references public.users(id), adopted_at timestamptz not null default now(), status text not null default 'Active'
);

create table public.monitoring_records (
  id text primary key, placement_id text not null references public.adoption_placements(id) on delete cascade,
  submitted_by text not null references public.users(id), pet_condition text not null, feeding_update text,
  health_observations text, behavior_update text, notes text, submitted_at timestamptz not null default now(),
  review_status text not null default 'Pending Review' check (review_status in ('Pending Review', 'Reviewed', 'Needs Clarification')),
  reviewed_by text references public.users(id), reviewed_at timestamptz, admin_notes text
);

create table public.feedback (
  id text primary key, submitted_by text not null references public.users(id), topic text not null,
  rating smallint not null check (rating between 1 and 5), comments text, created_at timestamptz not null default now()
);

create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_expires_at_idx on public.sessions(expires_at);
create index adoption_applications_pet_id_idx on public.adoption_applications(pet_id);
create index adoption_applications_submitted_at_idx on public.adoption_applications(submitted_at desc);
create index administrative_reviews_reviewer_admin_id_idx on public.administrative_reviews(reviewer_admin_id);
create index application_status_history_application_id_idx on public.application_status_history(application_id, updated_at desc);
create index application_status_history_updated_by_idx on public.application_status_history(updated_by);
create index notifications_recipient_created_idx on public.notifications(recipient_user_id, created_at desc);
create index notifications_application_id_idx on public.notifications(application_id);
create index notifications_conversation_id_idx on public.notifications(conversation_id);
create index conversations_adopter_user_id_idx on public.conversations(adopter_user_id);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index messages_sender_user_id_idx on public.messages(sender_user_id);
create index attachments_message_id_idx on public.attachments(message_id);
create index adoption_placements_adopter_user_id_idx on public.adoption_placements(adopter_user_id);
create index adoption_placements_recorded_by_idx on public.adoption_placements(recorded_by);
create index monitoring_records_placement_submitted_idx on public.monitoring_records(placement_id, submitted_at desc);
create index monitoring_records_submitted_by_idx on public.monitoring_records(submitted_by);
create index monitoring_records_reviewed_by_idx on public.monitoring_records(reviewed_by);
create index monitoring_records_pending_idx on public.monitoring_records(submitted_at desc) where review_status = 'Pending Review';
create index feedback_submitted_by_idx on public.feedback(submitted_by);

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.pets enable row level security;
alter table public.adoption_applications enable row level security;
alter table public.administrative_reviews enable row level security;
alter table public.application_status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.adoption_placements enable row level security;
alter table public.monitoring_records enable row level security;
alter table public.feedback enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
