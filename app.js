(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined') module.exports = api;
  if (root) root.ProjectCompass = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const today = () => new Date().toLocaleDateString('tr-TR');
  const statuses = ['planlandı', 'sürüyor', 'bekliyor', 'tamamlandı'];
  const acceptance = ['bekliyor', 'incelemede', 'kabul edildi', 'reddedildi'];
  const levels = ['düşük', 'orta', 'yüksek'];
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const demo = () => ({ version: 1, projects: [{
    id:'ornek-proje', name:'Örnek bahçe planı', kind:'KURGU / DEMO', goal:'Hayali bir bahçe için plan hazırlamak.', whole:'Fikir → plan → kontrol', updated:today(),
    tasks:[{id:'ornek-is-1',title:'Alanı tasarla',owner:'Örnek kişi',status:'planlandı',acceptance:'bekliyor',dependsOn:[]}],
    decisions:[], risks:[], evidence:[], changes:[], outputs:[]
  }] });
  function validateImport(text) {
    let data; try { data = JSON.parse(text); } catch { throw new Error('Geçersiz JSON dosyası.'); }
    const invalid = message => { throw new Error(message || 'Geçersiz veri biçimi.'); };
    const exactRecord = (value, keys, message) => {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || !keys.every(key => Object.prototype.hasOwnProperty.call(value, key))) invalid(message);
    };
    const requiredText = (value, message) => { if (typeof value !== 'string' || !value.trim()) invalid(message); };
    const optionalText = (value, message) => { if (typeof value !== 'string') invalid(message); };
    const array = (value, message) => { if (!Array.isArray(value)) invalid(message); };
    const uniqueIds = (items, message) => {
      const ids = new Set();
      for (const item of items) { if (!item || typeof item !== 'object' || Array.isArray(item)) invalid(message); requiredText(item.id, message); if (ids.has(item.id)) invalid(message); ids.add(item.id); }
      return ids;
    };

    exactRecord(data, Object.prototype.hasOwnProperty.call(data || {}, 'revision') ? ['version', 'projects', 'revision'] : ['version', 'projects']);
    if ('revision' in data && (typeof data.revision !== 'string' || !/^[a-f0-9-]{36}$/.test(data.revision))) invalid('Geçersiz revizyon.');
    if (data.version !== 1) invalid();
    array(data.projects); if (!data.projects.length) invalid('İçe aktarma en az bir proje içermelidir.');
    uniqueIds(data.projects, 'Geçersiz veya yinelenen proje kimliği.');
    for (const p of data.projects) {
      exactRecord(p, ['id','name','kind','goal','whole','updated','tasks','decisions','risks','evidence','changes','outputs'], 'Geçersiz proje kaydı.');
      ['id','name','kind','goal','whole','updated'].forEach(key => requiredText(p[key], 'Geçersiz proje kaydı.'));
      ['tasks','decisions','risks','evidence','changes','outputs'].forEach(key => array(p[key], 'Geçersiz proje kaydı.'));
      const taskIds = uniqueIds(p.tasks, 'Geçersiz veya yinelenen iş kimliği.');
      const validateItems = (items, keys, textKeys, message) => items.forEach(item => {
        exactRecord(item, keys, message); textKeys.forEach(key => requiredText(item[key], message));
      });
      validateItems(p.tasks, ['id','title','owner','status','acceptance','dependsOn'], ['id','title','owner','status','acceptance'], 'Geçersiz iş kaydı.');
      p.tasks.forEach(task => {
        if (!statuses.includes(task.status) || !acceptance.includes(task.acceptance)) invalid('Geçersiz iş kaydı.');
        array(task.dependsOn, 'Geçersiz iş bağımlılığı.');
        const references = new Set();
        task.dependsOn.forEach(id => { requiredText(id, 'Geçersiz iş bağımlılığı.'); if (!taskIds.has(id) || id === task.id || references.has(id)) invalid('Geçersiz iş bağımlılığı.'); references.add(id); });
      });
      const visit = (id, visiting = new Set(), visited = new Set()) => {
        if (visiting.has(id)) invalid('Döngüsel iş bağımlılığı.');
        if (visited.has(id)) return;
        visiting.add(id); p.tasks.find(task => task.id === id).dependsOn.forEach(dependency => visit(dependency, visiting, visited)); visiting.delete(id); visited.add(id);
      };
      p.tasks.forEach(task => visit(task.id));
      validateItems(p.decisions, ['id','title','rationale','date'], ['id','title','rationale','date'], 'Geçersiz karar kaydı.'); uniqueIds(p.decisions, 'Geçersiz veya yinelenen karar kimliği.');
      validateItems(p.risks, ['id','title','level','response'], ['id','title','level'], 'Geçersiz risk kaydı.'); p.risks.forEach(item => optionalText(item.response, 'Geçersiz risk kaydı.')); uniqueIds(p.risks, 'Geçersiz veya yinelenen risk kimliği.'); if (p.risks.some(risk => !levels.includes(risk.level))) invalid('Geçersiz risk kaydı.');
      validateItems(p.evidence, ['id','title','note','url'], ['id','title'], 'Geçersiz kanıt kaydı.'); p.evidence.forEach(item => { optionalText(item.note, 'Geçersiz kanıt kaydı.'); optionalText(item.url, 'Geçersiz kanıt kaydı.'); }); uniqueIds(p.evidence, 'Geçersiz veya yinelenen kanıt kimliği.');
      validateItems(p.changes, ['id','text','date'], ['id','text','date'], 'Geçersiz değişiklik kaydı.'); uniqueIds(p.changes, 'Geçersiz veya yinelenen değişiklik kimliği.');
      validateItems(p.outputs, ['id','title','state'], ['id','title','state'], 'Geçersiz çıktı kaydı.'); uniqueIds(p.outputs, 'Geçersiz veya yinelenen çıktı kimliği.');
    }
    return data;
  }
  function createStore(seed) {
    let data = seed == null ? demo() : validateImport(typeof seed === 'string' ? seed : JSON.stringify(seed));
    const project = id => { const p = data.projects.find(x => x.id === id); if (!p) throw new Error('Proje bulunamadı.'); return p; };
    const saveChange = (p, text) => { p.updated = today(); p.changes = p.changes || []; p.changes.unshift({id:uid(), text, date:today()}); };
    return {
      listProjects: () => data.projects,
      getProject: project,
      addProject: input => { const p = {id:uid(),name:input.name.trim(),kind:'KULLANICI PROJESİ',goal:input.goal.trim(),whole:'Hedefi, işleri, kararları ve kanıtları burada birleştirin.',updated:today(),tasks:[],decisions:[],risks:[],evidence:[],changes:[],outputs:[]}; if(!p.name) throw new Error('Proje adı gerekli.'); if(!p.goal) throw new Error('Hedef gerekli.'); data.projects.push(p); return p; },
      addTask: (pid,input) => { const p=project(pid); const item={id:uid(),title:input.title.trim(),owner:input.owner.trim() || 'Atanmadı',status:statuses.includes(input.status)?input.status:'planlandı',acceptance:'bekliyor',dependsOn:Array.isArray(input.dependsOn)?input.dependsOn:[]}; if(!item.title) throw new Error('İş adı gerekli.'); p.tasks.push(item); saveChange(p, `İş eklendi: ${item.title}`); return item; },
      updateTask: (pid,id,changes) => { const p=project(pid), item=p.tasks.find(x=>x.id===id); if(!item) throw new Error('İş bulunamadı.'); if(changes.status && statuses.includes(changes.status)) item.status=changes.status; if(changes.acceptance && acceptance.includes(changes.acceptance)) item.acceptance=changes.acceptance; saveChange(p, `İş güncellendi: ${item.title}`); return item; },
      addDecision: (pid,input) => { const p=project(pid), item={id:uid(),title:input.title.trim(),rationale:input.rationale.trim(),date:today()}; if(!item.title) throw new Error('Karar başlığı gerekli.'); if(!item.rationale) throw new Error('Gerekçe gerekli.'); p.decisions.unshift(item); saveChange(p,`Karar kaydedildi: ${item.title}`); return item; },
      addRisk: (pid,input) => { const p=project(pid), item={id:uid(),title:input.title.trim(),level:levels.includes(input.level)?input.level:'orta',response:input.response.trim()}; if(!item.title) throw new Error('Risk başlığı gerekli.'); p.risks.unshift(item); saveChange(p,`Risk kaydedildi: ${item.title}`); return item; },
      addEvidence: (pid,input) => { const p=project(pid), item={id:uid(),title:input.title.trim(),note:input.note.trim(),url:input.url.trim()}; if(!item.title) throw new Error('Kanıt başlığı gerekli.'); p.evidence.unshift(item); saveChange(p,`Kanıt eklendi: ${item.title}`); return item; },
      exportData: () => JSON.stringify(data, null, 2), importData: text => { data=validateImport(text); return data; }
    };
  }
  function initApp() {
    const key='proje-pusulasi-v1'; let store; let recoveryData=null;
    const savedData=localStorage.getItem(key); let baseline=savedData;
    try { store=createStore(savedData ?? undefined); } catch { recoveryData=savedData; store=createStore(); }
    let current=store.listProjects()[0]?.id;
    const $=s=>document.querySelector(s); const main=$('#main');
    const transaction=async (change, allowRecovery=false)=>{
      if (!/^https?:$/.test(location.protocol) || !navigator.locks?.request) throw new Error('Bu ortam güvenli kayıt kilidini desteklemiyor; yazma kapalı. localhost veya HTTPS kullanın.');
      await navigator.locks.request(key, {mode:'exclusive'}, () => {
        if (localStorage.getItem(key)!==baseline) throw new Error('Kayıt başka bir sekmede değişti. Değişiklikleri kaybetmemek için sayfayı yenileyin.');
        if (recoveryData!==null && !allowRecovery) throw new Error('Bozuk yerel veri korunuyor. Önce ham veriyi yedekleyin.');
        const oldStore=store, oldCurrent=current;
        try {
          store=createStore(oldStore.exportData());
          change();
          const candidate=JSON.parse(store.exportData());
          if (!globalThis.crypto?.randomUUID) throw new Error('Güvenli revizyon üretilemiyor; yazma kapalı.');
          candidate.revision=crypto.randomUUID();
          const output=JSON.stringify(candidate, null, 2); validateImport(output);
          localStorage.setItem(key,output);
          store=createStore(output); baseline=output; recoveryData=null;
        } catch (error) { store=oldStore; current=oldCurrent; throw error; }
      });
    };
    const notice=(text, bad=false)=>{ const n=$('#notice'); n.textContent=text; n.className=bad?'notice bad':'notice'; };
    if(recoveryData!==null) notice('Yerel veri okunamadı; bozuk kayıt korunuyor ve üzerine yazılmayacak. Kurtarma için Dışa Aktar düğmesiyle ham veriyi indirin.', true);
    const card=(title, content, extra='')=>`<section class="card ${extra}"><h2>${escapeHtml(title)}</h2>${content}</section>`;
    const pill=s=>`<span class="pill ${escapeHtml(s)}">${escapeHtml(s)}</span>`;
    function render() {
      const p=store.getProject(current), complete=p.tasks.filter(t=>t.status==='tamamlandı').length, total=p.tasks.length;
      $('#projectSelect').innerHTML=store.listProjects().map(x=>`<option value="${escapeHtml(x.id)}" ${x.id===current?'selected':''}>${escapeHtml(x.name)}</option>`).join('');
      $('#projectName').textContent=p.name; $('#goal').textContent=p.goal; $('#kind').textContent=p.kind; $('#updated').textContent=`Son değişiklik: ${p.updated}`;
      const taskRows=p.tasks.map(t=>`<article class="item task"><div><strong>${escapeHtml(t.title)}</strong><small>Sahip: ${escapeHtml(t.owner)} · Bağımlılık: ${t.dependsOn.length ? t.dependsOn.map(id=>escapeHtml(p.tasks.find(x=>x.id===id)?.title||'silinmiş iş')).join(', ') : 'yok'}</small></div><div>${pill(t.status)} ${pill(t.acceptance)}<button data-task="${escapeHtml(t.id)}" class="small">Güncelle</button></div></article>`).join('') || '<p class="empty">Henüz iş yok. İlk işi ekleyin.</p>';
      const dependency=p.tasks.map(t=>`<div class="node"><b>${escapeHtml(t.title)}</b><span>${t.dependsOn.length ? '← '+t.dependsOn.map(id=>escapeHtml(p.tasks.find(x=>x.id===id)?.title||'?')).join(', ') : 'Başlangıç'}</span></div>`).join('') || '<p class="empty">İş eklenince ilişkiler burada görünür.</p>';
      const list=(items, fn, empty) => items.length?items.map(fn).join(''):`<p class="empty">${empty}</p>`;
      main.innerHTML=`<div class="metrics"><div><b>${complete}/${total}</b><span>Tamamlanan iş</span></div><div><b>${p.decisions.length}</b><span>Kaydedilen karar</span></div><div><b>${p.risks.filter(r=>r.level==='yüksek').length}</b><span>Yüksek risk</span></div><div><b>${p.evidence.length}</b><span>Kanıt</span></div></div>
      <div class="grid two">${card('Bütün resim',`<p>${escapeHtml(p.whole)}</p><div class="flow">${dependency}</div>`)}${card('İşler ve kabul',taskRows,'wide')}</div>
      <div class="grid three">${card('Kararlar',list(p.decisions,d=>`<article class="item"><strong>${escapeHtml(d.title)}</strong><small>${escapeHtml(d.rationale)} · ${escapeHtml(d.date)}</small></article>`,'Karar ekleyin.'))}${card('Riskler',list(p.risks,r=>`<article class="item"><strong>${escapeHtml(r.title)}</strong><small>${pill(r.level)} · Önlem: ${escapeHtml(r.response||'belirtilmedi')}</small></article>`,'Risk kaydı yok.'))}${card('Kanıt ve çıktı',list(p.evidence,e=>`<article class="item"><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.note||'Not yok')}</small></article>`,'Kanıt ekleyin.') + list(p.outputs,o=>`<article class="item"><strong>Çıktı: ${escapeHtml(o.title)}</strong><small>${escapeHtml(o.state)}</small></article>`,'Henüz kayıtlı çıktı yok.'))}</div>
      ${card('Değişiklik günlüğü',list(p.changes,c=>`<article class="log"><span>${escapeHtml(c.date)}</span> ${escapeHtml(c.text)}</article>`,'Henüz değişiklik yok.'))}`;
    }
    function formDialog(title, fields, submit) { const d=$('#dialog'); const control=f=>f.type==='select'?`<select name="${escapeHtml(f.name)}">${f.options.map(o=>{const value=typeof o==='string'?o:o.value, label=typeof o==='string'?o:o.label; return `<option value="${escapeHtml(value)}" ${value===f.value?'selected':''}>${escapeHtml(label)}</option>`;}).join('')}</select>`:f.type==='textarea'?`<textarea name="${escapeHtml(f.name)}" ${f.required?'required':''}>${escapeHtml(f.value || '')}</textarea>`:`<input name="${escapeHtml(f.name)}" type="${f.inputType||'text'}" value="${escapeHtml(f.value || '')}" ${f.required?'required':''}>`; d.innerHTML=`<form method="dialog"><h2>${escapeHtml(title)}</h2>${fields.map(f=>`<label>${escapeHtml(f.label)}${control(f)}</label>`).join('')}<div class="actions"><button type="submit" value="cancel" formnovalidate>Vazgeç</button><button type="submit" class="primary" value="ok">Kaydet</button></div></form>`; d.showModal(); d.querySelector('form').addEventListener('submit',async e=>{if(e.submitter?.value==='ok'){e.preventDefault(); const fd=new FormData(e.target); try{await transaction(()=>submit(Object.fromEntries(fd)));render();d.close();notice('Kaydedildi. Tarayıcıda bu cihazda saklanır.');}catch(err){notice(err.message,true)}}}); }
    $('#projectSelect').addEventListener('change',e=>{current=e.target.value;render();});
    $('#newProject').onclick=()=>formDialog('Yeni proje',[{label:'Proje adı',name:'name',required:true},{label:'Hedef',name:'goal',type:'textarea',required:true}],v=>{current=store.addProject(v).id});
    $('#addTask').onclick=()=>{const p=store.getProject(current);formDialog('İş ekle',[{label:'İş adı',name:'title',required:true},{label:'Sahip',name:'owner'},{label:'Durum',name:'status',type:'select',options:statuses},{label:'Bağımlı olduğu iş',name:'dependsOn',type:'select',options:[{value:'',label:'Yok'},...p.tasks.map(t=>({value:t.id,label:t.title}))]}],v=>store.addTask(current,{...v,dependsOn:v.dependsOn===''?[]:[v.dependsOn]}));};
    $('#addDecision').onclick=()=>formDialog('Karar ekle',[{label:'Karar',name:'title',required:true},{label:'Gerekçe',name:'rationale',type:'textarea',required:true}],v=>store.addDecision(current,v));
    $('#addRisk').onclick=()=>formDialog('Risk ekle',[{label:'Risk',name:'title',required:true},{label:'Seviye',name:'level',type:'select',options:levels},{label:'Önlem',name:'response',type:'textarea'}],v=>store.addRisk(current,v));
    $('#addEvidence').onclick=()=>formDialog('Kanıt ekle',[{label:'Başlık',name:'title',required:true},{label:'Not',name:'note',type:'textarea'},{label:'Bağlantı (isteğe bağlı)',name:'url',inputType:'url'}],v=>store.addEvidence(current,v));
    main.addEventListener('click',e=>{const id=e.target.dataset.task;if(!id)return;const task=store.getProject(current).tasks.find(item=>item.id===id); if(!task) return; formDialog('İşi güncelle',[{label:'Durum',name:'status',type:'select',options:statuses,value:task.status},{label:'Kabul durumu',name:'acceptance',type:'select',options:acceptance,value:task.acceptance}],v=>store.updateTask(current,id,v));});
    $('#export').onclick=()=>{const recovering=recoveryData!==null, blob=new Blob([recovering?recoveryData:store.exportData()],{type:recovering?'text/plain':'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=recovering?'proje-pusulasi-kurtarma-bozuk-veri.txt':'proje-pusulasi-yedek.json';a.click();URL.revokeObjectURL(a.href);notice(recovering?'Kurtarma verisi indirme isteği başlatıldı; dosyayı kontrol edin. Yerel bozuk kayıt değiştirilmedi.':'Yedek indirme isteği başlatıldı; dosyayı kontrol edip güvenli bir yerde saklayın.', recovering);};
    $('#import').onclick=()=>$('#importFile').click(); $('#importFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const candidate=validateImport(r.result);if(!window.confirm('Bu yedek mevcut tüm proje verilerinin üzerine yazacak. Devam etmek istiyor musunuz?')){notice('İçe aktarma iptal edildi. Mevcut veriler korunuyor.');return;}await transaction(()=>{store.importData(JSON.stringify(candidate));current=store.listProjects()[0].id;},true);render();notice('Yedek güvenli biçimde içe aktarıldı.');}catch(err){notice(err.message,true)}};r.onerror=()=>notice('Dosya okunamadı.',true);r.readAsText(f);e.target.value='';};
    render();
  }
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', initApp);
  return {createStore,validateImport,escapeHtml};
});
