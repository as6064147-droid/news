// ===== Shared Code Across All Pages (Fixed & Secured) =====
const CONFIGURED = !!(typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey);
let db, auth;
if (CONFIGURED) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth ? firebase.auth() : null;
}
const ADMIN = (typeof ADMIN_EMAIL !== 'undefined' ? ADMIN_EMAIL : '').trim().toLowerCase();

const COLORS = [
  ['primary',      'Primary Color',                 '#f5c518'],
  ['bg',           'Page Background',               '#121212'],
  ['text',         'Normal Text',                   '#f2f2f2'],
  ['muted',        'Muted Text (Date)',             '#9a9a9a'],
  ['topbarBg',     'Top Bar Background',            '#000000'],
  ['topbarText',   'Top Bar Text',                  '#f2f2f2'],
  ['title',        'Site Title',                    '#ffffff'],
  ['titleAccent',  'Last Letter Accent',            '#f5c518'],
  ['logoBg',       'Logo Circle Background',        '#f5c518'],
  ['logoRing',     'Logo Ring Border',              '#ffffff'],
  ['logoText',     'Logo Letter (if no image)',     '#121212'],
  ['navBg',        'Categories Bar Background',     '#121212'],
  ['navText',      'Categories Text',               '#f2f2f2'],
  ['navActiveBg',  'Active Category Background',    '#f5c518'],
  ['navActiveText','Active Category Text',          '#121212'],
  ['breakBg',      '"Breaking" Badge Background',   '#f5c518'],
  ['breakText',    '"Breaking" Badge Text',         '#121212'],
  ['tickerBg',     'Ticker Bar Background',         '#1e1e1e'],
  ['tickerText',   'Ticker Text',                   '#f2f2f2'],
  ['labelBg',      'Article Category Tag Bg',       '#f5c518'],
  ['labelText',    'Article Category Tag Text',     '#121212'],
  ['headline',     'News Headlines',                '#ffffff'],
  ['hover',        'Headline Hover Color',          '#f5c518'],
  ['cardBg',       'Card Background',               '#1e1e1e'],
  ['cardText',     'Card Text',                     '#bbbbbb'],
  ['line',         'Dividing Lines',                '#333333'],
  ['footerBg',     'Footer Background',             '#000000'],
  ['footerText',   'Footer Text',                   '#f2f2f2'],
];

const THEMES = {
  'Yellow Dark': {primary:'#f5c518',bg:'#121212',text:'#f2f2f2',muted:'#9a9a9a',title:'#ffffff',titleAccent:'#f5c518',logoBg:'#f5c518',logoText:'#121212',logoRing:'#ffffff',navBg:'#121212',navText:'#f2f2f2',navActiveBg:'#f5c518',navActiveText:'#121212',breakBg:'#f5c518',breakText:'#121212',tickerBg:'#1e1e1e',tickerText:'#f2f2f2',labelBg:'#f5c518',labelText:'#121212',headline:'#ffffff',hover:'#f5c518',cardBg:'#1e1e1e',cardText:'#bbbbbb',line:'#333333',topbarBg:'#000000',footerBg:'#000000'},
  'Yellow Light': {primary:'#eab308',bg:'#faf8f4',text:'#161616',muted:'#777777',title:'#161616',titleAccent:'#eab308',logoBg:'#eab308',logoText:'#ffffff',logoRing:'#161616',navBg:'#faf8f4',navText:'#161616',navActiveBg:'#eab308',navActiveText:'#ffffff',breakBg:'#eab308',breakText:'#ffffff',tickerBg:'#ffffff',tickerText:'#161616',labelBg:'#eab308',labelText:'#ffffff',headline:'#161616',hover:'#eab308',cardBg:'#ffffff',cardText:'#555555',line:'#dddddd',topbarBg:'#161616',footerBg:'#161616',topbarText:'#faf8f4',footerText:'#faf8f4'}
};

const DEFAULT_COLORS = Object.fromEntries(COLORS.map(c => [c[0], c[2]]));
const DEFAULTS = {
  name: 'The Spotlight', slogan: 'Arts & Football News', logo: '',
  ticker: 'Welcome!   ◆   Latest Breaking News',
  cats: ['Arts', 'Football'],
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
const fmtDate = ts => ts && ts.toDate ? ts.toDate().toLocaleDateString('en-US', {day:'numeric', month:'short', year:'numeric'}) : 'Just now';

function toast(t) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = t; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

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
    im.onerror = rd.onerror = () => fail(new Error('Image processing failed'));
    rd.readAsDataURL(file);
  });
}

function notConfiguredMsg() {
  return `<div style="max-width:560px;margin:80px auto;padding:30px;background:#fff3cd;color:#664d03;border-radius:14px;font-family:Tahoma;line-height:1.9;text-align:center">
  <h2>Firebase Not Connected</h2>
  <p>Open <b>config.js</b> and paste your Firebase configuration credentials.</p></div>`;
}

const AUTH_ERRORS = {
  'auth/invalid-email': 'Invalid email format',
  'auth/user-disabled': 'This account has been disabled',
  'auth/user-not-found': 'Account not found',
  'auth/wrong-password': 'Wrong password',
  'auth/invalid-credential': 'Wrong username or password',
  'auth/invalid-login-credentials': 'Wrong username or password',
  'auth/email-already-in-use': 'Email is already in use',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/unauthorized-domain': 'Please add your domain to Firebase authorized domains',
  'auth/network-request-failed': 'Network error. Check your connection',
  'auth/operation-not-allowed': 'Email/Password sign-in is not enabled in Firebase Console',
};
const authErr = e => AUTH_ERRORS[e.code] || ('Error: ' + e.message);

// --- ADMIN GATE ---
function adminGate(box, title, onReady) {
  box.hidden = false;
  box.style.display = "block";
  box.innerHTML = '<div class="login"><p>Checking session...</p></div>';

  auth.onAuthStateChanged(async u => {
    if (!u) return showLogin();
    if (u.email.toLowerCase() !== ADMIN) {
      await auth.signOut().catch(() => {});
      return showLogin('This account is not the administrator.');
    }
    box.hidden = true;
    box.style.display = "none";
    onReady(u);
  });

  function showLogin(notice) {
    box.hidden = false;
    box.style.display = "block";
    box.innerHTML = `<div class="login"><h2>${title}</h2>
      <label>Username<input id="lUser" type="text" dir="ltr" autocomplete="username" placeholder="username"></label>
      <label>Password<input id="lPass" type="password" dir="ltr" autocomplete="current-password" placeholder="password"></label>
      <button class="btn" id="lIn">Sign In</button>
      <p class="msg" id="lMsg">${esc(notice || '')}</p>
      <div id="lHelp"></div></div>`;

    const msg = t => box.querySelector('#lMsg').textContent = t;
    const go = () => {
      const user = box.querySelector('#lUser').value.trim();
      const pass = box.querySelector('#lPass').value;
      if (!user) return msg('Please enter your username');
      if (!pass) return msg('Please enter your password');

      const email = (typeof usernameToEmail === 'function') ? usernameToEmail(user) : '';
      if (!email) return msg('Invalid username.');

      const b = box.querySelector('#lIn');
      b.disabled = true; b.textContent = 'Signing in...'; msg('');
      
      auth.signInWithEmailAndPassword(email, pass)
        .catch(e => {
          msg(authErr(e));
          b.disabled = false; b.textContent = 'Sign In';
        });
    };
    box.querySelector('#lIn').onclick = go;
    box.querySelector('#lPass').onkeydown = e => { if (e.key === 'Enter') go(); };
    box.querySelector('#lUser').onkeydown = e => { if (e.key === 'Enter') box.querySelector('#lPass').focus(); };
  }
}

// --- EDITOR GATE ---
function authGate(box, title, onUser) {
  box.hidden = false;
  box.style.display = "block";
  box.innerHTML = '<div class="login"><p>Checking session...</p></div>';

  auth.onAuthStateChanged(async u => {
    if (!u) return showLogin();
    await u.getIdToken(true).catch(() => {});
    box.hidden = true;
    box.style.display = "none";
    onUser(u);
  });

  function showLogin(notice) {
    box.hidden = false;
    box.style.display = "block";
    box.innerHTML = `<div class="login"><h2>${title}</h2>
      <label>Username<input id="lUser" type="text" dir="ltr" autocomplete="username" placeholder="username" autocapitalize="none"></label>
      <label>Password<input id="lPass" type="password" dir="ltr" autocomplete="current-password" placeholder="password"></label>
      <button class="btn" id="lIn">Sign In</button>
      <p class="msg" id="lMsg">${esc(notice || '')}</p></div>`;
    
    const msg = t => box.querySelector('#lMsg').textContent = t;
    const go = () => {
      const user = box.querySelector('#lUser').value.trim();
      const pass = box.querySelector('#lPass').value;
      if (!user) return msg('Please enter your username');
      if (!pass) return msg('Please enter your password');

      const email = (typeof editorUsernameToEmail === 'function') ? editorUsernameToEmail(user) : '';
      if (!email) return msg('Invalid username');

      const b = box.querySelector('#lIn');
      b.disabled = true; b.textContent = 'Signing in...'; msg('');
      
      auth.signInWithEmailAndPassword(email, pass)
        .catch(e => { msg(authErr(e)); b.disabled = false; b.textContent = 'Sign In'; });
    };
    box.querySelector('#lIn').onclick = go;
    box.querySelector('#lPass').onkeydown = e => { if (e.key === 'Enter') go(); };
    box.querySelector('#lUser').onkeydown = e => { if (e.key === 'Enter') box.querySelector('#lPass').focus(); };
  }
}

function denied(box, text) {
  box.hidden = false;
  box.style.display = "block";
  box.innerHTML = `<div class="login"><h2>Access Denied</h2><p>${esc(text)}</p><button class="btn" onclick="auth.signOut()">Sign Out</button></div>`;
}

function articleManager(root, opts) {
  let editing = null, img = '', items = [];
  root.innerHTML = `
  <div class="box"><h3 id="fTitle">✍️ New Article</h3>
    <div class="thumb" id="aThumb"></div>
    <div class="row-btns" id="imgBtns" hidden><button class="mini" id="aImgDel">Remove Image</button></div>
    
    <label>Title<textarea id="aTitle" rows="2" placeholder="Article Title"></textarea></label>
    <label>Category<select id="aCat">${opts.cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
    <label>Short Summary<textarea id="aSum" rows="2"></textarea></label>
    
    <!-- Formatting Toolbar for Content -->
    <label>Full Content & Formatting</label>
    <div class="editor-toolbar">
      <button type="button" class="mini" onclick="formatText('bold')"><b>B</b></button>
      <button type="button" class="mini" onclick="formatText('italic')"><i>I</i></button>
      <button type="button" class="mini" onclick="formatText('underline')"><u>U</u></button>
      <select id="editorFontSize" onchange="changeFontSize(this.value)" class="mini-select">
        <option value="">حجم الخط</option>
        <option value="14px">صغير (14px)</option>
        <option value="16px">عادي (16px)</option>
        <option value="18px">متوسط (18px)</option>
        <option value="22px">كبير (22px)</option>
        <option value="28px">عنوان فرعي (28px)</option>
      </select>
      <input type="color" id="editorFontColor" onchange="changeFontColor(this.value)" title="لون النص" style="width:36px;height:28px;border:none;cursor:pointer;background:none;">
      <select id="editorLineHeight" onchange="changeLineHeight(this.value)" class="mini-select">
        <option value="">مسافات السطور</option>
        <option value="1.4">ضيق (1.4)</option>
        <option value="1.7">عادي (1.7)</option>
        <option value="2.0">واسع (2.0)</option>
        <option value="2.5">متباعد جداً (2.5)</option>
      </select>
      <button type="button" class="mini" onclick="formatText('justifyLeft')">يسار</button>
      <button type="button" class="mini" onclick="formatText('justifyCenter')">توسيط</button>
      <button type="button" class="mini" onclick="formatText('justifyRight')">يمين</button>
    </div>
    
    <div id="aBody" contenteditable="true" class="rich-textarea" placeholder="اكتب تفاصيل الخبر هنا..."></div>
    
    <div class="row-btns" style="margin-top:16px;">
      <button class="btn" id="aSave">🚀 Publish Article</button>
      <button class="btn ghost" id="aCancel" hidden>Cancel Edit</button>
    </div>
  </div>
  <div class="box"><h3>${opts.admin ? '📰 All Articles' : '📰 My Articles'}</h3><div id="aList">Loading...</div></div>`;
  
  const q = s => root.querySelector(s);
  const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/*';
  q('#aThumb').onclick = () => file.click();
  q('#aImgDel').onclick = () => { img = ''; showThumb(); };
  file.onchange = async () => {
    if (!file.files[0]) return;
    q('#aThumb').innerHTML = 'Processing image...';
    try { img = await compressImage(file.files[0], 1100, 0.78); } catch (e) { toast(e.message); }
    file.value = ''; showThumb();
  };
  function showThumb() {
    q('#aThumb').innerHTML = img ? `<img src="${img}">` : '📷 Click here to add cover image';
    q('#imgBtns').hidden = !img;
  }
  function reset() {
    editing = null; img = '';
    q('#aTitle').value = '';
    q('#aSum').value = '';
    q('#aBody').innerHTML = '';
    q('#fTitle').textContent = '✍️ New Article'; q('#aSave').textContent = '🚀 Publish Article'; q('#aCancel').hidden = true; showThumb();
  }
  q('#aCancel').onclick = reset;
  
  q('#aSave').onclick = async () => {
    const data = { 
      title: q('#aTitle').value.trim(), 
      cat: q('#aCat').value, 
      sum: q('#aSum').value.trim(), 
      body: q('#aBody').innerHTML.trim(), 
      img 
    };
    if (!data.title) return toast('Please enter an article title');
    const b = q('#aSave'); b.disabled = true; b.textContent = 'Saving...';
    try {
      if (editing) await db.collection('articles').doc(editing).update(data);
      else await db.collection('articles').add({ ...data, authorEmail: opts.email, pinned: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      toast(editing ? 'Changes saved successfully' : 'Article published successfully ✔'); reset(); load();
    } catch (e) { toast('Could not save: ' + e.message); }
    b.disabled = false; if (!editing) b.textContent = '🚀 Publish Article';
  };
  
  async function load() {
    let ref = db.collection('articles');
    ref = opts.admin ? ref.orderBy('createdAt', 'desc').limit(200) : ref.where('authorEmail', '==', opts.email);
    try {
      const s = await ref.get();
      items = s.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt?.seconds || 9e9) - (a.createdAt?.seconds || 9e9));
      draw();
    } catch (e) { q('#aList').textContent = 'Could not load articles: ' + e.message; }
  }
  
  function draw() {
    q('#aList').innerHTML = items.length ? items.map(a => `
      <div class="aitem">
        <div class="athumb">${a.img ? `<img src="${a.img}">` : ''}</div>
        <div class="ainfo"><b>${a.pinned ? '⭐ ' : ''}${esc(a.title)}</b>
          <small>${esc(a.cat)} · ${fmtDate(a.createdAt)}${opts.admin ? ' · ' + esc(a.authorEmail) : ''}</small>
          <div class="row-btns">
            <button class="mini" data-act="edit" data-id="${a.id}">✏️ Edit</button>
            ${opts.admin ? `<button class="mini" data-act="pin" data-id="${a.id}">${a.pinned ? 'Unpin' : '⭐ Pin as Main'}</button>` : ''}
            <button class="mini danger" data-act="del" data-id="${a.id}">🗑 Delete</button>
          </div></div></div>`).join('') : '<p class="muted">No articles found yet</p>';
  }
  
  q('#aList').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = items.find(x => x.id === b.dataset.id); if (!a) return;
    if (b.dataset.act === 'edit') {
      editing = a.id; img = a.img || '';
      q('#aTitle').value = a.title || ''; 
      q('#aSum').value = a.sum || ''; 
      q('#aBody').innerHTML = a.body || '';
      if (![...q('#aCat').options].some(o => o.value === a.cat)) q('#aCat').add(new Option(a.cat));
      q('#aCat').value = a.cat;
      q('#fTitle').textContent = '✏️ Edit Article'; q('#aSave').textContent = '💾 Save Changes'; q('#aCancel').hidden = false;
      showThumb(); window.scrollTo({ top: root.offsetTop - 80, behavior: 'smooth' });
    }
    if (b.dataset.act === 'del') {
      if (!confirm('Are you sure you want to delete this article?')) return;
      try { await db.collection('articles').doc(a.id).delete(); toast('Deleted'); if (editing === a.id) reset(); load(); } catch (err) { toast(err.message); }
    }
    if (b.dataset.act === 'pin') {
      try { await db.collection('articles').doc(a.id).update({ pinned: !a.pinned }); load(); } catch (err) { toast(err.message); }
    }
  };
  showThumb(); load();
}

function formatText(command) {
  document.execCommand(command, false, null);
}
function changeFontSize(size) {
  if(!size) return;
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const span = document.createElement("span");
  span.style.fontSize = size;
  span.appendChild(selection.getRangeAt(0).extractContents());
  selection.getRangeAt(0).insertNode(span);
}
function changeFontColor(color) {
  if(!color) return;
  document.execCommand('styleWithCSS', false, true);
  document.execCommand('foreColor', false, color);
}
function changeLineHeight(height) {
  if(!height) return;
  const bodyBox = document.getElementById('aBody');
  if(bodyBox) bodyBox.style.lineHeight = height;
}
