/* مساعد مُحاسِبي: يجيب من محتوى المنهج فقط (استرجاع لا توليد)، وإن لم يجد جواباً موثوقاً يقول ذلك ولا يخمّن.
   لربطه بنموذج ذكاء اصطناعي حقيقي: أنشئ خادماً وسيطاً يخفي المفتاح، ثم عيّن window.AI_ENDPOINT في index.html
   (يستقبل {q, ctx} ويعيد {answer}). لا تضع مفتاح API داخل ملفات الموقع أبداً. */
(()=>{const $=s=>document.querySelector(s),
nz=s=>(s||'').replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase(),
tk=s=>nz(s).split(/[^\u0621-\u064Aa-z0-9]+/).map(w=>w.replace(/^(وال|بال|لل|ال)/,'')).filter(w=>w.length>2),
STOP=new Set(['ماذا','كيف','هذا','هذه','اشرح','لماذا','متي','يعني','معني','تعريف','وضح','اذكر','احسب','اعرف','اعمل','اكتب','افضل']),
esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),cut=t=>t.length>460?t.slice(0,t.lastIndexOf(' ',460))+'…':t;
let IX;const idx=()=>IX||(IX=(window.COURSE_MODULES||[]).flatMap((m,i)=>(m.sections||[]).map(s=>({m:i+1,mt:m.title,h:s.h,p:s.p,th:tk(s.h+' '+m.title),tp:tk(s.p)}))));
function ask(q){const w=[...new Set(tk(q))].filter(x=>!STOP.has(x));if(!w.length)return null;
const m=(y,x)=>y==x||(x.length>3&&y.length>3&&(y.startsWith(x)||x.startsWith(y))),
r=idx().map(s=>{let n=0,h=0;w.forEach(x=>{const a=s.th.some(y=>m(y,x)),b=Math.min(3,s.tp.filter(y=>m(y,x)).length);if(a)n+=3;n+=b;if(a||b)h++});return{s,n,h}}).sort((a,b)=>b.n-a.n)[0];
return r&&r.n>=3&&r.h>=Math.ceil(w.length/2)?r.s:null}
const el=document.createElement('div');el.id='chat';el.innerHTML=`<button id="cb" aria-label="مساعد المنصة">💬</button><div id="cp" hidden><div class="ch"><b>مساعد مُحاسِبي</b><button id="cx" aria-label="إغلاق">×</button></div><div id="cm"></div><form id="cf"><input id="ci" placeholder="اسأل عن المحاسبة…" autocomplete="off"><button>إرسال</button></form></div>`;document.body.append(el);
const add=(w,h)=>{const d=document.createElement('div');d.className='m '+w;d.innerHTML=h;$('#cm').append(d);$('#cm').scrollTop=1e6};
add('b','أهلاً! أجيب من محتوى المنهج فقط، وإن لم أجد إجابة موثوقة أخبرك بذلك بدل أن أخمّن. جرّب: «ما هو أساس الاستحقاق؟»');
$('#cb').onclick=()=>{$('#cp').hidden=!$('#cp').hidden;$('#ci').focus()};$('#cx').onclick=()=>$('#cp').hidden=true;
$('#cf').onsubmit=async e=>{e.preventDefault();const q=$('#ci').value.trim();if(!q)return;$('#ci').value='';add('u',esc(q));const s=ask(q);let a;
if(window.AI_ENDPOINT){try{const r=await fetch(window.AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q,ctx:s?s.p:''})});a=(await r.json()).answer}catch(_){}}
add('b',a?esc(a):s?`<b>${s.h}</b><br>${cut(s.p)}<br><small>📖 المصدر: الفصل ${s.m} — ${s.mt}</small><br><button data-view="theory">افتح المنهج ←</button>`:'لم أجد هذا في محتوى المنصة، ولن أخمّن. جرّب صياغة أخرى بكلمات مفتاحية، أو افتح <button data-view="theory">المنهج</button>.')}})();
