# Homestead Helper — Beta Test Checklist

## Account & security

- [ ] Sign up
- [ ] Sign in
- [ ] Sign out
- [ ] Refresh while signed in
- [ ] User A cannot access User B data
- [ ] User B cannot access User A data

## Location

- [ ] Valid ZIP resolves
- [ ] Invalid ZIP shows a clear error
- [ ] NOAA station is returned when configured
- [ ] Missing freeze normals do not produce invented dates
- [ ] Manual-confirmation warning appears when needed

## Garden

- [ ] Add bed
- [ ] Add crop
- [ ] Add planting with exact crop reference ID
- [ ] Edit planting
- [ ] Delete planting
- [ ] Add bed history
- [ ] Record harvest
- [ ] Harvest persists after refresh
- [ ] Year-Round Harvest Planner calculates without errors

## Animals

- [ ] Add animal group
- [ ] Record loss
- [ ] Current count decreases
- [ ] Add health record
- [ ] Delete health record
- [ ] Add preventive-care reminder
- [ ] Care reminder creates Home task
- [ ] Complete task
- [ ] Task stays complete after refresh
- [ ] Add breeding record
- [ ] Breeding date creates task
- [ ] Record offspring outcome

## Tree tapping

- [ ] Record sap
- [ ] Add syrup batch
- [ ] Ratio displays correctly
- [ ] Delete syrup batch
- [ ] Records persist after refresh

## Pantry / preservation

- [ ] Add stored food
- [ ] Stored food persists
- [ ] Food coverage totals update

## Billing

- [ ] Monthly test checkout opens
- [ ] Annual test checkout opens
- [ ] 14-day trial is shown in Stripe
- [ ] Webhook writes subscription row
- [ ] App recognizes trialing/active as Plus
- [ ] Subscription update is reflected
- [ ] Subscription cancellation is reflected

## Mobile/PWA

- [ ] iPhone Safari layout
- [ ] Android Chrome layout
- [ ] Add to Home Screen
- [ ] Service worker loads
- [ ] Navigation remains usable with keyboard
- [ ] Buttons have readable labels
- [ ] Text is readable at 200% zoom

## Launch blockers

- [ ] Password reset
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Support/contact page
- [ ] Error monitoring
- [ ] Analytics
- [ ] Backup/restore strategy
- [ ] Final crop-data validation
- [ ] Final animal-care safety review
- [ ] Final preservation-safety review
