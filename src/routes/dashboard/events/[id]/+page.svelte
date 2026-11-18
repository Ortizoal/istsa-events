<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { EventDoc } from '#lib/types';
  import { formatEventRange } from '#lib/utils';
  import Badge from '#lib/components/Badge.svelte';
  import Button from '#lib/components/Button.svelte';
  import Spinner from '#lib/components/Spinner.svelte';

  const id = $derived(page.params.id ?? '');
  let event = $state<EventDoc | null>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(load);

  async function load() {
    try {
      event = await backend().getEventById(id);
      if (!event) error = 'Event not found.';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not load event.';
    } finally {
      loading = false;
    }
  }

  async function togglePublish() {
    if (!event) return;
    const next = event.status === 'published' ? 'draft' : 'published';
    await backend().setEventStatus(event.id, next);
    event = { ...event, status: next };
  }

  async function remove() {
    if (!event) return;
    if (!confirm('Delete this event and all its registrations? This cannot be undone.')) return;
    await backend().deleteEvent(event.id);
    await goto('/dashboard');
  }

  const checkInRate = $derived(
    event && event.approvedCount > 0
      ? Math.round((event.checkedInCount / event.approvedCount) * 100)
      : 0
  );
</script>

{#if loading}
  <div class="flex items-center gap-2 py-16 text-slate-500"><Spinner /> Loading…</div>
{:else if error || !event}
  <div class="istsa-card p-10 text-center">
    <p class="text-navy-900">{error || 'Event not found.'}</p>
    <Button href="/dashboard" variant="secondary" class="mt-4">Back to dashboard</Button>
  </div>
{:else}
  <div class="mb-6">
    <a href="/dashboard" class="text-sm text-slate-500 hover:text-navy-700">← Dashboard</a>
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <Badge tone={event.status === 'published' ? 'green' : event.status === 'cancelled' ? 'red' : 'slate'}>
        {event.status}
      </Badge>
      <Badge tone="navy">{event.visibility}</Badge>
    </div>
    <h1 class="mt-2 text-2xl font-bold text-navy-900">{event.title}</h1>
    <p class="text-sm text-slate-500">{formatEventRange(event.startsAt, event.endsAt)}</p>
  </div>

  <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
    <div class="istsa-card p-4">
      <p class="text-2xl font-bold text-navy-900">{event.registrationCount}</p>
      <p class="text-xs text-slate-500">Registrations</p>
    </div>
    <div class="istsa-card p-4">
      <p class="text-2xl font-bold text-navy-900">{event.approvedCount}</p>
      <p class="text-xs text-slate-500">Approved</p>
    </div>
    <div class="istsa-card p-4">
      <p class="text-2xl font-bold text-navy-900">{event.checkedInCount}</p>
      <p class="text-xs text-slate-500">Checked in</p>
    </div>
    <div class="istsa-card p-4">
      <p class="text-2xl font-bold text-navy-900">{checkInRate}%</p>
      <p class="text-xs text-slate-500">Attendance rate</p>
    </div>
  </div>

  <div class="mb-6 flex flex-wrap gap-2">
    <Button href={`/dashboard/events/${event.id}/checkin`} variant="gold">Open check-in</Button>
    <Button href={`/dashboard/events/${event.id}/guests`} variant="primary">Guest list</Button>
    <Button href={`/dashboard/events/${event.id}/edit`} variant="secondary">Edit</Button>
    <Button href={`/events/${event.slug}`} variant="ghost">View public page</Button>
    <Button variant="secondary" onclick={togglePublish}>
      {event.status === 'published' ? 'Unpublish' : 'Publish'}
    </Button>
    <Button variant="danger" onclick={remove}>Delete</Button>
  </div>

  <div class="istsa-card p-5">
    <h2 class="text-base font-semibold text-navy-900">Details</h2>
    <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
      <div><dt class="text-slate-500">Host</dt><dd class="text-navy-900">{event.hostName}</dd></div>
      <div>
        <dt class="text-slate-500">Location</dt>
        <dd class="text-navy-900">{event.isOnline ? 'Online' : event.venue || 'TBC'}</dd>
      </div>
      <div><dt class="text-slate-500">Capacity</dt><dd class="text-navy-900">{event.capacity ?? 'Unlimited'}</dd></div>
      <div>
        <dt class="text-slate-500">Approval</dt>
        <dd class="text-navy-900">{event.requiresApproval ? 'Required' : 'Automatic'}</dd>
      </div>
      <div><dt class="text-slate-500">Questions</dt><dd class="text-navy-900">{event.questions.length}</dd></div>
      <div><dt class="text-slate-500">Guests allowed</dt><dd class="text-navy-900">{event.allowGuests ? 'Yes' : 'No'}</dd></div>
    </dl>
  </div>
{/if}
