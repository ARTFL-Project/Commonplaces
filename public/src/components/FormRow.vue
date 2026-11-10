<template>
  <div class="col-12">
    <div class="row search-field">
      <div class="col-12 col-sm-3">{{ label }}</div>
      <div class="col-12 col-sm-9 position-relative">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ label: String })
</script>
