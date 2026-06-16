import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'

export function useECharts(theme?: string) {
  const chartRef = ref<HTMLElement | null>(null)
  let chartInstance: ECharts | null = null

  function initChart() {
    if (!chartRef.value) return
    chartInstance = echarts.init(chartRef.value, theme)
  }

  function setOption(option: EChartsOption, notMerge?: boolean) {
    if (!chartInstance) return
    chartInstance.setOption(option, notMerge)
  }

  function resize() {
    chartInstance?.resize()
  }

  function dispose() {
    chartInstance?.dispose()
    chartInstance = null
  }

  const handleResize = () => {
    resize()
  }

  onMounted(() => {
    nextTick(() => {
      initChart()
      window.addEventListener('resize', handleResize)
    })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    dispose()
  })

  return {
    chartRef,
    initChart,
    setOption,
    resize,
    dispose,
  }
}
