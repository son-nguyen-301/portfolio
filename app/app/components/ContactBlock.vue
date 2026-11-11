<script setup lang="ts">
// The ways to reach Son: the booking button, the email with a Copy button,
// working hours and the reply promise (docs/design.md, ContactBlock).
//
// The built page holds only the Upwork version: "Message me on Upwork". The
// email and the booking link are in no page file. After mount, and only when
// the visit is not in Upwork mode, the block downloads them
// (app/utils/contact.ts) and shows them instead. With JavaScript off, or in
// Upwork mode, the Upwork version stays (docs/brief.md, Upwork mode).
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useUpworkMode } from '../composables/useUpworkMode'
import { loadContactDetails } from '../utils/contact'
import type { ContactDetails } from '../utils/contact'
import AppButton from './AppButton.vue'

defineProps<{
  // profile.links.upwork
  upwork: string
  // profile.hours.label, for example "08:00 to 22:00 Hanoi time (UTC+7)"
  hours: string
  replyPromise: string
}>()

const upworkMode = useUpworkMode()
const details = ref<ContactDetails>()

// Runs after useUpworkMode() has read the mode, which registered its own
// onMounted first.
onMounted(async () => {
  if (upworkMode.value) return
  const loaded = await loadContactDetails()
  // Upwork mode can't turn on later in a visit without a new mount, but check
  // again so the details never show next to it.
  if (loaded && !upworkMode.value) details.value = loaded
})

const email = ref<HTMLElement | null>(null)
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

// Copy the email. If the clipboard is blocked or missing, select the email
// text instead, so the visitor can copy it by hand.
async function copyEmail() {
  if (!details.value) return
  try {
    await navigator.clipboard.writeText(details.value.email)
  }
  catch {
    selectEmail()
    return
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 2000)
}

function selectEmail() {
  const selection = window.getSelection()
  if (!email.value || !selection) return
  selection.selectAllChildren(email.value)
}

onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <section
    class="contact-block"
    aria-label="Contact details"
  >
    <template v-if="details">
      <div class="contact-block__group">
        <p class="label">
          Book a call
        </p>
        <div>
          <AppButton
            :to="details.booking.url"
            variant="action"
            data-track="book-call"
          >
            {{ details.booking.label }}
          </AppButton>
        </div>
      </div>
      <div class="contact-block__group">
        <p class="label">
          Or email me
        </p>
        <div class="contact-block__email-row">
          <span
            ref="email"
            class="contact-block__email"
          >{{ details.email }}</span>
          <AppButton
            variant="ghost"
            class="contact-block__copy"
            aria-live="polite"
            data-track="copy-email"
            @click="copyEmail"
          >
            {{ copied ? 'Copied' : 'Copy email' }}
          </AppButton>
        </div>
      </div>
    </template>
    <div
      v-else
      class="contact-block__group"
    >
      <p class="label">
        Talk on Upwork
      </p>
      <div>
        <AppButton
          :to="upwork"
          variant="action"
          data-track="message-upwork"
        >
          Message me on Upwork
        </AppButton>
      </div>
    </div>

    <div class="contact-block__hours">
      <p><strong>{{ replyPromise }}</strong></p>
      <p class="contact-block__muted">
        I work {{ hours }}.
      </p>
    </div>
  </section>
</template>

<style scoped>
.contact-block {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.contact-block__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-block__email-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.contact-block__email {
  min-width: 0;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  overflow-wrap: anywhere;
}

.contact-block__copy {
  min-width: 120px;
}

.contact-block__hours {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.contact-block__muted {
  color: var(--muted);
}

@media (max-width: 480px) {
  .contact-block {
    padding: 20px;
  }
}
</style>
