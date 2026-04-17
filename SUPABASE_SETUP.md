# Supabase Setup Guide

Follow these steps once. Takes about 10 minutes.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free, no credit card needed)
2. Click **New project**
3. Name it `unstudio`, choose a region (US East is fine), set a database password (save it somewhere)
4. Wait ~2 minutes for the project to spin up

---

## 2. Create the `supporters` table

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New query** and paste this, then click **Run**:

```sql
-- Create the supporters table
create table supporters (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  gsd_email   text not null,
  comment     text,
  approved    boolean default true,
  created_at  timestamptz default now()
);

-- Enable Row Level Security
alter table supporters enable row level security;

-- Public can read approved entries
create policy "Public can read approved"
  on supporters for select
  using (approved = true or auth.role() = 'authenticated');

-- Anyone can submit (insert)
create policy "Anyone can submit"
  on supporters for insert
  with check (true);

-- Only logged-in admin can update
create policy "Admin can update"
  on supporters for update
  to authenticated
  using (true);

-- Only logged-in admin can delete
create policy "Admin can delete"
  on supporters for delete
  to authenticated
  using (true);
```

---

## 3. Get your API credentials

1. In Supabase, go to **Project Settings** → **API**
2. Copy two values:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`

3. Open `js/config.js` in this project and replace the placeholder values:

```javascript
const SUPABASE_URL  = 'https://xxxxxxxxxxxx.supabase.co';   // ← paste here
const SUPABASE_ANON = 'eyJhbGci...';                         // ← paste here
```

Save the file.

---

## 4. Create your admin account

This is how you'll log in to the admin panel at `/admin.html`.

1. In Supabase, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - **Email:** `wyatt_roy@gsd.harvard.edu`
   - **Password:** `4535warmUNO!`
4. Click **Create user**

That's it. You can now log in at `/admin.html` with those credentials.

---

## 5. Test it

1. Open the site locally (or push to GitHub Pages — see below)
2. Go to the homepage and sign the petition with a `@gsd.harvard.edu` email
3. Go to `/admin.html`, log in, and verify the submission appears

---

## 6. Deploy to GitHub Pages

```bash
# From the Website/ folder:
git init
git add .
git commit -m "initial unstudio website"
git remote add origin https://github.com/wyattroy/unstudio.git
git push -u origin main
```

Then in GitHub:
1. Go to your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch** → `main` → `/ (root)`
3. Save — your site will be live at `https://wyattroy.github.io/unstudio` in ~1 minute

---

## Troubleshooting

**Petition form says "not configured"**
→ Check that `js/config.js` has the correct Supabase URL and anon key (not the placeholder strings).

**Admin login fails with "Invalid login credentials"**
→ Go to Supabase → Authentication → Users and verify the user exists with exactly that email.

**Submissions don't appear on the public wall**
→ Check that `approved = true` (the default). You can verify in Supabase → Table Editor → supporters.

**CORS error in console**
→ Go to Supabase → Project Settings → API → and add your GitHub Pages URL to the allowed origins. 
   Add both: `https://wyattroy.github.io` and `http://localhost:PORT` for local testing.
