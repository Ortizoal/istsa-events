<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { RegistrationDoc } from '#lib/types';
  import { formatEventRange, isPast, registrationLabel } from '#lib/utils';
  import Badge from '#lib/components/Badge.svelte';
  import Button from '#lib/components/Button.svelte';
  import Spinner from '#lib/components/Spinner.svelte';

  let regs = $state<RegistrationDoc[]>([]);
  let loading = $state(true);

  const toneFor = (r: RegistrationDoc) => {
    if (r.checkedIn) return 'green' as const;
    switch (r.status) {
      case 'approved':
        return 'green' as const;
      case 'pending':
        return 'gold' as const;
      case 'waitlisted':
        return 'blue' as const;
      case 'cancelled':
        return 'slate' as const;
      default:
        return 'red' as const;
    }
  };

  onMount(async () => {
    if (!auth.user) {
      if (!auth.loading) await goto('/login?redirect=/tickets');
      return;
    }
    try {
      regs = await backend().listRegistrationsByUser(auth.user.uid);
    } finally {
      loading = false;
    }
  });

  $effect(() => {
    if (auth.user && loading) void load();
  });

  async function load() {
    if (!auth.user) return;
    try {
      regs = await backend().listRegistrationsByUser(auth.user.uid);
    } finally {
      loading = false;
    }
  }
</script>

<div class="istsa-container py-10">
  <h1 class="text-2xl font-bold text-navy-900">My tickets</h1>
  <p class="mb-6 text-sm text-slate-500">Your event registrations and QR check-in codes.</p>

  {#if auth.loading || loading}
    <div class="flex items-center gap-2 py-16 text-slate-500"><Spinner /> Loading…</div>
  {:else if !auth.user}
    <div class="istsa-card p-10 text-center">
      <p class="text-navy-900">Please log in to see your tickets.</p>
      <Button href="/login?redirect=/tickets" class="mt-4">Log in</Button>
    </div>
  {:else if regs.length === 0}
    <div class="istsa-card p-10 text-center text-slate-500">
      <p class="font-medium text-navy-900">No tickets yet.</p>
      <Button href="/" variant="gold" class="mt-4">Browse events</Button>
    </div>
  {:else}
    <div class="space-y-3">
      {#each regs as reg (reg.id)}
        <a
          href={`/tickets/${reg.id}`}
          class="istsa-card flex flex-col gap-3 p-4 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <Badge tone={toneFor(reg)}>{registrationLabel(reg)}</Badge>
              {#if isPast(reg.eventStartsAt)}<Badge tone="slate">Past</Badge>{/if}
            </div>
            <p class="mt-2 truncate font-semibold text-navy-900">{reg.eventTitle}</p>
            <p class="text-sm text-slate-500">{formatEventRange(reg.eventStartsAt, reg.eventStartsAt)}</p>
          </div>
          <div class="text-right">
            <p class="font-mono text-sm text-navy-700">{reg.code}</p>
            <p class="text-xs text-slate-400">Tap to view</p>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
