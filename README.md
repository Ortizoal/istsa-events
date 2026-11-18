# ISTSA Events Portal

Event hosting, registration, QR tickets and attendance tracking for the
**Information Systems and Technology Students Association (ISTSA)**,
Accra Technical University.

Built with SvelteKit 3 (Svelte 5 runes), TypeScript, Tailwind CSS v4, and Firebase
(Auth · Firestore · Storage) with Resend for transactional email.

---

## What it does

- **Students** create an account, browse published events, register (answering any
  custom questions), and receive a QR ticket.
- **Officers / admins** create and publish events, view the guest list
  (approve/decline, export CSV), run the QR **check-in scanner**, and see
  attendance stats.
- **Emails** (ticket + 24h reminder) are sent automatically via Resend.

Hosting is **executive-only**: only accounts with the `officer` or `admin` role
can create events.

---

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. In the project, enable these products:
   - **Authentication** → Sign-in method → enable **Email/Password**.
   - **Firestore Database** → **Create database** (start in production mode).

   > **Storage is optional.** Event covers are added as image URLs, so you can
   > skip Cloud Storage entirely (it now requires the Blaze billing plan).
3. **Project settings → General → Your apps → Add app → Web (`</>`)**.
   Copy the `firebaseConfig` values — you need them for `.env.local` below.

## 2. Configure the web app

Copy `.env.example` to `.env.local` and paste the Web App config:

```env
PUBLIC_FIREBASE_API_KEY=AIza...
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

Restart the dev server afterwards (`pnpm dev`).

## 3. Install the Firebase CLI and link the project

```sh
npm install -g firebase-tools
firebase login
# from the project root:
firebase use --add        # pick your project, give it an alias
```

## 4. Deploy security rules and indexes

```sh
firebase deploy --only firestore:rules,firestore:indexes
```

> If you later enable Cloud Storage, run
> `firebase deploy --only storage` (and re-add the `storage` block to `firebase.json`).

## 5. Configure and deploy the email functions (optional)

> **Cloud Functions require the Blaze (pay-as-you-go) plan.** If you skip this
> step, everything still works except email delivery and automatic admin
> promotion. To become an admin without functions, open **Firestore Database →
> `users` → your user doc** and set `role` to `"admin"`.
> To enable functions later: upgrade to Blaze, re-add the `functions` block to
> `firebase.json`, then follow the steps below.

1. Create your Resend account at <https://resend.com> and
   **verify a sending domain** (or use their test `onboarding@resend.dev` sender).
   Create an **API key**.
2. Copy `functions/.env.example` to `functions/.env` and fill it in:

   ```env
   RESEND_API_KEY=re_xxxxxxxx
   MAIL_FROM=ISTSA Events <events@yourdomain.com>
   SUPER_ADMIN_EMAILS=you@example.com,exec@example.com
   APP_URL=https://your-istsa-portal.vercel.app
   ```

   `SUPER_ADMIN_EMAILS` are auto-promoted to `admin` on first sign-in.

3. Install and deploy:

   ```sh
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

## 6. Run locally

```sh
pnpm install
pnpm dev          # http://localhost:5173
```

First run: sign up with one of the `SUPER_ADMIN_EMAILS` — the Cloud Function
promotes that account to **admin** within a second or two (refresh). Then use
**Dashboard → Create event**.

## 7. Deploy the site

The app uses `@sveltejs/adapter-vercel`. Push to a Git repo and import it in
Vercel, or run `vercel`. Add the same six `PUBLIC_FIREBASE_*` variables in the
Vercel project settings.

---

## Roles

| Role      | Can do                                                             |
| --------- | ------------------------------------------------------------------ |
| `student` | Register for events, view own QR tickets                           |
| `officer` | Everything above + create events, guest list, check-in, CSV export |
| `admin`   | Everything above + manage member roles (`/dashboard/members`)      |

Promote someone to officer/admin from **Dashboard → Members** (admins only), or
list their email in `SUPER_ADMIN_EMAILS`.

## Project layout

```
src/lib/data          Firebase backend (the whole data layer)
src/lib/firebase      Firebase client init
src/lib/components     UI kit (buttons, modal, event form, scanner bits…)
src/lib/qr.ts          Ticket payload + QR generation
src/routes             Public site, auth, tickets, dashboard
functions/             Resend email functions + admin bootstrap
firestore.rules        Security rules
firestore.indexes.json Composite indexes
storage.rules          Storage rules
```

## Scripts

```sh
pnpm dev        # dev server
pnpm build      # production build
pnpm preview    # preview the build
pnpm check      # svelte-check + typecheck
pnpm lint       # prettier + eslint
```
