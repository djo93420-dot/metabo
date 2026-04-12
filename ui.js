// ui.js — METABO : Interface, DOM, Rendu, UX, Navigation

// ═══════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════
function switchTab(id) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes(`'${id}'`)));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${id}`).classList.add('active');
}

// ═══════════════════════════════════════════════════════════
// UX : HAPTIQUE & TOAST
// ═══════════════════════════════════════════════════════════
function triggerVibrate(type = 'light') {
  if (!navigator.vibrate) return;
  const p = { light: 15, medium: 30, heavy: 50, success: [15, 100, 30], error: [50, 100, 50] };
  navigator.vibrate(p[type] || 15);
}

function showToast(msg) {
  triggerVibrate('success');
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}

// ═══════════════════════════════════════════════════════════
// UX : SWIPE TO DELETE
// ═══════════════════════════════════════════════════════════
function initSwipeToDelete(element, onDeleteCallback) {
  element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  let startX = 0, currentX = 0, isSwiping = false, isInteractive = false;
  element.addEventListener('touchstart', e => {
    if (['INPUT', 'SELECT', 'BUTTON', 'OPTION'].includes(e.target.tagName)) {
      isInteractive = true;
      return;
    }
    isInteractive = false;
    startX = e.touches[0].clientX;
    isSwiping = true;
    element.style.transition = 'none'; // Suit le doigt
  }, {passive: true});
  element.addEventListener('touchmove', e => {
    if(!isSwiping || isInteractive) return;
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff < -10) {
      element.style.transform = `translateX(${Math.max(diff, -100)}px)`;
      if (e.cancelable) e.preventDefault(); // bloque le scroll vertical accidentel
    }
  }, {passive: false});
  element.addEventListener('touchend', e => {
    if (isInteractive) return;
    isSwiping = false;
    element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    const diff = currentX ? currentX - startX : 0;
    if (diff < -60) {
      triggerVibrate('medium');
      element.style.transform = `translateX(-100%)`;
      element.style.opacity = '0';
      setTimeout(onDeleteCallback, 300);
    } else {
      element.style.transform = `translateX(0)`;
    }
    startX = 0; currentX = 0;
  });
}

// ═══════════════════════════════════════════════════════════
// PROFIL
// ═══════════════════════════════════════════════════════════
function setEq(e,el) {
  eq=e;
  document.querySelectorAll('.eq-pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('eq-desc').textContent = EQ_DESC[e];
  saveState(); updateLiveBar();
}
function setSex(s) {
  sex=s;
  document.getElementById('btn-h').classList.toggle('active', s==='H');
  document.getElementById('btn-f').classList.toggle('active', s==='F');
  document.getElementById('cycle-card').style.display = s==='F' ? 'block' : 'none';
  document.getElementById('sommeil-card-h').style.display = s==='H' ? 'block' : 'none';
  saveState(); updateLiveBar();
}
function setLevel(lv,el) {
  trainingLevel=lv;
  document.querySelectorAll('.lv-pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  const h={debutant:"Économie standard",intermediaire:"Efficacité +",avance:"−5% dépense",elite:"−12% dépense"};
  document.getElementById('level-hint').textContent = h[lv];
  saveState(); updateLiveBar();
}
function updateLBM() {
  const p=+document.getElementById('poids').value||80;
  const g=+document.getElementById('pctGraisse').value||20;
  const f=+document.getElementById('methGraisse').value||1;
  const lbm=p*(1-g*f/100);
  document.getElementById('lbm-hint').textContent=`Masse maigre : ${lbm.toFixed(1)} kg`;
  const mh={'1.00':'Référence','0.96':'−4% (impéd. pro)','0.98':'−2% (3 plis)','0.99':'−1% (7 plis)','1.02':'+2% (visuelle)'};
  document.getElementById('meth-hint').textContent=mh[f.toString()]||'Correction appliquée';
  updateLiveBar();
}
function updateCycleNote() {
  const v=+document.getElementById('cyclePhase').value;
  const el=document.getElementById('cycle-note');
  if(v>0){el.style.display='block';el.textContent=v===150?`Phase lutéale : +${v} kcal/j — progestérone`:`Periovulatoire : +${v} kcal/j`;}
  else el.style.display='none';
}
function setObjectif(o) {
  objectif=o;
  ['m','p','d'].forEach(x=>{const map={m:'maintien',p:'prise',d:'deficit'};document.getElementById(`obj-${x}`).classList.toggle('active',map[x]===o);});
  saveState(); updateLiveBar();
}

// ═══════════════════════════════════════════════════════════
// TAPIS — mode standard + fractionné multi-vitesses
// ═══════════════════════════════════════════════════════════
function tapisRowHTML(id, data={}) {
  const isFrac = data.mode === 'fraction';
  return `
    <div class="tapis-row-top">
      <div class="field">
        <label>Mode</label>
        <div class="seg">
          <button class="seg-btn${!isFrac?' active':''}" onclick="setTapisMode(${id},'standard')">Standard</button>
          <button class="seg-btn${isFrac?' active':''}" onclick="setTapisMode(${id},'fraction')">Fractionné</button>
        </div>
      </div>
      <div class="field"><label>Vitesse principale (km/h)</label><input type="number" id="t-vit-${id}" value="${data.vit||5.5}" min="0.5" max="22" step="0.1" oninput="updateTapisType(${id});updateTapisKcal(${id})"></div>
      <div class="field"><label>Inclinaison (%)</label><input type="number" id="t-inc-${id}" value="${data.inc||0}" min="0" max="30" step="0.5" oninput="updateTapisKcal(${id})"></div>
      <div id="t-std-${id}" style="${!isFrac?'':'display:none'}">
        <div class="field"><label>Durée (min)</label><input type="number" id="t-dur-${id}" value="${data.dur||30}" min="1" max="300" step="5" oninput="updateTapisKcal(${id})"></div>
      </div>
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <div class="field" style="flex:1;"><label>Type</label><div id="t-type-${id}" style="font-size:13px;font-weight:600;color:var(--blue);padding:11px 0;">—</div></div>
        <button class="btn-del" onclick="removeTapisRow(${id})">✕</button>
      </div>
    </div>
    <div class="kcal-badge tapis" id="t-kcal-badge-${id}">
      <span class="kb-val" id="t-kcal-${id}">—</span>
      <span class="kb-lbl" id="t-kcal-lbl-${id}">kcal estimé</span>
    </div>
    <div id="t-frac-${id}" style="margin-top:2px;${isFrac?'':'display:none'}">
      <div style="background:rgba(10,132,255,0.10);border:1.5px solid rgba(10,132,255,0.35);border-radius:14px;padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
          <span style="font-size:13px;font-weight:700;color:var(--blue);letter-spacing:-0.2px;">🔄 Cycles fractionnés</span>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:8px;background:rgba(10,132,255,0.12);border:1px solid rgba(10,132,255,0.3);border-radius:10px;padding:6px 12px;">
              <label style="font-size:12px;font-weight:500;color:var(--blue);white-space:nowrap;margin:0;">× tours</label>
              <input type="number" id="t-reps-${id}" value="${data.reps||8}" min="1" max="100" step="1" style="width:60px;background:transparent;border:none;color:var(--text);font-size:15px;font-weight:700;padding:0;outline:none;" oninput="updateTapisKcal(${id})">
            </div>
            <button onclick="addFracCycle(${id})" style="background:var(--blue);border:none;color:#fff;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">＋ Vitesse</button>
          </div>
        </div>
        <div id="t-cycles-${id}" style="display:flex;flex-direction:column;gap:10px;"></div>
        <div style="font-size:11px;color:rgba(10,132,255,0.7);margin-top:10px;">↩ Chaque vitesse s'enchaîne sans repos • Tout le cycle est répété × le nombre de tours</div>
      </div>
    </div>
  `;
}

function setTapisMode(id, mode) {
  const isFrac = mode==='fraction';
  document.getElementById(`t-std-${id}`).style.display = isFrac?'none':'';
  document.getElementById(`t-frac-${id}`).style.display = isFrac?'':'none';
  const row = document.getElementById(`tapis-${id}`);
  if(row){const btns=row.querySelectorAll('.seg-btn');btns[0].classList.toggle('active',!isFrac);btns[1].classList.toggle('active',isFrac);}
  if(isFrac && !document.querySelector(`#t-cycles-${id} .frac-cycle`)) addFracCycle(id);
  saveState();
}

let fracCycleCount = 0;
function addFracCycle(tapisId, data={}) {
  const cid = ++fracCycleCount;
  const div = document.createElement('div');
  div.className = 'frac-cycle';
  div.id = `fc-${tapisId}-${cid}`;
  div.innerHTML = `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(10,132,255,0.2);border-radius:12px;padding:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:1px;">Vitesse ${cid}</span>
        <button onclick="document.getElementById('fc-${tapisId}-${cid}').remove();saveState();updateLiveBar();" style="background:rgba(255,69,58,0.1);border:none;color:var(--red);cursor:pointer;font-size:11px;border-radius:6px;padding:3px 8px;font-weight:600;">Supprimer</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;">
        <div class="field"><label>Vitesse (km/h)</label><input type="number" id="fv-${tapisId}-${cid}" value="${data.vit||8}" min="0.5" max="22" step="0.1" oninput="updateTapisKcal(${tapisId})"></div>
        <div class="field"><label>Inclinaison (%)</label><input type="number" id="fi-${tapisId}-${cid}" value="${data.inc||0}" min="0" max="30" step="0.5" oninput="updateTapisKcal(${tapisId})"></div>
        <div class="field">
          <label>Durée</label>
          <div style="display:flex;gap:4px;align-items:center;">
            <input type="number" id="fm-${tapisId}-${cid}" value="${data.min||1}" min="0" max="60" step="1" style="width:56px;" placeholder="min" oninput="updateTapisKcal(${tapisId})">
            <span style="color:var(--text3);font-size:11px;">m</span>
            <input type="number" id="fs-${tapisId}-${cid}" value="${data.sec!==undefined?data.sec:0}" min="0" max="59" step="5" style="width:56px;" placeholder="sec" oninput="updateTapisKcal(${tapisId})">
            <span style="color:var(--text3);font-size:11px;">s</span>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById(`t-cycles-${tapisId}`).appendChild(div);
  saveState();
}

function updateTapisKcal(id) {
  const poids=+document.getElementById('poids').value||80;
  const economy=ECONOMY[trainingLevel]||1;
  const frac=document.getElementById(`t-frac-${id}`);
  const isFrac=frac&&frac.style.display!=='none';
  let kcal=0, lbl='';
  if(isFrac){
    const reps=+document.getElementById(`t-reps-${id}`)?.value||1;
    const cycles=document.querySelectorAll(`#t-cycles-${id} .frac-cycle`);
    let cycleKcal=0;
    cycles.forEach(c=>{
      const cid=c.id.replace(`fc-${id}-`,'');
      const vit=+document.getElementById(`fv-${id}-${cid}`)?.value||6;
      const inc=+document.getElementById(`fi-${id}-${cid}`)?.value||0;
      const m=+document.getElementById(`fm-${id}-${cid}`)?.value||0;
      const s=+document.getElementById(`fs-${id}-${cid}`)?.value||0;
      const dur=(m*60+s)/60;
      const spd=vit*1000/60, grade=inc/100, isRun=vit>=8;
      const vo2=((isRun?spd*0.2:spd*0.1)+(isRun?spd*grade*0.9:spd*grade*1.8)+3.5)*economy;
      cycleKcal+=vo2*poids/1000*dur*5;
    });
    kcal=cycleKcal*reps;
    lbl=`kcal · ${cycles.length} vitesse(s) × ${reps} tours`;
  } else {
    const vit=+document.getElementById(`t-vit-${id}`)?.value||5;
    const inc=+document.getElementById(`t-inc-${id}`)?.value||0;
    const dur=+document.getElementById(`t-dur-${id}`)?.value||0;
    const spd=vit*1000/60, grade=inc/100, isRun=vit>=8;
    const vo2=((isRun?spd*0.2:spd*0.1)+(isRun?spd*grade*0.9:spd*grade*1.8)+3.5)*economy;
    kcal=vo2*poids/1000*dur*5;
    lbl=`kcal · ${vit}km/h ${inc}% ${dur}min`;
  }
  const valEl=document.getElementById(`t-kcal-${id}`);
  const lblEl=document.getElementById(`t-kcal-lbl-${id}`);
  if(valEl) valEl.textContent=Math.round(kcal);
  if(lblEl) lblEl.textContent=lbl;
}

function updateMuscuKcal(id) {
  const poids=+document.getElementById('poids').value||80;
  const ex=document.getElementById(`me-${id}`)?.value||'';
  const groupe=document.getElementById(`mg-${id}`)?.value||'Poitrine';
  const ser=+document.getElementById(`ms-${id}`)?.value||3;
  const rep=+document.getElementById(`mr-${id}`)?.value||10;
  const rm=document.getElementById(`mrm-${id}`)?.value||'70';
  const met=(EXERCISE_MET[ex]||EXERCISE_MET.default)*(RM_MET_MULT[rm]||1);
  const grpF=GROUP_MASS_FACTOR[groupe]||1.0;
  const activeHours=ser*rep*4/3600;
  const kcal=Math.round(met*poids*activeHours*grpF);
  const valEl=document.getElementById(`m-kcal-${id}`);
  const lblEl=document.getElementById(`m-kcal-lbl-${id}`);
  if(valEl) valEl.textContent=kcal;
  if(lblEl) lblEl.textContent=`kcal · ${ser}×${rep} · MET${met.toFixed(1)} · ×${grpF}`;
}

function addTapisRow(data) {
  const id=++tapisCount; tapisRows.push(id);
  const div=document.createElement('div'); div.className='row-block tapis-row'; div.id=`tapis-${id}`;
  div.innerHTML=tapisRowHTML(id,data||{});
  initSwipeToDelete(div, () => removeTapisRow(id));
  document.getElementById('tapis-list').appendChild(div);
  updateTapisType(id);
  setTimeout(()=>updateTapisKcal(id),30);
  saveState();
}
function updateTapisType(id) {
  const v=+document.getElementById(`t-vit-${id}`)?.value||0;
  const el=document.getElementById(`t-type-${id}`);
  if(!el)return;
  const types=[[1.5,'🐢 Repos'],[4,'🚶 Marche lente'],[6.5,'🚶 Marche'],[9,'🏃 Footing'],[12,'🏃 Course'],[22,'⚡ Sprint']];
  el.textContent=(types.find(([m])=>v<m)||types[types.length-1])[1];
}
function removeTapisRow(id) {
  tapisRows=tapisRows.filter(r=>r!==id);
  document.getElementById(`tapis-${id}`)?.remove();
  saveState(); updateLiveBar();
}

function getTapisActiveDuration(id) {
  const frac=document.getElementById(`t-frac-${id}`);
  const isFrac=frac&&frac.style.display!=='none';
  if(!isFrac) return {min:+document.getElementById(`t-dur-${id}`)?.value||0, isFrac:false};
  const reps=+document.getElementById(`t-reps-${id}`)?.value||1;
  const cycles=document.querySelectorAll(`#t-cycles-${id} .frac-cycle`);
  let totalSec=0;
  cycles.forEach(c=>{
    const cid=c.id.replace(`fc-${id}-`,'');
    const m=+document.getElementById(`fm-${id}-${cid}`)?.value||0;
    const s=+document.getElementById(`fs-${id}-${cid}`)?.value||0;
    totalSec+=(m*60+s);
  });
  return {min:totalSec*reps/60, isFrac:true, reps, cycles:cycles.length};
}

function computeTapis(poids) {
  const economy=ECONOMY[trainingLevel]||1;
  let total=0; const results=[];
  tapisRows.forEach(id=>{
    const {min:duree,isFrac,reps,cycles}=getTapisActiveDuration(id);
    if(isFrac){
      // compute per-cycle
      const allCycles=document.querySelectorAll(`#t-cycles-${id} .frac-cycle`);
      let cycleKcal=0;
      allCycles.forEach(c=>{
        const cid=c.id.replace(`fc-${id}-`,'');
        const vit=+document.getElementById(`fv-${id}-${cid}`)?.value||6;
        const inc=+document.getElementById(`fi-${id}-${cid}`)?.value||0;
        const m=+document.getElementById(`fm-${id}-${cid}`)?.value||0;
        const s=+document.getElementById(`fs-${id}-${cid}`)?.value||0;
        const dur=(m*60+s)/60;
        const spd=vit*1000/60, grade=inc/100, isRun=vit>=8;
        const hor=isRun?spd*0.2:spd*0.1, vert=isRun?spd*grade*0.9:spd*grade*1.8;
        const vo2=(hor+vert+3.5)*economy;
        cycleKcal+=vo2*poids/1000*dur*5;
      });
      const totalKcal=cycleKcal*(reps||1);
      total+=totalKcal;
      results.push({label:`Tapis fractionné ×${reps||1} cycles`, kcal:Math.round(totalKcal), isFrac:true});
    } else {
      const vit=+document.getElementById(`t-vit-${id}`)?.value||5;
      const inc=+document.getElementById(`t-inc-${id}`)?.value||0;
      const spd=vit*1000/60, grade=inc/100, isRun=vit>=8;
      const hor=isRun?spd*0.2:spd*0.1, vert=isRun?spd*grade*0.9:spd*grade*1.8;
      const vo2=(hor+vert+3.5)*economy;
      const kcal=vo2*poids/1000*duree*5;
      total+=kcal;
      results.push({label:`Tapis ${vit}km/h ${inc}% ${duree.toFixed(0)}min`, kcal:Math.round(kcal), isFrac:false});
    }
  });
  return {total:Math.round(total), results};
}

// ═══════════════════════════════════════════════════════════
// CARDIO MACHINES
// ═══════════════════════════════════════════════════════════
function cardioRowHTML(id, data={}) {
  const machineOpts = Object.keys(CARDIO_MACHINES).map(k=>`<option value="${k}"${k===(data.machine||'Corde à sauter — modéré (100–120/min)')?' selected':''}>${k}</option>`).join('');
  return `
    <div class="field" style="grid-column:1/-2;"><label>Machine / Exercice</label><select id="ca-mac-${id}" onchange="updateCardioKcal(${id})">${machineOpts}</select></div>
    <div class="field">
      <label>Durée par série</label>
      <div style="display:flex;gap:5px;align-items:center;">
        <input type="number" id="ca-min-${id}" value="${data.min||0}" min="0" max="120" step="1" oninput="updateCardioKcal(${id})" style="width:55px;" placeholder="min">
        <span style="color:var(--text3);font-size:11px;">m</span>
        <input type="number" id="ca-sec-${id}" value="${data.sec!==undefined?data.sec:30}" min="0" max="59" step="5" oninput="updateCardioKcal(${id})" style="width:55px;" placeholder="sec">
        <span style="color:var(--text3);font-size:11px;">s</span>
      </div>
    </div>
    <div class="field"><label>Séries</label><input type="number" id="ca-ser-${id}" value="${data.ser||1}" min="1" max="50" step="1" oninput="updateCardioKcal(${id})"></div>
    <div class="field"><label>Repos (s)</label><input type="number" id="ca-rep-${id}" value="${data.repos||60}" min="0" max="300" step="15"></div>
    <div class="field"><label>Kcal estimé</label>
      <div class="kcal-badge cardio" style="margin-top:4px;">
        <span class="kb-val" id="ca-prev-${id}">—</span>
        <span class="kb-lbl" id="ca-sub-${id}">kcal</span>
      </div>
    </div>
    <button class="btn-del" onclick="removeCardioRow(${id})" style="align-self:end;">✕</button>
  `;
}

function addCardioRow(data) {
  const id=++cardioCount; cardioRows.push(id);
  const div=document.createElement('div'); div.className='row-block cardio-row'; div.id=`cardio-${id}`;
  div.innerHTML=cardioRowHTML(id,data||{});
  initSwipeToDelete(div, () => removeCardioRow(id));
  document.getElementById('cardio-list').appendChild(div);
  updateCardioKcal(id); saveState();
}

function addCardioHIIT() {
  addCardioRow({machine:'HIIT — work (effort maximal)', min:0, sec:20, ser:8, repos:10});
  addCardioRow({machine:'HIIT — récupération active', min:0, sec:10, ser:8, repos:0});
}

function removeCardioRow(id) {
  cardioRows=cardioRows.filter(r=>r!==id);
  document.getElementById(`cardio-${id}`)?.remove();
  updateCardioTotalPreview(); saveState(); updateLiveBar();
}

function getCardioWorkSec(id) {
  return (+document.getElementById(`ca-min-${id}`)?.value||0)*60 + (+document.getElementById(`ca-sec-${id}`)?.value||0);
}

function updateCardioKcal(id) {
  const poids=+document.getElementById('poids').value||80;
  const mac=document.getElementById(`ca-mac-${id}`)?.value;
  const workSec=getCardioWorkSec(id);
  const ser=+document.getElementById(`ca-ser-${id}`)?.value||1;
  if(!mac)return;
  const {met}=CARDIO_MACHINES[mac]||{met:8};
  const workMin=workSec*ser/60;
  const kcal=met*poids/60*workMin;
  const totalSec=workSec*ser;
  const dMin=Math.floor(totalSec/60), dSec=totalSec%60;
  const el=document.getElementById(`ca-prev-${id}`);
  const sub=document.getElementById(`ca-sub-${id}`);
  if(el) el.textContent=Math.round(kcal);
  if(sub) sub.textContent=`kcal · MET${met} · ${dMin}m${dSec>0?dSec+'s':''}`;
  updateCardioTotalPreview();
}

function updateCardioTotalPreview() {
  const poids=+document.getElementById('poids').value||80;
  let total=0; const details=[];
  cardioRows.forEach(id=>{
    const mac=document.getElementById(`ca-mac-${id}`)?.value;
    const workSec=getCardioWorkSec(id);
    const ser=+document.getElementById(`ca-ser-${id}`)?.value||1;
    if(!mac)return;
    const {met}=CARDIO_MACHINES[mac]||{met:8};
    const kcal=met*poids/60*(workSec*ser/60);
    total+=kcal;
    const name=mac.split('—')[0].trim();
    details.push(`${name}: ${Math.round(kcal)} kcal`);
  });
  const el=document.getElementById('cardio-total');
  const detEl=document.getElementById('cardio-detail');
  if(el) el.textContent=Math.round(total)+' kcal';
  if(detEl) detEl.innerHTML=details.join('<br>')||'—';
  updateLiveBar();
}

function computeCardio(poids) {
  let total=0; const results=[];
  cardioRows.forEach(id=>{
    const mac=document.getElementById(`ca-mac-${id}`)?.value;
    const workSec=getCardioWorkSec(id);
    const ser=+document.getElementById(`ca-ser-${id}`)?.value||1;
    if(!mac)return;
    const {met}=CARDIO_MACHINES[mac]||{met:8};
    const kcal=met*poids/60*(workSec*ser/60);
    total+=kcal;
    const totalSec=workSec*ser;
    results.push({label:`${mac.split('—')[0].trim()} ×${ser}`, kcal:Math.round(kcal), met, totalSec});
  });
  return {total:Math.round(total), results};
}

// ═══════════════════════════════════════════════════════════
// MUSCULATION
// ═══════════════════════════════════════════════════════════
function toggleMuscu() {
  muscuEnabled=!muscuEnabled;
  document.getElementById('muscu-sw').classList.toggle('on',muscuEnabled);
  document.getElementById('muscu-sw-lbl').textContent=muscuEnabled?'Activé':'Désactivé';
  document.getElementById('muscu-body').style.display=muscuEnabled?'block':'none';
  if(muscuEnabled&&muscuRows.length===0) addSingleRow();
  saveState(); updateLiveBar();
}
function setIntensity(i) {
  muscuIntensity=i;
  ['legere','moderee','intense','maximale'].forEach(x=>{
    const map={legere:'leg',moderee:'mod',intense:'int',maximale:'max'};
    document.getElementById(`int-${map[x]}`).classList.toggle('active',x===i);
  });
  document.getElementById('epoc-badge').textContent=`⚡ EPOC estimé : +${EPOC_KCAL[i]} kcal post-séance`;
  saveState(); updateLiveBar();
}

function muscuRowInnerHTML(id, r={}) {
  const gOpts=Object.keys(MUSCLE_GROUPS).map(g=>`<option${g===(r.grp||'Poitrine')?' selected':''}>${g}</option>`).join('');
  const grp=r.grp||Object.keys(MUSCLE_GROUPS)[0];
  const eOpts=(MUSCLE_GROUPS[grp]||MUSCLE_GROUPS['Poitrine']).map(e=>`<option${e===(r.ex||'')?' selected':''}>${e}</option>`).join('');
  const rmOpts=['50','60','70','80','90','100'].map(v=>`<option value="${v}"${v===(r.rm||'70')?' selected':''}>${v}% — ${['très léger','léger','modéré','lourd','très lourd','max'][['50','60','70','80','90','100'].indexOf(v)]}</option>`).join('');
  return `
    <div class="field"><label>Groupe</label><select id="mg-${id}" onchange="updateEx(${id});updateMuscuKcal(${id})">${gOpts}</select></div>
    <div class="field"><label>Exercice</label><select id="me-${id}" onchange="updateMuscuKcal(${id})">${eOpts}</select></div>
    <div class="field"><label>Séries</label><input type="number" id="ms-${id}" value="${r.ser||3}" min="1" max="20" oninput="updateMuscuKcal(${id})"></div>
    <div class="field"><label>Rép.</label><input type="number" id="mr-${id}" value="${r.rep||10}" min="1" max="100" oninput="updateMuscuKcal(${id})"></div>
    <div class="field"><label>% 1RM</label><select id="mrm-${id}" onchange="updateMuscuKcal(${id})">${rmOpts}</select></div>
    <div class="field"><label>Repos (s)</label><input type="number" id="mrt-${id}" value="${r.repos||90}" min="15" max="300" step="15"></div>
    <button class="btn-del" style="align-self:end;" onclick="removeMuscu(${id})">✕</button>
  `;
  // Note: le badge kcal est ajouté en dehors de la grille (dans wrap) via addMuscuRow
}

function addMuscuRow(r) {
  const id=++muscuCount; muscuRows.push(id);
  const wrap=document.createElement('div'); wrap.className='single-row-wrap row-block'; wrap.id=`wrap-${id}`;
  const inner=document.createElement('div'); inner.className='muscu-row-inner'; inner.id=`muscu-${id}`;
  inner.innerHTML=muscuRowInnerHTML(id,r||{});
  inner.querySelector('.btn-del').onclick=()=>{ muscuRows=muscuRows.filter(x=>x!==id); wrap.remove(); saveState(); updateLiveBar(); };
  // Badge kcal sous la row
  const badge=document.createElement('div'); badge.className='kcal-badge muscu'; badge.id=`m-kcal-badge-${id}`;
  badge.innerHTML=`<span class="kb-val" id="m-kcal-${id}">—</span><span class="kb-lbl" id="m-kcal-lbl-${id}">kcal estimé</span>`;
  wrap.appendChild(inner); wrap.appendChild(badge);
  initSwipeToDelete(wrap, () => { muscuRows=muscuRows.filter(x=>x!==id); wrap.remove(); saveState(); updateLiveBar(); });
  document.getElementById('muscu-list').appendChild(wrap);
  setTimeout(()=>updateMuscuKcal(id),50); // delay pour que le DOM soit prêt
  saveState();
}
function addSingleRow() { addMuscuRow({}); }
function updateEx(id) {
  const g=document.getElementById(`mg-${id}`).value;
  document.getElementById(`me-${id}`).innerHTML=(MUSCLE_GROUPS[g]||[]).map(e=>`<option>${e}</option>`).join('');
}
function removeMuscu(id) {
  muscuRows=muscuRows.filter(r=>r!==id);
  document.getElementById(`wrap-${id}`)?.remove();
  saveState(); updateLiveBar();
}

function addSupersetBlock(data) {
  const sid=++supersetCount; supersetBlocks.push(sid);
  const id1=++muscuCount; muscuRows.push(id1);
  const id2=++muscuCount; muscuRows.push(id2);
  const block=document.createElement('div'); block.className='ss-block'; block.id=`ss-${sid}`;
  const tag=document.createElement('div'); tag.className='ss-tag'; tag.textContent='SUPERSET';
  const r1=document.createElement('div'); r1.className='muscu-row-inner'; r1.id=`muscu-${id1}`;
  r1.innerHTML=muscuRowInnerHTML(id1,data?.ex1||{});
  r1.querySelector('.btn-del').style.display='none';
  // SUPERSET : pas de repos par exercice — repos uniquement entre les tours (dans le footer)
  r1.querySelector(`#mrt-${id1}`).closest('.field').style.display='none';
  const sep=document.createElement('div'); sep.className='ss-sep'; sep.textContent='⚡ Enchaîné — repos uniquement entre les tours';
  const r2=document.createElement('div'); r2.className='muscu-row-inner'; r2.id=`muscu-${id2}`;
  r2.innerHTML=muscuRowInnerHTML(id2,data?.ex2||{});
  r2.querySelector('.btn-del').style.display='none';
  r2.querySelector(`#mrt-${id2}`).closest('.field').style.display='none';
  const footer=document.createElement('div'); footer.className='ss-footer';
  footer.innerHTML=`
    <div class="field" style="flex:0 0 auto;"><label>Repos entre tours (s)</label><input type="number" id="ss-repos-${sid}" value="${data?.repos||90}" min="15" max="300" step="15" style="width:100px;"></div>
    <div style="font-size:11px;color:var(--teal);">EPOC ×1.15 vs exercices séparés</div>
    <button class="ss-del" onclick="removeSupersetBlock(${sid},${id1},${id2})">✕ Supprimer</button>
  `;
  block.appendChild(tag); block.appendChild(r1); block.appendChild(sep); block.appendChild(r2); block.appendChild(footer);
  document.getElementById('muscu-list').appendChild(block); saveState();
}
function removeSupersetBlock(sid,id1,id2) {
  supersetBlocks=supersetBlocks.filter(s=>s!==sid);
  muscuRows=muscuRows.filter(r=>r!==id1&&r!==id2);
  document.getElementById(`ss-${sid}`)?.remove();
  saveState(); updateLiveBar();
}

function computeMuscu(poids) {
  let totalKcal=0, totalTonnage=0, weightedGF=0;
  const results=[];
  muscuRows.forEach(id=>{
    const ex=document.getElementById(`me-${id}`)?.value||'';
    const groupe=document.getElementById(`mg-${id}`)?.value||'Poitrine';
    const ser=+document.getElementById(`ms-${id}`)?.value||3;
    const rep=+document.getElementById(`mr-${id}`)?.value||10;
    const rm=document.getElementById(`mrm-${id}`)?.value||'70';
    // Repos : pour un superset on prend le repos du footer du bloc
    const block=document.getElementById(`muscu-${id}`)?.closest('.ss-block');
    let repos;
    if(block){
      const sid=block.id.replace('ss-','');
      repos=+document.getElementById(`ss-repos-${sid}`)?.value||90;
    } else {
      repos=+document.getElementById(`mrt-${id}`)?.value||90;
    }
    const met=(EXERCISE_MET[ex]||EXERCISE_MET.default)*(RM_MET_MULT[rm]||1);
    const grpF=GROUP_MASS_FACTOR[groupe]||1.0;
    // Seul le temps de travail actif compte dans la dépense sportive
    // rep × 4s par répétition (concentrique + excentrique) × séries
    const activeHours=ser*rep*4/3600;
    // Le repos (entre séries) n'est PAS compté — il est passif et quasi nul (MET~1.3)
    // Il est inclus dans le calcul du BMR (déjà dans le TDEE global)
    const kcal=met*poids*activeHours*grpF;
    totalKcal+=kcal;
    const rmPct=(+rm||70)/100;
    const tonnage=ser*rep*poids*rmPct*(grpF>1.1?1.2:0.6);
    totalTonnage+=tonnage; weightedGF+=grpF*ser;
    results.push({ex,groupe,ser,rep,rm,repos,kcal:Math.round(kcal),grpF,tonnage:Math.round(tonnage)});
  });
  const totalSer=muscuRows.reduce((a,id)=>(a+(+document.getElementById(`ms-${id}`)?.value||3)),0)||1;
  const avgGF=weightedGF/totalSer;
  const baseEpoc=EPOC_KCAL[muscuIntensity]||0;
  const volBonus=Math.round(totalTonnage/1000*15);
  const groupMult=0.6+avgGF*0.4;
  const ssMult=1+supersetBlocks.length*0.15;
  const epoc=Math.round((baseEpoc+volBonus)*groupMult*ssMult);
  // Update badge
  const badge=document.getElementById('epoc-badge');
  if(badge) badge.textContent=`⚡ EPOC : +${epoc} kcal · Tonnage ${Math.round(totalTonnage)} kg·reps · Facteur groupe ×${avgGF.toFixed(2)}`;
  totalKcal+=epoc;
  return {total:Math.round(totalKcal),epoc,tonnage:Math.round(totalTonnage),avgGF:avgGF.toFixed(2),results};
}

// ═══════════════════════════════════════════════════════════
// SÉANCES TYPE
// ═══════════════════════════════════════════════════════════
function loadSeances(){try{return JSON.parse(localStorage.getItem(SEANCES_KEY)||'[]');}catch{return[];}}
function saveSeances(s){localStorage.setItem(SEANCES_KEY,JSON.stringify(s));}
function renderSeancePills() {
  const seances=loadSeances();
  const c=document.getElementById('seance-pills');
  if(!c)return;
  c.innerHTML=seances.map(s=>`<span class="seance-pill" onclick="loadSeance(${s.id})">${s.name}<span class="sp-del" onclick="event.stopPropagation();deleteSeance(${s.id})">✕</span></span>`).join('');
}
function toggleSaveSeance() {
  const inp=document.getElementById('seance-name-input');
  const btn=document.getElementById('seance-save-btn');
  if(inp.style.display==='none'){inp.style.display='block';inp.focus();btn.textContent='✓ Confirmer';inp.onkeydown=e=>{if(e.key==='Enter')confirmSave();};}
  else confirmSave();
}
function confirmSave() {
  const inp=document.getElementById('seance-name-input');
  const btn=document.getElementById('seance-save-btn');
  const name=inp.value.trim();if(!name){inp.focus();return;}
  const snap=snapshotMuscu();
  const s=loadSeances(); s.push({id:Date.now(),name,snap}); saveSeances(s);
  inp.value='';inp.style.display='none';btn.textContent='＋ Sauvegarder cette séance';
  renderSeancePills(); showToast(`✅ Séance "${name}" sauvegardée`);
}
function deleteSeance(id){saveSeances(loadSeances().filter(s=>s.id!==id));renderSeancePills();}
function snapshotMuscu() {
  const singles=[]; const ss=[];
  document.querySelectorAll('.single-row-wrap').forEach(wrap=>{
    const row=wrap.querySelector('.muscu-row-inner');if(!row)return;
    const id=+row.id.replace('muscu-','');if(!muscuRows.includes(id))return;
    singles.push({grp:document.getElementById(`mg-${id}`)?.value,ex:document.getElementById(`me-${id}`)?.value,ser:document.getElementById(`ms-${id}`)?.value,rep:document.getElementById(`mr-${id}`)?.value,repos:document.getElementById(`mrt-${id}`)?.value,rm:document.getElementById(`mrm-${id}`)?.value});
  });
  supersetBlocks.forEach(sid=>{
    const block=document.getElementById(`ss-${sid}`);if(!block)return;
    const rids=muscuRows.filter(id=>block.contains(document.getElementById(`muscu-${id}`)));
    const g=(rid)=>({grp:document.getElementById(`mg-${rid}`)?.value,ex:document.getElementById(`me-${rid}`)?.value,ser:document.getElementById(`ms-${rid}`)?.value,rep:document.getElementById(`mr-${rid}`)?.value,rm:document.getElementById(`mrm-${rid}`)?.value});
    ss.push({repos:document.getElementById(`ss-repos-${sid}`)?.value,ex1:rids[0]?g(rids[0]):{},ex2:rids[1]?g(rids[1]):{}});
  });
  return{singles,ss,intensity:muscuIntensity};
}
function loadSeance(id) {
  const s=loadSeances().find(s=>s.id===id);if(!s)return;
  document.querySelectorAll('#muscu-list .single-row-wrap, #muscu-list .ss-block').forEach(el=>el.remove());
  muscuRows=[];supersetBlocks=[];supersetCount=0;
  (s.snap?.singles||[]).forEach(r=>addMuscuRow(r));
  (s.snap?.ss||[]).forEach(ss=>addSupersetBlock(ss));
  if(s.snap?.intensity) setIntensity(s.snap.intensity);
  document.querySelectorAll('.seance-pill').forEach(p=>p.classList.toggle('active',p.getAttribute('onclick')===`loadSeance(${id})`));
  saveState(); showToast(`📋 Séance "${s.name}" chargée`);
}

// ═══════════════════════════════════════════════════════════
// ALIMENTATION — aliments réels
// ═══════════════════════════════════════════════════════════
function foodRowHTML(id) {
  return `
    <input type="text" id="fn-${id}" placeholder="Nom…" style="font-size:13px;">
    <input type="number" id="fk-${id}" placeholder="kcal" min="0" step="1" oninput="updateFoodTotals()">
    <input type="number" id="fp-${id}" placeholder="g" min="0" step="0.5" oninput="updateFoodTotals()">
    <input type="number" id="fc-${id}" placeholder="g" min="0" step="0.5" oninput="updateFoodTotals()">
    <input type="number" id="fl-${id}" placeholder="g" min="0" step="0.5" oninput="updateFoodTotals()">
    <button class="btn-del" onclick="removeFoodRow(${id})" style="width:32px;height:32px;font-size:13px;">✕</button>
  `;
}
function addFoodRow(data) {
  const id=++foodCount; foodRows.push(id);
  const div=document.createElement('div'); div.className='food-log-row'; div.id=`food-${id}`;
  div.innerHTML=foodRowHTML(id);
  initSwipeToDelete(div, () => removeFoodRow(id));
  document.getElementById('food-log-list').appendChild(div);
  if(data){setVal(`fn-${id}`,data.n);setVal(`fk-${id}`,data.k);setVal(`fp-${id}`,data.p);setVal(`fc-${id}`,data.c);setVal(`fl-${id}`,data.l);}
  updateFoodTotals(); updateFibresCalc(); saveState();
}
function removeFoodRow(id) {
  foodRows=foodRows.filter(r=>r!==id);
  document.getElementById(`food-${id}`)?.remove();
  updateFoodTotals(); saveState();
}
function updateFoodTotals() {
  let tk=0,tp=0,tc=0,tl=0;
  foodRows.forEach(id=>{
    tk+=+document.getElementById(`fk-${id}`)?.value||0;
    tp+=+document.getElementById(`fp-${id}`)?.value||0;
    tc+=+document.getElementById(`fc-${id}`)?.value||0;
    tl+=+document.getElementById(`fl-${id}`)?.value||0;
  });
  setElText('real-kcal',Math.round(tk));
  setElText('real-p',Math.round(tp));
  setElText('real-c',Math.round(tc));
  setElText('real-l',Math.round(tl));
  const tefReal=Math.round(tp*4*0.25+tc*4*0.08+tl*9*0.02);
  setElText('tef-real',tefReal+' kcal');
  updateLiveBar();
}
function getRealIntake(){
  let tk=0,tp=0,tc=0,tl=0;
  foodRows.forEach(id=>{tk+=+document.getElementById(`fk-${id}`)?.value||0;tp+=+document.getElementById(`fp-${id}`)?.value||0;tc+=+document.getElementById(`fc-${id}`)?.value||0;tl+=+document.getElementById(`fl-${id}`)?.value||0;});
  return{kcal:Math.round(tk),p:Math.round(tp),c:Math.round(tc),l:Math.round(tl)};
}

// ═══════════════════════════════════════════════════════════
// TEF
// ═══════════════════════════════════════════════════════════
function updateTEF() {
  const p=+document.getElementById('macro-p').value||0;
  const c=+document.getElementById('macro-c').value||0;
  const l=+document.getElementById('macro-l').value||0;
  const tp=Math.round(p*4*0.25),tc=Math.round(c*4*0.08),tl=Math.round(l*9*0.02);
  setElText('tef-p',tp+' kcal'); setElText('tef-c',tc+' kcal'); setElText('tef-l',tl+' kcal');
  setElText('tef-total',(tp+tc+tl)+' kcal');
  setElText('cal-cible',Math.round(p*4+c*4+l*9)+' kcal');
  updateLiveBar();
}
function computeTEF() {
  // Use REAL intake for TEF if entered, otherwise targets
  const real=getRealIntake();
  if(real.kcal>0) return Math.round(real.p*4*0.25+real.c*4*0.08+real.l*9*0.02);
  const p=+document.getElementById('macro-p').value||0;
  const c=+document.getElementById('macro-c').value||0;
  const l=+document.getElementById('macro-l').value||0;
  return Math.round(p*4*0.25+c*4*0.08+l*9*0.02);
}

// ═══════════════════════════════════════════════════════════
// NEAT FIDGETING
// ═══════════════════════════════════════════════════════════
const FIDGET_KCAL = {none:0, low:100, medium:200, high:350, max:500};

function setFidget(level, el) {
  fidgetLevel = level;
  fidgetKcal = FIDGET_KCAL[level] || 0;
  document.querySelectorAll('.fidget-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  saveState();
  updateLIPAHint();
  updateLiveBar();
}

// ═══════════════════════════════════════════════════════════
// ACTIVITÉ SEXUELLE
// ═══════════════════════════════════════════════════════════
// MET × poids × heures — Ainsworth 2011
// none: 0, light: MET 1.8 × 15min, moderate: MET 3.0 × 20min, intense: MET 5.8 × 25min
const SEX_DATA = {
  none:     {met:0,    min:0,  label:'—'},
  light:    {met:1.8,  min:15, label:'Légère · MET 1.8 · 15 min'},
  moderate: {met:3.0,  min:20, label:'Modérée · MET 3.0 · 20 min'},
  intense:  {met:5.8,  min:25, label:'Intense · MET 5.8 · 25 min'},
};

function setSexActivite(level, el) {
  document.querySelectorAll('.sex-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const poids = +document.getElementById('poids').value || 80;
  const d = SEX_DATA[level] || SEX_DATA.none;
  sexActiviteKcal = Math.round(d.met * poids * d.min / 60);
  document.getElementById('sex-kcal-display').textContent = sexActiviteKcal + ' kcal';
  saveState();
  updateLiveBar();
}

// ═══════════════════════════════════════════════════════════
// FIBRES & ABSORPTION
// ═══════════════════════════════════════════════════════════
function updateFibresCalc() {
  const fibres = +document.getElementById('fibres-g').value || 0;
  const digSpeed = +document.getElementById('digestion-speed').value || 1.0;

  // Réduction absorption selon fibres :
  // 0–15g : ~0–2%, 15–25g : ~2–3%, 25–40g : ~3–4.5%, >40g : ~4.5–5%
  // Formule continue : pct = min(fibres/10 * 1.2, 5) %
  const fibresPct = Math.min(fibres / 10 * 1.2, 5.0);

  // Digestion speed correction : lente = −1% supplémentaire, rapide = +1%
  const speedAdj = (digSpeed - 1.0) * 10; // -0.3% à +0.3%
  const totalPct = Math.max(0, fibresPct - speedAdj);

  // On applique sur les calories ingérées réelles (si saisies) ou estimées (macros cibles)
  const real = getRealIntake();
  const baseCal = real.kcal > 0
    ? real.kcal
    : (() => {
        const p = +document.getElementById('macro-p').value || 0;
        const c = +document.getElementById('macro-c').value || 0;
        const l = +document.getElementById('macro-l').value || 0;
        return p*4 + c*4 + l*9;
      })();

  const savedKcal = Math.round(baseCal * totalPct / 100);

  // Hint sous l'input
  const hint = document.getElementById('fibres-hint');
  if (hint) {
    if (fibres < 15) hint.textContent = `Faible (< 15g) — réduction minimale`;
    else if (fibres < 25) hint.textContent = `Correct — ${totalPct.toFixed(1)}% non absorbé`;
    else if (fibres < 40) hint.textContent = `✅ Élevé — ${totalPct.toFixed(1)}% non absorbé`;
    else hint.textContent = `🌟 Très élevé — ${totalPct.toFixed(1)}% non absorbé (max ~5%)`;
    hint.style.color = fibres >= 25 ? 'var(--green)' : 'var(--text3)';
  }

  setElText('fibres-kcal', `−${savedKcal} kcal`);
  setElText('fibres-pct', `${totalPct.toFixed(1)}% non absorbé`);

  const barEl = document.getElementById('fibres-bar');
  if (barEl) barEl.style.width = `${Math.min(totalPct / 8 * 100, 100)}%`;

  updateLiveBar();
}

function getFibresReduction() {
  // Retourne les kcal non absorbées dues aux fibres
  const fibres = +document.getElementById('fibres-g')?.value || 0;
  const digSpeed = +document.getElementById('digestion-speed')?.value || 1.0;
  const fibresPct = Math.min(fibres / 10 * 1.2, 5.0);
  const speedAdj = (digSpeed - 1.0) * 10;
  const totalPct = Math.max(0, fibresPct - speedAdj);
  const real = getRealIntake();
  const baseCal = real.kcal > 0
    ? real.kcal
    : (() => {
        const p = +document.getElementById('macro-p').value || 0;
        const c = +document.getElementById('macro-c').value || 0;
        const l = +document.getElementById('macro-l').value || 0;
        return p*4 + c*4 + l*9;
      })();
  return Math.round(baseCal * totalPct / 100);
}

// ═══════════════════════════════════════════════════════════
// LIPA
// ═══════════════════════════════════════════════════════════
function updateWorkStatus() {
  const status=document.getElementById('work-status')?.value||'work';
  const workField=document.getElementById('work-hours-field');
  const typeField=document.getElementById('work-type-field');
  const metier=document.getElementById('metier');
  if(!metier) return;
  const hideHours=['home','retired','none'].includes(status);
  if(workField) workField.style.display=hideHours?'none':'';
  const defVals={work:null,study:'80',home:'50',retired:'50',none:'50'};
  if(defVals[status]) metier.value=defVals[status];
  updateLIPAHint();
}
function updateLIPAHint() {
  const poids=+document.getElementById('poids').value||80;
  const metier=+document.getElementById('metier').value||70;
  const hours=+document.getElementById('work-hours').value||8;
  const status=document.getElementById('work-status')?.value||'work';
  const hideHours=['home','retired','none'].includes(status);
  const lipaWork=hideHours?metier:metier*(hours/8);
  const _mv1=document.getElementById('marche-hors').value;
  const pas=(_mv1===''||_mv1===null||_mv1===undefined)?8000:+_mv1; // 0 pas = 0 kcal (pas vide → défaut 8000)
  const marcheKcal=pas*poids*0.00050;
  const hint=document.getElementById('pas-hint');
  if(hint) hint.textContent=`≈ ${(pas*0.00075).toFixed(1)} km · ${Math.round(marcheKcal)} kcal`;
  const menage=+document.getElementById('menage').value||0;
  const trajets=+document.getElementById('trajets').value||0;
  const total=Math.round(lipaWork+marcheKcal+menage+trajets+fidgetKcal+sexActiviteKcal);
  setElText('lipa-preview',total+' kcal');
  const bd=document.getElementById('lipa-breakdown');
  if(bd) bd.innerHTML=`
    <div class="lipa-stat-row"><span>Occupation</span><span>${Math.round(lipaWork)} kcal</span></div>
    <div class="lipa-stat-row"><span>Pas (${pas.toLocaleString('fr-FR')})</span><span>${Math.round(marcheKcal)} kcal</span></div>
    <div class="lipa-stat-row"><span>Ménage</span><span>${menage} kcal</span></div>
    <div class="lipa-stat-row"><span>Trajets</span><span>${trajets} kcal</span></div>
    ${fidgetKcal>0?`<div class="lipa-stat-row"><span>NEAT fidgeting</span><span style="color:var(--green);">+${fidgetKcal} kcal</span></div>`:''}
    ${sexActiviteKcal>0?`<div class="lipa-stat-row"><span>Activité sexuelle</span><span style="color:var(--purple);">+${sexActiviteKcal} kcal</span></div>`:''}
  `;
  updateLiveBar();
}
function computeLIPA(poids) {
  const metier=+document.getElementById('metier').value||70;
  const hours=+document.getElementById('work-hours').value||8;
  const status=document.getElementById('work-status')?.value||'work';
  const hideHours=['home','retired','none'].includes(status);
  const lipaWork=hideHours?metier:metier*(hours/8);
  const _mv2=document.getElementById('marche-hors').value;
  const pas=(_mv2===''||_mv2===null||_mv2===undefined)?8000:+_mv2;
  const marcheKcal=pas*poids*0.00050; // 0 pas saisi = 0 kcal
  const menage=+document.getElementById('menage').value||0;
  const trajets=+document.getElementById('trajets').value||0;
  const tempFactor=+document.getElementById('temperature').value||1;
  return Math.round((lipaWork+marcheKcal+menage+trajets+fidgetKcal+sexActiviteKcal)*tempFactor);
}

// ═══════════════════════════════════════════════════════════
// HYDRATATION
// ═══════════════════════════════════════════════════════════
let hydraTemp = 'froide'; // 'froide' | 'tiede' | 'chaude'

// Thermogénèse eau froide : chauffer 1L de 4°C à 37°C = 33°C × 1 kcal/°C/L = 33 kcal/L
// Eau tiède (20°C) → 17°C d'écart = ~17 kcal/L
// Eau chaude (37°C) → 0°C d'écart = 0 kcal/L (déjà à température corporelle)
const HYDRA_THERMO = { froide: 33, tiede: 17, chaude: 0 };

// Effet déshydratation sur BMR (Boschmann 2003, Armstrong 2012)
// 0–1%: aucun, 1–2%: −1%, 2–3%: −3%, 3–5%: −5%, >5%: −7%
function getHydraDehydPct(litres, poids) {
  // Besoin de base : 35ml/kg/jour
  const besoin = poids * 0.035;
  const manque = Math.max(0, besoin - litres);
  const manquePct = (manque / (poids * 0.6)) * 100; // eau corporelle totale ~60% du poids
  if (manquePct < 1) return 0;
  if (manquePct < 2) return -1;
  if (manquePct < 3) return -3;
  if (manquePct < 5) return -5;
  return -7;
}

function setHydraTemp(temp) {
  hydraTemp = temp;
  ['froide','tiede','chaude'].forEach(t => {
    document.getElementById(`hydra-${t}`).classList.toggle('active', t === temp);
  });
  updateHydraCalc();
  saveState();
}

function buildWaterTrack(litres) {
  const track = document.getElementById('water-track');
  if (!track) return;
  const total = 12; // 12 × 250ml = 3L max visible
  const filled = Math.round(litres * 4); // 1L = 4 gouttes × 250ml
  track.innerHTML = Array.from({length: total}, (_, i) => {
    const isFull = i < filled;
    return `<div class="water-drop ${isFull?'filled':''}" onclick="setHydraDrops(${i+1})" title="${((i+1)*0.25).toFixed(2)}L">💧</div>`;
  }).join('');
}

function setHydraDrops(n) {
  const litres = n * 0.25;
  setVal('hydra-litres', litres);
  updateHydraCalc();
}

function updateHydraCalc() {
  const litres = +document.getElementById('hydra-litres')?.value || 0;
  const poids = +document.getElementById('poids').value || 80;
  buildWaterTrack(litres);

  // Besoin minimal
  const besoin = (poids * 0.035).toFixed(1);
  const besoinEl = document.getElementById('hydra-besoin-ref');
  if (besoinEl) besoinEl.textContent = `${besoin}L`;

  // Thermogénèse
  const thermoPerL = HYDRA_THERMO[hydraTemp] || 0;
  const thermoKcal = Math.round(litres * thermoPerL);

  // Statut hydratation
  const dehydPct = getHydraDehydPct(litres, poids);
  const bmr = 500 + 22 * poids * 0.8; // BMR estimé rapide pour preview
  const bmrEffect = Math.round(bmr * dehydPct / 100);

  // Total
  const totalEffect = thermoKcal + bmrEffect; // bmrEffect est négatif si déshydraté

  // Statut hint
  const hint = document.getElementById('hydra-status-hint');
  const ratio = litres / (poids * 0.035);
  if (hint) {
    if (litres === 0) { hint.textContent = '⚠️ Aucune hydratation'; hint.style.color = 'var(--red)'; }
    else if (ratio < 0.5) { hint.textContent = '🔴 Déshydratation sévère'; hint.style.color = 'var(--red)'; }
    else if (ratio < 0.75) { hint.textContent = '🟠 Sous-hydraté'; hint.style.color = 'var(--orange)'; }
    else if (ratio < 1.0) { hint.textContent = '🟡 Légèrement sous le besoin'; hint.style.color = 'var(--yellow)'; }
    else if (ratio < 1.3) { hint.textContent = '✅ Bien hydraté'; hint.style.color = 'var(--green)'; }
    else { hint.textContent = '💧 Très bien hydraté'; hint.style.color = 'var(--teal)'; }
  }

  // Afficher résultats
  setElText('hydra-thermo', thermoKcal > 0 ? `+${thermoKcal}` : '0');
  const bmrEl = document.getElementById('hydra-bmr-effect');
  if (bmrEl) {
    bmrEl.textContent = dehydPct === 0 ? '±0%' : `${dehydPct}%`;
    bmrEl.style.color = dehydPct < 0 ? 'var(--red)' : 'var(--green)';
  }
  setElText('hydra-total', totalEffect >= 0 ? `+${totalEffect}` : `${totalEffect}`);

  // Conseil
  const advice = document.getElementById('hydra-advice');
  if (advice) {
    if (litres === 0) advice.textContent = '⚠️ Sans hydratation, ton BMR peut baisser de 3 à 7% selon le niveau de déshydratation.';
    else if (dehydPct < 0) advice.textContent = `⚠️ Déshydratation estimée — BMR réduit de ${Math.abs(dehydPct)}% (soit ~${Math.abs(bmrEffect)} kcal). Boire ${(poids*0.035).toFixed(1)}L/j minimum.`;
    else if (thermoKcal > 0) advice.textContent = `✅ ${thermoKcal} kcal brûlés via thermogénèse (eau froide). Pour maximiser l'effet, boire de l'eau très froide (4°C) tout au long de la journée.`;
    else advice.textContent = `💡 Passe à l'eau froide pour activer la thermogénèse — jusqu'à +${Math.round(litres*33)} kcal/j avec la même quantité d'eau.`;
  }

  updateLiveBar();
}

function getHydraThermo() {
  const litres = +document.getElementById('hydra-litres')?.value || 0;
  const thermoPerL = HYDRA_THERMO[hydraTemp] || 0;
  return Math.round(litres * thermoPerL);
}

function getHydraBMRCorrection() {
  const litres = +document.getElementById('hydra-litres')?.value || 0;
  const poids = +document.getElementById('poids').value || 80;
  return getHydraDehydPct(litres, poids) / 100; // retourne un multiplicateur ex: -0.03
}



// ═══════════════════════════════════════════════════════════
// FIN DE JOURNÉE
// ═══════════════════════════════════════════════════════════
function finDeJournee() {
  const r=computeTDEE();
  const real=getRealIntake();
  const alcoolKcalFin = getAlcoolKcal();
  // Poids du jour
  const poidsLog = loadPoidsLog();
  const todayDate = new Date().toLocaleDateString('fr-FR');
  const poidsAujourdhui = poidsLog.find(p => p.date === todayDate)?.poids || null;

  const entry={
    id:Date.now(),
    date:todayDate,
    bmr:r.bmr, neat:r.tapisRes.total, cardio:r.cardioRes.total,
    muscu:r.muscuRes.total, lipa:r.lipa, tef:r.tef,
    total:r.total, cible:r.cible, objectif:r.objectif,
    lbm:r.lbm, poids:r.poids,
    apport:real.kcal+alcoolKcalFin, balance:(real.kcal+alcoolKcalFin)>0?(real.kcal+alcoolKcalFin)-r.total:null,
    p:real.p, c:real.c, l:real.l,
    poidsKg:poidsAujourdhui
  };
  const hist=JSON.parse(localStorage.getItem(HIST_KEY)||'[]');
  hist.unshift(entry);
  if(hist.length>60) hist.length=60;
  localStorage.setItem(HIST_KEY,JSON.stringify(hist));
  renderHistory();
  if(typeof triggerSyncToCloud === 'function') triggerSyncToCloud();
  showToast('💾 Journée sauvegardée dans le journal !');
  setTimeout(()=>switchTab('journal'),800);
}

// ═══════════════════════════════════════════════════════════
// HISTORIQUE / JOURNAL
// ═══════════════════════════════════════════════════════════
function renderHistory() {
  const hist=JSON.parse(localStorage.getItem(HIST_KEY)||'[]');
  const el=document.getElementById('hist-list');
  if(!el)return;
  if(hist.length===0){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3);font-size:13px;">Aucune journée enregistrée.<br>Utilise "Fin de journée" pour sauvegarder.</div>';return;}

  // Stats résumé
  const tdees=hist.map(h=>h.total);
  const avg=Math.round(tdees.reduce((a,b)=>a+b,0)/tdees.length);
  const trend=tdees.length>=3?tdees[0]-tdees[Math.min(tdees.length-1,6)]:null;

  const statsHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:14px;">
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px;"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">TDEE moyen</div><div style="font-size:22px;font-weight:700;color:var(--blue);letter-spacing:-0.5px;">${avg}</div></div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px;"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Min / Max</div><div style="font-size:18px;font-weight:700;color:var(--text3);letter-spacing:-0.5px;">${Math.min(...tdees)}<span style="font-size:12px;margin:0 4px;color:var(--text4);">/</span>${Math.max(...tdees)}</div></div>
    ${trend!==null?`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px;"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Tendance</div><div style="font-size:22px;font-weight:700;color:${trend<0?'var(--red)':trend>0?'var(--green)':'var(--text3)'};letter-spacing:-0.5px;">${trend>0?'+':''}${trend}</div></div>`:''}
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px;"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Journées</div><div style="font-size:22px;font-weight:700;color:var(--text3);letter-spacing:-0.5px;">${hist.length}</div></div>
  </div>`;

  const hmapHTML = (() => {
    if(hist.length === 0) return '';
    const actData = [...hist].reverse().map(h => ({ d: h.date, k: (h.total||0) - (h.bmr||0) - (h.tef||0) }));
    const boxes = actData.map(val => {
      let c = 'var(--surface2)';
      if(val.k > 1000) c = 'var(--blue)'; // Intense
      else if(val.k > 600) c = 'rgba(10,132,255,0.7)';
      else if(val.k > 300) c = 'rgba(10,132,255,0.4)';
      else if(val.k > 100) c = 'rgba(10,132,255,0.2)';
      return `<div title="${val.d} : ${Math.round(val.k)} kcal actives" style="width:14px;height:14px;border-radius:3px;background:${c};"></div>`;
    }).join('');
    return `
      <div style="margin-bottom:24px;">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Intensité d'Activité (60 jrs)</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${boxes}</div>
      </div>`;
  })();

  const rows=hist.map(h=>{
    const bal=h.balance;
    const balColor=bal<0?'var(--red)':bal>0?'var(--green)':'var(--text3)';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
      <div><div style="font-size:13px;font-weight:600;">${h.date}</div><div style="font-size:11px;color:var(--text3);margin-top:2px;">BMR ${h.bmr} · Tapis ${h.neat} · Cardio ${h.cardio||0}${h.muscu?` · 💪 ${h.muscu}`:''} · ${h.objectif}</div></div>
      <div style="text-align:right;display:flex;align-items:center;gap:16px;">
        ${h.apport?`<div><div style="font-size:10px;color:var(--text3);">Apport</div><div style="font-size:16px;font-weight:700;color:var(--orange);">${h.apport}</div></div><div><div style="font-size:10px;color:var(--text3);">Balance</div><div style="font-size:16px;font-weight:700;color:${balColor};">${bal>=0?'+':''}${bal}</div></div>`:''}
        ${h.poidsKg?`<div><div style="font-size:10px;color:var(--text3);">Poids</div><div style="font-size:16px;font-weight:700;color:var(--green);">${h.poidsKg} kg</div></div>`:''}
        <div><div style="font-size:10px;color:var(--text3);">TDEE</div><div style="font-size:20px;font-weight:700;color:var(--blue);letter-spacing:-0.5px;">${h.total}</div></div>
        <button onclick="deleteHistory(${h.id})" style="background:none;border:none;color:var(--red);cursor:pointer;opacity:0.5;font-size:14px;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0.5">🗑</button>
      </div>
    </div>`;
  }).join('');

  el.innerHTML=statsHTML+hmapHTML+rows;
  renderChart(hist);
}

function renderChart(hist) {
  const wrap=document.getElementById('chart-wrap');
  if(!wrap||hist.length<2)return;
  const data=[...hist].reverse();
  const tdees=data.map(h=>h.total);
  const cibles=data.map(h=>h.cible);
  const apports=data.map(h=>h.apport||0).filter(v=>v>0);
  const hasApport=apports.length>0;
  const minV=Math.min(...tdees,...cibles,(hasApport?Math.min(...apports):9999))-100;
  const maxV=Math.max(...tdees,...cibles,(hasApport?Math.max(...apports):0))+100;
  const W=700,H=160,P=30;
  const n=data.length;
  const sx=i=>P+(i/Math.max(n-1,1))*(W-P*2);
  const sy=v=>H-P-((v-minV)/(maxV-minV))*(H-P*2);
  const tdeePoints=data.map((h,i)=>`${sx(i)},${sy(h.total)}`).join(' ');
  const ciblePoints=data.map((h,i)=>`${sx(i)},${sy(h.cible)}`).join(' ');
  const fillPath=`M${sx(0)},${H-P} `+data.map((h,i)=>`L${sx(i)},${sy(h.total)}`).join(' ')+` L${sx(n-1)},${H-P} Z`;
  const labels=data.map((h,i)=>n<=8||i%Math.ceil(n/6)===0?`<text x="${sx(i)}" y="${H-P+14}" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="middle" font-family="Inter">${h.date.slice(0,5)}</text>`:'').join('');
  const dots=data.map((h,i)=>`<circle cx="${sx(i)}" cy="${sy(h.total)}" r="3" fill="var(--blue)"><title>${h.date}: ${h.total} kcal</title></circle>`).join('');
  const apportDots=hasApport?data.filter(h=>h.apport).map((h,i)=>`<circle cx="${sx(data.indexOf(h))}" cy="${sy(h.apport)}" r="2.5" fill="var(--orange)" opacity="0.8"/>`).join(''):'';
  const grid=Array.from({length:4},(_,i)=>{const v=Math.round((minV+(maxV-minV)*i/3)/50)*50;const y=sy(v);return`<line x1="${P}" y1="${y}" x2="${W-P}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/><text x="${P-4}" y="${y+3}" fill="rgba(255,255,255,0.25)" font-size="9" text-anchor="end" font-family="Inter">${v}</text>`;}).join('');
  wrap.innerHTML=`
    <div style="font-size:10px;font-weight:500;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;display:flex;gap:16px;">
      <span>📈 Évolution</span>
      <span style="color:var(--blue);">— TDEE</span>
      <span style="color:var(--orange);">● Apport</span>
      <span style="color:rgba(255,255,255,0.3);">-- Cible</span>
    </div>
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;overflow:visible;">
      <defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--blue)" stop-opacity="0.15"/><stop offset="100%" stop-color="var(--blue)" stop-opacity="0"/></linearGradient></defs>
      ${grid}
      <path d="${fillPath}" fill="url(#gf)"/>
      <polyline points="${ciblePoints}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" stroke-dasharray="4,3"/>
      <polyline points="${tdeePoints}" fill="none" stroke="var(--blue)" stroke-width="2"/>
      ${dots}${apportDots}${labels}
    </svg>`;
}

function deleteHistory(id) {
  let hist=JSON.parse(localStorage.getItem(HIST_KEY)||'[]');
  hist=hist.filter(h=>h.id!==id);
  localStorage.setItem(HIST_KEY,JSON.stringify(hist));
  renderHistory();
}

// ═══════════════════════════════════════════════════════════
// DARK MODE TOGGLE
// ═══════════════════════════════════════════════════════════
function toggleDark() {
  const isLight = document.body.classList.toggle('light');
  const btn = document.getElementById('dark-btn');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('metabo_theme', isLight ? 'light' : 'dark');
}
function initTheme() {
  const t = localStorage.getItem('metabo_theme');
  if (t === 'light') {
    document.body.classList.add('light');
    const btn = document.getElementById('dark-btn');
    if (btn) btn.textContent = '☀️';
  }
}

// ═══════════════════════════════════════════════════════════
// WIDGET RÉSUMÉ
// ═══════════════════════════════════════════════════════════
function openWidget() {
  document.getElementById('widget-overlay').classList.add('open');
  drawWidget();
}
function closeWidget() {
  document.getElementById('widget-overlay').classList.remove('open');
}
function drawWidget() {
  try {
    const r = computeTDEE();
    const real = getRealIntake();
    const fibresRed = getFibresReduction();
    const app = real.kcal > 0 ? Math.max(0, real.kcal - fibresRed) : 0;
    const bal = app > 0 ? app - r.total : null;

    setElText('w-tdee', r.total);
    const appEl = document.getElementById('w-app');
    if (appEl) appEl.textContent = app > 0 ? app : '—';
    const balEl = document.getElementById('w-bal');
    if (balEl) {
      balEl.textContent = bal !== null ? (bal >= 0 ? '+' + bal : '' + bal) : '—';
      balEl.style.color = bal === null ? 'var(--text3)' : bal < 0 ? 'var(--red)' : 'var(--green)';
    }
    setElText('w-obj', r.cible);
    setElText('w-bmr', r.bmr);

    // Macros bar
    const bar = document.getElementById('w-macro-bar');
    const lbl = document.getElementById('w-macro-lbl');
    if (bar && real.kcal > 0) {
      const total = real.p * 4 + real.c * 4 + real.l * 9 || 1;
      const pp = Math.round(real.p * 4 / total * 100);
      const cp = Math.round(real.c * 4 / total * 100);
      const lp = 100 - pp - cp;
      bar.innerHTML = `<div class="widget-macro-seg" style="width:${pp}%;background:var(--blue)"></div><div class="widget-macro-seg" style="width:${cp}%;background:var(--orange)"></div><div class="widget-macro-seg" style="width:${lp}%;background:var(--purple)"></div>`;
      if (lbl) lbl.innerHTML = `<span style="color:var(--blue)">P ${real.p}g</span><span style="color:var(--orange)">G ${real.c}g</span><span style="color:var(--purple)">L ${real.l}g</span>`;
    } else if (bar) {
      bar.innerHTML = '<div class="widget-macro-seg" style="width:100%;background:var(--surface3)"></div>';
      if (lbl) lbl.innerHTML = '<span>Renseigne tes apports</span>';
    }

    // Ring canvas
    const canvas = document.getElementById('widget-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 80, cy = 80, r2 = 65, lw = 14;
    ctx.clearRect(0, 0, 160, 160);
    // Background ring
    ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = lw; ctx.stroke();
    // TDEE vs cible ring
    if (app > 0) {
      const pct = Math.min(app / r.cible, 1.3);
      const color = pct > 1.1 ? '#FF453A' : pct > 0.95 ? '#30D158' : '#0A84FF';
      ctx.beginPath();
      ctx.arc(cx, cy, r2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.lineCap = 'round'; ctx.stroke();
    }
  } catch(e) { console.warn('widget error', e); }
}

// ═══════════════════════════════════════════════════════════
// COPIER HIER
// ═══════════════════════════════════════════════════════════
function copierHier() {
  const hist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
  if (hist.length === 0) { showToast('⚠️ Aucune journée précédente à copier'); return; }
  const hier = hist[0];
  // Restore session state from yesterday's entry (only food log)
  // On recharge les macros réelles de hier dans l'onglet alim
  if (hier.p || hier.c || hier.l) {
    // Clear food rows
    [...foodRows].forEach(id => removeFoodRow(id));
    // Add a single "Hier" row
    addFoodRow({ n: `Repas d'hier (${hier.date})`, k: hier.apport || '', p: hier.p || '', c: hier.c || '', l: hier.l || '' });
    closeWidget();
    showToast(`📋 Apports du ${hier.date} copiés dans Alimentation`);
    switchTab('alim');
  } else {
    showToast('⚠️ Aucun apport enregistré hier');
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════════════════
function exportCSV() {
  const hist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
  const poids = JSON.parse(localStorage.getItem('metabo_poids') || '[]');
  if (hist.length === 0 && poids.length === 0) { showToast('⚠️ Aucune donnée à exporter'); return; }

  const headers = ['Date','TDEE','BMR','Tapis','Cardio','Muscu','LIPA','TEF','Cible','Objectif','Apport','Balance','Prot_g','Glu_g','Lip_g','Poids_kg'];
  const rows = hist.map(h => {
    const poidsEntry = poids.find(p => p.date === h.date);
    return [
      h.date, h.total, h.bmr, h.neat||0, h.cardio||0, h.muscu||0, h.lipa||0, h.tef||0,
      h.cible, h.objectif, h.apport||'', h.balance||'', h.p||'', h.c||'', h.l||'',
      poidsEntry ? poidsEntry.poids : ''
    ].join(',');
  });

  // Ajouter poids non liés à une journée
  const poidsExtra = poids.filter(p => !hist.find(h => h.date === p.date));
  const poidsRows = poidsExtra.map(p => `${p.date},,,,,,,,,,,,,,${p.poids}`);

    const csv = [headers.join(','), ...rows, ...poidsRows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `metabo_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast(`✅ CSV exporté — ${hist.length} journées`);
}

// ═══════════════════════════════════════════════════════════
// POIDS QUOTIDIEN + MOYENNE 7J + PRÉDICTION
// ═══════════════════════════════════════════════════════════
const POIDS_KEY = 'metabo_poids';

function loadPoidsLog() {
  try { return JSON.parse(localStorage.getItem(POIDS_KEY) || '[]'); }
  catch { return []; }
}
function savePoidsLog(data) { localStorage.setItem(POIDS_KEY, JSON.stringify(data)); }

function savePoids() {
  const val = +document.getElementById('poids-log-input')?.value;
  if (!val || val < 20 || val > 300) { showToast('⚠️ Poids invalide'); return; }
  const date = new Date().toLocaleDateString('fr-FR');
  const log = loadPoidsLog();
  // Remplacer si même date
  const idx = log.findIndex(p => p.date === date);
  if (idx >= 0) log[idx].poids = val;
  else log.unshift({ date, poids: val, id: Date.now() });
  savePoidsLog(log);
  document.getElementById('poids-log-input').value = '';
  renderPoidsLog();
  showToast(`⚖️ ${val} kg enregistré`);
}

function ma7(log, idx) {
  // Moyenne mobile 7 jours centrée sur idx (ou vers l'arrière si pas assez de données)
  const slice = log.slice(idx, idx + 7);
  if (slice.length === 0) return null;
  return slice.reduce((a, b) => a + b.poids, 0) / slice.length;
}

function computePrediction(log) {
  if (log.length < 4) return null;
  // Calcul tendance par régression linéaire sur 7 derniers jours
  const n = Math.min(log.length, 14);
  const slice = log.slice(0, n).reverse(); // chronologique
  const xm = (n - 1) / 2;
  const ym = slice.reduce((a, b) => a + b.poids, 0) / n;
  let num = 0, den = 0;
  slice.forEach((p, i) => { num += (i - xm) * (p.poids - ym); den += (i - xm) ** 2; });
  const slope = den !== 0 ? num / den : 0; // kg/jour
  if (Math.abs(slope) < 0.005) return { slope, days: null, date: null }; // plateau
  const poidsActuel = log[0].poids;
  // Utiliser l'objectif poids dédié si disponible, sinon poids profil
  const poidsObjectifDedié = loadPoidsObjectif();
  const poidsObjectif = poidsObjectifDedié || +document.getElementById('poids')?.value || 70;
  const diff = poidsObjectif - poidsActuel;
  if ((diff > 0 && slope <= 0) || (diff < 0 && slope >= 0)) return { slope, days: null, date: null };
  const days = Math.round(Math.abs(diff / slope));
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  return {
    slope: Math.round(slope * 1000) / 1000,
    days,
    date: targetDate.toLocaleDateString('fr-FR'),
    deficitReel: Math.round(Math.abs(slope) * 7700 / 7) // kcal/j déficit réel observé
  };
}

function renderPoidsLog() {
  const log = loadPoidsLog();
  const el = document.getElementById('poids-log-list');
  if (!el) return;
  if (log.length === 0) {
    el.innerHTML = '<div style="font-size:13px;color:var(--text3);text-align:center;padding:20px 0;">Aucun poids enregistré — commence dès ce matin !</div>';
    return;
  }

  const rows = log.slice(0, 10).map((p, i) => {
    const ma = ma7(log, i);
    const prev = log[i + 1];
    const delta = prev ? p.poids - prev.poids : null;
    const deltaStr = delta !== null ? (delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)) : '—';
    const deltaColor = delta === null ? 'var(--text3)' : delta < 0 ? 'var(--green)' : delta > 0 ? 'var(--red)' : 'var(--text3)';
    return `<div class="poids-log-row">
      <span style="font-size:13px;font-weight:600;">${p.date}</span>
      <span style="font-size:16px;font-weight:700;">${p.poids} kg</span>
      <span style="font-size:12px;color:${deltaColor};font-weight:600;">${deltaStr} kg</span>
      ${ma ? `<span class="ma-row">MA7 : <span class="ma-val">${ma.toFixed(1)} kg</span></span>` : '<span></span>'}
      <button onclick="deletePoids(${p.id})" style="background:none;border:none;color:var(--red);cursor:pointer;opacity:0.4;font-size:13px;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0.4">🗑</button>
    </div>`;
  }).join('');

  el.innerHTML = rows;

  // Prédiction
  const pred = computePrediction(log);
  const predBlock = document.getElementById('prediction-block');
  const predContent = document.getElementById('prediction-content');
  if (predBlock && predContent) {
    if (pred && pred.days) {
      predBlock.style.display = 'block';
      const poidsObj = +document.getElementById('poids')?.value || 70;
      const current = log[0].poids;
      const dir = pred.slope < 0 ? 'perdre' : 'prendre';
      predContent.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:3px;">Tendance / semaine</div>
            <div style="font-size:18px;font-weight:700;color:${pred.slope<0?'var(--green)':'var(--orange)'};">${(pred.slope*7).toFixed(2)} kg</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:3px;">Déficit réel observé</div>
            <div style="font-size:18px;font-weight:700;color:var(--blue);">~${pred.deficitReel} kcal/j</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:3px;">Objectif poids (profil)</div>
            <div style="font-size:18px;font-weight:700;color:var(--text2);">${poidsObj} kg</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:3px;">Date estimée</div>
            <div style="font-size:18px;font-weight:700;color:var(--green);">${pred.date}</div>
          </div>
        </div>
        <div style="font-size:12px;color:var(--text3);margin-top:10px;">📐 Régression linéaire sur ${Math.min(log.length,14)} jours · À ce rythme tu ${dir} ~${Math.abs(pred.slope*7).toFixed(2)} kg/sem</div>
      `;
    } else if (pred && !pred.days) {
      predBlock.style.display = 'block';
      predContent.innerHTML = `<div style="font-size:13px;color:var(--text3);">📊 Tendance plate (${pred.slope > 0 ? '+' : ''}${pred.slope} kg/j) — ajuste ton déficit ou ajoute 4+ mesures pour affiner la prédiction.</div>`;
    } else {
      predBlock.style.display = 'none';
    }
  }

  // Plateau alert
  const plateau = detectPlateau(log);
  renderPlateauAlert(plateau);

  // Hint objectif
  const poidsObj = loadPoidsObjectif();
  const poidsHint = document.getElementById('poids-obj-hint');
  if (poidsHint && poidsObj && log.length > 0) {
    const diff = (log[0].poids - poidsObj).toFixed(1);
    const sign = diff > 0 ? '−' : '+';
    poidsHint.textContent = `${Math.abs(diff)} kg restants`;
    poidsHint.style.color = 'var(--green)';
  } else if (poidsHint) {
    poidsHint.textContent = 'Saisis ton objectif pour la prédiction';
  }

  // Date hint
  const dateObj = document.getElementById('date-objectif')?.value;
  const dateHint = document.getElementById('date-obj-hint');
  if (dateHint && dateObj && log.length > 0) {
    const target = new Date(dateObj);
    const today = new Date();
    const daysLeft = Math.round((target - today) / 86400000);
    const poidsObj2 = loadPoidsObjectif();
    if (poidsObj2 && log[0].poids) {
      const needed = (log[0].poids - poidsObj2) / Math.max(daysLeft, 1);
      dateHint.textContent = `${daysLeft}j · besoin de ${Math.abs(needed).toFixed(2)} kg/j`;
      dateHint.style.color = Math.abs(needed) > 0.15 ? 'var(--red)' : 'var(--green)';
    } else {
      dateHint.textContent = `${daysLeft} jours restants`;
    }
  }

  // Graphique poids
  renderPoidsChart(log);
}

function renderPoidsChart(log) {
  const wrap = document.getElementById('chart-poids');
  if (!wrap || log.length < 2) return;
  if (window.poidsChartInstance) window.poidsChartInstance.destroy();

  const data = [...log].reverse();
  const labels = data.map(p => p.date.slice(0, 5));
  const poids = data.map(p => p.poids);
  const ma = data.map((_, i) => {
    const windowArr = data.slice(Math.max(0, i - 3), i + 4);
    return windowArr.reduce((a, b) => a + b.poids, 0) / windowArr.length;
  });

  wrap.innerHTML = `
    <div style="font-size:10px;font-weight:500;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;display:flex;gap:16px;">
      <span>⚖️ Poids</span><span style="color:rgba(48,209,88,0.8);">● Brut</span><span style="color:var(--teal);">— MA7</span>
    </div>
    <div style="position: relative; height: 180px; width: 100%;">
      <canvas id="chart-canvas"></canvas>
    </div>`;

  const ctx = document.getElementById('chart-canvas').getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, 'rgba(48,209,88,0.15)');
  grad.addColorStop(1, 'rgba(48,209,88,0)');

  window.poidsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Poids Brut (\u200bkg)',
          data: poids,
          borderColor: 'rgba(48,209,88,0.5)',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointBackgroundColor: 'rgba(48,209,88,1)',
          pointBorderColor: '#000',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          backgroundColor: grad,
          tension: 0.3
        },
        {
          label: 'Moyenne Mobile 7j (\u200bkg)',
          data: ma,
          borderColor: '#5AC8FA',
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(28,28,30,0.95)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          displayColors: true,
          boxPadding: 6,
          callbacks: {
            label: function(context) {
              return ' ' + context.dataset.label + ' : ' + parseFloat(context.raw).toFixed(1);
            }
          }
        }
      },
      scales: {
        x: { 
          grid: { display: false }, 
          ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10, family: 'Inter' }, maxTicksLimit: 8 } 
        },
        y: { 
          grid: { color: 'rgba(255,255,255,0.06)' }, 
          ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10, family: 'Inter' }, padding: 8 }, 
          border: { display: false } 
        }
      }
    }
  });
}


// ═══════════════════════════════════════════════════════════
// POIDS OBJECTIF
// ═══════════════════════════════════════════════════════════
function savePoidObjState() {
  const v = document.getElementById('poids-objectif')?.value;
  if (v) localStorage.setItem('metabo_poids_obj', v);
}

function loadPoidsObjectif() {
  return +localStorage.getItem('metabo_poids_obj') || null;
}

function initPoidsObjectif() {
  const saved = loadPoidsObjectif();
  if (saved) setVal('poids-objectif', saved);
}

// ═══════════════════════════════════════════════════════════
// DÉTECTION PLATEAU
// ═══════════════════════════════════════════════════════════
function detectPlateau(log) {
  if (log.length < 10) return null;
  // Plateau = variation < 0.3 kg sur les 14 derniers jours
  const recent = log.slice(0, 14);
  const max = Math.max(...recent.map(p => p.poids));
  const min = Math.min(...recent.map(p => p.poids));
  const range = max - min;
  if (range < 0.3 && log.length >= 10) {
    // Calcule combien de jours le plateau dure
    let plateauDays = 0;
    for (let i = 0; i < log.length - 1; i++) {
      const window = log.slice(i, i + 7);
      const wMax = Math.max(...window.map(p => p.poids));
      const wMin = Math.min(...window.map(p => p.poids));
      if (wMax - wMin < 0.4) plateauDays = i + 7;
      else break;
    }
    return { range: range.toFixed(2), days: Math.min(plateauDays, log.length) };
  }
  return null;
}

function renderPlateauAlert(plateau) {
  const el = document.getElementById('plateau-block');
  if (!el) return;
  if (!plateau) { el.style.display = 'none'; el.innerHTML = ''; return; }

  el.style.display = 'block';
  el.innerHTML = `
    <div class="plateau-alert">
      <div class="plateau-icon">⚠️</div>
      <div class="plateau-body">
        <div class="plateau-title">Plateau détecté — ${plateau.days} jours sans progression</div>
        <div class="plateau-desc">Variation de seulement ${plateau.range} kg sur ${plateau.days} jours. Ton métabolisme s'est adapté. Voici les stratégies les plus efficaces :</div>
        <div class="plateau-tips">
          <div class="plateau-tip">🍚 <strong>Refeed day</strong> — 1 jour à +500 kcal (glucides) pour relancer la leptine et le métabolisme</div>
          <div class="plateau-tip">📉 <strong>Réduire le déficit</strong> — descends à −200 kcal au lieu de −500 pendant 1 semaine</div>
          <div class="plateau-tip">💪 <strong>Augmenter l'activité</strong> — +2 000 pas/jour ou +10 min de cardio pour créer un nouveau stimulus</div>
          <div class="plateau-tip">🔄 <strong>Diet break</strong> — 1–2 semaines à maintenance pour normaliser les hormones</div>
        </div>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// RAPPORT HEBDOMADAIRE
// ═══════════════════════════════════════════════════════════
function openRapport() {
  document.getElementById('rapport-overlay').classList.add('open');
  buildRapport();
}
function closeRapport() {
  document.getElementById('rapport-overlay').classList.remove('open');
}

function buildRapport() {
  const hist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
  const poidsLog = loadPoidsLog();
  const poidsObj = loadPoidsObjectif();
  const semaine = hist.slice(0, 7); // 7 dernières journées
  const el = document.getElementById('rapport-content');
  if (!el) return;

  if (semaine.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">Aucune journée enregistrée. Lance quelques journées pour générer un rapport.</div>';
    return;
  }

  // Calculs semaine
  const avgTDEE = Math.round(semaine.reduce((a, h) => a + h.total, 0) / semaine.length);
  const avgApport = semaine.filter(h => h.apport).length > 0
    ? Math.round(semaine.filter(h => h.apport).reduce((a, h) => a + (h.apport || 0), 0) / semaine.filter(h => h.apport).length)
    : null;
  const avgBal = avgApport ? avgApport - avgTDEE : null;

  // Poids semaine
  const poidsRecent = poidsLog.slice(0, 8);
  const poidsDeb = poidsRecent.length > 1 ? poidsRecent[poidsRecent.length - 1].poids : null;
  const poidsFin = poidsRecent.length > 0 ? poidsRecent[0].poids : null;
  const poidsChange = (poidsDeb && poidsFin) ? (poidsFin - poidsDeb).toFixed(2) : null;

  // Prédiction
  const pred = computePrediction(poidsLog);

  // Macros moyennes
  const avgP = semaine.filter(h=>h.p).length > 0 ? Math.round(semaine.reduce((a,h)=>a+(h.p||0),0)/semaine.length) : null;
  const avgC = semaine.filter(h=>h.c).length > 0 ? Math.round(semaine.reduce((a,h)=>a+(h.c||0),0)/semaine.length) : null;
  const avgL = semaine.filter(h=>h.l).length > 0 ? Math.round(semaine.reduce((a,h)=>a+(h.l||0),0)/semaine.length) : null;

  const date = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  const poidsCurrent = poidsFin || '—';

  el.innerHTML = `
    <div style="text-align:center;padding:16px 0;margin-bottom:16px;background:var(--surface2);border-radius:14px;">
      <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;">Rapport du ${date}</div>
      <div style="font-size:36px;font-weight:700;color:var(--blue);letter-spacing:-1.5px;margin:6px 0;">${avgTDEE}</div>
      <div style="font-size:12px;color:var(--text3);">kcal · TDEE moyen / jour</div>
    </div>

    <div class="rapport-section">
      <div class="rapport-section-title">⚡ Dépense énergétique</div>
      <div class="rapport-row"><span class="rr-label">TDEE moyen</span><span class="rr-val">${avgTDEE} kcal</span></div>
      <div class="rapport-row"><span class="rr-label">BMR moyen</span><span class="rr-val">${Math.round(semaine.reduce((a,h)=>a+h.bmr,0)/semaine.length)} kcal</span></div>
      <div class="rapport-row"><span class="rr-label">Journées enregistrées</span><span class="rr-val">${semaine.length} / 7</span></div>
    </div>

    ${avgApport ? `
    <div class="rapport-section">
      <div class="rapport-section-title">🍽️ Alimentation</div>
      <div class="rapport-row"><span class="rr-label">Apports moyens</span><span class="rr-val">${avgApport} kcal</span></div>
      <div class="rapport-row"><span class="rr-label">Balance moyenne</span><span class="rr-val" style="color:${avgBal<0?'var(--green)':'var(--red)'}">${avgBal>=0?'+':''}${avgBal} kcal</span></div>
      ${avgP?`<div class="rapport-row"><span class="rr-label">Protéines moy.</span><span class="rr-val">${avgP}g</span></div>`:''}
      ${avgC?`<div class="rapport-row"><span class="rr-label">Glucides moy.</span><span class="rr-val">${avgC}g</span></div>`:''}
      ${avgL?`<div class="rapport-row"><span class="rr-label">Lipides moy.</span><span class="rr-val">${avgL}g</span></div>`:''}
    </div>` : ''}

    ${poidsChange ? `
    <div class="rapport-section">
      <div class="rapport-section-title">⚖️ Évolution du poids</div>
      <div class="rapport-row"><span class="rr-label">Poids actuel</span><span class="rr-val">${poidsCurrent} kg</span></div>
      <div class="rapport-row"><span class="rr-label">Évolution</span><span class="rr-val" style="color:${+poidsChange<0?'var(--green)':'var(--red)'}">${+poidsChange>0?'+':''}${poidsChange} kg</span></div>
      ${poidsObj?`<div class="rapport-row"><span class="rr-label">Objectif</span><span class="rr-val">${poidsObj} kg (reste ${Math.abs(poidsCurrent-poidsObj).toFixed(1)} kg)</span></div>`:''}
      ${pred?.days?`<div class="rapport-row"><span class="rr-label">Date estimée</span><span class="rr-val" style="color:var(--green)">${pred.date}</span></div>`:''}
      ${pred?.deficitReel?`<div class="rapport-row"><span class="rr-label">Déficit réel observé</span><span class="rr-val" style="color:var(--blue)">~${pred.deficitReel} kcal/j</span></div>`:''}
    </div>` : ''}

    <div class="rapport-section">
      <div class="rapport-section-title">💡 Analyse</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.7;" id="rapport-analyse">${genereAnalyse(avgTDEE, avgApport, avgBal, poidsChange, pred)}</div>
    </div>`;
}

function genereAnalyse(tdee, apport, bal, poidsChange, pred) {
  const parts = [];
  if (tdee) parts.push(`Ton TDEE moyen de la semaine est <strong style="color:var(--blue)">${tdee} kcal</strong>.`);
  if (bal !== null && bal < -100) parts.push(`Tu es en déficit moyen de <strong style="color:var(--green)">${Math.abs(bal)} kcal/j</strong> — bonne progression.`);
  else if (bal !== null && bal > 200) parts.push(`Tu es en surplus de <strong style="color:var(--orange)">${bal} kcal/j</strong> — adapte si c'est involontaire.`);
  if (poidsChange && +poidsChange < -0.1) parts.push(`La balance pèse en ta faveur : <strong style="color:var(--green)">${poidsChange} kg</strong> cette semaine.`);
  else if (poidsChange && Math.abs(+poidsChange) < 0.1) parts.push(`Le poids est stable — vérifie que ton déficit est suffisant ou considère un ajustement.`);
  if (pred?.deficitReel) parts.push(`Ton déficit réel observé (~${pred.deficitReel} kcal/j) est ${pred.deficitReel < 200 ? 'faible — tu peux augmenter légèrement' : pred.deficitReel > 700 ? 'élevé — assure un apport protéique suffisant' : 'dans la plage idéale (300–500 kcal/j)'}.`);
  if (parts.length === 0) parts.push('Continue à enregistrer tes journées pour obtenir une analyse détaillée.');
  return parts.join(' ');
}

function partagerRapport() {
  const el = document.getElementById('rapport-content');
  if (!el) return;
  // Construire texte partageable
  const hist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]').slice(0, 7);
  const poidsLog = loadPoidsLog();
  const avgTDEE = hist.length ? Math.round(hist.reduce((a,h)=>a+h.total,0)/hist.length) : '—';
  const poidsCurrent = poidsLog[0]?.poids || '—';
  const pred = computePrediction(poidsLog);
  const poidsObj = loadPoidsObjectif();

  const text = `📊 Mon rapport MÉTABO — ${new Date().toLocaleDateString('fr-FR')}

⚡ TDEE moyen : ${avgTDEE} kcal/j
⚖️ Poids actuel : ${poidsCurrent} kg${poidsObj ? ` → Objectif : ${poidsObj} kg` : ''}
${pred?.date ? `🎯 Date estimée : ${pred.date} (${pred.deficitReel} kcal/j déficit réel)` : ''}

Généré avec MÉTABO — Journal Métabolique`;

  if (navigator.share) {
    navigator.share({ title: 'Mon rapport MÉTABO', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('✅ Rapport copié dans le presse-papier'));
  }
}

function telechargerRapport() {
  const el = document.querySelector('.rapport-box');
  if (!el) return;
  if (typeof html2canvas === 'undefined') { showToast('⚠️ Outil de capture non chargé'); return; }
  showToast('📸 Génération de l\'image en cours...');
  
  // Masquer le bouton télécharger sur l'image finale
  const btn = el.querySelector('button');
  if(btn) btn.style.display = 'none';

  html2canvas(el, { backgroundColor: '#000', scale: 2 }).then(canvas => {
    if(btn) btn.style.display = 'flex';
    const link = document.createElement('a');
    link.download = `Metabo-Rapport-${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✅ Bilan hebdomadaire sauvegardé !');
  }).catch(e => {
    if(btn) btn.style.display = 'flex';
    showToast('❌ Erreur capture : ' + e.message);
  });
}

// ═══════════════════════════════════════════════════════════
// SERVICE WORKER + PWA
// ═══════════════════════════════════════════════════════════
let deferredInstallPrompt = null;

function initPWA() {
  // (Le Service Worker est désormais enregistré via injectManifest().)

  // Détection prompt d'installation
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const dismissed = localStorage.getItem('pwa_dismissed');
    if (!dismissed) setTimeout(showPWABanner, 3000);
  });

  window.addEventListener('appinstalled', () => {
    hidePWABanner();
    showToast('✅ MÉTABO installé sur ton appareil !');
  });
}

function showPWABanner() {
  document.getElementById('pwa-banner')?.classList.add('show');
}
function hidePWABanner() {
  document.getElementById('pwa-banner')?.classList.remove('show');
}
function installPWA() {
  if (!deferredInstallPrompt) {
    showToast('💡 Menu navigateur : Ajouter a l ecran accueil');
    return;
  }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(result => {
    if (result.outcome === 'accepted') showToast('✅ Installation lancée !');
    deferredInstallPrompt = null;
    hidePWABanner();
  });
}
function dismissPWA() {
  hidePWABanner();
  localStorage.setItem('pwa_dismissed', '1');
}

// ═══════════════════════════════════════════════════════════
// MANIFEST PWA (injecté dynamiquement)
// ═══════════════════════════════════════════════════════════
function injectManifest() {
  // Manifest is now a real file (manifest.json) — SW registration below
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => {
        console.log('SW registered', reg.scope);
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const w = reg.installing;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('🔄 Mise à jour disponible — rechargez la page');
            }
          });
        });
      })
      .catch(err => console.warn('SW registration failed:', err));
  }
}

function deletePoids(id) {
  const log = loadPoidsLog().filter(p => p.id !== id);
  savePoidsLog(log);
  renderPoidsLog();
}

// ═══════════════════════════════════════════════════════════
// AUTOSAVE / AUTOLOAD
// ═══════════════════════════════════════════════════════════
function collectState() {
  const profil={age:g('age'),poids:g('poids'),taille:g('taille'),pctGraisse:g('pctGraisse'),methGraisse:g('methGraisse'),sex,eq,trainingLevel,cyclePhase:g('cyclePhase'),sommeil:g('sommeil'),sommeilH:g('sommeil-h'),workStatus:g('work-status'),workHours:g('work-hours'),objectif,objDelta:g('obj-delta'),protRatio:g('prot-ratio'),poidsObjectif:g('poids-objectif'),dateObjectif:g('date-objectif')};
  const tapis=tapisRows.map(id=>{
    const frac=document.getElementById(`t-frac-${id}`);
    const isFrac=frac&&frac.style.display!=='none';
    let cycles=[];
    if(isFrac){
      document.querySelectorAll(`#t-cycles-${id} .frac-cycle`).forEach(c=>{
        const cid=c.id.replace(`fc-${id}-`,'');
        cycles.push({vit:g(`fv-${id}-${cid}`),inc:g(`fi-${id}-${cid}`),min:g(`fm-${id}-${cid}`),sec:g(`fs-${id}-${cid}`)});
      });
    }
    return{vit:g(`t-vit-${id}`),dur:g(`t-dur-${id}`),inc:g(`t-inc-${id}`),mode:isFrac?'fraction':'standard',reps:g(`t-reps-${id}`),cycles};
  });
  const cardio=cardioRows.map(id=>({machine:document.getElementById(`ca-mac-${id}`)?.value,min:g(`ca-min-${id}`),sec:g(`ca-sec-${id}`),ser:g(`ca-ser-${id}`),repos:g(`ca-rep-${id}`)}));
  const muscu={enabled:muscuEnabled,intensity:muscuIntensity,singles:[],ss:[]};
  document.querySelectorAll('.single-row-wrap').forEach(wrap=>{const row=wrap.querySelector('.muscu-row-inner');if(!row)return;const id=+row.id.replace('muscu-','');if(!muscuRows.includes(id))return;muscu.singles.push({grp:g(`mg-${id}`),ex:g(`me-${id}`),ser:g(`ms-${id}`),rep:g(`mr-${id}`),repos:g(`mrt-${id}`),rm:document.getElementById(`mrm-${id}`)?.value});});
  supersetBlocks.forEach(sid=>{const block=document.getElementById(`ss-${sid}`);if(!block)return;const rids=muscuRows.filter(id=>block.contains(document.getElementById(`muscu-${id}`)));const gi=(rid)=>({grp:g(`mg-${rid}`),ex:g(`me-${rid}`),ser:g(`ms-${rid}`),rep:g(`mr-${rid}`),rm:document.getElementById(`mrm-${rid}`)?.value});muscu.ss.push({repos:g(`ss-repos-${sid}`),ex1:rids[0]?gi(rids[0]):{},ex2:rids[1]?gi(rids[1]):{}});});
  const alim={macroP:g('macro-p'),macroC:g('macro-c'),macroL:g('macro-l'),alcoolType,alcoolQty:g('alcool-qty'),food:foodRows.map(id=>({n:g(`fn-${id}`),k:g(`fk-${id}`),p:g(`fp-${id}`),c:g(`fc-${id}`),l:g(`fl-${id}`)}))};
  const activite={metier:g('metier'),workHours:g('work-hours'),marcheHors:g('marche-hors'),menage:g('menage'),trajets:g('trajets'),temperature:g('temperature'),fibresG:g('fibres-g'),digestionSpeed:g('digestion-speed'),fidgetLevel,sexActiviteLevel:document.querySelector('.sex-card.active')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1]||'none',hydraLitres:g('hydra-litres'),hydraTemp};
  return{profil,tapis,cardio,muscu,alim,activite};
}
function g(id){return document.getElementById(id)?.value;}
function setVal(id,val){if(val===undefined||val===null)return;const el=document.getElementById(id);if(el)el.value=val;}
function setElText(id,txt){const el=document.getElementById(id);if(el)el.textContent=txt;}
