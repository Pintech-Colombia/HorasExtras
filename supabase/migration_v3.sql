-- ==============================================================================
-- MIGRACIÓN v2 -> v3 (para la base que YA está en uso)
-- ==============================================================================
-- Orden: 1) ejecute ESTE archivo  2) ejecute schema.sql completo otra vez.
-- No borra horas ni empleados. Es seguro ejecutarlo más de una vez.
-- ==============================================================================

-- 1. Tarifas a tabla aparte (el supervisor no podrá leerlas)
create table if not exists public.employee_rates (
  employee_id uuid primary key references public.employees(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  base_hourly_rate numeric not null default 0 check (base_hourly_rate >= 0),
  updated_at timestamptz default now()
);

-- Cerrada desde el inicio; schema.sql define quién puede leerla
alter table public.employee_rates enable row level security;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'employees' and column_name = 'base_hourly_rate') then
    insert into public.employee_rates (employee_id, company_id, base_hourly_rate)
    select id, company_id, base_hourly_rate from public.employees
    on conflict (employee_id) do nothing;
    alter table public.employees drop column base_hourly_rate;
  end if;
end $$;

-- 2. Contraseña propia obligatoria (los usuarios ya creados deberán cambiarla; el admin no)
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'profiles' and column_name = 'must_change_password') then
    alter table public.profiles add column must_change_password boolean not null default true;
    update public.profiles set must_change_password = false where role = 'admin';
  end if;
end $$;
