import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Sur GitHub Pages le site est servi sous /<nom-du-depot>/ (voir .github/workflows/deploy.yml)
const base = process.env.BASE_PATH ?? '/'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont obligatoires (voir .env.example).')
  }
  // Nom de l'environnement, pour s'y retrouver :
  //  - production (branche main, GitHub Actions)  -> "SquadLift"
  //  - branche develop (Cloudflare)               -> "SquadLift DEV"
  //  - branche feature/xxx (Cloudflare preview)   -> "SquadLift PREVIEW xxx"
  //  - en local avec VITE_APP_ENV=dev             -> "SquadLift DEV"
  // WORKERS_CI_BRANCH est fournie automatiquement par Cloudflare Workers Builds.
  const branch = process.env.WORKERS_CI_BRANCH ?? ''
  const feature = branch.replace(/^feature\//, '').replace(/[^\w\-./]/g, '')
  let label = ''
  let shortLabel = ''
  if (branch && branch !== 'main') {
    label = branch === 'develop' ? 'DEV' : `PREVIEW ${feature}`
    shortLabel = branch === 'develop' ? 'SL DEV' : `SL ${feature}`.slice(0, 12)
  } else if (!branch && env.VITE_APP_ENV === 'dev') {
    label = 'DEV'
    shortLabel = 'SL DEV'
  }
  const appName = label ? `SquadLift ${label}` : 'SquadLift'
  const shortName = shortLabel || 'SquadLift'

  return {
  base,
  define: { __APP_LABEL__: JSON.stringify(label) },
  plugins: [
    react(),
    {
      // Le titre de l'onglet du navigateur affiche aussi le nom de l'environnement
      name: 'app-title',
      transformIndexHtml: (html: string) =>
        html.replace(/<title>.*<\/title>/, `<title>${appName}</title>`).replace(
          /(name="apple-mobile-web-app-title" content=")[^"]*/,
          `$1${shortName}`,
        ),
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: appName,
        short_name: shortName,
        description: 'Log your lifts and compare with your squad.',
        theme_color: '#050608',
        background_color: '#050608',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
}
})
