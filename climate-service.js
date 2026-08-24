window.HH_CLIMATE = {
  async lookup(zip){
    const cfg=window.HH_CONFIG||{};
    if(cfg.CLIMATE_LOOKUP_URL){
      const headers={"content-type":"application/json"};
      if(cfg.SUPABASE_ANON_KEY) headers.apikey=cfg.SUPABASE_ANON_KEY;
      const r=await fetch(cfg.CLIMATE_LOOKUP_URL,{method:"POST",headers,body:JSON.stringify({zip})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Climate lookup failed");
      return d;
    }

    // Development fallback: ZIP centroid only.
    const z=await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
    if(!z.ok) throw new Error("ZIP code not found");
    const d=await z.json(), p=d.places?.[0];
    return {
      zip,
      city:p?.["place name"]||"",
      state:p?.["state abbreviation"]||"",
      latitude:Number(p?.latitude),
      longitude:Number(p?.longitude),
      usdaZone:null,
      noaaStation:null,
      freezeNormals:null,
      needsManualFreezeDates:true,
      needsManualZone:true
    };
  },

  async saveToSupabase(result, riskPreference="Typical (50%)", microclimateDays=0){
    if(!window.supabase || !window.HH_CONFIG?.SUPABASE_URL || !window.HH_CONFIG?.SUPABASE_ANON_KEY) return false;
    const sb=window.supabase.createClient(window.HH_CONFIG.SUPABASE_URL,window.HH_CONFIG.SUPABASE_ANON_KEY);
    const {data:{user}}=await sb.auth.getUser();
    if(!user) return false;
    const f=result.freezeNormals||{};
    const payload={
      user_id:user.id,
      zip_code:result.zip,
      latitude:result.latitude,
      longitude:result.longitude,
      usda_zone:result.usdaZone,
      noaa_station_id:result.noaaStation?.id||null,
      spring_freeze_50:f.spring50||null,
      spring_freeze_10:f.spring10||null,
      fall_freeze_50:f.fall50||null,
      fall_freeze_10:f.fall10||null,
      microclimate_adjustment_days:Number(microclimateDays||0),
      risk_preference:riskPreference
    };
    const {error}=await sb.from("user_location_settings").upsert(payload,{onConflict:"user_id"});
    if(error){console.warn(error.message);return false}
    return true;
  }
};
