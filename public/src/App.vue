<template>
  <nav class="navbar navbar-expand-sm navbar-dark fixed-top">
    <div class="container">
      <a class="navbar-brand" href="https://commonplacecultures.org/">Commonplace Cultures</a>
      <button type="button" class="navbar-toggler" aria-controls="navbar" :aria-expanded="navOpen"
        aria-label="Toggle navigation" @click="navOpen = !navOpen">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div id="navbar" class="collapse navbar-collapse" :class="{ show: navOpen }">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item"><a class="nav-link" href="http://artfl-project.uchicago.edu/" target="_blank">The ARTFL Project</a></li>
          <li class="nav-item"><a class="nav-link" href="http://www.oerc.ox.ac.uk/" target="_blank">Oxford e-Research Centre</a></li>
        </ul>
      </div>
    </div>
  </nav>
  <div class="container-fluid main">
    <SearchForm />
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchForm from './components/SearchForm.vue'

const navOpen = ref(false)
</script>
