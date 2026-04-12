// calculations.js — METABO : Logique de calcul (BMR, TDEE, LiveBar)
// ═══════════════════════════════════════════════════════════
// BMR
// ═══════════════════════════════════════════════════════════
function computeBMR(poids,pctGraisse,taille,age) {
  const f=+document.getElementById('methGraisse').value||1;
  const lbm=poids*(1-pctGraisse*f/100);
  let bmr;
  if(eq==='cunningham') bmr=500+22*lbm;
  else if(eq==='mifflin') bmr=sex==='H'?10*poids+6.25*taille-5*age+5:10*poids+6.25*taille-5*age-161;
  else bmr=sex==='H'?88.362+13.397*poids+4.799*taille-5.677*age:447.593+9.247*poids+3.098*taille-4.330*age;
  const sF=sex==='F'?+document.getElementById('sommeil')?.value||1:+document.getElementById('sommeil-h')?.value||1;
  bmr*=sF;
  if(sex==='F') bmr+=+document.getElementById('cyclePhase')?.value||0;
  // Correction hydratation : déshydratation réduit le BMR
  const hydraMult = 1 + getHydraBMRCorrection();
  bmr *= hydraMult;
  return{bmr,lbm:lbm.toFixed(1)};
}

// ═══════════════════════════════════════════════════════════
// CALCUL TDEE LIVE
// ═══════════════════════════════════════════════════════════
function computeTDEE() {
  const age=+document.getElementById('age').value||30;
  const poids=+document.getElementById('poids').value||80;
  const taille=+document.getElementById('taille').value||175;
  const pctGraisse=+document.getElementById('pctGraisse').value||20;
  const {bmr,lbm}=computeBMR(poids,pctGraisse,taille,age);
  const tapisRes=computeTapis(poids);
  const cardioRes=computeCardio(poids);
  let muscuRes={total:0,epoc:0,results:[],tonnage:0,avgGF:'1.00'};
  if(muscuEnabled){
    const exercises=muscuRows.map(id=>({
      groupe:document.getElementById(`mg-${id}`)?.value||'—',
      exercice:document.getElementById(`me-${id}`)?.value||'—',
      series:+document.getElementById(`ms-${id}`)?.value||3,
      reps:+document.getElementById(`mr-${id}`)?.value||10,
      repos:+document.getElementById(`mrt-${id}`)?.value||90,
      rm:document.getElementById(`mrm-${id}`)?.value||'70',id
    }));
    muscuRes=computeMuscu(poids);
  }
  const tef=computeTEF();
  const lipa=computeLIPA(poids);
  const hydraThermo = getHydraThermo(); // kcal thermogénèse eau froide
  const total=Math.round(bmr+tapisRes.total+cardioRes.total+muscuRes.total+lipa+tef+hydraThermo);
  const delta=+document.getElementById('obj-delta').value||300;
  let cible=total;
  if(objectif==='prise') cible=total+delta;
  else if(objectif==='deficit') cible=total-delta;
  return{bmr:Math.round(bmr),lbm,tapisRes,cardioRes,muscuRes,tef,lipa,total,cible,objectif,pctGraisse,poids};
}

// ═══════════════════════════════════════════════════════════
// LIVE BAR
// ═══════════════════════════════════════════════════════════
function animateValue(id, value, duration = 400) {
  const el = document.getElementById(id);
  if (!el) return;
  if (value === '—' || isNaN(parseInt(value.toString().replace(/[^0-9-]/g, '')))) { 
    el.textContent = value; 
    return; 
  }
  const startObj = parseInt(el.textContent.replace(/[^0-9-]/g, ''));
  const start = isNaN(startObj) ? 0 : startObj;
  const end = parseInt(value.toString().replace(/[^0-9-]/g, ''));
  if (start === end) { el.textContent = value; return; }
  const prefix = value.toString().startsWith('+') ? '+' : (value < 0 ? '-' : '');
  const isCib = id === 'lb-cib';
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(start + (end - start) * easeOutQuart);
    // On conserve le format correct
    el.textContent = (prefix && current >= 0 && prefix==='+' ? '+' : '') + current;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = value;
  };
  requestAnimationFrame(step);
}

function updateLiveBar() {
  try {
    const r=computeTDEE();
    const real=getRealIntake();
    const dep=r.total;
    const fibresRed=getFibresReduction();
    const alcoolKcalLive=getAlcoolKcal();
    const app=real.kcal>0?Math.max(0,real.kcal+alcoolKcalLive-fibresRed):0; 
    const bal=app-dep;
    const cib=r.cible;
    
    animateValue('lb-dep', dep);
    animateValue('lb-app', app>0?app:'—');
    
    const balEl=document.getElementById('lb-bal');
    if(balEl){
      animateValue('lb-bal', app>0?(bal>=0?'+':'')+bal:'—');
      balEl.className=`live-val bal${app>0?(bal>=0?' pos':' neg'):''}`;
    }
    
    animateValue('lb-cib', cib);
    
    const lbl=document.getElementById('lb-bal-lbl');
    if(lbl){lbl.textContent=app>0?(bal>=0?'Surplus':'Déficit'):'E/S';}
  } catch(e){}
}
