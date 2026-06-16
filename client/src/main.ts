import { createApp, type App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import {
  ElButton,
  ElInput,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessage,
  ElMessageBox,
  ElNotification,
  ElMenu,
  ElMenuItem,
  ElSubMenu,
  ElIcon,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElCard,
  ElTag,
  ElLoading,
  ElEmpty,
  ElDatePicker,
  ElOption,
  ElRow,
  ElCol,
  ElTooltip,
  ElBadge,
  ElAvatar,
  ElDivider,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElScrollbar,
  ElConfigProvider
} from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/index.scss'
import { vPermission } from '@/utils/permission'

const components = [
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMenu,
  ElMenuItem,
  ElSubMenu,
  ElIcon,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElCard,
  ElTag,
  ElEmpty,
  ElDatePicker,
  ElRow,
  ElCol,
  ElTooltip,
  ElBadge,
  ElAvatar,
  ElDivider,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElScrollbar,
  ElConfigProvider
]

const plugins = [ElLoading, ElMessage, ElMessageBox, ElNotification]

const app: VueApp = createApp(App)

app.use(createPinia())
app.use(router)

app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$msgbox = ElMessageBox
app.config.globalProperties.$notify = ElNotification
app.config.globalProperties.$confirm = ElMessageBox.confirm

components.forEach((component) => {
  app.use(component)
})

plugins.forEach((plugin) => {
  app.use(plugin as any)
})

app.directive('permission', vPermission)

app.mount('#app')
