import {defineConfig, loadEnv} from 'vite';

// Reject privileged or incomplete configuration BEFORE Vite can embed it.
// The error deliberately contains neither the key nor its value.
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const url = (env.VITE_SUPABASE_URL || '').trim();
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  if ((url || key) && (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))) {
    throw new Error('Supabase configuration rejected: use a managed HTTPS project URL and its PUBLIC sb_publishable key together. Never supply an admin/secret key.');
  }
  return {};
});
