// constants.js — METABO : Données statiques
// ═══════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════
const MUSCLE_GROUPS = {
  "Poitrine": ["Développé couché barre","Développé couché haltères","Écartés haltères","Push-up","Développé incliné barre","Développé incliné haltères","Câbles croisés","Dips poitrine"],
  "Dos": ["Traction pronation (pull-up)","Traction supination (chin-up)","Rowing barre","Rowing haltère 1 bras","Tirage vertical pronation","Tirage horizontal câble","Rowing machine","Shrugs barre","Deadlift"],
  "Épaules": ["Développé militaire barre","Développé militaire haltères","Élévations latérales","Oiseau / rear delt","Arnold press","Face pull câble","Upright row"],
  "Biceps": ["Curl barre","Curl haltères","Curl marteau","Curl concentration","Curl poulie basse","Curl incliné haltères","Curl inversé"],
  "Triceps": ["Extension barre au front","Dips triceps","Kickback haltère","Pushdown câble","Extension tête câble","Extension overhead haltère"],
  "Quadriceps": ["Squat barre","Leg press","Fentes marchées","Fentes statiques","Hack squat","Bulgarian split squat","Sissy squat","Extension machine"],
  "Ischio-jambiers": ["Romanian deadlift","Good morning","Leg curl couché machine","Leg curl assis machine","Nordic curl","Fentes arrière"],
  "Mollets": ["Mollets debout machine","Mollets assis machine","Mollets barre","Donkey calf raise","Mollets sur marche"],
  "Abdominaux": ["Crunch","Crunch câble","Relevé de jambes","Planche","Planche latérale","Russian twist","Ab wheel","Mountain climber","Dragon flag"],
  "Fessiers": ["Hip thrust barre","Hip thrust machine","Kickback câble","Abduction machine","Step-up haltères","Glute bridge"],
  "Full body": ["Deadlift conventionnel","Power clean","Snatch","Thruster","Kettlebell swing","Burpee","Clean and jerk","Barbell complex"]
};
const EXERCISE_MET = {
  default:5.0,"Deadlift conventionnel":6.2,"Romanian deadlift":5.6,"Squat barre":6.0,
  "Hack squat":5.5,"Bulgarian split squat":5.6,"Leg press":4.8,"Power clean":7.2,
  "Snatch":7.8,"Clean and jerk":7.8,"Thruster":7.2,"Kettlebell swing":7.0,
  "Burpee":8.0,"Barbell complex":7.5,"Traction pronation (pull-up)":6.0,
  "Traction supination (chin-up)":6.0,"Dips poitrine":5.5,"Dips triceps":5.0,
  "Hip thrust barre":4.8,"Nordic curl":5.0,"Good morning":5.0,"Planche":3.0,"Dragon flag":4.5
};
const RM_MET_MULT = {"50":0.75,"60":0.90,"70":1.00,"80":1.15,"90":1.30,"100":1.50};
const EPOC_KCAL = {legere:30,moderee:80,intense:160,maximale:250};
const ECONOMY = {debutant:1.05,intermediaire:1.00,avance:0.95,elite:0.88};
const GROUP_MASS_FACTOR = {
  "Quadriceps":1.40,"Ischio-jambiers":1.30,"Fessiers":1.30,"Full body":1.50,
  "Dos":1.20,"Poitrine":1.10,"Épaules":0.90,"Mollets":0.85,"Abdominaux":0.80,
  "Biceps":0.70,"Triceps":0.75
};
const EQ_DESC = {
  cunningham:"BMR = 500 + 22 × LBM — meilleure précision si % graisse connu",
  mifflin:"Référence clinique — basée sur le poids total",
  harris:"Harris-Benedict révisée 1984 — légèrement plus haute"
};

// Machines cardio avec MET Ainsworth 2011 — cohérence garantie
const CARDIO_MACHINES = {
  "Corde à sauter — lent (60–80 sauts/min)":   {met:8.8,  cat:"cardio"},
  "Corde à sauter — modéré (100–120/min)":      {met:10.5, cat:"cardio"},
  "Corde à sauter — rapide (140+/min)":         {met:12.3, cat:"cardio"},
  "Corde à sauter — double unders":             {met:13.0, cat:"cardio"},
  "Vélo elliptique — effort modéré":            {met:5.0,  cat:"cardio"},
  "Vélo elliptique — effort soutenu":           {met:6.8,  cat:"cardio"},
  "Vélo elliptique — effort intense":           {met:9.0,  cat:"cardio"},
  "Vélo stationnaire — effort léger":           {met:3.5,  cat:"cardio"},
  "Vélo stationnaire — effort modéré":          {met:7.0,  cat:"cardio"},
  "Vélo stationnaire — effort intense":         {met:10.5, cat:"cardio"},
  "Rameur — effort modéré":                     {met:7.0,  cat:"cardio"},
  "Rameur — effort intense":                    {met:8.5,  cat:"cardio"},
  "Escalier (stepper) — modéré":               {met:6.0,  cat:"cardio"},
  "Escalier (stepper) — intense":              {met:9.0,  cat:"cardio"},
  "Ski elliptique (ski erg) — modéré":          {met:7.5,  cat:"cardio"},
  "Ski elliptique — intense":                   {met:9.5,  cat:"cardio"},
  "Natation — brasse modérée":                  {met:5.3,  cat:"cardio"},
  "Natation — crawl soutenu":                   {met:8.3,  cat:"cardio"},
  "Vélo extérieur — modéré (16–19 km/h)":       {met:8.0,  cat:"cardio"},
  "Marche rapide (5–6 km/h)":                   {met:4.3,  cat:"cardio"},
  "Footing léger (7–8 km/h)":                   {met:7.0,  cat:"cardio"},
  "Course (10–12 km/h)":                        {met:10.0, cat:"cardio"},
  "HIIT — work (effort maximal)":               {met:13.5, cat:"hiit"},
  "HIIT — récupération active":                 {met:4.0,  cat:"hiit"},
};
