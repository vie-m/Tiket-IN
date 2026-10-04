import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server forwards /api/* to the Express server, so the browser sees one origin.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
