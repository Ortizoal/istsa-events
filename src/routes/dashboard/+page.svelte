<script lang="ts">
  import { onMount } from 'svelte';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { EventDoc } from '#lib/types';
  import { formatEventRange, isPast } from '#lib/utils';
  import Badge from '#lib/components/Badge.svelte';
  import Button from '#lib/components/Button.svelte';
  import Spinner from '#lib/components/Spinner.svelte';

  let events = $state<EventDoc[]>([]);
  let loading = $state(true);

  const totals = $derived({
    events: events.length,
    registrations: events.reduce((n, e) => n + e.registrationCount, 0),
    checkedIn: events.reduce((n, e) => n + e.checkedInCount, 0)
  });

  onMount(load);

  async function load() {
    if (!auth.user) return;
    try {
      events = await backend().listEventsByHost(auth.user.uid);
    } finally {
      loading = false;
    }
  }
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
  <div>
    <h1 class="text-2xl font-bold text-navy-900">Your events</h1>
    <p class="text-sm text-slate-500">Create events and track who shows up.</p>
  </div>
  <Button href="/dashboard/events/new" variant="gold">Create event</Button>
</div>

<div class="mb-6 grid grid-cols-3 gap-3">
  {#each [['Events', totals.events], ['Registrations', totals.registrations], ['Checked in', totals.checkedIn]] as [label, value]}
    <div class="istsa-card p-4">
      <p class="text-2xl font-bold text-navy-900">{value}</p>
      <p class="text-xs text-slate-500">{label}</p>
    </div>
  {/each}
</div>

{#if loading}
  <div class="flex items-center gap-2 py-12 text-slate-500"><Spinner /> Loading…</div>
{:else if events.length === 0}
  <div class="istsa-card p-10 text-center text-slate-500">
    <p class="font-medium text-navy-900">No events yet.</p>
    <p class="mt-1 text-sm">Create your first event to start taking registrations.</p>
    <Button href="/dashboard/events/new" variant="primary" class="mt-4">Create event</Button>
  </div>
{:else}
  <div class="space-y-3">
    {#each events as event (event.id)}
      <div class="istsa-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <Badge tone={event.status === 'published' ? 'green' : event.status === 'cancelled' ? 'red' : 'slate'}>
              {event.status}
            </Badge>
            {#if isPast(event.endsAt ?? event.startsAt)}<Badge tone="slate">Past</Badge>{/if}
          </div>
          <p class="mt-2 truncate font-semibold text-navy-900">{event.title}</p>
          <p class="text-sm text-slate-500">{formatEventRange(event.startsAt, event.endsAt)}</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right text-sm">
            <p class="font-semibold text-navy-900">{event.approvedCount}</p>
            <p class="text-xs text-slate-500">approved</p>
          </div>
          <div class="text-right text-sm">
            <p class="font-semibold text-navy-900">{event.checkedInCount}</p>
            <p class="text-xs text-slate-500">checked in</p>
          </div>
          <Button href={`/dashboard/events/${event.id}`} variant="secondary" size="sm">Manage</Button>
        </div>
      </div>
    {/each}
  </div>
{/if}
