// Disposable Chromium check, no personal data and no hosted Auth mocked as real.
// node docs/accounts-browser-check.cjs <normal-url> [preview-revision]
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const root=new URL(process.argv[2]),preview=new URL('preview/accounts/',root),lab=new URL('dev/',root);
 const output=process.env.PRAIRIE_CAPTURE_DIR||'/workspace/artifacts/accounts-browser';fs.mkdirSync(output,{recursive:true});
 const report={checks:[],errors:[],accountRequests:[],passed:false};
 const browser=await chromium.launch({executablePath:process.env.PRAIRIE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:852,height:393},acceptDownloads:true});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/supabase\.co|\/auth\/v1|\/rest\/v1/.test(r.url()))report.accountRequests.push(r.url());});page.on('dialog',d=>d.accept());
 const go=async url=>{assert.equal((await page.goto(url.href,{waitUntil:'networkidle'})).status(),200);await page.waitForFunction(()=>document.getElementById('save-status')?.dataset.status==='saved');};
 const keys=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
 const settings=()=>page.click('#open-settings');
 try {
  await go(root);await page.evaluate(()=>localStorage.setItem('prairie-lapins.normal-auth.v1.test','{"testMarker":true}'));await settings();
  const downloadPromise=page.waitForEvent('download');await page.click('#export-game');const download=await downloadPromise;const file=output+'/normal.json';await download.saveAs(file);
  await go(preview);const source=(await keys())['prairie-lapins.save.v1'];assert.ok(source);
  assert.equal(await page.locator('#preview-badge').isVisible(),true);assert.match(await page.locator('#preview-badge').textContent(),/PRÉVISUALISATION/);
  await settings();if(process.argv[3])assert.ok((await page.locator('#game-version').textContent()).endsWith(process.argv[3].slice(0,7)));
  assert.match(await page.locator('#account-status').textContent(),/ne sont pas disponibles/);assert.equal(await page.locator('#account-send').count(),0);
  await page.setInputFiles('#import-file',file);await page.locator('#import-dialog[open]').waitFor();await page.click('#confirm-import');
  const pd=page.waitForEvent('download');await page.click('#export-game');assert.match((await pd).suggestedFilename(),/PREVISUALISATION/);
  assert.equal((await keys())['prairie-lapins.save.v1'],source);assert.ok((await keys())['prairie-lapins.preview.accounts.prairie-lapins.save.v1']);
  report.checks.push('Separate preview guest/cache, visible banner, honest unavailable account status, voluntary JSON import/export leaves normal save unchanged.');
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.getElementById('save-status')?.dataset.status==='saved');
  await go(lab);const before=await keys();await settings();await page.click('#dev-grant-pattes-1000');await page.click('#dev-reset');
  const after=await keys();for(const [key,value] of Object.entries(before).filter(([key])=>!key.startsWith('prairie-lapins.development.')))assert.equal(after[key],value,`Laboratory changed ${key}`);
  assert.equal(await page.locator('#account-content').isVisible(),false);assert.deepEqual(report.accountRequests,[]);
  report.checks.push('Laboratory grants/reset preserve normal auth marker, normal save and preview save; no account-service request.');
  await go(root);await settings();assert.equal(await page.locator('#preview-badge').isVisible(),false);assert.ok((await keys())['prairie-lapins.normal-auth.v1.test']);
  assert.deepEqual(report.errors,[]);report.passed=true;await page.screenshot({path:output+'/normal-return.png'});
 }finally{fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
