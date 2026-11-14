// ===== كود مشترك بين كل الصفحات — مش محتاج تعدّل فيه =====
const CONFIGURED = !!(typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey);
let db, auth;
if (CONFIGURED) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth ? firebase.auth() : null;
}
const ADMIN = (typeof ADMIN_EMAIL !== 'undefined' ? ADMIN_EMAIL : '').trim().toLowerCase();

const COLORS = [
  ['primary',      'اللون الأساسي',                 '#c8102e'],
  ['bg',           'خلفية الصفحة',                  '#faf8f4'],
  ['text',         'لون الكلام العادي',             '#161616'],
  ['muted',        'لون الكلام الباهت (التاريخ)',    '#777777'],
  ['topbarBg',     'الشريط اللي فوق خالص',          '#161616'],
  ['topbarText',   'كلام الشريط اللي فوق',          '#faf8f4'],
  ['title',        'اسم الجريدة',                   '#161616'],
  ['titleAccent',  'آخر حرف في اسم الجريدة',        '#c8102e'],
  ['logoBg',       'خلفية دايرة اللوجو',            '#c8102e'],
  ['logoRing',     'إطار دايرة اللوجو',             '#161616'],
  ['logoText',     'حرف اللوجو (لو مفيش صورة)',      '#ffffff'],
  ['navBg',        'خلفية شريط الأقسام',            '#faf8f4'],
  ['navText',      'كلام الأقسام',                  '#161616'],
  ['navActiveBg',  'خلفية القسم المختار',           '#c8102e'],
  ['navActiveText','كلام القسم المختار',            '#ffffff'],
  ['breakBg',      'خلفية كلمة "عاجل"',             '#c8102e'],
  ['breakText',    'لون كلمة "عاجل"',               '#ffffff'],
  ['tickerBg',     'خلفية شريط العاجل',             '#ffffff'],
  ['tickerText',   'كلام شريط العاجل',              '#161616'],
  ['labelBg',      'خلفية اسم القسم على الخبر',      '#c8102e'],
  ['labelText',    'كلام اسم القسم على الخبر',       '#ffffff'],
  ['headline',     'عناوين الأخبار',                '#161616'],
  ['hover',        'العنوان لما الماوس يقف عليه',    '#c8102e'],
  ['cardBg',       'خلفية كروت الأخبار',            '#ffffff'],
  ['cardText',     'كلام كروت الأخبار',             '#555555'],
  ['line',         'الخطوط الفاصلة',                '#dddddd'],
  ['footerBg',     'خلفية آخر الصفحة',              '#161616'],
  ['footerText',   'كلام آخر الصفحة',               '#faf8f4'],
];
const THEMES = {
  'أحمر كلاسيك': {},
  'ذهبي': {primary:'#b8902f',titleAccent:'#b8902f',logoBg:'#b8902f',navActiveBg:'#b8902f',breakBg:'#b8902f',labelBg:'#b8902f',hover:'#b8902f',bg:'#fbf8ef'},
  'بنفسجي': {primary:'#7b2cbf',titleAccent:'#7b2cbf',logoBg:'#7b2cbf',navActiveBg:'#7b2cbf',breakBg:'#7b2cbf',labelBg:'#7b2cbf',hover:'#7b2cbf',bg:'#f8f5fc',topbarBg:'#1c1226',footerBg:'#1c1226',logoRing:'#1c1226'},
  'أزرق': {primary:'#1d4ed8',titleAccent:'#1d4ed8',logoBg:'#1d4ed8',navActiveBg:'#1d4ed8',breakBg:'#1d4ed8',labelBg:'#1d4ed8',hover:'#1d4ed8',bg:'#f4f6fb',topbarBg:'#0f172a',footerBg:'#0f172a',logoRing:'#0f172a'},
  'ليلي': {primary:'#f5c518',bg:'#121212',text:'#f2f2f2',muted:'#9a9a9a',title:'#ffffff',titleAccent:'#f5c518',logoBg:'#f5c518',logoText:'#121212',logoRing:'#ffffff',navBg:'#121212',navText:'#f2f2f2',navActiveBg:'#f5c518',navActiveText:'#121212',breakBg:'#f5c518',breakText:'#121212',tickerBg:'#1e1e1e',tickerText:'#f2f2f2',labelBg:'#f5c518',labelText:'#121212',headline:'#ffffff',hover:'#f5c518',cardBg:'#1e1e1e',cardText:'#bbbbbb',line:'#333333',topbarBg:'#000000',footerBg:'#000000'},
};
const DEFAULT_COLORS = Object.fromEntries(COLORS.map(c => [c[0], c[2]]));
const DEFAULTS = {
  name: 'نجوم', slogan: 'جريدة الفن والمشاهير', logo: '',
  ticker: 'أهلًا بيكم في جريدتنا\nتابعونا لآخر أخبار الفن',
  cats: ['سينما', 'مسلسلات', 'موسيقى', 'مشاهير', 'مسرح'],
  colors: DEFAULT_COLORS,
};

async function loadSettings() {
  const s = await db.doc('site/settings').get();
  const d = s.exists ? s.data() : {};
  return { ...DEFAULTS, ...d, colors: { ...DEFAULT_COLORS, ...(d.colors || {}) } };
}
function applyColors(c) {
  for (const k in c) document.documentElement.style.setProperty('--' + k, c[k]);
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate = ts => ts && ts.toDate ? ts.toDate().toLocaleDateString('ar-EG', {day:'numeric', month:'long', year:'numeric'}) : 'دلوقتي';

function toast(t) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = t; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

// تصغير الصور عشان تتحفظ في قاعدة البيانات
function compressImage(file, max, quality, type = 'image/jpeg') {
  return new Promise((ok, fail) => {
    const rd = new FileReader(), im = new Image();
    rd.onload = () => { im.src = rd.result; };
    im.onload = () => {
      let size = max, q = quality, out;
      do {
        const s = Math.min(1, size / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        const ctx = c.getContext('2d');
        if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(im, 0, 0, c.width, c.height);
        out = c.toDataURL(type, q);
        size *= 0.8; q = Math.max(0.5, q - 0.08);
      } while (out.length > 700000 && size > 200);
      ok(out);
    };
    im.onerror = rd.onerror = () => fail(new Error('الصورة دي مش شغالة'));
    rd.readAsDataURL(file);
  });
}

function notConfiguredMsg() {
  return `<div style="max-width:560px;margin:80px auto;padding:30px;background:#fff3cd;color:#664d03;border-radius:14px;font-family:Tahoma;line-height:1.9;text-align:center">
  <h2>الجريدة لسه مش متوصلة بـ Firebase</h2>
  <p>افتح ملف <b>config.js</b> والصق فيه البيانات اللي خدتها من Firebase، وبعدين ارفع الملفات تاني.</p></div>`;
}

// ===== تسجيل الدخول =====
const AUTH_ERRORS = {
  'auth/invalid-credential': 'الإيميل أو الباسورد غلط',
  'auth/wrong-password': 'الباسورد غلط',
  'auth/user-not-found': 'مفيش حساب بالإيميل ده، دوس "أول مرة؟ اعمل حساب"',
  'auth/email-already-in-use': 'الإيميل ده عنده حساب بالفعل، دوس "دخول"',
  'auth/weak-password': 'الباسورد لازم يبقى 6 حروف أو أرقام على الأقل',
  'auth/invalid-email': 'الإيميل مكتوب غلط',
  'auth/too-many-requests': 'محاولات كتير، استنى شوية وجرب تاني',
  'auth/unauthorized-domain': 'لازم تضيف لينك الموقع في Firebase (الخطوة 7 في الشرح)',
};
const authErr = e => AUTH_ERRORS[e.code] || ('حصلت مشكلة: ' + e.message);

function authGate(box, title, onUser) {
  box.innerHTML = '<div class="login"><p>جاري التحميل...</p></div>';
  auth.onAuthStateChanged(async u => {
    if (!u) return showLogin();
    if (!u.emailVerified) return showVerify(u);
    await u.getIdToken(true);
    box.hidden = true;
    onUser(u);
  });
  function showLogin() {
    box.hidden = false;
    box.innerHTML = `<div class="login"><h2>${title}</h2>
      <label>الإيميل<input id="lEmail" type="email" dir="ltr"></label>
      <label>الباسورد<input id="lPass" type="password" dir="ltr"></label>
      <button class="btn" id="lIn">دخول</button>
      <button class="btn ghost" id="lUp">أول مرة؟ اعمل حساب</button>
      <button class="link" id="lForgot">نسيت الباسورد</button>
      <p class="msg" id="lMsg"></p></div>`;
    const em = () => box.querySelector('#lEmail').value.trim().toLowerCase();
    const pw = () => box.querySelector('#lPass').value;
    const msg = t => box.querySelector('#lMsg').textContent = t;
    box.querySelector('#lIn').onclick = () => auth.signInWithEmailAndPassword(em(), pw()).catch(e => msg(authErr(e)));
    box.querySelector('#lUp').onclick = async () => {
      try { const r = await auth.createUserWithEmailAndPassword(em(), pw()); await r.user.sendEmailVerification(); }
      catch (e) { msg(authErr(e)); }
    };
    box.querySelector('#lForgot').onclick = () => {
      if (!em()) return msg('اكتب إيميلك الأول');
      auth.sendPasswordResetEmail(em()).then(() => msg('بعتنالك رسالة على الإيميل تغيّر منها الباسورد')).catch(e => msg(authErr(e)));
    };
  }
  function showVerify(u) {
    box.hidden = false;
    box.innerHTML = `<div class="login"><h2>أكّد إيميلك</h2>
      <p>بعتنا رسالة على <b dir="ltr">${esc(u.email)}</b>. افتحها ودوس على اللينك اللي فيها، وبعدين ارجع هنا ودوس "أكّدت خلاص".<br><small>لو مش لاقيها بص في الـ Spam.</small></p>
      <button class="btn" id="vDone">أكّدت خلاص</button>
      <button class="btn ghost" id="vAgain">ابعت الرسالة تاني</button>
      <button class="link" id="vOut">خروج</button><p class="msg" id="vMsg"></p></div>`;
    box.querySelector('#vDone').onclick = async () => { await u.reload(); if (auth.currentUser.emailVerified) location.reload(); else box.querySelector('#vMsg').textContent = 'لسه الإيميل ما اتأكدش'; };
    box.querySelector('#vAgain').onclick = () => u.sendEmailVerification().then(() => box.querySelector('#vMsg').textContent = 'اتبعتت تاني').catch(e => box.querySelector('#vMsg').textContent = authErr(e));
    box.querySelector('#vOut').onclick = () => auth.signOut();
  }
}
function denied(box, text) {
  box.hidden = false;
  box.innerHTML = `<div class="login"><h2>مش مسموح</h2><p>${text}</p><button class="btn" onclick="auth.signOut()">خروج</button></div>`;
}

// ===== إدارة الأخبار (مشتركة بين المدير والمحرر) =====
function articleManager(root, opts) {
  let editing = null, img = '', items = [];
  root.innerHTML = `
  <div class="box"><h3 id="fTitle">✍️ خبر جديد</h3>
    <div class="thumb" id="aThumb"></div>
    <div class="row-btns" id="imgBtns" hidden><button class="mini" id="aImgDel">شيل الصورة</button></div>
    <label>العنوان<textarea id="aTitle" rows="2" placeholder="عنوان الخبر"></textarea></label>
    <label>القسم<select id="aCat">${opts.cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
    <label>ملخص قصير (بيظهر تحت العنوان)<textarea id="aSum" rows="2"></textarea></label>
    <label>نص الخبر كامل<textarea id="aBody" rows="9"></textarea></label>
    <div class="row-btns"><button class="btn" id="aSave">🚀 نشر الخبر</button><button class="btn ghost" id="aCancel" hidden>إلغاء التعديل</button></div>
  </div>
  <div class="box"><h3>${opts.admin ? '📰 كل الأخبار' : '📰 أخباري'}</h3><div id="aList">جاري التحميل...</div></div>`;
  const q = s => root.querySelector(s);
  const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/*';
  q('#aThumb').onclick = () => file.click();
  q('#aImgDel').onclick = () => { img = ''; showThumb(); };
  file.onchange = async () => {
    if (!file.files[0]) return;
    q('#aThumb').innerHTML = 'جاري تجهيز الصورة...';
    try { img = await compressImage(file.files[0], 1100, 0.78); } catch (e) { toast(e.message); }
    file.value = ''; showThumb();
  };
  function showThumb() {
    q('#aThumb').innerHTML = img ? `<img src="${img}">` : '📷 اضغط هنا لإضافة صورة الخبر';
    q('#imgBtns').hidden = !img;
  }
  function reset() {
    editing = null; img = '';
    ['#aTitle', '#aSum', '#aBody'].forEach(s => q(s).value = '');
    q('#fTitle').textContent = '✍️ خبر جديد'; q('#aSave').textContent = '🚀 نشر الخبر'; q('#aCancel').hidden = true; showThumb();
  }
  q('#aCancel').onclick = reset;
  q('#aSave').onclick = async () => {
    const data = { title: q('#aTitle').value.trim(), cat: q('#aCat').value, sum: q('#aSum').value.trim(), body: q('#aBody').value.trim(), img };
    if (!data.title) return toast('اكتب عنوان الخبر');
    const b = q('#aSave'); b.disabled = true; b.textContent = 'جاري الحفظ...';
    try {
      if (editing) await db.collection('articles').doc(editing).update(data);
      else await db.collection('articles').add({ ...data, authorEmail: opts.email, pinned: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      toast(editing ? 'تم حفظ التعديل' : 'تم نشر الخبر ✔'); reset(); load();
    } catch (e) { toast('مقدرناش نحفظ: ' + e.message); }
    b.disabled = false; if (!editing) b.textContent = '🚀 نشر الخبر';
  };
  async function load() {
    let ref = db.collection('articles');
    ref = opts.admin ? ref.orderBy('createdAt', 'desc').limit(200) : ref.where('authorEmail', '==', opts.email);
    try {
      const s = await ref.get();
      items = s.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt?.seconds || 9e9) - (a.createdAt?.seconds || 9e9));
      draw();
    } catch (e) { q('#aList').textContent = 'مقدرناش نجيب الأخبار: ' + e.message; }
  }
  function draw() {
    q('#aList').innerHTML = items.length ? items.map(a => `
      <div class="aitem">
        <div class="athumb">${a.img ? `<img src="${a.img}">` : ''}</div>
        <div class="ainfo"><b>${a.pinned ? '⭐ ' : ''}${esc(a.title)}</b>
          <small>${esc(a.cat)} · ${fmtDate(a.createdAt)}${opts.admin ? ' · ' + esc(a.authorEmail) : ''}</small>
          <div class="row-btns">
            <button class="mini" data-act="edit" data-id="${a.id}">✏️ تعديل</button>
            ${opts.admin ? `<button class="mini" data-act="pin" data-id="${a.id}">${a.pinned ? 'شيله من الرئيسي' : '⭐ خليه الخبر الرئيسي'}</button>` : ''}
            <button class="mini danger" data-act="del" data-id="${a.id}">🗑 حذف</button>
          </div></div></div>`).join('') : '<p class="muted">لسه مفيش أخبار</p>';
  }
  q('#aList').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = items.find(x => x.id === b.dataset.id); if (!a) return;
    if (b.dataset.act === 'edit') {
      editing = a.id; img = a.img || '';
      q('#aTitle').value = a.title || ''; q('#aSum').value = a.sum || ''; q('#aBody').value = a.body || '';
      if (![...q('#aCat').options].some(o => o.value === a.cat)) q('#aCat').add(new Option(a.cat));
      q('#aCat').value = a.cat;
      q('#fTitle').textContent = '✏️ تعديل خبر'; q('#aSave').textContent = '💾 حفظ التعديل'; q('#aCancel').hidden = false;
      showThumb(); window.scrollTo({ top: root.offsetTop - 80, behavior: 'smooth' });
    }
    if (b.dataset.act === 'del') {
      if (!confirm('متأكد إنك عايز تحذف الخبر ده؟')) return;
      try { await db.collection('articles').doc(a.id).delete(); toast('اتحذف'); if (editing === a.id) reset(); load(); } catch (err) { toast(err.message); }
    }
    if (b.dataset.act === 'pin') {
      try { await db.collection('articles').doc(a.id).update({ pinned: !a.pinned }); load(); } catch (err) { toast(err.message); }
    }
  };
  showThumb(); load();
}
