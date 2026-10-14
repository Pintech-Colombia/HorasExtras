# ⏱️ Control de Horas Extras & Conciliación de Nómina

Sistema web empresarial para el registro, cálculo automático, auditoría de planta y generación de reportes oficiales de **horas extras** para contabilidad y nómina, con automatización de correos para Gmail y exportación a Excel.

Diseñado con una arquitectura moderna desacoplada: **Frontend en React 19**, **Serverless en Vercel** y **Base de Datos en Supabase (PostgreSQL)**.

---

## 🚀 Características Principales

- **Cálculo Inteligente de Jornada:** Deduce automáticamente las horas extras a partir de la hora de salida real y los horarios oficiales de la empresa (Lunes a Viernes 7:30 AM – 5:00 PM, Miércoles 7:30 AM – 4:30 PM, Fines de semana).
- **Recargos configurables (Ley 2466 de 2025 por defecto):** Extra diurna 25 %, extra nocturna 75 %, dominical/festiva diurna 115 %, dominical/festiva nocturna 165 %. Separa automáticamente horas diurnas y nocturnas y detecta festivos de Colombia.
- **Módulo de Auditoría y Verificación:** Permite al encargado de planta o supervisor conciliar, editar y aprobar registros antes de consolidarlos para contabilidad.
- **Automatización de Correo para Gmail:** Genera una tabla estilizada en formato HTML enriquecido lista para copiar directamente al portapapeles (`Ctrl + V`) y pegar en Gmail Web o cliente de correo.
- **Asistente de Auditoría con IA (Gemini):** Redacta notas ejecutivas de cierre y detecta empleados con altas concentraciones de horas extras.
- **Exportación Contable:** Descarga de reportes detallados en formato CSV/Excel listos para procesar nómina.
- **Datos solo en la nube:** En producción trabaja exclusivamente con Supabase. Si un guardado falla, se informa en pantalla (no se guarda a escondidas en el navegador). El modo demostración con datos ficticios solo existe en desarrollo local sin Supabase.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Estilos & UI** | Tailwind CSS v4, Lucide React, Motion |
| **Backend Serverless** | Vercel Serverless Functions (`api/ai/generate-summary.ts`) |
| **Base de Datos & Auth** | Supabase (PostgreSQL con Row Level Security + Supabase Auth) |
| **Inteligencia Artificial** | Google Gemini 2.5 Flash (`@google/genai`) |

---

## 📁 Estructura del Proyecto

```text
├── api/                        # Funciones Serverless de Vercel
│   └── ai/
│       └── generate-summary.ts # Generador de resúmenes de auditoría con Gemini
├── public/                     # Archivos estáticos públicos
├── src/
│   ├── components/             # Componentes de la interfaz de usuario
│   │   ├── AddOvertimeModal.tsx# Modal de registro con cálculo automático
│   │   ├── CalendarView.tsx    # Vista de calendario mensual interactivo
│   │   ├── CompanySettingsView.tsx # Datos fiscales de empresa y contactos
│   │   ├── EmployeeManager.tsx # Gestión de empleados, cédulas y tarifas
│   │   ├── GmailReportBuilder.tsx # Diseñador de correos y exportador
│   │   ├── ManagerReviewView.tsx  # Panel de auditoría del encargado
│   │   └── Navbar.tsx          # Barra superior con estado de sincronización
│   ├── data/                   # Valores por defecto y datos demo (solo desarrollo)
│   ├── lib/
│   │   └── supabase.ts         # Cliente singleton y detector de conexión
│   ├── services/               # Capa de acceso a datos asíncrona
│   │   ├── companyService.ts   # Configuración de empresa
│   │   ├── employeesService.ts # CRUD de empleados
│   │   └── recordsService.ts   # CRUD y conciliación de horas extras
│   ├── utils/
│   │   ├── exporters.ts        # Generador de tablas HTML para Gmail y CSV
│   │   ├── schedule.ts         # Reglas de jornada laboral y cálculos
│   │   ├── holidays.ts         # Festivos de Colombia (Ley Emiliani)
│   │   └── storage.ts          # Persistencia local del modo demo (solo desarrollo)
│   ├── App.tsx                 # Componente principal y gestor de estado
│   ├── index.css               # Estilos globales con Tailwind CSS v4
│   └── main.tsx                # Entrada React
├── supabase/
│   └── schema.sql              # Script DDL de PostgreSQL con RLS y triggers
├── vercel.json                 # Configuración de enrutamiento SPA para Vercel
└── package.json                # Dependencias y scripts de construcción
```

---

## ⚙️ Puesta en Marcha Local

### 1. Clonar e Instalar Dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd HorasExtras
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo y completa tus claves:

```bash
cp .env.example .env
```

Contenido del archivo `.env`:
```env
# Supabase (Opcional para modo local, requerido para sincronización en la nube)
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu_supabase_anon_key"

# Google Gemini (Para generar síntesis de correo con IA)
GEMINI_API_KEY="tu_gemini_api_key"
```

### 3. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

Abre tu navegador en `http://localhost:3000` (o el puerto indicado en la consola).

---

## 🗄️ Configuración de Supabase (Base de Datos)

> El esquema **no contiene datos de prueba**. Solo crea tablas, reglas de seguridad y la ficha de la empresa.
> Verifique el NIT y el correo del contador al final de `supabase/schema.sql` antes de ejecutarlo.

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

| Rol | Puede |
| :--- | :--- |
| `supervisor` | Registrar horas (quedan pendientes) y borrar solo sus registros pendientes |
| `manager` (Jefa) | Aprobar/editar/borrar registros, crear y editar empleados (sin tarifas) |
| `accountant` (Contador) | Ver todo, editar registros, fijar tarifas y configurar recargos y jornada |
| `admin` | Todo, incluido eliminar empleados sin historial y cambiar roles |

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
2. En **Settings → Environment Variables**, configure:
   - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (del proyecto nuevo)
   - `GEMINI_API_KEY` (opcional; sin ella el correo usa una plantilla fija) y `GEMINI_MODEL` (opcional, por defecto `gemini-2.5-flash`)
3. **Redeploy**. Si faltan las variables de Supabase, la app muestra un aviso y no opera (nunca usa datos locales).

---

## 📄 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo local.
- `npm run build`: Compila el frontend optimizado con Vite para producción.
- `npm run lint`: Valida tipos de TypeScript con `tsc --noEmit`.
