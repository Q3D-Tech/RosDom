# RosDom Backend

RosDom backend is the production API for:

- authentication and sessions
- family accounts and homes
- floors, rooms, layouts, and tasks
- rewards, notifications, and events
- Smart Life / Tuya cloud integration

Expected Linux layout:

- code: `/var/opt/rosdom/backend`
- production env: `/etc/rosdom/rosdom-backend.env`

## Current Smart Life / Tuya flow

The primary production path is now:

1. Create a Tuya Cloud project.
2. Link the existing Smart Life app account to that cloud project in Tuya Console.
3. Put the project `Access ID / Access Secret` into backend env.
4. Sign in from RosDom Android with the existing Smart Life username/password.
5. Run sync and assign imported devices to floors and rooms.

RosDom still contains the older OEM OAuth flow for compatibility, but it is no longer the recommended path for an already existing Smart Life account.

## Backend env

Base env:

- `HOST`
- `PORT`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `DATABASE_URL` or `POSTGRES_*`
- `INTEGRATION_CREDENTIALS_SECRET`

Smart Life / Tuya env for the primary flow:

- `TUYA_CLIENT_ID`
- `TUYA_CLIENT_SECRET`
- `TUYA_DEFAULT_REGION`
- `TUYA_ASSOCIATED_APP_SCHEMA=tuyaSmart`
- `TUYA_REQUEST_IDENTIFIER=tuyaSmart`
- `TUYA_APP_SCHEMA=tuyaSmart`

Optional legacy OEM OAuth env:

- `TUYA_APP_AUTH_IDENTIFIER`
- `TUYA_REDIRECT_URL`
- `TUYA_AUTHORIZATION_URL`
- `TUYA_AUTHORIZATION_URL_TEMPLATE`
- `ROSDOM_APP_DEEP_LINK_URL`

Templates:

- [`.env.example`](/C:/Programs/RosDom/backend/.env.example)
- [`deploy/linux/env/rosdom-backend.env.example`](/C:/Programs/RosDom/backend/deploy/linux/env/rosdom-backend.env.example)

## Linux deploy

Full deployment instructions:

- [`deploy/linux/README.md`](/C:/Programs/RosDom/backend/deploy/linux/README.md)

Minimal production steps:

1. Copy backend to `/var/opt/rosdom/backend`.
2. Create PostgreSQL database and user.
3. Create `/etc/rosdom/rosdom-backend.env` from the example.
4. Fill base env plus the Tuya env above.
5. Build:

```bash
cd /var/opt/rosdom/backend
npm ci
npm run build
```

6. Restart service:

```bash
sudo systemctl restart rosdom-backend
sudo systemctl status rosdom-backend
```

7. Verify:

```bash
curl https://YOUR_DOMAIN/v1/health
```

## Tuya project setup from zero

Use the official Tuya platform:

- [Tuya Developer Platform](https://platform.tuya.com/)

Required steps:

1. Create a Cloud project for Smart Home.
2. Add the required Smart Home API permissions.
3. Open `Devices -> Link Tuya App Account`.
4. Add a Smart Life app account to the cloud project by QR scan.
5. Use the project `Access ID / Access Secret` in RosDom backend env.

Recommended schema for Smart Life:

- `tuyaSmart`

Recommended region for Western Europe:

- `eu`

## Android note

For the direct Smart Life login flow, the Android app no longer needs to use the OEM login page.

The app now:

1. sends Smart Life username/password to RosDom backend over HTTPS
2. backend exchanges this through Tuya associated-user login
3. backend stores provider tokens encrypted with `AES-256-GCM`
4. sync imports the user devices
5. command calls go through Tuya cloud

## Server update

After updating backend files on the server:

```bash
cd /var/opt/rosdom/backend
npm ci
npm run build
sudo systemctl restart rosdom-backend
sudo systemctl status rosdom-backend
```

Useful checks:

```bash
curl https://YOUR_DOMAIN/v1/health
curl -I https://YOUR_DOMAIN/v1/integrations/tuya/oauth/callback
```

The callback route can still exist even if you only use the direct Smart Life login path.

## Scope and limitations

Current live target:

- Smart Life / Tuya smart bulb
- Smart Life / Tuya smart plug

Not completed in this phase:

- Matter/local pairing
- broader multi-vendor onboarding
- full device-class-specific controls for every Tuya category
