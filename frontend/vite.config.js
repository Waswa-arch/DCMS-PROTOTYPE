import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forces Vite to fall back to safe WebVite runtime if OS channels are restricted
    fs: {
      strict: false
    }
  }
});