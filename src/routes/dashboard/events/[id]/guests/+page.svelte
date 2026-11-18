<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { EventDoc, RegistrationDoc, RegistrationStatus } from '#lib/types';
  import { downloadText, formatDateTime, registrationLabel, toCsv } from '#lib/utils';
  import Badge from '#lib/components/Badge.svelte';
  import Button from '#lib/components/Button.svelte';
  import Spinner from '#lib/components/Spinner.svelte';

  const id = $derived(page.params.id ?? '');
  let event = $state<EventDoc | null>(null);
  let regs = $state<RegistrationDoc[]>([]);
  let loading = $state(true);
  let search = $state('');
  let filter = $state<'all' | RegistrationStatus | 'checked_in'>('all');

  const tone = (r: RegistrationDoc) =>
    r.checkedIn
      ? 'green'
      : r.status === 'approved'
        ? 'green'
        : r.status === 'pending'
          ? 'gold'
          : r.status === 'waitlisted'
            ? 'blue'
            : r.status === 'declined'
              ? 'red'
              : 'slate';

  const filtered = $derived(
    regs.filter((r) => {
      const matches =
        !search ||
        `${r.name} ${r.email} ${r.studentId} ${r.code}`.toLowerCase().includes(search.toLowerCase());
      const statusOk =
        filter === 'all'
          ? true
          : filter === 'checked_in'
            ? r.checkedIn
            : r.status === filter;
      return matches && statusOk;
    })
  );

  onMount(load);

  async function load() {
    try {
      [event, regs] = await Promise.all([
        backend().getEventById(id),
        backend().listRegistrationsForEvent(id)
      ]);
    } finally {
      loading = false;
    }
  }

  async function setStatus(reg: RegistrationDoc, status: RegistrationStatus) {
    if (!auth.user) return;
    await backend().setRegistrationStatus(reg.id, status, auth.user);
    reg.status = status;
  }

  async function toggleCheckIn(reg: RegistrationDoc) {
    if (!auth.user) return;
    if (reg.checkedIn) {
      await backend().undoCheckIn(reg.id);
      reg.checkedIn = false;
    } else {
      await backend().checkIn(reg.id, auth.user);
      reg.checkedIn = true;
    }
  }

  function exportCsv() {
    const rows = regs.map((r) => ({
      code: r.code,
      name: r.name,
      email: r.email,
      phone: r.phone,
      studentId: r.studentId,
      program: r.program,
      status: r.status,
      checkedIn: r.checkedIn ? 'yes' : 'no',
      checkedInAt: r.checkedInAt ? formatDateTime(r.checkedInAt) : '',
      guests: r.guestCount
    }));
    const columns = Object.keys(rows[0] ?? { code: '' });
    downloadText(
      `${event?.slug ?? 'event'}-guests.csv`,
      toCsv(rows, columns)
    );
  }
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
  <div>
    <a href={`/dashboard/events/${id}`} class="text-sm text-slate-500 hover:text-navy-700">← Event</a>
    <h1 class="mt-2 text-2xl font-bold text-navy-900">Guest list</h1>
    <p class="text-sm text-slate-500">
      {regs.length} registrations · {event?.checkedInCount ?? 0} checked in
    </p>
  </div>
  <Button variant="secondary" onclick={exportCsv} disabled={regs.length === 0}>Export CSV</Button>
</div>

<div class="mb-4 flex flex-wrap items-center gap-2">
  <input class="istsa-input max-w-xs" placeholder="Search name, email or code…" bind:value={search} />
  <select class="istsa-input max-w-44" bind:value={filter}>
    <option value="all">All statuses</option>
    <option value="approved">Approved</option>
    <option value="pending">Pending</option>
    <option value="waitlisted">Waitlisted</option>
    <option value="declined">Declined</option>
    <option value="checked_in">Checked in</option>
  </select>
</div>

{#if loading}
  <div class="flex items-center gap-2 py-12 text-slate-500"><Spinner /> Loading…</div>
{:else if filtered.length === 0}
  <div class="istsa-card p-10 text-center text-slate-500">No registrations match.</div>
{:else}
  <div class="istsa-card overflow-x-auto">
    <table class="w-full min-w-[640px] text-sm">
      <thead class="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th class="px-4 py-3">Attendee</th>
          <th class="px-4 py-3">Code</th>
          <th class="px-4 py-3">Status</th>
          <th class="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each filtered as reg (reg.id)}
          <tr>
            <td class="px-4 py-3">
              <p class="font-medium text-navy-900">{reg.name}</p>
              <p class="text-xs text-slate-500">{reg.email}</p>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-slate-600">{reg.code}</td>
            <td class="px-4 py-3">
              <Badge tone={tone(reg)}>{registrationLabel(reg)}</Badge>
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1.5">
                {#if reg.status === 'pending'}
                  <Button size="sm" variant="primary" onclick={() => setStatus(reg, 'approved')}>Approve</Button>
                  <Button size="sm" variant="secondary" onclick={() => setStatus(reg, 'declined')}>Decline</Button>
                {:else}
                  <Button size="sm" variant={reg.checkedIn ? 'secondary' : 'gold'} onclick={() => toggleCheckIn(reg)}>
                    {reg.checkedIn ? 'Undo' : 'Check in'}
                  </Button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
