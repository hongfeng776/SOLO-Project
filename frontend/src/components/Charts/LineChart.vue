<template>
  <div class="line-chart" ref="chartRef">
    <canvas ref="canvasRef"></canvas>
    <div v-if="tooltip.show" class="chart-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="tooltip-title">{{ tooltip.title }}</div>
      <div v-for="(item, idx) in tooltip.items" :key="idx" class="tooltip-item">
        <span class="tooltip-dot" :style="{ backgroundColor: item.color }"></span>
        <span>{{ item.label }}: {{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  labels: { type: Array, default: () => [] },
  datasets: { type: Array, default: () => [] },
  width: { type: Number, default: 600 },
  height: { type: Number, default: 300 }
})

const chartRef = ref(null)
const canvasRef = ref(null)
const tooltip = ref({ show: false, x: 0, y: 0, title: '', items: [] })

let ctx = null
let chartWidth = 0
let chartHeight = 0
const padding = { top: 30, right: 60, bottom: 40, left: 60 }
let dataPointsCache = []
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
  if (!ctx || !props.labels.length || !props.datasets.length) return
  ctx.clearRect(0, 0, chartWidth, chartHeight)
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom
  let allValues = []
  props.datasets.forEach(ds => {
    allValues = allValues.concat(ds.data)
  })
  const maxVal = Math.max(...allValues, 1)
  const minVal = 0
  const range = maxVal - minVal || 1
  const stepX = plotWidth / Math.max(props.labels.length - 1, 1)

  drawGrid(plotWidth, plotHeight, maxVal)
  drawAxes(plotWidth, plotHeight, maxVal)

  dataPointsCache = []
  props.datasets.forEach((dataset, dsIdx) => {
    const points = []
    dataset.data.forEach((val, i) => {
      const x = padding.left + i * stepX
      const y = padding.top + plotHeight - ((val - minVal) / range) * plotHeight
      points.push({ x, y, value: val })
    })
    dataPointsCache.push({ points, color: dataset.color, label: dataset.label })

    ctx.beginPath()
    ctx.strokeStyle = dataset.color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight)
    gradient.addColorStop(0, dataset.color + '30')
    gradient.addColorStop(1, dataset.color + '05')
    ctx.beginPath()
    ctx.moveTo(points[0].x, padding.top + plotHeight)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, padding.top + plotHeight)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    points.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = dataset.color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
  })
}

const drawGrid = (plotWidth, plotHeight, maxVal) => {
  const gridLines = 5
  ctx.strokeStyle = '#e8e8e8'
  ctx.lineWidth = 1
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (plotHeight / gridLines) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + plotWidth, y)
    ctx.stroke()
  }
}

const drawAxes = (plotWidth, plotHeight, maxVal) => {
  const gridLines = 5
  ctx.fillStyle = '#999'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (plotHeight / gridLines) * i
    const val = maxVal - (maxVal / gridLines) * i
    ctx.fillText(Math.round(val), padding.left - 10, y + 4)
  }
  ctx.textAlign = 'center'
  const stepX = plotWidth / Math.max(props.labels.length - 1, 1)
  props.labels.forEach((label, i) => {
    const x = padding.left + i * stepX
    ctx.fillText(label, x, padding.top + plotHeight + 25)
  })
}

const handleMouseMove = (e) => {
  if (!dataPointsCache.length) return
  const rect = canvasRef.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  let found = false
  for (const ds of dataPointsCache) {
    for (const p of ds.points) {
      if (Math.abs(mx - p.x) < 15 && Math.abs(my - p.y) < 15) {
        const idx = ds.points.indexOf(p)
        tooltip.value = {
          show: true,
          x: p.x + 10,
          y: p.y - 10,
          title: props.labels[idx],
          items: dataPointsCache.map(d => ({
            label: d.label,
            value: d.points[idx]?.value ?? 0,
            color: d.color
          }))
        }
        found = true
        break
      }
    }
    if (found) break
  }
  if (!found) {
    tooltip.value.show = false
  }
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

watch(() => [props.labels, props.datasets, props.width, props.height], render, { deep: true })

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
.line-chart {
  position: relative;
  width: 100%;
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

  .tooltip-title {
    margin-bottom: 4px;
    font-weight: 600;
  }

  .tooltip-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }

  .tooltip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
}
</style>
