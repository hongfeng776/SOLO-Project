<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" size="32"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else class="detail-content">
      <el-descriptions :column="column" border>
        <el-descriptions-item v-for="item in fields" :key="item.prop" :label="item.label">
          <template v-if="item.type === 'status'">
            <StatusTag
              :status="detailData[item.prop]"
              :status-map="item.statusMap"
              :color-map="item.colorMap"
            />
          </template>
          <template v-else-if="item.type === 'image'">
            <el-image
              v-if="detailData[item.prop]"
              :src="detailData[item.prop]"
              :preview-src-list="[detailData[item.prop]]"
              style="width: 100px; height: 100px"
              fit="cover"
            />
            <span v-else>-</span>
          </template>
          <template v-else-if="item.type === 'date'">
            {{ formatDate(detailData[item.prop]) }}
          </template>
          <template v-else-if="item.type === 'money'">
            ¥{{ formatMoney(detailData[item.prop]) }}
          </template>
          <template v-else>
            {{ detailData[item.prop] || '-' }}
          </template>
        </el-descriptions-item>
      </el-descriptions>
      <slot name="extra" />
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <slot name="footer" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { formatDate, formatMoney } from '@/utils/format'
import { Loading } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  title?: string
  width?: string
  fields: any[]
  detailData?: any
  loading?: boolean
  column?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '详情',
  width: '600px',
  loading: false,
  column: 2
})

const emit = defineEmits(['update:modelValue', 'close'])

const dialogVisible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}
</script>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 10px;
  color: #909399;
}

.detail-content {
  padding: 10px 0;
}
</style>
