<script setup lang="ts">
import { themes } from '#shared/theme'
import type { Theme } from '#shared/theme'

const { theme, setTheme } = useTheme()

const labels: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' }
</script>

<template>
  <div
    class="theme-switch"
    role="group"
    aria-label="Theme"
  >
    <button
      v-for="option in themes"
      :key="option"
      type="button"
      class="theme-switch__option"
      :aria-pressed="theme === option"
      @click="setTheme(option)"
    >
      {{ labels[option] }}
    </button>
  </div>
</template>

<style scoped>
.theme-switch {
  display: inline-flex;
  align-self: flex-start;
  width: fit-content;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper);
}

.theme-switch__option {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
}

.theme-switch__option:hover {
  color: var(--ink);
}

.theme-switch__option[aria-pressed="true"] {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 0 0 1px var(--line);
}
</style>
