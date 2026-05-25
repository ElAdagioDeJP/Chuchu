@CLAUDE.md

# Chuchu - Guia operativa para Claude

## Contexto del proyecto
- SaaS multi-tenant de menu digital para snack shops/candy shops.
- Idioma de la UI: **espanol**. Responder siempre en espanol.
- Deploy: **Vercel**.
- Gestor de paquetes: **pnpm** (no usar `npm`).

## Stack y dependencias clave
- **Frontend:** Next.js 16 (App Router, Turbopack, React Compiler), React 19, TypeScript strict.
- **Estilos:** Tailwind CSS v4, tokens en `src/app/globals.css`.
- **Backend:** Supabase (Postgres, Auth, Storage).
- **Animacion:** GSAP + `@gsap/react` (`useGSAP`) y Swiper para el TV menu.
- `framer-motion` existe en el repo, pero el codigo nuevo debe usar GSAP.

## Paleta oficial
- `primary`: `#8e44ad`
- `secondary`: `#f06292`
- `tertiary`: `#4dd0e1`
- `cuaternary`: `#fff176`
- `quinary`: `#d81b60`

## Rutas principales
- `/login`: login email/password con Supabase Auth y redireccion por rol.
- `/owner`: consola owner para crear/eliminar empresas (name, logo, admin email+password).
- `/admin`: panel tenant por `company_id` con tabs `Ventas & Combos`, `Inventario`, `Sugerencias IA`, `Reportes`, `Ajustes`.
- `/display/<slug>`: TV menu publico por tenant, solo combos con `on_tv=true`, auto-refresh cada 20s.
- `/`: redireccion por sesion/rol.

## Modelo de datos (`supabase/schema.sql`)
- Tablas: `companies`, `profiles`, `products`, `combos`, `combo_items`, `sales`.
- `profiles.role`: `owner` | `admin`.
- Tenant isolation por RLS con `current_company_id()` e `is_owner()`.
- Bucket `logos`: lectura publica; uploads via servidor con service-role.

## Clientes Supabase (`src/lib/supabase/`)
- `client.ts`: browser client con publishable key.
- `server.ts`: cliente server para server components/actions con sesion en cookies.
- `admin.ts`: **service-role (solo server)**, bypass RLS.
  Usar para operaciones owner/cross-tenant, upload de logos y `UPDATE` de `companies`.
- `middleware.ts` (lib) + `middleware.ts` (root): refresh de sesion y guardas de rutas.

## Guia rapida: donde encontrar informacion

| Si buscas... | Revisar archivo(s) |
| --- | --- |
| Modelo SQL, RLS, tablas y politicas | `supabase/schema.sql` |
| Variables de entorno requeridas | `.env.local` |
| Cliente Supabase browser/server/admin | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts` |
| Middleware de autenticacion y proteccion de rutas | `src/lib/supabase/middleware.ts` y `middleware.ts` |
| Tipos compartidos de dominio | `src/lib/types.ts` |
| Helper de sesion/empresa | `src/lib/auth.ts` |
| Mutaciones por formularios | `src/app/**/actions.ts` |
| Algoritmo de sugerencias IA de combos | `src/lib/algorithm.ts` |
| Pagina login | `src/app/login/page.tsx` |
| Pagina owner | `src/app/owner/page.tsx` y `src/app/owner/actions.ts` |
| Pagina admin | `src/app/admin/page.tsx` y componentes en `src/app/admin/` |
| Display TV por slug | `src/app/display/[slug]/page.tsx` |
| Estilos globales y tokens | `src/app/globals.css` |
| Configuracion Next.js | `next.config.ts` |
| Scripts y dependencias | `package.json` |

> Tip: para entender un flujo rapido, ubica la ruta en `src/app/` y luego su `actions.ts`.

## Convenciones de implementacion
- Usar **Server Actions** en `src/app/*/actions.ts` y `<form action={...}>` para mutaciones.
- Ejecutar `revalidatePath` tras mutaciones cuando corresponda.
- CRUD tenant: cliente RLS-scoped del usuario logueado.
- Operaciones owner/cross-tenant: `admin.ts` (service-role).
- `recordSale` y `sellCombo`: descuentan stock e insertan fila en `sales`.
- Algoritmo en `src/lib/algorithm.ts`: ventas 30d -> velocidad -> pairing fast+slow -> combo con 15% off.
- Tipos compartidos: `src/lib/types.ts`; helper de sesion/empresa: `src/lib/auth.ts`.
- `next/image` permite logos remotos `*.supabase.co` en `next.config.ts`.

## Variables de entorno (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (**secreta**)

> Configurar las mismas 3 variables tambien en Vercel.

## Bootstrap de owner (solo una vez)
1. Crear usuario en Supabase Auth (auto-confirmado).
2. Insertar perfil owner:

```sql
insert into profiles (id, email, role)
values ('<uuid>', '<email>', 'owner');
```

Referencia: comentarios al final de `supabase/schema.sql`.

## Comandos utiles
- `pnpm dev` - desarrollo local.
- `pnpm build` - build de produccion (incluye typecheck).
- `pnpm lint` - lint del proyecto.
