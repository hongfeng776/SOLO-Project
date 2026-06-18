<template>
  <div class="flight-batch-toolbar" v-show="selectedCount > 0">
    <div class="selected-info">
      已选择 <span class="selected-count">{{ selectedCount }}</span> 个航班
    </div>
    <div class="batch-divider"></div>
    <el-button
      class="batch-btn"
      :class="{ loading: loadingMap.batchTime }"
      type="primary"
      size="small"
      :icon="Clock"
      @click="handleBatchTime"
    >
      <span v-if="loadingMap.batchTime" class="el-icon is-loading"><el-icon><Loading /></el-icon></span>
      批量调整时刻
    </el-button>
    <el-button
      class="batch-btn"
      :class="{ loading: loadingMap.batchOnline }"
      type="success"
      size="small"
      :icon="Upload"
      @click="handleBatchOnline"
    >
      <span v-if="loadingMap.batchOnline" class="el-icon is-loading"><el-icon><Loading /></el-icon></span>
      批量上架
    </el-button>
    <el-button
      class="batch-btn"
      :class="{ loading: loadingMap.batchOffline }"
      type="warning"
      size="small"
      :icon="Download"
      @click="handleBatchOffline"
    >
      <span v-if="loadingMap.batchOffline" class="el-icon is-loading"><el-icon><Loading /></el-icon></span>
      批量下架
    </el-button>
    <el-button
      class="batch-btn"
      :class="{ loading: loadingMap.batchOfflineAbnormal }"
      type="danger"
      size="small"
      :icon="Warning"
      @click="handleBatchOfflineAbnormal"
    >
      <span v-if="loadingMap.batchOfflineAbnormal" class="el-icon is-loading"><el-icon><Loading /></el-icon></span>
      批量下架异常
    </el-button>
    <el-button
      class="batch-btn"
      :class="{ loading: loadingMap.batchDelete }"
      type="danger"
      plain
      size="small"
      :icon="Delete"
      @click="handleBatchDelete"
    >
      <span v-if="loadingMap.batchDelete" class="el-icon is-loading"><el-icon><Loading /></el-icon></span>
      批量删除
    </el-button>
    <div style="flex: 1"></div>
    <el-button
      type="info"
      plain
      size="small"
      :icon="Close"
      @click="$emit('clear')"
    >
      取消选择
    </el-button>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Upload, Download, Warning, Delete, Close, Loading } from '@element-plus/icons-vue'
import {
  batchUpdateFlightTime,
  batchUpdateFlightDisplayStatus,
  batchOfflineAbnormalFlights,
  batchDeleteFlight
} from '@/api/flight'

const props = defineProps({
  selectedIds: {
    type: Array,
    default: () => []
  },
  selectedCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['refresh', 'clear'])

const loadingMap = reactive({
  batchTime: false,
  batchOnline: false,
  batchOffline: false,
  batchOfflineAbnormal: false,
  batchDelete: false
})

const handleBatchTime = async () => {
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入时间偏移量（分钟，正数为延后，负数为提前）',
      '批量调整航班时刻',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^-?\d+$/,
        inputErrorMessage: '请输入有效的分钟数'
      }
    )
    loadingMap.batchTime = true
    const res = await batchUpdateFlightTime(props.selectedIds, {
      departureTimeOffset: Number(value)
    })
    ElMessage.success(`成功调整 ${res.data?.success?.length || 0} 个航班时刻`)
    emit('refresh')
    emit('clear')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  } finally {
    loadingMap.batchTime = false
  }
}

const handleBatchOnline = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量上架选中的 ${props.selectedCount} 个航班吗？`,
      '确认操作',
      {
        confirmButtonText: '确定上架',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    loadingMap.batchOnline = true
    const res = await batchUpdateFlightDisplayStatus(props.selectedIds, 1)
    ElMessage.success(`成功上架 ${res.data?.success?.length || 0} 个航班`)
    emit('refresh')
    emit('clear')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  } finally {
    loadingMap.batchOnline = false
  }
}

const handleBatchOffline = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量下架选中的 ${props.selectedCount} 个航班吗？下架后将不可售。`,
      '确认操作',
      {
        confirmButtonText: '确定下架',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    loadingMap.batchOffline = true
    const res = await batchUpdateFlightDisplayStatus(props.selectedIds, 0)
    ElMessage.success(`成功下架 ${res.data?.success?.length || 0} 个航班`)
    emit('refresh')
    emit('clear')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  } finally {
    loadingMap.batchOffline = false
  }
}

const handleBatchOfflineAbnormal = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${props.selectedCount} 个航班作为异常航班批量下架吗？`,
      '确认操作',
      {
        confirmButtonText: '确定下架',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    loadingMap.batchOfflineAbnormal = true
    const res = await batchOfflineAbnormalFlights(props.selectedIds)
    ElMessage.success(`成功下架 ${res.data?.success?.length || 0} 个异常航班`)
    emit('refresh')
    emit('clear')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  } finally {
    loadingMap.batchOfflineAbnormal = false
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${props.selectedCount} 个航班吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    loadingMap.batchDelete = true
    const res = await batchDeleteFlight(props.selectedIds)
    ElMessage.success('删除成功')
    emit('refresh')
    emit('clear')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  } finally {
    loadingMap.batchDelete = false
  }
}
</script>
