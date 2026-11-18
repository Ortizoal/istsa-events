<script lang="ts">
  import type { EventDoc } from '#lib/types';
  import { formatEventRange, isPast } from '#lib/utils';
  import Badge from './Badge.svelte';

  interface Props {
    event: EventDoc;
    href: string;
  }
  let { event, href }: Props = $props();

  const past = $derived(isPast(event.endsAt ?? event.startsAt));
  const spotsLeft = $derived(
    event.capacity != null ? Math.max(0, event.capacity - event.approvedCount) : null
  );
</script>

<a
  {href}
  class="istsa-card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
>
  <div
    class="relative h-36 w-full bg-gradient-to-br from-navy-700 to-navy-900"
    style={event.coverUrl ? `background-image:url(${event.coverUrl});background-size:cover;background-position:center` : ''}
  >
    <div class="absolute left-3 top-3 flex gap-2">
      {#if event.isOnline}<Badge tone="blue">Online</Badge>{/if}
      {#if past}<Badge tone="slate">Ended</Badge>{/if}
    </div>
  </div>

  <div class="flex flex-1 flex-col p-4">
    <p class="text-xs font-semibold uppercase tracking-wide text-gold-600">
      {formatEventRange(event.startsAt, event.endsAt)}
    </p>
    <h3 class="mt-1 line-clamp-2 text-base font-semibold text-navy-900 group-hover:text-navy-700">
      {event.title}
    </h3>
    <p class="mt-1 line-clamp-2 text-sm text-slate-500">{event.summary}</p>

    <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
        ><path
          d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
          stroke="currentColor"
          stroke-width="2"
        /><circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="2" /></svg
      >
      <span class="truncate">{event.isOnline ? 'Online event' : event.venue || 'Venue TBC'}</span>
    </div>

    <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
      <span class="text-slate-500">{event.approvedCount} going</span>
      {#if spotsLeft != null}
        <span class={spotsLeft > 0 ? 'text-emerald-600' : 'text-red-600'}>
          {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
        </span>
      {:else}
        <span class="text-slate-400">Open capacity</span>
      {/if}
    </div>
  </div>
</a>
