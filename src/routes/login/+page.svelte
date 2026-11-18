<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { auth } from '#lib/stores/auth.svelte';
  import Button from '#lib/components/Button.svelte';
  import Logo from '#lib/components/Logo.svelte';
  import { APP_NAME } from '#lib/config';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let submitting = $state(false);

	const redirectTo = $derived(page.url.searchParams.get('redirect') ?? '/');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		submitting = true;
		try {
			await auth.signIn(email, password);
			await goto(redirectTo);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not sign in.';
		} finally {
			submitting = false;
		}
	}

	async function signInWithGoogle() {
		error = '';
		submitting = true;
		try {
			await auth.signInWithGoogle();
			await goto(redirectTo);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Google sign-in failed.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="istsa-container flex max-w-md flex-col items-center py-14">
  <Logo size={56} />
  <h1 class="mt-4 text-2xl font-bold text-navy-900">Welcome back</h1>
  <p class="mb-6 text-sm text-slate-500">Log in to register for events and view your tickets.</p>

  <form onsubmit={submit} class="istsa-card w-full space-y-4 p-6">
    {#if error}
      <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
    {/if}
    <div>
      <label class="istsa-label" for="email">Email</label>
      <input id="email" class="istsa-input" type="email" bind:value={email} required autocomplete="email" />
    </div>
    <div>
      <label class="istsa-label" for="password">Password</label>
      <input
        id="password"
        class="istsa-input"
        type="password"
        bind:value={password}
        required
        autocomplete="current-password"
      />
    </div>
    <Button type="submit" full loading={submitting}>Log in</Button>
  </form>

  <p class="mt-4 text-sm text-slate-500">
    New here? <a href="/signup" class="font-medium text-navy-700 hover:underline">Create an account</a>
  </p>
  <p class="mt-1 text-xs text-slate-400">{APP_NAME}</p>
</div>
