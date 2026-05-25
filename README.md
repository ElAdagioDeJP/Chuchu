# Chuchu

SaaS multi-tenant de menus digitales para snack shops/candy shops.

## Caracteristicas
- Login con Supabase Auth y redireccion por rol (`owner` / `admin`).
- Consola `owner` para crear y eliminar empresas.
- Panel `admin` por tenant con gestion de productos, combos, inventario y reportes.
- TV menu publico por empresa en `/display/<slug>` con auto-refresh cada 20s.
- Motor de sugerencias de combos basado en ventas de los ultimos 30 dias.

## Stack tecnologico
- Next.js 16 (App Router, Turbopack, React 19, TypeScript strict).
- Tailwind CSS v4.
- Supabase (Postgres, Auth, Storage).
- GSAP + `@gsap/react` para animaciones.

## Arquitectura funcional

### Rutas clave
- `/login`: autenticacion email/password.
- `/owner`: administracion global de empresas (solo owner).
- `/admin`: administracion por tenant (`company_id`).
- `/display/<slug>`: menu publico para pantalla/TV.
- `/`: redireccion segun sesion y rol.

### Modelo de datos
Definido en `supabase/schema.sql`:
- `companies`
- `profiles` (`role`: `owner` | `admin`)
- `products`
- `combos`
- `combo_items`
- `sales`

El aislamiento multi-tenant se aplica con RLS usando `current_company_id()` e `is_owner()`.

### Clientes Supabase
Ubicados en `src/lib/supabase/`:
- `client.ts`: cliente browser (publishable key).
- `server.ts`: cliente server con sesion por cookies.
- `admin.ts`: service-role solo server (bypass RLS) para operaciones owner/cross-tenant.

## Guia rapida: donde encontrar cada cosa

| Si buscas... | Revisar archivo(s) |
| --- | --- |
| Modelo SQL, RLS, tablas y politicas | `supabase/schema.sql` |
| Variables de entorno requeridas | `.env.local` y `README.md` |
| Cliente Supabase browser/server/admin | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts` |
| Middleware de autenticacion y proteccion de rutas | `src/lib/supabase/middleware.ts` y `middleware.ts` |
| Tipos compartidos de dominio | `src/lib/types.ts` |
| Helper de sesion/empresa actual | `src/lib/auth.ts` |
| Acciones de formularios (mutaciones) por pagina | `src/app/**/actions.ts` |
| Logica de sugerencias IA/rotacion de combos | `src/lib/algorithm.ts` |
| Pagina de login | `src/app/login/page.tsx` |
| Panel owner | `src/app/owner/page.tsx` y `src/app/owner/actions.ts` |
| Panel admin y tabs | `src/app/admin/page.tsx` y componentes dentro de `src/app/admin/` |
| TV menu publico por slug | `src/app/display/[slug]/page.tsx` |
| Estilos globales y tokens de color | `src/app/globals.css` |
| Configuracion Next.js (imagenes remotas, etc.) | `next.config.ts` |
| Scripts y dependencias del proyecto | `package.json` |

> Tip: para ubicar rapidamente cualquier flujo, empieza por la ruta en `src/app/` y luego revisa su `actions.ts` asociado.

## Requisitos
- Node.js 20+ recomendado.
- pnpm instalado globalmente.
- Proyecto Supabase configurado.

## Variables de entorno
Crear `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> Usa estas mismas variables en el entorno de Vercel.

## Instalacion y desarrollo

```bash
pnpm install
pnpm dev
```

Abrir `http://localhost:3000`.

## Scripts disponibles
- `pnpm dev`: inicia entorno de desarrollo.
- `pnpm build`: genera build de produccion.
- `pnpm start`: levanta la app en modo produccion.
- `pnpm lint`: ejecuta linting.

## Bootstrap del owner (una sola vez)
1. Crear el usuario owner en Supabase Auth (auto-confirmado).
2. Insertar el perfil owner:

```sql
insert into profiles (id, email, role)
values ('<uuid>', '<email>', 'owner');
```

Ver detalles adicionales al final de `supabase/schema.sql`.

## Deploy
- Plataforma objetivo: **Vercel**.
- Antes de desplegar, validar que las 3 variables de entorno esten configuradas.
