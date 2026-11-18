<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { EventDoc, RegistrationDoc } from '#lib/types';
  import { formatEventRange, isPast, registrationLabel } from '#lib/utils';
  import { PROGRAMS } from '#lib/config';
  import Badge from '#lib/components/Badge.svelte';
  import Button from '#lib/components/Button.svelte';
  import Spinner from '#lib/components/Spinner.svelte';
  import QuestionField from '#lib/components/QuestionField.svelte';

  const slug = $derived(page.params.slug ?? '');

  let event = $state<EventDoc | null>(null);
  let existing = $state<RegistrationDoc | null>(null);
  let loading = $state(true);
  let notFound = $state(false);
  let error = $state('');

  let submitting = $state(false);
  let rsvpOpen = $state(false);
  let form = $state({ name: '', email: '', phone: '', program: PROGRAMS[0]?.value ?? '', studentId: '' });
  let answers = $state<Record<string, string | string[]>>({});
  let guestCount = $state(0);

  const past = $derived(event ? isPast(event.endsAt ?? event.startsAt) : false);
  const full = $derived(
    event?.capacity != null ? event.approvedCount >= event.capacity : false
  );

  async function load() {
    loading = true;
    try {
      const found = await backend().getEventBySlug(slug);
      if (!found || (found.status !== 'published' && !auth.isStaff)) {
        notFound = true;
        return;
      }
      event = found;
      answers = Object.fromEntries(
        found.questions.map((q) => [q.id, q.type === 'multi_choice' ? [] : ''])
      );
      if (auth.user) {
        const mine = await backend().listRegistrationsByUser(auth.user.uid);
        existing = mine.find((r) => r.eventId === found.id) ?? null;
        form = {
          name: auth.user.displayName,
          email: auth.user.email,
          phone: auth.user.phone ?? '',
          program: auth.user.program || (PROGRAMS[0]?.value ?? ''),
          studentId: auth.user.studentId ?? ''
        };
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not load this event.';
    } finally {
      loading = false;
    }
  }

  let interval: any;
  let refreshing = $state(false);

  onMount(async () => {
    await load();
    if (auth.user && event && !existing && !past && !loading) {
      rsvpOpen = true;
    }
    interval = setInterval(refreshEvent, 5000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  // Re-check registration when the user signs in while on the page.
  $effect(() => {
    if (auth.user && event && !existing && !loading) void refreshMine();
  });

  async function refreshMine() {
    if (!auth.user || !event) return;
    const mine = await backend().listRegistrationsByUser(auth.user.uid);
    existing = mine.find((r) => r.eventId === event!.id) ?? null;
  }

  async function refreshEvent() {
    if (refreshing || !slug) return;
    refreshing = true;
    try {
      const found = await backend().getEventBySlug(slug);
      if (found) event = found;
    } catch {
      /* silent */
    } finally {
      refreshing = false;
    }
  }

  async function submitRsvp(e: SubmitEvent) {
    e.preventDefault();
    if (!event || !auth.user) return;
    error = '';
    submitting = true;
    try {
      const reg = await backend().register(
        event,
        { ...form, answers, guestCount },
        auth.user
      );
      await goto(`/tickets/${reg.id}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Registration failed.';
    } finally {
      submitting = false;
    }
  }

  function requireLogin() {
    goto(`/login?redirect=${encodeURIComponent(`/events/${slug}`)}`);
  }
</script>

{#if loading}
  <div class="istsa-container flex items-center gap-2 py-20 text-slate-500"><Spinner /> Loading event…</div>
{:else if notFound}
  <div class="istsa-container py-20 text-center">
    <h1 class="text-2xl font-bold text-navy-900">Event not found</h1>
    <p class="mt-2 text-slate-500">This event may have been removed or is not yet published.</p>
    <Button href="/" variant="secondary" class="mt-6">Back to events</Button>
  </div>
{:else if event}
  <div class="border-b border-slate-200 bg-white">
    <div class="istsa-container py-8">
      <a href="/" class="text-sm text-slate-500 hover:text-navy-700">← All events</a>
      <div class="mt-4 flex flex-wrap items-center gap-2">
        {#if event.isOnline}<Badge tone="blue">Online</Badge>{/if}
        {#if past}<Badge tone="slate">Ended</Badge>{/if}
        {#if event.requiresApproval}<Badge tone="gold">Approval required</Badge>{/if}
        {#if full && !past}<Badge tone="red">Full</Badge>{/if}
      </div>
      <h1 class="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-navy-900">{event.title}</h1>
      <p class="mt-2 max-w-2xl text-slate-600">{event.summary}</p>
    </div>
  </div>

  <div class="istsa-container grid gap-8 py-8 lg:grid-cols-3">
    <div class="space-y-6 lg:col-span-2">
      {#if event.coverUrl}
        <img src={event.coverUrl} alt="" class="h-64 w-full rounded-2xl object-cover" />
      {/if}

      <div class="istsa-card p-6">
        <h2 class="text-lg font-semibold text-navy-900">About this event</h2>
        <div class="mt-3 space-y-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {event.description}
        </div>
      </div>

      {#if event.questions.length > 0}
        <div class="istsa-card p-6">
          <h2 class="text-lg font-semibold text-navy-900">When you register</h2>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            {#each event.questions as q}
              <li class="flex items-start gap-2">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-gold-400"></span>
                <span>{q.label}{#if q.required}<span class="text-red-500"> *</span>{/if}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <aside class="space-y-4">
      <div class="istsa-card p-5">
        <dl class="space-y-4 text-sm">
          <div>
            <dt class="font-medium text-slate-500">When</dt>
            <dd class="text-navy-900">{formatEventRange(event.startsAt, event.endsAt)}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Where</dt>
            <dd class="text-navy-900">{event.isOnline ? 'Online' : event.venue || 'Venue TBC'}</dd>
            {#if event.isOnline && event.meetingUrl}
              <dd class="mt-1"><a class="text-navy-700 hover:underline" href={event.meetingUrl}>Join link</a></dd>
            {/if}
          </div>
          <div>
            <dt class="font-medium text-slate-500">Hosted by</dt>
            <dd class="text-navy-900">{event.hostName}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Attendance</dt>
            <dd class="text-navy-900">
              {event.approvedCount} going{#if event.capacity != null} · {event.capacity} capacity{/if}
            </dd>
          </div>
        </dl>

        <div class="mt-5">
          {#if error}
            <p class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          {/if}

          {#if existing && existing.status !== 'cancelled'}
            <div class="rounded-xl bg-emerald-50 p-4 text-center">
              <p class="text-sm font-medium text-emerald-800">
                You're {registrationLabel(existing).toLowerCase()} for this event.
              </p>
              <Button href={`/tickets/${existing.id}`} variant="primary" size="sm" class="mt-3">
                View my ticket
              </Button>
            </div>
          {:else if past}
            <Button variant="secondary" full disabled>This event has ended</Button>
          {:else if !auth.user}
            <Button variant="gold" full onclick={requireLogin}>Log in to register</Button>
            <p class="mt-2 text-center text-xs text-slate-400">
              New? <a href="/signup" class="text-navy-700 hover:underline">Create an account</a>
            </p>
          {:else if full && !event.waitlistEnabled}
            <Button variant="secondary" full disabled>Event is full</Button>
          {:else}
            <Button variant="gold" full onclick={() => (rsvpOpen = !rsvpOpen)}>
              {rsvpOpen ? 'Close' : full ? 'Join waitlist' : 'Register'}
            </Button>
          {/if}
        </div>
      </div>

      {#if rsvpOpen && auth.user && event && !past}
        <form class="istsa-card space-y-4 p-5" onsubmit={submitRsvp}>
          <h2 class="text-base font-semibold text-navy-900">Your details</h2>
          <div>
            <label class="istsa-label" for="r-name">Name</label>
            <input id="r-name" class="istsa-input" bind:value={form.name} required />
          </div>
          <div>
            <label class="istsa-label" for="r-email">Email</label>
            <input id="r-email" class="istsa-input" type="email" bind:value={form.email} required />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="istsa-label" for="r-sid">Student ID</label>
              <input id="r-sid" class="istsa-input" bind:value={form.studentId} />
            </div>
            <div>
              <label class="istsa-label" for="r-phone">Phone</label>
              <input id="r-phone" class="istsa-input" bind:value={form.phone} />
            </div>
          </div>
          <div>
            <label class="istsa-label" for="r-program">Programme</label>
            <select id="r-program" class="istsa-input" bind:value={form.program}>
              {#each PROGRAMS as p}<option value={p.value}>{p.label}</option>{/each}
            </select>
          </div>

          {#each event.questions as question (question.id)}
            <QuestionField
              {question}
              value={answers[question.id] ?? (question.type === 'multi_choice' ? [] : '')}
              onupdate={(v) => (answers[question.id] = v)}
            />
          {/each}

          {#if event.allowGuests}
            <div>
              <label class="istsa-label" for="r-guests">Bringing guests?</label>
              <input id="r-guests" class="istsa-input" type="number" min="0" max="5" bind:value={guestCount} />
            </div>
          {/if}

          <Button type="submit" variant="primary" full loading={submitting}>
            {full ? 'Join waitlist' : 'Confirm registration'}
          </Button>
        </form>
      {/if}
    </aside>
  </div>
{/if}
