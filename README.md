# The Spotlight — Temporary Test Build

The public site, Owner Dashboard, and Publisher Studio use Firebase Realtime Database.

## Test mode
- `index.html`: public website
- `admin.html`: Owner Dashboard; login is temporarily bypassed
- `editor.html`: Publisher Studio; login is temporarily bypassed
- Owner can edit website branding, colors, logo, ticker, editor usernames/permissions, and remove articles.
- Editor passwords are not stored. Secure password creation will be enabled when Firebase Authentication is activated after testing.

## Database paths
- `/settings` — site identity and visual settings
- `/articles` — published articles
- `/editors` — editor usernames and permission flags

## Important security warning
This build is for private testing only. Do not publish it to a public domain while login is bypassed. Firebase Realtime Database Rules must be configured separately; the supplied Firestore rules do not protect Realtime Database. Back up the database before deployment.
