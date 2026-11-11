<script setup lang="ts">
// A placeholder until PF-011 builds the home page. It already shows the time
// overlap clock, so its browser tests cover a real page.
const { data: profile } = await useProfile('name', 'location', 'utcOffset', 'hours')

// "Hanoi, Vietnam" -> "Hanoi"
const city = computed(() => profile.value?.location.split(',')[0]?.trim() ?? '')
</script>

<template>
  <div class="home-page">
    <h1>{{ profile?.name }}</h1>
    <TimeOverlap
      v-if="profile"
      :city="city"
      :utc-offset="profile.utcOffset"
      :start="profile.hours.start"
      :end="profile.hours.end"
    />
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 420px;
}
</style>
