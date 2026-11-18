<script lang="ts">
  import { goto } from '$app/navigation';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { EventInput } from '#lib/types';
  import EventForm from '#lib/components/EventForm.svelte';

  let busy = $state(false);
  let error = $state('');

  async function submit(input: EventInput) {
    if (!auth.user) return;
    busy = true;
    error = '';
    try {
      const event = await backend().createEvent(input, auth.user);
      await goto(`/dashboard/events/${event.id}`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not create the event.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="mb-6">
  <a href="/dashboard" class="text-sm text-slate-500 hover:text-navy-700">← Dashboard</a>
  <h1 class="mt-2 text-2xl font-bold text-navy-900">Create an event</h1>
  <p class="text-sm text-slate-500">Fill in the details and add any registration questions.</p>
</div>

<EventForm submitLabel="Create event" {busy} {error} onsubmit={submit} />
