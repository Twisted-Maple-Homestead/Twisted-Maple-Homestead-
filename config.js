window.HH_CONFIG = {
  // Leave blank to use local demo mode.
  // For Supabase, paste your project URL and anon key here.
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  CLIMATE_LOOKUP_URL: "",

  // Keep false until the delete-account Edge Function is deployed and
  // the two-user isolation/deletion checklist has passed in production.
  ACCOUNT_DELETION_ENABLED: false
};

// Load small compatibility fixes after the main app has initialized.
document.addEventListener("DOMContentLoaded", () => {
  const script = document.createElement("script");
  script.src = "offspring-fix.js";
  document.body.appendChild(script);
});
