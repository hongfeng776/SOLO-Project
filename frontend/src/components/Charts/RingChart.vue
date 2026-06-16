<template>
  <div class="ring-chart" ref="chartRef">
    <canvas ref="canvasRef"></canvas>
    <div v-if="tooltip.show" class="chart-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="tooltip-item">
        <span class="tooltip-dot" :style="{ backgroundColor: tooltip.color }"></span>
        <span>{{ tooltip.name }}: {{ tooltip.value }}%</span>
      </div>
    </div>
    <div class="ring-center">
      <div class="ring-total">{{ total }}</div>
      <div class="ring-title">{{ title }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  width: { type: Number, default: 250 },
  height: { type: Number, default: 250 },
  title: { type: String, default: '' },
  total: { type: [Number, String], default: 0 }
})

const chartRef = ref(null)
const canvasRef = ref(null)
const tooltip = ref({ show: false, x: 0, y: 0, name: '', value: 0, color: '' })

let ctx = null
let chartWidth = 0
let chartHeight = 0
let sliceCache = []
let resizeObserver = null

const initCanvas = () => {
  if (!canvasRef.value || !chartRef.value) return
  const dpr = window.devicePixelRatio || 1
  chartWidth = chartRef.value.clientWidth
  chartHeight = props.height
  canvasRef.value.width = chartWidth * dpr
  canvasRef.value.height = chartHeight * dpr
  canvasRef.value.style.width = chartWidth + 'px'
  canvasRef.value.style.height = chartHeight + 'px'
  ctx = canvasRef.value.getContext('2d')
  ctx.scale(dpr, dpr)
}

const draw = () => {
  if (!ctx || !props.data.length) return
  ctx.clearRect(0, 0, chartWidth, chartHeight)
  const cx = chartWidth / 2
  const cy = chartHeight / 2
  const outerRadius = Math.min(cx, cy) - 10
  const innerRadius = outerRadius * 0.6
  const total = props.data.reduce((sum, d) => sum + d.value, 0) || 1
  let startAngle = -Math.PI / 2

  sliceCache = []
  props.data.forEach((item) => {
    const sliceAngle = (item.value / total) * Math.PI * 2
    const endAngle = startAngle + sliceAngle

    ctx.beginPath()
    ctx.arc(cx, cy, outerRadius, startAngle, endAngle)
    ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = item.color
    ctx.fill()

    sliceCache.push({
      startAngle,
      endAngle,
      name: item.name,
      value: ((item.value / total) * 100).toFixed(1),
      color: item.color
    })

    startAngle = endAngle
  })
}

const handleMouseMove = (e) => {
  if (!sliceCache.length) return
  const rect = canvasRef.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const cx = chartWidth / 2
  const cy = chartHeight / 2
  const dx = mx - cx
  const dy = my - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const outerRadius = Math.min(cx, cy) - 10
  const innerRadius = outerRadius * 0.6

  if (dist < innerRadius || dist > outerRadius) {
    tooltip.value.show = false
    return
  }

  let angle = Math.atan2(dy, dx)
  if (angle < -Math.PI / 2) angle += Math.PI * 2

  for (const slice of sliceCache) {
    if (angle >= slice.startAngle && angle < slice.endAngle) {
      tooltip.value = {
        show: true,
        x: mx + 10,
        y: my - 10,
        name: slice.name,
        value: slice.value,
        color: slice.color
      }
      return
    }
  }
  tooltip.value.show = false
}

const handleMouseLeave = () => {
  tooltip.value.show = false
}

const render = () => {
  nextTick(() => {
    initCanvas()
    draw()
  })
}

watch(() => [props.data, props.width, props.height, props.total], render, { deep: true })

onMounted(() => {
  render()
  resizeObserver = new ResizeObserver(() => render())
  if (chartRef.value) resizeObserver.observe(chartRef.value)
  if (canvasRef.value) {
    canvasRef.value.addEventListener('mousemove', handleMouseMove)
    canvasRef.value.addEventListener('mouseleave', handleMouseLeave)
  }
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('mousemove', handleMouseMove)
    canvasRef.value.removeEventListener('mouseleave', handleMouseLeave)
  }
})
</script>

<style lang="scss" scoped>
.ring-chart {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;

  .ring-total {
    font-size: 24px;
    font-weight: 700;
    color: #333;
  }

  .ring-title {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
}

.chart-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;

  .tooltip-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tooltip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
}
</style>
