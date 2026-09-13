# delete-account Edge Function

This function permanently deletes the currently authenticated Homestead Helper user.

## Safety requirements
- Deploy only to the intended Supabase project.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side; never put it in `config.js` or browser code.
- Keep `ACCOUNT_DELETION_ENABLED` set to `false` in the frontend until the production deletion tests pass.
- Verify all user-owned tables cascade or are otherwise cleaned up before enabling the button for cloud users.

## Test sequence
1. Create two disposable test users.
2. Add data for both users.
3. Delete User A from the Homestead Helper My tab.
4. Confirm User A can no longer sign in.
5. Confirm User A's user-owned rows are gone.
6. Confirm User B and all of User B's data are unchanged.
7. Confirm any billing/subscription record handling matches the intended cancellation policy.

Only after this test passes should production configuration enable cloud account deletion.
