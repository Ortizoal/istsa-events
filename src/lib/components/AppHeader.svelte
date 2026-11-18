<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { auth } from '#lib/stores/auth.svelte';
  import { APP_NAME, ORGANISATION_SHORT } from '#lib/config';
  import { isStaff } from '#lib/roles';
  import { initials, cn } from '#lib/utils';
  import Logo from './Logo.svelte';
  import Button from './Button.svelte';

  let menuOpen = $state(false);
  let userOpen = $state(false);

  const links = $derived(
    [
      { href: '/', label: 'Events' },
      { href: '/tickets', label: 'My tickets', auth: true },
      { href: '/dashboard', label: 'Dashboard', staff: true }
    ].filter((l) => {
      if (l.staff) return isStaff(auth.user?.role);
      if (l.auth) return Boolean(auth.user);
      return true;
    })
  );

  const current = $derived(page.url.pathname);

  async function handleSignOut() {
    await auth.signOut();
    userOpen = false;
    await goto('/');
  }
</script>

<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
  <div class="istsa-container flex h-16 items-center justify-between gap-4">
    <a href="/" class="flex items-center gap-2.5">
      <Logo size={36} />
      <span class="flex flex-col leading-none">
        <span class="text-sm font-bold tracking-tight text-navy-900">{APP_NAME}</span>
        <span class="text-[11px] font-medium text-gold-600">{ORGANISATION_SHORT}</span>
      </span>
    </a>

    <nav class="hidden items-center gap-1 md:flex">
      {#each links as link}
        <a
          href={link.href}
          class={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition',
            current === link.href ? 'bg-navy-50 text-navy-800' : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          {link.label}
        </a>
      {/each}
    </nav>

    <div class="flex items-center gap-2">
      {#if auth.loading}
        <div class="h-8 w-20 animate-pulse rounded-lg bg-slate-100"></div>
      {:else if auth.user}
        <div class="relative hidden md:block">
          <button
            class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-slate-100"
            onclick={() => (userOpen = !userOpen)}
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-xs font-semibold text-white"
            >
              {initials(auth.user.displayName)}
            </span>
            <span class="text-sm font-medium text-navy-800">{auth.user.displayName.split(' ')[0]}</span>
          </button>
          {#if userOpen}
            <div
              class="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              <div class="px-3 py-2">
                <p class="truncate text-sm font-medium text-navy-900">{auth.user.displayName}</p>
                <p class="truncate text-xs text-slate-500">{auth.user.email}</p>
              </div>
              <div class="my-1 border-t border-slate-100"></div>
              <a href="/tickets" class="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">My tickets</a>
              {#if isStaff(auth.user.role)}
                <a href="/dashboard" class="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >Dashboard</a
                >
              {/if}
              <button
                class="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onclick={handleSignOut}>Sign out</button
              >
            </div>
          {/if}
        </div>
      {:else}
        <Button href="/login" variant="ghost" size="sm" class="hidden md:inline-flex">Log in</Button>
        <Button href="/signup" variant="gold" size="sm">Get started</Button>
      {/if}

      <button
        class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        onclick={() => (menuOpen = !menuOpen)}
        aria-label="Menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          ><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>

  {#if menuOpen}
    <div class="border-t border-slate-200 bg-white md:hidden">
      <div class="istsa-container flex flex-col py-2">
        {#each links as link}
          <a href={link.href} class="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {link.label}
          </a>
        {/each}
        {#if auth.user}
          <button
            class="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            onclick={handleSignOut}>Sign out</button
          >
        {:else}
          <a href="/login" class="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >Log in</a
          >
        {/if}
      </div>
    </div>
  {/if}
</header>
