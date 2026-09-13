# Homestead Helper — Offline Behavior

Homestead Helper is a progressive web app (PWA) with a service worker cache.

## Expected behavior

- App-shell pages and core JavaScript/CSS are cached after a successful visit.
- Navigation requests use a network-first strategy so users receive the newest deployed app when online.
- If navigation fails because the device is offline, the cached app shell is used.
- Static same-origin assets use stale-while-revalidate behavior: cached content loads quickly, while the service worker refreshes it in the background when a network connection is available.
- Cross-origin requests are not added to the app cache by this service worker.

## Important limitations

- Supabase-backed writes, authentication, billing, and climate lookups still require a network connection unless a future explicit offline queue is added.
- Local demo-mode data remains available through localStorage on the device.
- Offline behavior must still be regression-tested on iPhone before public launch.

## QA pass

1. Open the app online and navigate through the main tabs.
2. Close and reopen the installed PWA once while online so the latest cache is active.
3. Enable airplane mode.
4. Reopen Homestead Helper and verify the app shell loads.
5. Verify local/demo screens can still be viewed.
6. Confirm cloud-only actions show a failure rather than silently pretending to save.
7. Disable airplane mode, reopen the app, and verify the newest deployed version is picked up.
