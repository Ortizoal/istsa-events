<script lang="ts">
  import type { Snippet } from 'svelte';
  import Spinner from './Spinner.svelte';
  import { cn } from '#lib/utils';

  type Variant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger';
  type Size = 'sm' | 'md' | 'lg';

  interface Props {
    variant?: Variant;
    size?: Size;
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    full?: boolean;
    class?: string;
    onclick?: (event: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    href,
    type = 'button',
    disabled = false,
    loading = false,
    full = false,
    class: klass = '',
    onclick,
    children
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

  const variants: Record<Variant, string> = {
    primary: 'bg-navy-700 text-white hover:bg-navy-600 focus-visible:outline-navy-700',
    gold: 'bg-gold-400 text-navy-900 hover:bg-gold-300 focus-visible:outline-gold-500',
    secondary: 'border border-slate-300 bg-white text-navy-800 hover:bg-slate-50',
    ghost: 'text-navy-700 hover:bg-navy-50',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600'
  };

  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const classes = $derived(
    cn(base, variants[variant], sizes[size], full && 'w-full', disabled && 'pointer-events-none', klass)
  );
</script>

{#if href && !disabled}
  <a {href} class={classes} {onclick}>
    {#if loading}<Spinner />{/if}
    {@render children()}
  </a>
{:else}
  <button {type} {disabled} class={classes} {onclick}>
    {#if loading}<Spinner />{/if}
    {@render children()}
  </button>
{/if}
