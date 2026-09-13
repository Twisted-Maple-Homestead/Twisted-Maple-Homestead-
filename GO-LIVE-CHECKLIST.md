# Homestead Helper — Go-Live Checklist

Last reviewed: 2026-09-13

## Infrastructure
- [ ] Production Supabase project
- [ ] Database migrations applied
- [ ] Seed applied
- [ ] RLS verified
- [ ] Edge Functions deployed
- [ ] NOAA token configured
- [ ] Stripe configuration selected
- [x] Frontend deployed to Vercel
- [ ] Custom domain connected
- [x] HTTPS active

## Product
- [ ] Full onboarding regression test passed
- [ ] ZIP/location production integration passed
- [ ] Garden core regression test passed
- [ ] Animal loss regression test passed
- [ ] Preservation/storage regression test passed
- [ ] Tree tapping regression test passed
- [x] Breeding and offspring safeguards implemented
- [x] Common form input validation implemented
- [x] Task completion persistence implemented
- [x] Planting edit and delete implemented
- [x] Account/data controls added to My tab
- [x] Local demo-data deletion implemented with double confirmation
- [ ] Secure cloud-account deletion backend deployed and tested
- [ ] Plus purchase works end to end
- [ ] Trial messaging finalized
- [ ] Empty states reviewed throughout app

## Legal/support
- [x] Privacy policy page present
- [x] Terms of Use page present
- [ ] Support email finalized
- [ ] Refund and cancellation information finalized
- [x] Data export works
- [x] Account deletion process documented
- [ ] Cloud account deletion finalized

## Quality
- [ ] Two-user isolation test passed
- [ ] Full mobile regression test passed
- [x] Multiple core screens manually tested on iPhone
- [ ] Slow-network test passed
- [ ] Offline/PWA regression test passed
- [x] PWA cache refresh handling implemented
- [ ] Error states tested across core forms
- [ ] Billing failure tested
- [ ] Climate lookup failure tested
- [ ] Cloud account deletion tested with disposable users

## Current launch blockers
- Production Supabase setup and RLS verification
- Production climate configuration
- Billing setup and end-to-end subscription testing
- Secure cloud account deletion backend and two-user deletion test
- Full mobile, offline, slow-network, and failure-state regression testing

## Decision
- [ ] Invite-only beta
- [ ] Closed beta
- [ ] Public web launch
