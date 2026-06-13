import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './router/guard'
import pinia from './store'
import './styles/index.scss'

import HTable from '@/components/HTable/index.vue'
import HInput from '@/components/HInput/index.vue'
import HModal from '@/components/HModal/index.vue'
import BackToTop from '@/components/BackToTop/index.vue'

import permissionDirective from '@/directives/permission'
import rippleDirective from '@/directives/ripple'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.component('HTable', HTable)
app.component('HInput', HInput)
app.component('HModal', HModal)
app.component('BackToTop', BackToTop)

app.directive('permission', permissionDirective)
app.directive('ripple', rippleDirective)

app.use(ElementPlus, { locale: zhCn })
app.use(pinia)
app.use(router)

app.mount('#app')
