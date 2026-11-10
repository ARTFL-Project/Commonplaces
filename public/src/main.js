import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/style.css'
import App from './App.vue'
import router from './router'
import { webConfig } from './store'

const config = await fetch('/config/config.json')
  .then((response) => response.json())
  .catch(() => ({}))
Object.assign(webConfig, config, { modules: ['None', ...(config.modules || [])] })

const app = createApp(App).use(router)
await router.isReady()
app.mount('#app')
