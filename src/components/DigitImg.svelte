<script lang="ts">
  /** Một ảnh xám nhỏ (8×8, 28×28, …) hiển thị dạng bitmap phóng to giữ nguyên điểm ảnh. Chế độ "diverging" cho giá trị âm/dương. */
  import { bitmapURL } from '../lib/bitmap';
  let {
    px, side = 8, size = 64, max = 16, diverging = false, label = 'Ảnh chữ số',
  }: { px: number[]; side?: number; size?: number; max?: number; diverging?: boolean; label?: string; grid?: boolean } = $props();
  const src = $derived(bitmapURL(px, side, { max, diverging }));
</script>

<img class="dimg" {src} width={size} height={size} alt={label} />

<style>
  .dimg { display: block; border: 1px solid var(--rule-2); image-rendering: pixelated; image-rendering: crisp-edges; }
  :global(:root[data-theme='dark']) .dimg { filter: invert(0.92) hue-rotate(180deg); }
  @media (prefers-color-scheme: dark) { :global(:root:not([data-theme='light'])) .dimg { filter: invert(0.92) hue-rotate(180deg); } }
</style>
