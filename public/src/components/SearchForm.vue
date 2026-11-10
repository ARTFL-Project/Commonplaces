<template>
  <div id="search-form">
    <form @submit.prevent="submit">
      <div id="metadata-search" class="panel" :class="{ collapsed: !state.formOpen }">
        <button type="button" class="btn-close" :class="{ closed: !state.formOpen }" aria-label="Close"
          @click="state.formOpen = false"></button>
        <h4 @click="state.formOpen = !state.formOpen">Search all Shared Passages</h4>
        <SlideTransition>
          <div v-show="state.formOpen">
            <div class="search-note">
              <span class="exclamation-point">&#33;</span> <span class="note-anchor">
                <a href="#" role="button" @click.prevent="note = !note" @blur="note = false">Important note about searching</a>
                <div v-if="note" class="popover">
                  <h3 class="popover-header">Query Syntax</h3>
                  <div class="popover-body">
                    <p>For multiple-term queries, you need to separate words with the <b>OR</b> operator for an
                      optional match.<br>Example: <tt>liberty OR people</tt></p>
                    <p>You can also negate a match by adding <b>NOT</b> before a word.<br>Example: <tt>liberty NOT people</tt></p>
                    <p>Any sorting will considerably slow down response times</p>
                  </div>
                </div>
              </span>
            </div>
            <div class="row m-0">
              <div class="col-12 col-sm-6">
                <div class="row panel earlier">
                  <h5><b>Earlier Use of Passages</b></h5>
                  <FormRow label="Inside passages:">
                    <input v-model="form.sourcematchcontext" class="form-control" type="text">
                  </FormRow>
                  <FormRow label="Author:">
                    <div v-if="hasLists" class="input-group">
                      <input v-model="form.sourceauthor" class="form-control" type="text">
                      <button class="btn btn-default list-button" type="button" @click="toggleList('topAuthors')">Top 250<br>Authors*</button>
                      <button class="btn btn-default list-button" type="button" @click="toggleList('latinAuthors')">List Latin<br>authors</button>
                    </div>
                    <input v-else v-model="form.sourceauthor" class="form-control" type="text">
                    <div v-if="hasLists && list && list !== 'topTitles'" class="panel latin-list">
                      <ul class="list-group">
                        <li v-for="(author, index) in webConfig[list]" :key="index" class="list-group-item">
                          <a href="#" @click.prevent="fill('sourceauthor', author)">{{ author }}</a>
                        </li>
                      </ul>
                    </div>
                  </FormRow>
                  <FormRow label="Title:">
                    <div class="input-group">
                      <input v-model="form.sourcetitle" class="form-control" type="text">
                      <button class="btn btn-default list-button" type="button" @click="toggleList('topTitles')">Top 250<br>Titles*</button>
                    </div>
                    <div v-if="list === 'topTitles'" class="panel latin-list">
                      <ul class="list-group">
                        <li v-for="(title, index) in webConfig.topTitles" :key="index" class="list-group-item">
                          <a href="#" @click.prevent="fill('sourcetitle', title)">{{ title }}</a>
                        </li>
                      </ul>
                    </div>
                  </FormRow>
                  <FormRow label="Module Name:">
                    <DropdownSelect :label="moduleLabel('sourcemodulename')" :options="moduleOptions"
                      @select="selectModule('sourcemodulename', $event)" />
                  </FormRow>
                  <FormRow v-if="db !== 'latin'" label="Date:">
                    <input v-model="form.sourcedate" class="form-control" type="text">
                  </FormRow>
                  <FormRow label="Match Size:">
                    <input v-model="form.sourcematchsize" class="form-control" placeholder="e.g., 10-100" type="text">
                  </FormRow>
                  <span class="text-center">*by frequency of first use</span>
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="row panel later">
                  <h5><b>Later Use of Passages</b></h5>
                  <FormRow label="Inside passages:">
                    <input v-model="form.targetmatchcontext" class="form-control" type="text">
                  </FormRow>
                  <FormRow label="Author:">
                    <input v-model="form.targetauthor" class="form-control" type="text">
                  </FormRow>
                  <FormRow label="Title:">
                    <input v-model="form.targettitle" class="form-control" type="text">
                  </FormRow>
                  <FormRow label="Module Name:">
                    <DropdownSelect :label="moduleLabel('targetmodulename')" :options="moduleOptions"
                      @select="selectModule('targetmodulename', $event)" />
                  </FormRow>
                  <FormRow label="Date:">
                    <input v-model="form.targetdate" class="form-control" type="text">
                  </FormRow>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-12 col-sm-10">
                <div class="search-field">
                  Sort results by:
                  <DropdownSelect up :label="sortLabel" :options="sortOptions" @select="form.sorting = $event" />
                  <span v-if="db !== 'latin'" class="ms-2">
                    Bible Filter:
                    <DropdownSelect up :label="bibleLabel" :options="bibleOptions" @select="form.bible = $event" />
                  </span>
                  <label v-if="webConfig.debug" class="ms-2">
                    <input v-model="form.duplicates" true-value="ignore" false-value="" type="checkbox">
                    Ignore matches from duplicate works
                  </label>
                </div>
              </div>
              <div class="col-12 col-sm-2">
                <div class="search-field">
                  <div class="btn-group float-end" role="group">
                    <button type="button" class="btn btn-default" @click="clear">Clear</button>
                    <button class="btn btn-primary" type="submit">Search</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SlideTransition>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, ref, toRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { state, webConfig } from '../store'
import DropdownSelect from './DropdownSelect.vue'
import FormRow from './FormRow.vue'
import SlideTransition from './SlideTransition.vue'

const route = useRoute()
const router = useRouter()
const form = toRef(state, 'formData')
const db = computed(() => route.params.dbname || 'ecco')
const hasLists = computed(() => db.value === 'latin' || db.value === 'ecco')
const note = ref(false)
const list = ref(null)

const sortOptions = [
  { value: -1, label: 'No Sorting' },
  { value: 0, label: 'Commonplace Probability' },
  { value: 1, label: 'Target date, author' },
  { value: 2, label: 'Source date, author' },
  { value: 3, label: 'Target author' },
  { value: 4, label: 'Source author' },
]
const bibleOptions = [
  { value: 'ignore', label: 'Filter out Bible sources' },
  { value: 'only', label: 'Filter out non-Bible sources' },
  { value: 'all', label: 'No filter' },
]
const moduleOptions = webConfig.modules.map((name) => ({ value: name, label: name }))

const sortLabel = computed(() => sortOptions.find((o) => o.value === Number(form.value.sorting ?? -1))?.label)
const bibleLabel = computed(() => bibleOptions.find((o) => o.value === form.value.bible)?.label ?? 'No filter')
const moduleLabel = (key) => form.value[key]?.replace(/"/g, '') || 'None'

function selectModule(key, name) {
  if (name === 'None') delete form.value[key]
  else form.value[key] = `"${name}"`
}

function toggleList(name) {
  list.value = list.value === name ? null : name
}

function fill(field, value) {
  form.value[field] = `"${value}"`
  list.value = null
}

function clear() {
  state.formData = { duplicates: '', sorting: -1 }
}

function submit() {
  const query = Object.fromEntries(
    Object.entries(form.value).filter(([key, value]) => value != null && value !== '' && (key !== 'duplicates' || value === 'ignore')),
  )
  if (!Object.keys(query).some((key) => !['duplicates', 'sorting'].includes(key) && query[key] !== 'all')) {
    alert("You haven't searched for anything, please fill in one of the search boxes")
    return
  }
  state.formOpen = false
  router.push({ path: `/nav/${db.value}/query/search`, query: { sorting: -1, ...query } })
}
</script>
