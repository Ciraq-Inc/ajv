# Frontend Dev Deployment on the Existing Droplet

This runs the `order-request-update` frontend on the same droplet as a separate container.

Current target:
- Public IP: `143.198.150.112`
- Backend dev API: `http://143.198.150.112:3010`

This setup exposes the frontend on:
- `http://143.198.150.112:4010`

## What This Creates

- A separate Nuxt frontend container for the branch
- Frontend host port `4010`
- Frontend configured to call the dev backend at `http://143.198.150.112:3010`

## 1. Package the Frontend Locally

Run this on your Windows machine:

```powershell
cd c:\Users\rigel\Desktop\medsgh
tar -a -cf frontend-dev.zip --exclude=frontend/node_modules --exclude=frontend/.nuxt --exclude=frontend/.output --exclude=frontend/dev.out.log --exclude=frontend/dev.err.log --exclude=frontend/server.out.log --exclude=frontend/server.err.log frontend
```

## 2. Upload the Archive to the Droplet

Since the server cannot clone the private repo, upload `frontend-dev.zip` to a file host you control, then download it in the droplet console.

Example on the droplet once you have a direct download URL:

```bash
cd /opt
curl -L "PASTE_DIRECT_DOWNLOAD_URL_HERE" -o frontend-dev.zip
```

Verify before extracting:

```bash
ls -lh /opt/frontend-dev.zip
file /opt/frontend-dev.zip
```

## 3. Extract Into a Separate Frontend Dev Folder

Run on the droplet:

```bash
cd /opt
mkdir -p medsgh-frontend-dev
apt update && apt install -y unzip
unzip -o /opt/frontend-dev.zip -d /opt/medsgh-frontend-dev
cd /opt/medsgh-frontend-dev/frontend
```

## 4. Optional: Create a Frontend `.env`

If you want explicit runtime values, create:

```bash
cp .env.example .env
nano .env
```

Recommended values:

```env
API_BASE_URL=http://143.198.150.112:3010
NUXT_PUBLIC_API_BASE=http://143.198.150.112:3010
```

The provided `docker-compose.dev.yml` already injects `NUXT_PUBLIC_API_BASE`, so this file is optional for the containerized dev deployment.

## 5. Start the Frontend Dev Container

Run:

```bash
docker compose -f docker-compose.dev.yml -p medsgh-frontend-dev up -d --build
```

## 6. Verify the Frontend

Check status:

```bash
docker compose -f docker-compose.dev.yml -p medsgh-frontend-dev ps
```

Check locally on the server:

```bash
curl http://127.0.0.1:4010
```

Then test from your browser:

- `http://143.198.150.112:4010`

## 7. Useful Commands

View logs:

```bash
docker compose -f docker-compose.dev.yml -p medsgh-frontend-dev logs -f app
```

Restart after uploading a fresh frontend zip:

```bash
docker compose -f docker-compose.dev.yml -p medsgh-frontend-dev up -d --build
```

Stop the frontend dev container:

```bash
docker compose -f docker-compose.dev.yml -p medsgh-frontend-dev down
```

## Faster Future Updates

Once a fresh `/opt/frontend-dev.zip` has been uploaded, you can run:

```bash
bash /opt/medsgh-frontend-dev/frontend/scripts/frontend-deploy-dev.sh
```

This script:
- backs up `.env`
- replaces the extracted frontend files
- restores `.env`
- reinstalls dependencies
- builds the frontend
- restarts the background Nuxt production server on port `4000`

## Important Notes

- This does not affect the production frontend.
- This does not require a PR or merge.
- This frontend expects the dev backend to already be running on port `3010`.
- If port `4010` is blocked by a firewall, open it in the droplet firewall before testing externally.
