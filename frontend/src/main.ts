import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import 'nprogress/nprogress.css'
import '@styles/index.scss'
import App from './App.vue'
import router from './router'
import directive from './directive'
import { setupStore, initStorePersistence } from './store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
setupStore(app)
initStorePersistence()
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default'
})
directive(app)

app.mount('#app')
