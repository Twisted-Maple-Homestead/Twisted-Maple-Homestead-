(() => {
  if (!window.HH) return;

  function value(id){ return document.getElementById(id)?.value ?? ""; }
  function number(id){ return +(value(id) || 0); }
  function requireDate(id, label){
    if (!value(id)) { alert(`Choose a ${label} date.`); return false; }
    return true;
  }
  function wrap(name, validator){
    const original = window.HH[name];
    if (typeof original !== "function") return;
    window.HH[name] = async function(...args){
      if (!validator()) return;
      return original.apply(window.HH, args);
    };
  }

  wrap("addAnimal", () => {
    if (!value("anName").trim()) return alert("Enter a name for the animal group."), false;
    if (number("anCount") < 1) return alert("Starting count must be at least 1."), false;
    return true;
  });

  wrap("saveLoss", () => {
    const groupId = value("lossGroup");
    const count = number("lossCount");
    if (!groupId) return alert("Choose an animal group."), false;
    if (count < 1) return alert("Loss count must be at least 1."), false;
    if (!requireDate("lossDate", "loss")) return false;
    const local = JSON.parse(localStorage.getItem("hh_data") || "{}");
    const group = (local.animals || []).find(a => a.id === groupId);
    if (group && count > +(group.current || 0)) return alert("Loss count cannot be greater than the current group count."), false;
    return true;
  });

  wrap("saveHarvest", () => {
    if (!value("harvestCrop").trim()) return alert("Enter the crop harvested."), false;
    if (number("harvestAmount") <= 0) return alert("Harvest amount must be greater than 0."), false;
    return requireDate("harvestDate", "harvest");
  });

  wrap("saveSap", () => {
    if (number("sapGal") <= 0) return alert("Sap amount must be greater than 0 gallons."), false;
    return requireDate("sapDate", "collection");
  });

  wrap("saveStored", () => {
    if (!value("stFood").trim()) return alert("Enter the food being stored."), false;
    if (number("stWeight") <= 0) return alert("Stored weight must be greater than 0."), false;
    return true;
  });

  wrap("addBed", () => {
    if (!value("bedName").trim()) return alert("Enter a bed name."), false;
    if (number("bedL") <= 0 || number("bedW") <= 0) return alert("Bed length and width must be greater than 0."), false;
    return true;
  });

  wrap("addPlanting", () => {
    if (!value("plCrop")) return alert("Choose a crop."), false;
    if (!value("plBed")) return alert("Choose a garden bed."), false;
    if (number("plQty") < 1) return alert("Planting quantity must be at least 1."), false;
    return true;
  });

  wrap("addHealth", () => {
    if (!value("hlGroup")) return alert("Choose an animal group."), false;
    if (!requireDate("hlDate", "health record")) return false;
    if (!value("hlType").trim()) return alert("Choose or enter a health record type."), false;
    if (number("hlCost") < 0) return alert("Cost cannot be negative."), false;
    return true;
  });

  wrap("addCare", () => {
    if (!value("careGroup")) return alert("Choose an animal group."), false;
    if (!value("careType").trim()) return alert("Choose a care type."), false;
    return true;
  });

  wrap("addBreeding", () => {
    if (!value("brGroup")) return alert("Choose an animal group."), false;
    return requireDate("brDate", "breeding or pairing");
  });

  wrap("addSyrupBatch", () => {
    if (number("sySap") <= 0) return alert("Sap used must be greater than 0 gallons."), false;
    if (number("syFinished") < 0) return alert("Finished syrup cannot be negative."), false;
    if (number("sySugar") < 0) return alert("Sugar percentage cannot be negative."), false;
    if (number("syFuel") < 0) return alert("Fuel cost cannot be negative."), false;
    return requireDate("syDate", "batch");
  });
})();
