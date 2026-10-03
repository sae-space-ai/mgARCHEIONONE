# ARCHEION ONE

**Ecosistema universal de inteligencia artificial, automatización de procedimientos, gestión documental, análisis de evidencias, ejecución de tareas y generación de resultados verificables.**

- **Propietario:** Prof. Manuel Gago Fernández
- **Organización tecnológica de referencia:** SAE
- **Repositorio objetivo:** archeion-one
- **Cuenta GitHub:** pergolessi9-star

---

## Estado actual: Entrega 1 — Núcleo Operativo

### Implementado y verificado

- ✅ **Página pública** accesible sin autenticación (landing page)
- ✅ **Autenticación real** con registro, inicio de sesión y persistencia de sesiones
- ✅ **Organizaciones** multiempresa con pertenencia y roles
- ✅ **Sistema de permisos** con matriz de roles (Admin, Responsable, Especialista, Revisor, Colaborador, Lector)
- ✅ **Misiones** completas: creación, consulta, edición, transiciones de estado, criterios de aceptación
- ✅ **Sistema documental**: carga de archivos, validación de formato/tamaño, hash SHA-256, versionado, almacenamiento privado (IndexedDB), descarga autenticada
- ✅ **Tareas** con estados, dependencias, historial de cambios y criterios de aceptación
- ✅ **Evidencias**: afirmaciones tipificadas (hecho documentado, declaración, inferencia, opinión, hipótesis, no verificado)
- ✅ **Decisiones** con alternativas, justificación y registro
- ✅ **Aprobaciones** con centro de supervisión humana
- ✅ **Auditoría** completa con registro de todas las operaciones
- ✅ **Exportaciones reales**: PDF (jsPDF), ZIP (JSZip) con manifiesto e índice
- ✅ **Interfaz profesional** en español, responsive, accesible
- ✅ **Persistencia real** con IndexedDB (Dexie) — los datos sobreviven a reinicios

### Arquitectura

```
src/
├── App.tsx                    # Router principal
├── main.tsx                   # Entry point
├── index.css                  # Estilos base
├── lib/
│   ├── types.ts               # Sistema de tipos, permisos, constantes
│   ├── store.ts               # Persistencia con Dexie (IndexedDB)
│   ├── auth.tsx               # Contexto de autenticación
│   └── exports.ts             # Motor de exportaciones (PDF, ZIP, CSV, JSON)
├── components/
│   └── Layout.tsx             # Layout principal con navegación
└── pages/
    ├── LandingPage.tsx        # Página pública
    ├── LoginPage.tsx          # Autenticación
    ├── DashboardPage.tsx      # Panel de control
    ├── MissionsPage.tsx       # Listado y creación de misiones
    ├── MissionDetailPage.tsx  # Detalle de misión (documentos, tareas, exportaciones)
    ├── DocumentsPage.tsx      # Gestión documental organizativa
    ├── TasksPage.tsx          # Vista global de tareas
    ├── EvidencePage.tsx       # Afirmaciones y evidencias
    ├── DecisionsPage.tsx      # Registro de decisiones
    ├── ApprovalsPage.tsx      # Centro de aprobaciones
    ├── ExportsPage.tsx        # Centro de resultados descargables
    ├── AuditPage.tsx          # Registro de auditoría
    └── AdminPage.tsx          # Administración
```

### Dependencias

- **react**, **react-dom** — Interfaz
- **react-router-dom** — Enrutamiento
- **typescript** — Tipado estricto
- **tailwindcss** — Estilos
- **dexie** — Persistencia IndexedDB
- **jspdf** — Generación de PDF
- **jszip** — Generación de archivos ZIP
- **file-saver** — Descargas de archivos
- **lucide-react** — Iconos
- **uuid** — Identificadores únicos
- **date-fns** — Manipulación de fechas
- **framer-motion** — Animaciones

### Comandos

```bash
# Instalación
npm install

# Desarrollo
npm run dev

# Compilación
npm run build

# Verificación de tipos
npm run typecheck
```

### Variables de entorno necesarias (para despliegue con backend)

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=...
AI_PROVIDER=qwen
AI_ENDPOINT=https://...
AI_API_KEY=***
STORAGE_PROVIDER=local|s3
MAX_FILE_SIZE=52428800
```

> **Nota:** Los valores reales se configuran en el entorno de despliegue. Nunca se incorporan al repositorio.

---

## Entregas planificadas

| Entrega | Objetivo | Estado |
|---------|----------|--------|
| 0 | Inspección y diagnóstico | ✅ Completada |
| 1 | Núcleo operativo | ✅ Implementada |
| 2 | Motor ARCHEION (evidencias avanzadas) | Pendiente |
| 3 | SAE (gobernanza de IA) | Pendiente |
| 4 | Orquestación y BGOS | Pendiente |
| 5 | FIRECYCLE EXTREM | Pendiente |
| 6 | RECIPRA y RECIPRA-MEDIA | Pendiente |
| 7 | Prisma Sonoro | Pendiente |
| 8 | Integración general | Pendiente |
| 9 | GitHub y Vercel | Pendiente |

---

## Bloqueos y dependencias externas

| Dependencia | Estado | Acción necesaria |
|-------------|--------|-----------------|
| PostgreSQL / Supabase | No configurado | Crear base de datos y configurar variables |
| Motor de IA (Qwen) | No configurado | Obtener acceso a API o instancia local |
| Almacenamiento de objetos (S3) | No configurado | Configurar bucket privado |
| GitHub (repositorio archeion-one) | No creado | Crear repositorio en pergolessi9-star |
| Vercel (despliegue) | No configurado | Conectar repositorio y variables |

---

## Seguridad

- Contraseñas hasheadas con SHA-256 + salt
- Sesiones con tokens y caducidad
- Permisos verificados en cada operación del servidor (simulado en cliente para esta entrega)
- Documentos tratados como contenido no confiable
- Sin claves ni secretos en el repositorio
- Validación de extensión, tipo y tamaño de archivos

---

*ARCHEION ONE v1.0.0-alpha · Idioma: español · Preparado para internacionalización*
