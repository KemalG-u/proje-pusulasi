const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore, validateImport, escapeHtml } = require('../app.js');

const validImport = () => ({
  version: 1,
  projects: [{
    id: 'project-1', name: 'Doğrulama projesi', kind: 'KULLANICI PROJESİ',
    goal: 'Kayıtları korumak', whole: 'Plan → doğrulama → teslim', updated: '05.11.2026',
    tasks: [{ id: 'task-1', title: 'İlk iş', owner: 'Örnek kişi', status: 'planlandı', acceptance: 'bekliyor', dependsOn: [] }],
    decisions: [{ id: 'decision-1', title: 'Yerelde sakla', rationale: 'Gizlilik', date: '05.11.2026' }],
    risks: [{ id: 'risk-1', title: 'Yedek riski', level: 'orta', response: 'Dışa aktar' }],
    evidence: [{ id: 'evidence-1', title: 'Kanıt', note: 'Not', url: '' }],
    changes: [{ id: 'change-1', text: 'Başlatıldı', date: '05.11.2026' }],
    outputs: [{ id: 'output-1', title: 'Teslim', state: 'bekliyor' }]
  }]
});

test('yeni iş eklenir, bağımlılık ve kabul durumu güncellenir', () => {
  const store = createStore();
  const projectId = store.listProjects()[0].id;
  const task = store.addTask(projectId, { title: 'Kullanıcı kabulünü al', owner: 'Örnek kişi', status: 'planlandı', dependsOn: [] });
  assert.equal(task.title, 'Kullanıcı kabulünü al');
  store.updateTask(projectId, task.id, { status: 'tamamlandı', acceptance: 'kabul edildi' });
  const updated = store.getProject(projectId).tasks.find((item) => item.id === task.id);
  assert.equal(updated.status, 'tamamlandı');
  assert.equal(updated.acceptance, 'kabul edildi');
});

test('proje, karar ve risk eklemeleri kalıcı dışa aktarım biçiminde görünür', () => {
  const store = createStore();
  const project = store.addProject({ name: 'Arşiv tarama', goal: 'Belgeleri düzenlemek' });
  store.addDecision(project.id, { title: 'Veri yerelde kalacak', rationale: 'Gizlilik' });
  store.addRisk(project.id, { title: 'Yedek yok', level: 'yüksek', response: 'Dışa aktar' });
  const exported = JSON.parse(store.exportData());
  const found = exported.projects.find((item) => item.id === project.id);
  assert.equal(found.decisions[0].title, 'Veri yerelde kalacak');
  assert.equal(found.risks[0].level, 'yüksek');
});

test('geçersiz veya beklenmedik alanlı içe aktarma reddedilir', () => {
  assert.throws(() => validateImport('{"projects":"kötü"}'), /Geçersiz/);
  assert.throws(() => validateImport('{"projects":[],"script":"<img>"}'), /Geçersiz/);
});

test('eksik iç içe alanlı içe aktarma reddedilir ve mevcut store değişmez', () => {
  const store = createStore();
  const before = store.exportData();
  const invalid = validImport();
  delete invalid.projects[0].decisions;

  assert.throws(() => store.importData(JSON.stringify(invalid)), /Geçersiz/);
  assert.equal(store.exportData(), before);
});

test('bozuk iç içe kimlik ve bağımlılık kayıtları reddedilir ve mevcut store değişmez', () => {
  const cases = [
    data => { data.projects[0].tasks = [null]; },
    data => { data.projects[0].tasks.push({ ...data.projects[0].tasks[0] }); },
    data => { data.projects[0].tasks[0].dependsOn = ['olmayan-is']; },
    data => { data.projects[0].tasks.push({ id: 'task-2', title: 'İkinci iş', owner: 'Örnek kişi', status: 'planlandı', acceptance: 'bekliyor', dependsOn: ['task-1'] }); data.projects[0].tasks[0].dependsOn = ['task-2']; },
    data => { data.projects = []; }
  ];
  for (const corrupt of cases) {
    const store = createStore();
    const before = store.exportData();
    const invalid = validImport(); corrupt(invalid);
    assert.throws(() => store.importData(JSON.stringify(invalid)), /Geçersiz|en az bir proje|Döngüsel/);
    assert.equal(store.exportData(), before);
  }
});

test('önlem yazılmayan risk dışa aktarılıp yeniden açılabilir', () => {
  const store = createStore();
  store.addRisk(store.listProjects()[0].id, {title:'Belirsiz durum', level:'orta', response:''});
  assert.doesNotThrow(() => createStore(store.exportData()));
});

test('kullanıcı metni HTML olarak çalıştırılmaz', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});


test('boş hedefli proje reddedilir ve kayıt bozulmaz', () => {
  const store = createStore();
  const before = store.exportData();
  assert.throws(() => store.addProject({name:'Örnek', goal:'   '}), /Hedef/);
  assert.equal(store.exportData(), before);
});


test('boş gerekçeli karar reddedilir ve kayıt bozulmaz', () => {
  const store = createStore(); const before = store.exportData();
  assert.throws(() => store.addDecision(store.listProjects()[0].id, {title:'Örnek', rationale:'   '}), /Gerekçe/);
  assert.equal(store.exportData(), before);
});


test('HTML metni ve çift tırnaklı öznitelik için kaçış, pozitif kontrolle', () => {
  const payload = `"><img src=x onerror=alert(1)> & 'x'`;
  const unsafe = `<option value="${payload}">x</option>`;
  const safe = `<option value="${escapeHtml(payload)}">${escapeHtml(payload)}</option>`;
  const hasRawInjection = s => s.includes('<img') || s.includes('" onerror=');
  assert.equal(hasRawInjection(unsafe), true);
  assert.equal(hasRawInjection(safe), false);
  assert.match(safe, /&quot;&gt;&lt;img/);
  assert.match(safe, /&amp; &#39;x&#39;/);
});

test('dışa aktarım tekrar açılır; bozuk içe aktarma önceki veriyi korur', () => {
  const source = createStore();
  const p = source.addProject({name:'Sentetik örnek', goal:'Yeniden açılış'});
  source.addTask(p.id, {title:'Deneme', owner:'Örnek kişi', status:'planlandı', dependsOn:[]});
  const backup = source.exportData();
  const reopened = createStore(backup);
  assert.equal(reopened.exportData(), backup);
  assert.throws(() => reopened.importData('{bozuk'), /Geçersiz/);
  assert.equal(reopened.exportData(), backup);
});


test('boş kayıt yok sayılmaz, geçersiz JSON olarak reddedilir', () => {
  assert.throws(() => createStore(''), /Geçersiz JSON/);
  assert.doesNotThrow(() => createStore());
});


test('ayraçlı iş kimliği dışa aktarım ve yeniden açılışta korunur', () => {
  const data = validImport();
  data.projects[0].tasks[0].id = 'is|bir';
  data.projects[0].tasks.push({id:'is-2', title:'Bağımlı', owner:'Örnek', status:'planlandı', acceptance:'bekliyor', dependsOn:['is|bir']});
  const reopened = createStore(createStore(JSON.stringify(data)).exportData());
  assert.deepEqual(reopened.listProjects()[0].tasks[1].dependsOn, ['is|bir']);
});
