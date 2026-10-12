(() => {
  'use strict';

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const money = (n, decimals=2) => new Intl.NumberFormat('ar-SA', {minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(Number(n)||0);
  const num = (n) => Number(n)||0;
  const today = () => new Date().toISOString().slice(0,10);
  const uid = (prefix='ID') => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const esc = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (n, decimals=2) => money(n,decimals);
  const stateKey = 'muhasibiKsaState_v1';

  const BASE_ACCOUNTS = [
    {code:'1000',name:'الصندوق',type:'asset',group:'متداول',nature:'مدين'},
    {code:'1010',name:'البنك',type:'asset',group:'متداول',nature:'مدين'},
    {code:'1100',name:'العملاء',type:'asset',group:'متداول',nature:'مدين'},
    {code:'1200',name:'المخزون',type:'asset',group:'متداول',nature:'مدين'},
    {code:'1300',name:'ضريبة المدخلات القابلة للخصم',type:'asset',group:'متداول',nature:'مدين'},
    {code:'1400',name:'مصروفات مدفوعة مقدما',type:'asset',group:'متداول',nature:'مدين'},
    {code:'1500',name:'المعدات والأجهزة',type:'asset',group:'غير متداول',nature:'مدين'},
    {code:'1590',name:'مجمع الإهلاك',type:'asset',group:'مجمع إهلاك',nature:'دائن',contra:true},
    {code:'2000',name:'الموردون',type:'liability',group:'متداول',nature:'دائن'},
    {code:'2100',name:'ضريبة المخرجات',type:'liability',group:'متداول',nature:'دائن'},
    {code:'2110',name:'الزكاة المستحقة',type:'liability',group:'متداول',nature:'دائن'},
    {code:'2120',name:'ضريبة الدخل المستحقة',type:'liability',group:'متداول',nature:'دائن'},
    {code:'2200',name:'مصروفات مستحقة',type:'liability',group:'متداول',nature:'دائن'},
    {code:'2300',name:'رواتب مستحقة',type:'liability',group:'متداول',nature:'دائن'},
    {code:'2400',name:'ضريبة استقطاع مستحقة',type:'liability',group:'متداول',nature:'دائن'},
    {code:'2500',name:'قرض طويل الأجل',type:'liability',group:'غير متداول',nature:'دائن'},
    {code:'3000',name:'رأس المال',type:'equity',group:'حقوق الملكية',nature:'دائن'},
    {code:'3100',name:'الأرباح المبقاة',type:'equity',group:'حقوق الملكية',nature:'دائن'},
    {code:'3200',name:'المسحوبات والتوزيعات',type:'equity',group:'حقوق الملكية',nature:'مدين',contra:true},
    {code:'4000',name:'إيراد الخدمات',type:'revenue',group:'إيرادات',nature:'دائن'},
    {code:'4100',name:'إيراد المبيعات',type:'revenue',group:'إيرادات',nature:'دائن'},
    {code:'4200',name:'إيرادات أخرى',type:'revenue',group:'إيرادات',nature:'دائن'},
    {code:'5000',name:'تكلفة المبيعات',type:'expense',group:'تكلفة الإيرادات',nature:'مدين'},
    {code:'6000',name:'مصروف الرواتب',type:'expense',group:'مصروفات تشغيلية',nature:'مدين'},
    {code:'6100',name:'مصروف الإيجار',type:'expense',group:'مصروفات تشغيلية',nature:'مدين'},
    {code:'6200',name:'مصروف المرافق والاتصالات',type:'expense',group:'مصروفات تشغيلية',nature:'مدين'},
    {code:'6300',name:'مصروف اللوازم المكتبية',type:'expense',group:'مصروفات تشغيلية',nature:'مدين'},
    {code:'6400',name:'مصروف الإهلاك',type:'expense',group:'مصروفات تشغيلية',nature:'مدين'},
    {code:'6500',name:'الرسوم البنكية',type:'expense',group:'مصروفات تشغيلية',nature:'مدين'},
    {code:'6600',name:'مصروفات عامة',type:'expense',group:'مصروفات تشغيلية',nature:'مدين'}
  ].map(a=>({...a,id:a.code}));

  const defaultState = () => ({
    theme:'dark', currentView:'home', activeModule:'m01', completedModules:[], quizHistory:{}, attempts:{},
    practiceTab:'errors', activeError:0, interviewIndex:0, interviewDrafts:{}, shownAnswers:{},
    erpTab:'overview', companyLoaded:false, companyName:'شركة المسار للتدريب المحاسبي', fiscalYear:'2026',
    accounts:BASE_ACCOUNTS.map(a=>({...a})), entries:[], documents:[], customDocs:[],
    lastSaved:null
  });

  let state = loadState();
  function loadState(){
    try { const x=JSON.parse(localStorage.getItem(stateKey)||'null'); if (!x) return defaultState(); const d=defaultState(); return {...d,...x, accounts:Array.isArray(x.accounts)?x.accounts:d.accounts, entries:Array.isArray(x.entries)?x.entries:[], documents:Array.isArray(x.documents)?x.documents:[], customDocs:Array.isArray(x.customDocs)?x.customDocs:[]}; }
    catch(e){ return defaultState(); }
  }
  function saveState(){
    state.lastSaved = new Date().toISOString();
    try { localStorage.setItem(stateKey, JSON.stringify(state)); } catch(e){ toast('تعذر الحفظ المحلي؛ قد تكون مساحة المتصفح ممتلئة.','error'); }
    updateProgressUI();
  }
  function toast(message, kind='success'){
    const box=document.createElement('div'); box.className=`toast ${kind}`; box.textContent=message; $('#toast-region').appendChild(box);
    requestAnimationFrame(()=>box.classList.add('show')); setTimeout(()=>{box.classList.remove('show');setTimeout(()=>box.remove(),250)},3200);
  }
  function account(id){return state.accounts.find(a=>a.id===id)||{id,code:id,name:'حساب غير معروف',type:'unknown',group:'',nature:''};}
  function accountOptions(selected=''){
    return state.accounts.map(a=>`<option value="${esc(a.id)}" ${a.id===selected?'selected':''}>${esc(a.code)} — ${esc(a.name)}</option>`).join('');
  }
  function entriesVisible({adjustments=true,closing=false}={}){
    return state.entries.filter(e=>(adjustments || e.type!=='adjustment')&&(closing || e.type!=='close'));
  }
  function calculateBalances({adjustments=true,closing=false, through=null}={}){
    const result={}; state.accounts.forEach(a=>result[a.id]={account:a,debit:0,credit:0,balance:0});
    entriesVisible({adjustments,closing}).filter(e=>!through||e.date<=through).forEach(e=>e.lines.forEach(l=>{
      if(!result[l.accountId]) result[l.accountId]={account:account(l.accountId),debit:0,credit:0,balance:0};
      result[l.accountId].debit+=num(l.debit); result[l.accountId].credit+=num(l.credit);
    }));
    Object.values(result).forEach(r=>r.balance=r.debit-r.credit);
    return result;
  }
  function totals({adjustments=true,closing=false}={}){
    const rows=calculateBalances({adjustments,closing});
    return Object.values(rows).reduce((s,r)=>({debit:s.debit+r.debit,credit:s.credit+r.credit}),{debit:0,credit:0});
  }
  function pnl({adjustments=true}={}){
    const balances=calculateBalances({adjustments,closing:false});
    const revenue=Object.values(balances).filter(r=>r.account.type==='revenue').reduce((s,r)=>s-r.balance,0);
    const expenses=Object.values(balances).filter(r=>r.account.type==='expense').reduce((s,r)=>s+r.balance,0);
    return {revenue,expenses,profit:revenue-expenses,balances};
  }
  function moneyRow(label,value,cls=''){
    return `<div class="report-row ${cls}"><span>${esc(label)}</span><strong>${fmt(value)}</strong></div>`;
  }
  function updateProgressUI(){
    const done=state.completedModules.length; const pct=Math.round(done/window.COURSE_MODULES.length*100);
    const el=$('#top-progress'); if(el)el.textContent=`${pct}% مكتمل`;
    const c=$('#theory-count'); if(c)c.textContent=window.COURSE_MODULES.length-done;
  }
  function setTheme(theme){state.theme=theme; document.documentElement.dataset.theme=theme==='light'?'light':'dark'; const b=$('#theme-toggle'); if(b)b.textContent=theme==='dark'?'☼':'☾'; saveState();}
  function goto(view){
    const allowed=['home','theory','practice','erp','interview','resources']; if(!allowed.includes(view))return;
    state.currentView=view; saveState();
    $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));
    $$('.nav-link[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    const names={home:'لوحة التعلم',theory:'المنهج النظري',practice:'التدريب العملي',erp:'مختبر ERP',interview:'مواقف المقابلات',resources:'المصادر الرسمية'};
    $('#breadcrumb-current').textContent=names[view]; $('#sidebar').classList.remove('open');
    renderView(view); $('#app-content').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'smooth'});
  }
  function renderView(view){
    if(view==='home')renderHome(); if(view==='theory')renderTheory(); if(view==='practice')renderPractice(); if(view==='erp')renderERP(); if(view==='interview')renderInterview(); if(view==='resources')renderResources();
  }
  function isUnlocked(index){return index===0 || window.COURSE_MODULES.slice(0,index).every(m=>state.completedModules.includes(m.id));}
  function courseProgress(){return Math.round(state.completedModules.length/window.COURSE_MODULES.length*100);}
  const slides=[
    {eyebrow:'أكاديمية المحاسب في السعودية',title:'من أول قيد… إلى محاسب يفهم الصورة كاملة',desc:'منهج نظري متدرج، تطبيقات واقعية، مختبر قيود وتقارير، ومواقف تشبه أسئلة المقابلات. تعلم بهدوء وارجع إلى أي فصل في أي وقت.',img:'assets/hero-ledger.svg',alt:'رسم توضيحي لدفتر الحسابات والتقارير',primary:'ابدأ من الفصل الأول',view:'theory'},
    {eyebrow:'زكاة · ضرائب · امتثال',title:'افهم النظام السعودي قبل أن تضغط زر الترحيل',desc:'تعرف على ضريبة القيمة المضافة، والفوترة الإلكترونية، والزكاة وضريبة الدخل والاستقطاع، مع تمييز القواعد العامة عن الحالات التي تحتاج إلى فحص خاص.',img:'assets/hero-tax.svg',alt:'رسم توضيحي للامتثال الضريبي',primary:'استكشف المسار السعودي',view:'theory'},
    {eyebrow:'مختبر ERP تفاعلي',title:'سجّل الفاتورة، ثم شاهد أثرها في الأستاذ والقوائم',desc:'شركة تدريب افتراضية، دليل حسابات، قيود يومية، مستندات جاهزة، ميزان مراجعة قبل التسويات وبعدها، وقوائم مالية قابلة للتحديث تلقائيا.',img:'assets/hero-workflow.svg',alt:'رسم توضيحي لتدفق العمل في النظام المحاسبي',primary:'افتح المختبر العملي',view:'erp'}
  ]; let slideIndex=0;
  function renderHome(){
    const done=state.completedModules.length,pct=courseProgress(),passedQuiz=Object.keys(state.quizHistory).length;
    const next=window.COURSE_MODULES.find(m=>!state.completedModules.includes(m.id))||window.COURSE_MODULES[window.COURSE_MODULES.length-1];
    const slide=slides[slideIndex];
    $('#view-home').innerHTML=`
      <section class="hero-carousel">
        <div class="hero-copy"><span class="hero-overline">✦ ${slide.eyebrow}</span><h1>${slide.title}</h1><p>${slide.desc}</p><div class="hero-actions"><button class="btn btn-primary" data-action="hero-primary" data-view="${slide.view}">${slide.primary} <span>←</span></button><button class="btn btn-secondary" data-action="hero-quiz">اختبر معلوماتك <span>↗</span></button></div></div>
        <div class="hero-visual"><img src="${slide.img}" alt="${slide.alt}"></div>
        <div class="slide-dots">${slides.map((s,i)=>`<button class="slide-dot ${i===slideIndex?'active':''}" data-action="slide" data-index="${i}" aria-label="الشريحة ${i+1}"></button>`).join('')}</div>
        <div class="hero-arrows"><button data-action="slide-prev" aria-label="الشريحة السابقة">→</button><button data-action="slide-next" aria-label="الشريحة التالية">←</button></div>
      </section>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-icon">▤</div><div><div class="stat-value">${done}<span class="muted">/${window.COURSE_MODULES.length}</span></div><div class="stat-label">فصول اجتزت اختبارها</div></div></div>
        <div class="stat-card"><div class="stat-icon">◷</div><div><div class="stat-value">${pct}%</div><div class="stat-label">تقدم المنهج النظري</div></div></div>
        <div class="stat-card"><div class="stat-icon">✓</div><div><div class="stat-value">${passedQuiz}</div><div class="stat-label">اختبارات محفوظة</div></div></div>
        <div class="stat-card"><div class="stat-icon">▦</div><div><div class="stat-value">${state.entries.length}</div><div class="stat-label">قيود في مختبر ERP</div></div></div>
      </div>
      <div class="dashboard-grid">
        <section class="surface surface-pad">
          <div class="panel-head"><div><h2 class="section-title">تابع من حيث توقفت</h2><p class="section-subtitle">التقدم محفوظ في هذا المتصفح على هذا الجهاز.</p></div><span class="tag teal">${pct}%</span></div>
          <div class="continue-card"><div class="continue-icon">▤</div><div style="flex:1;min-width:0"><h3>${esc(next.title)}</h3><p>${esc(next.subtitle)}</p><div class="progress-track"><span style="width:${pct}%"></span></div><div class="continue-meta"><span>${done} من ${window.COURSE_MODULES.length} فصلا</span><button class="text-button" data-action="continue-course">${done===window.COURSE_MODULES.length?'راجع الفصول':'تابع التعلم'} ←</button></div></div></div>
          <div class="divider"></div><div class="panel-head"><div><h2 class="section-title">خريطة المسار</h2><p class="section-subtitle">كل فصل يفتح بعد اجتياز اختبار الفصل السابق.</p></div><button class="text-button" data-view="theory">عرض المنهج ←</button></div>
          <div class="roadmap">${[
            {n:'01',title:'أساس المحاسبة',sub:'القيود والدورة المحاسبية',ids:['m01','m02','m03','m04']},
            {n:'02',title:'التسجيل والتقارير',sub:'البنوك والذمم والمخزون والأصول والقوائم',ids:['m05','m06','m07','m08','m09']},
            {n:'03',title:'السياق السعودي',sub:'الضريبة والزكاة والفوترة والرواتب',ids:['m10','m11','m12','m13','m14','m15']},
            {n:'04',title:'الأدوات والقطاعات والمقابلات',sub:'ERP والتطبيق والاستعداد المهني',ids:['m16','m17','m18']},
            {n:'05',title:'المستوى المتقدم',sub:'الإيراد والعقود والتكاليف والمعاملات الخاصة والمراجعة',ids:['m19','m20','m21','m22','m23']}
          ].map(r=>{const count=r.ids.filter(id=>state.completedModules.includes(id)).length;return `<div class="roadmap-item ${count===r.ids.length?'done':''}"><div class="roadmap-number">${count===r.ids.length?'✓':r.n}</div><div class="roadmap-text"><strong>${r.title}</strong><small>${r.sub}</small><div class="progress-track" style="margin-top:6px"><span style="width:${count/r.ids.length*100}%"></span></div></div><span class="roadmap-status">${count}/${r.ids.length}</span></div>`}).join('')}</div>
        </section>
        <section class="surface surface-pad">
          <div class="panel-head"><div><h2 class="section-title">إجراءات سريعة</h2><p class="section-subtitle">حوّل المفاهيم إلى ممارسة بنفسك.</p></div></div>
          <div class="grid" style="gap:10px">
            <button class="quick-card surface-flat" style="text-align:right" data-view="erp"><span class="quick-card-icon">▦</span><span><h3>مختبر ERP</h3><p>أنشئ شركة تدريب وسجل المستندات واختبر أثر القيود.</p></span></button>
            <button class="quick-card surface-flat" style="text-align:right" data-view="practice"><span class="quick-card-icon">◈</span><span><h3>مكتب حل المشكلات</h3><p>شخّص فروق البنك والضريبة والمخزون والقيود المكررة.</p></span></button>
            <button class="quick-card surface-flat" style="text-align:right" data-view="interview"><span class="quick-card-icon">◉</span><span><h3>تدريب المقابلات</h3><p>اكتب إجابتك ثم قارنها بعناصر الإجابة المهنية.</p></span></button>
          </div>
          <div class="divider"></div>
          <div class="inline-note info"><strong>قاعدة مهنية:</strong> اذكر في المقابلة ما طبقته فعلا، وما تدربت عليه في محاكاة. الصدق مع شرح خطوات التشخيص أقوى من ادعاء خبرة غير موجودة.</div>
          <div class="divider"></div>
          <div class="panel-head"><div><h2 class="section-title">نسبة تقدمك</h2><p class="section-subtitle">النجاح في الاختبار هو ما يفتح الفصل التالي.</p></div></div>
          <div style="display:flex;align-items:center;gap:17px"><div class="progress-orbit" style="--p:${pct}%"><span>${pct}%</span></div><div><strong style="font-size:13px">${done===0?'انطلاقة جديدة':done===window.COURSE_MODULES.length?'أكملت المنهج النظري':'أحسنت، استمر في البناء'}</strong><p class="muted small" style="margin:5px 0 0">${done===0?'ابدأ بالفصل الأول واجتز اختباره للانتقال.':`بقي لك ${window.COURSE_MODULES.length-done} فصلا في المسار النظري.`}</p></div></div>
        </section>
      </div>
    `;
  }

  function renderCourseSidebar(filter=''){
    const root=$('#module-tree'); if(!root)return;
    const modules=window.COURSE_MODULES.filter(m=>(m.title+' '+m.subtitle+' '+m.part).toLowerCase().includes(filter.toLowerCase()));
    let html='',last='';
    modules.forEach(m=>{
      if(m.part!==last){html+=`<div class="module-group-label">${esc(m.part)}</div>`;last=m.part;}
      const idx=window.COURSE_MODULES.findIndex(x=>x.id===m.id), locked=!isUnlocked(idx),done=state.completedModules.includes(m.id),active=state.activeModule===m.id;
      html+=`<button class="module-link ${active?'active':''} ${done?'done':''} ${locked?'locked':''}" data-action="open-module" data-id="${m.id}" title="${locked?'أكمل الفصل السابق أولا':m.title}"><span class="module-n">${done?'✓':String(idx+1).padStart(2,'0')}</span><span class="module-title">${esc(m.title)}</span><span class="module-status">${locked?'⌑':done?'✓':active?'●':'›'}</span></button>`;
    });
    root.innerHTML=html||'<div class="empty-state">لا توجد فصول تطابق البحث.</div>';
  }
  function renderModule(){
    const root=$('#lesson-content'); if(!root)return;
    let index=window.COURSE_MODULES.findIndex(m=>m.id===state.activeModule); if(index<0)index=0;
    const m=window.COURSE_MODULES[index];
    if(!isUnlocked(index)){
      root.innerHTML=`<div class="surface lesson-lock"><div class="lock-emoji">⌑</div><h2>هذا الفصل لم يفتح بعد</h2><p>المسار مبني على التدرج: أكمل قراءة الفصل السابق واجتز اختباره بدرجة النجاح، ثم سيصبح الفصل التالي متاحا تلقائيا.</p><button class="btn btn-primary" data-action="open-module" data-id="${window.COURSE_MODULES[index-1]?.id||'m01'}">العودة إلى الفصل السابق</button></div>`;return;
    }
    const done=state.completedModules.includes(m.id),history=state.quizHistory[m.id];
    root.innerHTML=`
      <div class="lesson-banner"><div class="kicker">${esc(m.part)} · فصل ${String(index+1).padStart(2,'0')}</div><h1>${esc(m.title)}</h1><p>${esc(m.subtitle)} — اقرأ الشرح والأمثلة ثم اختبر فهمك قبل الانتقال إلى الفصل التالي.</p><div class="lesson-meta"><span class="tag">◷ ${esc(m.time)}</span><span class="tag">${esc(m.level)}</span><span class="tag">${m.sections.length} محاور</span>${done?'<span class="tag green">✓ اجتزت الاختبار</span>':'<span class="tag gold">اختبار مطلوب لفتح التالي</span>'}</div></div>
      <section class="surface lesson-section"><h2>ماذا ستتعلم؟</h2><div class="goal-list">${m.goals.map(g=>`<div class="goal-item"><span class="goal-check">✓</span><span>${esc(g)}</span></div>`).join('')}</div></section>
      ${m.sections.map((s,i)=>`<section class="surface lesson-section"><h2>${i+1}. ${esc(s.h)}</h2><p>${esc(s.p)}</p></section>`).join('')}
      <section class="lesson-example"><h3>مثال تطبيقي</h3><p>${esc(m.example)}</p></section>
      <div class="surface surface-pad"><div class="panel-head"><div><h2 class="section-title">اختبر فهمك</h2><p class="section-subtitle">${m.quiz.length} أسئلة · ${m.quiz.length*25} ثانية كحد أقصى · درجة النجاح 65%</p></div>${done?'<span class="tag green">اجتياز سابق محفوظ</span>':''}</div><p class="muted small">سيظهر سؤال واحد في كل مرة. يمكنك إعادة الاختبار لتحسين نتيجتك، ولا يفتح الفصل التالي إلا بعد اجتياز الاختبار.</p><div class="quiz-card"><h3>${done?'إعادة اختبار الفصل':'جاهز لتحدي هذا الفصل؟'}</h3><p>${history?`آخر نتيجة محفوظة: ${history.score}% — ${history.correct} من ${history.total} إجابات صحيحة.`:'أجب بنفسك أولا، ثم اقرأ التفسير الذي يظهر بعد كل إجابة.'}</p><button class="btn btn-primary" data-action="start-quiz" data-id="${m.id}">${done?'ابدأ محاولة جديدة':'ابدأ الاختبار'} ←</button></div></div>
      <div class="lesson-bottom" style="margin-top:14px"><button class="btn btn-secondary" data-action="open-module" data-id="${window.COURSE_MODULES[Math.max(0,index-1)].id}" ${index===0?'disabled':''}>→ الفصل السابق</button><span class="muted tiny">الفصل ${index+1} من ${window.COURSE_MODULES.length}</span><button class="btn btn-primary" data-action="next-module" data-index="${index}">${done?'الفصل التالي ←':'التالي بعد اجتياز الاختبار'}</button></div>
    `;
  }
  function renderTheory(filter=''){
    const view=$('#view-theory');
    if(!$('#module-tree',view))view.innerHTML=`<div class="page-heading"><div><div class="kicker">المسار الأول · تعلّم خطوة بخطوة</div><h1>المنهج النظري</h1><p>شرح تفصيلي مقسّم إلى فصول. لا يُفتح الفصل اللاحق حتى تجتاز اختبار الفصل السابق؛ يمكنك إعادة الاختبار متى احتجت.</p></div><div class="heading-actions"><span class="tag teal">${state.completedModules.length}/${window.COURSE_MODULES.length} فصل</span></div></div><div class="course-layout"><aside class="surface course-sidebar"><div class="course-sidebar-top"><h3>محتويات المنهج</h3><p>ابحث عن فصل أو موضوع محدد</p></div><input class="course-search" id="course-search" type="search" placeholder="ابحث في الفصول..." value="${esc(filter)}"><div id="module-tree" class="module-list-wrap"></div></aside><div class="lesson-main" id="lesson-content"></div></div>`;
    renderCourseSidebar(filter); renderModule();
  }

  let quizSession=null,quizInterval=null;
  function stopQuizTimer(){if(quizInterval){clearInterval(quizInterval);quizInterval=null;}}
  function startQuiz(moduleId){
    const m=window.COURSE_MODULES.find(x=>x.id===moduleId); if(!m)return;
    const idx=window.COURSE_MODULES.findIndex(x=>x.id===moduleId); if(!isUnlocked(idx)){toast('أكمل الفصل السابق أولا.','error');return;}
    stopQuizTimer(); quizSession={moduleId,index:0,answers:[],selected:null,remaining:25,locked:false,finished:false}; renderQuizModal(); startQuestionTimer();
  }
  function startQuestionTimer(){
    stopQuizTimer(); if(!quizSession||quizSession.finished)return;
    quizInterval=setInterval(()=>{
      if(!quizSession||quizSession.finished){stopQuizTimer();return;}
      quizSession.remaining--; const el=$('#quiz-timer-number'); const box=$('#quiz-timer'); if(el)el.textContent=quizSession.remaining; if(box)box.classList.toggle('urgent',quizSession.remaining<=7);
      const bar=$('#quiz-time-bar');if(bar)bar.style.width=(quizSession.remaining/25*100)+'%';
      if(quizSession.remaining<=0){
        stopQuizTimer(); quizSession.locked=true; quizSession.answers.push({questionIndex:quizSession.index,selected:null,correct:false,timeout:true});
        const area=$('#quiz-question-area'); if(area){$$('.quiz-option',area).forEach(b=>b.disabled=true); let fb=$('#quiz-feedback',area);if(!fb){fb=document.createElement('div');fb.id='quiz-feedback';area.appendChild(fb);}fb.className='quiz-feedback bad';fb.textContent='انتهى الوقت. ستحتسب الإجابة غير صحيحة؛ اقرأ التفسير ثم انتقل للسؤال التالي.';}
        const label=$('#quiz-next-label');if(label)label.textContent=quizSession.index===window.COURSE_MODULES.find(m=>m.id===quizSession.moduleId).quiz.length-1?'عرض النتيجة':'السؤال التالي'; const next=$('#quiz-next');if(next)next.disabled=false;
      }
    },1000);
  }
  function renderQuizModal(){
    const m=window.COURSE_MODULES.find(x=>x.id===quizSession.moduleId);const q=m.quiz[quizSession.index];const last=quizSession.index===m.quiz.length-1;
    $('#modal-root').innerHTML=`<div class="modal-backdrop" id="quiz-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="اختبار ${esc(m.title)}"><header class="modal-head"><div><span class="kicker">اختبار الفصل</span><h2>${esc(m.title)}</h2><p>اختر إجابة واحدة. الدرجة المطلوبة للنجاح 65%.</p></div><button class="modal-close" data-action="close-quiz" aria-label="إغلاق">×</button></header><div class="modal-body" id="quiz-question-area">
      <div class="quiz-top"><div class="quiz-progress"><div class="quiz-progress-label"><span>السؤال ${quizSession.index+1} من ${m.quiz.length}</span><span>${Math.round((quizSession.index+1)/m.quiz.length*100)}%</span></div><div class="progress-track"><span style="width:${(quizSession.index+1)/m.quiz.length*100}%"></span></div><div style="height:3px;background:var(--panel-3);margin-top:6px;border-radius:99px;overflow:hidden"><div id="quiz-time-bar" style="height:100%;width:${quizSession.remaining/25*100}%;background:var(--gold);transition:width 1s linear"></div></div></div><div class="timer" id="quiz-timer">◷ <span id="quiz-timer-number">${quizSession.remaining}</span> ث</div></div>
      <p class="question-text">${esc(q.q)}</p><div class="quiz-options">${q.options.map((op,i)=>`<button class="quiz-option ${quizSession.selected===i?'selected':''}" data-action="quiz-answer" data-index="${i}" ${quizSession.locked?'disabled':''}><span class="option-letter">${['أ','ب','ج','د'][i]}</span><span>${esc(op)}</span></button>`).join('')}</div>
      ${quizSession.locked?`<div id="quiz-feedback" class="quiz-feedback ${quizSession.selected===q.a?'good':'bad'}">${quizSession.selected===q.a?'إجابة صحيحة. ':'الإجابة الصحيحة: '+esc(q.options[q.a])+'. '}${esc(q.why)}</div>`:''}
      <div class="quiz-controls"><span class="muted tiny">المحاولة ${num(state.attempts[m.id]||0)+1}</span><button class="btn btn-primary" id="quiz-next" data-action="quiz-next" ${(!quizSession.locked && quizSession.selected===null)?'disabled':''}><span id="quiz-next-label">${quizSession.locked?(last?'عرض النتيجة':'السؤال التالي'):'تحقق من الإجابة'}</span> ←</button></div>
    </div></section></div>`;
    if(quizSession.remaining<=0){const n=$('#quiz-timer-number');if(n)n.textContent='0';}
  }
  function answerQuiz(index){if(!quizSession||quizSession.locked)return;quizSession.selected=index;const m=window.COURSE_MODULES.find(x=>x.id===quizSession.moduleId);const q=m.quiz[quizSession.index];quizSession.locked=true;quizSession.answers.push({questionIndex:quizSession.index,selected:index,correct:index===q.a,timeout:false});stopQuizTimer();renderQuizModal();}
  function quizNext(){
    if(!quizSession)return;const m=window.COURSE_MODULES.find(x=>x.id===quizSession.moduleId);
    if(!quizSession.locked){if(quizSession.selected===null)return;answerQuiz(quizSession.selected);return;}
    if(quizSession.index<m.quiz.length-1){quizSession.index++;quizSession.selected=null;quizSession.locked=false;quizSession.remaining=25;renderQuizModal();startQuestionTimer();}
    else finishQuiz();
  }
  function finishQuiz(){
    stopQuizTimer();if(!quizSession)return;const m=window.COURSE_MODULES.find(x=>x.id===quizSession.moduleId);const correct=quizSession.answers.filter(a=>a.correct).length;const score=Math.round(correct/m.quiz.length*100);const passed=score>=65;
    state.attempts[m.id]=(state.attempts[m.id]||0)+1;state.quizHistory[m.id]={score,correct,total:m.quiz.length,passed,date:new Date().toISOString()};
    if(passed&&!state.completedModules.includes(m.id))state.completedModules.push(m.id);
    saveState();
    $('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><header class="modal-head"><div><span class="kicker">نتيجة الاختبار</span><h2>${esc(m.title)}</h2><p>تم حفظ النتيجة في متصفحك.</p></div><button class="modal-close" data-action="close-quiz">×</button></header><div class="modal-body"><div class="result-ring" style="border-top-color:${passed?'var(--green)':'var(--red)'};border-right-color:${score>=50?'var(--teal)':'var(--panel-3)'}"><strong>${score}%</strong></div><h2 class="result-title">${passed?'اجتزت الاختبار بنجاح':'لم تصل إلى درجة النجاح بعد'}</h2><p class="result-subtitle">أجبت إجابة صحيحة عن ${correct} من ${m.quiz.length}. الحد الأدنى للاجتياز 65%. ${passed?'تم فتح الفصل التالي إن وجد.':'راجع التفسيرات وأعد المحاولة؛ لن تفقد تقدمك السابق.'}</p><div class="review-list">${m.quiz.map((q,i)=>{const a=quizSession.answers.find(x=>x.questionIndex===i);return `<div class="review-item"><strong>${i+1}. ${esc(q.q)}</strong><div class="${a&&a.correct?'right-answer':'wrong-answer'}">${a&&a.correct?'✓ إجابة صحيحة':'✕ إجابتك: '+(a&&a.selected!==null?q.options[a.selected]:'انتهى الوقت / لم تجب')}</div><div class="muted">الإجابة الصحيحة: ${esc(q.options[q.a])}. ${esc(q.why)}</div></div>`}).join('')}</div><div class="quiz-controls"><button class="btn btn-secondary" data-action="close-quiz">العودة إلى الفصل</button><div style="display:flex;gap:8px"><button class="btn btn-ghost" data-action="retry-quiz" data-id="${m.id}">إعادة الاختبار</button>${passed&&window.COURSE_MODULES.findIndex(x=>x.id===m.id)<window.COURSE_MODULES.length-1?`<button class="btn btn-primary" data-action="quiz-next-module" data-id="${window.COURSE_MODULES[window.COURSE_MODULES.findIndex(x=>x.id===m.id)+1].id}">الفصل التالي ←</button>`:''}</div></div></div></section></div>`;
    quizSession.finished=true; renderTheory();
  }
  function closeQuiz(){stopQuizTimer();quizSession=null;$('#modal-root').innerHTML='';renderTheory();}

  const errors = [
    {title:'ميزان المراجعة غير متوازن',level:'سهل',prompt:'إجمالي المدين 125,400 ريال وإجمالي الدائن 124,500 ريال. الفرق 900 ريال. ما أول إجراء مهني؟',options:['تسجيل الفرق كإيراد آخر','فحص القيود والمبالغ والأطراف والترحيل لتحديد مصدر الفرق','تغيير رصيد رأس المال مباشرة','حذف آخر قيد مسجل'],a:1,why:'لا يثبت الفرق على حساب عشوائي. ابحث عن القيد الناقص أو المبلغ المنقول أو خطأ الترحيل، ثم صحح بمستند وأثر مراجعة.',steps:['قارن إجمالي المدين والدائن وحدد مقدار الفرق واتجاهه.','راجع دفتر اليومية والقيود غير المتوازنة وسجل التعديلات.','افحص القيود المرحّلة والفلاتر والفترة المحددة.','وثق السبب والقيد التصحيحي وأعد استخراج الميزان.']},
    {title:'ضريبة المخرجات لا تطابق تقرير المبيعات',level:'متوسط',prompt:'تقرير المبيعات يظهر ضريبة مخرجات 18,000 ريال، بينما حساب الأستاذ 17,250 ريال. ما الذي تفحصه أولا؟',options:['إغلاق حساب الضريبة فورا','مطابقة الفترة والفواتير والإشعارات الدائنة ومعدلات الضرائب والقيود اليدوية','رفع الضريبة بمقدار 750 دون تفسير','حذف الفواتير القديمة'],a:1,why:'الفرق قد ينتج عن فترة أو مستندات أو إعداد ضريبي أو قيد يدوي؛ يجب ربط التقرير بالأستاذ والفواتير قبل التصحيح.',steps:['تأكد أن التقارير تستخدم الفترة والكيان والفلاتر نفسها.','طابق أرقام الفواتير والإشعارات الدائنة والمرتجعات.','راجع تصنيف التوريد والرمز الضريبي لكل معاملة.','حلل القيود اليدوية والحركات التي لا تأتي من الفواتير.','وثق التسوية قبل الإقرار، وراجع أحدث تعليمات ZATCA.']},
    {title:'فاتورة مورد مكررة',level:'سهل',prompt:'لاحظت فاتورتين للمورد نفسه وبالرقم والمبلغ والتاريخ نفسه. ما الإجراء؟',options:['دفع الفاتورتين ثم المطالبة لاحقا','التحقق من المستند والحالة وسجل النظام ثم إيقاف المكرر وفق الصلاحيات','حذف قيد عشوائي من الأستاذ','تسجيل الفاتورة المكررة كمصروف'],a:1,why:'تحقق من احتمال تكرار المستند لا من تشابه الأرقام فقط؛ افحص أثر كل نسخة قبل إلغاء أو عكس واحدة منها.',steps:['قارن رقم المورد والرقم الضريبي والفاتورة والتاريخ والإجمالي.','تحقق من مستند الاستلام والموافقة وحالة الدفع.','حدد أي سجل صحيح وأوقف التكرار حسب إجراءات النظام.','إذا رُحّلت الفاتورة المكررة، اعكسها أو صححها بالطريقة المسموحة واحتفظ بالأثر.']},
    {title:'فرق بين المخزون والأستاذ العام',level:'متوسط',prompt:'قيمة المخزون في تقرير المستودع أكبر من حساب المخزون في الأستاذ بـ 6,500 ريال. ما الفحص المناسب؟',options:['تسجيل الفرق إيرادا','مطابقة حركة المخزون وتكلفته والفترات والحسابات الانتقالية قبل أي قيد','زيادة حساب المخزون فقط','تجاهل الفرق لأنه غير نقدي'],a:1,why:'قد ينتج الفرق عن حركات غير مرحلة أو حسابات وسيطة أو تكلفة أو توقيت؛ سجل السبب قبل التسوية.',steps:['ثبت تاريخ القطع والفروع والمستودعات المشمولة.','راجع الحركات غير المرحلة ومرتجعات البيع والشراء والتحويلات.','افحص طريقة تقييم المخزون وتحديث التكلفة.','طابق الحسابات الانتقالية مثل استلامات لم تصل فواتيرها.','اعتمد الجرد المادي والتسوية وفقا للسياسة.']},
    {title:'فاتورة بلا استلام أو اعتماد',level:'متوسط',prompt:'وصلت فاتورة مشتريات كبيرة، لكنها لا ترتبط بمحضر استلام ولا موافقة شراء. كيف تتصرف؟',options:['تسجلها فورا لتجنب التأخير','توقفها في مسار المراجعة وتتحقق من العقد والاستلام والاعتماد','تسجلها على المصروفات العامة','تغير تاريخها إلى الشهر السابق'],a:1,why:'التحقق من وجود التزام وصحة المستندات يسبق الترحيل. اتبع سياسة الاستثناءات والتصعيد ولا تغير التاريخ لإخفاء تأخير.',steps:['تحقق من أمر الشراء أو العقد وبيانات المورد.','اطلب إثبات استلام الخدمة أو البضاعة واعتماد صاحب الصلاحية.','حدد ما إذا كان هناك استحقاق فعلي للفترة رغم نقص مستند، واتبع سياسة الاستحقاقات.','وثق سبب التعليق والتواصل وقرار المعالجة.']},
    {title:'رصيد عميل دائن وغير مفهوم',level:'صعب',prompt:'ظهر رصيد دائن كبير في حساب أحد العملاء. ما الأسباب المحتملة التي تحتاج إلى فحص؟',options:['لا يمكن أن يحدث في حساب العملاء','دفعة مقدمة أو زيادة تحصيل أو إشعار دائن أو تخصيص خاطئ لدفعة','يجب نقله إلى الإيراد دائما','يجب حذف العميل'],a:1,why:'قد يكون الرصيد دفعة مقدمة أو مردودات أو تخصيصا خاطئا؛ لا تعالج الرصيد دون مستند ومطابقة.',steps:['راجع كشوف العميل وإيصالات القبض والإشعارات الدائنة.','تحقق من تخصيص الدفعات للفواتير الصحيحة.','ميز الدفعة المقدمة من الخطأ أو المبلغ المستحق رده.','صنفه وفقا للمعيار والسياسة بعد اعتماد المعالجة.']}
  ];
  const sectorCases=[
    {icon:'🍽️',title:'محاسب مطعم',summary:'نقاط البيع، التطبيقات، المخزون والهالك، النقد والعمولات.',focus:['مطابقة تقارير POS مع المبيعات والضريبة والتحصيل النقدي والبطاقات.','فصل عمولة منصة التوصيل عن قيمة المبيعات وفحص إشعاراتها.','مقارنة تكلفة المواد الفعلية بالوصفات والمبيعات وتحليل الهالك.','مراجعة الخصومات والعروض والوجبات المجانية والإكراميات وفق السياسة.'],indicator:'نسبة تكلفة الطعام = تكلفة المواد المستخدمة ÷ إيرادات الطعام (وفقا لتعريف الإدارة).',pitfall:'اعتبار صافي تحويل منصة التوصيل هو إجمالي الإيراد دون تحليل العمولة والضريبة.'},
    {icon:'🏗️',title:'محاسب مقاولات',summary:'المستخلصات، تكلفة المشروع، المقاولون من الباطن والاحتجازات.',focus:['فتح مركز تكلفة مستقل لكل مشروع وربطه بالعقد والموازنة.','مطابقة المستخلصات المعتمدة مع الفواتير والتحصيلات والاحتجازات.','تحديث التكلفة الفعلية والالتزامات والتكلفة المتوقعة للإكمال.','فحص التغييرات في نطاق العقد والدفعات المقدمة ومعدات الموقع.'],indicator:'انحراف التكلفة = التكلفة الفعلية والمتوقعة − الموازنة أو التقدير المعتمد.',pitfall:'الاعتراف بالإيراد لمجرد إصدار فاتورة دون تحليل شروط العقد ومتطلبات معيار الإيراد.'},
    {icon:'📦',title:'محاسب تجارة وتوزيع',summary:'المخزون والمرتجعات والخصومات وأعمار الديون.',focus:['مطابقة فواتير الشراء مع الاستلام والفواتير والفروق السعرية.','مطابقة مبيعات الأصناف مع حركة المخزون وتكلفة المبيعات.','إعداد أعمار العملاء والتحصيل حسب الاستحقاق والحد الائتماني.','مراجعة المخزون الراكد والتالف والجرد والفروق بين المستودعات.'],indicator:'هامش الربح الإجمالي = (المبيعات − تكلفة المبيعات) ÷ المبيعات.',pitfall:'إدخال مشتريات المخزون كمصروف فوري أو نسيان حركة تكلفة المبيعات.'},
    {icon:'💻',title:'محاسب خدمات وتقنية',summary:'العقود، الاشتراكات، ساعات العمل، الإيراد المؤجل والاستقطاع.',focus:['ربط العقد بنطاق الخدمة والفترة التي تقدم فيها.','مراجعة الفواتير المقدمة والإيرادات المستحقة وتوقيت الاعتراف.','تحليل تكلفة الموظفين وساعات العمل والمصروفات المعاد تحميلها.','فحص المدفوعات لغير المقيمين واحتمال انطباق ضريبة الاستقطاع.'],indicator:'هامش المشروع = إيراد المشروع المعترف به − تكاليف المشروع المنسوبة.',pitfall:'اعتبار كل مبلغ مقبوض إيرادا مكتسبا فوريا دون فحص التزام تقديم الخدمة.'},
    {icon:'🏨',title:'محاسب فندق',summary:'الحجوزات ومصادر الإيراد ومقدمو الحجز والمصروفات التشغيلية.',focus:['مطابقة تقارير نظام إدارة الفندق مع الإيراد والمدفوعات.','تسوية مستحقات منصات الحجز والعمولات ومبالغ الإلغاء.','مراجعة الإيرادات المؤجلة والودائع والضمانات.','تحليل الإشغال ومتوسط سعر الغرفة مع قراءة الموسم والسياق.'],indicator:'إيراد الغرفة المتاحة = إجمالي إيراد الغرف ÷ عدد الغرف المتاحة.',pitfall:'اعتبار وديعة الضيف إيرادا نهائيا قبل استحقاقها وفق العقد والسياسة.'},
    {icon:'🧰',title:'محاسب مصنع',summary:'المواد والأجور والتكاليف غير المباشرة والإنتاج تحت التشغيل.',focus:['مطابقة المواد المصروفة مع أوامر الإنتاج ووصفات التصنيع.','تحميل التكاليف غير المباشرة على أساس منطقي متسق.','حصر الإنتاج تحت التشغيل والمنتج التام والهالك الطبيعي وغير الطبيعي.','مقارنة التكلفة الفعلية بالتكلفة المعيارية وتحليل الانحرافات.'],indicator:'تكلفة الوحدة = التكاليف المنسوبة للإنتاج ÷ وحدات الإنتاج السليمة حسب السياسة.',pitfall:'تحميل كل التكاليف الثابتة على مخزون غير طبيعي دون مراعاة المعيار والسياسة.'}
  ];
  function renderPractice(){
    const v=$('#view-practice'); const tab=state.practiceTab||'errors';
    v.innerHTML=`<div class="page-heading"><div><div class="kicker">الجزء الثاني · التدريب العملي</div><h1>مكتب المحاسب لحل المشكلات</h1><p>التدريب هنا يركز على التشخيص والتوثيق والتصحيح، لا على اختيار قيد سريع فقط.</p></div><div class="heading-actions"><button class="btn btn-secondary" data-view="erp">افتح مختبر ERP ←</button></div></div>
      <div class="practice-tabs"><button class="tab-button ${tab==='errors'?'active':''}" data-action="practice-tab" data-id="errors">عيادة الأخطاء</button><button class="tab-button ${tab==='sectors'?'active':''}" data-action="practice-tab" data-id="sectors">يوم المحاسب حسب القطاع</button><button class="tab-button ${tab==='workflow'?'active':''}" data-action="practice-tab" data-id="workflow">يوم عمل نموذجي</button></div>
      <div id="practice-tab-content">${tab==='errors'?renderErrors():tab==='sectors'?renderSectors():renderDayWorkflow()}</div>`;
  }
  function renderErrors(){
    const selected=errors[state.activeError]||errors[0];
    return `<div class="split-layout"><section class="surface surface-pad"><div class="panel-head"><div><h2 class="section-title">حالات تحتاج إلى تشخيص</h2><p class="section-subtitle">اختر الحالة، ثم جاوب قبل إظهار خطوات المعالجة.</p></div><span class="tag">${errors.length} حالات</span></div><div class="grid" style="gap:8px">${errors.map((c,i)=>`<button class="module-link ${i===state.activeError?'active':''}" style="grid-template-columns:29px 1fr auto;border:1px solid ${i===state.activeError?'rgba(84,216,189,.2)':'var(--line)'};background:${i===state.activeError?'rgba(84,216,189,.07)':'var(--panel-2)'}" data-action="error-select" data-index="${i}"><span class="module-n">${i+1}</span><span class="module-title">${esc(c.title)}</span><span class="tag ${c.level==='صعب'?'red':c.level==='متوسط'?'gold':'teal'}">${c.level}</span></button>`).join('')}</div></section><section class="surface surface-pad"><div class="panel-head"><div><span class="tag gold">درجة الصعوبة: ${selected.level}</span><h2 class="section-title" style="margin-top:9px">${esc(selected.title)}</h2></div></div><p class="muted" style="font-size:13px;line-height:2">${esc(selected.prompt)}</p><div class="grid" style="gap:8px;margin-top:17px">${selected.options.map((o,i)=>`<button class="quiz-option" data-action="error-answer" data-index="${i}"><span class="option-letter">${['أ','ب','ج','د'][i]}</span><span>${esc(o)}</span></button>`).join('')}</div><div id="error-feedback"></div></section></div>`;
  }
  function renderSectors(){
    return `<div class="case-grid">${sectorCases.map((c,i)=>`<article class="surface case-card"><div class="case-card-head"><span class="case-icon">${c.icon}</span><span class="tag">قطاع ${String(i+1).padStart(2,'0')}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><div class="case-foot"><span class="muted tiny">${c.focus.length} محاور عمل</span><button class="btn btn-secondary btn-sm" data-action="sector-details" data-index="${i}">تفاصيل اليوم ←</button></div></article>`).join('')}</div><div id="sector-detail" style="margin-top:15px"></div>`;
  }
  function renderDayWorkflow(){
    const tasks=[['08:00','مراجعة البريد والأولويات','حدد الفواتير المستعجلة والاستحقاقات والمهام المؤجلة، ولا تبدأ التسجيل قبل معرفة ما ينتظر الموافقة.'],['08:30','استلام المستندات','تأكد من الفاتورة والعقد والاستلام والموافقة والبيانات الضريبية، واكشف التكرار.'],['10:00','التسجيل والترحيل','أدخل الفواتير والقيود، ثم تحقق من الحسابات والضريبة والتاريخ والفترة وحالة الترحيل.'],['11:30','المطابقات','طابق البنوك والعملاء والموردين والدفعات وبوابات الدفع، ودوّن الفروق المفتوحة.'],['13:00','تحليل استثناءات','افحص أرصدة غير طبيعية، فواتير غير مرحلة، قيود مكررة، وحسابات ضريبية لا تتطابق.'],['14:00','التنسيق مع الأقسام','اسأل المشتريات عن الاستلام، والمخازن عن الجرد، والموارد البشرية عن مسير الرواتب، والمدير عن الاعتمادات.'],['15:00','التقارير والإغلاق','حدّث قائمة المهام، احفظ الأدلة، وبلغ المسؤول بالمخاطر والفروق التي تحتاج إلى قرار.']];
    return `<section class="surface surface-pad"><div class="panel-head"><div><h2 class="section-title">كيف يبدو يوم محاسب منظم؟</h2><p class="section-subtitle">الأوقات نموذجية وليست جدولا موحدا لكل شركة أو قطاع.</p></div><span class="tag teal">سير عمل تدريبي</span></div><div class="case-steps">${tasks.map((t,i)=>`<div class="case-step"><div class="case-step-number">${t[0]}</div><div><h4>${t[1]}</h4><p>${t[2]}</p></div></div>`).join('')}</div><div class="inline-note info" style="margin-top:14px"><strong>مؤشر مهني:</strong> لا تجعل نهاية اليوم تعني أن كل المهام اكتملت؛ الأهم أن تكون المهام مكتملة أو موثقة بحالة ومالك وموعد متابعة.</div></section>`;
  }
  function revealSector(i){
    const c=sectorCases[i];const el=$('#sector-detail');if(!c||!el)return;
    el.innerHTML=`<section class="surface surface-pad"><div class="panel-head"><div><span class="kicker">سيناريو قطاعي</span><h2 class="section-title" style="margin-top:6px">${c.icon} ${esc(c.title)}</h2><p class="section-subtitle">ماذا تفعل خلال يوم العمل؟</p></div><button class="btn btn-ghost btn-sm" data-action="clear-sector">إخفاء</button></div><div class="grid grid-2">${c.focus.map((f,j)=>`<div class="case-step"><span class="case-step-number">${j+1}</span><div><p>${esc(f)}</p></div></div>`).join('')}</div><div class="divider"></div><div class="inline-note info"><strong>مؤشر تقيسه:</strong> ${esc(c.indicator)}</div><div class="inline-note" style="margin-top:10px"><strong>خطأ شائع:</strong> ${esc(c.pitfall)}</div><button class="btn btn-primary" style="margin-top:14px" data-action="go-sector-interview" data-index="${i}">تدرّب على سؤال مقابلة لهذا القطاع ←</button></section>`;
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function errorAnswer(index,button){
    const c=errors[state.activeError]; const host=$('#error-feedback'); if(!c||!host)return;
    $$('.quiz-option',button.parentElement).forEach(b=>{b.disabled=true;const n=Number(b.dataset.index);if(n===c.a)b.style.borderColor='var(--green)';if(n===index&&n!==c.a)b.style.borderColor='var(--red)';});
    host.innerHTML=`<div class="quiz-feedback ${index===c.a?'good':'bad'}"><strong>${index===c.a?'تشخيص صحيح':'راجع منطق القرار'}</strong><div style="margin-top:5px">${esc(c.why)}</div></div><div class="surface-flat" style="padding:13px;margin-top:10px"><strong style="font-size:12px">خطوات المعالجة المهنية</strong><div class="goal-list">${c.steps.map((s,i)=>`<div class="goal-item"><span class="goal-check">${i+1}</span><span>${esc(s)}</span></div>`).join('')}</div></div><button class="btn btn-primary" style="margin-top:12px" data-action="error-next">الحالة التالية ←</button>`;
  }

  const interviewQuestions=[
    {title:'فرق في التسوية البنكية',sector:'مهارات أساسية',prompt:'أثناء الإقفال وجدت أن رصيد البنك في الأستاذ يختلف عن كشف البنك بمبلغ 8,750 ريال. كيف ستتعامل مع الأمر؟',guide:['أذكر أنني سأثبت التاريخ والرصيدين والفترة.','أطابق الحركات وأفصل الفروق التوقيتية عن الحركات غير المسجلة.','أفحص رسوم البنك والتحويلات والشيكات والإيداعات بالطريق.','أسجل القيود المؤيدة فقط، وأوثق التسوية وأعيد المراجعة.'],sample:'سأبدأ بمطابقة كشف البنك مع دفتر الأستاذ في التاريخ نفسه، ثم أضع قائمة بالفروق وأصنفها إلى فروق توقيت وعمليات لم تسجل. سأراجع الإيداعات والشيكات والتحويلات والرسوم البنكية مع المستندات. أسجل فقط العمليات التي لم تثبت في الدفاتر بعد، ثم أتأكد أن الرصيد المعدل يتطابق وأحفظ التسوية للمراجعة.'},
    {title:'ضريبة قيمة مضافة لا تتطابق',sector:'الامتثال الضريبي',prompt:'أنت مسؤول عن تجهيز ملف ضريبة القيمة المضافة، واكتشفت أن تقرير الضريبة لا يساوي رصيد الحساب في الأستاذ. ما خطتك؟',guide:['أثبت الفترة والكيان والفلاتر المستخدمة في التقرير.','أطابق المبيعات والمشتريات والإشعارات الدائنة والمرتجعات.','أفحص إعدادات الضريبة والقيود اليدوية والعمليات غير المرحلة.','أختبر قابلية خصم المدخلات وأوثق التسوية قبل الإقرار.'],sample:'لن أعدل الرقم مباشرة. سأثبت أن التقرير والميزان لنفس الفترة، ثم أطابق الفواتير والإشعارات الدائنة والمرتجعات، وأراجع تصنيف التوريد والضريبة المعينة والفواتير غير المرحلة والقيود اليدوية. بعد تحديد السبب سأصحح المستند وفق الصلاحيات، وأعيد استخراج التقرير وأوثق المطابقة قبل تقديم الإقرار.'},
    {title:'مبيعات منصة توصيل لمطعم',sector:'محاسب مطعم',prompt:'المطعم حقق مبيعات عبر منصة توصيل، لكن ما وصل إلى البنك أقل من إجمالي المبيعات. كيف تفسر الفرق؟',guide:['أطلب تقرير المبيعات والعمولات والمرتجعات والتسويات.','أفصل إجمالي المبيعات عن عمولة المنصة وصافي المبلغ المستحق.','أطابق التحصيل البنكي وتوقيت التسوية والضريبة.','أراجع حساب مستحقات المنصة والإشعارات.'],sample:'سأطابق تقرير نقطة البيع وتقرير المنصة مع الفواتير والضريبة، ثم أفصل إجمالي المبيعات عن العمولة والمرتجعات والتعديلات. أتحقق من توقيت تسوية المبالغ إلى البنك، وأثبت مستحقات المنصة والعمولة كل على حدة بناء على المستندات، ثم أطابق الرصيد المفتوح مع التحويلات اللاحقة.'},
    {title:'تكلفة مشروع مقاولات تتجاوز الموازنة',sector:'محاسب مقاولات',prompt:'المشروع تجاوز التكلفة المتوقعة في الموازنة. ما المعلومات التي تجمعها قبل إبلاغ مدير المشروع؟',guide:['أربط التكلفة بمركز تكلفة المشروع والعقد.','أفحص التكاليف المرحلة والالتزامات والمستخلصات والتغييرات.','أحدث تقدير التكلفة للإكمال وأفصل أثر السعر والكمية والتوقيت.','أوثق الافتراضات وأبلغ بالمخاطر مع خيارات عملية.'],sample:'سأراجع التكلفة الفعلية والالتزامات والفواتير غير المرحلة ومشتريات الموقع والمقاولين من الباطن، وأطابقها مع العقد والتغييرات المعتمدة ومركز التكلفة. بعدها أحدث تقدير التكلفة للإكمال وأحلل سبب الانحراف، وأعرض على مدير المشروع الأثر المتوقع والمستندات والقرارات المطلوبة بدلا من الاكتفاء بإرسال رقم إجمالي.'},
    {title:'فاتورة مورد مكررة',sector:'الرقابة الداخلية',prompt:'اكتشفت أن فاتورة مورد رُحّلت مرتين، وإحدى النسختين ربما دخلت في دفعة تم اعتمادها. ماذا تفعل؟',guide:['أوقف أي دفعة لم تنفذ إن كانت الصلاحيات تسمح.','أتحقق من الفاتورة والاستلام وسجل المستندات والدفعات.','أطلب اعتماد التصحيح وأستخدم العكس أو الإشعار الصحيح لا الحذف غير الموثق.','أفحص سبب التكرار وأقترح حاجزا لمنعه.'],sample:'أتحقق أولا من تكرار المستند ومن حالة الدفعة، وأوقف ما يمكن إيقافه عبر الصلاحيات المعتمدة. بعد مطابقة الفاتورة ومحضر الاستلام والمدفوعات، أصحح السجل بالطريقة المسموح بها مع اعتماد وأثر مراجعة، ثم أراجع سبب التكرار وأقترح منع التكرار برقم الفاتورة والمورد ومؤشر آلي.'},
    {title:'كيف تتعلم نظام Odoo بسرعة؟',sector:'أنظمة ERP',prompt:'الشركة تستخدم Odoo ولم تعمل عليه سابقا. كيف تقنع مدير الحسابات أنك قادر على التعلم دون المخاطرة ببيانات الإنتاج؟',guide:['أبدأ ببيئة تدريب وصلاحيات محدودة.','أتعلم دورة المستند الأساسية وإعدادات الحساب والضريبة.','أنفذ حالات اختبار وأقارنها بالقيود والتقارير المتوقعة.','أوثق الأسئلة وأطلب مراجعة قبل التنفيذ الفعلي.'],sample:'سأتعلم دورة المعاملة في بيئة اختبار أولا: إنشاء المورد أو العميل، تسجيل الفاتورة، مراجعة الحساب والضريبة، الترحيل ومراجعة الأستاذ، ثم الدفع والمطابقة. سأقارن النتائج بقيد متوقع، وأستخدم صلاحيات محدودة وأطلب اعتماد مسؤول النظام قبل إدخال أي بيانات حقيقية.'}
  ];
  function renderInterview(){
    const i=Math.min(Math.max(0,state.interviewIndex||0),interviewQuestions.length-1),q=interviewQuestions[i],draft=state.interviewDrafts[i]||'',shown=!!state.shownAnswers[i];
    $('#view-interview').innerHTML=`<div class="interview-hero"><span class="kicker">الجزء الثاني · محاكاة المقابلة</span><h1>لا تحفظ الإجابة، تعلّم كيف تفكر</h1><p>اقرأ السيناريو، اكتب ردك وكأنك تتحدث إلى مدير حسابات، ثم اكشف عناصر الإجابة النموذجية. هذه التمارين لا تمنحك خبرة عمل فعلية، لكنها تساعدك على تدريب طريقة التشخيص والتواصل.</p></div><div class="split-layout"><section class="scenario-box"><div class="panel-head"><div><span class="tag teal">${esc(q.sector)}</span><h3 style="margin-top:10px">${esc(q.title)}</h3></div><span class="tag">${i+1}/${interviewQuestions.length}</span></div><p class="prompt">${esc(q.prompt)}</p><label class="field"><span>اكتب إجابتك المهنية</span><textarea class="answer-textarea" id="interview-draft" placeholder="سأبدأ بالتحقق من... ثم أقوم بمطابقة...">${esc(draft)}</textarea></label><div class="scenario-nav"><button class="btn btn-secondary" data-action="interview-prev" ${i===0?'disabled':''}>→ السابق</button><button class="btn btn-primary" data-action="toggle-interview-answer">${shown?'إخفاء عناصر الإجابة':'قارن بعناصر الإجابة'} ↓</button><button class="btn btn-secondary" data-action="interview-next" ${i===interviewQuestions.length-1?'disabled':''}>التالي ←</button></div>${shown?`<div class="divider"></div><h3>عناصر الإجابة القوية</h3><ul class="rubric">${q.guide.map(g=>`<li>${esc(g)}</li>`).join('')}</ul><div class="inline-note info" style="margin-top:14px"><strong>مثال لصياغة مهنية:</strong><p style="margin:5px 0 0;color:var(--muted)">${esc(q.sample)}</p></div>`:''}</section><aside class="surface surface-pad"><h2 class="section-title">كيف تقيّم نفسك؟</h2><p class="section-subtitle">بعد كتابة الإجابة، افحص العناصر التالية.</p><div class="goal-list" style="margin-top:18px">${['هل بدأت بتحديد الأثر والمبلغ والفترة؟','هل طلبت المستند أو الدليل المؤيد؟','هل شرحت خطوات التشخيص قبل التصحيح؟','هل وضحت كيف تمنع تكرار الخطأ؟','هل تجنبت الادعاء بمعلومة نظامية غير متحقق منها؟'].map((x,i)=>`<label class="goal-item"><input type="checkbox" class="self-check" data-key="${i}"> <span>${esc(x)}</span></label>`).join('')}</div><div class="divider"></div><div class="inline-note"><strong>تذكر:</strong> في مقابلة حقيقية، إذا لم تعرف نسبة نظامية حديثة، اشرح كيف ستتحقق من المصدر الرسمي قبل تطبيقها، بدلا من التخمين.</div></aside></div>`;
    $$('.self-check').forEach((c,i)=>{c.checked=!!(state.interviewChecklist&&state.interviewChecklist[i]);});
  }

  function renderResources(){
    $('#view-resources').innerHTML=`<div class="page-heading"><div><div class="kicker">مكتبة موثوقة</div><h1>المصادر الرسمية وأدلة التحقق</h1><p>المحتوى النظري مصمم للتعلم، أما المعدلات والمواعيد والاستثناءات فتراجع من المصدر الرسمي الساري على حالة المنشأة والفترة. الروابط التالية تفتح في نافذة جديدة.</p></div><div class="heading-actions"><span class="tag teal">مراجعة الروابط: أكتوبر 2026</span></div></div><div class="inline-note info" style="margin-bottom:18px"><strong>قاعدة تحديث:</strong> عند تنفيذ إقرار حقيقي، لا تعتمد على لقطة شاشة أو شرح قديم. تحقق من النظام واللائحة والأدلة والقرارات والتعاميم السارية، واحتفظ بتاريخ المصدر الذي استندت إليه.</div><div class="source-grid">${window.REFERENCE_LINKS.map((r,i)=>`<a class="source-card" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><span class="source-icon">↗</span><span style="flex:1"><strong>${esc(r.title)}</strong><p>${esc(r.desc)}</p><span class="source-meta"><span>${esc(r.kind)}</span><span>فتح المصدر ↗</span></span></span></a>`).join('')}</div><div class="divider"></div><section class="surface surface-pad"><h2 class="section-title">نطاق هذا التطبيق وحدوده</h2><div class="goal-list"><div class="goal-item"><span class="goal-check">1</span><span>هذا تطبيق ثابت يعمل في المتصفح ولا يتصل بقواعد بيانات أو منصة ZATCA أو نظام حكومي.</span></div><div class="goal-item"><span class="goal-check">2</span><span>مختبر ERP محاكاة تعليمية؛ دليل الحسابات ونسب الضريبة والمستندات فيه أمثلة قابلة للتعديل، وليست تهيئة قانونية جاهزة لشركة حقيقية.</span></div><div class="goal-item"><span class="goal-check">3</span><span>لا يتضمن شهادة مهنية أو اعتمادا أو ضمان قبول وظيفي. الهدف بناء الفهم والتدريب على المعالجة والتوثيق.</span></div><div class="goal-item"><span class="goal-check">4</span><span>قد تختلف المعالجة بحسب الكيان والنشاط والاتفاقية والفترة المالية واللائحة المطبقة. راجع مختصا عند وجود وقائع غير واضحة.</span></div></div></section>`;
  }

  // ERP simulator
  function loadTrainingCompany(){
    if(state.companyLoaded){if(!confirm('ستُستبدل بيانات مختبر ERP الحالية ببيانات شركة التدريب. هل تريد المتابعة؟'))return;}
    state.companyLoaded=true;state.companyName='شركة المسار للتدريب المحاسبي';state.accounts=BASE_ACCOUNTS.map(a=>({...a}));state.entries=[];state.documents=[];state.customDocs=[];
    state.entries.push({id:uid('JE'),date:'2026-01-01',ref:'OPEN-001',description:'قيد افتتاحي تدريبي: تمويل الشركة عند التأسيس',type:'normal',lines:[{accountId:'1010',debit:50000,credit:0},{accountId:'1200',debit:8000,credit:0},{accountId:'3000',debit:0,credit:58000}],createdAt:new Date().toISOString()});
    state.documents=window.SIM_CASES.map(d=>({...d,status:'ready'}));
    state.erpTab='overview';saveState();renderERP();toast('تم إنشاء شركة التدريب وإضافة القيد الافتتاحي ودليل الحسابات.');
  }
  function resetERP(){if(!confirm('سيتم حذف قيود ومستندات مختبر ERP وإعادته إلى الحالة الفارغة. لن يتأثر تقدم المنهج. هل تريد المتابعة؟'))return;state.companyLoaded=false;state.entries=[];state.documents=[];state.customDocs=[];state.accounts=BASE_ACCOUNTS.map(a=>({...a}));state.erpTab='overview';saveState();renderERP();toast('تمت إعادة ضبط مختبر ERP.');}
  function allDocs(){return [...state.documents,...state.customDocs];}
  function documentAlreadyPosted(doc){return doc.status==='posted'||state.entries.some(e=>e.documentId===doc.id);}
  function postDocument(docId){
    const d=allDocs().find(x=>x.id===docId);if(!d){toast('المستند غير موجود.','error');return;}if(documentAlreadyPosted(d)){toast('تم تسجيل هذا المستند من قبل.','error');return;}
    let lines=[];const gross=num(d.amount),vat=num(d.vat),total=gross+vat;const bankAccount='1010';
    if(d.type==='sale'){
      lines=[{accountId:'1100',debit:total,credit:0},{accountId:d.revenueAccount||'4000',debit:0,credit:gross}];if(vat)lines.push({accountId:'2100',debit:0,credit:vat});
    } else if(d.type==='purchase'){
      lines=[{accountId:d.expenseAccount||'6300',debit:gross,credit:0}];if(vat)lines.push({accountId:'1300',debit:vat,credit:0});lines.push({accountId:'2000',debit:0,credit:total});
    } else if(d.type==='expense'){
      lines=[{accountId:d.expenseAccount||'6100',debit:gross,credit:0},{accountId:bankAccount,debit:0,credit:gross}];if(vat){lines=[{accountId:d.expenseAccount||'6100',debit:gross,credit:0},{accountId:'1300',debit:vat,credit:0},{accountId:bankAccount,debit:0,credit:total}]}
    } else if(d.type==='asset'){
      lines=[{accountId:d.assetAccount||'1500',debit:gross,credit:0}];if(vat)lines.push({accountId:'1300',debit:vat,credit:0});lines.push({accountId:'2000',debit:0,credit:total});
    } else if(d.type==='collect'){
      const postedSale=state.entries.find(e=>e.documentId==='doc1');if(!postedSale){toast('سجل فاتورة البيع المرتبطة أولا.','error');return;}
      lines=[{accountId:bankAccount,debit:gross,credit:0},{accountId:'1100',debit:0,credit:gross}];
    } else if(d.type==='pay'){
      const postedPurchase=state.entries.find(e=>e.documentId==='doc2');if(!postedPurchase){toast('سجل فاتورة المشتريات المرتبطة أولا.','error');return;}
      lines=[{accountId:'2000',debit:gross,credit:0},{accountId:bankAccount,debit:0,credit:gross}];
    }
    const dr=lines.reduce((s,l)=>s+l.debit,0),cr=lines.reduce((s,l)=>s+l.credit,0);
    if(Math.abs(dr-cr)>.009){toast(`المستند غير متوازن: مدين ${fmt(dr)}، دائن ${fmt(cr)}. راجع إعدادات المستند.`,'error');return;}
    state.entries.push({id:uid('JE'),date:d.date||today(),ref:d.title.split('—').pop().trim(),description:d.title+' · '+d.party,type:'normal',documentId:d.id,lines,createdAt:new Date().toISOString()});d.status='posted';saveState();renderERP();toast('تم ترحيل المستند وإنشاء القيد المتوازن.');
  }
  function createCustomDocument(form){
    const fd=new FormData(form);const type=fd.get('type'),party=String(fd.get('party')||'').trim(),amount=num(fd.get('amount')),vatRate=fd.get('vatMode')==='standard'?0.15:0;const date=fd.get('date')||today(),description=String(fd.get('description')||'').trim();
    if(!party||amount<=0){toast('أدخل اسم الطرف ومبلغا أكبر من صفر.','error');return;}
    const id=uid('DOC');const title=(type==='sale'?'فاتورة بيع':type==='purchase'?'فاتورة مشتريات':type==='asset'?'فاتورة أصل ثابت':'مصروف')+' — '+id;
    const d={id,type,title,date,party,amount,vat:Math.round(amount*vatRate*100)/100,status:'ready',detail:description||'مستند أدخله المتعلم للتدريب.',custom:true};state.customDocs.unshift(d);saveState();renderERP();toast('تم إنشاء المستند. راجعه ثم اضغط ترحيل لإنشاء القيد.');
  }
  function addManualAccount(form){
    const fd=new FormData(form);const code=String(fd.get('code')||'').trim(),name=String(fd.get('name')||'').trim(),type=String(fd.get('type')||'');
    if(!code||!name){toast('أدخل رقم الحساب واسمه.','error');return;}
    if(state.accounts.some(a=>a.code===code||a.name===name)){toast('رقم الحساب أو اسمه مستخدم بالفعل.','error');return;}
    const id=code;state.accounts.push({id,code,name,type,group:type==='asset'?'متداول':type==='liability'?'متداول':type==='equity'?'حقوق الملكية':type==='revenue'?'إيرادات':'مصروفات',nature:['asset','expense'].includes(type)?'مدين':'دائن'});state.accounts.sort((a,b)=>a.code.localeCompare(b.code));saveState();renderERP();toast('تمت إضافة الحساب إلى الدليل التدريبي.');
  }
  function addManualJournal(form){
    const fd=new FormData(form);const date=fd.get('date')||today(),ref=String(fd.get('ref')||'').trim()||uid('MAN'),description=String(fd.get('description')||'').trim(),type=fd.get('entryType')||'normal';
    const lines=$$('.journal-line',form).map(row=>({accountId:$('.j-account',row).value,debit:num($('.j-debit',row).value),credit:num($('.j-credit',row).value)})).filter(l=>l.accountId&&(l.debit||l.credit));
    if(lines.length<2){toast('القيد يحتاج إلى سطرين على الأقل بمبالغ.','error');return;}
    if(lines.some(l=>l.debit<0||l.credit<0||(l.debit>0&&l.credit>0))){toast('كل سطر يجب أن يحتوي مبلغا في المدين أو الدائن فقط، دون قيمة سالبة.','error');return;}
    const dr=lines.reduce((s,l)=>s+l.debit,0),cr=lines.reduce((s,l)=>s+l.credit,0);
    if(Math.abs(dr-cr)>.009){toast(`القيد غير متوازن؛ الفرق ${fmt(dr-cr)} ريال. عدّل المبالغ قبل الترحيل.`,'error');return;}
    if(!description){toast('اكتب بيانا يشرح الحدث الاقتصادي.','error');return;}
    state.entries.push({id:uid('JE'),date,ref,description,type,lines,createdAt:new Date().toISOString()});saveState();state.erpTab='journal';renderERP();toast(type==='adjustment'?'تم ترحيل قيد التسوية.':'تم ترحيل القيد المتوازن.');
  }
  function addJournalLine(){const box=$('#journal-lines');if(!box)return;const row=document.createElement('div');row.className='journal-line';row.innerHTML=`<div class="field"><label>الحساب</label><select class="j-account" required><option value="">اختر الحساب</option>${accountOptions()}</select></div><div class="field"><label>مدين (ر.س)</label><input class="j-debit" type="number" min="0" step="0.01" placeholder="0.00"></div><div class="field"><label>دائن (ر.س)</label><input class="j-credit" type="number" min="0" step="0.01" placeholder="0.00"></div><button type="button" class="remove-line" data-action="remove-journal-line" aria-label="حذف السطر">×</button>`;box.appendChild(row);}
  function updateJournalTotals(){const form=$('#journal-form');if(!form)return;let dr=0,cr=0;$$('.j-debit',form).forEach(x=>dr+=num(x.value));$$('.j-credit',form).forEach(x=>cr+=num(x.value));const d=$('#j-total-debit'),c=$('#j-total-credit'),b=$('#j-balance');if(d)d.textContent=fmt(dr);if(c)c.textContent=fmt(cr);if(b){const diff=dr-cr;b.textContent=Math.abs(diff)<.009?'القيد متوازن':`الفرق ${fmt(diff)} ر.س`;b.className=`journal-balance ${Math.abs(diff)<.009?'ok':'bad'}`;}}
  function closePeriod(){
    if(!state.companyLoaded){toast('حمّل شركة التدريب أولا.','error');return;}
    if(state.entries.some(e=>e.type==='close')){toast('يوجد قيد إقفال بالفعل. أعد ضبط الشركة إذا كنت تريد تكرار تجربة الإقفال من البداية.','error');return;}
    const balances=calculateBalances({adjustments:true,closing:false});const lines=[];let rev=0,exp=0;
    Object.values(balances).forEach(r=>{
      if(r.account.type==='revenue'){const amount=r.credit-r.debit;if(amount>0.009){lines.push({accountId:r.account.id,debit:amount,credit:0});rev+=amount;}}
      if(r.account.type==='expense'){const amount=r.debit-r.credit;if(amount>0.009){lines.push({accountId:r.account.id,debit:0,credit:amount});exp+=amount;}}
    });
    const profit=rev-exp;if(Math.abs(profit)>.009)lines.push({accountId:'3100',debit:profit<0?Math.abs(profit):0,credit:profit>0?profit:0});
    const dr=lines.reduce((s,l)=>s+l.debit,0),cr=lines.reduce((s,l)=>s+l.credit,0);if(!lines.length||Math.abs(dr-cr)>.009){toast('لا توجد أرصدة إيرادات أو مصروفات للإقفال، أو يوجد خلل يحتاج مراجعة.','error');return;}
    state.entries.push({id:uid('CLOSE'),date:`${state.fiscalYear}-12-31`,ref:'CLOSE-'+state.fiscalYear,description:'قيد إقفال حسابات الإيرادات والمصروفات إلى الأرباح المبقاة',type:'close',lines,createdAt:new Date().toISOString()});saveState();renderERP();toast('تم إنشاء قيد الإقفال. راجع ميزان المراجعة والأرباح المبقاة.');
  }
  function getGeneralLedger(accountId){
    const rows=[];let run=0;
    entriesVisible({adjustments:true,closing:true}).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).forEach(e=>e.lines.filter(l=>l.accountId===accountId).forEach(l=>{run+=l.debit-l.credit;rows.push({date:e.date,ref:e.ref,desc:e.description,type:e.type,debit:l.debit,credit:l.credit,balance:run});}));
    return rows;
  }
  function renderERP(){
    const v=$('#view-erp');const tab=state.erpTab||'overview';
    const titleMap={overview:'نظرة عامة',documents:'المستندات والفواتير',journal:'قيود اليومية',ledger:'دفتر الأستاذ',trial:'ميزان المراجعة',statements:'القوائم المالية',accounts:'دليل الحسابات'};
    let body='';
    if(!state.companyLoaded){body=`<div class="erp-welcome"><img src="assets/hero-workflow.svg" alt="محاكاة تدفق المحاسبة"><span class="kicker" style="justify-content:center">مختبر تدريبي متكامل</span><h2>أنشئ بيئة محاسبية آمنة للتجربة</h2><p>سيُنشأ دليل حسابات تدريبي لشركة افتراضية مع قيد افتتاحي ومستندات يمكن تسجيلها يدويا. القيود متوازنة، وتنعكس نتائجها تلقائيا على دفتر الأستاذ وميزان المراجعة والقوائم المالية. تحفظ البيانات في متصفحك فقط.</p><button class="btn btn-primary" data-action="load-company">إنشاء شركة التدريب وفتح النظام ←</button><div class="grid grid-3" style="margin-top:22px;text-align:right"><div class="surface-flat" style="padding:13px"><strong style="display:block;color:var(--teal);font-size:12px">01 · الإدخال</strong><p class="muted tiny">فواتير، قيود، وتسويات.</p></div><div class="surface-flat" style="padding:13px"><strong style="display:block;color:var(--blue);font-size:12px">02 · الترحيل</strong><p class="muted tiny">أستاذ وميزان مراجعة.</p></div><div class="surface-flat" style="padding:13px"><strong style="display:block;color:var(--gold);font-size:12px">03 · التقارير</strong><p class="muted tiny">قوائم مالية وإقفال.</p></div></div></div>`;}
    else body=renderERPContent(tab);
    v.innerHTML=`<div class="page-heading"><div><div class="kicker">الجزء الثاني · مختبر المحاسبة</div><h1>نظام محاسبي تدريبي</h1><p>محاكاة محلية لفكرة ERP: أدخل مستندا أو قيدا، ثم راقب أثره في الدفاتر والتقارير. لا يتصل هذا النظام بمنصة حكومية أو قاعدة بيانات حقيقية.</p></div><div class="heading-actions">${state.companyLoaded?`<button class="btn btn-secondary" data-action="export-journal">تصدير اليومية CSV ↓</button><button class="btn btn-danger" data-action="reset-erp">إعادة ضبط المختبر</button>`:''}</div></div>
      ${state.companyLoaded?`<div class="erp-company-bar"><div class="company-identity"><div class="company-logo">▦</div><div><strong>${esc(state.companyName)}</strong><small>العملة: ريال سعودي · السنة التدريبية: ${esc(state.fiscalYear)} · بيانات محلية</small></div></div><div class="erp-status"><span class="tag green">● البيئة جاهزة</span><span class="tag">${state.entries.length} قيد</span><span class="tag">${state.accounts.length} حساب</span></div></div><div class="erp-tabs">${Object.entries(titleMap).map(([key,label])=>`<button class="tab-button ${tab===key?'active':''}" data-action="erp-tab" data-id="${key}">${label}</button>`).join('')}</div>`:''}
      ${body}`;
    if(state.companyLoaded){updateJournalTotals();}
  }
  function renderERPContent(tab){
    const bals=calculateBalances({adjustments:true,closing:false});const t=totals({adjustments:true,closing:false});const p=pnl({adjustments:true});
    if(tab==='overview')return `<div class="erp-stat-grid"><div class="erp-stat"><span>إجمالي المدين · الأستاذ</span><strong>${fmt(t.debit)}</strong><small>قبل قيود الإقفال</small></div><div class="erp-stat"><span>صافي الربح التدريبي</span><strong style="color:${p.profit>=0?'var(--green)':'var(--red)'}">${fmt(p.profit)}</strong><small>حسب القيود المسجلة</small></div><div class="erp-stat"><span>مستندات بانتظار الترحيل</span><strong>${allDocs().filter(d=>!documentAlreadyPosted(d)).length}</strong><small>مستندات تدريب جاهزة</small></div><div class="erp-stat"><span>قيود تسوية</span><strong>${state.entries.filter(e=>e.type==='adjustment').length}</strong><small>تدخل في ميزان ما بعد التسويات</small></div></div>
      <div class="grid grid-2"><section class="surface erp-panel"><div class="erp-panel-head"><div><h2>مسار سريع</h2><p>ابدأ بمستند المصدر ثم راجع القيد الناتج.</p></div></div><div class="grid" style="gap:9px"><button class="continue-card" style="text-align:right;width:100%;cursor:pointer" data-action="erp-tab" data-id="documents"><span class="continue-icon">▧</span><span style="flex:1"><strong>المستندات والفواتير</strong><div class="muted tiny">بيع وشراء وأصل ومصروف</div></span><span>←</span></button><button class="continue-card" style="text-align:right;width:100%;cursor:pointer" data-action="erp-tab" data-id="journal"><span class="continue-icon">≡</span><span style="flex:1"><strong>إدخال قيد يدوي أو تسوية</strong><div class="muted tiny">مدين ودائن متوازنان</div></span><span>←</span></button><button class="continue-card" style="text-align:right;width:100%;cursor:pointer" data-action="erp-tab" data-id="trial"><span class="continue-icon">∑</span><span style="flex:1"><strong>ميزان المراجعة</strong><div class="muted tiny">قبل التسويات وبعدها</div></span><span>←</span></button><button class="continue-card" style="text-align:right;width:100%;cursor:pointer" data-action="erp-tab" data-id="statements"><span class="continue-icon">▥</span><span style="flex:1"><strong>القوائم المالية</strong><div class="muted tiny">مركز مالي ونتيجة وتدفقات</div></span><span>←</span></button></div></section><section class="surface erp-panel"><div class="erp-panel-head"><div><h2>آخر القيود المسجلة</h2><p>مرتبة من الأحدث إلى الأقدم.</p></div><button class="text-button" data-action="erp-tab" data-id="journal">عرض اليومية ←</button></div>${state.entries.length?`<div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>البيان</th><th class="numeric">المدين</th></tr></thead><tbody>${state.entries.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(e=>`<tr><td>${esc(e.date)}</td><td>${esc(e.description)}<div class="tiny muted">${esc(e.ref)}</div></td><td class="numeric">${fmt(e.lines.reduce((s,l)=>s+l.debit,0))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state">لا توجد قيود بعد.</div>'}</section></div><div class="inline-note info" style="margin-top:15px"><strong>تلميح تدريبي:</strong> جرّب ترحيل فاتورة بيع ثم افتح دفتر الأستاذ لحساب العملاء وإيراد الخدمات وضريبة المخرجات. بعدها قارن ميزان المراجعة قبل التسوية وبعد تسجيل الإهلاك.</div>`;
    if(tab==='documents')return renderDocuments();
    if(tab==='journal')return renderJournal();
    if(tab==='ledger')return renderLedger();
    if(tab==='trial')return renderTrial();
    if(tab==='statements')return renderStatements();
    if(tab==='accounts')return renderAccounts();
    return '';
  }
  function renderDocuments(){
    const docs=allDocs();const ready=docs.filter(d=>!documentAlreadyPosted(d));const posted=docs.filter(documentAlreadyPosted);
    return `<div class="surface erp-panel"><div class="erp-panel-head"><div><h2>مستندات المصدر</h2><p>الفاتورة أصل العملية؛ ترحيلها ينشئ القيد المتوازن ويحدث التقارير.</p></div><span class="tag gold">${ready.length} مستند مفتوح</span></div><div class="inline-note" style="margin-bottom:14px"><strong>قبل الترحيل:</strong> افحص المستند والمبلغ والحساب والضريبة والأحقية في الخصم. النسب في هذا المختبر أمثلة تعليمية وليست إعدادا قانونيا لكل معاملة.</div><div class="docs-grid">${docs.map(d=>{const done=documentAlreadyPosted(d),dependency=(d.type==='collect'&&!state.entries.some(e=>e.documentId==='doc1'))||(d.type==='pay'&&!state.entries.some(e=>e.documentId==='doc2'));return `<article class="doc-card"><div class="doc-head"><div><h4>${esc(d.title)}</h4><p>${esc(d.date)} · ${esc(d.party)}</p></div><span class="tag ${done?'green':dependency?'gold':'teal'}">${done?'مرحّل':dependency?'ينتظر مستندا':'مسودة تدريب'}</span></div><p style="margin-top:8px">${esc(d.detail||'مستند تدريبي مضاف يدويا.')}</p><div class="doc-amount">${fmt(d.amount)} <small>ر.س قبل الضريبة</small></div>${d.vat?`<p>ضريبة مدخلات/مخرجات في المثال: ${fmt(d.vat)} ر.س</p>`:''}<div class="case-foot"><span class="muted tiny">${done?esc((state.entries.find(e=>e.documentId===d.id)||{}).ref||'تم الترحيل'):'المجموع '+fmt(num(d.amount)+num(d.vat))+' ر.س'}</span><button class="btn ${done?'btn-secondary':'btn-primary'} btn-sm" data-action="post-document" data-id="${esc(d.id)}" ${done||dependency?'disabled':''}>${done?'✓ تم الترحيل':dependency?'مستند مرتبط مطلوب':'ترحيل المستند'}</button></div></article>`}).join('')}</div><div class="divider"></div><div class="erp-panel-head"><div><h2>إضافة مستند جديد</h2><p>أدخل فاتورة بسيطة لتجربة المعالجة من البداية.</p></div></div><form id="new-document-form" class="form-grid-3"><div class="field"><label>نوع المستند</label><select name="type"><option value="sale">فاتورة بيع آجلة</option><option value="purchase">فاتورة مشتريات آجلة</option><option value="expense">مصروف مدفوع من البنك</option><option value="asset">شراء أصل ثابت آجلا</option></select></div><div class="field"><label>التاريخ</label><input type="date" name="date" value="${today()}" required></div><div class="field"><label>اسم العميل / المورد</label><input name="party" placeholder="مثال: شركة النخبة" required></div><div class="field"><label>المبلغ قبل الضريبة (ر.س)</label><input name="amount" type="number" min="0.01" step="0.01" placeholder="1000" required></div><div class="field"><label>المعاملة الضريبية في هذا التدريب</label><select name="vatMode"><option value="standard">افترض النسبة الأساسية 15%</option><option value="zero">دون ضريبة في هذا المثال</option></select></div><div class="field"><label>وصف / رقم مستند اختياري</label><input name="description" placeholder="مرجع الفاتورة أو تفاصيلها"></div><div class="form-span-2 muted tiny" style="align-self:center">السعر الذي تدخله قبل الضريبة؛ سيحسب المختبر 15% عند اختيارها. تحقق من الخضوع الحقيقي خارج المحاكاة.</div><div style="display:flex;justify-content:flex-end;align-items:end"><button class="btn btn-primary" type="submit">حفظ المستند كمسودة ←</button></div></form></div>`;
  }
  function renderJournal(){
    const entries=state.entries.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
    return `<div class="surface erp-panel"><div class="erp-panel-head"><div><h2>قيود اليومية</h2><p>كل قيد يمر باختبار توازن قبل ترحيله. قيود التسوية تدرج في ميزان ما بعد التسويات فقط.</p></div><span class="tag teal">${entries.length} قيد</span></div><form id="journal-form"><div class="form-grid-3"><div class="field"><label>تاريخ القيد</label><input name="date" type="date" value="${today()}" required></div><div class="field"><label>رقم المرجع</label><input name="ref" placeholder="JE-2026-001"></div><div class="field"><label>نوع القيد</label><select name="entryType"><option value="normal">قيد يومية عادي</option><option value="adjustment">قيد تسوية نهاية الفترة</option></select></div><div class="field form-span-2"><label>البيان</label><input name="description" placeholder="اشرح الحدث الاقتصادي والمستند المؤيد" required></div><div class="field"><label>الفترة</label><input value="${esc(state.fiscalYear)}" disabled></div></div><div class="divider"></div><div class="erp-panel-head"><div><h2>سطور القيد</h2><p>أدخل كل حساب ومبلغه في المدين أو الدائن، وليس كليهما.</p></div><button class="btn btn-secondary btn-sm" type="button" data-action="add-journal-line">+ إضافة سطر</button></div><div id="journal-lines">${[0,1].map(()=>`<div class="journal-line"><div class="field"><label>الحساب</label><select class="j-account" required><option value="">اختر الحساب</option>${accountOptions()}</select></div><div class="field"><label>مدين (ر.س)</label><input class="j-debit" type="number" min="0" step="0.01" placeholder="0.00"></div><div class="field"><label>دائن (ر.س)</label><input class="j-credit" type="number" min="0" step="0.01" placeholder="0.00"></div><button type="button" class="remove-line" data-action="remove-journal-line" aria-label="حذف السطر">×</button></div>`).join('')}</div><div class="journal-totals"><span>إجمالي المدين: <strong id="j-total-debit">0.00</strong> ر.س</span><span>إجمالي الدائن: <strong id="j-total-credit">0.00</strong> ر.س</span><strong id="j-balance" class="journal-balance bad">الفرق 0.00 ر.س</strong></div><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:15px;flex-wrap:wrap"><span class="muted tiny">سيظهر القيد في الأستاذ والميزان بمجرد ترحيله.</span><button class="btn btn-primary" type="submit">التحقق من التوازن وترحيل القيد ←</button></div></form><div class="divider"></div><div class="erp-panel-head"><div><h2>سجل القيود</h2><p>اضغط على عدد السطور أو راجع حسابات القيد من الجدول.</p></div><button class="btn btn-secondary btn-sm" data-action="export-journal">تصدير CSV</button></div>${entries.length?`<div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>المرجع</th><th>البيان</th><th>النوع</th><th class="numeric">مدين</th><th class="numeric">دائن</th></tr></thead><tbody>${entries.map(e=>{const d=e.lines.reduce((s,l)=>s+l.debit,0),c=e.lines.reduce((s,l)=>s+l.credit,0);return `<tr><td>${esc(e.date)}</td><td>${esc(e.ref)}</td><td>${esc(e.description)}<div class="tiny muted">${e.lines.map(l=>esc(account(l.accountId).name)).join(' · ')}</div></td><td><span class="tag ${e.type==='adjustment'?'gold':e.type==='close'?'red':'teal'}">${e.type==='adjustment'?'تسوية':e.type==='close'?'إقفال':'عادي'}</span></td><td class="numeric">${fmt(d)}</td><td class="numeric">${fmt(c)}</td></tr>`}).join('')}</tbody><tfoot><tr><th colspan="4">الإجمالي</th><th class="numeric">${fmt(entries.reduce((s,e)=>s+e.lines.reduce((a,l)=>a+l.debit,0),0))}</th><th class="numeric">${fmt(entries.reduce((s,e)=>s+e.lines.reduce((a,l)=>a+l.credit,0),0))}</th></tr></tfoot></table></div>`:'<div class="empty-state">لا توجد قيود حتى الآن.</div>'}</div>`;
  }
  function renderLedger(){
    const selected=$('#ledger-account')?.value||state.accounts[1]?.id||'1010';const rows=getGeneralLedger(selected);const total=rows.reduce((s,r)=>s+r.debit-r.credit,0);
    return `<div class="surface erp-panel"><div class="erp-panel-head"><div><h2>دفتر الأستاذ</h2><p>عرض حركة الحساب ورصيده المتراكم بعد كل حركة، شاملا قيود التسوية والإقفال.</p></div><span class="tag teal">${rows.length} حركة</span></div><div class="form-grid-3" style="margin-bottom:14px"><div class="field"><label>اختر الحساب</label><select id="ledger-account">${accountOptions(selected)}</select></div><div class="field"><label>اسم الحساب</label><input disabled value="${esc(account(selected).name)}"></div><div class="field"><label>رصيد الحركة النهائي (مدين - دائن)</label><input disabled value="${fmt(total)} ر.س"></div></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>المرجع</th><th>البيان</th><th>النوع</th><th class="numeric">مدين</th><th class="numeric">دائن</th><th class="numeric">الرصيد</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.ref)}</td><td>${esc(r.desc)}</td><td><span class="tag ${r.type==='adjustment'?'gold':r.type==='close'?'red':'teal'}">${r.type==='adjustment'?'تسوية':r.type==='close'?'إقفال':'عادي'}</span></td><td class="numeric">${fmt(r.debit)}</td><td class="numeric">${fmt(r.credit)}</td><td class="numeric">${fmt(r.balance)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state">لا توجد حركات على هذا الحساب. اختر حسابا آخر أو سجل مستندا.</div>'}</div>`;
  }
  function renderTrial(){
    const mode=$('#trial-mode')?.value||'adjusted';const adjustments=mode==='adjusted';const rows=Object.values(calculateBalances({adjustments,closing:false})).filter(r=>r.debit||r.credit||Math.abs(r.balance)>.009).sort((a,b)=>a.account.code.localeCompare(b.account.code));const dr=rows.reduce((s,r)=>s+r.debit,0),cr=rows.reduce((s,r)=>s+r.credit,0);
    return `<div class="surface erp-panel"><div class="erp-panel-head"><div><h2>ميزان المراجعة</h2><p>يمكنك المقارنة بين الأرصدة قبل التسويات وبعدها. قيود الإقفال مستبعدة من هذا العرض.</p></div><div class="toolbar"><select id="trial-mode" class="search-field" style="width:auto"><option value="pre" ${mode==='pre'?'selected':''}>قبل التسويات</option><option value="adjusted" ${mode==='adjusted'?'selected':''}>بعد التسويات</option></select><button class="btn btn-secondary btn-sm" data-action="export-trial">تصدير CSV</button></div></div><div class="balance-warning ${Math.abs(dr-cr)<.009?'ok':'bad'}">${Math.abs(dr-cr)<.009?'✓ إجمالي المدين يساوي إجمالي الدائن. تذكر أن ذلك لا يثبت خلو الدفاتر من كل أخطاء التصنيف أو الإغفال.':'⚠ يوجد فرق قدره '+fmt(dr-cr)+' ريال؛ تحقق من البيانات والقيود.'}</div><div class="table-wrap"><table><thead><tr><th>رقم الحساب</th><th>اسم الحساب</th><th>التصنيف</th><th class="numeric">مدين</th><th class="numeric">دائن</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.account.code)}</td><td>${esc(r.account.name)}</td><td><span class="account-pill">${esc(typeLabel(r.account.type))}</span></td><td class="numeric">${r.balance>0?fmt(r.balance):'—'}</td><td class="numeric">${r.balance<0?fmt(-r.balance):'—'}</td></tr>`).join('')}</tbody><tfoot><tr><th colspan="3">الإجمالي</th><th class="numeric">${fmt(dr)}</th><th class="numeric">${fmt(cr)}</th></tr></tfoot></table></div><div class="inline-note info" style="margin-top:13px"><strong>الفرق بين الميزانين:</strong> افصل قيود التسويات عن قيود العمليات اليومية حتى تستطيع معرفة أثر الإهلاك والمستحقات والمصروفات المقدمة وغيرها من التسويات.</div></div>`;
  }
  function typeLabel(type){return ({asset:'أصل',liability:'التزام',equity:'حقوق ملكية',revenue:'إيراد',expense:'مصروف'})[type]||type;}
  function renderStatements(){
    const closed=state.entries.some(e=>e.type==='close');const balances=calculateBalances({adjustments:true,closing:closed});const prof=pnl({adjustments:true});
    const assets=Object.values(balances).filter(r=>r.account.type==='asset').reduce((s,r)=>s+r.balance,0);
    const currentAssets=Object.values(balances).filter(r=>r.account.type==='asset'&&r.account.group!=='غير متداول'&&r.account.group!=='مجمع إهلاك').reduce((s,r)=>s+r.balance,0);
    const nonCurrentAssets=Object.values(balances).filter(r=>r.account.type==='asset'&&(r.account.group==='غير متداول'||r.account.group==='مجمع إهلاك')).reduce((s,r)=>s+r.balance,0);
    const liab=Object.values(balances).filter(r=>r.account.type==='liability').reduce((s,r)=>s-r.balance,0);
    const capital=Object.values(balances).filter(r=>r.account.type==='equity').reduce((s,r)=>s-r.balance,0);const equity=capital+(closed?0:prof.profit);const check=assets-liab-equity;
    const equityRows=Object.values(balances).filter(r=>r.account.type==='equity'&&Math.abs(r.balance)>.009);
    const bsAssets=Object.values(balances).filter(r=>r.account.type==='asset'&&Math.abs(r.balance)>.009);
    const bsLiab=Object.values(balances).filter(r=>r.account.type==='liability'&&Math.abs(r.balance)>.009);
    const cashMovement=getCashFlow();
    return `<div class="grid grid-2" style="margin-bottom:15px"><section class="surface report-card"><h3>قائمة الربح أو الخسارة · ${esc(state.fiscalYear)}</h3>${moneyRow('إجمالي الإيرادات',prof.revenue)}${Object.values(prof.balances).filter(r=>r.account.type==='revenue'&&Math.abs(r.balance)>.009).map(r=>moneyRow(r.account.name,-r.balance)).join('')}${moneyRow('تكلفة المبيعات',Object.values(prof.balances).filter(r=>r.account.code==='5000').reduce((s,r)=>s+r.balance,0))}${Object.values(prof.balances).filter(r=>r.account.type==='expense'&&r.account.code!=='5000'&&Math.abs(r.balance)>.009).map(r=>moneyRow(r.account.name,r.balance)).join('')}${moneyRow('إجمالي المصروفات والتكاليف',prof.expenses,'report-total')}${moneyRow(prof.profit>=0?'صافي الربح':'صافي الخسارة',prof.profit,'report-total')}</section>
      <section class="surface report-card"><h3>قائمة المركز المالي · تاريخ العرض الحالي</h3><div class="report-row"><strong>الأصول</strong><strong></strong></div>${bsAssets.map(r=>moneyRow(r.account.name,r.balance)).join('')}${moneyRow('الأصول المتداولة وصافي الأصول غير المتداولة',assets,'report-total')}<div class="report-row"><strong>الالتزامات</strong><strong></strong></div>${bsLiab.map(r=>moneyRow(r.account.name,-r.balance)).join('')}${moneyRow('إجمالي الالتزامات',liab,'report-total')}<div class="report-row"><strong>حقوق الملكية</strong><strong></strong></div>${equityRows.map(r=>moneyRow(r.account.name,-r.balance)).join('')}${!closed?moneyRow('ربح / خسارة الفترة',prof.profit):''}${moneyRow('إجمالي الالتزامات وحقوق الملكية',liab+equity,'report-total')}<div class="balance-warning ${Math.abs(check)<.02?'ok':'bad'}" style="margin-top:12px">${Math.abs(check)<.02?'✓ المعادلة المحاسبية متوازنة.':'⚠ فرق المعادلة '+fmt(check)+' ريال؛ راجع تصنيف الأرصدة والقيود.'}</div></section>
      <section class="surface report-card"><h3>قائمة التغيرات في حقوق الملكية · نموذج مبسط</h3>${moneyRow('رأس المال والأرصدة القائمة',capital)}${moneyRow('صافي ربح / خسارة الفترة',closed?0:prof.profit)}${moneyRow('التغير الصافي المحسوب',closed?capital:equity,'report-total')}<p class="muted tiny" style="margin:10px 0 0">عرض تدريبي مختصر؛ القائمة المنشورة الفعلية قد تتطلب تفصيل المساهمات والتوزيعات والدخل الشامل وسياسات العرض ذات الصلة.</p></section>
      <section class="surface report-card"><h3>قائمة التدفقات النقدية · تصنيف تدريبي</h3>${moneyRow('صافي التدفقات من التشغيل',cashMovement.operating)}${moneyRow('صافي التدفقات من الاستثمار',cashMovement.investing)}${moneyRow('صافي التدفقات من التمويل',cashMovement.financing)}${moneyRow('صافي التغير في النقد والبنك',cashMovement.total,'report-total')}<p class="muted tiny" style="margin:10px 0 0">تقسيم تعليمي مبسط يعتمد على الحسابات المقابلة لحركات النقد. إعداد قائمة مطابقة للمعايير يتطلب تصنيفا ومعلومات إضافية وفحص المعاملات.</p></section></div>
      <section class="surface surface-pad"><div class="panel-head"><div><h2 class="section-title">إقفال حسابات الإيرادات والمصروفات</h2><p class="section-subtitle">ينشئ النظام قيدا تدريبيا يغلق الحسابات المؤقتة إلى الأرباح المبقاة.</p></div><span class="tag ${closed?'gold':'teal'}">${closed?'تم الإقفال':'لم يتم الإقفال'}</span></div><p class="muted small">نفّذ الإقفال بعد مراجعة ميزان ما بعد التسويات والقوائم. هذا المختبر لا يمثل نظام إقفال آليا لشركة حقيقية ولا يقفل الفترة في نظام حكومي.</p><button class="btn btn-primary" data-action="close-period" ${closed?'disabled':''}>${closed?'✓ تم إنشاء قيد الإقفال':'إنشاء قيد الإقفال التدريبي'}</button><button class="btn btn-secondary" data-action="erp-tab" data-id="journal" style="margin-right:7px">راجع قيد الإقفال في اليومية</button></section>`;
  }
  function getCashFlow(){
    let operating=0,investing=0,financing=0;
    entriesVisible({adjustments:true,closing:false}).forEach(e=>{
      const cashLines=e.lines.filter(l=>['1000','1010'].includes(l.accountId));if(!cashLines.length)return;
      cashLines.forEach(cl=>{
        const delta=cl.debit-cl.credit;const counterpart=e.lines.filter(l=>l.accountId!==cl.accountId).map(l=>account(l.accountId));
        let cat='operating';if(counterpart.some(a=>a.type==='asset'&&(a.group==='غير متداول'||a.group==='مجمع إهلاك')))cat='investing';else if(counterpart.some(a=>a.type==='equity'||a.code==='2500'))cat='financing';
        if(cat==='operating')operating+=delta;else if(cat==='investing')investing+=delta;else financing+=delta;
      });
    });return {operating,investing,financing,total:operating+investing+financing};
  }
  function renderAccounts(){
    return `<div class="surface erp-panel"><div class="erp-panel-head"><div><h2>دليل الحسابات التدريبي</h2><p>هيكل لأغراض التعلم؛ يجب تخصيصه وفق نشاط المنشأة وإطار التقارير والإعدادات الضريبية المعتمدة.</p></div><span class="tag teal">${state.accounts.length} حسابا</span></div><div class="table-wrap"><table><thead><tr><th>الرمز</th><th>اسم الحساب</th><th>التصنيف</th><th>المجموعة</th><th>الطبيعة المعتادة</th><th class="numeric">الرصيد الحالي</th></tr></thead><tbody>${state.accounts.slice().sort((a,b)=>a.code.localeCompare(b.code)).map(a=>{const r=calculateBalances({adjustments:true,closing:false})[a.id];return `<tr><td>${esc(a.code)}</td><td>${esc(a.name)} ${a.contra?'<span class="tag gold">حساب مقابل</span>':''}</td><td><span class="account-pill">${typeLabel(a.type)}</span></td><td>${esc(a.group)}</td><td>${esc(a.nature)}</td><td class="numeric">${fmt(r?r.balance:0)}</td></tr>`}).join('')}</tbody></table></div><div class="divider"></div><div class="erp-panel-head"><div><h2>إضافة حساب جديد</h2><p>لا تستخدم رقم أو اسم حساب مكرر. لن يعيد هذا الإجراء تصنيف القيود السابقة تلقائيا.</p></div></div><form id="new-account-form" class="form-grid-3"><div class="field"><label>رقم الحساب</label><input name="code" placeholder="مثال: 6700" required></div><div class="field"><label>اسم الحساب</label><input name="name" placeholder="مصروف صيانة" required></div><div class="field"><label>التصنيف</label><select name="type"><option value="asset">أصل</option><option value="liability">التزام</option><option value="equity">حقوق الملكية</option><option value="revenue">إيراد</option><option value="expense">مصروف</option></select></div><div class="form-span-2 muted tiny" style="align-self:center">اختر التصنيف بناء على طبيعة الحساب. الحسابات المقابلة مثل مجمع الإهلاك تحتاج إلى معالجة خاصة.</div><div style="display:flex;justify-content:flex-end;align-items:end"><button class="btn btn-primary" type="submit">إضافة إلى الدليل ←</button></div></form></div>`;
  }

  function downloadFile(filename,content,type='text/plain;charset=utf-8'){
    const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportBackup(){downloadFile('muhasibi-ksa-backup.json',JSON.stringify(state,null,2),'application/json;charset=utf-8');toast('تم تنزيل نسخة احتياطية من بيانات التقدم والمختبر.');}
  function csvEscape(v){return '"'+String(v??'').replace(/"/g,'""')+'"';}
  function exportJournalCSV(){
    const rows=[['رقم القيد','التاريخ','المرجع','البيان','نوع القيد','رقم الحساب','اسم الحساب','مدين','دائن']];state.entries.forEach(e=>e.lines.forEach(l=>rows.push([e.id,e.date,e.ref,e.description,e.type,account(l.accountId).code,account(l.accountId).name,l.debit,l.credit])));
    downloadFile('muhasibi-journal.csv','\uFEFF'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n'),'text/csv;charset=utf-8');toast('تم تصدير اليومية إلى CSV.');
  }
  function exportTrialCSV(){const mode=$('#trial-mode')?.value||'adjusted';const rows=Object.values(calculateBalances({adjustments:mode==='adjusted',closing:false}));const data=[['رقم الحساب','اسم الحساب','مدين','دائن']];rows.forEach(r=>{if(r.debit||r.credit)data.push([r.account.code,r.account.name,Math.max(r.balance,0),Math.max(-r.balance,0)]);});downloadFile('muhasibi-trial-balance.csv','\uFEFF'+data.map(r=>r.map(csvEscape).join(',')).join('\r\n'),'text/csv;charset=utf-8');toast('تم تصدير ميزان المراجعة.');}
  function showResetModal(){
    $('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><header class="modal-head"><div><span class="kicker">إدارة التقدم</span><h2>إعادة ضبط التقدم</h2><p>اختر ما تريد إعادته؛ حذف البيانات لا يمكن التراجع عنه إلا من نسخة احتياطية.</p></div><button class="modal-close" data-action="modal-close">×</button></header><div class="modal-body"><div class="grid" style="gap:12px"><div class="surface-flat" style="padding:15px"><h3 style="margin:0 0 5px;font-size:13px">التقدم التعليمي فقط</h3><p class="muted small">حذف اجتيازات الاختبارات وسجل المحاولات، مع الاحتفاظ ببيانات مختبر ERP.</p><button class="btn btn-secondary" data-action="reset-learning">إعادة ضبط التقدم التعليمي</button></div><div class="surface-flat" style="padding:15px"><h3 style="margin:0 0 5px;font-size:13px">مختبر ERP فقط</h3><p class="muted small">حذف الشركة والقيود والمستندات التعليمية، دون حذف اجتيازات المنهج.</p><button class="btn btn-danger" data-action="reset-erp">إعادة ضبط المختبر</button></div><div class="surface-flat" style="padding:15px"><h3 style="margin:0 0 5px;font-size:13px">كل بيانات التطبيق</h3><p class="muted small">إعادة التطبيق إلى حالته الأولى، بما فيها المظهر والتقدم والمختبر.</p><button class="btn btn-danger" data-action="reset-all">إعادة ضبط كل شيء</button></div></div><div class="divider"></div><button class="btn btn-ghost" data-action="modal-close">إلغاء</button></div></section></div>`;
  }
  function importBackup(file){
    if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const x=JSON.parse(reader.result);if(!x||!Array.isArray(x.entries)||!Array.isArray(x.accounts))throw new Error('format');if(!confirm('سيستبدل الاستيراد بيانات التقدم والمختبر الحالية بالنسخة المختارة. هل تريد المتابعة؟'))return;state={...defaultState(),...x};saveState();setTheme(state.theme);renderView(state.currentView||'home');$('#modal-root').innerHTML='';toast('تم استيراد النسخة الاحتياطية.');}catch(e){toast('تعذر استيراد الملف؛ تأكد أنه نسخة احتياطية صادرة من مُحاسِبي.','error');}};reader.readAsText(file);}

  // Event handling
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-view]');if(nav){const view=nav.dataset.view;if(view){goto(view);return;}}
    const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;
    if(action==='slide'){slideIndex=Number(b.dataset.index)||0;renderHome();}
    if(action==='slide-next'){slideIndex=(slideIndex+1)%slides.length;renderHome();}
    if(action==='slide-prev'){slideIndex=(slideIndex+slides.length-1)%slides.length;renderHome();}
    if(action==='hero-primary'){goto(b.dataset.view||'theory');}
    if(action==='hero-quiz'){const next=window.COURSE_MODULES.find(m=>!state.completedModules.includes(m.id))||window.COURSE_MODULES[0];goto('theory');startQuiz(next.id);}
    if(action==='continue-course'){const next=window.COURSE_MODULES.find(m=>!state.completedModules.includes(m.id))||window.COURSE_MODULES[0];state.activeModule=next.id;saveState();goto('theory');}
    if(action==='open-module'){const id=b.dataset.id,index=window.COURSE_MODULES.findIndex(m=>m.id===id);if(!isUnlocked(index)){toast('اجتز اختبار الفصل السابق أولا حتى تفتح هذا الفصل.','error');return;}state.activeModule=id;saveState();renderTheory($('#course-search')?.value||'');}
    if(action==='next-module'){const i=Number(b.dataset.index);if(!state.completedModules.includes(window.COURSE_MODULES[i].id)){toast('اجتز اختبار هذا الفصل أولا؛ لا يمكن تجاوز بوابة التعلم.','error');return;}if(i+1<window.COURSE_MODULES.length){state.activeModule=window.COURSE_MODULES[i+1].id;saveState();renderTheory();}}
    if(action==='start-quiz')startQuiz(b.dataset.id);
    if(action==='close-quiz')closeQuiz();
    if(action==='quiz-answer')answerQuiz(Number(b.dataset.index));
    if(action==='quiz-next')quizNext();
    if(action==='retry-quiz'){const id=b.dataset.id;quizSession=null;$('#modal-root').innerHTML='';startQuiz(id);}
    if(action==='quiz-next-module'){const id=b.dataset.id;quizSession=null;$('#modal-root').innerHTML='';state.activeModule=id;saveState();renderTheory();}
    if(action==='practice-tab'){state.practiceTab=b.dataset.id;saveState();renderPractice();}
    if(action==='error-select'){state.activeError=Number(b.dataset.index);saveState();renderPractice();}
    if(action==='error-answer')errorAnswer(Number(b.dataset.index),b);
    if(action==='error-next'){state.activeError=(state.activeError+1)%errors.length;saveState();renderPractice();}
    if(action==='sector-details')revealSector(Number(b.dataset.index));
    if(action==='clear-sector')$('#sector-detail').innerHTML='';
    if(action==='go-sector-interview'){state.interviewIndex=Number(b.dataset.index)%interviewQuestions.length;state.shownAnswers[state.interviewIndex]=false;saveState();goto('interview');}
    if(action==='interview-prev'){state.interviewIndex=Math.max(0,state.interviewIndex-1);saveState();renderInterview();}
    if(action==='interview-next'){state.interviewIndex=Math.min(interviewQuestions.length-1,state.interviewIndex+1);saveState();renderInterview();}
    if(action==='toggle-interview-answer'){state.shownAnswers[state.interviewIndex]=!state.shownAnswers[state.interviewIndex];saveState();renderInterview();}
    if(action==='load-company')loadTrainingCompany();
    if(action==='reset-erp'){if($('#modal-root').innerHTML)$('#modal-root').innerHTML='';resetERP();}
    if(action==='erp-tab'){state.erpTab=b.dataset.id;saveState();renderERP();}
    if(action==='post-document')postDocument(b.dataset.id);
    if(action==='add-journal-line'){addJournalLine();updateJournalTotals();}
    if(action==='remove-journal-line'){const row=b.closest('.journal-line');if($$('.journal-line',b.closest('#journal-form')).length<=2){toast('يجب أن يبقى في القيد سطران على الأقل.','error');return;}row.remove();updateJournalTotals();}
    if(action==='close-period')closePeriod();
    if(action==='export'){exportBackup();}
    if(action==='import-backup')$('#import-backup').click();
    if(action==='export-journal')exportJournalCSV();
    if(action==='export-trial')exportTrialCSV();
    if(action==='reset')showResetModal();
    if(action==='modal-close')$('#modal-root').innerHTML='';
    if(action==='reset-learning'){if(!confirm('هل تريد حذف كل نتائج الاختبارات وفتح المنهج من البداية؟'))return;state.completedModules=[];state.quizHistory={};state.attempts={};state.activeModule='m01';state.interviewDrafts={};state.shownAnswers={};saveState();$('#modal-root').innerHTML='';renderView(state.currentView);toast('تمت إعادة ضبط التقدم التعليمي.');}
    if(action==='reset-all'){if(!confirm('تحذير: سيتم حذف كل البيانات المحفوظة محليا. هل أنت متأكد؟'))return;localStorage.removeItem(stateKey);state=defaultState();setTheme('dark');$('#modal-root').innerHTML='';goto('home');toast('أعيد التطبيق إلى حالته الأولى.');}
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='course-search'){renderCourseSidebar(e.target.value);return;}
    if(e.target.matches('.j-debit,.j-credit')){updateJournalTotals();return;}
    if(e.target.id==='interview-draft'){state.interviewDrafts[state.interviewIndex]=e.target.value;saveState();return;}
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='theme-toggle')return;
    if(e.target.id==='ledger-account'){const value=e.target.value;renderERP();const newSel=$('#ledger-account');if(newSel)newSel.value=value;return;}
    if(e.target.id==='trial-mode'){const value=e.target.value;renderERP();const newSel=$('#trial-mode');if(newSel)newSel.value=value;return;}
    if(e.target.matches('.self-check')){state.interviewChecklist=state.interviewChecklist||{};state.interviewChecklist[e.target.dataset.key]=e.target.checked;saveState();}
  });
  document.addEventListener('submit',e=>{
    if(e.target.id==='new-document-form'){e.preventDefault();createCustomDocument(e.target);}
    if(e.target.id==='journal-form'){e.preventDefault();addManualJournal(e.target);}
    if(e.target.id==='new-account-form'){e.preventDefault();addManualAccount(e.target);}
  });
  $('#theme-toggle').addEventListener('click',()=>setTheme(state.theme==='dark'?'light':'dark'));
  $('#mobile-menu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#import-backup').addEventListener('change',e=>{importBackup(e.target.files?.[0]);e.target.value='';});
  document.addEventListener('click',e=>{if(e.target.id==='quiz-backdrop'){closeQuiz();}});

  // Make the backup button offer both export and import using the same control with a quick choice.
  const originalExportHandler = null;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#modal-root').innerHTML)closeQuiz();});

  // Small accessibility patch: all theme state is reflected before rendering.
  document.documentElement.dataset.theme=state.theme==='light'?'light':'dark';$('#theme-toggle').textContent=state.theme==='dark'?'☼':'☾';
  if(state.currentView==='theory')renderTheory();else if(state.currentView==='erp')renderERP();else renderHome();
  updateProgressUI();
})();
