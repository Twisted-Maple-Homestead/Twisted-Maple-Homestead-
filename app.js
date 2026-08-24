
(() => {
  const CROP_DATA = {
    "Tomato": {yieldMin:8,yieldMax:20,spacing:18,row:36,container:5,succession:21,family:"Solanaceae"},
    "Bush Bean": {yieldMin:.25,yieldMax:.6,spacing:4,row:18,container:2,succession:14,family:"Fabaceae"},
    "Carrot": {yieldMin:.15,yieldMax:.3,spacing:2,row:12,container:3,succession:14,family:"Apiaceae"},
    "Lettuce": {yieldMin:.3,yieldMax:.8,spacing:8,row:12,container:2,succession:10,family:"Asteraceae"},
    "Cucumber": {yieldMin:5,yieldMax:12,spacing:12,row:36,container:5,succession:21,family:"Cucurbitaceae"},
    "Bell Pepper": {yieldMin:2,yieldMax:5,spacing:18,row:30,container:3,succession:21,family:"Solanaceae"},
    "Zucchini": {yieldMin:6,yieldMax:15,spacing:24,row:48,container:10,succession:21,family:"Cucurbitaceae"},
    "Onion": {yieldMin:.25,yieldMax:.6,spacing:4,row:12,container:3,succession:0,family:"Amaryllidaceae"},
    "White Potato": {yieldMin:1.5,yieldMax:4,spacing:12,row:30,container:10,succession:0,family:"Solanaceae"},
    "Kale": {yieldMin:1,yieldMax:3,spacing:12,row:18,container:5,succession:21,family:"Brassicaceae"}
  };

  const state = {
    tab: "home",
    modal: null,
    user: null,
    premium: false,
    cropRefs: [],
    data: loadData()
  };


  function sbClient(){ return getSupabase(); }


  async function invokeEdge(name,body={}){
    const sb=sbClient();
    if(!sb) throw new Error("Supabase is not configured.");
    const {data,error}=await sb.functions.invoke(name,{body});
    if(error) throw error;
    return data;
  }

  async function dbSelect(table){
    const sb = sbClient(); if(!sb || !state.user) return null;
    const {data,error} = await sb.from(table).select("*").eq("user_id", state.user.id);
    if(error){ console.warn(table,error.message); return null; }
    return data || [];
  }

  async function dbInsert(table,row){
    const sb = sbClient(); if(!sb || !state.user) return null;
    const payload = {...row,user_id:state.user.id};
    const {data,error} = await sb.from(table).insert(payload).select().single();
    if(error){ console.warn(table,error.message); return null; }
    return data;
  }

  async function dbUpdate(table,id,changes){
    const sb = sbClient(); if(!sb || !state.user) return null;
    const {data,error} = await sb.from(table).update(changes).eq("id",id).eq("user_id",state.user.id).select().single();
    if(error){ console.warn(table,error.message); return null; }
    return data;
  }

  async function dbDelete(table,id){
    const sb = sbClient(); if(!sb || !state.user) return false;
    const {error} = await sb.from(table).delete().eq("id",id).eq("user_id",state.user.id);
    if(error){ console.warn(table,error.message); return false; }
    return true;
  }


  async function loadCropReferences(){
    const sb=sbClient();
    if(!sb) {
      state.cropRefs = Object.entries(CROP_DATA).map(([name,v],i)=>({
        id:name, common_name:name, plant_family:v.family||"", category:""
      }));
      return state.cropRefs;
    }
    const {data,error}=await sb.from("crop_reference")
      .select("id,common_name,plant_family,category,season,days_to_maturity_min,days_to_maturity_max,spacing_in,row_spacing_in,min_container_gal,yield_min_lb,yield_max_lb,succession_interval_days")
      .order("common_name");
    if(error){ console.warn("crop_reference",error.message); return []; }
    state.cropRefs=data||[];
    return state.cropRefs;
  }

  function cropRefByName(name){
    return (state.cropRefs||[]).find(c=>c.common_name===name) || null;
  }

  function cropRefById(id){
    return (state.cropRefs||[]).find(c=>c.id===id) || null;
  }

  function cropNameFromId(id){
    return cropRefById(id)?.common_name || id || "Unknown crop";
  }

  async function hydrateFromSupabase(){
    const sb = sbClient(); if(!sb || !state.user) return false;
    await loadCropReferences();
    const [beds,harvests,animals,losses,trees,sap,stored,goals,plantings,bedHistory,health,care,breeding,offspring,syrupBatches,tasks,subs] = await Promise.all([
      dbSelect("beds"),dbSelect("harvests"),dbSelect("animal_groups"),dbSelect("animal_losses"),
      dbSelect("trees"),dbSelect("sap_collections"),dbSelect("stored_food"),dbSelect("food_goals"),
      dbSelect("plantings"),dbSelect("bed_history"),dbSelect("animal_health_records"),dbSelect("preventive_care"),
      dbSelect("breeding_records"),dbSelect("offspring_events"),dbSelect("syrup_batches"),dbSelect("tasks"),
      dbSelect("subscriptions")
    ]);
    if([beds,harvests,animals,losses,trees,sap,stored,goals,plantings,bedHistory,health,care,breeding,offspring,syrupBatches,tasks,subs].some(v=>v===null)) return false;

    state.data.garden.beds = beds.map(b=>({id:b.id,name:b.name,type:b.type,length:+(b.length_ft||0),width:+(b.width_ft||0)}));
    state.data.harvests = harvests.map(h=>({id:h.id,crop:h.crop_name,amount:+h.amount_lb,date:h.harvested_on}));
    state.data.animals = animals.map(a=>({id:a.id,name:a.name,species:a.species,purpose:a.purpose,starting:a.starting_count,current:a.current_count,status:a.status}));
    state.data.losses = losses.map(l=>({id:l.id,groupId:l.animal_group_id,count:l.count_lost,category:l.category,date:l.loss_date,impact:l.food_production_impact||"",cause:l.suspected_cause||""}));
    state.data.trees = trees.map(t=>({id:t.id,name:t.name,species:t.species,dbh:+(t.dbh_in||0),taps:t.current_taps||0,health:t.health_status||""}));
    state.data.sap = sap.map(s=>({id:s.id,treeId:s.tree_id,date:s.collected_on,gallons:+s.gallons,sugar:+(s.sugar_percent||0)}));
    state.data.stored = stored.map(s=>({id:s.id,food:s.food_name,method:s.method,weight:+s.total_weight_lb,location:s.storage_location||""}));
    state.data.foodGoals = goals;
    state.data.plantings = plantings.map(p=>({id:p.id,cropId:p.crop_id,crop:cropNameFromId(p.crop_id),bedId:p.bed_id,qty:p.quantity_planted,status:p.status,seasonYear:p.season_year,variety:p.variety||""}));
    state.data.bedHistory = bedHistory.map(b=>({id:b.id,bedId:b.bed_id,year:b.year,cropId:b.crop_id,crop:b.crop_name||cropNameFromId(b.crop_id),family:b.plant_family||cropRefById(b.crop_id)?.plant_family||"",harvestLb:+(b.harvest_lb||0)}));
    state.data.health = health.map(h=>({id:h.id,groupId:h.animal_group_id,type:h.record_type,date:h.record_date,reason:h.observed_issue_reason||"",outcome:h.outcome_followup||"",cost:+(h.cost||0)}));
    state.data.care = care.map(c=>({id:c.id,groupId:c.animal_group_id,type:c.care_type,procedure:c.product_procedure||"",nextDue:c.next_due_date,status:c.status||""}));
    state.data.breeding = breeding.map(b=>({id:b.id,groupId:b.animal_group_id,species:b.species,date:b.breeding_pairing_date,expected:b.expected_due_hatch_date,status:b.outcome||b.pregnancy_fertility_status||"Pending"}));
    state.data.offspring = offspring.map(o=>({id:o.id,breedingId:o.breeding_id,groupId:o.parent_group_id,date:o.birth_hatch_date,total:o.total_born_hatched,live:o.live_count,earlyLoss:o.early_losses_0_7_days||0}));
    state.data.syrupBatches = syrupBatches.map(s=>({id:s.id,date:s.batch_date,sapUsed:+(s.sap_used_gal||0),sugar:+(s.average_sap_sugar_pct||0),finished:+(s.finished_syrup_gal||0),fuelCost:+(s.fuel_cost||0)}));
    state.data.tasks = tasks.map(t=>({id:t.id,text:t.title,area:t.area,done:t.status==="Done",dueDate:t.due_date||null}));
    state.data.subscriptions = subs;
    localStorage.setItem("hh_data", JSON.stringify(state.data));
    return true;
  }

  async function ensureGarden(){
    const sb = sbClient(); if(!sb || !state.user) return null;
    let {data,error} = await sb.from("gardens").select("*").eq("user_id",state.user.id).limit(1);
    if(error) return null;
    if(data && data.length) return data[0];
    const res = await dbInsert("gardens",{name:"My Garden"});
    return res;
  }

  function loadData(){
    const raw = localStorage.getItem("hh_data");
    if(raw) return JSON.parse(raw);
    return {
      garden:{beds:[{id:"BED001",name:"Bed 1",type:"Raised Bed",length:8,width:4}], crops:["Tomato","Bush Bean","Carrot"]},
      harvests:[{crop:"Tomato",amount:12,date:"2026-08-20"},{crop:"Bush Bean",amount:6,date:"2026-08-18"}],
      animals:[{id:"LIV001",name:"Layer Flock A",species:"Chicken",purpose:"Eggs",starting:12,current:12},
               {id:"LIV002",name:"Meat Birds Fall",species:"Chicken",purpose:"Meat",starting:25,current:24}],
      losses:[{id:"LOSS001",groupId:"LIV002",count:1,category:"Predation",date:"2026-08-05",impact:"1 fewer meat bird"}],
      trees:[{id:"TREE001",name:"Sugar Maple 1",species:"Sugar Maple",dbh:18,taps:1},
             {id:"TREE002",name:"Sugar Maple 2",species:"Sugar Maple",dbh:23,taps:2}],
      sap:[{date:"2027-02-24",gallons:14.5}],
      stored:[{food:"Tomato",method:"Freeze",weight:12},{food:"Bush Bean",method:"Freeze",weight:10}],
      plantings:[{id:"PLANT001",crop:"Tomato",bedId:"BED001",qty:6,status:"Growing",seasonYear:2026}],
      bedHistory:[{id:"BH001",bedId:"BED001",year:2026,crop:"Tomato",family:"Solanaceae",harvestLb:72}],
      health:[{id:"HLT001",groupId:"LIV001",type:"Routine Check",date:"2026-08-21",reason:"Weekly flock check",outcome:"Normal"}],
      care:[{id:"CARE001",groupId:"LIV001",type:"Routine Check",procedure:"General health check",nextDue:"2026-08-28",status:"Scheduled"}],
      breeding:[{id:"BRD001",groupId:"LIV002",species:"Chicken",date:"2026-08-05",expected:"2026-08-26",status:"Pending"}],
      offspring:[],
      syrupBatches:[{id:"BATCH001",date:"2027-02-27",sapUsed:30.5,sugar:2,finished:0.69,fuelCost:12}],
      subscriptions:[],
      tasks:[
        {id:"T1",text:"Check tomatoes for harvest",area:"Garden",done:false},
        {id:"T2",text:"Layer flock health check",area:"Animals",done:false},
        {id:"T3",text:"Review pantry use-first items",area:"Homestead",done:false}
      ]
    };
  }

  function save(){ localStorage.setItem("hh_data", JSON.stringify(state.data)); render(); }

  function hasPlus(){
    const trial=JSON.parse(localStorage.getItem("hh_trial")||"null");
    if(trial && trial.ends>Date.now()) return true;
    const s=(state.data.subscriptions||[])[0];
    return !!(s && ["active","trialing"].includes((s.status||"").toLowerCase()));
  }

  function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0)}
  function pct(n){return Math.round((n||0)*100)+"%"}
  function uid(prefix){return prefix+Math.random().toString(36).slice(2,8).toUpperCase()}

  function getSupabase(){
    const cfg = window.HH_CONFIG || {};
    if(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase){
      return window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
    }
    return null;
  }

  async function initAuth(){
    const sb = getSupabase();
    if(sb){
      const {data:{session}} = await sb.auth.getSession();
      if(session){state.user=session.user; await hydrateFromSupabase(); render();}
    } else {
      const demo = localStorage.getItem("hh_demo_user");
      if(demo) state.user = JSON.parse(demo);
      await loadCropReferences();
    }
    render();
  }

  async function signIn(email,password,mode){
    const sb = getSupabase();
    if(sb){
      const fn = mode==="signup" ? sb.auth.signUp.bind(sb.auth) : sb.auth.signInWithPassword.bind(sb.auth);
      const {data,error} = await fn({email,password});
      if(error) return alert(error.message);
      state.user = data.user || data.session?.user;
      if(state.user) await hydrateFromSupabase();
    } else {
      state.user = {id:"demo-user",email};
      localStorage.setItem("hh_demo_user",JSON.stringify(state.user));
    }
    render();
  }

  async function signOut(){
    const sb = getSupabase(); if(sb) await sb.auth.signOut();
    localStorage.removeItem("hh_demo_user"); state.user=null; render();
  }

  function appShell(body){
    const tabs = [
      ["home","🏠","Home"],["garden","🌱","Garden"],["animals","🐓","Animals"],
      ["homestead","🍁","Homestead"],["insights","📊","Insights"],["profile","👤","My"]
    ];
    return `<div class="shell">
      <div class="topbar"><div class="brand"><div class="brand-mark">🌿</div><div><h1>Homestead Helper</h1><small>Grow more. Waste less. Live well.</small></div></div></div>
      <main class="content">${body}</main>
      <nav class="bottom-nav">${tabs.map(([id,icon,label])=>`<button class="nav-btn ${state.tab===id?"active":""}" onclick="HH.go('${id}')"><span>${icon}</span>${label}</button>`).join("")}</nav>
      ${state.modal ? renderModal() : ""}
    </div>`;
  }

  function authView(){
    return `<div class="auth-wrap">
      <div class="auth-logo">🌿</div><h1>Homestead Helper</h1>
      <p>Your garden, animals, pantry and homestead — in one place.</p>
      <div class="card">
        <div class="field"><label>Email</label><input id="authEmail" type="email" placeholder="you@example.com"></div>
        <div class="field"><label>Password</label><input id="authPass" type="password" placeholder="8+ characters"></div>
        <div class="row"><button class="btn" onclick="HH.auth('signin')">Sign In</button><button class="btn secondary" onclick="HH.auth('signup')">Create Account</button></div>
        <hr><div class="small">${getSupabase() ? "Supabase mode enabled." : "Demo mode: data is stored only on this device until Supabase is configured."}</div>
      </div>
    </div>`;
  }

  function homeView(){
    const open = state.data.tasks.filter(t=>!t.done);
    const h = state.data.harvests.reduce((a,b)=>a+b.amount,0);
    const sap = state.data.sap.reduce((a,b)=>a+b.gallons,0);
    return `<div class="card hero">
      <div class="kicker">Today on your homestead</div>
      <h2>Good afternoon 🌱</h2><p>${open.length} things need your attention.</p>
      <button class="btn" onclick="HH.modal('tasks')">View Today's Plan</button>
    </div>
    <div class="stat-grid">
      <div class="stat"><span class="small">Harvest recorded</span><strong>${h.toFixed(1)} lb</strong></div>
      <div class="stat"><span class="small">Sap this season</span><strong>${sap.toFixed(1)} gal</strong></div>
      <div class="stat"><span class="small">Animals tracked</span><strong>${state.data.animals.reduce((a,b)=>a+b.current,0)}</strong></div>
      <div class="stat"><span class="small">Stored food</span><strong>${state.data.stored.reduce((a,b)=>a+b.weight,0).toFixed(1)} lb</strong></div>
    </div>
    <h3 class="section-title">Today</h3>
    <div class="list">${open.map(t=>`<div class="list-item"><div><strong>${t.text}</strong><div class="meta">${t.area}</div></div><button class="btn ghost" onclick="HH.doneTask('${t.id}')">Done</button></div>`).join("") || '<div class="empty">Everything is caught up.</div>'}</div>
    <div class="card"><div class="row between"><div><div class="kicker">Year-Round Food Goal</div><h3>Tomatoes</h3></div><span class="pill">35% stored</span></div>
      <div class="progress"><div style="width:35%"></div></div><p class="small">Use the planner to calculate how much to grow and preserve for your household.</p>
      <button class="btn secondary" onclick="HH.go('garden');setTimeout(()=>HH.modal('harvestPlanner'),0)">Open Planner</button>
    </div>`;
  }

  function gardenView(){
    const total = state.data.harvests.reduce((a,b)=>a+b.amount,0);
    return `<div class="row between"><h2>🌱 My Garden</h2><button class="btn" onclick="HH.modal('addBed')">+ Bed</button></div>
      <div class="card"><div class="kicker">Beds & containers</div>
        <div class="list">${state.data.garden.beds.map(b=>`<div class="list-item"><div><strong>${b.name}</strong><div class="meta">${b.type} · ${b.length}×${b.width} ft</div></div><span class="pill">${b.length*b.width} sq ft</span></div>`).join("")}</div>
      </div>
      <div class="card"><div class="row between"><div><div class="kicker">My crops</div><h3>${state.data.garden.crops.length} active crops</h3></div><button class="btn secondary" onclick="HH.modal('addCrop')">+ Crop</button></div>
        <div class="row wrap">${state.data.garden.crops.map(c=>`<span class="pill">${c}</span>`).join("")}</div>
      </div>
      <div class="card hero"><div class="kicker">Flagship feature</div><h3>Year-Round Harvest Planner</h3><p>Calculate how many plants you may need, how much space they take, and how much food to preserve.</p>
        <button class="btn" onclick="HH.modal('harvestPlanner')">Open Planner</button></div>
      <div class="card"><div class="row between"><div><div class="kicker">Harvest</div><h3>${total.toFixed(1)} lb recorded</h3></div><button class="btn secondary" onclick="HH.modal('recordHarvest')">Record Harvest</button></div></div>

      <div class="card"><div class="row between"><div><div class="kicker">Live plantings</div><h3>${(state.data.plantings||[]).length} planting records</h3></div><button class="btn secondary" onclick="HH.modal('addPlanting')">+ Planting</button></div>
        <div class="list">${(state.data.plantings||[]).map(p=>`<div class="list-item"><div><strong>${p.crop}</strong><div class="meta">${p.qty} plants · ${p.status} · ${p.seasonYear||""}</div></div><div class="row"><button class="btn ghost" onclick="HH.editPlanting('${p.id}')">Edit</button><button class="btn ghost" onclick="HH.deleteRecord('plantings','${p.id}')">Delete</button></div></div>`).join("")||'<div class="empty">No planting records yet.</div>'}</div>
      </div>
      <div class="card"><div class="row between"><div><div class="kicker">Bed history</div><h3>Remember what grew where</h3></div><button class="btn secondary" onclick="HH.modal('addBedHistory')">Add History</button></div>
        <p class="small">These records power crop-rotation warnings and year-over-year bed performance.</p></div>
`;
  }

  function animalsView(){
    return `<div class="row between"><h2>🐓 Animals</h2><button class="btn" onclick="HH.modal('addAnimal')">+ Group</button></div>
      <div class="list">${state.data.animals.map(a=>`<div class="list-item"><div><strong>${a.name}</strong><div class="meta">${a.species} · ${a.purpose}</div></div><div><strong>${a.current}</strong><div class="small">current</div></div></div>`).join("")}</div>
      <div class="card dangerbox"><div class="kicker">Animal loss tracking</div><h3>Record losses immediately</h3><p>Loss events reduce the current count and are tracked separately from animals processed for food.</p><button class="btn danger" onclick="HH.modal('recordLoss')">Record Animal Loss</button></div>
      <div class="card"><div class="kicker">Loss summary</div><div class="stat-grid"><div class="stat"><span class="small">Losses</span><strong>${state.data.losses.reduce((a,b)=>a+b.count,0)}</strong></div><div class="stat"><span class="small">Loss rate</span><strong>${pct(state.data.losses.reduce((a,b)=>a+b.count,0)/Math.max(1,state.data.animals.reduce((a,b)=>a+b.starting,0)))}</strong></div></div></div>
      <div class="card"><div class="row between"><div><div class="kicker">Health & care</div><h3>${(state.data.health||[]).length} health records · ${(state.data.care||[]).length} care reminders</h3></div><button class="btn secondary" onclick="HH.modal('healthCare')">Open</button></div></div>
      <div class="card"><div class="row between"><div><div class="kicker">Breeding & offspring</div><h3>${(state.data.breeding||[]).length} breeding records</h3></div><button class="btn secondary" onclick="HH.modal('breeding')">Open</button></div></div>`;
  }

  function homesteadView(){
    const sap = state.data.sap.reduce((a,b)=>a+b.gallons,0);
    const stored = state.data.stored.reduce((a,b)=>a+b.weight,0);
    return `<h2>🍁 Homestead</h2>
      <div class="card"><div class="row between"><div><div class="kicker">Tree tapping</div><h3>${state.data.trees.length} trees tracked</h3></div><button class="btn secondary" onclick="HH.modal('recordSap')">Record Sap</button></div>
        <div class="stat-grid"><div class="stat"><span class="small">Active taps</span><strong>${state.data.trees.reduce((a,b)=>a+b.taps,0)}</strong></div><div class="stat"><span class="small">Season sap</span><strong>${sap.toFixed(1)} gal</strong></div></div></div>
      <div class="card"><div class="row between"><div><div class="kicker">Pantry & freezer</div><h3>${stored.toFixed(1)} lb stored</h3></div><button class="btn secondary" onclick="HH.modal('addStored')">+ Stored Food</button></div>
        <div class="list">${state.data.stored.map(s=>`<div class="list-item"><div><strong>${s.food}</strong><div class="meta">${s.method}</div></div><strong>${s.weight} lb</strong></div>`).join("")}</div></div>
      <div class="card"><div class="row between"><div><div class="kicker">Syrup batches</div><h3>${(state.data.syrupBatches||[]).length} batches</h3></div><button class="btn secondary" onclick="HH.modal('syrupBatch')">Add Batch</button></div>
        <div class="list">${(state.data.syrupBatches||[]).map(b=>`<div class="list-item"><div><strong>${b.date||"Batch"}</strong><div class="meta">${b.sapUsed} gal sap · ${b.finished} gal syrup</div></div><div class="row"><span class="pill">${b.sapUsed&&b.finished?(b.sapUsed/b.finished).toFixed(1)+":1":"—"}</span><button class="btn ghost" onclick="HH.deleteRecord('syrup_batches','${b.id}')">Delete</button></div></div>`).join("")}</div></div>
      <div class="card hero"><div class="kicker">Preservation planner</div><h3>Connect harvest → storage goals</h3><p>Premium calculates the target, current inventory and remaining gap, with tested preservation guidance links.</p><button class="btn" onclick="HH.modal('premium')">See Plus Example</button></div>`;
  }

  function insightsView(){
    const harvest = state.data.harvests.reduce((a,b)=>a+b.amount,0);
    return `<h2>📊 Insights</h2>
      <div class="card hero"><div class="kicker">Premium analytics</div><h3>Whole Homestead Year-over-Year</h3><p>Compare garden harvest, animal production and losses, sap/syrup, and stored food from one season to the next.</p>
        <button class="btn" onclick="HH.modal('premium')">Unlock with Plus</button></div>
      <div class="stat-grid"><div class="stat"><span class="small">Current harvest</span><strong>${harvest.toFixed(1)} lb</strong></div><div class="stat"><span class="small">Animal losses</span><strong>${state.data.losses.reduce((a,b)=>a+b.count,0)}</strong></div></div>
      <div class="card"><h3>Example trend</h3><p><strong>Tomatoes ↑ 24%</strong></p><p class="small">Homestead Helper should treat this as a planning signal—not proof that any one change caused the increase.</p></div>`;
  }

  function profileView(){
    const trial = JSON.parse(localStorage.getItem("hh_trial")||"null");
    return `<h2>👤 My Homestead</h2>
      <div class="card"><div class="kicker">Account</div><h3>${state.user?.email || "Demo User"}</h3><p class="small">${getSupabase() ? "Supabase connected" : "Local demo mode"}</p><button class="btn ghost" onclick="HH.signOut()">Sign Out</button></div>
      <div class="card"><div class="row between"><div><div class="kicker">Homestead Helper Plus</div><h3>${hasPlus() ? "Plus active" : "Free plan"}</h3></div><span class="pill">${hasPlus() ? "PLUS" : "FREE"}</span></div>
        <p>${hasPlus() ? "Your premium entitlement is active." : "Unlock advanced planning, breeding/care reminders, preservation targets and year-over-year insights."}</p>
        <button class="btn" onclick="HH.modal('premium')">${hasPlus()?"View Plus":"See Plus"}</button></div>
      <div class="card"><h3>Location & planting dates</h3><p class="small">Use your ZIP code to find a climate location and connect NOAA freeze normals when the climate service is configured.</p><button class="btn secondary" onclick="HH.modal('locationSetup')">Set Location</button></div><div class="card"><h3>Data</h3><div class="row wrap"><button class="btn secondary" onclick="HH.exportData()">Export JSON</button><button class="btn ghost" onclick="HH.resetDemo()">Reset Demo Data</button></div></div>`;
  }

  function renderModal(){
    const m = state.modal;
    const close = `<button class="btn ghost" onclick="HH.close()">Close</button>`;
    if(m==="tasks") return modal(`<h2>Today's Plan</h2><div class="list">${state.data.tasks.map(t=>`<div class="list-item"><div>${t.done?"✅":"⬜"} <strong>${t.text}</strong><div class="meta">${t.area}</div></div>${!t.done?`<button class="btn ghost" onclick="HH.doneTask('${t.id}')">Done</button>`:""}</div>`).join("")}</div>${close}`);
    if(m==="harvestPlanner") return modal(`<h2>🌾 Year-Round Harvest Planner</h2>
      <div class="grid2"><div class="field"><label>Crop</label><select id="hpCrop">${Object.keys(CROP_DATA).map(c=>`<option>${c}</option>`).join("")}</select></div><div class="field"><label>Household size</label><input id="hpPeople" type="number" value="4" min="1"></div></div>
      <div class="grid2"><div class="field"><label>Meals per week</label><input id="hpMeals" type="number" value="2" min="0"></div><div class="field"><label>Serving lb/person</label><input id="hpServing" type="number" step=".05" value=".30"></div></div>
      <div class="grid2"><div class="field"><label>Weeks to cover</label><input id="hpWeeks" type="number" value="36"></div><div class="field"><label>Safety buffer %</label><input id="hpBuffer" type="number" value="15"></div></div>
      <button class="btn" onclick="HH.calcHarvestPlan()">Calculate</button><div id="hpResult"></div><hr>${close}`);
    if(m==="recordLoss") return modal(`<h2>⚠️ Record Animal Loss</h2>
      <div class="field"><label>Animal/group</label><select id="lossGroup">${state.data.animals.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}</select></div>
      <div class="grid2"><div class="field"><label>Count lost</label><input id="lossCount" type="number" value="1" min="1"></div><div class="field"><label>Date</label><input id="lossDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div></div>
      <div class="field"><label>Category</label><select id="lossCat">${["Predation","Illness","Injury","Weather / Exposure","Birth / Hatch Loss","Escape / Missing","Accident","Unknown","Other"].map(x=>`<option>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Food-production impact / notes</label><input id="lossImpact" placeholder="Example: 1 fewer meat bird"></div>
      <div class="notice">Keep suspected causes separate from confirmed causes. The app is for recordkeeping, not diagnosis.</div><br>
      <button class="btn danger" onclick="HH.saveLoss()">Save Loss</button> ${close}`);
    if(m==="recordHarvest") return modal(`<h2>🥕 Record Harvest</h2>
      <div class="field"><label>Crop</label><select id="harvestCrop">${state.data.garden.crops.map(c=>`<option>${c}</option>`).join("")}</select></div>
      <div class="grid2"><div class="field"><label>Amount (lb)</label><input id="harvestAmount" type="number" step=".1" value="1"></div><div class="field"><label>Date</label><input id="harvestDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div></div>
      <button class="btn" onclick="HH.saveHarvest()">Save Harvest</button> ${close}`);
    if(m==="recordSap") return modal(`<h2>🍁 Record Sap</h2><div class="field"><label>Gallons collected</label><input id="sapGal" type="number" step=".1" value="5"></div><div class="field"><label>Date</label><input id="sapDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><button class="btn" onclick="HH.saveSap()">Save Collection</button> ${close}`);
    if(m==="addStored") return modal(`<h2>❄️ Add Stored Food</h2><div class="field"><label>Food</label><input id="stFood" placeholder="Tomato"></div><div class="grid2"><div class="field"><label>Method</label><select id="stMethod"><option>Freeze</option><option>Can / Jar</option><option>Dehydrate</option><option>Ferment / Pickle</option><option>Cool Storage</option></select></div><div class="field"><label>Total weight (lb)</label><input id="stWeight" type="number" step=".1" value="1"></div></div><button class="btn" onclick="HH.saveStored()">Save</button> ${close}`);
    if(m==="addCrop") return modal(`<h2>+ Add Crop</h2><div class="field"><label>Crop</label><select id="newCrop">${Object.keys(CROP_DATA).filter(c=>!state.data.garden.crops.includes(c)).map(c=>`<option>${c}</option>`).join("")}</select></div><button class="btn" onclick="HH.addCrop()">Add Crop</button> ${close}`);
    if(m==="addBed") return modal(`<h2>+ Add Bed</h2><div class="field"><label>Name</label><input id="bedName" value="Bed ${state.data.garden.beds.length+1}"></div><div class="grid2"><div class="field"><label>Length ft</label><input id="bedL" type="number" value="8"></div><div class="field"><label>Width ft</label><input id="bedW" type="number" value="4"></div></div><button class="btn" onclick="HH.addBed()">Add Bed</button> ${close}`);
    if(m==="addAnimal") return modal(`<h2>+ Add Animal Group</h2><div class="field"><label>Name</label><input id="anName" placeholder="Rabbit Grow-out A"></div><div class="grid2"><div class="field"><label>Species</label><select id="anSpecies">${["Chicken","Duck","Goose","Turkey","Quail","Rabbit","Goat","Sheep","Pig","Cattle"].map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>Purpose</label><select id="anPurpose"><option>Eggs</option><option>Meat</option><option>Milk</option><option>Breeding</option><option>Multi-purpose</option></select></div></div><div class="field"><label>Starting count</label><input id="anCount" type="number" value="1"></div><button class="btn" onclick="HH.addAnimal()">Add Group</button> ${close}`);
    if(m==="locationSetup") return modal(`<h2>📍 Set Garden Location</h2>
      <div class="field"><label>US ZIP code</label><input id="locZip" inputmode="numeric" maxlength="5" placeholder="12477"></div>
      <div class="grid2"><div class="field"><label>Frost-risk preference</label><select id="locRisk"><option>Typical (50%)</option><option>Conservative (10%)</option></select></div><div class="field"><label>Microclimate adjustment (days)</label><input id="locMicro" type="number" value="0"></div></div>
      <button class="btn" onclick="HH.lookupLocation()">Find Climate Data</button>
      <div id="locResult"></div><hr>${close}`);

    if(m==="addPlanting") return modal(`<h2>🌱 Add Planting</h2>
      <div class="field"><label>Crop</label><select id="plCrop">${state.data.garden.crops.map(c=>`<option>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Bed</label><select id="plBed">${state.data.garden.beds.map(b=>`<option value="${b.id}">${b.name}</option>`).join("")}</select></div>
      <div class="grid2"><div class="field"><label>Quantity</label><input id="plQty" type="number" value="6"></div><div class="field"><label>Season year</label><input id="plYear" type="number" value="${new Date().getFullYear()}"></div></div>
      <div class="field"><label>Status</label><select id="plStatus"><option>Planned</option><option>Growing</option><option>Harvesting</option><option>Finished</option></select></div>
      <button class="btn" onclick="HH.addPlanting()">Save Planting</button> ${close}`);

    if(m==="addBedHistory") return modal(`<h2>🔄 Add Bed History</h2>
      <div class="field"><label>Bed</label><select id="bhBed">${state.data.garden.beds.map(b=>`<option value="${b.id}">${b.name}</option>`).join("")}</select></div>
      <div class="field"><label>Crop</label><select id="bhCrop">${state.data.garden.crops.map(c=>`<option>${c}</option>`).join("")}</select></div>
      <div class="grid2"><div class="field"><label>Year</label><input id="bhYear" type="number" value="${new Date().getFullYear()}"></div><div class="field"><label>Harvest lb</label><input id="bhHarvest" type="number" step=".1" value="0"></div></div>
      <button class="btn" onclick="HH.addBedHistory()">Save History</button> ${close}`);

    if(m==="healthCare"){
      const care=(state.data.care||[]);
      const health=(state.data.health||[]);
      return modal(`<h2>❤️ Animal Health & Care</h2>
        <div class="row wrap"><button class="btn" onclick="HH.modal('addHealth')">+ Health Record</button><button class="btn secondary" onclick="HH.modal('addCare')">+ Care Reminder</button></div>
        <h3 class="section-title">Due care</h3><div class="list">${care.map(c=>`<div class="list-item"><div><strong>${c.procedure||c.type}</strong><div class="meta">${c.type} · due ${c.nextDue||"not set"}</div></div><div class="row"><span class="pill ${c.status==="Overdue"?"danger":""}">${c.status||"Scheduled"}</span><button class="btn ghost" onclick="HH.deleteRecord('preventive_care','${c.id}')">Delete</button></div></div>`).join("")||'<div class="empty">No care reminders.</div>'}</div>
        <h3 class="section-title">Health records</h3><div class="list">${health.map(h=>`<div class="list-item"><div><strong>${h.type}</strong><div class="meta">${h.date} · ${h.reason||""}</div></div><div class="row"><span class="pill">${money(h.cost||0)}</span><button class="btn ghost" onclick="HH.deleteRecord('animal_health_records','${h.id}')">Delete</button></div></div>`).join("")||'<div class="empty">No health records.</div>'}</div>${close}`);
    }

    if(m==="addHealth") return modal(`<h2>+ Health Record</h2>
      <div class="field"><label>Animal/group</label><select id="hlGroup">${state.data.animals.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}</select></div>
      <div class="field"><label>Record type</label><select id="hlType"><option>Observation</option><option>Routine Check</option><option>Veterinary Visit</option><option>Treatment</option><option>Vaccination</option><option>Injury Care</option><option>Quarantine</option></select></div>
      <div class="field"><label>Reason / observation</label><input id="hlReason"></div>
      <div class="grid2"><div class="field"><label>Date</label><input id="hlDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Cost</label><input id="hlCost" type="number" step=".01" value="0"></div></div>
      <div class="notice">Record veterinarian-provided treatment details. Do not use generic app logic to diagnose or calculate medication doses.</div><br>
      <button class="btn" onclick="HH.addHealth()">Save</button> ${close}`);

    if(m==="addCare") return modal(`<h2>+ Routine Care Reminder</h2>
      <div class="field"><label>Animal/group</label><select id="careGroup">${state.data.animals.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}</select></div>
      <div class="field"><label>Care type</label><select id="careType"><option>Routine Check</option><option>Hoof Care</option><option>Veterinary Exam</option><option>Parasite Monitoring</option><option>Testing</option><option>Other</option></select></div>
      <div class="field"><label>Procedure / reminder</label><input id="careProcedure" placeholder="General health check"></div>
      <div class="field"><label>Next due date</label><input id="careDue" type="date"></div>
      <button class="btn" onclick="HH.addCare()">Save Reminder</button> ${close}`);

    if(m==="breeding"){
      const records=(state.data.breeding||[]);
      return modal(`<h2>🐣 Breeding & Offspring</h2><div class="row wrap"><button class="btn" onclick="HH.modal('addBreeding')">+ Breeding Record</button><button class="btn secondary" onclick="HH.modal('recordOffspring')">Record Birth/Hatch</button></div>
        <div class="list">${records.map(b=>`<div class="list-item"><div><strong>${b.species}</strong><div class="meta">${b.date||""} · expected ${b.expected||"not set"}</div></div><div class="row"><span class="pill">${b.status||"Pending"}</span><button class="btn ghost" onclick="HH.deleteRecord('breeding_records','${b.id}')">Delete</button></div></div>`).join("")||'<div class="empty">No breeding records.</div>'}</div>${close}`);
    }

    if(m==="addBreeding") return modal(`<h2>+ Breeding Record</h2>
      <div class="field"><label>Animal/group</label><select id="brGroup">${state.data.animals.map(a=>`<option value="${a.id}" data-species="${a.species}">${a.name}</option>`).join("")}</select></div>
      <div class="grid2"><div class="field"><label>Breeding / pairing date</label><input id="brDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Expected due/hatch</label><input id="brExpected" type="date"></div></div>
      <div class="field"><label>Status</label><select id="brStatus"><option>Pending</option><option>Confirmed</option><option>Completed</option></select></div>
      <div class="notice">Due/hatch dates are estimates and should remain editable.</div><br>
      <button class="btn" onclick="HH.addBreeding()">Save</button> ${close}`);

    if(m==="recordOffspring") return modal(`<h2>🐥 Record Birth / Hatch</h2>
      <div class="field"><label>Breeding record</label><select id="offBreeding">${(state.data.breeding||[]).map(b=>`<option value="${b.id}">${b.species} · ${b.date||""}</option>`).join("")}</select></div>
      <div class="grid2"><div class="field"><label>Total born / hatched</label><input id="offTotal" type="number" value="1"></div><div class="field"><label>Live</label><input id="offLive" type="number" value="1"></div></div>
      <div class="grid2"><div class="field"><label>Early losses (0–7 days)</label><input id="offLoss" type="number" value="0"></div><div class="field"><label>Date</label><input id="offDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div></div>
      <button class="btn" onclick="HH.addOffspring()">Save Outcome</button> ${close}`);

    if(m==="syrupBatch") return modal(`<h2>🔥 Add Syrup Batch</h2>
      <div class="grid2"><div class="field"><label>Sap used (gal)</label><input id="sySap" type="number" step=".1" value="10"></div><div class="field"><label>Average sugar %</label><input id="sySugar" type="number" step=".1" value="2"></div></div>
      <div class="grid2"><div class="field"><label>Finished syrup (gal)</label><input id="syFinished" type="number" step=".01" value=".23"></div><div class="field"><label>Fuel cost</label><input id="syFuel" type="number" step=".01" value="0"></div></div>
      <div class="field"><label>Date</label><input id="syDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
      <button class="btn" onclick="HH.addSyrupBatch()">Save Batch</button> ${close}`);

    if(m==="editPlanting"){
      const p=(state.data.plantings||[]).find(x=>x.id===state.editingId);
      if(!p) return modal(`<h2>Planting not found</h2>${close}`);
      return modal(`<h2>✏️ Edit Planting</h2>
        <div class="field"><label>Crop</label><input value="${p.crop}" disabled></div>
        <div class="grid2"><div class="field"><label>Quantity</label><input id="epQty" type="number" value="${p.qty}"></div><div class="field"><label>Status</label><select id="epStatus">${["Planned","Growing","Harvesting","Finished"].map(s=>`<option ${s===p.status?"selected":""}>${s}</option>`).join("")}</select></div></div>
        <button class="btn" onclick="HH.savePlantingEdit()">Save Changes</button> ${close}`);
    }
    if(m==="premium") {
      const trial = JSON.parse(localStorage.getItem("hh_trial")||"null");
      return modal(`<div class="kicker">Homestead Helper Plus</div><h2>Grow smarter all year.</h2>
        <div class="card"><strong>🌾 Year-Round Harvest Planner</strong><p class="small">Example: Family of 4 → estimated bean plants, succession rounds, preservation target and space check.</p></div>
        <div class="card"><strong>🐣 Breeding Planner</strong><p class="small">Example: Rabbit kindling window Aug 29–Sep 3.</p></div>
        <div class="card"><strong>🍁 Tree Tapping Analytics</strong><p class="small">Example: 30.5 gal sap → 0.69 gal syrup; 44.2:1 actual ratio.</p></div>
        <div class="card"><strong>🫙 Preservation Planner</strong><p class="small">Example: 74.5 lb tomato target · 26.4 lb stored · 48.1 lb remaining.</p></div>
        <div class="card hero"><h3>14 days free</h3><p><strong>$4.99/month</strong> or <strong>$39.99/year</strong></p><p class="small">In production, the store purchase screen must clearly show renewal terms before confirmation.</p>
          ${hasPlus()?`<span class="pill">Plus active</span>`:`<div class="row wrap"><button class="btn" onclick="HH.startCheckout('monthly')">Start Monthly</button><button class="btn secondary" onclick="HH.startCheckout('annual')">Start Annual</button></div>`}
        </div>${close}`);
    }
    return modal(`<h2>Coming soon</h2>${close}`);
  }

  function modal(content){return `<div class="modal-backdrop" onclick="if(event.target===this)HH.close()"><div class="modal">${content}</div></div>`}

  function render(){
    const el=document.getElementById("app");
    if(!state.user) return el.innerHTML=authView();
    const view = state.tab==="home"?homeView():state.tab==="garden"?gardenView():state.tab==="animals"?animalsView():state.tab==="homestead"?homesteadView():state.tab==="insights"?insightsView():profileView();
    el.innerHTML=appShell(view);
  }

  window.HH = {
    go(tab){state.tab=tab;state.modal=null;render()},
    modal(name){state.modal=name;render()},
    close(){state.modal=null;render()},
    async auth(mode){const e=document.getElementById("authEmail").value.trim(),p=document.getElementById("authPass").value;if(!e||!p)return alert("Enter email and password.");await signIn(e,p,mode)},
    signOut,
    async doneTask(id){
      const t=state.data.tasks.find(x=>x.id===id);
      if(!t) return;
      t.done=true;
      if(String(id).includes("-") || String(id).length>20){
        await dbUpdate("tasks",id,{status:"Done"});
      }
      save();
    },
    calcHarvestPlan(){
      const crop=document.getElementById("hpCrop").value, d=CROP_DATA[crop];
      const people=+document.getElementById("hpPeople").value, meals=+document.getElementById("hpMeals").value, serving=+document.getElementById("hpServing").value, weeks=+document.getElementById("hpWeeks").value, buffer=+document.getElementById("hpBuffer").value/100;
      const target=people*meals*serving*weeks*(1+buffer);
      const conservative=Math.ceil(target/d.yieldMin), optimistic=Math.ceil(target/d.yieldMax);
      const sqft=(conservative*d.spacing*d.row)/144;
      document.getElementById("hpResult").innerHTML=`<div class="card hero"><h3>Your ${crop} plan</h3><p><strong>${target.toFixed(1)} lb</strong> target including buffer</p><div class="stat-grid"><div class="stat"><span class="small">Suggested range</span><strong>${optimistic}–${conservative}</strong><span class="small">plants</span></div><div class="stat"><span class="small">Conservative space</span><strong>${sqft.toFixed(0)}</strong><span class="small">sq ft</span></div></div><p class="small">Planning estimate only. Variety, weather, soil, pests and your own harvest history can change actual yield.</p></div>`;
    },
    async saveLoss(){
      const id=document.getElementById("lossGroup").value, count=+document.getElementById("lossCount").value;
      const a=state.data.animals.find(x=>x.id===id); if(!a||count<1)return;
      const row={animal_group_id:id,loss_date:document.getElementById("lossDate").value,count_lost:count,category:document.getElementById("lossCat").value,food_production_impact:document.getElementById("lossImpact").value};
      const saved=await dbInsert("animal_losses",row);
      a.current=Math.max(0,a.current-count);
      if(saved){await dbUpdate("animal_groups",id,{current_count:a.current});}
      state.data.losses.push(saved?{id:saved.id,groupId:id,count:saved.count_lost,category:saved.category,date:saved.loss_date,impact:saved.food_production_impact||""}:{id:uid("LOSS"),groupId:id,count,category:row.category,date:row.loss_date,impact:row.food_production_impact});
      state.modal=null;save();
    },
    async saveHarvest(){
      const row={crop_name:document.getElementById("harvestCrop").value,amount_lb:+document.getElementById("harvestAmount").value,harvested_on:document.getElementById("harvestDate").value};
      const saved=await dbInsert("harvests",row);
      state.data.harvests.push(saved?{id:saved.id,crop:saved.crop_name,amount:+saved.amount_lb,date:saved.harvested_on}:{crop:row.crop_name,amount:row.amount_lb,date:row.harvested_on});
      state.modal=null;save();
    },
    async saveSap(){
      const row={collected_on:document.getElementById("sapDate").value,gallons:+document.getElementById("sapGal").value};
      const saved=await dbInsert("sap_collections",row);
      state.data.sap.push(saved?{id:saved.id,date:saved.collected_on,gallons:+saved.gallons}:{date:row.collected_on,gallons:row.gallons});
      state.modal=null;save();
    },
    async saveStored(){
      const row={food_name:document.getElementById("stFood").value||"Stored food",method:document.getElementById("stMethod").value,total_weight_lb:+document.getElementById("stWeight").value};
      const saved=await dbInsert("stored_food",row);
      state.data.stored.push(saved?{id:saved.id,food:saved.food_name,method:saved.method,weight:+saved.total_weight_lb}:{food:row.food_name,method:row.method,weight:row.total_weight_lb});
      state.modal=null;save();
    },
    addCrop(){const c=document.getElementById("newCrop").value;if(c)state.data.garden.crops.push(c);state.modal=null;save()},
    async addBed(){
      const garden=await ensureGarden();
      const row={garden_id:garden?.id||null,name:document.getElementById("bedName").value,type:"Raised Bed",length_ft:+document.getElementById("bedL").value,width_ft:+document.getElementById("bedW").value};
      const saved=await dbInsert("beds",row);
      state.data.garden.beds.push(saved?{id:saved.id,name:saved.name,type:saved.type,length:+saved.length_ft,width:+saved.width_ft}:{id:uid("BED"),name:row.name,type:row.type,length:row.length_ft,width:row.width_ft});
      state.modal=null;save();
    },
    async addAnimal(){
      const count=+document.getElementById("anCount").value;
      const row={name:document.getElementById("anName").value||"New Group",species:document.getElementById("anSpecies").value,purpose:document.getElementById("anPurpose").value,starting_count:count,current_count:count,status:"Active"};
      const saved=await dbInsert("animal_groups",row);
      state.data.animals.push(saved?{id:saved.id,name:saved.name,species:saved.species,purpose:saved.purpose,starting:saved.starting_count,current:saved.current_count,status:saved.status}:{id:uid("LIV"),name:row.name,species:row.species,purpose:row.purpose,starting:count,current:count});
      state.modal=null;save();
    },
    async lookupLocation(){
      const zip=(document.getElementById("locZip").value||"").trim();
      const risk=document.getElementById("locRisk").value;
      const micro=+document.getElementById("locMicro").value||0;
      const box=document.getElementById("locResult");
      box.innerHTML='<div class="notice">Looking up climate data…</div>';
      try{
        const result=await window.HH_CLIMATE.lookup(zip);
        await window.HH_CLIMATE.saveToSupabase(result,risk,micro);
        localStorage.setItem("hh_location",JSON.stringify({...result,riskPreference:risk,microclimateDays:micro}));
        const f=result.freezeNormals||{};
        box.innerHTML=`<div class="card hero"><h3>${result.city||""}, ${result.state||""}</h3>
          <p><strong>ZIP:</strong> ${result.zip}</p>
          <p><strong>USDA zone:</strong> ${result.usdaZone||"Needs confirmation"}</p>
          <p><strong>NOAA station:</strong> ${result.noaaStation?`${result.noaaStation.name} (${result.noaaStation.distanceKm} km)`:"Needs station lookup"}</p>
          <p><strong>Spring 32°F freeze:</strong> ${risk==="Conservative (10%)"?(f.spring10||"Needs confirmation"):(f.spring50||"Needs confirmation")}</p>
          <p><strong>Fall 32°F freeze:</strong> ${risk==="Conservative (10%)"?(f.fall10||"Needs confirmation"):(f.fall50||"Needs confirmation")}</p>
          ${result.needsManualFreezeDates?'<div class="notice">NOAA station was found, but machine-readable freeze normals were not returned. Do not guess: confirm the dates manually or improve the server parser before production.</div>':''}
          ${result.needsManualZone?'<div class="notice">Automatic USDA zone lookup is not configured. Confirm the zone with the USDA 2023 map before saving it as authoritative.</div>':''}
        </div>`;
      }catch(e){box.innerHTML=`<div class="dangerbox">${e.message}</div>`}
    },


    editPlanting(id){
      state.editingId=id;
      state.modal="editPlanting";
      render();
    },

    async savePlantingEdit(){
      const p=(state.data.plantings||[]).find(x=>x.id===state.editingId);
      if(!p) return;
      const changes={quantity_planted:+document.getElementById("epQty").value,status:document.getElementById("epStatus").value};
      if(String(p.id).includes("-") || String(p.id).length>20) await dbUpdate("plantings",p.id,changes);
      p.qty=changes.quantity_planted; p.status=changes.status;
      state.editingId=null; state.modal=null; save();
    },

    async deleteRecord(table,id){
      if(!confirm("Delete this record?")) return;
      const maps={
        plantings:"plantings",
        animal_health_records:"health",
        preventive_care:"care",
        breeding_records:"breeding",
        syrup_batches:"syrupBatches"
      };
      const arrName=maps[table];
      if(String(id).includes("-") || String(id).length>20) await dbDelete(table,id);
      if(arrName && Array.isArray(state.data[arrName])) state.data[arrName]=state.data[arrName].filter(x=>x.id!==id);
      save();
    },

    async addPlanting(){
      const crop=document.getElementById("plCrop").value;
      const ref=cropRefByName(crop);
      if(!ref) return alert("Crop reference not found. Reload crop data and try again.");
      const row={bed_id:document.getElementById("plBed").value,crop_id:ref.id,quantity_planted:+document.getElementById("plQty").value,season_year:+document.getElementById("plYear").value,status:document.getElementById("plStatus").value};
      const saved=await dbInsert("plantings",row);
      state.data.plantings=state.data.plantings||[];
      state.data.plantings.push(saved?{id:saved.id,cropId:saved.crop_id,crop,bedId:saved.bed_id,qty:saved.quantity_planted,status:saved.status,seasonYear:saved.season_year}:{id:uid("PLANT"),cropId:ref.id,crop,bedId:row.bed_id,qty:row.quantity_planted,status:row.status,seasonYear:row.season_year});
      state.modal=null;save();
    },

    async addBedHistory(){
      const crop=document.getElementById("bhCrop").value;
      const ref=cropRefByName(crop);
      if(!ref) return alert("Crop reference not found. Reload crop data and try again.");
      const family=ref.plant_family||"";
      const row={bed_id:document.getElementById("bhBed").value,year:+document.getElementById("bhYear").value,crop_id:ref.id,crop_name:crop,plant_family:family,harvest_lb:+document.getElementById("bhHarvest").value};
      const saved=await dbInsert("bed_history",row);
      state.data.bedHistory=state.data.bedHistory||[];
      state.data.bedHistory.push(saved?{id:saved.id,bedId:saved.bed_id,year:saved.year,cropId:saved.crop_id,crop:saved.crop_name,family:saved.plant_family||"",harvestLb:+(saved.harvest_lb||0)}:{id:uid("BH"),bedId:row.bed_id,year:row.year,cropId:ref.id,crop,family,harvestLb:row.harvest_lb});
      state.modal=null;save();
    },

    async addHealth(){
      const row={animal_group_id:document.getElementById("hlGroup").value,record_date:document.getElementById("hlDate").value,record_type:document.getElementById("hlType").value,observed_issue_reason:document.getElementById("hlReason").value,cost:+document.getElementById("hlCost").value};
      const saved=await dbInsert("animal_health_records",row);
      state.data.health=state.data.health||[];
      state.data.health.push(saved?{id:saved.id,groupId:saved.animal_group_id,type:saved.record_type,date:saved.record_date,reason:saved.observed_issue_reason||"",cost:+(saved.cost||0)}:{id:uid("HLT"),groupId:row.animal_group_id,type:row.record_type,date:row.record_date,reason:row.observed_issue_reason,cost:row.cost});
      state.modal="healthCare";save();
    },

    async addCare(){
      const due=document.getElementById("careDue").value;
      const status=due && new Date(due)<new Date(new Date().toISOString().slice(0,10))?"Overdue":"Scheduled";
      const row={animal_group_id:document.getElementById("careGroup").value,care_type:document.getElementById("careType").value,product_procedure:document.getElementById("careProcedure").value,next_due_date:due||null,status};
      const saved=await dbInsert("preventive_care",row);
      state.data.care=state.data.care||[];
      state.data.care.push(saved?{id:saved.id,groupId:saved.animal_group_id,type:saved.care_type,procedure:saved.product_procedure||"",nextDue:saved.next_due_date,status:saved.status}:{id:uid("CARE"),groupId:row.animal_group_id,type:row.care_type,procedure:row.product_procedure,nextDue:row.next_due_date,status});
      if(due){
        const t=await dbInsert("tasks",{area:"Animals",title:row.product_procedure||row.care_type,due_date:due,status:"Open",source_type:"preventive_care",source_id:saved?.id||null});
        state.data.tasks.push(t?{id:t.id,text:t.title,area:t.area,done:false,dueDate:t.due_date}:{id:uid("TASK"),text:row.product_procedure||row.care_type,area:"Animals",done:false,dueDate:due});
      }
      state.modal="healthCare";save();
    },

    async addBreeding(){
      const groupId=document.getElementById("brGroup").value;
      const animal=state.data.animals.find(a=>a.id===groupId);
      const row={animal_group_id:groupId,species:animal?.species||"Other",breeding_pairing_date:document.getElementById("brDate").value,expected_due_hatch_date:document.getElementById("brExpected").value||null,outcome:document.getElementById("brStatus").value};
      const saved=await dbInsert("breeding_records",row);
      state.data.breeding=state.data.breeding||[];
      state.data.breeding.push(saved?{id:saved.id,groupId:saved.animal_group_id,species:saved.species,date:saved.breeding_pairing_date,expected:saved.expected_due_hatch_date,status:saved.outcome}:{id:uid("BRD"),groupId,species:row.species,date:row.breeding_pairing_date,expected:row.expected_due_hatch_date,status:row.outcome});
      if(row.expected_due_hatch_date){
        const t=await dbInsert("tasks",{area:"Animals",title:`${row.species} due / hatch window`,due_date:row.expected_due_hatch_date,status:"Open",source_type:"breeding_record",source_id:saved?.id||null});
        state.data.tasks.push(t?{id:t.id,text:t.title,area:t.area,done:false,dueDate:t.due_date}:{id:uid("TASK"),text:`${row.species} due / hatch window`,area:"Animals",done:false,dueDate:row.expected_due_hatch_date});
      }
      state.modal="breeding";save();
    },

    async addOffspring(){
      const breedingId=document.getElementById("offBreeding").value;
      const breeding=(state.data.breeding||[]).find(b=>b.id===breedingId);
      const row={breeding_id:breedingId,parent_group_id:breeding?.groupId||null,species:breeding?.species||null,birth_hatch_date:document.getElementById("offDate").value,total_born_hatched:+document.getElementById("offTotal").value,live_count:+document.getElementById("offLive").value,early_losses_0_7_days:+document.getElementById("offLoss").value};
      const saved=await dbInsert("offspring_events",row);
      state.data.offspring=state.data.offspring||[];
      state.data.offspring.push(saved?{id:saved.id,breedingId:saved.breeding_id,groupId:saved.parent_group_id,date:saved.birth_hatch_date,total:saved.total_born_hatched,live:saved.live_count,earlyLoss:saved.early_losses_0_7_days||0}:{id:uid("OFF"),breedingId,groupId:row.parent_group_id,date:row.birth_hatch_date,total:row.total_born_hatched,live:row.live_count,earlyLoss:row.early_losses_0_7_days});
      state.modal="breeding";save();
    },

    async addSyrupBatch(){
      const row={batch_date:document.getElementById("syDate").value,sap_used_gal:+document.getElementById("sySap").value,average_sap_sugar_pct:+document.getElementById("sySugar").value,finished_syrup_gal:+document.getElementById("syFinished").value,fuel_cost:+document.getElementById("syFuel").value,actual_sap_syrup_ratio:(+document.getElementById("syFinished").value)>0?(+document.getElementById("sySap").value)/(+document.getElementById("syFinished").value):null};
      const saved=await dbInsert("syrup_batches",row);
      state.data.syrupBatches=state.data.syrupBatches||[];
      state.data.syrupBatches.push(saved?{id:saved.id,date:saved.batch_date,sapUsed:+saved.sap_used_gal,sugar:+(saved.average_sap_sugar_pct||0),finished:+(saved.finished_syrup_gal||0),fuelCost:+(saved.fuel_cost||0)}:{id:uid("BATCH"),date:row.batch_date,sapUsed:row.sap_used_gal,sugar:row.average_sap_sugar_pct,finished:row.finished_syrup_gal,fuelCost:row.fuel_cost});
      state.modal=null;save();
    },


    async startCheckout(plan){
      try{
        const data=await invokeEdge("create-checkout-session",{plan});
        if(!data?.url) throw new Error("Checkout URL was not returned.");
        window.location.href=data.url;
      }catch(e){
        alert("Billing is not configured yet: "+e.message);
      }
    },

    async refreshSubscription(){
      if(!sbClient()) return;
      const subs=await dbSelect("subscriptions");
      if(subs) state.data.subscriptions=subs;
      save();
    },

    startTrial(){const now=Date.now(), ends=now+14*24*60*60*1000;localStorage.setItem("hh_trial",JSON.stringify({starts:now,ends}));state.premium=true;render()},
    exportData(){const blob=new Blob([JSON.stringify(state.data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="homestead-helper-data.json";a.click();URL.revokeObjectURL(a.href)},
    resetDemo(){if(confirm("Reset local demo data?")){localStorage.removeItem("hh_data");state.data=loadData();render()}},
  };

  if("serviceWorker" in navigator){navigator.serviceWorker.register("service-worker.js").catch(()=>{})}
  initAuth();
})();
