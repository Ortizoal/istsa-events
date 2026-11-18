<script lang="ts">
  import './layout.css';
  import favicon from '#lib/assets/favicon.svg';
  import { onMount, type Snippet } from 'svelte';
  import { auth } from '#lib/stores/auth.svelte';
  import AppHeader from '#lib/components/AppHeader.svelte';
  import Logo from '#lib/components/Logo.svelte';
  import { APP_NAME, ORGANISATION, ORGANISATION_SHORT, ORG_MOTTO, ORG_UNIVERSITY } from '#lib/config';
  import { hasFirebaseConfig } from '#lib/data';

  let { children }: { children: Snippet } = $props();

  onMount(() => auth.init());
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>{APP_NAME} · {ORGANISATION_SHORT}</title>
</svelte:head>

{#if !hasFirebaseConfig}
  <div class="istsa-container flex min-h-screen max-w-xl flex-col items-center justify-center py-16 text-center">
    <Logo size={64} />
    <h1 class="mt-5 text-2xl font-bold text-navy-900">Connect your Firebase project</h1>
    <p class="mt-2 text-sm text-slate-500">
      This portal runs on Firebase Auth and Firestore. Add your project keys to
      <code class="rounded bg-slate-100 px-1.5 py-0.5 text-navy-800">.env.local</code> and restart the dev server.
    </p>
    <ol class="mt-6 w-full space-y-2 text-left text-sm text-slate-600">
      <li class="istsa-card p-3">1. Copy <code>.env.example</code> → <code>.env.local</code>.</li>
      <li class="istsa-card p-3">
        2. Paste the <strong>Firebase Web App</strong> config values (Project settings → Your apps).
      </li>
      <li class="istsa-card p-3">
        3. Set <code>PUBLIC_SUPER_ADMIN_EMAILS</code> to the emails that should become admins.
      </li>
      <li class="istsa-card p-3">4. Restart: <code>pnpm dev</code>.</li>
    </ol>
    <p class="mt-6 text-xs text-slate-400">
      Then deploy rules &amp; functions with <code>firebase deploy</code>.
    </p>
  </div>
{:else}
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <main class="flex-1">
      {@render children()}
    </main>

    <footer class="border-t border-slate-200 bg-white">
      <div class="istsa-container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <Logo size={40} />
          <div class="text-sm">
            <p class="font-semibold text-navy-900">{ORGANISATION}</p>
            <p class="text-slate-500">{ORG_UNIVERSITY} · <span class="italic">{ORG_MOTTO}</span></p>
          </div>
        </div>
        <p class="text-xs text-slate-400">
          © {new Date().getFullYear()} {ORGANISATION_SHORT}. Built for the department.
        </p>
      </div>
    </footer>
  </div>
{/if}
