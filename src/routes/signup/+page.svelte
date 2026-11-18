<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '#lib/stores/auth.svelte';
  import Button from '#lib/components/Button.svelte';
  import Logo from '#lib/components/Logo.svelte';
  import { PROGRAMS } from '#lib/config';

  let displayName = $state('');
  let email = $state('');
  let password = $state('');
  let studentId = $state('');
  let program = $state(PROGRAMS[0]?.value ?? '');
	let phone = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let submitting = $state(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    error = '';
    submitting = true;
    try {
      await auth.signUp({ displayName, email, password, studentId, program, phone });
      await goto('/');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not create your account.';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="istsa-container flex max-w-lg flex-col items-center py-14">
  <Logo size={56} />
  <h1 class="mt-4 text-2xl font-bold text-navy-900">Join {`ISTSA`}</h1>
  <p class="mb-6 text-sm text-slate-500">Create your account to register for department events.</p>

  <form onsubmit={submit} class="istsa-card w-full space-y-4 p-6">
    {#if error}
      <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
    {/if}
    <div>
      <label class="istsa-label" for="name">Full name</label>
      <input id="name" class="istsa-input" bind:value={displayName} required autocomplete="name" />
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="istsa-label" for="sid">Student ID</label>
        <input id="sid" class="istsa-input" bind:value={studentId} placeholder="e.g. 01234567" />
      </div>
      <div>
        <label class="istsa-label" for="phone">Phone</label>
        <input id="phone" class="istsa-input" type="tel" bind:value={phone} placeholder="+233…" />
      </div>
    </div>
    <div>
      <label class="istsa-label" for="program">Programme</label>
      <select id="program" class="istsa-input" bind:value={program}>
        {#each PROGRAMS as p}
          <option value={p.value}>{p.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label class="istsa-label" for="email">Email</label>
      <input id="email" class="istsa-input" type="email" bind:value={email} required autocomplete="email" />
    </div>
    <div class="relative">
      <label class="istsa-label" for="password">Password</label>
      <input
        id="password"
        class="istsa-input pr-10"
        type={showPassword ? 'text' : 'password'}
        bind:value={password}
        required
        minlength="6"
        autocomplete="new-password"
      />
      <button
        type="button"
        class="absolute right-3 top-1/2 -mt-1.5 text-slate-500 hover:text-navy-700"
        onclick={() => (showPassword = !showPassword)}
        aria-label="Toggle password visibility"
      >
        {showPassword ? '🙈' : '👁️'}
      </button>
    </div>
    <p class="istsa-help">At least 6 characters.</p>
    <Button type="submit" full loading={submitting}>Create account</Button>
  </form>

  <p class="mt-4 text-sm text-slate-500">
    Already have an account? <a href="/login" class="font-medium text-navy-700 hover:underline">Log in</a>
  </p>
</div>
