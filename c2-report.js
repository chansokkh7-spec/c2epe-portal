/* C2-EPE – send scores from the school's Online Class apps to the teacher dashboard
   (portal → ☰ Apps & Services → 📊 Practice Results). Loaded by every Online-…-app.html. */
(function () {
  var CFG = { apiKey: "AIzaSyAmATKmyTWQqqyNDqxbzN4CdTKAyzG1Dq4", authDomain: "c2epe-school-share-and-post.firebaseapp.com",
    projectId: "c2epe-school-share-and-post", storageBucket: "c2epe-school-share-and-post.firebasestorage.app",
    messagingSenderId: "109849107156", appId: "1:109849107156:web:0b67b05f3511d2f0893941" };
  var LEVELS = [['K0', 'K0'], ['K1', 'K1'], ['K2', 'K2'], ['K3', 'K3'], ['Starters', 'Starters (Pre-A1)'], ['Movers', 'Movers (A1)'], ['Flyers', 'Flyers (A2)'],
    ['Beginner', 'Beginner / Elementary (A1)'], ['Pre-Intermediate', 'Pre-Intermediate (A2)'], ['Intermediate', 'Intermediate (B1)'],
    ['Upper-Intermediate', 'Upper-Intermediate (B2)'], ['Advanced', 'Advanced (C1)'], ['Proficiency', 'Proficiency (C2)'],
    ['EAP / Bridge to University', 'EAP / Bridge to University'], ['IELTS & TOEFL Prep', 'IELTS & TOEFL Preparation'], ['Online Class', 'Online Class'],
    ['Exam Prep', 'Standard Exam Prep'], ['Grammar', 'Grammar'], ['Writing Skills', 'Writing Skills'], ['Computer', 'Computer Class'], ['AI', 'AI Class']];
  var save = null, last = {};
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  var file = (location.pathname.split('/').pop() || 'app').replace(/\.html?$/i, '');
  var PREFIX = 'app-' + slug(file.replace(/-app$/i, ''));
  var BOOK = file.replace(/-app$/i, '').replace(/-/g, ' ').replace(/^Online Class /, 'Online Class – ');

  function getFb() {
    if (save) return Promise.resolve(save);
    return Promise.all([import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'), import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')])
      .then(function (m) {
        var app = m[0].initializeApp(CFG, 'c2report'), db = m[1].getFirestore(app);
        save = function (d) { return m[1].addDoc(m[1].collection(db, 'practiceResults'), d); };
        return save;
      });
  }
  function who() {
    try { var s = JSON.parse(ls('c2epe_student_session') || 'null'); if (s && (s.name || s.studentId)) return { studentId: s.studentId || '', name: s.name || s.studentId, cls: s.cls || '', login: true }; } catch (e) {}
    try { var w = JSON.parse(ls('c2p-who') || 'null'); if (w && w.name && w.cls) return { studentId: '', name: w.name, cls: w.cls, login: false }; } catch (e) {}
    return null;
  }
  function toast(t, c) {
    var d = document.createElement('div');
    d.textContent = t;
    d.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:' + (c || '#1e8e3e') + ';color:#fff;padding:10px 16px;border-radius:22px;font:600 14px system-ui,Arial;z-index:2147483647;box-shadow:0 4px 14px rgba(0,0,0,.25);max-width:90%';
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3500);
  }
  function ask(cb) {
    var w = document.createElement('div');
    w.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,40,.55);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:14px;font-family:system-ui,Arial';
    w.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:360px;width:100%;padding:18px;border-top:5px solid #c9973a">'
      + '<div style="font-weight:800;color:#0f2147;font-size:17px;margin-bottom:4px">📤 Send your score to your teacher</div>'
      + '<div style="font-size:13px;color:#666;margin-bottom:10px">ផ្ញើពិន្ទុទៅគ្រូ – write your name and choose your level once.</div>'
      + '<input id="c2r-n" placeholder="Your name / ឈ្មោះ" style="width:100%;box-sizing:border-box;padding:10px;border:1.5px solid #ccd;border-radius:10px;font-size:16px;margin-bottom:8px">'
      + '<select id="c2r-l" style="width:100%;padding:10px;border:1.5px solid #ccd;border-radius:10px;font-size:16px;margin-bottom:12px"><option value="">Your level / កម្រិត</option>'
      + LEVELS.map(function (l) { return '<option value="' + l[0] + '">' + l[1] + '</option>'; }).join('') + '</select>'
      + '<div style="display:flex;gap:8px"><button id="c2r-x" style="flex:1;padding:10px;border:none;border-radius:20px;background:#eef1f8;font-weight:700">Not now</button>'
      + '<button id="c2r-ok" style="flex:1;padding:10px;border:none;border-radius:20px;background:#0f2147;color:#e8c36a;font-weight:700">Send ✓</button></div></div>';
    document.body.appendChild(w);
    w.querySelector('#c2r-x').onclick = function () { w.remove(); cb(null); };
    w.querySelector('#c2r-ok').onclick = function () {
      var n = w.querySelector('#c2r-n').value.trim(), l = w.querySelector('#c2r-l').value;
      if (!n || !l) { (n ? w.querySelector('#c2r-l') : w.querySelector('#c2r-n')).style.borderColor = '#d93025'; return; }
      ls('c2p-who', JSON.stringify({ name: n, cls: l })); w.remove(); cb(who());
    };
  }
  function queue() { try { return JSON.parse(ls('c2p-queue') || '[]'); } catch (e) { return []; } }
  function send(d) {
    getFb().then(function (s) { return s(d); }).then(function () { toast('📤 Score sent to your teacher ✓'); })
      .catch(function () { var q = queue(); q.push(d); ls('c2p-queue', JSON.stringify(q.slice(-50))); toast('⏳ Score saved – will send later', '#b26a00'); });
  }
  /* activity: name of the game/quiz, score/total: numbers, st: the app's state ({level, unit}) */
  window.C2REPORT = function (activity, score, total, st) {
    if (!(total > 0)) return;
    st = st || {};
    activity = String(activity || 'Activity').replace(/^[^A-Za-z0-9]+/, '').trim();
    var unit = st.unit != null ? st.unit : '', lv = (/grammar/.test(PREFIX) && st.level) ? String(st.level) : '', setId = PREFIX + (lv ? '-' + slug(lv) : '') + '-u' + unit + '-' + slug(activity);
    if (last[setId] && Date.now() - last[setId] < 4000) return; last[setId] = Date.now();
    var go = function (me) {
      if (!me) return;
      var n = parseInt(ls('c2p-n-' + setId) || '0', 10) + 1; ls('c2p-n-' + setId, String(n));
      var now = new Date();
      send({ prefix: PREFIX, level: BOOK, setId: setId, setTitle: (lv ? lv + ' ' : '') + (unit !== '' ? 'Unit ' + unit + ' – ' : '') + activity, kind: 'app',
        studentId: me.studentId || '', studentName: me.name, cls: me.cls || '', login: !!me.login,
        score: score, total: total, pct: Math.round(score * 100 / total), attempt: n, at: now.toISOString(), day: now.toISOString().slice(0, 10) });
    };
    var me = who(); if (me) go(me); else ask(go);
  };
  /* resend anything that failed before */
  setTimeout(function () {
    var q = queue(); if (!q.length) return; ls('c2p-queue', '[]');
    getFb().then(function (s) { q.forEach(function (d) { s(d).catch(function () { var k = queue(); k.push(d); ls('c2p-queue', JSON.stringify(k.slice(-50))); }); }); })
      .catch(function () { ls('c2p-queue', JSON.stringify(q)); });
  }, 4000);
})();
