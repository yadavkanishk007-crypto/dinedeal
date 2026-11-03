create table if not exists public.landing_settings (
  id integer primary key default 1 check (id = 1),
  active_theme text not null default 'diwali',
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.landing_settings (id, active_theme) values (1, 'diwali')
on conflict (id) do nothing;

alter table public.landing_settings enable row level security;

create policy "Anyone can read landing settings" on public.landing_settings
  for select using (true);

create policy "Admins can update landing settings" on public.landing_settings
  for update to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));
