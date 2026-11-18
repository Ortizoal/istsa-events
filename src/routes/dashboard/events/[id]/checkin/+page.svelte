<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { EventDoc } from '#lib/types';
  import { parseTicketPayload } from '#lib/qr';
  import Button from '#lib/components/Button.svelte';

  const eventId = $derived(page.params.id ?? '');

  let event = $state<EventDoc | null>(null);
  let scanning = $state(false);
  let starting = $state(false);
  let cameraError = $state('');
  let manual = $state('');
  let result = $state<{ ok: boolean; title: string; message: string } | null>(null);
  let busy = $state(false);

  let scanner: import('html5-qrcode').Html5Qrcode | null = null;
  let lastToken = '';
  let lastAt = 0;

  onMount(async () => {
    event = await backend().getEventById(eventId);
  });

  onDestroy(() => {
    void stop();
  });

  async function start() {
    starting = true;
    cameraError = '';
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      scanner = new Html5Qrcode('istsa-reader');
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => void onScan(text),
        () => undefined
      );
      scanning = true;
    } catch (e) {
      cameraError =
        e instanceof Error ? e.message : 'Could not access the camera. Use manual entry below.';
    } finally {
      starting = false;
    }
  }

  async function stop() {
    if (scanner && scanning) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        /* ignore */
      }
    }
    scanning = false;
  }

  async function onScan(text: string) {
    const payload = parseTicketPayload(text);
    if (!payload) {
      result = { ok: false, title: 'Unrecognised code', message: 'That QR is not an ISTSA ticket.' };
      return;
    }
    if (payload.eventId !== eventId) {
      result = { ok: false, title: 'Wrong event', message: 'This ticket belongs to another event.' };
      return;
    }
    await redeem(payload.token);
  }

  async function redeem(token: string) {
    const now = Date.now();
    if (token === lastToken && now - lastAt < 3000) return; // debounce repeat scans
    lastToken = token;
    lastAt = now;
    if (!auth.user) return;
    busy = true;
    try {
      const reg = await backend().checkInByToken(eventId, token, auth.user);
      result = {
        ok: true,
        title: reg.name,
        message: `${reg.code} · checked in${reg.guestCount ? ` (+${reg.guestCount} guests)` : ''}`
      };
    } catch (e) {
      result = {
        ok: false,
        title: 'No match',
        message: e instanceof Error ? e.message : 'Ticket not found for this event.'
      };
    } finally {
      busy = false;
    }
  }

  async function submitManual(e: SubmitEvent) {
    e.preventDefault();
    const code = manual.trim().toUpperCase();
    if (!code) return;
    // Look up by human code within this event's registrations.
    const regs = await backend().listRegistrationsForEvent(eventId);
    const match = regs.find((r) => r.code.toUpperCase() === code);
    if (!match?.token) {
      result = { ok: false, title: 'No match', message: `No approved ticket with code ${code}.` };
      return;
    }
    await redeem(match.token);
    manual = '';
  }
</script>

<div class="mb-6">
  <a href={`/dashboard/events/${eventId}`} class="text-sm text-slate-500 hover:text-navy-700">← Event</a>
  <h1 class="mt-2 text-2xl font-bold text-navy-900">Check-in</h1>
  <p class="text-sm text-slate-500">Scan attendee QR codes or enter a ticket code manually.</p>
</div>

<div class="grid gap-6 lg:grid-cols-2">
  <div>
    <div class="istsa-card overflow-hidden">
      <div id="istsa-reader" class="mx-auto min-h-64 w-full bg-navy-900 [&_video]:w-full"></div>
      <div class="flex items-center justify-between gap-2 p-4">
        {#if scanning}
          <Button variant="secondary" onclick={stop}>Stop camera</Button>
        {:else}
          <Button variant="gold" onclick={start} loading={starting}>Start camera</Button>
        {/if}
        <span class="text-xs text-slate-400">Camera stays on your device.</span>
      </div>
    </div>
    {#if cameraError}
      <p class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{cameraError}</p>
    {/if}

    <form class="istsa-card mt-4 flex gap-2 p-4" onsubmit={submitManual}>
      <input class="istsa-input" placeholder="Ticket code e.g. IST-4F2A9C" bind:value={manual} />
      <Button type="submit" variant="primary" loading={busy}>Check in</Button>
    </form>
  </div>

  <div>
    <div
      class="istsa-card flex min-h-64 flex-col items-center justify-center p-8 text-center"
      class:border-emerald-300={result?.ok}
      class:border-red-300={result && !result.ok}
    >
      {#if !result}
        <p class="text-slate-400">Scan a ticket to see the result here.</p>
      {:else}
        <div
          class="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          class:bg-emerald-100={result.ok}
          class:bg-red-100={!result.ok}
        >
          {#if result.ok}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="text-emerald-600"
              ><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg
            >
          {:else}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="text-red-600"
              ><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" /></svg
            >
          {/if}
        </div>
        <p class="text-lg font-semibold text-navy-900">{result.title}</p>
        <p class="mt-1 text-sm text-slate-500">{result.message}</p>
      {/if}
    </div>
    {#if event}
      <p class="mt-3 text-center text-xs text-slate-400">
        {event.checkedInCount} of {event.approvedCount} approved attendees checked in
      </p>
    {/if}
  </div>
</div>
