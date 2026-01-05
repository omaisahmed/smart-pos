# Admin Credentials & Quick Auth Test

This repository now includes a simple built-in admin user created on server startup.

Defaults:

- Email: `admin@admin.com`
- Password: `admin`

You can override these by setting the environment variables in `.env`:

```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=yourpassword
```

Quick test (run from project root):

```bash
# start your dev servers in one terminal
npm run dev

# in another terminal, run the quick auth check
node scripts/check-auth.js
```

The script will attempt to log in and then fetch `/api/auth/user` using the returned session cookie.

Exit codes:
- 0: success
- 1: login or user fetch returned non-200
- 2: network or unexpected error
