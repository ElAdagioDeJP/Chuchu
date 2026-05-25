@AGENTS.md

# Chuchu - Guía rápida para agentes

## Contexto
- SaaS multi-tenant de menu digital para snack shops/candy shops.
- Idioma de la UI: **espanol** (responder en espanol).
- Deploy: **Vercel**.
- Gestor de paquetes: **pnpm** (no usar `npm`).

## Stack base
- **Frontend:** Next.js 16 (App Router, Turbopack, React Compiler), React 19, TypeScript strict.
- **Estilos:** Tailwind CSS v4 con tokens en `src/app/globals.css`.
- **Backend BaaS:** Supabase (Postgres, Auth, Storage).
- **Animacion/UI:** GSAP + `@gsap/react` (`useGSAP`), Swiper para TV menu.
- `framer-motion` existe en el repo, pero el codigo nuevo debe usar GSAP.

## Tokens de color
- `primary`: `#8e44ad`
- `secondary`: `#f06292`
- `tertiary`: `#4dd0e1`
- `cuaternary`: `#fff176`
- `quinary`: `#d81b60`

## Rutas y roles
- `/login`: login email/password con Supabase Auth y redireccion por rol.
- `/owner`: consola owner para crear/eliminar empresas (name, logo, admin email+password).
- `/admin`: panel tenant (scope por `company_id`) con tabs:
  `Ventas & Combos`, `Inventario`, `Sugerencias IA`, `Reportes`, `Ajustes`.
- `/display/<slug>`: TV menu publico por tenant, solo combos con `on_tv=true`, auto-refresh cada 20s.
- `/`: redireccion por sesion/rol.

## Modelo de datos (`supabase/schema.sql`)
- Tablas: `companies`, `profiles`, `products`, `combos`, `combo_items`, `sales`.
- `profiles.role`: `owner` | `admin`.
- Aislamiento tenant via RLS con `current_company_id()` e `is_owner()`.
- Bucket `logos`: lectura publica; uploads via server usando service-role.

## Clientes Supabase (`src/lib/supabase/`)
- `client.ts`: cliente browser con publishable key.
- `server.ts`: cliente server para server components/actions con sesion por cookies.
- `admin.ts`: **service-role (solo server)**, bypass RLS.
  Uso: owner ops, uploads de logos y `UPDATE` de `companies`.
- `middleware.ts` (lib) + `middleware.ts` (root): refresh de sesion y guardas de ruta.

## Guia rapida: donde esta cada cosa

| Si buscas... | Revisar archivo(s) |
| --- | --- |
| Modelo SQL, RLS, tablas y politicas | `supabase/schema.sql` |
| Variables de entorno requeridas | `.env.local` |
| Cliente Supabase browser/server/admin | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts` |
| Middleware de sesion y proteccion de rutas | `src/lib/supabase/middleware.ts` y `middleware.ts` |
| Tipos compartidos de dominio | `src/lib/types.ts` |
| Helper de sesion y empresa actual | `src/lib/auth.ts` |
| Mutaciones por formulario y server actions | `src/app/**/actions.ts` |
| Logica de sugerencias IA de combos | `src/lib/algorithm.ts` |
| Vista login | `src/app/login/page.tsx` |
| Vista owner | `src/app/owner/page.tsx` y `src/app/owner/actions.ts` |
| Vista admin | `src/app/admin/page.tsx` y componentes en `src/app/admin/` |
| Vista display por slug | `src/app/display/[slug]/page.tsx` |
| Estilos y tokens de color | `src/app/globals.css` |
| Configuracion Next.js | `next.config.ts` |
| Scripts y dependencias | `package.json` |

> Tip: empieza por la ruta en `src/app/` y luego revisa su `actions.ts` para entender el flujo completo.

## Convenciones clave
- Mutaciones via **Server Actions** (`src/app/*/actions.ts`) y formularios `<form action={...}>`.
- Toda mutacion debe invalidar cache con `revalidatePath` cuando aplique.
- CRUD tenant usa cliente RLS-scoped del usuario logueado.
- Operaciones owner/cross-tenant usan `admin.ts` (service-role).
- `recordSale`/`sellCombo` descuentan stock + insertan fila en `sales`.
- Algoritmo de rotacion en `src/lib/algorithm.ts`:
  ventas 30d -> velocidad -> pairing fast+slow -> sugerencia combo con 15% off.
- Tipos compartidos en `src/lib/types.ts`; helper de sesion/empresa en `src/lib/auth.ts`.
- `next/image` permite logos remotos `*.supabase.co` en `next.config.ts`.

## Variables de entorno (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (**secreta**)

> Las mismas 3 variables deben existir en Vercel.

## Bootstrap owner (una sola vez)
1. Crear usuario en Supabase Auth (auto-confirmado).
2. Insertar perfil owner:

```sql
insert into profiles (id, email, role)
values ('<uuid>', '<email>', 'owner');
```

Ver bloque de comentarios al final de `supabase/schema.sql`.

## Comandos frecuentes
- `pnpm dev` - desarrollo local.
- `pnpm build` - build de produccion (incluye typecheck).
