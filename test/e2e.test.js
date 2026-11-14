const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const { mkdtempSync, rmSync, readFileSync, mkdirSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const chrome = process.env.CHROME_BIN || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : 'google-chrome');
let child;
let profile;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const content = text => { const data=JSON.parse(text); delete data.revision; return data; };
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const port = Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
      const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      if (pages[0]) return pages[0];
    } catch {}
    await pause(100);
  }
  throw new Error('Headless Chrome CDP başlamadı.');
}
function cdp(url) {
  const ws = new WebSocket(url); let seq = 0; const pending = new Map(); const events = [];
  return new Promise((resolve, reject) => { ws.onopen = () => resolve({
    send(method, params = {}) { return new Promise((done, fail) => { const id = ++seq; pending.set(id, {done, fail}); ws.send(JSON.stringify({id, method, params})); }); },
    events, close() { ws.close(); }
  }); ws.onerror = reject; ws.onmessage = event => { const msg = JSON.parse(event.data); if (msg.method) events.push(msg); if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.fail(new Error(msg.error.message)) : p.done(msg.result); } }; });
}
async function value(client, expression) { const r = await client.send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true}); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; }
async function reload(client) { const start=client.events.length; await client.send('Page.reload'); for (let i=0;i<200;i++) { if (client.events.slice(start).some(e=>e.method==='Page.loadEventFired')) { await pause(100); return; } await pause(100); } throw new Error('Sayfa yüklenmedi'); }
async function submitDialog(client, values) { await value(client, `(() => { const f=document.querySelector('#dialog form'); ${Object.entries(values).map(([k,v]) => `f.elements[${JSON.stringify(k)}].value=${JSON.stringify(v)};`).join('')} f.requestSubmit(f.querySelector('button[value="ok"]')); })()`); await pause(80); }

test('localhost arayüzünde proje ve bağımlı iş eklenir, kabul güncellenir ve kalıcı kayıt oluşur', async (t) => {
  const server=http.createServer((req,res)=>{const file=req.url==='/app.js'?'app.js':req.url==='/'?'index.html':null;if(!file){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');res.end(readFileSync(join(__dirname,'..',file)));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); t.after(()=>server.close());
  const url=`http://127.0.0.1:${server.address().port}/`;
  profile = mkdtempSync(join(__dirname, '..', 'pusula-profil-'));
  child = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', url], {stdio:'ignore'});
  const exited = new Promise(resolve => { child.once('exit', (code, signal) => resolve({code, signal})); child.once('error', error => resolve({error})); });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    let timer;
    const result = await Promise.race([exited, new Promise(resolve => { timer = setTimeout(() => resolve(null), 10000); })]);
    clearTimeout(timer);
    if (!result) throw new Error('Chrome PID ' + child.pid + ' kapanmadı; profil korunuyor: ' + profile);
    if (result.error) throw result.error;
    rmSync(profile, {recursive:true, force:true, maxRetries:10, retryDelay:200});
  });
  const page = await connect(), client = await cdp(page.webSocketDebuggerUrl); t.after(() => client.close());
  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await client.send('Network.enable');
  await client.send('Network.setBlockedURLs', {urls:['http://127.0.0.1:9/pusula-pozitif-kontrol']});
  await value(client, `fetch('http://127.0.0.1:9/pusula-pozitif-kontrol').catch(()=>{})`);
  await pause(100);
  const probe = client.events.find(e => e.method === 'Network.requestWillBeSent' && e.params.request.url.includes('pusula-pozitif-kontrol'));
  assert.ok(probe, 'ağ izleme pozitif kontrol isteğini görmeli');
  assert.ok(client.events.some(e => e.method === 'Network.loadingFailed' && e.params.requestId === probe.params.requestId && e.params.blockedReason), 'pozitif kontrol engellenmeli');
  await client.send('Network.setBlockedURLs', {urls:[]});
  client.events.length = 0;
  const downloads = join(profile, 'indirilenler'); mkdirSync(downloads);
  await client.send('Page.setDownloadBehavior', {behavior:'allow', downloadPath:downloads});
  await pause(300);
  for (let i=0;i<100 && await value(client, 'document.title')!=='Proje Pusulası — yerel proje hakimiyeti';i++) await pause(100);
  assert.equal(await value(client, 'document.title'), 'Proje Pusulası — yerel proje hakimiyeti');
  for (const filled of [false, true]) {
    await value(client, "document.querySelector('#newProject').click()");
    if (filled) await value(client, "document.querySelector('[name=name]').value='Sentetik iptal'; document.querySelector('[name=goal]').value='Sentetik hedef'");
    const before = await value(client, "localStorage.getItem('proje-pusulasi-v1')");
    await value(client, "document.querySelector('#dialog button[value=cancel]').click()");
    assert.equal(await value(client, "document.querySelector('#dialog').open"), false, `Vazgeç pencereyi kapatmalı (dolu=${filled})`);
    assert.equal(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), before);
  }
  await value(client, "Storage.prototype.__originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function() { throw new Error('sentetik yazma hatası'); }; document.querySelector('#newProject').click()");
  await submitDialog(client, {name:'Sentinel başarısız', goal:'Sentetik hedef'});
  await value(client, "document.querySelector('#dialog button[value=cancel]').click(); Storage.prototype.setItem = Storage.prototype.__originalSetItem; document.querySelector('#newProject').click()");
  await submitDialog(client, {name:'Saha planı', goal:'Haftalık bakım işlerini görünür yapmak'});
  assert.doesNotMatch(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), /Sentinel başarısız/, 'başarısız kayıt sonraki kayda sızmamalı');
  assert.equal(await value(client, "document.querySelector('#projectName').textContent"), 'Saha planı');
  await value(client, "document.querySelector('#addTask').click()");
  await submitDialog(client, {title:'Kontrol listesi hazırla', owner:'Örnek kişi', status:'planlandı', dependsOn:''});
  await value(client, "document.querySelector('#addTask').click()");
  const dependency = await value(client, "[...document.querySelector('select[name=dependsOn]').options].find(x=>x.textContent.includes('Kontrol listesi')).value");
  await submitDialog(client, {title:'Kontrolü kabul et', owner:'Örnek kişi', status:'planlandı', dependsOn:dependency});
  assert.match(await value(client, "document.querySelector('#main').innerText"), /Bağımlılık: Kontrol listesi hazırla/);
  await value(client, "[...document.querySelectorAll('button[data-task]')].find(b=>b.closest('.task').innerText.includes('Kontrolü kabul et')).click()");
  await submitDialog(client, {status:'tamamlandı', acceptance:'kabul edildi'});
  assert.match(await value(client, "document.querySelector('#main').innerText"), /kabul edildi/);
  await value(client, "[...document.querySelectorAll('button[data-task]')].find(b=>b.closest('.task').innerText.includes('Kontrolü kabul et')).click()");
  assert.equal(await value(client, "document.querySelector('select[name=status]').value"), 'tamamlandı');
  assert.equal(await value(client, "document.querySelector('select[name=acceptance]').value"), 'kabul edildi');
  await value(client, "document.querySelector('#dialog').close()");
  assert.match(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), /Saha planı/);
  const exportedState = await value(client, "localStorage.getItem('proje-pusulasi-v1')");
  await value(client, "document.querySelector('#export').click()");
  const backupFile = join(downloads, 'proje-pusulasi-yedek.json');
  for (let i=0; i<50 && !existsSync(backupFile); i++) await pause(100);
  assert.ok(existsSync(backupFile), 'gerçek yedek dosyası diske inmeli');
  assert.deepEqual(JSON.parse(readFileSync(backupFile, 'utf8')), JSON.parse(exportedState));
  await value(client, "document.querySelector('#newProject').click()");
  await submitDialog(client, {name:'Geçici sentetik', goal:'İçe aktarmayı doğrula'});
  await value(client, 'window.confirm = () => true');
  const doc = await client.send('DOM.getDocument');
  const input = await client.send('DOM.querySelector', {nodeId:doc.root.nodeId, selector:'#importFile'});
  await client.send('DOM.setFileInputFiles', {nodeId:input.nodeId, files:[backupFile]});
  await pause(200);
  assert.deepEqual(content(await value(client, "localStorage.getItem('proje-pusulasi-v1')")), content(exportedState), 'gerçek indirilen dosya geri yüklenmeli');
  await reload(client);
  assert.deepEqual(content(await value(client, "localStorage.getItem('proje-pusulasi-v1')")), content(exportedState));
  const beforeImport = await value(client, "localStorage.getItem('proje-pusulasi-v1')");
  await value(client, `(() => { const backup=JSON.parse(localStorage.getItem('proje-pusulasi-v1')); backup.projects[0].name='Sentetik import sızıntısı'; window.confirm=()=>true; window.__saveOriginal=Storage.prototype.setItem; Storage.prototype.setItem=()=>{throw new Error('sentetik import hatası')}; const input=document.querySelector('#importFile'), transfer=new DataTransfer(); transfer.items.add(new File([JSON.stringify(backup)],'test.json')); Object.defineProperty(input,'files',{value:transfer.files,configurable:true}); input.dispatchEvent(new Event('change')); })()`);
  await pause(200);
  assert.equal(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), beforeImport);
  await value(client, "Storage.prototype.setItem=window.__saveOriginal; document.querySelector('#projectSelect').dispatchEvent(new Event('change'))");
  assert.doesNotMatch(await value(client, "document.querySelector('#projectName').textContent"), /Sentetik import sızıntısı/);
  await value(client, `(() => {
    const backup = JSON.parse(localStorage.getItem('proje-pusulasi-v1'));
    backup.projects = [backup.projects.find(project => project.name === 'Saha planı')];
    window.confirm = message => { window.__importPrompt = message; return false; };
    const input = document.querySelector('#importFile'), transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(backup)], 'yedek.json', {type:'application/json'}));
    Object.defineProperty(input, 'files', {value: transfer.files, configurable: true}); input.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await pause(150);
  assert.match(await value(client, 'window.__importPrompt'), /mevcut.*üzerine yaz/i);
  assert.equal(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), beforeImport);
  assert.match(await value(client, "document.querySelector('#notice').textContent"), /iptal.*korun/i);
  await value(client, `(() => {
    const backup = JSON.parse(localStorage.getItem('proje-pusulasi-v1'));
    backup.projects = [backup.projects.find(project => project.name === 'Saha planı')];
    window.confirm = () => true;
    const input = document.querySelector('#importFile'), transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(backup)], 'yedek.json', {type:'application/json'}));
    Object.defineProperty(input, 'files', {value: transfer.files, configurable: true}); input.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await pause(150);
  assert.equal(await value(client, "JSON.parse(localStorage.getItem('proje-pusulasi-v1')).projects.length"), 1);
  // Yalnız sentetik profilde geçerli, ayraç ve eski seçenek adı içeren kimlikler.
  await value(client, `(() => {
    const data = JSON.parse(localStorage.getItem('proje-pusulasi-v1'));
    const tasks = data.projects[0].tasks;
    tasks[0].id = 'is|bir'; tasks[1].id = 'Yok'; tasks[1].dependsOn = ['is|bir'];
    localStorage.setItem('proje-pusulasi-v1', JSON.stringify(data));
  })()`);
  await reload(client);
  for (const id of ['is|bir', 'Yok']) {
    await value(client, "document.querySelector('#addTask').click()");
    await submitDialog(client, {title:`Bağımlı ${id}`, owner:'Örnek kişi', status:'planlandı', dependsOn:id});
  }
  const saved = await value(client, "localStorage.getItem('proje-pusulasi-v1')");
  const tasks = JSON.parse(saved).projects[0].tasks;
  assert.deepEqual(tasks.find(task => task.title === 'Bağımlı is|bir').dependsOn, ['is|bir']);
  assert.deepEqual(tasks.find(task => task.title === 'Bağımlı Yok').dependsOn, ['Yok']);
  assert.doesNotThrow(() => require('../app.js').validateImport(saved));
  await reload(client);
  assert.match(await value(client, "document.querySelector('#main').innerText"), /Bağımlı is\|bir/);
  await value(client, "localStorage.setItem('proje-pusulasi-v1', '{bozuk-json')");
  await reload(client);
  assert.equal(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), '{bozuk-json');
  assert.match(await value(client, "document.querySelector('#notice').textContent"), /Yerel veri okunamadı.*Dışa Aktar/);
  await value(client, "document.querySelector('#export').click()");
  assert.equal(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), '{bozuk-json');
  const recoveryFile = join(downloads, 'proje-pusulasi-kurtarma-bozuk-veri.txt');
  for (let i=0; i<50 && !existsSync(recoveryFile); i++) await pause(100);
  assert.equal(readFileSync(recoveryFile, 'utf8'), '{bozuk-json');
  await value(client, "localStorage.setItem('proje-pusulasi-v1', '')");
  await reload(client);
  assert.match(await value(client, "document.querySelector('#notice').textContent"), /Yerel veri okunamadı.*Dışa Aktar/);
  const beforeRecovery = await value(client, "document.querySelector('#projectSelect').options.length");
  await value(client, "document.querySelector('#newProject').click()");
  await submitDialog(client, {name:'Sentetik proje', goal:'Kayıt koruması'});
  await value(client, "document.querySelector('#dialog').close(); document.querySelector('#projectSelect').dispatchEvent(new Event('change'))");
  assert.equal(await value(client, "document.querySelector('#projectSelect').options.length"), beforeRecovery);
  assert.equal(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), '');
  assert.match(await value(client, "document.querySelector('#notice').textContent"), /Bozuk yerel veri korunuyor/);
  const downloads2 = join(profile, 'indirilenler2'); mkdirSync(downloads2);
  await client.send('Page.setDownloadBehavior', {behavior:'allow', downloadPath:downloads2});
  await value(client, "document.querySelector('#export').click()");
  const secondRecoveryFile = join(downloads2, 'proje-pusulasi-kurtarma-bozuk-veri.txt');
  for (let i=0; i<50 && !existsSync(secondRecoveryFile); i++) await pause(100);
  assert.ok(existsSync(secondRecoveryFile), 'ikinci indirme ayrı dosya olmalı');
  assert.equal(readFileSync(secondRecoveryFile, 'utf8'), '');
  assert.deepEqual(client.events.filter(e => e.method === 'Network.requestWillBeSent' && /^https?:/.test(e.params.request.url) && !e.params.request.url.startsWith(url)).map(e=>e.params.request.url), [], 'uygulama beklenmeyen ağ isteği yapmamalı');
  assert.match(await value(client, "document.querySelector('#notice').textContent"), /Kurtarma verisi indirme isteği başlatıldı/);
  assert.equal(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), '');
  await reload(client);
  const recoveryDoc = await client.send('DOM.getDocument');
  const recoveryInput = await client.send('DOM.querySelector', {nodeId:recoveryDoc.root.nodeId, selector:'#importFile'});
  await value(client, 'window.confirm = () => false');
  await client.send('DOM.setFileInputFiles', {nodeId:recoveryInput.nodeId, files:[backupFile]}); await pause(200);
  assert.equal(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), '');
  await value(client, "window.confirm = () => true; window.__recoveryOriginalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(){throw new Error('sentetik import hatası')}");
  await client.send('DOM.setFileInputFiles', {nodeId:recoveryInput.nodeId, files:[backupFile]}); await pause(200);
  assert.equal(await value(client, "localStorage.getItem('proje-pusulasi-v1')"), '');
  await value(client, 'Storage.prototype.setItem = window.__recoveryOriginalSetItem');
  await client.send('DOM.setFileInputFiles', {nodeId:recoveryInput.nodeId, files:[backupFile]}); await pause(200);
  assert.deepEqual(content(await value(client, "localStorage.getItem('proje-pusulasi-v1')")), content(exportedState));
  const created = await client.send('Target.createTarget', {url});
  const port = Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
  let secondPage;
  for (let i=0;i<50;i++) { const pages=await (await fetch(`http://127.0.0.1:${port}/json`)).json(); secondPage=pages.find(p=>p.id===created.targetId); if(secondPage) break; await pause(100); }
  const client2=await cdp(secondPage.webSocketDebuggerUrl); t.after(()=>client2.close());
  await client2.send('Runtime.enable');
  for (const c of [client, client2]) {
    let ready = false;
    for (let i=0; i<100 && !ready; i++) {
      ready = await value(c, "document.readyState !== 'loading' && typeof document.querySelector('#newProject')?.onclick === 'function'");
      if (!ready) await pause(100);
    }
    assert.equal(ready, true, 'sekmede uygulama olay işleyicisi kurulmalı');
  }
  await Promise.all([value(client, "document.querySelector('#newProject').click()"), value(client2, "document.querySelector('#newProject').click()")]);
  for (const c of [client, client2]) assert.equal(await value(c, "!!document.querySelector('#dialog[open] form')"), true, 'iki sekmede de proje formu açık olmalı');
  await Promise.all([submitDialog(client,{name:'Yarış A',goal:'A'}),submitDialog(client2,{name:'Yarış B',goal:'B'})]);
  const race=JSON.parse(await value(client,"localStorage.getItem('proje-pusulasi-v1')"));
  assert.equal(race.projects.filter(p=>/^Yarış [AB]$/.test(p.name)).length,1,'eşzamanlı yalnız tek işlem başarılı olmalı');
  let notices; for(let i=0;i<50;i++){notices=await Promise.all([value(client,"document.querySelector('#notice').textContent"),value(client2,"document.querySelector('#notice').textContent")]); if(notices.some(n=>/başka bir sekmede değişti/.test(n))) break; await pause(100);}
  assert.equal(notices.filter(n=>/başka bir sekmede değişti/.test(n)).length,1,`eski veri reddedilmeli: ${JSON.stringify(notices)}`);
  await reload(client);
  await value(client,"Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}); document.querySelector('#newProject').click()");
  await submitDialog(client,{name:'Kilitsiz',goal:'kaydedilmemeli'});
  assert.match(await value(client,"document.querySelector('#notice').textContent"),/kilidini desteklemiyor/);
  assert.doesNotMatch(await value(client,"localStorage.getItem('proje-pusulasi-v1')"),/Kilitsiz/);
});
