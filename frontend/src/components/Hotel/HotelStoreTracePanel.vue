<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="820px"
    class="trace-panel"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="trace-filter" style="padding: 16px 20px 0 20px;">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="操作类型">
          <el-select
            v-model="filterForm.operationType"
            placeholder="全部"
            clearable
            style="width: 160px"
            @change="fetchLogs"
          >
            <el-option
              v-for="item in Object.values(HotelLogTypeEnum)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 340px"
            @change="fetchLogs"
          />
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" size="small" @click="fetchLogs">刷新</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="trace-timeline" v-loading="loading">
      <el-empty v-if="logs.length === 0 && !loading" description="暂无操作记录" />

      <el-timeline v-else>
        <el-timeline-item
          v-for="log in logs"
          :key="log.id"
          :timestamp="formatDate(log.createdAt)"
          placement="top"
          :color="getLogColor(log.operationType)"
          class="timeline-item-wrap"
        >
          <div class="trace-card">
            <div class="trace-header">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <el-icon :size="16" :color="getLogColor(log.operationType)">
                  <component :is="getLogIcon(log.operationType)" />
                </el-icon>
                <el-tag
                  size="small"
                  class="op-type-tag"
                  :style="{
                    borderColor: getLogColor(log.operationType),
                    color: getLogColor(log.operationType),
                    backgroundColor: getLogColor(log.operationType) + '15'
                  }"
                >
                  {{ getLogLabel(log.operationType) }}
                </el-tag>

                <el-tag
                  v-if="log.isBatch"
                  type="info"
                  size="small"
                  effect="plain"
                >
                  <el-icon><Files /></el-icon>
                  批量操作
                </el-tag>

                <el-tag
                  v-if="log.operationModule"
                  size="small"
                  effect="plain"
                  type="primary"
                >
                  {{ getModuleLabel(log.operationModule) }}
                </el-tag>
              </div>

              <div class="op-meta">
                <el-tooltip :content="log.operatorId ? `ID: ${log.operatorId}` : ''">
                  <span><el-icon :size="12"><User /></el-icon> {{ log.operatorName }}</span>
                </el-tooltip>
                <el-tooltip v-if="log.operatorRole" :content="`角色: ${log.operatorRole}`">
                  <span><el-icon :size="12"><UserFilled /></el-icon> {{ log.operatorRole }}</span>
                </el-tooltip>
                <el-tooltip v-if="log.operationIp" :content="`IP: ${log.operationIp}`">
                  <span><el-icon :size="12"><Connection /></el-icon> {{ log.operationIp }}</span>
                </el-tooltip>
              </div>
            </div>

            <div class="trace-reason" v-if="log.operationReason">
              <el-icon :size="12"><EditPen /></el-icon>
              操作原因：{{ log.operationReason }}
            </div>

            <div class="trace-changes" v-if="log.oldValue || log.newValue">
              <template v-for="(row, idx) in parseChanges(log)" :key="idx">
                <div class="change-row" v-if="row">
                  <span class="change-field">{{ getFieldLabel(row.field) }}：</span>
                  <template v-if="row.newVal !== undefined && row.oldVal !== undefined">
                    <span class="change-old">{{ row.oldVal }}</span>
                    <span class="change-arrow">→</span>
                    <span class="change-new">{{ row.newVal }}</span>
                  </template>
                  <template v-else>
                    <span class="change-new">{{ row.newVal || row.oldVal }}</span>
                  </template>
                </div>
              </template>
            </div>

            <div
              v-if="log.verifyResult"
              class="trace-verify"
              :class="'verify-' + log.verifyResult"
            >
              <el-icon><component :is="getVerifyIcon(log.verifyResult)" /></el-icon>
              {{ getVerifyLabel(log.verifyResult) }}
              <template v-if="log.verifyMessages && log.verifyMessages.length > 0">
                <template v-for="(msg, i) in parseVerifyMessages(log.verifyMessages)" :key="i">
                  <span class="verify-msg">· {{ msg }}</span>
                </template>
              </template>
            </div>

            <div v-if="log.orderFreezeFlag" class="trace-freeze">
              <el-icon><Lock /></el-icon>
              已冻结对应订单预订功能
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <div v-if="logs.length > 0" style="padding: 16px 0; text-align: center;">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchLogs"
          @current-change="fetchLogs"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :icon="Download" @click="handleExport" :disabled="logs.length === 0">
        导出记录
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Download,
  User,
  UserFilled,
  Connection,
  Files,
  EditPen,
  Lock,
  Plus,
  Edit,
  Upload,
  Warning,
  WarningFilled,
  CircleCheck,
  CircleCheckFilled,
  CircleCloseFilled,
  TrendCharts,
  Stamp,
  DocumentCopy
} from '@element-plus/icons-vue'
import {
  HotelLogTypeEnum,
  HotelVerifyResultEnum
} from '@/utils/enums'
import { getHotelLogs, getAllHotelLogs } from '@/api/hotel'

const props = defineProps({
  modelValue: Boolean,
  hotelId: {
    type: [Number, String],
    default: null
  },
  hotelName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const dialogTitle = computed(() =>
  props.hotelId ? `「${props.hotelName}」操作溯源` : '全部门店操作记录'
)

const loading = ref(false)
const logs = ref([])

const filterForm = reactive({
  operationType: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleString('zh-CN', { hour12: false })
}

const getLogColor = (type) => {
  return HotelLogTypeEnum[type]?.color || '#909399'
}

const getLogLabel = (type) => {
  return HotelLogTypeEnum[type]?.label || type
}

const getLogIcon = (type) => {
  const iconMap = {
    create: Plus,
    update: Edit,
    on_shelf: Upload,
    off_shelf: Download,
    suspend: Warning,
    rectification: WarningFilled,
    resume_operation: CircleCheck,
    weight_adjust: TrendCharts,
    batch_update: Files,
    qualification_audit: Stamp,
    fake_flag: Warning,
    duplicate_flag: DocumentCopy
  }
  return iconMap[type] || Edit
}

const getModuleLabel = (m) => {
  const map = {
    basic_info: '基础信息',
    qualification: '资质信息',
    status: '经营状态',
    weight: '展示权重',
    room_resource: '客房资源'
  }
  return map[m] || m
}

const getFieldLabel = (f) => {
  const map = {
    name: '酒店名称',
    hotelType: '酒店类型',
    city: '城市',
    country: '国家',
    address: '地址',
    star: '星级',
    starLevel: '评级类型',
    phone: '联系电话',
    email: '邮箱',
    price: '起步价',
    rooms: '房间数',
    roomTypeRange: '客房适配范围',
    businessStatus: '经营状态',
    status: '上下架状态',
    displayWeight: '展示权重',
    checkInTime: '入住时间',
    checkOutTime: '退房时间',
    description: '酒店描述',
    businessLicenseNo: '营业执照号',
    businessLicenseExpire: '营业执照有效期',
    specialLicenseNo: '特种许可证号',
    specialLicenseExpire: '特种许可证有效期',
    hygieneLicenseNo: '卫生许可证号',
    hygieneLicenseExpire: '卫生许可证有效期',
    fireSafetyLicenseNo: '消防合格证号',
    fireSafetyLicenseExpire: '消防合格证有效期',
    crossBorderLicense: '跨境许可证号',
    crossBorderLicenseExpire: '跨境许可证有效期',
    qualificationStatus: '资质状态',
    qualificationAuditTime: '资质审核时间',
    qualificationAuditor: '资质审核人',
    isFake: '虚假标记',
    isDuplicate: '重复标记'
  }
  return map[f] || f
}

const getVerifyIcon = (r) => {
  return HotelVerifyResultEnum[r]?.icon || CircleCheckFilled
}

const getVerifyLabel = (r) => {
  return HotelVerifyResultEnum[r]?.label || r
}

const parseValue = (val) => {
  if (val === null || val === undefined || val === '') return '（空）'
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (val === 'operating') return '营业中'
  if (val === 'suspended') return '停业'
  if (val === 'rectification') return '整改中'
  if (val === 'closed') return '已关闭'
  if (val === 'compliant') return '资质合规'
  if (val === 'expired') return '即将过期'
  if (val === 'pending') return '待审核'
  if (val === 'invalid') return '资质无效'
  if (val === 'domestic') return '国内酒店'
  if (val === 'overseas') return '海外酒店'
  if (val === 'apartment') return '民宿公寓'
  if (val === 'featured') return '特色酒店'
  if (val === 'national') return '国家评定'
  if (val === 'chain') return '连锁品牌'
  if (val === 'user') return '用户评定'
  return String(val)
}

const parseChanges = (log) => {
  const fields = log.changeFields ? log.changeFields.split(',') : []
  const oldObj = safeParse(log.oldValue) || {}
  const newObj = safeParse(log.newValue) || {}

  if (fields.length > 0) {
    return fields.map(f => {
      if (!f) return null
      return {
        field: f,
        oldVal: parseValue(oldObj[f]),
        newVal: parseValue(newObj[f])
      }
    })
  }

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
  return allKeys.map(k => ({
    field: k,
    oldVal: parseValue(oldObj[k]),
    newVal: parseValue(newObj[k])
  }))
}

const parseVerifyMessages = (v) => {
  try {
    if (typeof v === 'string') return JSON.parse(v)
    if (Array.isArray(v)) return v
    return []
  } catch {
    return []
  }
}

const safeParse = (s) => {
  if (!s) return null
  try {
    return typeof s === 'string' ? JSON.parse(s) : s
  } catch {
    return null
  }
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterForm.operationType) {
      params.operationType = filterForm.operationType
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startTime = filterForm.dateRange[0]
      params.endTime = filterForm.dateRange[1]
    }

    let res
    if (props.hotelId) {
      res = await getHotelLogs(props.hotelId, params)
    } else {
      res = await getAllHotelLogs(params)
    }

    logs.value = res.rows || res.list || []
    pagination.total = res.total || 0
  } catch (e) {
    ElMessage.error('加载操作记录失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      pagination.page = 1
      nextTick(() => fetchLogs())
    }
  }
)

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}
</script>
