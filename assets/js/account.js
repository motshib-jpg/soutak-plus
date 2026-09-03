(async()=>{
  if(document.body.dataset.page!=="account") return;
  const db=window.SoutakDB;
  const status=document.getElementById("accountStatus");
  const form=document.getElementById("accountLoginForm");
  const signup=document.getElementById("accountSignupBtn");
  const safeReturn=()=>{
    const raw=new URLSearchParams(location.search).get("return")||"products.html";
    return /^(product\.html\?slug=(creator-starter-guide|content-templates|first-audience)|products\.html)$/.test(raw)?raw:"products.html";
  };
  if(!db?.enabled){status.className="form-status err";status.textContent="تعذر الاتصال بخدمة الحسابات.";return}
  const {data:{session}}=await db.client.auth.getSession();
  if(session){location.href=safeReturn();return}

  form?.addEventListener("submit",async e=>{
    e.preventDefault();
    const email=document.getElementById("accountEmail").value.trim();
    const password=document.getElementById("accountPassword").value;
    const btn=form.querySelector('button[type="submit"]');btn.disabled=true;
    const {error}=await db.client.auth.signInWithPassword({email,password});
    btn.disabled=false;
    if(error){status.className="form-status err";status.textContent="تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.";return}
    location.href=safeReturn();
  });

  signup?.addEventListener("click",async()=>{
    const email=document.getElementById("accountEmail").value.trim();
    const password=document.getElementById("accountPassword").value;
    if(!email||password.length<6){status.className="form-status err";status.textContent="أدخل بريدًا صحيحًا وكلمة مرور من 6 أحرف على الأقل.";return}
    signup.disabled=true;
    const {data,error}=await db.client.auth.signUp({email,password});
    signup.disabled=false;
    if(error){status.className="form-status err";status.textContent="تعذر إنشاء الحساب. قد يكون البريد مستخدمًا أو البيانات غير مقبولة.";return}
    if(data?.session){location.href=safeReturn();return}
    status.className="form-status ok";status.textContent="تم إنشاء الحساب. افتح رسالة التفعيل في بريدك ثم سجّل الدخول.";
  });
})();
