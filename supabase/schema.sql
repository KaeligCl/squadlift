-- SquadLift : schéma Supabase
-- À coller en entier dans Supabase > SQL Editor > New query, puis cliquer sur Run.

-- ========== TABLES ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.friendships (
  id bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null,
  tag text not null default 'Strength',
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  position int not null,
  name text not null,
  equipment text not null default 'Barbell'
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number int not null,
  lbs numeric not null default 0,
  reps int not null default 0,
  done boolean not null default false
);

create table public.likes (
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  primary key (workout_id, user_id)
);

create table public.comments (
  id bigint generated always as identity primary key,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  body text not null check (length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index on public.workouts (user_id, created_at desc);
create index on public.workout_exercises (workout_id);
create index on public.workout_sets (exercise_id);

-- ========== PROFIL CRÉÉ AUTOMATIQUEMENT À L'INSCRIPTION ==========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== FONCTIONS UTILES ==========
create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- Série en cours : jours consécutifs avec au moins une séance (fuseau Paris).
-- Elle reste valide si la dernière séance date d'hier.
create or replace function public.current_streak(uid uuid)
returns int language sql stable security definer set search_path = public as $$
  with d as (
    select distinct (created_at at time zone 'Europe/Paris')::date as day
    from workouts where user_id = uid
  ),
  g as (select day, day - (row_number() over (order by day))::int as grp from d),
  s as (select grp, count(*) as n, max(day) as last_day from g group by grp)
  select coalesce(
    (select n from s
      where last_day >= (now() at time zone 'Europe/Paris')::date - 1
      order by last_day desc limit 1), 0)::int;
$$;

-- Classement entre toi et tes amis. metric : 'streak' | 'volume' | 'sessions'
create or replace function public.leaderboard(metric text)
returns table (user_id uuid, display_name text, value numeric)
language sql stable security definer set search_path = public as $$
  with circle as (
    select auth.uid() as uid
    union
    select case when requester_id = auth.uid() then addressee_id else requester_id end
    from friendships
    where status = 'accepted' and auth.uid() in (requester_id, addressee_id)
  )
  select p.id, p.display_name,
    case metric
      when 'streak'   then current_streak(p.id)::numeric
      when 'sessions' then (select count(*) from workouts w where w.user_id = p.id)::numeric
      when 'volume'   then coalesce((
        select sum(s.lbs * s.reps)
        from workouts w
        join workout_exercises e on e.workout_id = w.id
        join workout_sets s on s.exercise_id = e.id
        where w.user_id = p.id and s.done), 0)::numeric
    end as value
  from circle c join profiles p on p.id = c.uid
  order by 3 desc;
$$;

-- Enregistre une séance complète en une seule requête.
-- p_exercises = [{"name":"Bench Press","equipment":"Barbell","sets":[{"lbs":135,"reps":10,"done":true}]}]
create or replace function public.save_workout(
  p_name text, p_tag text, p_duration int, p_exercises jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  w_id uuid; e_id uuid; ex jsonb; st jsonb; i int := 0; j int;
begin
  insert into workouts (name, tag, duration_seconds)
  values (coalesce(nullif(trim(p_name), ''), 'Workout'), coalesce(p_tag, 'Strength'), coalesce(p_duration, 0))
  returning id into w_id;

  for ex in select * from jsonb_array_elements(p_exercises) loop
    i := i + 1; j := 0;
    insert into workout_exercises (workout_id, position, name, equipment)
    values (w_id, i, ex->>'name', coalesce(ex->>'equipment', 'Barbell'))
    returning id into e_id;
    for st in select * from jsonb_array_elements(ex->'sets') loop
      j := j + 1;
      insert into workout_sets (exercise_id, set_number, lbs, reps, done)
      values (e_id, j, coalesce((st->>'lbs')::numeric, 0), coalesce((st->>'reps')::int, 0),
              coalesce((st->>'done')::boolean, false));
    end loop;
  end loop;
  return w_id;
end $$;

-- ========== SÉCURITÉ (Row Level Security) ==========
alter table public.profiles          enable row level security;
alter table public.friendships       enable row level security;
alter table public.workouts          enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets      enable row level security;
alter table public.likes             enable row level security;
alter table public.comments          enable row level security;

-- Profils : visibles par les membres connectés (nécessaire pour rechercher un ami)
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Amitiés
create policy "friendships_select" on public.friendships for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));
create policy "friendships_insert" on public.friendships for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');
create policy "friendships_accept" on public.friendships for update to authenticated
  using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
create policy "friendships_delete" on public.friendships for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- Séances : les miennes + celles de mes amis
create policy "workouts_select" on public.workouts for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
create policy "workouts_insert" on public.workouts for insert to authenticated
  with check (user_id = auth.uid());
create policy "workouts_update" on public.workouts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workouts_delete" on public.workouts for delete to authenticated
  using (user_id = auth.uid());

-- Exercices et séries : visibles si la séance est visible, modifiables si elle est à moi
create policy "exercises_select" on public.workout_exercises for select to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id));
create policy "exercises_write" on public.workout_exercises for all to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy "sets_select" on public.workout_sets for select to authenticated
  using (exists (select 1 from public.workout_exercises e where e.id = exercise_id));
create policy "sets_write" on public.workout_sets for all to authenticated
  using (exists (select 1 from public.workout_exercises e
                 join public.workouts w on w.id = e.workout_id
                 where e.id = exercise_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workout_exercises e
                 join public.workouts w on w.id = e.workout_id
                 where e.id = exercise_id and w.user_id = auth.uid()));

-- Likes et commentaires : sur les séances que je peux voir
create policy "likes_select" on public.likes for select to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id));
create policy "likes_insert" on public.likes for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.workouts w where w.id = workout_id));
create policy "likes_delete" on public.likes for delete to authenticated
  using (user_id = auth.uid());

create policy "comments_select" on public.comments for select to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id));
create policy "comments_insert" on public.comments for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.workouts w where w.id = workout_id));
create policy "comments_delete" on public.comments for delete to authenticated
  using (user_id = auth.uid());

-- ========== TEMPS RÉEL (likes, commentaires, nouvelles séances) ==========
alter publication supabase_realtime add table public.workouts, public.likes, public.comments;
