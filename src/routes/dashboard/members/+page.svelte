<script lang="ts">
  import { onMount } from 'svelte';
  import { backend } from '#lib/data';
  import { auth } from '#lib/stores/auth.svelte';
  import type { Role, UserProfile } from '#lib/types';
  import { ROLE_LABELS } from '#lib/roles';
  import Badge from '#lib/components/Badge.svelte';
  import Spinner from '#lib/components/Spinner.svelte';

  let users = $state<UserProfile[]>([]);
  let loading = $state(true);
  let search = $state('');

  const roles: Role[] = ['student', 'officer', 'admin'];

  const filtered = $derived(
    users.filter((u) =>
      `${u.displayName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    )
  );

  onMount(async () => {
    try {
      users = await backend().listUsers();
    } finally {
      loading = false;
    }
  });

  async function changeRole(user: UserProfile, role: Role) {
    if (user.uid === auth.user?.uid) return; // don't let admins demote themselves
    await backend().setUserRole(user.uid, role);
    users = users.map((u) => (u.uid === user.uid ? { ...u, role } : u));
  }
</script>

<div class="mb-6">
  <h1 class="text-2xl font-bold text-navy-900">Members</h1>
  <p class="text-sm text-slate-500">Grant officer access to executives who manage events.</p>
</div>

<input class="istsa-input mb-4 max-w-sm" placeholder="Search members…" bind:value={search} />

{#if loading}
  <div class="flex items-center gap-2 py-12 text-slate-500"><Spinner /> Loading…</div>
{:else}
  <div class="istsa-card overflow-x-auto">
    <table class="w-full min-w-[560px] text-sm">
      <thead class="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th class="px-4 py-3">Member</th>
          <th class="px-4 py-3">Programme</th>
          <th class="px-4 py-3">Role</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each filtered as user (user.uid)}
          <tr>
            <td class="px-4 py-3">
              <p class="font-medium text-navy-900">
                {user.displayName}
                {#if user.uid === auth.user?.uid}<span class="text-xs text-slate-400">(you)</span>{/if}
              </p>
              <p class="text-xs text-slate-500">{user.email}</p>
            </td>
            <td class="px-4 py-3 text-slate-600">{user.program || '—'}</td>
            <td class="px-4 py-3">
              {#if user.uid === auth.user?.uid}
                <Badge tone="navy">{ROLE_LABELS[user.role]}</Badge>
              {:else}
                <select
                  class="istsa-input max-w-36"
                  value={user.role}
                  onchange={(e) => changeRole(user, e.currentTarget.value as Role)}
                >
                  {#each roles as role}<option value={role}>{ROLE_LABELS[role]}</option>{/each}
                </select>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
