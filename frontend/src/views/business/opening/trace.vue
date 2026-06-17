<template>
  <div class="ccb-business-opening-trace">
    <CcbPageHeader
      title="开户溯源查询"
      description="依托实名信息、证件号码进行开户记录溯源匹配与合规校验"
      icon="Search"
    />

    <el-card class="trace-search-card" shadow="never">
      <el-form :model="searchForm" inline class="trace-search">
        <el-form-item label="身份证号" prop="idCardNo">
          <el-input
            v-model="searchForm.idCardNo"
            placeholder="请输入18位身份证号"
            maxlength="18"
            clearable
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item label="客户姓名" prop="customerName">
          <el-input v-model="searchForm.customerName" placeholder="请输入客户姓名（选填）" style="width: 200px" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleTrace">
            <span class="ripple-btn">开始溯源</span>
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="traceResult" class="trace-result">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon matched"><i class="el-icon-document"></i></div>
            <div class="stat-info">
              <div class="stat-label">匹配开户记录</div>
              <div class="stat-num">{{ traceResult.totalOpenings }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" :class="traceResult.duplicateRisk ? 'danger' : 'success'">
              <Warning v-if="traceResult.duplicateRisk" />
              <CircleCheckFilled v-else />
            </div>
            <div class="stat-info">
              <div class="stat-label">重复开户风险</div>
              <div class="stat-num" :class="traceResult.duplicateRisk ? 'danger' : 'success'">
                {{ traceResult.duplicateRisk ? '存在' : '无' }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" :class="traceResult.allowed ? 'success' : 'danger'">
              <CircleCheckFilled v-if="traceResult.allowed" />
              <CircleCloseFilled v-else />
            </div>
            <div class="stat-info">
              <div class="stat-label">是否允许开户</div>
              <div class="stat-num" :class="traceResult.allowed ? 'success' : 'danger'">
                {{ traceResult.allowed ? '允许' : '禁止' }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card v-if="traceResult.duplicateRisk || !traceResult.allowed" shadow="never" class="alert-card">
        <el-alert
          v-if="traceResult.duplicateRisk"
          :title="traceResult.duplicateRiskReason || '存在短期内重复开户风险'"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 12px"
        />
        <el-alert
          v-if="!traceResult.allowed"
          :title="'开户申请已被驳回：' + (traceResult.blockReason || '')"
          type="error"
          show-icon
          :closable="false"
        >
          <template v-if="traceResult.blockReason && traceResult.blockReason.length > 60" #default>
            <el-tooltip :content="traceResult.blockReason" placement="top" raw-content>
              <span class="long-block">{{ traceResult.blockReason }}</span>
            </el-tooltip>
          </template>
        </el-alert>
      </el-card>

      <el-card shadow="never" class="checks-card">
        <template #header>
          <div class="card-header">
            <span>多维度合规校验</span>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="影像清晰度">
            <el-tag :type="traceResult.imageChecks.clarityOk ? 'success' : 'danger'" effect="light">
              {{ traceResult.imageChecks.clarityOk ? '达标' : '不达标' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="信息一致性">
            <el-tag :type="traceResult.imageChecks.consistencyOk ? 'success' : 'danger'" effect="light">
              {{ traceResult.imageChecks.consistencyOk ? '一致' : '不一致' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="有效期合规">
            <el-tag :type="traceResult.imageChecks.validityOk ? 'success' : 'danger'" effect="light">
              {{ traceResult.imageChecks.validityOk ? '合规' : '不合规' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="详细信息" :span="3">
            <template v-if="traceResult.imageChecks.details && traceResult.imageChecks.details.length">
              <el-tag
                v-for="(d, i) in traceResult.imageChecks.details"
                :key="i"
                type="danger"
                effect="light"
                style="margin-right: 6px"
              >
                <el-tooltip :content="d" placement="top" raw-content>
                  <span class="short-text">{{ d.length > 20 ? d.slice(0, 20) + '…' : d }}</span>
                </el-tooltip>
              </el-tag>
            </template>
            <span v-else class="empty">全部合规</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never" class="history-card">
        <template #header>
          <div class="card-header">
            <span>历史开户记录（近10条）</span>
            <el-tag v-if="traceResult.recentOpenings.length === 0" type="info">暂无历史记录</el-tag>
          </div>
        </template>
        <CcbTable
          v-if="traceResult.recentOpenings.length > 0"
          v-model:page="page"
          v-model:page-size="pageSize"
          :data="traceResult.recentOpenings"
          :total="traceResult.recentOpenings.length"
          :show-index="true"
        >
          <el-table-column prop="openingNo" label="申请流水号" width="220" />
          <el-table-column prop="accountType" label="账户类型" width="120">
            <template #default="{ row }">
              {{ { 1: '一类账户', 2: '二类账户', 3: '三类账户' }[row.accountType] || '未知' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="targetOrgName" label="开户机构" width="200" />
          <el-table-column prop="createdAt" label="申请时间" width="180" />
        </CcbTable>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search, Warning, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  traceCheckOpeningApi, type TraceCheckResponse,
  AccountOpeningStatusText
} from '@api/account'

const loading = ref<boolean>(false)
const traceResult = ref<TraceCheckResponse | null>(null)
const page = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  idCardNo: '',
  customerName: ''
})

const getStatusType = (s: number): string => {
  if (s === 5) return 'success'
  if (s === 3 || s === 4) return 'warning'
  if (s === 6 || s === 8) return 'danger'
  if (s === 7) return 'info'
  return 'primary'
}
const getStatusLabel = (s: number) => AccountOpeningStatusText[s] || '未知'

const handleTrace = async () => {
  if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(searchForm.idCardNo)) {
    ElMessage.error('请输入正确的18位身份证号')
    return
  }
  loading.value = true
  traceResult.value = null
  try {
    traceResult.value = await traceCheckOpeningApi({ idCardNo: searchForm.idCardNo, customerName: searchForm.customerName })
  } catch (e: any) {
    ElMessage.error(e.message || '溯源查询失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchForm.idCardNo = ''
  searchForm.customerName = ''
  traceResult.value = null
}
</script>

<style lang="scss" scoped>
.ccb-business-opening-trace {
  .trace-search-card { margin-bottom: 16px; }
  .trace-search { display: flex; align-items: center; justify-content: center; }
  .trace-result { display: flex; flex-direction: column; gap: 16px; }
  .stat-card { display: flex; align-items: center; gap: 16px; }
  .stat-icon {
    width: 56px; height: 56px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; color: #fff;
    &.matched { background: linear-gradient(135deg, #1755a3, #2f80ff); }
    &.success { background: linear-gradient(135deg, #67c23a, #95d475); }
    &.danger { background: linear-gradient(135deg, #f56c6c, #ff8f8f); }
    & :deep(.el-icon) { font-size: 28px; }
  }
  .stat-info { flex: 1; }
  .stat-label { color: #909399; font-size: 13px; margin-bottom: 4px; }
  .stat-num { font-size: 24px; font-weight: 700; color: #303133;
    &.success { color: #67c23a; }
    &.danger { color: #f56c6c; }
  }
  .card-header { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
  .alert-card { background: #fffbe6; }
  .long-block { display: inline-block; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .short-text { cursor: help; }
  .empty { color: #909399; }
  .ripple-btn { position: relative; overflow: hidden; }
}
</style>
