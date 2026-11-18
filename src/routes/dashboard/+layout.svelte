<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { auth } from '#lib/stores/auth.svelte';
  import { isStaff, isAdmin } from '#lib/roles';
  import { cn } from '#lib/utils';
  import Spinner from '#lib/components/Spinner.svelte';

  let { children }: { children: Snippet } = $props();

  const items = $derived(
    [
      { href: '/dashboard', label: 'Overview', exact: true },
      { href: '/dashboard/events/new', label: 'New event' },
      { href: '/dashboard/members', label: 'Members', admin: true }
    ].filter((i) => (i.admin ? isAdmin(auth.user?.role) : true))
  );

  const current = $derived(page.url.pathname);

  function active(href: string, exact = false) {
    return exact ? current === href : current === href || current.startsWith(href + '/');
  }

  onMount(() => {
    if (!auth.loading && !isStaff(auth.user?.role)) {
      void goto('/login?redirect=/dashboard');
    }
  });

  $effect(() => {
    if (!auth.loading && !isStaff(auth.user?.role)) {
      void goto('/login?redirect=/dashboard');
    }
  });
</script>

{#if auth.loading}
  <div class="istsa-container flex items-center gap-2 py-20 text-slate-500"><Spinner /> Loading…</div>
{:else if !isStaff(auth.user?.role)}
  <div class="istsa-container py-20 text-center">
    <h1 class="text-xl font-bold text-navy-900">Staff only</h1>
    <p class="mt-2 text-slate-500">
      This area is for {`ISTSA`} executives. Ask an admin to grant you officer access.
    </p>
  </div>
{:else}
  <div class="istsa-container flex flex-col gap-6 py-8 lg:flex-row">
    <aside class="lg:w-52 lg:shrink-0">
      <nav class="flex gap-1 overflow-x-auto lg:flex-col">
        {#each items as item}
          <a
            href={item.href}
            class={cn(
              'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition',
              active(item.href, item.exact)
                ? 'bg-navy-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {item.label}
          </a>
        {/each}
      </nav>
    </aside>
    <div class="min-w-0 flex-1">
      {@render children()}
    </div>
  </div>
{/if}
