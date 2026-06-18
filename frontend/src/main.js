import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './store'
import './styles/index.scss'
import vRipple from './utils/ripple'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.directive('ripple', vRipple)

app.mount('#app')
