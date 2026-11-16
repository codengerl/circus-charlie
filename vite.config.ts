import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(env.PORT || env.VITE_PORT || '5020', 10);

  return {
    server: {
      port,
      strictPort: true,
      host: '127.0.0.1',
    },
    build: {
      outDir: 'dist',
      target: 'es2022',
      sourcemap: true,
    },
    base: './',
  };
});
