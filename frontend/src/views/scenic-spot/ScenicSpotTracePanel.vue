<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(v) => emit('update:visible', v)"
    :title="isGlobal ? '景区资源全流程溯源' : '景点操作溯源记录'"
    width="900px"
    class="scenic-spot-ops trace-panel"
    @open="onOpen"
  >
    <div v-loading="loading" style="min-height: 400px;">
      <div class="trace-filter" v-if="isGlobal" style="padding: 16px 24px 0;">
        <el-form :inline="true" :model="filterForm" size="default">
          <el-form-item label="操作类型">
            <el-select v-model="filterForm.logType" placeholder="全部类型" clearable style="width: 160px;">
              <el-option
                v-for="item in Object.values(ScenicSpotLogTypeEnum)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="景点类型">
            <el-select v-model="filterForm.spotType" placeholder="全部" clearable style="width: 140px;">
              <el-option
                v-for="item in Object.values(ScenicSpotTypeEnum)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="操作人">
            <el-input v-model="filterForm.operator" placeholder="操作人姓名/ID" clearable style="width: 160px;" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="fetchLogs">查询</el-button>
            <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="trace-timeline">
        <el-timeline v-if="logList.length > 0">
          <el-timeline-item
            v-for="log in logList"
            :key="log.id"
            :timestamp="formatTime(log.createdAt)"
            :color="getLogTypeColor(log.logType)"
            placement="top"
          >
            <div class="timeline-item-wrap">
              <div class="trace-card">
                <div class="trace-header">
                  <div>
                    <el-tag
                      size="small"
                      class="op-type-tag"
                      :color="getLogTypeColor(log.logType)"
                      effect="light"
                    >
                      <el-icon style="margin-right: 4px;"><component :is="getLogTypeIcon(log.logType)" /></el-icon>
                      {{ getLogTypeLabel(log.logType) }}
                    </el-tag>
                    <el-tag
                      v-if="log.spotType"
                      size="small"
                      effect="plain"
                      style="margin-left: 6px;"
                    >
                      {{ getSpotTypeLabel(log.spotType) }}
                    </el-tag>
                    <el-tooltip
                      v-if="isGlobal && log.spotName"
                      :content="'查看景点详情：' + log.spotName"
                    >
                      <span style="margin-left: 8px; color: #1890ff; cursor: pointer; font-weight: 500;">
                        {{ log.spotName }}
                      </span>
                    </el-tooltip>
                  </div>
                  <div class="op-meta">
                    <span v-if="log.operatorName">操作人：{{ log.operatorName }}</span>
                    <span v-if="log.module">模块：{{ log.module }}</span>
                    <span v-if="log.ip">IP：{{ log.ip }}</span>
                  </div>
                </div>

                <div v-if="log.reason" class="trace-reason">
                  <el-icon><ChatLineSquare /></el-icon>
                  {{ log.reason }}
                </div>

                <div v-if="log.changes && log.changes.length > 0" class="trace-changes">
                  <div v-for="(c, i) in log.changes" :key="i" class="change-row">
                    <span class="change-field">{{ c.fieldLabel || c.field }}</span>
                    <span class="change-old">{{ formatValue(c.oldValue) }}</span>
                    <span class="change-arrow">→</span>
                    <span class="change-new">{{ formatValue(c.newValue) }}</span>
                  </div>
                </div>

                <div
                  v-if="log.verifyResult"
                  :class="['trace-verify', 'verify-' + log.verifyResult]"
                >
                  <el-icon>
                    <component :is="ScenicSpotVerifyResultEnum[log.verifyResult]?.icon || 'CircleCheck'" />
                  </el-icon>
                  合规校验：{{ getVerifyResultLabel(log.verifyResult) }}
                  <span v-if="log.verifyMessage" class="verify-msg">{{ log.verifyMessage }}</span>
                </div>

                <div v-if="log.ticketFrozen" class="trace-freeze">
                  <el-icon><WarningFilled /></el-icon>
                  票务已自动冻结
                </div>

                <div v-if="log.notificationSent" class="trace-notify">
                  <el-icon><BellFilled /></el-icon>
                  已推送用户通知
                </div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>

        <el-empty v-else description="暂无操作记录" />
      </div>

      <div v-if="total > pageSize" style="padding: 0 24px 20px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchLogs"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import {
  Search, Refresh, ChatLineSquare, WarningFilled, BellFilled
} from '@element-plus/icons-vue'
import { getScenicSpotLogs, getAllScenicSpotLogs } from '@/api/scenicSpot'
import {
  ScenicSpotLogTypeEnum, ScenicSpotTypeEnum, ScenicSpotVerifyResultEnum
} from '@/utils/enums'

const props = defineProps({
  visible: Boolean,
  spotId: { type: [Number, String], default: null },
  isGlobal: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible'])

const loading = ref(false)
const logList = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filterForm = reactive({
  logType: '',
  spotType: '',
  operator: ''
})

const getLogTypeLabel = (t) => ScenicSpotLogTypeEnum[t]?.label || t
const getLogTypeColor = (t) => ScenicSpotLogTypeEnum[t]?.color || '#909399'
const getLogTypeIcon = (t) => ScenicSpotLogTypeEnum[t]?.icon || 'InfoFilled'
const getSpotTypeLabel = (t) => ScenicSpotTypeEnum[t]?.label || t
const getVerifyResultLabel = (r) => ScenicSpotVerifyResultEnum[r]?.label || r

const formatValue = (v) => {
  if (v === null || v === undefined || v === '') return '-'
  if (typeof v === 'boolean') return v ? '是' : '否'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filterForm
    }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === undefined || params[k] === null) delete params[k]
    })
    let res
    if (props.isGlobal) {
      res = await getAllScenicSpotLogs(params)
    } else {
      res = await getScenicSpotLogs(props.spotId, params)
    }
    logList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  Object.assign(filterForm, { logType: '', spotType: '', operator: '' })
  page.value = 1
  fetchLogs()
}

const onOpen = () => {
  page.value = 1
  logList.value = []
  fetchLogs()
}
</script>
