-- ==============================================================================
-- SCHEMA SUPABASE: GESTIÓN DE HORAS EXTRAS Y NÓMINA
-- ==============================================================================

-- 1. EXTENSIONES NECESARIAS
create extension if not exists "uuid-ossp";

-- 2. TABLA DE EMPRESAS (Tenants)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nit text,
  accountant_name text,
  accountant_email text,
  manager_name text,
  manager_title text,
  currency_symbol text default '$',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TABLA DE PERFILES DE USUARIOS (Vinculados a auth.users de Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin', 'manager', 'accountant')) default 'manager',
  created_at timestamptz default now()
);

-- 4. TABLA DE EMPLEADOS
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  document_id text not null, -- Cédula / DNI
  name text not null,
  position text not null,
  department text default 'Operaciones',
  base_hourly_rate numeric not null default 15000,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. TABLA DE REGISTROS DE HORAS EXTRAS
create table if not exists public.overtime_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  employee_name text not null,
  date date not null,
  hours numeric not null check (hours > 0),
  type text not null check (type in ('diurna', 'nocturna', 'festiva_diurna', 'festiva_nocturna')),
  custom_multiplier numeric,
  status text not null check (status in ('pending_review', 'verified_manager', 'sent_accountant')) default 'pending_review',
  notes text,
  verified_by_manager boolean default false,
  verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- 6. ÍNDICES DE ALTO RENDIMIENTO
create index if not exists idx_overtime_company_date on public.overtime_records (company_id, date);
create index if not exists idx_overtime_employee on public.overtime_records (employee_id);
create index if not exists idx_employees_company on public.employees (company_id);

-- 7. SEGURIDAD A NIVEL DE FILAS (ROW LEVEL SECURITY - RLS)
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.overtime_records enable row level security;

-- POLÍTICAS: Para usuarios autenticados
create policy "Usuarios ven su propia empresa"
  on public.companies for select
  using (auth.uid() is not null);

create policy "Usuarios autenticados pueden editar su empresa"
  on public.companies for all
  using (auth.uid() is not null);

create policy "Lectura de perfiles de usuario"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "Edición de su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Gestión completa de empleados para usuarios autenticados"
  on public.employees for all
  using (auth.uid() is not null);

create policy "Gestión completa de horas extras para usuarios autenticados"
  on public.overtime_records for all
  using (auth.uid() is not null);

-- 8. TRIGGER: CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_company_id uuid;
begin
  -- Crear una empresa inicial por defecto para el usuario
  insert into public.companies (name, nit, manager_name, manager_title, accountant_name, accountant_email)
  values ('Mi Empresa', '900.000.000-1', coalesce(new.raw_user_meta_data->>'full_name', 'Encargado'), 'Operaciones', 'Contabilidad', 'contabilidad@empresa.com')
  returning id into default_company_id;

  insert into public.profiles (id, company_id, full_name, email, role)
  values (
    new.id,
    default_company_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'manager')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
