<script lang="ts">
  import type { EventQuestion } from '#lib/types';

  interface Props {
    question: EventQuestion;
    value: string | string[];
    onupdate: (value: string | string[]) => void;
  }

  let { question, value, onupdate }: Props = $props();

  function toggleOption(option: string, checked: boolean) {
    const current = Array.isArray(value) ? [...value] : [];
    onupdate(checked ? [...current, option] : current.filter((v) => v !== option));
  }

  const text = $derived(typeof value === 'string' ? value : '');
  const list = $derived(Array.isArray(value) ? value : []);
</script>

<div class="space-y-2">
  <label class="istsa-label" for={`q-${question.id}`}>
    {question.label}
    {#if question.required}<span class="text-red-500">*</span>{/if}
  </label>

  {#if question.type === 'short_text'}
    <input
      id={`q-${question.id}`}
      class="istsa-input"
      type="text"
      required={question.required}
      value={text}
      oninput={(e) => onupdate(e.currentTarget.value)}
    />
  {:else if question.type === 'long_text'}
    <textarea
      id={`q-${question.id}`}
      class="istsa-input min-h-24"
      required={question.required}
      value={text}
      oninput={(e) => onupdate(e.currentTarget.value)}
    ></textarea>
  {:else if question.type === 'single_choice'}
    <div class="space-y-1.5">
      {#each question.options ?? [] as option}
        <label class="flex cursor-pointer items-center gap-2 text-sm text-navy-800">
          <input
            type="radio"
            name={`q-${question.id}`}
            value={option}
            checked={value === option}
            onchange={() => onupdate(option)}
            required={question.required}
            class="accent-navy-700"
          />
          {option}
        </label>
      {/each}
    </div>
  {:else if question.type === 'multi_choice'}
    <div class="space-y-1.5">
      {#each question.options ?? [] as option}
        <label class="flex cursor-pointer items-center gap-2 text-sm text-navy-800">
          <input
            type="checkbox"
            value={option}
            checked={list.includes(option)}
            onchange={(e) => toggleOption(option, e.currentTarget.checked)}
            class="accent-navy-700"
          />
          {option}
        </label>
      {/each}
    </div>
  {:else if question.type === 'checkbox'}
    <label class="flex cursor-pointer items-center gap-2 text-sm text-navy-800">
      <input
        type="checkbox"
        checked={value === 'Yes'}
        onchange={(e) => onupdate(e.currentTarget.checked ? 'Yes' : '')}
        required={question.required}
        class="accent-navy-700"
      />
      Yes, that applies to me
    </label>
  {/if}

  {#if question.helpText}<p class="istsa-help">{question.helpText}</p>{/if}
</div>
