import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are linked correctly on GitHub Pages
  build: {
    outDir: 'dist',
  },
  define: {
    // This allows the existing code using process.env to work in production
    'process.env': {
      NODE_ENV: 'production',
      // Add any public keys here if needed, or rely on the build system
      REACT_APP_SUPABASE_URL: '', 
      REACT_APP_SUPABASE_ANON_KEY: '',
      API_KEY: '' 
    }
  }
});