# Trae Preflight

This folder is prepared for `wangxt-745-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18045
- API_PORT: 19045
- WEB_PORT: 20045
- DB_PORT: 21045
- REDIS_PORT: 22045

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
