import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { useUserStore } from './user';
import { useAppStore } from './app';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export { useUserStore, useAppStore };
export default pinia;
