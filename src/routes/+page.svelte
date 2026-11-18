<script lang="ts">
  import { onMount } from 'svelte';
  import { backend } from '#lib/data';
  import type { EventDoc } from '#lib/types';
  import { isPast } from '#lib/utils';
  import { APP_TAGLINE, ORGANISATION, ORGANISATION_SHORT } from '#lib/config';
  import EventCard from '#lib/components/EventCard.svelte';
  import Button from '#lib/components/Button.svelte';
  import Spinner from '#lib/components/Spinner.svelte';

  let events = $state<EventDoc[]>([]);
  let loading = $state(true);
  let error = $state('');

  const upcoming = $derived(events.filter((e) => !isPast(e.endsAt ?? e.startsAt)));
  const past = $derived(events.filter((e) => isPast(e.endsAt ?? e.startsAt)));

  onMount(async () => {
    try {
      events = await backend().listPublishedEvents();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not load events.';
    } finally {
      loading = false;
    }
  });
</script>

<section class="border-b border-slate-200 bg-gradient-to-b from-navy-800 to-navy-900 text-white">
  <div class="istsa-container py-14 sm:py-20">
    <p class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gold-300">
      {ORGANISATION_SHORT} · {ORGANISATION}
    </p>
    <h1 class="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
      Discover, register and check in to {ORGANISATION_SHORT} events.
    </h1>
    <p class="mt-4 max-w-xl text-navy-100">{APP_TAGLINE} One link for the whole department.</p>
    <div class="mt-7 flex flex-wrap gap-3">
      <Button href="/signup" variant="gold" size="lg">Create an account</Button>
      <Button href="#events" variant="secondary" size="lg">Browse events</Button>
    </div>
  </div>
</section>

<section id="events" class="istsa-container py-10">
  <div class="mb-6 flex items-end justify-between">
    <div>
      <h2 class="text-xl font-semibold text-navy-900">Upcoming events</h2>
      <p class="text-sm text-slate-500">Register once, get a QR ticket, scan in at the door.</p>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center gap-2 py-16 text-slate-500"><Spinner /> Loading events…</div>
  {:else if error}
    <p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
  {:else if upcoming.length === 0}
    <div class="istsa-card p-10 text-center text-slate-500">
      <p class="font-medium text-navy-900">No upcoming events yet.</p>
      <p class="mt-1 text-sm">Check back soon — the executives are planning something.</p>
    </div>
  {:else}
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each upcoming as event (event.id)}
        <EventCard {event} href={`/events/${event.slug}`} />
      {/each}
    </div>
  {/if}

  {#if past.length > 0}
    <h2 class="mb-4 mt-12 text-lg font-semibold text-navy-900">Past events</h2>
    <div class="grid gap-5 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
      {#each past as event (event.id)}
        <EventCard {event} href={`/events/${event.slug}`} />
      {/each}
    </div>
  {/if}
</section>
