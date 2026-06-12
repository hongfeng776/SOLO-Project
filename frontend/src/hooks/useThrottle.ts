import { ref, watch, onBeforeUnmount, type Ref } from 'vue';
import { throttle } from '@/utils/common';

function useThrottle<T>(value: Ref<T> | (() => T), delay = 300): Ref<T> {
  const throttled = ref<T>(
    typeof value === 'function' ? (value as () => T)() : value.value,
  ) as Ref<T>;

  const update = throttle((val: T) => {
    throttled.value = val;
  }, delay);

  const unwatch = watch(
    () => (typeof value === 'function' ? (value as () => T)() : value.value),
    (newVal) => update(newVal),
    { immediate: true },
  );

  onBeforeUnmount(unwatch);

  return throttled;
}

export default useThrottle;
