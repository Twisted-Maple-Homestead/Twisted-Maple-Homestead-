// Location / planting-date engine starter.
// Production path: ZIP -> lat/lon -> USDA zone + nearby NOAA freeze normals.
// This file keeps the calculation logic client-side once anchor dates are known.

window.HH_LOCATION = {
  addDays(dateString, days){
    const d = new Date(dateString + "T12:00:00");
    d.setDate(d.getDate() + Number(days || 0));
    return d.toISOString().slice(0,10);
  },

  calculateWindows({springFreeze, fallFreeze, microclimateDays=0, timingRule, maturityMin}){
    if(!springFreeze || !timingRule) return {};
    const springAdjusted = this.addDays(springFreeze, microclimateDays);
    const fallAdjusted = fallFreeze ? this.addDays(fallFreeze, microclimateDays) : null;
    const startIndoors = timingRule.indoor_start_offset_days == null ? null : this.addDays(springAdjusted, timingRule.indoor_start_offset_days);
    const directSow = timingRule.direct_sow_offset_days == null ? null : this.addDays(springAdjusted, timingRule.direct_sow_offset_days);
    const transplant = timingRule.transplant_offset_days == null ? null : this.addDays(springAdjusted, timingRule.transplant_offset_days);
    const harvestBase = transplant || directSow;
    const earliestHarvest = harvestBase && maturityMin ? this.addDays(harvestBase, maturityMin) : null;
    const fallPlanting = fallAdjusted && timingRule.fall_planting_lead_days != null ? this.addDays(fallAdjusted, -timingRule.fall_planting_lead_days) : null;
    return {springAdjusted,startIndoors,directSow,transplant,earliestHarvest,fallPlanting};
  }
};
