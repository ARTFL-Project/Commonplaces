<template>
  <div ref="root" class="d-inline-block" :class="up ? 'dropup' : 'dropdown'">
    <button type="button" class="btn btn-default dropdown-toggle" :aria-expanded="open" @click="open = !open">
      {{ label }}
    </button>
    <ul class="dropdown-menu" :class="{ show: open }" data-bs-popper="static">
      <li v-for="option in options" :key="option.value">
        <a class="dropdown-item" href="#" @click.prevent="choose(option.value)">{{ option.label }}</a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({ label: String, options: Array, up: Boolean })
const emit = defineEmits(['select'])
const open = ref(false)
const root = ref(null)

function choose(value) {
  open.value = false
  emit('select', value)
}

function closeOutside(event) {
  if (!root.value.contains(event.target)) open.value = false
}

onMounted(() => document.addEventListener('click', closeOutside))
onBeforeUnmount(() => document.removeEventListener('click', closeOutside))
</script>
