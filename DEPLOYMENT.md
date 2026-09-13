# Deploying BillFlow Pro

## 1. Before you deploy — rotate these secrets

The following values were, at some point, pasted into a third-party chat
(this AI assistant) while debugging. Treat them as compromised and rotate
before going live on a real domain, even if they currently work:

- **Gmail App Password** (`MAIL_PASSWORD`) — revoke and regenerate at
  https://myaccount.google.com/apppasswords
- **Resend API key** (`RESEND_API_KEY`) — revoke and regenerate at
  https://resend.com/api-keys (only needed if you're not using Gmail SMTP)
- **JWT `SECRET_KEY`** — generate a fresh one for production, don't reuse
  the dev value in `.env`:
  ```bash
  python3 -c "import secrets; print(secrets.token_hex(32))"
  ```
- **Database passwords** (`billflow_secret` for Postgres/Mongo) — fine for
  local dev, change them for a real server.

## 2. Required environment variables

Copy `.env.example` to `.env` and fill in real values. Minimum required to
boot:

| Variable | Notes |
|---|---|
| `SECRET_KEY` | Required — app refuses to start without it |
| `DATABASE_URL`, `MONGODB_URL`, `REDIS_URL` | Point these at your production DB hosts, not `localhost` |
| `MAIL_USERNAME` + `MAIL_PASSWORD` | Gmail SMTP (preferred) — App Password, not your normal password |
| `RESEND_API_KEY` | Optional fallback if Gmail isn't configured |
| `CORS_ORIGINS` | Comma-separated list of your real frontend domain(s), e.g. `https://yourshop.com,https://www.yourshop.com` |
| `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_NODE_API_URL` | Set to your real public URLs, not `localhost` |

Note: the `NEXT_PUBLIC_*` variables are baked into the frontend at **build
time** (Next.js inlines them into the JS bundle). If you change them, you
must rebuild the frontend image — restarting the container alone won't
pick up new values.

## 3. Build and run

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

This uses `docker-compose.prod.yml` to disable the dev source bind-mount
and stop publishing database ports to the public internet. Check status:

```bash
docker-compose ps
docker-compose logs -f backend-fastapi
```

All four app-level services (`backend-fastapi`, `backend-node`,
`frontend`, plus `postgres`/`mongodb`/`redis`) have Docker healthchecks —
`docker-compose ps` will show `healthy`/`unhealthy` per service.

## 4. Put it behind HTTPS

This repo does not include a reverse proxy or TLS termination. In
production you need something in front of the containers doing HTTPS —
common options: a managed platform (Render, Railway, Fly.io) that
terminates TLS for you, or your own Nginx/Caddy/Traefik reverse proxy with
Let's Encrypt. Never expose the raw container ports (3000/8000/3001)
directly to the internet over plain HTTP.

## 5. Post-deploy checklist

- [ ] Rotated Gmail App Password / Resend key (see §1)
- [ ] `SECRET_KEY` is a fresh, unique value (not the dev one)
- [ ] `CORS_ORIGINS` set to your real domain (not `localhost`)
- [ ] Database ports (5432/27017/6379) are **not** reachable from the
      public internet — confirm with `docker-compose -f docker-compose.yml -f docker-compose.prod.yml config` that no `ports:` remain for them
- [ ] HTTPS is terminated somewhere in front of the app
- [ ] Sent a real test invoice email and confirmed it arrived
- [ ] Downloaded a PDF and confirmed the design renders correctly
