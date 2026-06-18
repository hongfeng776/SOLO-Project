<template>
  <div class="flight-trace-panel">
    <div class="trace-header">
      <div class="trace-title">
        <el-icon><component :is="Clock" /></el-icon>
        操作日志溯源
      </div>
      <el-select
        v-model="filterType"
        placeholder="筛选操作类型"
        clearable
        size="small"
        style="width: 160px"
        @change="fetchLogs"
      >
        <el-option
          v-for="(item, key) in FlightLogTypeEnum"
          :key="key"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <div class="trace-timeline" v-loading="loading">
      <div
        class="trace-item"
        v-for="log in logs"
        :key="log.id"
      >
        <div
          class="trace-dot"
          :style="{ backgroundColor: getLogTypeColor(log.operationType) }"
        >
          <el-icon><component :is="getLogTypeIcon(log.operationType)" /></el-icon>
        </div>
        <div class="trace-content">
          <div class="trace-title-row">
            <span class="trace-action" :style="{ color: getLogTypeColor(log.operationType) }">
              {{ getLogTypeLabel(log.operationType) }}
            </span>
            <span class="trace-time">{{ formatTime(log.createdAt) }}</span>
          </div>
          <div class="trace-operator">
            <el-tag size="small" v-if="log.operationStatus === 1" type="success">操作成功</el-tag>
            <el-tag size="small" v-else type="danger">操作失败</el-tag>
            <span style="margin-left: 8px">
              操作人：{{ log.operatorName || '系统' }}
              <span v-if="log.operatorRole">({{ log.operatorRole }})</span>
            </span>
          </div>
          <div class="trace-fields" v-if="log.changedFields">
            <span style="color: #909399">变更字段：</span>
            <el-tag
              v-for="field in parseChangedFields(log.changedFields)"
              :key="field"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ getFieldLabel(field) }}
            </el-tag>
          </div>
          <div class="trace-remark" v-if="log.operationRemark || log.failReason">
            {{ log.operationRemark || log.failReason }}
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && logs.length === 0" description="暂无操作记录" />
    </div>

    <div v-if="logs.length > 0" class="pagination-container" style="margin-top: 16px">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchLogs"
        @current-change="fetchLogs"
        small
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { Clock, Plus, Edit, Upload, Download, Refresh, Files, Delete, Stamp, Goods } from '@element-plus/icons-vue'
import { getFlightLogs } from '@/api/flight'
import { FlightLogTypeEnum, FlightValidateFieldEnum } from '@/utils/enums'

const props = defineProps({
  flightId: {
    type: [Number, String],
    required: true
  }
})

const loading = ref(false)
const logs = ref([])
const filterType = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const iconMap = {
  1: Plus,
  2: Edit,
  3: Upload,
  4: Download,
  5: Refresh,
  6: Files,
  7: Delete,
  8: Stamp,
  9: Goods
}

const getLogTypeIcon = (type) => iconMap[type] || Files
const getLogTypeLabel = (type) => FlightLogTypeEnum[Object.keys(FlightLogTypeEnum).find(k => FlightLogTypeEnum[k].value === type)]?.label || '未知操作'
const getLogTypeColor = (type) => FlightLogTypeEnum[Object.keys(FlightLogTypeEnum).find(k => FlightLogTypeEnum[k].value === type)]?.color || '#909399'

const parseChangedFields = (fields) => {
  try {
    const parsed = typeof fields === 'string' ? JSON.parse(fields) : fields
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getFieldLabel = (field) => {
  return FlightValidateFieldEnum[field] || field
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterType.value) {
      params.operationType = filterType.value
    }
    const res = await getFlightLogs(props.flightId, params)
    logs.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(() => props.flightId, () => {
  pagination.page = 1
  fetchLogs()
})

onMounted(() => {
  fetchLogs()
})
</script>
