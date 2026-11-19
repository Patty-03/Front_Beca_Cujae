import { chromium } from 'playwright';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTUwNjQyNTYsImlhdCI6MTc5NTAzNTQ1Ni4yMTg5NTQsInN1YiI6IjMifQ.adzgpmroiwQr3YXpr0zvOXBiAfNU5RY1BkEkKQNKoR8';
const base = 'http://localhost:5173';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript((t) => { try { localStorage.setItem('beca-cujae-access_token', t); } catch {} }, TOKEN);
  const page = await context.newPage();
  const responses = [];
  const pending = new Map();
  page.on('request', (req) => { const u=req.url(); if (u.includes(':8000')) pending.set(req, Date.now()); });
  page.on('requestfinished', async (req) => { if(!pending.has(req)) return; const s=pending.get(req); pending.delete(req); const res=await req.response().catch(()=>null); let size=null; try{ if(res){const b=await res.body(); size=b.length;} }catch{} responses.push({url:req.url(),m:req.method(),st:res?res.status():null,ms:Date.now()-s,size}); });
  page.on('requestfailed', (req) => { if(!pending.has(req)) return; const s=pending.get(req); pending.delete(req); responses.push({url:req.url(),m:req.method(),fail:req.failure()?.errorText,ms:Date.now()-s}); });

  await page.goto(base + '/asignacion-cuartos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  const usar = page.getByRole('button', { name: /Usar asignaci/i });
  const count = await usar.count();
  console.log('usar', count);
  if (count === 0) { console.log('no buttons'); await browser.close(); return; }
  // click first BORRADOR if visible in card text by trying each
  let clicked = false;
  for (let i=0;i<count;i++) {
    const btn = usar.nth(i);
    const cardText = await btn.locator('xpath=ancestor::*[self::div or self::article][1]').innerText().catch(()=> '');
    if (/BORRADOR|EN_REVISION/i.test(cardText)) { await btn.click(); clicked = true; console.log('clicked index', i, cardText.replace(/\s+/g,' ').slice(0,80)); break; }
  }
  if (!clicked) { await usar.first().click(); console.log('clicked first'); }
  await sleep(4000);
  const dialog = page.locator('[role="dialog"]');
  console.log('dialog', await dialog.isVisible().catch(()=>false));
  const metrics = await page.evaluate(()=>({all:document.querySelectorAll('*').length, selects:document.querySelectorAll('[role="combobox"]').length, nativeSelects:document.querySelectorAll('select').length, options:document.querySelectorAll('option').length, htmlLen:document.documentElement.outerHTML.length}));
  console.log('metrics', JSON.stringify(metrics));
  const txt = await dialog.innerText().catch(()=> '');
  console.log('txt', txt.replace(/\s+/g,' ').slice(0,900));
  const ejecutar = dialog.getByRole('button', { name: /Ejecutar asignaci/i }).first();
  const enabled = await ejecutar.isEnabled().catch(()=>false);
  console.log('ejecutar enabled', enabled);
  if (enabled) {
    await ejecutar.click().catch(e=>console.log('click err', e.message));
    for (let i=0;i<120;i++) {
      await sleep(1000);
      const en = await ejecutar.isEnabled().catch(()=>null);
      const alerts = await page.locator('[role="alert"]').allInnerTexts().catch(()=>[]);
      const toasts = await page.locator('[data-sonner-toast]').allInnerTexts().catch(()=>[]);
      if (i%5===0 || alerts.length || toasts.length) {
        const m = await page.evaluate(()=>({all:document.querySelectorAll('*').length, selects:document.querySelectorAll('[role="combobox"]').length, nativeSelects:document.querySelectorAll('select').length, options:document.querySelectorAll('option').length, htmlLen:document.documentElement.outerHTML.length})).catch(()=>null);
        console.log('t',i,'en',en,'m',JSON.stringify(m),'al',JSON.stringify(alerts.slice(0,1)),'to',JSON.stringify(toasts.slice(0,2)));
      }
      if (en === true && i>3) { break; }
      if (en === null) { console.log('dialog gone'); break; }
    }
    const finalTxt = await dialog.innerText().catch(()=> '');
    console.log('final', finalTxt.replace(/\s+/g,' ').slice(0,1200));
  }
  const api = responses.filter(r => /procesos-alojamiento/.test(r.url));
  console.log('api', JSON.stringify(api, null, 2));
  await browser.close();
})();
