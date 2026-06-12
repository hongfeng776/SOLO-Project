import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useBreakpoints() {
  const width = ref(window.innerWidth);
  const handleResize = () => (width.value = window.innerWidth);

  onMounted(() => window.addEventListener('resize', handleResize, { passive: true }));
  onUnmounted(() => window.removeEventListener('resize', handleResize));

  const isMobile = computed(() => width.value < 768);
  const isTablet = computed(() => width.value >= 768 && width.value < 1024);
  const isDesktop = computed(() => width.value >= 1024);
  const isLarge = computed(() => width.value >= 1440);

  return { width, isMobile, isTablet, isDesktop, isLarge };
}

export default useBreakpoints;
