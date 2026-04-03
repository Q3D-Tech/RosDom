# RosDom Linux Deploy

This folder contains the deployment assets for the RosDom backend on Linux.

Target paths:

- backend code: `/var/opt/rosdom/backend`
- production env: `/etc/rosdom/rosdom-backend.env`

Included files:

- [`env/rosdom-backend.env.example`](/C:/Programs/RosDom/backend/deploy/linux/env/rosdom-backend.env.example)
- [`systemd/rosdom-backend.service`](/C:/Programs/RosDom/backend/deploy/linux/systemd/rosdom-backend.service)
- [`nginx/rosdom.conf`](/C:/Programs/RosDom/backend/deploy/linux/nginx/rosdom.conf)
- [`scripts/install-backend.sh`](/C:/Programs/RosDom/backend/deploy/linux/scripts/install-backend.sh)
- [`scripts/check-backend.sh`](/C:/Programs/RosDom/backend/deploy/linux/scripts/check-backend.sh)

## 1. Base packages

For Debian / Ubuntu:

```bash
sudo apt update
sudo apt install -y curl git nginx postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2. Linux user and directories

```bash
sudo useradd --system --create-home --shell /bin/bash rosdom || true
sudo mkdir -p /var/opt/rosdom /etc/rosdom /var/log/rosdom
sudo chown -R rosdom:rosdom /var/opt/rosdom /var/log/rosdom
```

## 3. PostgreSQL database and user

Enter `psql`:

```bash
sudo -u postgres psql
```

Run:

```sql
CREATE USER rosdom WITH PASSWORD 'CHANGE_ME_TO_A_LONG_PASSWORD';
CREATE DATABASE rosdom OWNER rosdom;
GRANT ALL PRIVILEGES ON DATABASE rosdom TO rosdom;
\q
```

Verify:

```bash
psql "postgres://rosdom:CHANGE_ME_TO_A_LONG_PASSWORD@127.0.0.1:5432/rosdom" -c "select now();"
```

## 4. Copy backend code

```bash
sudo mkdir -p /var/opt/rosdom/backend
sudo rsync -av --delete /path/to/backend/ /var/opt/rosdom/backend/ \
  --exclude node_modules \
  --exclude dist \
  --exclude .git
sudo chown -R rosdom:rosdom /var/opt/rosdom/backend
```

## 5. Create env file

```bash
sudo mkdir -p /etc/rosdom
sudo cp /var/opt/rosdom/backend/deploy/linux/env/rosdom-backend.env.example /etc/rosdom/rosdom-backend.env
sudo nano /etc/rosdom/rosdom-backend.env
```

Minimum required:

- `JWT_ACCESS_SECRET`
- `DATABASE_URL` or `POSTGRES_*`
- `CORS_ORIGIN`
- `INTEGRATION_CREDENTIALS_SECRET`
- Smart Life / Tuya env values

## 6. Smart Life / Tuya setup

Primary production path for an existing Smart Life account:

1. Create a Tuya Cloud project.
2. Add the required Smart Home API permissions.
3. Open `Devices -> Link Tuya App Account` in Tuya Console.
4. Link the Smart Life account to the cloud project by QR scan.
5. Put the project `Access ID / Access Secret` into backend env.

Recommended env values:

```env
TUYA_CLIENT_ID=YOUR_PROJECT_ACCESS_ID
TUYA_CLIENT_SECRET=YOUR_PROJECT_ACCESS_SECRET
TUYA_DEFAULT_REGION=eu
TUYA_ASSOCIATED_APP_SCHEMA=tuyaSmart
TUYA_REQUEST_IDENTIFIER=tuyaSmart
TUYA_APP_SCHEMA=tuyaSmart
```

Optional legacy OEM OAuth values can stay empty unless you still use that path:

```env
TUYA_APP_AUTH_IDENTIFIER=
TUYA_REDIRECT_URL=
TUYA_AUTHORIZATION_URL=
TUYA_AUTHORIZATION_URL_TEMPLATE=
ROSDOM_APP_DEEP_LINK_URL=ru.rosdom://integrations/tuya/callback
```

## 7. Build backend

```bash
cd /var/opt/rosdom/backend
npm ci
npm run build
```

## 8. Run once manually

```bash
cd /var/opt/rosdom/backend
env $(grep -v '^#' /etc/rosdom/rosdom-backend.env | xargs) node dist/main.js
```

Check:

```bash
curl http://127.0.0.1:4000/v1/health
```

## 9. systemd

```bash
sudo cp /var/opt/rosdom/backend/deploy/linux/systemd/rosdom-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable rosdom-backend
sudo systemctl restart rosdom-backend
sudo systemctl status rosdom-backend
sudo journalctl -u rosdom-backend -f
```

## 10. nginx and HTTPS

Use:

- [`nginx/rosdom.conf`](/C:/Programs/RosDom/backend/deploy/linux/nginx/rosdom.conf)

Install:

```bash
sudo cp /var/opt/rosdom/backend/deploy/linux/nginx/rosdom.conf /etc/nginx/sites-available/rosdom.conf
sudo ln -sf /etc/nginx/sites-available/rosdom.conf /etc/nginx/sites-enabled/rosdom.conf
sudo nginx -t
sudo systemctl reload nginx
```

You need a public HTTPS domain if you want the optional OEM callback route to work. The direct Smart Life login path itself still expects production HTTPS between app and backend.

## 11. Verify production

```bash
curl https://YOUR_DOMAIN/v1/health
curl -I https://YOUR_DOMAIN/v1/integrations/tuya/oauth/callback
```

The callback route can return a simple HTML page even when you only use the direct Smart Life login path.

## 12. Useful smoke script

```bash
/var/opt/rosdom/backend/deploy/linux/scripts/check-backend.sh https://YOUR_DOMAIN
```

## 13. What the Android app now expects

In RosDom Android:

1. user enters Smart Life e-mail/phone and password
2. backend performs Tuya associated-user login
3. sync imports devices
4. user assigns floor / room / marker

If login succeeds but sync returns zero devices, the first thing to check is whether the Smart Life app account was linked to the cloud project in Tuya Console.
