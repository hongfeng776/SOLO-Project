import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref<boolean>(localStorage.getItem('APP_SIDEBAR') === '1');
  const theme = ref<'light' | 'dark'>((localStorage.getItem('APP_THEME') as 'light' | 'dark') || 'light');
  const device = ref<'desktop' | 'mobile'>(window.innerWidth < 768 ? 'mobile' : 'desktop');
  const breadcrumbList = ref<Array<{ name: string; path?: string }>>([]);
  const mainLoading = ref<boolean>(false);
  const mainLoadingTip = ref<string>('加载中...');

  const sidebarWidth = computed(() => (sidebarCollapsed.value ? 64 : 220));

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem('APP_SIDEBAR', sidebarCollapsed.value ? '1' : '0');
  }
  function setSidebarCollapsed(val: boolean): void {
    sidebarCollapsed.value = val;
    localStorage.setItem('APP_SIDEBAR', val ? '1' : '0');
  }
  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('APP_THEME', theme.value);
  }
  function setDevice(d: 'desktop' | 'mobile'): void {
    device.value = d;
  }
  function setBreadcrumb(list: Array<{ name: string; path?: string }>): void {
    breadcrumbList.value = list;
  }
  function setMainLoading(loading: boolean, tip = '加载中...'): void {
    mainLoading.value = loading;
    mainLoadingTip.value = tip;
  }

  return {
    sidebarCollapsed,
    theme,
    device,
    breadcrumbList,
    mainLoading,
    mainLoadingTip,
    sidebarWidth,
    toggleSidebar,
    setSidebarCollapsed,
    toggleTheme,
    setDevice,
    setBreadcrumb,
    setMainLoading,
  };
});

export default useAppStore;
