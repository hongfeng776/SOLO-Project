import { createApp, type Directive } from 'vue';
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

const vRipple: Directive<HTMLElement> = {
  mounted(el, binding) {
    el.addEventListener('click', (e: Event) => {
      const evt = e as MouseEvent;
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      const x = evt.clientX - rect.left - size / 2;
      const y = evt.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.className = 'ripple-effect';

      el.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
};

app.directive('ripple', vRipple);

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
