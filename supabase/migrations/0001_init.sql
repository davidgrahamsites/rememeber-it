-- Rememeber It — initial schema (Phase A/B backend foundation).
-- Mirrors the local prototype data model and packages/core types.
-- Content tables (courses/levels/items/mnemonics) are publicly readable;
-- per-user tables are row-level-secured to the owning auth user.

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique not null,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ---------- content ----------
create table if not exists courses (
  id          text primary key,            -- slug, e.g. 'radicals'
  title       text not null,
  language    text not null,
  description text not null default '',
  order_index int  not null default 0
);

create table if not exists levels (
  id          text primary key,            -- e.g. 'radicals-l1'
  course_id   text not null references courses (id) on delete cascade,
  index_      int  not null,               -- 0-based order within the course
  title       text not null
);

create table if not exists items (
  id             text primary key,         -- e.g. 'radicals-l1-i1'
  course_id      text not null references courses (id) on delete cascade,
  level_id       text not null references levels (id) on delete cascade,
  prompt         text not null,
  answer         text not null,
  alt_answers    text[] not null default '{}',
  reading        text,
  audio_url      text,
  part_of_speech text,
  notes          text,
  cloze_sentence text,
  kind           text not null check (kind in ('radical', 'vocab', 'grammar'))
);
create index if not exists items_level_idx on items (level_id);

-- ---------- mnemonics (community + AI seed) ----------
create table if not exists mnemonics (
  id             text primary key,
  item_id        text not null references items (id) on delete cascade,
  author_id      uuid references profiles (id) on delete set null, -- null = AI seed
  text           text not null,
  meme_image_url text,
  source         text not null check (source in ('ai', 'user')),
  status         text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  upvotes        int  not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists mnemonics_item_idx on mnemonics (item_id);

-- ---------- per-user learning state ----------
create table if not exists user_mnemonic_choice (
  user_id     uuid not null references profiles (id) on delete cascade,
  item_id     text not null references items (id) on delete cascade,
  mnemonic_id text not null references mnemonics (id) on delete cascade,
  primary key (user_id, item_id)
);

create table if not exists review_state (
  user_id     uuid not null references profiles (id) on delete cascade,
  item_id     text not null references items (id) on delete cascade,
  stability   double precision not null default 0,
  difficulty  double precision not null default 0,
  due         timestamptz,
  last_review timestamptz,
  reps        int not null default 0,
  lapses      int not null default 0,
  primary key (user_id, item_id)
);
create index if not exists review_state_due_idx on review_state (user_id, due);

create table if not exists reviews (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references profiles (id) on delete cascade,
  item_id     text not null references items (id) on delete cascade,
  grade       int  not null check (grade between 1 and 4), -- Again/Hard/Good/Easy
  reviewed_at timestamptz not null default now()
);

create table if not exists streaks (
  user_id          uuid primary key references profiles (id) on delete cascade,
  current          int  not null default 0,
  longest          int  not null default 0,
  last_active_date date,
  freezes          int  not null default 0
);

create table if not exists friends (
  user_id    uuid not null references profiles (id) on delete cascade,
  friend_id  uuid not null references profiles (id) on delete cascade,
  status     text not null default 'pending'
               check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

-- ---------- leaderboard ----------
create or replace view leaderboard as
  select p.id as user_id, p.username, p.display_name,
         coalesce(s.current, 0) as current_streak,
         coalesce(s.longest, 0) as longest_streak
  from profiles p
  left join streaks s on s.user_id = p.id;

-- ---------- Row Level Security ----------
alter table profiles             enable row level security;
alter table mnemonics            enable row level security;
alter table user_mnemonic_choice enable row level security;
alter table review_state         enable row level security;
alter table reviews              enable row level security;
alter table streaks              enable row level security;
alter table friends              enable row level security;
-- courses/levels/items: public read, no RLS writes (managed via service role).
alter table courses enable row level security;
alter table levels  enable row level security;
alter table items   enable row level security;

-- Public read of content.
create policy "content_read_courses" on courses for select using (true);
create policy "content_read_levels"  on levels  for select using (true);
create policy "content_read_items"   on items   for select using (true);

-- Profiles: everyone can read; you can insert/update only your own row.
create policy "profiles_read"   on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (id = auth.uid());
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- Mnemonics: anyone reads approved (or their own); authors manage their own.
create policy "mnemonics_read"   on mnemonics for select
  using (status = 'approved' or author_id = auth.uid());
create policy "mnemonics_insert" on mnemonics for insert
  with check (author_id = auth.uid() and source = 'user');
create policy "mnemonics_update" on mnemonics for update using (author_id = auth.uid());

-- Owner-only CRUD for per-user tables.
create policy "choice_rw" on user_mnemonic_choice using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "review_state_rw" on review_state using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "reviews_rw" on reviews using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "streaks_rw" on streaks using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "friends_rw" on friends using (user_id = auth.uid())
  with check (user_id = auth.uid());
