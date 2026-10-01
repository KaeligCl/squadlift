-- Séances enregistrées (modèles) : privées par défaut, partageables avec les amis.
-- À exécuter sur Supabase DEV pendant le développement, puis sur PROD avant de fusionner dans main.

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null check (length(trim(name)) > 0),
  -- [{"name":"Bench Press","equipment":"Barbell","sets":[{"lbs":135,"reps":10}]}]
  exercises jsonb not null check (jsonb_typeof(exercises) = 'array'),
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.workout_templates (user_id, created_at desc);

alter table public.workout_templates enable row level security;

-- Je vois les miens + ceux que mes amis ont partagés
create policy "templates_select" on public.workout_templates for select to authenticated
  using (user_id = auth.uid() or (is_shared and public.are_friends(auth.uid(), user_id)));
create policy "templates_insert" on public.workout_templates for insert to authenticated
  with check (user_id = auth.uid());
create policy "templates_update" on public.workout_templates for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "templates_delete" on public.workout_templates for delete to authenticated
  using (user_id = auth.uid());
