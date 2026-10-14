-- ==============================================================================
-- MIGRACIÓN v4 -> v5: endurecimiento según el revisor de Supabase (Advisors)
-- ==============================================================================
-- No toca datos. Es seguro ejecutarlo más de una vez. Aplicado en producción el 2026-10-14.
-- 1) Políticas RLS: funciones evaluadas una vez por consulta (rendimiento)
-- 2) Índices para llaves foráneas
-- 3) keep_alive con search_path fijo
-- 4) Funciones internas sin acceso desde la API pública
-- ==============================================================================

-- Políticas: se modifican en su lugar (ALTER POLICY), sin borrarlas en ningún momento
alter policy companies_select on public.companies
  using (id = (select public.current_company_id()));

alter policy companies_update on public.companies
  using (id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'accountant', 'admin'))
  with check (id = (select public.current_company_id()));

alter policy profiles_select on public.profiles
  using (
    id = (select auth.uid())
    or (company_id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'accountant', 'admin'))
  );

alter policy profiles_update_admin on public.profiles
  using (company_id = (select public.current_company_id()) and (select public.app_role()) = 'admin')
  with check (company_id = (select public.current_company_id()));

alter policy employees_select on public.employees
  using (company_id = (select public.current_company_id()));

alter policy employees_insert on public.employees
  with check (company_id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'admin'));

alter policy employees_update on public.employees
  using (company_id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'admin'))
  with check (company_id = (select public.current_company_id()));

alter policy employees_delete on public.employees
  using (company_id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'admin'));

alter policy rates_select on public.employee_rates
  using (company_id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'accountant', 'admin'));

alter policy rates_insert on public.employee_rates
  with check (company_id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'accountant', 'admin'));

alter policy rates_update on public.employee_rates
  using (company_id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'accountant', 'admin'))
  with check (company_id = (select public.current_company_id()));

alter policy records_select on public.overtime_records
  using (company_id = (select public.current_company_id()));

alter policy records_insert on public.overtime_records
  with check (company_id = (select public.current_company_id()) and (select public.app_role()) in ('supervisor', 'manager', 'admin'));

alter policy records_update on public.overtime_records
  using (company_id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'admin'))
  with check (company_id = (select public.current_company_id()));

alter policy records_delete on public.overtime_records
  using (
    company_id = (select public.current_company_id())
    and (
      (select public.app_role()) in ('manager', 'admin')
      or ((select public.app_role()) = 'supervisor' and created_by = (select auth.uid()) and not verified_by_manager)
    )
  );

alter policy audit_select on public.audit_log
  using (company_id = (select public.current_company_id()) and (select public.app_role()) in ('manager', 'accountant', 'admin'));

create index if not exists idx_rates_company on public.employee_rates (company_id);
create index if not exists idx_overtime_created_by on public.overtime_records (created_by);
create index if not exists idx_overtime_verified_by on public.overtime_records (verified_by);
create index if not exists idx_profiles_company on public.profiles (company_id);

alter function public.keep_alive() set search_path = '';

-- 15. FUNCIONES INTERNAS SIN ACCESO DESDE LA API PÚBLICA ---------------------
-- Las de triggers no se llaman directo; las de RLS solo con sesión iniciada.
revoke execute on function public.enforce_overtime_rules() from public, anon, authenticated;
revoke execute on function public.enforce_employee_rules() from public, anon, authenticated;
revoke execute on function public.enforce_profile_rules() from public, anon, authenticated;
revoke execute on function public.write_audit_log() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.type_multiplier(uuid, text) from public, anon, authenticated;
revoke execute on function public.app_role() from public, anon;
revoke execute on function public.current_company_id() from public, anon;
grant execute on function public.app_role() to authenticated;
grant execute on function public.current_company_id() to authenticated;
