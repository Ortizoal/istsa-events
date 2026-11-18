<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  interface Props {
    open: boolean;
    title?: string;
    onclose: () => void;
    children: Snippet;
    footer?: Snippet;
    size?: 'sm' | 'md' | 'lg';
  }

  let { open, title, onclose, children, footer, size = 'md' }: Props = $props();

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) onclose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
    <div
      class="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
      transition:fade={{ duration: 120 }}
      onclick={onclose}
      role="presentation"
    ></div>
    <div
      class="istsa-card relative z-10 w-full {widths[size]} max-h-[92vh] overflow-y-auto rounded-b-none p-5 sm:rounded-2xl"
      transition:fly={{ y: 24, duration: 180 }}
      role="dialog"
      aria-modal="true"
    >
      {#if title}
        <div class="mb-4 flex items-start justify-between gap-4">
          <h2 class="text-lg font-semibold text-navy-900">{title}</h2>
          <button
            class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onclick={onclose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              ><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      {/if}
      {@render children()}
      {#if footer}
        <div class="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
