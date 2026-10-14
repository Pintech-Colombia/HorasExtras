-- ==============================================================================
-- LIMPIEZA DEL ESQUEMA ANTERIOR (v1) - SOLO PARA EL PROYECTO REANUDADO
-- ==============================================================================
-- ¡ATENCIÓN! Borra TODAS las tablas de la app (empresas, perfiles, empleados y horas).
-- Úselo solo si los datos actuales son de prueba. Antes descargue un respaldo
-- (Database > Backups) por si acaso.
-- NO borra los usuarios de Authentication: al correr schema.sql se les recrea el
-- perfil como 'supervisor' y luego se les asigna el rol.
--
-- Orden: 1) este archivo  2) schema.sql  3) asignar roles
-- ==============================================================================

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.audit_log cascade;
drop table if exists public.overtime_records cascade;
drop table if exists public.employees cascade;
drop table if exists public.profiles cascade;
drop table if exists public.companies cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.app_role() cascade;
drop function if exists public.current_company_id() cascade;
drop function if exists public.enforce_overtime_rules() cascade;
drop function if exists public.enforce_employee_rules() cascade;
drop function if exists public.enforce_profile_rules() cascade;
drop function if exists public.write_audit_log() cascade;
drop function if exists public.keep_alive() cascade;
