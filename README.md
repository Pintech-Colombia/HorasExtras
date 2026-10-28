# ⏱️ Control de Horas Extras & Conciliación de Nómina

Sistema web empresarial para el registro, cálculo automático, auditoría de planta y generación de reportes oficiales de **horas extras** para contabilidad y nómina, con automatización de correos para Gmail y exportación a Excel.

Diseñado con una arquitectura moderna desacoplada: **Frontend en React 19**, **Serverless en Vercel** y **Base de Datos en Supabase (PostgreSQL)**.

---

## 🚀 Características Principales

- **Cálculo Inteligente de Jornada:** Deduce automáticamente las horas extras a partir de la hora de salida real y los horarios oficiales de la empresa (Lunes a Viernes 7:30 AM – 5:00 PM, Miércoles 7:30 AM – 4:30 PM, Fines de semana).
- **Recargos configurables (Ley 2466 de 2025 por defecto):** Extra diurna 25 %, extra nocturna 75 %, dominical/festiva diurna 115 %, dominical/festiva nocturna 165 %. Separa automáticamente horas diurnas y nocturnas y detecta festivos de Colombia.
- **Módulo de Auditoría y Verificación:** Permite al encargado de planta o supervisor conciliar, editar y aprobar registros antes de consolidarlos para contabilidad.
- **Automatización de Correo para Gmail:** Genera una tabla estilizada en formato HTML enriquecido lista para copiar directamente al portapapeles (`Ctrl + V`) y pegar en Gmail Web o cliente de correo.
- **Exportación Contable:** Descarga de reportes detallados en formato CSV/Excel listos para procesar nómina.
- **Datos solo en la nube:** En producción trabaja exclusivamente con Supabase. Si un guardado falla, se informa en pantalla (no se guarda a escondidas en el navegador). El modo demostración con datos ficticios solo existe en desarrollo local sin Supabase.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Estilos & UI** | Tailwind CSS v4, componentes shadcn/ui (Radix), Lucide React, Sonner |
| **Base de Datos & Auth** | Supabase (PostgreSQL con Row Level Security + Supabase Auth) |

---

## 📁 Estructura del Proyecto

```text
src/
├── app/providers.tsx        # Proveedores globales: rutas, datos (TanStack Query), tema, sesión, avisos
├── App.tsx                  # Rutas: /calendario, /auditoria, /reporte, /empleados, /configuracion
├── components/
│   ├── ui/                  # Componentes estándar (shadcn/ui): Button, Input, Dialog...
│   └── layout/              # Estructura: AppLayout, Navbar, ThemeProvider, logo
├── features/                # Una carpeta por área de negocio
│   ├── auth/                # Sesión (AuthProvider), permisos por rol, login, crear contraseña
│   ├── calendar/            # Calendario mensual
│   ├── records/             # Registro de horas: api.ts (Supabase), queries.ts (hooks), ventana de registro
│   ├── review/              # Auditoría de la Jefa
│   ├── report/              # Correo al contador, Excel y cierre de mes
│   ├── employees/           # Empleados y valor hora
│   └── settings/            # Datos de empresa, recargos y jornada
├── hooks/                   # Hooks compartidos (mes seleccionado en la URL)
├── lib/                     # Lógica pura con pruebas: horario, festivos, exportación; cliente Supabase
├── data/                    # Valores por defecto y datos demo (solo desarrollo)
└── types.ts                 # Tipos y reglas de recargo
supabase/                    # schema.sql, migraciones
.github/workflows/           # CI (chequeos en cada PR) y mantenimiento diario de la base
```

**Patrón de cada área:** `api.ts` habla con Supabase → `queries.ts` expone hooks de TanStack Query
(`useMonthRecords`, `useUpdateRecord`...) → `XxxPage.tsx` conecta los hooks con la vista → la vista solo dibuja.
Los avisos de error de cualquier guardado se muestran automáticamente (`lib/queryClient.ts`).

---

## ⚙️ Puesta en Marcha Local

### 1. Clonar e Instalar Dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd HorasExtras
npm install
```

### 2. Configurar Variables de Entorno

En local se trabaja **siempre contra la base de PRUEBAS**, nunca contra producción. Cree el archivo `.env.local`
(Git lo ignora) con los datos del proyecto `horas-extras-pruebas` (Supabase → Project Settings → API):

```env
VITE_SUPABASE_URL=<URL del proyecto horas-extras-pruebas>
VITE_SUPABASE_ANON_KEY=<anon key del proyecto de pruebas>
VITE_ENTORNO=pruebas
```

`VITE_ENTORNO=pruebas` muestra una franja amarilla "Entorno de pruebas" para no confundirse.
Sin variables de Supabase, en desarrollo se abre el modo demostración con datos ficticios en el navegador.

### 3. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000`.

### Entornos: pruebas y producción

| | Pruebas | Producción |
|---|---|---|
| Supabase | `horas-extras-pruebas` | `horas-extras` |
| Dónde se usa | Local (`.env.local`) y vistas previas de los PR en Vercel | `main` en Vercel (dominio de la empresa) |
| Datos | De prueba: se pueden borrar sin problema | **Reales**: nunca probar aquí |

Flujo de trabajo:
1. Los cambios se hacen en una rama y se prueban en local o en la vista previa del PR (base de pruebas).
2. Si un cambio toca la base de datos, la migración se aplica **primero en pruebas** y, cuando todo funciona, en producción.
3. Se hace merge a `main` y Vercel publica en producción.

En Vercel (Settings → Environment Variables) cada variable se guarda por entorno: en **Production** las claves de
producción; en **Preview** las de pruebas más `VITE_ENTORNO=pruebas`.

---

## 🗄️ Configuración de Supabase (Base de Datos)

> El esquema **no contiene datos de prueba**. Solo crea tablas, reglas de seguridad y la ficha de la empresa.
> La ficha de la empresa se crea con datos genéricos; los reales se completan desde la app (Configuración).
>
> **Este repositorio es público.** Nunca suba aquí claves (`.env`), contraseñas, ni datos reales de personas
> (nombres, cédulas, correos, valores hora). Esos datos viven solo en Supabase.

> **¿Ya tiene la base funcionando con una versión anterior?** Ejecute las migraciones que falten, en orden:
> [`migration_v3.sql`](./supabase/migration_v3.sql) y luego `schema.sql` completo (v2→v3); después
> [`migration_v5.sql`](./supabase/migration_v5.sql) (endurecimiento de seguridad). Ninguna borra datos.

1. Cree un proyecto en [Supabase](https://supabase.com) (plan gratuito). Use un proyecto **separado** para pruebas.
   - **Si reanuda un proyecto pausado** con la versión anterior: descargue un respaldo y ejecute primero
     [`supabase/reset_v1.sql`](./supabase/reset_v1.sql) (borra las tablas viejas; conserva los usuarios de Authentication).
2. En **SQL Editor**, ejecute todo [`supabase/schema.sql`](./supabase/schema.sql). Los usuarios que ya existían quedan como `supervisor`.
3. En **Authentication → Sign In / Providers**, desactive *Allow new users to sign up* (nadie puede registrarse solo).
4. En **Authentication → Users → Invite user**, invite a cada persona. Todos nacen con rol `supervisor`.
5. Asigne los roles en el SQL Editor:
   ```sql
   update public.profiles set role = 'admin'      where email = 'admin@empresa.co';
   update public.profiles set role = 'manager'    where email = 'jefa@empresa.co';
   update public.profiles set role = 'accountant' where email = 'contador@empresa.co';
   ```
6. En **Project Settings → API** copie `Project URL` y la clave `anon public`.

### Roles y permisos (aplicados en la base de datos, no solo en pantalla)

| | Supervisor (planta) | Jefa de Producción (`manager`) | Contador (`accountant`) | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Registrar horas | ✅ | ✅ | ❌ | ✅ |
| Ver calendario | ✅ | ✅ | ✅ | ✅ |
| Ver tarifas y valores ($) | ❌ | ✅ | ✅ | ✅ |
| Aprobar / editar / borrar registros | solo sus pendientes | ✅ | ❌ | ✅ |
| Crear y editar empleados | ❌ | ✅ | ❌ | ✅ |
| Cambiar valor hora | ❌ | ✅ | ✅ | ✅ |
| Reporte, Excel y "enviado a contabilidad" | ❌ | ✅ | ✅ | ✅ |
| Configuración (recargos, jornada, empresa) | ❌ | ✅ | ✅ | ✅ |

Las tarifas están en una tabla aparte (`employee_rates`) que el supervisor no puede leer ni siquiera consultando la base.
Cada registro guarda el porcentaje vigente al crearlo: cambiar los recargos no altera meses anteriores.

**Contraseñas:** cree cada usuario en *Authentication → Users → Add user → Create new user* (con *Auto Confirm User*) y
entréguele una contraseña temporal; al primer ingreso la app le obliga a crear la suya.

**Olvidó su contraseña:** la app no envía correos; la persona contacta al administrador, quien le asigna una contraseña
temporal desde el *SQL Editor* (al entrar, la app le pide crear una nueva). Use una contraseña distinta cada vez y
no la escriba en este repositorio (es público):
```sql
update auth.users
   set encrypted_password = extensions.crypt('<contraseña-temporal>', extensions.gen_salt('bf'))
 where email = 'persona@empresa.co';
update public.profiles set must_change_password = true where email = 'persona@empresa.co';
```

Protecciones adicionales: un empleado con horas registradas no se puede borrar (solo inactivar), los registros
marcados como enviados a contabilidad quedan bloqueados, la cédula es única y toda modificación queda en `audit_log`.

### Recargos configurables

En **Configuración → Recargos y Jornada Laboral** (Contador/Admin) se ajustan los porcentajes, el horario nocturno,
la salida ordinaria por día y si el sábado se paga como festivo. Valores por defecto según Ley 2466 de 2025:
extra diurna 25 %, extra nocturna 75 %, dominical/festiva diurna 115 %, dominical/festiva nocturna 165 %,
jornada nocturna 7:00 p. m. – 6:00 a. m. Los festivos de Colombia se calculan automáticamente.

### Plan gratuito: evitar la pausa y tener copias de seguridad

El workflow [`.github/workflows/supabase-mantenimiento.yml`](./.github/workflows/supabase-mantenimiento.yml) corre todos
los días: consulta la base (evita que Supabase pause el proyecto por inactividad) y guarda una copia cifrada por 90 días
en **GitHub → Actions → (ejecución) → Artifacts**. Configure en **Settings → Secrets and variables → Actions**:

| Secreto | Valor |
| :--- | :--- |
| `SUPABASE_URL` | URL del proyecto |
| `SUPABASE_ANON_KEY` | clave `anon public` |
| `SUPABASE_DB_URL` | cadena **Session pooler** de *Project Settings → Database → Connect* (con la contraseña) |
| `BACKUP_PASSPHRASE` | contraseña para cifrar las copias (guárdela fuera de GitHub) |

Para restaurar una copia: `gpg -d archivo.sql.gz.gpg | gunzip | psql "<cadena de conexión>"`.
Pruébelo manualmente una vez con **Actions → Run workflow**. Recomendación adicional: el contador descarga el Excel
de cada mes al cierre.

---

## 🚢 Despliegue en Vercel

1. En [Vercel](https://vercel.com), importe el repositorio (o abra el proyecto existente).
2. En **Settings → Environment Variables**, configure (sin comillas) `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. **Redeploy**. Si faltan las variables de Supabase, la app muestra un aviso y no opera (nunca usa datos locales).

---

## 📱 Instalar la app en el celular

La app es instalable (PWA): queda con ícono propio en la pantalla de inicio y se abre a pantalla completa.

- **iPhone (Safari):** abrir el enlace → botón **Compartir** (cuadro con flecha) → **Agregar a pantalla de inicio** → **Agregar**.
- **Android (Chrome):** abrir el enlace → menú **⋮** → **Instalar app** (o **Agregar a pantalla principal**).
- **PC (Chrome/Edge):** ícono de instalar en la barra de direcciones.

No guarda datos en el teléfono: todo se consulta y guarda en el servidor. Archivos: `public/manifest.webmanifest`,
`public/sw.js`, `public/icons/`.

## 🧩 Guía para desarrollar el frontend

**Componentes:** usar siempre los de [`src/components/ui/`](./src/components/ui) (estilo [shadcn/ui](https://ui.shadcn.com), basados en Radix):
`Button`, `Input`, `PasswordInput`, `NativeSelect`, `Textarea`, `Checkbox`, `Label`, `Field`, `Card`, `Badge`, `Dialog`, `AlertDialog`.
No crear botones, campos ni ventanas a mano.

**Colores y radios:** definidos una sola vez como variables en [`src/index.css`](./src/index.css) (modo claro y oscuro).
Usar las clases semánticas (`bg-background`, `bg-card`, `text-muted-foreground`, `border-input`, `bg-primary`…), no colores hexadecimales.

**Confirmaciones y avisos:**
```tsx
const confirm = useConfirm();                       // en lugar de window.confirm
if (await confirm({ title: '¿Eliminar?', destructive: true })) { ... }

toast.success('Guardado');                          // import { toast } from 'sonner'
toast.error('No se pudo guardar');
```

**Clases condicionales:** `cn('base', condicion && 'extra')` desde `@/lib/utils` (resuelve conflictos de Tailwind).

**Imports:** el alias `@/` apunta a `src/` (`import { Button } from '@/components/ui/button'`).

**Antes de subir cambios:** `npm run check` (tipos, lint, pruebas y compilación). El mismo chequeo corre automáticamente en cada PR.
Los cálculos de nómina tienen pruebas en `src/utils/*.test.ts`: si se cambia una regla, se actualiza o agrega su prueba.

## 📄 Scripts Disponibles

- `npm run dev`: servidor de desarrollo local.
- `npm run build`: compila para producción.
- `npm run typecheck`: valida tipos de TypeScript (modo estricto).
- `npm run lint`: ESLint.
- `npm run test`: pruebas de los cálculos (Vitest).
- `npm run check`: todo lo anterior junto.
- `npm run format`: formatea con Prettier.
