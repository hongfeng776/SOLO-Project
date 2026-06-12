import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

import App from './App.vue';
import router from './router';
import pinia from './store';

import './styles/global.scss';

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component as any);
}

app.use(ElementPlus, {
  locale: zhCn,
  size: 'default',
  zIndex: 3000,
});

app.use(pinia);
app.use(router);

app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]:', err, info, instance);
};
app.config.warnHandler = (msg, instance, trace) => {
  if (import.meta.env.DEV) {
    console.warn('[Vue Warn]:', msg, trace, instance);
  }
};

app.mount('#app');
