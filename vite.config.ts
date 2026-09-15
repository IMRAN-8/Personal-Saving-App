import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    process.env.VITE_FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
    process.env.VITE_FIREBASE_AUTH_DOMAIN = process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain;
    process.env.VITE_FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    process.env.VITE_FIREBASE_STORAGE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId;
    process.env.VITE_FIREBASE_APP_ID = process.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId;
  }
} catch (e) {
  // Ignore
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
