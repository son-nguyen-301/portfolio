<script setup lang="ts">
const { data: profile } = await useProfile()
</script>

<template>
  <h1>{{ profile?.name }}</h1>
</template>
