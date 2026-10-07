-- Chạy toàn bộ tệp này một lần trong Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null check (char_length(phone) between 9 and 20),
  market text not null check (char_length(market) between 2 and 100),
  message text not null default '' check (char_length(message) <= 1500),
  status text not null default 'new' check (status in ('new', 'contacted', 'enrolled', 'closed')),
  source text not null default 'website',
  page_url text,
  consent boolean not null default false,
  zalo_notified boolean not null default false,
  zalo_error text
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.consultation_requests enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Admins read consultation requests" on public.consultation_requests;
create policy "Admins read consultation requests"
on public.consultation_requests for select to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins update consultation requests" on public.consultation_requests;
create policy "Admins update consultation requests"
on public.consultation_requests for update to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admin reads own permission" on public.admin_users;
create policy "Admin reads own permission"
on public.admin_users for select to authenticated
using (user_id = auth.uid());

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists consultation_requests_touch_updated_at on public.consultation_requests;
create trigger consultation_requests_touch_updated_at
before update on public.consultation_requests
for each row execute function public.touch_updated_at();

create index if not exists consultation_requests_created_at_idx on public.consultation_requests (created_at desc);
create index if not exists consultation_requests_status_idx on public.consultation_requests (status);

-- Sau khi tạo người dùng trong Authentication > Users, thay UUID bên dưới và chạy riêng lệnh này:
-- insert into public.admin_users (user_id) values ('UUID-CUA-TAI-KHOAN-ADMIN');
