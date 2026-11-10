<template>
  <div id="full-text-container">
    <button v-if="!facetVisible" type="button" class="btn btn-primary show-facets" @click="facetVisible = true">
      Show Facet Selection
    </button>
    <div class="row">
      <div id="full-text-results" :class="facetVisible ? 'col-12 col-sm-7 col-md-9' : 'col-12'">
        <LoadingSpinner :show="loading" />
        <h4 v-if="failed">The search could not be completed.</h4>
        <h4 v-else-if="!loading">
          Your query returned
          <span v-if="totalCount === null" class="dots"><span>.</span><span>.</span><span>.</span></span>
          {{ totalCount }} shared passages
        </h4>
        <div v-for="(result, index) in results" :key="index" class="panel result alignment">
          <h5 class="result-number">{{ index + 1 }}</h5>
          <div v-if="result.authorident == 1" class="bible-quote">
            <span class="info"><img :src="lightbulb" alt="" height="25" width="25"></span>&nbsp;
            <b>This is probably a Bible quote</b>
          </div>
          <div class="row">
            <div v-for="side in sides" :key="side.key" class="col-12 col-sm-6" :class="`${side.key}-alignment`">
              <h4 class="passage-header">{{ side.label }}</h4>
              <h5>
                <b>{{ result[`${side.key}Author`] }}</b>, <i>{{ result[`${side.key}Title`] }}</i>&nbsp;
                <b>[{{ result[`${side.key}Date`] }}]</b>
              </h5>
              <p>
                {{ result[`${side.key}LeftContext`] }}
                <span class="highlight">{{ result[`${side.key}MatchContext`] }}</span>
                {{ result[`${side.key}RightContext`] }}
              </p>
            </div>
          </div>
          <div v-if="result.passageIDCount > 1">
            <router-link :to="`/nav/${db}/passage/${result.passageID}`">
              View similar passages in timeline
              <span v-if="webConfig.debug">({{ result.passageIDCount }} PhiloLine matching pairs)</span>
            </router-link>
          </div>
        </div>
        <InfiniteSentinel v-if="hasMore" :key="results.length" @visible="loadMore" />
        <div v-show="loadingMore" class="text-center">
          <h4>Loading data<span class="dots"><span>.</span><span>.</span><span>.</span></span></h4>
        </div>
      </div>
      <div id="facet-container" class="d-none" :class="{ 'd-sm-block col-sm-5 col-md-3': facetVisible }">
        <FacetSearch @hide="facetVisible = false" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import lightbulb from '../assets/lightbulb.png'
import { getJSON, state, webConfig } from '../store'
import FacetSearch from './FacetSearch.vue'
import InfiniteSentinel from './InfiniteSentinel.vue'
import LoadingSpinner from './LoadingSpinner.vue'

const PAGE_SIZE = 40
const sides = [
  { key: 'source', label: 'earlier use' },
  { key: 'target', label: 'later use' },
]

const route = useRoute()
const db = route.params.dbname
const query = { ...route.query }
state.formData = { ...query }

const results = ref([])
const totalCount = ref(null)
const loading = ref(true)
const failed = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const facetVisible = ref(true)

async function fetchPage(offset) {
  const data = await getJSON(`/api/${db}/fulltext`, offset ? { ...query, offset } : query)
  const rows = data.fullList || []
  results.value.push(...rows)
  hasMore.value = rows.length >= PAGE_SIZE
}

async function load() {
  try {
    await fetchPage(0)
  } catch {
    failed.value = true
    return
  } finally {
    loading.value = false
  }
  totalCount.value = await getJSON(`/api/${db}/fulltextcount`, query)
    .then((data) => data.totalCount)
    .catch(() => '?')
}

async function loadMore() {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    await fetchPage(results.value.length)
  } catch {
    hasMore.value = false
  } finally {
    loadingMore.value = false
  }
}

load()
</script>
