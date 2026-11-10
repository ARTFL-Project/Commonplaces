<template>
  <div id="unique-authors">
    <h5 class="text-white">Variants of this passage occur in {{ passages.length }} different titles...</h5>
    <div v-for="(result, index) in passages.slice(0, limit)" :key="index" class="panel result">
      <h5>
        {{ index + 1 }}.&nbsp;<b>{{ result.author }}</b>, <i>{{ result.title }}</i>&nbsp;<b>[{{ result.date }}]</b>
      </h5>
      <p>
        {{ result.leftContext }}
        <span class="highlight">{{ result.matchContext }}</span>
        {{ result.rightContext }}
      </p>
    </div>
    <InfiniteSentinel v-if="limit < passages.length" :key="limit" @visible="limit += 20" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InfiniteSentinel from './InfiniteSentinel.vue'

defineProps({ passages: Array })
const limit = ref(20)
</script>
