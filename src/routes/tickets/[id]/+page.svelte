<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { RegistrationDoc } from '#lib/types';
  import { buildTicketPayload, qrDataUrl } from '#lib/qr';
  import { formatEventRange, registrationLabel } from '#lib/utils';
  import Badge from '#lib/components/Badge.svelte';
  import Button from '#lib/components/Button.svelte';
  import Spinner from '#lib/components/Spinner.svelte';
  import Logo from '#lib/components/Logo.svelte';
  import { ORGANISATION_SHORT } from '#lib/config';

  const id = $derived(page.params.id ?? '');

  let reg = $state<RegistrationDoc | null>(null);
  let qr = $state('');
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const found = await backend().getRegistration(id);
      if (!found) {
        error = 'Ticket not found.';
        return;
      }
      const owner = auth.user && (found.userId === auth.user.uid);
      if (!owner && !auth.isStaff) {
        error = 'You do not have access to this ticket.';
        return;
      }
      reg = found;
      if (found.status === 'approved' && found.token) {
        qr = await qrDataUrl(buildTicketPayload(found.eventId, found.token, found.code), 360);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not load ticket.';
    } finally {
      loading = false;
    }
  });

  async function cancel() {
    if (!reg) return;
    if (!confirm('Cancel this registration?')) return;
    await backend().cancelRegistration(reg.id);
    reg = { ...reg, status: 'cancelled' };
  }
</script>

<div class="istsa-container max-w-lg py-10">
  {#if loading}
    <div class="flex items-center gap-2 py-16 text-slate-500"><Spinner /> Loading ticket…</div>
  {:else if error}
    <div class="istsa-card p-10 text-center">
      <p class="text-navy-900">{error}</p>
      <Button href="/tickets" variant="secondary" class="mt-4">Back to tickets</Button>
    </div>
  {:else if reg}
    <div class="mb-4 flex items-center justify-between">
      <a href="/tickets" class="text-sm text-slate-500 hover:text-navy-700">← My tickets</a>
      <Badge tone={reg.checkedIn ? 'green' : reg.status === 'approved' ? 'green' : 'gold'}>
        {registrationLabel(reg)}
      </Badge>
    </div>

    <div class="istsa-card overflow-hidden">
      <div class="flex items-center gap-3 bg-navy-800 px-6 py-5 text-white">
        <Logo size={40} />
        <div>
          <p class="text-xs uppercase tracking-widest text-gold-300">{ORGANISATION_SHORT} ticket</p>
          <p class="text-sm text-navy-100">{reg.eventTitle}</p>
        </div>
      </div>

      <div class="flex flex-col items-center px-6 py-8">
        {#if reg.status === 'approved' && qr}
          <img src={qr} alt="Ticket QR code" class="h-64 w-64 rounded-xl border border-slate-200" />
          <p class="mt-4 font-mono text-lg tracking-widest text-navy-900">{reg.code}</p>
          <p class="mt-1 text-center text-xs text-slate-500">
            Show this at the door. Officers scan it to mark your attendance.
          </p>
        {:else if reg.status === 'pending'}
          <div class="rounded-xl bg-gold-50 p-6 text-center text-sm text-gold-800">
            Your registration is awaiting approval. Your QR ticket appears here once approved.
          </div>
        {:else if reg.status === 'waitlisted'}
          <div class="rounded-xl bg-sky-50 p-6 text-center text-sm text-sky-800">
            You're on the waitlist. We'll issue a ticket if a spot opens up.
          </div>
        {:else}
          <div class="rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-600">
            This registration is {reg.status}. No ticket is available.
          </div>
        {/if}
      </div>

      <dl class="grid grid-cols-2 gap-y-3 border-t border-dashed border-slate-200 px-6 py-5 text-sm">
        <dt class="text-slate-500">When</dt>
        <dd class="text-right font-medium text-navy-900">{formatEventRange(reg.eventStartsAt, reg.eventStartsAt)}</dd>
        <dt class="text-slate-500">Attendee</dt>
        <dd class="text-right font-medium text-navy-900">{reg.name}</dd>
        <dt class="text-slate-500">Email</dt>
        <dd class="truncate text-right font-medium text-navy-900">{reg.email}</dd>
        {#if reg.guestCount > 0}
          <dt class="text-slate-500">Guests</dt>
          <dd class="text-right font-medium text-navy-900">+{reg.guestCount}</dd>
        {/if}
      </dl>
    </div>

    <div class="mt-5 flex flex-wrap gap-2">
      <Button variant="secondary" onclick={() => window.print()}>Print / Save</Button>
      {#if reg.userId === auth.user?.uid && reg.status !== 'cancelled'}
        <Button variant="danger" onclick={cancel}>Cancel registration</Button>
      {/if}
    </div>
  {/if}
</div>
