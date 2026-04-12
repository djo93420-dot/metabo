// app.js — METABO : Initialisation, État, Storage, Firebase, PWA
// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let sex='H', eq='cunningham', trainingLevel='debutant';
let muscuEnabled=false, muscuIntensity='legere', objectif='maintien';
let fidgetLevel='none', fidgetKcal=0, sexActiviteKcal=0;
let tapisRows=[], muscuRows=[], cardioRows=[], supersetBlocks=[], foodRows=[];
let tapisCount=0, muscuCount=0, cardioCount=0, supersetCount=0, foodCount=0;
const SAVE_KEY='metabo_session', HIST_KEY='metabo_history', SEANCES_KEY='metabo_seances';

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const restored = loadState();
  if (!restored) { addTapisRow(); addCardioRow(); }
  initTheme(); initAccent(); injectManifest(); initPWA(); initPoidsObjectif(); initNotifs(); updateLBM(); updateTEF(); updateLIPAHint(); updateWorkStatus(); updateFibresCalc(); updateHydraCalc(); renderPoidsLog();
  updateCycleNote(); renderSeancePills(); renderRepasPills(); renderHistory();
  updateLiveBar();

  const dot = document.querySelector('.live-dot');
  if (restored && dot) { dot.style.background='var(--teal)'; setTimeout(()=>dot.style.background='var(--blue)',2000); }

  let st;
  document.addEventListener('input', ()=>{ clearTimeout(st); st=setTimeout(()=>{ saveState(); updateLiveBar(); },400); });
  document.addEventListener('change', ()=>{ clearTimeout(st); st=setTimeout(()=>{ saveState(); updateLiveBar(); },400); });
  document.addEventListener('click', ()=>{ setTimeout(updateLiveBar, 100); });
});


function saveState(){
  try{
    const state = collectState();
    state._lastRecordedDate = new Date().toISOString().slice(0, 10);
    localStorage.setItem(SAVE_KEY,JSON.stringify(state));
    if(typeof triggerSyncToCloud === 'function') triggerSyncToCloud();
  }catch(e){}
}

function loadState(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return false;
    const s=JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    const isNewDay = s._lastRecordedDate && s._lastRecordedDate !== today;
    const p=s.profil;
    if(p){
      setVal('age',p.age);setVal('poids',p.poids);setVal('taille',p.taille);
      setVal('pctGraisse',p.pctGraisse);setVal('methGraisse',p.methGraisse);
      if(p.sex)setSex(p.sex);
      if(p.eq){eq=p.eq;document.querySelectorAll('.eq-pill').forEach(el=>el.classList.toggle('active',el.getAttribute('onclick').includes(`'${p.eq}'`)));document.getElementById('eq-desc').textContent=EQ_DESC[p.eq]||'';}
      if(p.trainingLevel){trainingLevel=p.trainingLevel;document.querySelectorAll('.lv-pill').forEach(el=>el.classList.toggle('active',el.getAttribute('onclick').includes(`'${p.trainingLevel}'`)));}
      setVal('cyclePhase',p.cyclePhase);setVal('sommeil',p.sommeil);setVal('sommeil-h',p.sommeilH);
      setVal('work-status',p.workStatus);setVal('work-hours',p.workHours);
      if(p.objectif)setObjectif(p.objectif);
      setVal('obj-delta',p.objDelta);setVal('prot-ratio',p.protRatio);
      if(p.poidsObjectif){setVal('poids-objectif',p.poidsObjectif);localStorage.setItem('metabo_poids_obj',p.poidsObjectif);}
      if(p.dateObjectif)setVal('date-objectif',p.dateObjectif);
    }
    if(s.tapis&&s.tapis.length>0){
      s.tapis.forEach(t=>{
        const id=++tapisCount;tapisRows.push(id);
        const div=document.createElement('div');div.className='row-block tapis-row';div.id=`tapis-${id}`;
        div.innerHTML=tapisRowHTML(id,t);
        document.getElementById('tapis-list').appendChild(div);
        updateTapisType(id);
        if(t.mode==='fraction'){
          setTapisMode(id,'fraction');
          (t.cycles||[]).forEach(c=>addFracCycle(id,c));
          setVal(`t-reps-${id}`,t.reps);
        }
      });
    }
    if(s.cardio&&s.cardio.length>0){s.cardio.forEach(c=>addCardioRow(c));}
    if(s.muscu){
      if(s.muscu.enabled){muscuEnabled=false;toggleMuscu();}
      if(s.muscu.intensity)setIntensity(s.muscu.intensity);
      (s.muscu.singles||[]).forEach(r=>addMuscuRow(r));
      (s.muscu.ss||[]).forEach(ss=>addSupersetBlock(ss));
    }
    if(isNewDay && s.alim) {
      s.alim = { macroP:0, macroC:0, macroL:0, alcoolType:'vin', alcoolQty:0, food:[] };
    }
    if(s.alim){
      setVal('macro-p',s.alim.macroP);setVal('macro-c',s.alim.macroC);setVal('macro-l',s.alim.macroL);
      (s.alim.food||[]).forEach(f=>addFoodRow(f));
    }
    if(isNewDay && s.activite) {
      s.activite.marcheHors = 0;
      s.activite.menage = 0;
      s.activite.trajets = 0;
      s.activite.hydraLitres = 0;
      s.activite.fidgetLevel = '';
      s.activite.sexActiviteLevel = 'none';
      setTimeout(() => showToast("🌅 Nouvelle journée — Compteurs réinitialisés"), 1000);
    }
    if(s.activite){
      setVal('metier',s.activite.metier);setVal('work-hours',s.activite.workHours);
      setVal('marche-hors',s.activite.marcheHors);setVal('menage',s.activite.menage);
      setVal('trajets',s.activite.trajets);setVal('temperature',s.activite.temperature);
      if(s.activite.fibresG) setVal('fibres-g',s.activite.fibresG);
      if(s.activite.digestionSpeed) setVal('digestion-speed',s.activite.digestionSpeed);
      // Restaurer fidget
      if(s.activite.fidgetLevel){
        const fc=document.querySelector(`.fidget-card[onclick*="${s.activite.fidgetLevel}"]`);
        if(fc) setFidget(s.activite.fidgetLevel,fc);
      }
      // Restaurer sex activite
      if(s.activite.sexActiviteLevel){
        const sc=document.querySelector(`.sex-card[onclick*="${s.activite.sexActiviteLevel}"]`);
        if(sc) setSexActivite(s.activite.sexActiviteLevel,sc);
      }
      // Restaurer hydratation
      if(s.activite.hydraLitres) setVal('hydra-litres',s.activite.hydraLitres);
      if(s.activite.hydraTemp) setHydraTemp(s.activite.hydraTemp);
    }
    return true;
  }catch(e){console.warn('loadState error',e);return false;}
}



// ═══════════════════════════════════════════════════════════
// REPAS SAUVEGARDÉS
// ═══════════════════════════════════════════════════════════
const REPAS_KEY = 'metabo_repas';
function loadRepas() { try { return JSON.parse(localStorage.getItem(REPAS_KEY)||'[]'); } catch { return []; } }
function saveRepas(r) { localStorage.setItem(REPAS_KEY, JSON.stringify(r)); }

function renderRepasPills() {
  const repas = loadRepas();
  const el = document.getElementById('repas-pills');
  if (!el) return;
  el.innerHTML = repas.map(r => `
    <span class="repas-pill" onclick="chargerRepas(${r.id})">
      ${r.name} <span style="color:var(--orange);font-size:10px;">${r.kcal} kcal</span>
      <span class="rp-del" onclick="event.stopPropagation();supprimerRepas(${r.id})">✕</span>
    </span>`).join('');
}

function sauvegarderRepas() {
  if (foodRows.length === 0) { showToast('⚠️ Aucun aliment à sauvegarder'); return; }
  const name = prompt('Nom du repas (ex: Mon petit déj) :');
  if (!name?.trim()) return;
  const real = getRealIntake();
  const items = foodRows.map(id => ({
    n: document.getElementById(`fn-${id}`)?.value || '',
    k: document.getElementById(`fk-${id}`)?.value || '',
    p: document.getElementById(`fp-${id}`)?.value || '',
    c: document.getElementById(`fc-${id}`)?.value || '',
    l: document.getElementById(`fl-${id}`)?.value || '',
  }));
  const repas = loadRepas();
  repas.push({ id: Date.now(), name: name.trim(), kcal: real.kcal, items });
  saveRepas(repas);
  renderRepasPills();
  showToast(`✅ Repas "${name}" sauvegardé`);
}

function chargerRepas(id) {
  const repas = loadRepas().find(r => r.id === id);
  if (!repas) return;
  repas.items.forEach(item => addFoodRow(item));
  showToast(`📋 "${repas.name}" chargé`);
}

function supprimerRepas(id) {
  saveRepas(loadRepas().filter(r => r.id !== id));
  renderRepasPills();
}

// ═══════════════════════════════════════════════════════════
// ALCOOL
// ═══════════════════════════════════════════════════════════
const ALCOOL_DATA = {
  none:      { kcal: 0,   ethanol: 0,   label: 'Aucun',         lipolyse: null },
  biere:     { kcal: 150, ethanol: 14,  label: '1 bière (33cl)', lipolyse: '~12h' },
  verre_vin: { kcal: 120, ethanol: 12,  label: '1 verre vin',    lipolyse: '~10h' },
  shot:      { kcal: 70,  ethanol: 14,  label: '1 shot',         lipolyse: '~8h' },
  cocktail:  { kcal: 200, ethanol: 18,  label: '1 cocktail',     lipolyse: '~14h' },
  soiree:    { kcal: 500, ethanol: 60,  label: 'Soirée',         lipolyse: '~16h+' },
};
let alcoolType = 'none';

function setAlcool(type, el) {
  alcoolType = type;
  document.querySelectorAll('.alcool-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const qtyWrap = document.getElementById('alcool-qty-wrap');
  if (qtyWrap) qtyWrap.style.display = type === 'none' ? 'none' : 'block';
  updateAlcoolCalc();
  saveState(); updateLiveBar();
}

function updateAlcoolCalc() {
  const d = ALCOOL_DATA[alcoolType] || ALCOOL_DATA.none;
  const qty = alcoolType === 'none' ? 0 : +document.getElementById('alcool-qty')?.value || 1;
  const totalKcal = d.kcal * qty;
  setElText('alcool-kcal-display', totalKcal);
  const effectEl = document.getElementById('alcool-effect');
  if (effectEl) {
    if (d.lipolyse) {
      effectEl.textContent = `Lipolyse bloquée ${d.lipolyse}`;
      effectEl.style.color = 'var(--red)';
    } else {
      effectEl.textContent = '—';
      effectEl.style.color = 'var(--text3)';
    }
  }
  updateLiveBar();
}

function getAlcoolKcal() {
  const d = ALCOOL_DATA[alcoolType] || ALCOOL_DATA.none;
  const qty = alcoolType === 'none' ? 0 : +document.getElementById('alcool-qty')?.value || 1;
  return d.kcal * qty;
}

// ═══════════════════════════════════════════════════════════
// SYNCHRO JSON / QR
// ═══════════════════════════════════════════════════════════
function openSync() {
  document.getElementById('sync-overlay').classList.add('open');
  generateQR();
}
function closeSyncOverlay() { document.getElementById('sync-overlay').classList.remove('open'); }

function switchSyncTab(tab, el) {
  document.querySelectorAll('.sync-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sync-export-panel').style.display = tab === 'export' ? 'block' : 'none';
  document.getElementById('sync-import-panel').style.display = tab === 'import' ? 'block' : 'none';
}

function getAllData() {
  return {
    version: 3,
    exported: new Date().toISOString(),
    session: localStorage.getItem('metabo_session'),
    history: localStorage.getItem('metabo_history'),
    poids: localStorage.getItem('metabo_poids'),
    seances: localStorage.getItem('metabo_seances'),
    repas: localStorage.getItem('metabo_repas'),
    theme: localStorage.getItem('metabo_theme'),
    accent: localStorage.getItem('metabo_accent'),
    poidsObj: localStorage.getItem('metabo_poids_obj'),
    notifs: localStorage.getItem('metabo_notifs'),
  };
}

function exportJSON() {
  const json = JSON.stringify(getAllData(), null, 2);
  navigator.clipboard.writeText(json).then(() => showToast('✅ JSON copie - colle sur l’autre appareil'));
}

function downloadJSON() {
  const json = JSON.stringify(getAllData(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `metabo_sync_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  showToast('✅ Fichier téléchargé');
}

function importJSON() {
  const text = document.getElementById('sync-import-text')?.value?.trim();
  if (!text) { showToast('⚠️ Colle le JSON d’abord'); return; }
  applyImport(text);
}

function importJSONFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => applyImport(e.target.result);
  reader.readAsText(file);
}

function applyImport(text) {
  try {
    const data = JSON.parse(text);
    if (!data.version) throw new Error('Format invalide');
    if (!confirm(`Importer les données du ${data.exported?.slice(0,10) || '?'} ? Cela remplacera tes données actuelles.`)) return;
    if (data.session) localStorage.setItem('metabo_session', data.session);
    if (data.history) localStorage.setItem('metabo_history', data.history);
    if (data.poids) localStorage.setItem('metabo_poids', data.poids);
    if (data.seances) localStorage.setItem('metabo_seances', data.seances);
    if (data.repas) localStorage.setItem('metabo_repas', data.repas);
    if (data.poidsObj) localStorage.setItem('metabo_poids_obj', data.poidsObj);
    showToast('✅ Import réussi — rechargement...');
    setTimeout(() => location.reload(), 1500);
  } catch(e) {
    showToast('❌ Format invalide — assure-toi de coller le bon JSON');
  }
}

function generateQR() {
  const canvas = document.getElementById('qr-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = '#000';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Utilise le bouton', 100, 70);
  ctx.fillText('[Copier JSON] puis', 100, 90);
  ctx.fillText('[Importer] sur', 100, 110);
  ctx.fillText("l'autre appareil", 100, 130);
  ctx.font = '28px sans-serif';
  ctx.fillText('⇄', 100, 170);
}

// ═══════════════════════════════════════════════════════════
// THÈMES
// ═══════════════════════════════════════════════════════════
function openThemes() { document.getElementById('themes-overlay').classList.add('open'); }
function closeThemes() { document.getElementById('themes-overlay').classList.remove('open'); }

function applyTheme(theme, el) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
  el.classList.add('active');
  localStorage.setItem('metabo_accent', theme);
  // Update theme-color meta
  const colors = {'':"#0A84FF",rouge:"#FF453A",vert:"#30D158",violet:"#BF5AF2",or:"#FFD60A",rose:"#FF375F"};
  const meta = document.getElementById('theme-color-meta');
  if (meta) meta.content = colors[theme] || '#0A84FF';
  closeThemes();
}

function initAccent() {
  const saved = localStorage.getItem('metabo_accent');
  if (saved !== null) {
    const dot = document.querySelector(`.theme-dot[data-theme="${saved}"]`);
    if (dot) applyTheme(saved, dot);
  }
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
const NOTIF_KEY = 'metabo_notifs';
let notifState = { poids: false, repas: false, eau: false };
let notifIntervals = {};

function openNotifSettings() {
  document.getElementById('notif-overlay').classList.add('open');
  const perm = Notification.permission;
  document.getElementById('notif-perm-block').style.display = perm === 'granted' ? 'none' : 'block';
  // Load saved state
  try { notifState = JSON.parse(localStorage.getItem(NOTIF_KEY)||'{}'); } catch {}
  ['poids','repas','eau'].forEach(k => {
    const sw = document.getElementById(`notif-${k}-sw`);
    if (sw) sw.classList.toggle('on', !!notifState[k]);
  });
}
function closeNotifSettings() { document.getElementById('notif-overlay').classList.remove('open'); }

async function requestNotifPermission() {
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    document.getElementById('notif-perm-block').style.display = 'none';
    showToast('✅ Notifications autorisées');
  } else {
    showToast('⚠️ Notifications refusées — active-les dans les paramètres du navigateur');
  }
}

function toggleNotif(type) {
  if (Notification.permission !== 'granted') {
    requestNotifPermission();
    return;
  }
  notifState[type] = !notifState[type];
  const sw = document.getElementById(`notif-${type}-sw`);
  if (sw) sw.classList.toggle('on', notifState[type]);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifState));
  if (notifState[type]) scheduleNotif(type);
  else clearNotif(type);
}

function scheduleNotif(type) {
  const timeEl = document.getElementById(`notif-${type}-time`);
  if (!timeEl) return;
  const [h, m] = timeEl.value.split(':').map(Number);
  const MSGS = {
    poids: ["MÉTABO — Pesée ⚖️", "Pense à te peser ce matin !"],
    repas: ["MÉTABO — Journal 🍽️", "Saisis tes repas de la journée."],
    eau:   ["MÉTABO — Eau 💧",     "Mets à jour ton hydratation."],
  };
  clearNotif(type);
  const checkAndNotify = () => {
    const now = new Date();
    if (now.getHours() === h && now.getMinutes() === m) {
      if (Notification.permission === 'granted') {
        new Notification(MSGS[type][0], {
          body: MSGS[type][1],
          icon: './icons/icon-192.png',
          badge: './icons/icon-72.png',
          tag: `metabo-${type}`,
          renotify: false
        });
      }
    }
  };
  notifIntervals[type] = setInterval(checkAndNotify, 60000);
  checkAndNotify();
  showToast(`Rappel ${type} activé à ${timeEl.value}`);
}

function clearNotif(type) {
  if (notifIntervals[type]) { clearInterval(notifIntervals[type]); delete notifIntervals[type]; }
}

function initNotifs() {
  try { notifState = JSON.parse(localStorage.getItem(NOTIF_KEY)||'{}'); } catch {}
  if (Notification.permission === 'granted') {
    Object.keys(notifState).forEach(k => { if (notifState[k]) scheduleNotif(k); });
  }
}


function resetSession(){
  if(!confirm('Réinitialiser la session ? (l\'historique du journal est conservé)'))return;
  localStorage.removeItem(SAVE_KEY);location.reload();
}

// ═══════════════════════════════════════════════════════════
// CLOUD SYNC (FIREBASE)
// ═══════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyDw7x2LYfD8_c2tuc8CVyH8IUvgRDIins4",
  authDomain: "metabo-d4edf.firebaseapp.com",
  projectId: "metabo-d4edf",
  storageBucket: "metabo-d4edf.firebasestorage.app",
  messagingSenderId: "773734627864",
  appId: "1:773734627864:web:072d26ffbec54c15b4e16d"
};
if (typeof firebase !== 'undefined') firebase.initializeApp(firebaseConfig);
const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// Intercepter TOUTES les sauvegardes locales pour déclencher la synchro Cloud
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  if (key.startsWith('metabo_') && typeof triggerSyncToCloud === 'function') {
    triggerSyncToCloud();
  }
};

let cloudUser = null;

if (auth) {
  auth.onAuthStateChanged(user => {
    cloudUser = user;
    if (user) {
      document.getElementById('cloud-status').innerHTML = '<span style="color:var(--green)">●</span> Cloud actif';
      document.getElementById('cloud-login-form').style.display = 'none';
      document.getElementById('cloud-logged-in').style.display = 'block';
      document.getElementById('cloud-user-email').textContent = user.email;
      loadFromCloud();
    } else {
      document.getElementById('cloud-status').innerHTML = '<span style="color:var(--text3)">○</span> Sauvegarde locale';
      document.getElementById('cloud-login-form').style.display = 'block';
      document.getElementById('cloud-logged-in').style.display = 'none';
    }
  });
}

function openCloud() { document.getElementById('cloud-overlay').classList.add('open'); }
function closeCloud() { document.getElementById('cloud-overlay').classList.remove('open'); }

function handleAuth() {
  const email = document.getElementById('cloud-email').value;
  const pwd = document.getElementById('cloud-pwd').value;
  if (!email || !pwd) return;
  auth.signInWithEmailAndPassword(email, pwd)
    .then(() => { showToast('☁️ Connexion réussie'); closeCloud(); })
    .catch(err => {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        auth.createUserWithEmailAndPassword(email, pwd)
          .then(() => { showToast('☁️ Compte Cloud créé'); closeCloud(); })
          .catch(e => showToast('Erreur: ' + e.message));
      } else {
        showToast('Erreur: ' + err.message);
      }
    });
}

function loadFromCloud() {
  if (!cloudUser || !db) return;
  db.collection('users').doc(cloudUser.uid).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      let hasChange = false;
      
      const applyData = (key, val) => {
        if(val && localStorage.getItem(key) !== val) {
          localStorage.setItem(key, val);
          hasChange = true;
        }
      };

      applyData('metabo_session', data.session);
      applyData('metabo_history', data.history);
      applyData('metabo_poids', data.poids);
      applyData('metabo_seances', data.seances);
      applyData('metabo_repas', data.repas);
      applyData('metabo_poids_obj', data.poidsObj);

      if (hasChange) {
        showToast('☁️ Synchronisation Cloud effectuée');
        setTimeout(() => location.reload(), 1500);
      }
    }
  });
}

let syncTimer = null;
function triggerSyncToCloud() {
  if (!cloudUser) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    if (!cloudUser || !db) return;
    const data = {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      session: localStorage.getItem('metabo_session') || '',
      history: localStorage.getItem('metabo_history') || '',
      poids: localStorage.getItem('metabo_poids') || '',
      seances: localStorage.getItem('metabo_seances') || '',
      repas: localStorage.getItem('metabo_repas') || '',
      poidsObj: localStorage.getItem('metabo_poids_obj') || ''
    };
    db.collection('users').doc(cloudUser.uid).set(data, {merge: true}).catch(()=>{});
  }, 3000);
}
