# ⏱️ Control de Horas Extras & Conciliación de Nómina

Sistema web empresarial para el registro, cálculo automático, auditoría de planta y generación de reportes oficiales de **horas extras** para contabilidad y nómina, con automatización de correos para Gmail y exportación a Excel.

Diseñado con una arquitectura moderna desacoplada: **Frontend en React 19**, **Serverless en Vercel** y **Base de Datos en Supabase (PostgreSQL)**.

---

## 🚀 Características Principales

- **Cálculo Inteligente de Jornada:** Deduce automáticamente las horas extras a partir de la hora de salida real y los horarios oficiales de la empresa (Lunes a Viernes 7:30 AM – 5:00 PM, Miércoles 7:30 AM – 4:30 PM, Fines de semana).
- **Tipos de Recargos Colombianos / Laborales:**
  - Extra Diurna (25%)
  - Extra Nocturna (75%)
  - Festiva / Dominical Diurna (100%)
  - Festiva / Dominical Nocturna (150%)
- **Módulo de Auditoría y Verificación:** Permite al encargado de planta o supervisor conciliar, editar y aprobar registros antes de consolidarlos para contabilidad.
- **Automatización de Correo para Gmail:** Genera una tabla estilizada en formato HTML enriquecido lista para copiar directamente al portapapeles (`Ctrl + V`) y pegar en Gmail Web o cliente de correo.
- **Asistente de Auditoría con IA (Gemini):** Redacta notas ejecutivas de cierre y detecta empleados con altas concentraciones de horas extras.
- **Exportación Contable:** Descarga de reportes detallados en formato CSV/Excel listos para procesar nómina.
- **Arquitectura Nube Dual (Zero-Crash):** Funciona en modo nube multiusuario con Supabase o en modo local mediante almacenamiento del navegador si aún no se han configurado las claves.

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
│   │   ├── AuthModal.tsx       # Inicio de sesión y registro (Supabase Auth)
│   │   ├── CalendarView.tsx    # Vista de calendario mensual interactivo
│   │   ├── CompanySettingsView.tsx # Datos fiscales de empresa y contactos
│   │   ├── EmployeeManager.tsx # Gestión de empleados, cédulas y tarifas
│   │   ├── GmailReportBuilder.tsx # Diseñador de correos y exportador
│   │   ├── ManagerReviewView.tsx  # Panel de auditoría del encargado
│   │   └── Navbar.tsx          # Barra superior con estado de sincronización
│   ├── data/                   # Datos semilla para modo local inicial
│   ├── lib/
│   │   └── supabase.ts         # Cliente singleton y detector de conexión
│   ├── services/               # Capa de acceso a datos asíncrona
│   │   ├── companyService.ts   # Configuración de empresa
│   │   ├── employeesService.ts # CRUD de empleados
│   │   └── recordsService.ts   # CRUD y conciliación de horas extras
│   ├── utils/
│   │   ├── exporters.ts        # Generador de tablas HTML para Gmail y CSV
│   │   ├── schedule.ts         # Reglas de jornada laboral y cálculos
│   │   └── storage.ts          # Caché y persistencia fallback local
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

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Dirígete a la sección **SQL Editor** en el panel izquierdo.
3. Copia y ejecuta todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
4. Ve a **Project Settings -> API** y obtén:
   - `Project URL` -> `VITE_SUPABASE_URL`
   - `anon public key` -> `VITE_SUPABASE_ANON_KEY`

---

## 🚢 Despliegue en Vercel

1. Sube tu código a GitHub.
2. En [Vercel](https://vercel.com), importa el repositorio.
3. En la sección **Environment Variables**, añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Presiona **Deploy**. Vercel compilará automáticamente con `npm run build` y habilitará las rutas serverless bajo `/api`.

---

## 📄 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo local.
- `npm run build`: Compila el frontend optimizado con Vite para producción.
- `npm run lint`: Valida tipos de TypeScript con `tsc --noEmit`.
