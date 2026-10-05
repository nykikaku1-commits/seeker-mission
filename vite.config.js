import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
  plugins: [react()],
server: {
  allowedHosts: ['.trycloudflare.com'],
  proxy: {
    '/api/solana-rpc': {
    target: 'https://mainnet.helius-rpc.com',
      changeOrigin: true,
rewrite: () => `/?api-key=${env.HELIUS_API_KEY}`,
    },
  },
},
  }
})
