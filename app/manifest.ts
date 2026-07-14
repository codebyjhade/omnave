import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Omnave',
    short_name: 'Omnave',
    description: 'AI-Powered Study Platform',
    start_url: '/home',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#121212',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}