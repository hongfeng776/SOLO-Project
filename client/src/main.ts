import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import './styles/index.css';
import FormattedDate from '@/components/FormattedDate.vue';
import FormattedNumber from '@/components/FormattedNumber.vue';
import EllipsisText from '@/components/EllipsisText.vue';
import EmptyState from '@/components/EmptyState.vue';

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.component('FormattedDate', FormattedDate);
app.component('FormattedNumber', FormattedNumber);
app.component('EllipsisText', EllipsisText);
app.component('EmptyState', EmptyState);

app.use(createPinia());
app.use(router);
app.use(ElementPlus, { locale: zhCn });

app.mount('#app');
