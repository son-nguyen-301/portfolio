<script setup lang="ts">
// The contact page (PF-019, docs/design/Contact.dc.html): the label, the
// heading, the pricing line, the contact block and the time overlap clock.
// The label and the heading are written here and hold no fact (D-024). The
// line under the heading is `pricing` from the profile, not the design's
// sentence, which is not in content (D-035).
//
// The profile fields are named one by one, and never `email` or `booking`:
// ContactBlock gets those after mount, outside Upwork mode (D-021). In Upwork
// mode the block shows only "Message me on Upwork".
const { data: profile } = await useProfile('location', 'utcOffset', 'hours', 'replyPromise', 'links', 'pricing')

const city = computed(() => locationCity(profile.value?.location ?? ''))

useSeoMeta({
  title: 'Contact',
  description: () => (profile.value ? metaDescription(profile.value.pricing, profile.value.replyPromise) : undefined),
})
</script>

<template>
  <div
    v-if="profile"
    class="contact-page"
  >
    <div class="contact-page__head">
      <p class="label">
        Contact
      </p>
      <h1>Tell me what you are building</h1>
      <p class="lead">
        {{ profile.pricing }}
      </p>
    </div>

    <div class="contact-page__cols">
      <ContactBlock
        :upwork="profile.links.upwork"
        :hours="profile.hours.label"
        :reply-promise="profile.replyPromise"
      />
      <TimeOverlap
        :city="city"
        :utc-offset="profile.utcOffset"
        :start="profile.hours.start"
        :end="profile.hours.end"
      />
    </div>
  </div>
</template>

<style scoped>
.contact-page {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-bottom: 64px;
}

.contact-page__head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 640px;
}

.contact-page__cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

/* Two columns from 960 px, as in the home hero. The clock column is at least
   440 px, so a long city such as "Los Angeles" fits in the "Your time" label. */
@media (min-width: 960px) {
  .contact-page__cols {
    grid-template-columns: minmax(0, 1.3fr) minmax(440px, 1fr);
  }
}
</style>
