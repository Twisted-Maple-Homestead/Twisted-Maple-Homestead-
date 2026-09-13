# Homestead Helper — Account Deletion

The app now includes an Account & data section on the My tab.

Current behavior:
- users can export their data first;
- local demo data can be cleared from the device;
- cloud deletion stays disabled unless the production backend has been deployed and tested;
- deletion requires typing DELETE and a second confirmation.

Before cloud deletion is enabled, complete these checks:
- deploy an authenticated server-side account-deletion function;
- verify every user-owned production table is removed as intended when the user account is deleted;
- test with two disposable users and confirm one user's deletion does not affect the other;
- verify billing/subscription cleanup behavior;
- verify the deleted user can no longer sign in;
- only then set ACCOUNT_DELETION_ENABLED to true in production configuration.

Beta status: the user interface and local-data path are implemented. Cloud-account deletion remains disabled until the backend path is deployed and tested.
