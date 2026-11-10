<script setup lang="ts">
// A button, or a link that looks like one when `to` is set.
// primary: ink fill. action: jade fill. ghost: border only.
withDefaults(defineProps<{
  variant?: 'primary' | 'action' | 'ghost'
  // A route ("/services") or a full URL. NuxtLink opens full URLs as plain links.
  to?: string
  type?: 'button' | 'submit'
}>(), {
  variant: 'primary',
  to: undefined,
  type: 'button',
})
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="['app-button', `app-button--${variant}`]"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :class="['app-button', `app-button--${variant}`]"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: var(--text-body);
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, opacity 0.15s;
}

.app-button:hover {
  text-decoration: none;
  opacity: 0.88;
}

.app-button--primary {
  background: var(--ink);
  color: var(--paper);
}

.app-button--action {
  background: var(--jade);
  color: var(--on-jade);
}

.app-button--ghost {
  background: transparent;
  border-color: var(--line);
  color: var(--ink);
}

.app-button--ghost:hover {
  opacity: 1;
  border-color: var(--muted);
}
</style>
