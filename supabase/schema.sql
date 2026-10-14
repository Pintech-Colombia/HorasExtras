-- ==============================================================================
-- SCHEMA SUPABASE: GESTIÓN DE HORAS EXTRAS Y NÓMINA (v2)
-- ==============================================================================
-- Ejecutar UNA sola vez en un proyecto NUEVO de Supabase (SQL Editor).
-- Este archivo NO contiene datos de prueba: solo crea tablas, reglas de
-- seguridad y la ficha de la empresa (verifique NIT y correos antes de correrlo).
--
-- Roles:
--   supervisor  -> registra horas extras (quedan pendientes), borra solo sus pendientes.
--                  NO puede leer tarifas ni valores (están en employee_rates).
--   manager     -> (Jefa de Producción) todo: aprueba, edita, empleados, tarifas, configuración
--   accountant  -> (Contador) consulta, tarifas, configuración, reporte y "enviado a contabilidad"
--   admin       -> todo
-- Todo usuario nuevo nace como 'supervisor'. El rol solo lo cambia un admin.
-- ==============================================================================

-- 1. EMPRESAS ------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nit text,
  accountant_name text,
  accountant_email text,
  manager_name text,
  manager_title text,
  currency_symbol text default '$',
  -- Reglas de recargos y jornada (editables por Contador/Admin desde la app).
  -- Valores por defecto según Ley 2466 de 2025 (vigentes desde jul-2026); validar con contabilidad.
  overtime_rules jsonb not null default '{
    "extraDiurnaPct": 25,
    "extraNocturnaPct": 75,
    "festivaDiurnaPct": 115,
    "festivaNocturnaPct": 165,
    "nightStart": "19:00",
    "nightEnd": "06:00",
    "shiftStart": "07:30",
    "shiftEnds": {"1": "17:00", "2": "17:00", "3": "16:30", "4": "17:00", "5": "17:00", "6": null},
    "saturdayAsHoliday": false
  }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. PERFILES (vinculados a auth.users) ---------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete restrict,
  full_name text not null,
  email text not null,
  role text not null default 'supervisor'
    check (role in ('admin', 'manager', 'accountant', 'supervisor')),
  active boolean not null default true,
  must_change_password boolean not null default true, -- obliga a crear contraseña propia al primer ingreso
  created_at timestamptz default now()
);

-- 3. FUNCIONES DE APOYO (rol y empresa del usuario actual) --------------------
create or replace function public.app_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.current_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid() and active
$$;

-- 4. EMPLEADOS -----------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id()
    references public.companies(id) on delete restrict,
  document_id text not null, -- Cédula
  name text not null,
  position text not null,
  department text default 'Operaciones',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id, document_id)
);

-- 4b. TARIFAS (separadas para que el supervisor no pueda leerlas) -------------
create table if not exists public.employee_rates (
  employee_id uuid primary key references public.employees(id) on delete cascade,
  company_id uuid not null default public.current_company_id()
    references public.companies(id) on delete restrict,
  base_hourly_rate numeric not null default 0 check (base_hourly_rate >= 0),
  updated_at timestamptz default now()
);

-- 5. REGISTROS DE HORAS EXTRAS -------------------------------------------------
create table if not exists public.overtime_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id()
    references public.companies(id) on delete restrict,
  -- RESTRICT: un empleado con historial NO se puede borrar (solo inactivar)
  employee_id uuid not null references public.employees(id) on delete restrict,
  employee_name text not null,
  date date not null,
  hours numeric not null check (hours > 0 and hours <= 24),
  type text not null check (type in ('diurna', 'nocturna', 'festiva_diurna', 'festiva_nocturna')),
  custom_multiplier numeric, -- multiplicador congelado al crear el registro (los meses pasados no cambian)
  status text not null default 'pending_review'
    check (status in ('pending_review', 'verified_manager', 'sent_accountant')),
  notes text,
  verified_by_manager boolean default false,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. BITÁCORA DE AUDITORÍA (quién cambió qué y cuándo) ------------------------
create table if not exists public.audit_log (
  id bigserial primary key,
  company_id uuid,
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid default auth.uid(),
  changed_at timestamptz default now()
);

-- 7. ÍNDICES -------------------------------------------------------------------
create index if not exists idx_overtime_company_date on public.overtime_records (company_id, date);
create index if not exists idx_overtime_employee on public.overtime_records (employee_id);
create index if not exists idx_employees_company on public.employees (company_id);
create index if not exists idx_audit_record on public.audit_log (table_name, record_id);

-- 8. SEGURIDAD A NIVEL DE FILAS (RLS) ------------------------------------------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.overtime_records enable row level security;
alter table public.audit_log enable row level security;
alter table public.employee_rates enable row level security;

-- Empresas: todos leen la suya; solo Contador/Admin la editan. Nadie crea ni borra desde la app.
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select to authenticated
  using (id = public.current_company_id());

drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies for update to authenticated
  using (id = public.current_company_id() and public.app_role() in ('manager', 'accountant', 'admin'))
  with check (id = public.current_company_id());

-- Perfiles: cada quien ve su perfil; jefa/contador/admin ven los de su empresa; solo admin edita (roles).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or (company_id = public.current_company_id() and public.app_role() in ('manager', 'accountant', 'admin'))
  );

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated
  using (company_id = public.current_company_id() and public.app_role() = 'admin')
  with check (company_id = public.current_company_id());

-- Empleados
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees for select to authenticated
  using (company_id = public.current_company_id());

drop policy if exists employees_insert on public.employees;
create policy employees_insert on public.employees for insert to authenticated
  with check (company_id = public.current_company_id() and public.app_role() in ('manager', 'admin'));

drop policy if exists employees_update on public.employees;
create policy employees_update on public.employees for update to authenticated
  using (company_id = public.current_company_id() and public.app_role() in ('manager', 'admin'))
  with check (company_id = public.current_company_id());

drop policy if exists employees_delete on public.employees;
create policy employees_delete on public.employees for delete to authenticated
  using (company_id = public.current_company_id() and public.app_role() in ('manager', 'admin'));

-- Tarifas: solo Jefa, Contador y Admin (el supervisor no las ve)
drop policy if exists rates_select on public.employee_rates;
create policy rates_select on public.employee_rates for select to authenticated
  using (company_id = public.current_company_id() and public.app_role() in ('manager', 'accountant', 'admin'));

drop policy if exists rates_insert on public.employee_rates;
create policy rates_insert on public.employee_rates for insert to authenticated
  with check (company_id = public.current_company_id() and public.app_role() in ('manager', 'accountant', 'admin'));

drop policy if exists rates_update on public.employee_rates;
create policy rates_update on public.employee_rates for update to authenticated
  using (company_id = public.current_company_id() and public.app_role() in ('manager', 'accountant', 'admin'))
  with check (company_id = public.current_company_id());

-- Horas extras
drop policy if exists records_select on public.overtime_records;
create policy records_select on public.overtime_records for select to authenticated
  using (company_id = public.current_company_id());

drop policy if exists records_insert on public.overtime_records;
create policy records_insert on public.overtime_records for insert to authenticated
  with check (company_id = public.current_company_id() and public.app_role() in ('supervisor', 'manager', 'admin'));

drop policy if exists records_update on public.overtime_records;
-- Solo Jefa y Admin editan/aprueban. El Contador marca "enviado" con la función mark_month_sent().
create policy records_update on public.overtime_records for update to authenticated
  using (company_id = public.current_company_id() and public.app_role() in ('manager', 'admin'))
  with check (company_id = public.current_company_id());

drop policy if exists records_delete on public.overtime_records;
create policy records_delete on public.overtime_records for delete to authenticated
  using (
    company_id = public.current_company_id()
    and (
      public.app_role() in ('manager', 'admin')
      or (public.app_role() = 'supervisor' and created_by = auth.uid() and not verified_by_manager)
    )
  );

-- Bitácora: solo Admin y Contador la consultan; nadie la edita (la llenan los triggers).
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log for select to authenticated
  using (company_id = public.current_company_id() and public.app_role() in ('manager', 'accountant', 'admin'));

-- 9. REGLAS DE NEGOCIO (triggers) ----------------------------------------------

-- 9a. Multiplicador según el tipo y las reglas vigentes de la empresa
create or replace function public.type_multiplier(p_company uuid, p_type text)
returns numeric
language sql stable security definer set search_path = public
as $$
  select 1 + coalesce(
    (c.overtime_rules ->> (case p_type
      when 'diurna' then 'extraDiurnaPct'
      when 'nocturna' then 'extraNocturnaPct'
      when 'festiva_diurna' then 'festivaDiurnaPct'
      when 'festiva_nocturna' then 'festivaNocturnaPct'
    end))::numeric,
    case p_type when 'diurna' then 25 when 'nocturna' then 75 when 'festiva_diurna' then 115 else 165 end
  ) / 100
  from public.companies c where c.id = p_company
$$;

-- 9b. Registros: forzar autor, estado, multiplicador congelado y bloqueo de enviados
create or replace function public.enforce_overtime_rules()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r text := public.app_role();
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.company_id := coalesce(public.current_company_id(), new.company_id);
    -- El porcentaje se fija al crear (no se acepta el que envíe el navegador)
    new.custom_multiplier := public.type_multiplier(new.company_id, new.type);
    -- Solo la Jefa o el Admin pueden registrar algo ya aprobado
    if r not in ('manager', 'admin') then
      new.status := 'pending_review';
      new.verified_by_manager := false;
      new.verified_at := null;
    end if;
    if new.verified_by_manager then
      new.verified_by := auth.uid();
      new.verified_at := coalesce(new.verified_at, now());
    else
      new.verified_by := null;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'sent_accountant' and r <> 'admin' then
      raise exception 'Registro ya enviado a contabilidad: no se puede modificar.';
    end if;
    -- Campos que nunca cambian
    new.company_id := old.company_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_at := now();
    -- Solo se recalcula si cambia el tipo; si no, se conserva el porcentaje original
    if new.type is distinct from old.type or old.custom_multiplier is null then
      new.custom_multiplier := public.type_multiplier(new.company_id, new.type);
    else
      new.custom_multiplier := old.custom_multiplier;
    end if;
    if new.verified_by_manager is distinct from old.verified_by_manager then
      if new.verified_by_manager then
        new.verified_by := auth.uid();
        new.verified_at := now();
      else
        new.verified_by := null;
        new.verified_at := null;
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'sent_accountant' and r <> 'admin' then
      raise exception 'Registro ya enviado a contabilidad: no se puede eliminar.';
    end if;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_overtime_rules on public.overtime_records;
create trigger trg_overtime_rules
  before insert or update or delete on public.overtime_records
  for each row execute function public.enforce_overtime_rules();

-- 9c. Empleados y tarifas: empresa fija y fecha de actualización
create or replace function public.enforce_employee_rules()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.company_id := coalesce(public.current_company_id(), new.company_id);
  else
    new.company_id := old.company_id;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_employee_rules on public.employees;
create trigger trg_employee_rules
  before insert or update on public.employees
  for each row execute function public.enforce_employee_rules();

drop trigger if exists trg_rate_rules on public.employee_rates;
create trigger trg_rate_rules
  before insert or update on public.employee_rates
  for each row execute function public.enforce_employee_rules();

-- 9d. Perfiles: nadie puede cambiar su propio rol ni moverse de empresa
create or replace function public.enforce_profile_rules()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.id = auth.uid() and new.role is distinct from old.role then
    raise exception 'No puedes cambiar tu propio rol.';
  end if;
  new.company_id := old.company_id;
  return new;
end;
$$;

drop trigger if exists trg_profile_rules on public.profiles;
create trigger trg_profile_rules
  before update on public.profiles
  for each row execute function public.enforce_profile_rules();

-- 9e. Bitácora automática de cambios
create or replace function public.write_audit_log()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (company_id, table_name, record_id, action, old_data, new_data, changed_by)
  values (
    coalesce((row_data->>'company_id')::uuid, case when tg_table_name = 'companies' then (row_data->>'id')::uuid end),
    tg_table_name,
    coalesce((row_data->>'id')::uuid, (row_data->>'employee_id')::uuid),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    auth.uid()
  );
  return null;
end;
$$;

drop trigger if exists trg_audit_records on public.overtime_records;
create trigger trg_audit_records after insert or update or delete on public.overtime_records
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_employees on public.employees;
create trigger trg_audit_employees after insert or update or delete on public.employees
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_rates on public.employee_rates;
create trigger trg_audit_rates after insert or update or delete on public.employee_rates
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_companies on public.companies;
create trigger trg_audit_companies after update on public.companies
  for each row execute function public.write_audit_log();

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles after update on public.profiles
  for each row execute function public.write_audit_log();

-- 10. PERFIL AUTOMÁTICO AL CREAR USUARIO ---------------------------------------
-- El rol SIEMPRE nace como 'supervisor' (se ignora cualquier rol enviado por el navegador).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  default_company_id uuid;
begin
  select id into default_company_id from public.companies order by created_at asc limit 1;

  insert into public.profiles (id, company_id, full_name, email, role)
  values (
    new.id,
    default_company_id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    'supervisor'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10b. FUNCIONES QUE LLAMA LA APP -----------------------------------------------

-- Marca como enviados a contabilidad los registros APROBADOS de un mes (YYYY-MM).
-- Quedan bloqueados: solo el Admin puede modificarlos después.
create or replace function public.mark_month_sent(p_month text)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  start_date date := to_date(p_month || '-01', 'YYYY-MM-DD');
  affected integer;
begin
  if public.app_role() not in ('manager', 'accountant', 'admin') then
    raise exception 'No tiene permisos para marcar registros como enviados.';
  end if;
  update public.overtime_records
     set status = 'sent_accountant'
   where company_id = public.current_company_id()
     and verified_by_manager
     and status = 'verified_manager'
     and date >= start_date
     and date < (start_date + interval '1 month');
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.mark_month_sent(text) from public, anon;
grant execute on function public.mark_month_sent(text) to authenticated;

-- El usuario confirma que ya creó su propia contraseña
create or replace function public.password_changed()
returns void
language sql security definer set search_path = public
as $$
  update public.profiles set must_change_password = false where id = auth.uid()
$$;

revoke all on function public.password_changed() from public, anon;
grant execute on function public.password_changed() to authenticated;

-- 11. KEEP-ALIVE (evita la pausa del plan gratuito; lo llama GitHub Actions) ---
create or replace function public.keep_alive()
returns timestamptz
language sql stable
as $$ select now() $$;

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;

-- 12. FICHA DE LA EMPRESA (única fila; verifique NIT y correo antes de ejecutar) -
insert into public.companies (name, nit, manager_name, manager_title, accountant_name, accountant_email)
select 'Pintech Colombia S.A.S.', '901.123.507-9', 'Lorena Vargas', 'Jefa de Producción', 'Omar (Contador)', 'contabilidad@pintech.co'
where not exists (select 1 from public.companies);

-- 13. PERFILES PARA USUARIOS QUE YA EXISTÍAN (proyecto reanudado) -------------
-- Todos quedan como 'supervisor'; luego el admin asigna los roles.
insert into public.profiles (id, company_id, full_name, email, role)
select u.id,
       (select id from public.companies order by created_at asc limit 1),
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
       u.email,
       'supervisor'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 14. PORCENTAJES CONGELADOS PARA REGISTROS ANTERIORES -------------------------
update public.overtime_records set updated_at = updated_at where custom_multiplier is null;

-- ==============================================================================
-- DESPUÉS DE EJECUTAR:
-- 1. Authentication > Sign In / Providers: desactive "Allow new users to sign up".
-- 2. Authentication > Users > "Invite user" para cada persona.
-- 3. Asigne roles (ejemplo). Cada usuario debe crear su contraseña propia al primer ingreso:
--      update public.profiles set role = 'admin'      where email = 'admin@empresa.co';
--      update public.profiles set role = 'manager'    where email = 'lorena@empresa.co';
--      update public.profiles set role = 'accountant' where email = 'omar@empresa.co';
-- ==============================================================================
