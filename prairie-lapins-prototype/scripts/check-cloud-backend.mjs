// Hosted, anonymous integration checks. No email, session, user save or admin key.
import assert from 'node:assert/strict';
const url = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const key = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
if (!url && !key) {
  console.log('Hosted backend checks NOT RUN: preview configuration absent.');
  process.exit(0);
}
assert.ok(/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url), 'Managed HTTPS project required');
assert.ok(/^sb_publishable_[A-Za-z0-9_-]+$/.test(key), 'Public publishable key required');
async function request(path, extra = {}) {
  const response = await fetch(url + path, {
    ...extra,
    headers: {apikey: key, ...extra.headers},
    signal: AbortSignal.timeout(20000),
  });
  let body;
  try {body = await response.json();} catch {body = null;}
  return {status: response.status, body};
}
function denied(result, label) {
  // Permission denial, not an absent table/function or merely an empty RLS result.
  assert.ok([401, 403].includes(result.status) && result.body?.code === '42501',
    `${label}: expected owner-only permission denial; HTTP ${result.status}, code ${result.body?.code || 'unknown'}`);
}
const settings = await request('/auth/v1/settings');
assert.equal(settings.status, 200, 'Hosted Auth settings must be reachable with the public key');
assert.equal(settings.body?.external?.email, true, 'Email authentication must be enabled');
for (const table of ['prairie_saves', 'prairie_history']) {
  denied(await request(`/rest/v1/${table}?select=owner_id&limit=1`), `Anonymous ${table} read`);
}
const operation = crypto.randomUUID();
denied(await request('/rest/v1/rpc/prairie_commit', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({p_owner:'00000000-0000-4000-8000-000000000001',p_expected:0,p_operation:operation,p_state:null,p_reason:'initial',p_checkpoints:[]}),
}), 'Anonymous save RPC');
// Null state is intentionally invalid too: this can never create a usable save.
denied(await request('/rest/v1/prairie_saves', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({owner_id:'00000000-0000-4000-8000-000000000001',state:null,format:4,revision:1,operation_id:operation}),
}), 'Anonymous direct insert');
const privateSchema = await request('/rest/v1/operations?select=owner_id&limit=1', {headers:{'Accept-Profile':'prairie_private'}});
assert.ok(privateSchema.status === 406 && privateSchema.body?.code === 'PGRST106',
  `Private schema must not be exposed; HTTP ${privateSchema.status}, code ${privateSchema.body?.code || 'unknown'}`);
console.log(JSON.stringify({hostedAnonymousChecks:'passed',emailProviderEnabled:true,currentAndHistoryReadsDenied:true,rpcDenied:true,directInsertDenied:true,privateSchemaNotExposed:true,realEmailSent:false,authenticatedOwnerIsolationTested:false,authenticatedSaveTested:false}));
