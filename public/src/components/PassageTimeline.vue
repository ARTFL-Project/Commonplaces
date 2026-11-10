<template>
  <div id="timeline-view">
    <div id="timeline-chart">
      <div class="chart-box"><canvas ref="canvas"></canvas></div>
    </div>
    <div id="timeline-container">
      <div v-for="(date, i) in timeline.slice(0, limit)" :key="date.date" class="timeline-dates">
        <div class="btn btn-lg btn-default active">{{ date.date }}</div>
        <div v-for="(event, j) in date.result" :key="j" class="timeline-events">
          <h5 class="event-link" @click.prevent="toggle(`${i}-${j}`)">
            <a href="#">{{ event.author }}<br><i>{{ formatTitle(event.title) }}</i></a>
          </h5>
          <SlideTransition :duration="400">
            <p v-show="open.has(`${i}-${j}`)" class="timeline-text-content">
              {{ event.leftContext }}
              <span class="highlight">{{ event.matchContext }}</span>
              {{ event.rightContext }}
            </p>
          </SlideTransition>
        </div>
      </div>
      <InfiniteSentinel v-if="limit < timeline.length" :key="limit" @visible="limit += 5" />
    </div>
  </div>
</template>

<script setup>
import { CategoryScale, Chart, Filler, LinearScale, LineController, LineElement, PointElement } from 'chart.js'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import InfiniteSentinel from './InfiniteSentinel.vue'
import SlideTransition from './SlideTransition.vue'

Chart.register(CategoryScale, Filler, LinearScale, LineController, LineElement, PointElement)

const props = defineProps({ timeline: Array })
const canvas = ref(null)
const limit = ref(5)
const open = reactive(new Set())
let chart

function decade(date) {
  let start = `${date}`.slice(0, -1) + '0'
  if (start === '-0') start = '-10'
  return `${parseInt(start)}-${parseInt(start) + 9}`
}

function toggle(key) {
  if (!open.delete(key)) open.add(key)
}

function formatTitle(title) {
  if (title.length <= 300) return title
  return title.slice(0, 300).split(' ').slice(0, -1).join(' ') + ' [...]'
}

onMounted(() => {
  const counts = new Map()
  for (const { date, result } of props.timeline) {
    counts.set(decade(date), (counts.get(decade(date)) || 0) + result.length)
  }
  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: [...counts.keys()],
      datasets: [{
        data: [...counts.values()],
        fill: true,
        backgroundColor: 'rgba(224, 108, 112, .2)',
        borderColor: 'rgba(207, 100, 103, 1)',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#fff',
        pointRadius: 1,
        tension: 0.1,
      }],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#fff' } },
        y: { grid: { color: 'rgba(255, 255, 255, .1)' }, ticks: { color: '#fff', precision: 0 } },
      },
    },
  })
})
onBeforeUnmount(() => chart?.destroy())
</script>
