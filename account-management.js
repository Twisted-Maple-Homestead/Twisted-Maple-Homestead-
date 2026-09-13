(() => {
  if (!window.HH) return;

  const originalGo = window.HH.go.bind(window.HH);
  const CLOUD_KEYS = ["hh_data", "hh_trial", "hh_location", "hh_demo_user"];

  function supabaseClient(){
    const cfg = window.HH_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || !window.supabase) return null;
    return window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  function clearLocalAccountData(){
    CLOUD_KEYS.forEach(key => localStorage.removeItem(key));
  }

  async function deleteAccount(){
    const typed = prompt('This permanently deletes your Homestead Helper account and cloud data. Type DELETE to continue.');
    if (typed !== 'DELETE') return;
    if (!confirm('Final confirmation: permanently delete this account? This cannot be undone.')) return;

    const sb = supabaseClient();
    if (!sb) {
      clearLocalAccountData();
      alert('Local demo data was deleted from this device.');
      location.reload();
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData?.session) throw new Error('Please sign in again before deleting your account.');

      const { data, error } = await sb.functions.invoke('delete-account', { body: {} });
      if (error) throw error;
      if (!data?.deleted) throw new Error(data?.message || 'Account deletion did not complete.');

      clearLocalAccountData();
      try { await sb.auth.signOut(); } catch (_) {}
      alert('Your Homestead Helper account and associated cloud data were deleted.');
      location.reload();
    } catch (err) {
      console.error('Account deletion failed', err);
      alert('Account deletion could not be completed. Your account was not intentionally removed. Please try again after signing in, or contact support once support contact information is published.');
    }
  }

  function injectAccountControls(){
    const main = document.querySelector('.content');
    if (!main || document.getElementById('hh-account-danger-zone')) return;

    const section = document.createElement('section');
    section.id = 'hh-account-danger-zone';
    section.className = 'card';
    section.style.marginTop = '16px';
    section.innerHTML = `
      <h3>Account & data</h3>
      <p class="small">Download a copy of your data before deleting your account if you want to keep your records.</p>
      <div class="row wrap">
        <button class="btn secondary" type="button" id="hh-export-before-delete">Export my data</button>
        <button class="btn ghost" type="button" id="hh-delete-account">Delete account & data</button>
      </div>
      <p class="small">Deletion is permanent. Cloud deletion requires the secure delete-account function to be deployed in Supabase.</p>`;
    main.appendChild(section);

    document.getElementById('hh-export-before-delete')?.addEventListener('click', () => window.HH.exportData?.());
    document.getElementById('hh-delete-account')?.addEventListener('click', deleteAccount);
  }

  window.HH.go = function(tab){
    const result = originalGo(tab);
    if (tab === 'profile') setTimeout(injectAccountControls, 0);
    return result;
  };

  window.HH.deleteAccount = deleteAccount;
})();
