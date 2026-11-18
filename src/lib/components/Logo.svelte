<script lang="ts">
  interface Props {
    size?: number;
    class?: string;
  }
  let { size = 40, class: klass = '' }: Props = $props();
</script>

<!-- ISTSA crest — replace static/istsa-logo.png with your logo file, then restart the dev server. -->
<img
  src="/istsa-logo.png"
  alt="ISTSA crest"
  width={size}
  height={size}
  class={klass}
  role="img"
  aria-label="ISTSA crest"
/>
