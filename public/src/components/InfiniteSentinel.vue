<template>
  <div ref="el" style="height: 1px"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits(['visible'])
const el = ref(null)
let observer

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => entry.isIntersecting && emit('visible'), {
    rootMargin: '0px 0px 100% 0px',
  })
  observer.observe(el.value)
})
onBeforeUnmount(() => observer.disconnect())
</script>
