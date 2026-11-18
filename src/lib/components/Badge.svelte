<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '#lib/utils';

  type Tone = 'navy' | 'gold' | 'green' | 'red' | 'slate' | 'blue';

  interface Props {
    tone?: Tone;
    class?: string;
    children: Snippet;
  }

  let { tone = 'slate', class: klass = '', children }: Props = $props();

  const tones: Record<Tone, string> = {
    navy: 'bg-navy-50 text-navy-700 ring-navy-200',
    gold: 'bg-gold-50 text-gold-800 ring-gold-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200'
  };
</script>

<span
  class={cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
    tones[tone],
    klass
  )}
>
  {@render children()}
</span>
