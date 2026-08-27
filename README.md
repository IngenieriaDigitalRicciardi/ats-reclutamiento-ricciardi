# ATS Reclutamiento

Scaffold inicial: React + Vite (frontend) + Supabase (BD/Auth) + Cloudflare Pages (hosting).

## Uso en Codespaces
1. Abrir el Codespace del repo (se levanta solo gracias a `.devcontainer/devcontainer.json`).
2. Copiar `.env.example` a `.env` y completar con las credenciales del proyecto de Supabase.
3. Correr `npm run dev` (ya debería haberse instalado solo al crear el Codespace).
4. Abrir la pestaña "Ports" y entrar al puerto 5173.

## Próximos pasos
- Autenticación con Microsoft Entra ID vía OIDC en Supabase.
- Modelado de tablas (empresas, sedes, candidatos, postulaciones, entrevistas, ingresos).
- Deploy a Cloudflare Pages.
