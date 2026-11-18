<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { EventDoc, EventInput } from '#lib/types';
  import { toDatetimeLocal } from '#lib/utils';
  import EventForm from '#lib/components/EventForm.svelte';
  import Spinner from '#lib/components/Spinner.svelte';

  const id = $derived(page.params.id ?? '');
  let initial = $state<EventInput | null>(null);
  let loading = $state(true);
  let busy = $state(false);
  let error = $state('');

  function toInput(e: EventDoc): EventInput {
    return {
      title: e.title,
      summary: e.summary,
      description: e.description,
      coverUrl: e.coverUrl,
      hostName: e.hostName,
      startsAt: toDatetimeLocal(e.startsAt),
      endsAt: toDatetimeLocal(e.endsAt),
      timezone: e.timezone,
      isOnline: e.isOnline,
      venue: e.venue,
      meetingUrl: e.meetingUrl,
      capacity: e.capacity,
      waitlistEnabled: e.waitlistEnabled,
      requiresApproval: e.requiresApproval,
      status: e.status,
      visibility: e.visibility,
      allowGuests: e.allowGuests,
      questions: e.questions
    };
  }

  onMount(async () => {
    try {
      const event = await backend().getEventById(id);
      if (event) initial = toInput(event);
      else error = 'Event not found.';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not load event.';
    } finally {
      loading = false;
    }
  });

  async function submit(input: EventInput) {
    if (!auth.user) return;
    busy = true;
    error = '';
    try {
      await backend().updateEvent(id, input, auth.user);
      await goto(`/dashboard/events/${id}`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not save changes.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="mb-6">
  <a href={`/dashboard/events/${id}`} class="text-sm text-slate-500 hover:text-navy-700">← Event</a>
  <h1 class="mt-2 text-2xl font-bold text-navy-900">Edit event</h1>
</div>

{#if loading}
  <div class="flex items-center gap-2 py-12 text-slate-500"><Spinner /> Loading…</div>
{:else if initial}
  <EventForm {initial} submitLabel="Save changes" {busy} {error} onsubmit={submit} />
{:else}
  <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
{/if}
