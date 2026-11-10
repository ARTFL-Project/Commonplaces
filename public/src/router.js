import { createRouter, createWebHistory } from 'vue-router'
import FullTextResults from './components/FullTextResults.vue'
import PassageResults from './components/PassageResults.vue'
import { state } from './store'

const Empty = { render: () => null }

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/nav/:dbname/query/search', component: FullTextResults, meta: { collapse: true } },
    { path: '/nav/:dbname/passage/:passageID', component: PassageResults, meta: { collapse: true } },
    { path: '/nav/:dbname/:rest(.*)*', component: Empty },
    { path: '/:rest(.*)*', component: Empty },
  ],
})

router.afterEach((to) => {
  state.formOpen = !to.meta.collapse
})

export default router
