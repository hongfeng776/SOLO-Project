<template>
  <div class="permission-log-panel">
    <div v-if="!compact" class="log-stats">
      <div class="stat-item">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总变更次数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" style="color: #52c41a;">{{ stats.grant }}</div>
        <div class="stat-label">授予权限</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" style="color: #ff4d4f;">{{ stats.revoke }}</div>
        <div class="stat-label">收回权限</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" style="color: #faad14;">{{ stats.abnormal }}</div>
        <div class="stat-label">异常记录</div>
      </div>
    </div>

    <div v-if="!compact" style="margin-bottom: 16px;">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="操作类型">
          <el-select v-model="filterForm.action" placeholder="全部" clearable style="width: 130px;">
            <el-option
              v-for="item in actionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权限类型">
          <el-select v-model="filterForm.permissionType" placeholder="全部" clearable style="width: 130px;">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="仅异常">
          <el-switch v-model="filterForm.onlyAbnormal" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="fetchLogs">查询</el-button>
          <el-button size="small" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="log-table">
      <el-table
        :data="logList"
        v-loading="loading"
        border
        @row-dblclick="handleRowDblclick"
        :row-key="row => row.id"
        :expand-row-keys="expandedKeys"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <div class="detail-row">
                <span class="label">操作人：</span>
                <span class="value">{{ row.operatorName || '系统' }}
                  <span v-if="row.operatorRole" style="color: #909399;">({{ row.operatorRole }})</span>
                </span>
              </div>
              <div class="detail-row">
                <span class="label">操作时间：</span>
                <span class="value">{{ row.createdAt }}</span>
              </div>
              <div class="detail-row">
                <span class="label">操作IP：</span>
                <span class="value">{{ row.ip || '-' }}</span>
              </div>
              <div class="detail-row" v-if="row.beforeValue || row.afterValue">
                <span class="label">变更详情：</span>
                <span class="value">
                  <span v-if="row.beforeValue" class="value-before">{{ formatValue(row.beforeValue) }}</span>
                  <el-icon style="margin: 0 8px; color: #dcdfe6;"><Right /></el-icon>
                  <span v-if="row.afterValue" class="value-after">{{ formatValue(row.afterValue) }}</span>
                </span>
              </div>
              <div class="detail-row">
                <span class="label">变更原因：</span>
                <span class="value">{{ row.reason || '-' }}</span>
              </div>
              <div class="detail-row" v-if="row.validFrom || row.validTo">
                <span class="label">有效期：</span>
                <span class="value">
                  {{ row.validFrom?.substring?.(0, 10) || '开始' }} ~ {{ row.validTo?.substring?.(0, 10) || '永久' }}
                </span>
              </div>
              <div class="detail-row" v-if="row.isAbnormal">
                <span class="label" style="color: #ff4d4f;">异常类型：</span>
                <span class="value" style="color: #ff4d4f;">
                  {{ getAbnormalLabel(row.abnormalType) }}
                  <span v-if="row.abnormalRemark">（{{ row.abnormalRemark }}）</span>
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" :style="{ background: getActionColor(row.action) + '20', color: getActionColor(row.action), borderColor: 'transparent' }">
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限类型" width="110">
          <template #default="{ row }">
            {{ getTypeLabel(row.permissionType) }}
          </template>
        </el-table-column>
        <el-table-column prop="permissionName" label="权限名称" width="160" />
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">
            {{ row.operatorName || '系统' }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="变更原因" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.reason || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.isAbnormal" type="danger" size="small">异常</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="操作时间" width="170" />
      </el-table>

      <div v-if="!compact" style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchLogs"
          @current-change="fetchLogs"
        />
      </div>
    </div>

    <div v-if="!compact" style="margin-top: 12px; text-align: center; color: #909399; font-size: 13px;">
      <el-icon style="vertical-align: middle; margin-right: 4px;"><Pointer /></el-icon>
      双击行可展开查看完整变更明细
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Right, Pointer } from '@element-plus/icons-vue'
import {
  PermissionActionEnum,
  PermissionTypeEnum,
  PermissionStatusEnum,
  getEnumOptions,
  getEnumLabel,
  getEnumColor
} from '@/utils/enums'
import { getPermissionLogs } from '@/api/permission'

const props = defineProps({
  userId: [Number, String],
  compact: {
    type: Boolean,
    default: false
  }
})

const loading = ref(false)
const logList = ref([])
const expandedKeys = ref([])

const filterForm = reactive({
  action: '',
  permissionType: '',
  onlyAbnormal: false
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const actionOptions = getEnumOptions(PermissionActionEnum)
const typeOptions = getEnumOptions(PermissionTypeEnum)

const stats = computed(() => {
  const s = { total: 0, grant: 0, revoke: 0, abnormal: 0 }
  s.total = pagination.total
  for (const log of logList.value) {
    if (log.action === 'grant' || log.action === 'batch_grant') s.grant++
    if (log.action === 'revoke' || log.action === 'batch_revoke') s.revoke++
    if (log.isAbnormal) s.abnormal++
  }
  return s
})

const getActionLabel = (action) => getEnumLabel(PermissionActionEnum, action) || action
const getActionColor = (action) => getEnumColor(PermissionActionEnum, action) || '#909399'
const getTypeLabel = (type) => getEnumLabel(PermissionTypeEnum, type) || type

const getAbnormalLabel = (type) => {
  const map = { abuse: '权限滥用', mismatch: '权限错配', over_range: '超范围' }
  return map[type] || type
}

const formatValue = (val) => {
  if (!val) return '-'
  try {
    const obj = typeof val === 'string' ? JSON.parse(val) : val
    if (typeof obj.enabled === 'boolean') {
      return obj.enabled ? '启用' : '禁用'
    }
    if (obj.config?.rate !== undefined) {
      return obj.enabled ? `启用(${obj.config.rate}倍)` : '禁用'
    }
    return JSON.stringify(obj)
  } catch (e) {
    return val
  }
}

const handleRowDblclick = (row) => {
  const idx = expandedKeys.value.indexOf(row.id)
  if (idx > -1) {
    expandedKeys.value.splice(idx, 1)
  } else {
    expandedKeys.value = [row.id]
  }
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    }
    if (props.userId) params.userId = props.userId
    if (filterForm.action) params.action = filterForm.action
    if (filterForm.permissionType) params.permissionType = filterForm.permissionType
    if (filterForm.onlyAbnormal) params.isAbnormal = 1

    const res = await getPermissionLogs(params)
    logList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    logList.value = []
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.action = ''
  filterForm.permissionType = ''
  filterForm.onlyAbnormal = false
  pagination.page = 1
  fetchLogs()
}

watch(() => props.userId, () => {
  pagination.page = 1
  fetchLogs()
})

onMounted(() => {
  fetchLogs()
})
</script>
