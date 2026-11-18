<script lang="ts">
  import type { EventInput, EventQuestion, QuestionType } from '#lib/types';
  import { newId, toDatetimeLocal } from '#lib/utils';
  import Button from './Button.svelte';

  interface Props {
    initial?: EventInput | null;
    submitLabel?: string;
    busy?: boolean;
    error?: string;
    onsubmit: (input: EventInput) => void;
  }

  let { initial = null, submitLabel = 'Save event', busy = false, error = '', onsubmit }: Props =
    $props();

  const blank: EventInput = {
    title: '',
    summary: '',
    description: '',
    coverUrl: '',
    hostName: '',
    startsAt: toDatetimeLocal(new Date(Date.now() + 86_400_000)),
    endsAt: toDatetimeLocal(new Date(Date.now() + 86_400_000 + 3 * 3_600_000)),
    timezone: 'Africa/Accra',
    isOnline: false,
    venue: '',
    meetingUrl: '',
    capacity: null,
    waitlistEnabled: true,
    requiresApproval: false,
    status: 'draft',
    visibility: 'public',
    allowGuests: true,
    questions: []
  };

  let form = $state<EventInput>(initial ?? blank);

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'short_text', label: 'Short text' },
    { value: 'long_text', label: 'Long text' },
    { value: 'single_choice', label: 'Single choice' },
    { value: 'multi_choice', label: 'Multiple choice' },
    { value: 'checkbox', label: 'Checkbox' }
  ];

  function addQuestion() {
    form.questions = [
      ...form.questions,
      { id: newId(), label: '', type: 'short_text', required: false, options: [] }
    ];
  }

  function removeQuestion(id: string) {
    form.questions = form.questions.filter((q) => q.id !== id);
  }

  function setOptions(q: EventQuestion, raw: string) {
    q.options = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    onsubmit({ ...form, capacity: form.capacity ? Number(form.capacity) : null });
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  {#if error}
    <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  {/if}

  <section class="istsa-card space-y-4 p-5">
    <h2 class="text-base font-semibold text-navy-900">Basics</h2>
    <div>
      <label class="istsa-label" for="title">Event title</label>
      <input id="title" class="istsa-input" bind:value={form.title} required placeholder="e.g. ISTSA Hack Night" />
    </div>
    <div>
      <label class="istsa-label" for="summary">Short summary</label>
      <input id="summary" class="istsa-input" bind:value={form.summary} placeholder="One line shown on cards" />
    </div>
    <div>
      <label class="istsa-label" for="desc">Description</label>
      <textarea id="desc" class="istsa-input min-h-32" bind:value={form.description}></textarea>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="istsa-label" for="cover">Cover image URL</label>
        <input id="cover" class="istsa-input" bind:value={form.coverUrl} placeholder="https://…" />
      </div>
      <div>
        <label class="istsa-label" for="host">Host name</label>
        <input id="host" class="istsa-input" bind:value={form.hostName} placeholder="ISTSA Executives" />
      </div>
    </div>
  </section>

  <section class="istsa-card space-y-4 p-5">
    <h2 class="text-base font-semibold text-navy-900">When &amp; where</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="istsa-label" for="start">Starts</label>
        <input id="start" class="istsa-input" type="datetime-local" bind:value={form.startsAt} required />
      </div>
      <div>
        <label class="istsa-label" for="end">Ends</label>
        <input id="end" class="istsa-input" type="datetime-local" bind:value={form.endsAt} required />
      </div>
    </div>
    <label class="flex items-center gap-2 text-sm text-navy-800">
      <input type="checkbox" class="accent-navy-700" bind:checked={form.isOnline} />
      This is an online event
    </label>
    {#if form.isOnline}
      <div>
        <label class="istsa-label" for="meet">Meeting URL</label>
        <input id="meet" class="istsa-input" bind:value={form.meetingUrl} placeholder="https://meet…" />
      </div>
    {:else}
      <div>
        <label class="istsa-label" for="venue">Venue</label>
        <input id="venue" class="istsa-input" bind:value={form.venue} placeholder="ATU Main Auditorium" />
      </div>
    {/if}
  </section>

  <section class="istsa-card space-y-4 p-5">
    <h2 class="text-base font-semibold text-navy-900">Registration</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="istsa-label" for="cap">Capacity (leave blank for unlimited)</label>
        <input id="cap" class="istsa-input" type="number" min="1" bind:value={form.capacity} />
      </div>
      <div>
        <label class="istsa-label" for="status">Status</label>
        <select id="status" class="istsa-input" bind:value={form.status}>
          <option value="draft">Draft (hidden)</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
    <div class="grid gap-2 sm:grid-cols-2">
      <label class="flex items-center gap-2 text-sm text-navy-800">
        <input type="checkbox" class="accent-navy-700" bind:checked={form.requiresApproval} />
        Require officer approval
      </label>
      <label class="flex items-center gap-2 text-sm text-navy-800">
        <input type="checkbox" class="accent-navy-700" bind:checked={form.waitlistEnabled} />
        Enable waitlist when full
      </label>
      <label class="flex items-center gap-2 text-sm text-navy-800">
        <input type="checkbox" class="accent-navy-700" bind:checked={form.allowGuests} />
        Allow guests
      </label>
      <label class="flex items-center gap-2 text-sm text-navy-800">
        <input
          type="checkbox"
          class="accent-navy-700"
          checked={form.visibility === 'unlisted'}
          onchange={(e) => (form.visibility = e.currentTarget.checked ? 'unlisted' : 'public')}
        />
        Hide from public listing
      </label>
    </div>
  </section>

  <section class="istsa-card space-y-4 p-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-navy-900">Registration questions</h2>
      <Button type="button" variant="secondary" size="sm" onclick={addQuestion}>Add question</Button>
    </div>
    {#if form.questions.length === 0}
      <p class="text-sm text-slate-500">
        Add custom questions attendees answer when they register (level, dietary needs, team name…).
      </p>
    {/if}
    <div class="space-y-4">
      {#each form.questions as q (q.id)}
        <div class="rounded-xl border border-slate-200 p-3">
          <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input class="istsa-input" bind:value={q.label} placeholder="Question" />
            <select class="istsa-input sm:w-44" bind:value={q.type}>
              {#each questionTypes as t}<option value={t.value}>{t.label}</option>{/each}
            </select>
          </div>
          {#if q.type === 'single_choice' || q.type === 'multi_choice'}
            <input
              class="istsa-input mt-2"
              placeholder="Options, comma separated"
              value={q.options?.join(', ') ?? ''}
              oninput={(e) => setOptions(q, e.currentTarget.value)}
            />
          {/if}
          <div class="mt-2 flex items-center justify-between">
            <label class="flex items-center gap-2 text-sm text-navy-800">
              <input type="checkbox" class="accent-navy-700" bind:checked={q.required} /> Required
            </label>
            <button
              type="button"
              class="text-sm text-red-600 hover:underline"
              onclick={() => removeQuestion(q.id)}>Remove</button
            >
          </div>
        </div>
      {/each}
    </div>
  </section>

  <div class="flex justify-end gap-2">
    <Button type="submit" variant="primary" loading={busy}>{submitLabel}</Button>
  </div>
</form>
