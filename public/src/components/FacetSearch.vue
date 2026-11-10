<template>
  <div id="facet-search">
    <div id="facet-selection" class="panel clearfix">
      <button type="button" class="btn btn-primary btn-sm close-facets" @click="$emit('hide')">X</button>
      <h4 id="facet-header">browse by facet</h4>
      <div v-if="showSelection" class="list-group">
        <template v-for="group in groups" :key="group.key">
          <div class="dropdown-header facet-divider">{{ group.label }}</div>
          <a v-for="facet in facets" :key="facet.key" class="list-group-item list-group-item-action" href="#"
            @click.prevent="getFacet(group.key + facet.key)">{{ facet.label }}</a>
        </template>
      </div>
      <button v-else type="button" class="btn btn-default float-end dropdown-toggle show-selection"
        aria-label="Show facets" @click="showSelection = true"></button>
      <LoadingSpinner :show="loading" />
    </div>
    <div v-if="facetData" class="panel facet-results">
      <button type="button" class="btn btn-primary btn-sm close-facets" @click="closeFacets">X</button>
      <h5 class="text-center">Top 100 results</h5>
      <ul class="list-group">
        <li v-for="(result, index) in facetData" :key="index" class="list-group-item d-flex justify-content-between">
          <a href="#" class="me-2" @click.prevent="goToResult(result.facet)">{{ result.facet }}</a>
          <span>{{ result.count }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getJSON } from '../store'
import LoadingSpinner from './LoadingSpinner.vue'

defineEmits(['hide'])

const groups = [
  { key: 'source', label: 'Earlier Use' },
  { key: 'target', label: 'Later Use' },
]
const facets = [
  { key: 'author', label: 'Author' },
  { key: 'title', label: 'Title' },
  { key: 'modulename', label: 'Module' },
  { key: 'date', label: 'Date (decade)' },
]

const route = useRoute()
const router = useRouter()
const showSelection = ref(true)
const loading = ref(false)
const facetData = ref(null)
let selectedFacet = ''

async function getFacet(facet) {
  loading.value = true
  selectedFacet = facet
  showSelection.value = false
  try {
    facetData.value = await getJSON(`/api/${route.params.dbname}/fulltextfacet`, { ...route.query, facet })
  } catch {
    showSelection.value = true
  } finally {
    loading.value = false
  }
}

function closeFacets() {
  facetData.value = null
  showSelection.value = true
}

function goToResult(value) {
  router.push({ path: route.path, query: { ...route.query, [selectedFacet]: `"${value}"` } })
}
</script>
