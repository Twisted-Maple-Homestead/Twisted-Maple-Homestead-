# Delete-account security notes

The `delete-account` Edge Function must remain an authenticated server-side operation.

- Do not place the Supabase service-role key in browser code or public configuration.
- Keep cloud deletion disabled in the frontend until production testing passes.
- Verify the caller's access token inside the function before using the admin client.
- Test deletion with two separate disposable accounts to confirm user isolation.
- Confirm all user-owned data is removed through verified cascade rules or explicit cleanup.
- Confirm billing/subscription cleanup behavior before enabling deletion for paid users.
