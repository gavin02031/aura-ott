import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  // Ensure Vite treats this folder as the project root (serves index.html at /).
  root: '.',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Allow tunnel hostnames (Vite blocks unknown Host headers by default).
    allowedHosts: [
      // localhost
      'localhost',
      '127.0.0.1',

      // ngrok
      '.ngrok-free.dev',
      '.ngrok.io',

      // localtunnel
      '.loca.lt',

      // Cloudflare quick tunnels
      '.trycloudflare.com'
    ]
  },
  preview: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.dev',
      '.ngrok.io',
      '.loca.lt',
      '.trycloudflare.com'
    ]
  }
});

