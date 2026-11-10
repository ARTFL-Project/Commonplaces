<template>
  <LoadingSpinner :show="!results && !failed" />
  <h4 v-if="failed">This passage could not be loaded.</h4>
  <div v-if="results" id="results" class="panel">
    <div id="main-passage">
      <i>"{{ commonplace.matchContext }}"</i><br>
      {{ commonplace.author }}
      <div v-if="commonplace.authorident == 1" class="bible-note">
        <span class="info"><img :src="lightbulb" alt="" height="25" width="25"></span>
        <b>This is probably a Bible quote</b>
      </div>
    </div>
    <div class="btn-group w-100 view-switch" role="group">
      <button type="button" class="btn btn-primary" :class="{ active: view !== 'timeline' }" @click="view = 'timeline'">
        Use Throughout Time
      </button>
      <button type="button" class="btn btn-primary" :class="{ active: view !== 'uniqueTitles' }"
        @click="view = 'uniqueTitles'">
        All titles in which it occurs...
      </button>
    </div>
    <PassageTimeline v-if="view === 'timeline'" :timeline="results.titleList" />
    <UniqueTitles v-else :passages="results.passageList" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import lightbulb from '../assets/lightbulb.png'
import { getJSON } from '../store'
import LoadingSpinner from './LoadingSpinner.vue'
import PassageTimeline from './PassageTimeline.vue'
import UniqueTitles from './UniqueTitles.vue'

const route = useRoute()
const results = ref(null)
const failed = ref(false)
const view = ref('timeline')
const commonplace = computed(() => results.value?.titleList?.[0]?.result?.[0] ?? {})

getJSON(`/api/${route.params.dbname}/commonplaces/${route.params.passageID}`)
  .then((data) => {
    results.value = data
  })
  .catch(() => {
    failed.value = true
  })
</script>
