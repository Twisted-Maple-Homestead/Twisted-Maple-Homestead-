(() => {
  if (!window.HH) return;

  const original = window.HH.addOffspring;

  window.HH.addOffspring = async function addOffspringFixed(){
    const breedingId = document.getElementById("offBreeding")?.value;
    const total = +(document.getElementById("offTotal")?.value || 0);
    const live = +(document.getElementById("offLive")?.value || 0);
    const earlyLoss = +(document.getElementById("offLoss")?.value || 0);
    const date = document.getElementById("offDate")?.value || "";

    if (!breedingId) return alert("Choose a breeding record first.");
    if (!date) return alert("Choose the birth or hatch date.");
    if (total < 0 || live < 0 || earlyLoss < 0) return alert("Counts cannot be negative.");
    if (live > total) return alert("Live offspring cannot be greater than the total born or hatched.");
    if (earlyLoss > live) return alert("Early losses cannot be greater than the live count.");

    const local = JSON.parse(localStorage.getItem("hh_data") || "{}");
    local.breeding = local.breeding || [];
    local.offspring = local.offspring || [];
    local.animals = local.animals || [];

    if (local.offspring.some(o => o.breedingId === breedingId)) {
      return alert("An offspring outcome has already been recorded for this breeding record.");
    }

    const breeding = local.breeding.find(b => b.id === breedingId);
    if (!breeding) {
      return original ? original.call(window.HH) : alert("Breeding record not found.");
    }

    const group = local.animals.find(a => a.id === breeding.groupId);
    const offspring = {
      id: "OFF" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      breedingId,
      groupId: breeding.groupId || null,
      date,
      total,
      live,
      earlyLoss
    };

    const cfg = window.HH_CONFIG || {};
    if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase) {
      try {
        const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        const { data: { session } } = await sb.auth.getSession();
        const user = session?.user;

        if (user) {
          const { data: existing } = await sb.from("offspring_events")
            .select("id")
            .eq("user_id", user.id)
            .eq("breeding_id", breedingId)
            .limit(1);

          if (existing?.length) {
            return alert("An offspring outcome has already been recorded for this breeding record.");
          }

          const { data: saved, error: insertError } = await sb.from("offspring_events")
            .insert({
              user_id: user.id,
              breeding_id: breedingId,
              parent_group_id: breeding.groupId || null,
              species: breeding.species || null,
              birth_hatch_date: date,
              total_born_hatched: total,
              live_count: live,
              early_losses_0_7_days: earlyLoss
            })
            .select()
            .single();
          if (insertError) throw insertError;
          offspring.id = saved?.id || offspring.id;

          const { error: breedingError } = await sb.from("breeding_records")
            .update({ outcome: "Completed" })
            .eq("id", breedingId)
            .eq("user_id", user.id);
          if (breedingError) throw breedingError;

          if (group && live > 0) {
            const nextCount = Math.max(0, +(group.current || 0) + live);
            const { error: groupError } = await sb.from("animal_groups")
              .update({ current_count: nextCount })
              .eq("id", group.id)
              .eq("user_id", user.id);
            if (groupError) throw groupError;
            group.current = nextCount;
          }
        }
      } catch (err) {
        console.error("Offspring outcome update failed", err);
        return alert("The offspring outcome could not be saved. Please try again.");
      }
    } else if (group && live > 0) {
      group.current = Math.max(0, +(group.current || 0) + live);
    }

    breeding.status = "Completed";
    local.offspring.push(offspring);
    localStorage.setItem("hh_data", JSON.stringify(local));
    location.reload();
  };
})();
