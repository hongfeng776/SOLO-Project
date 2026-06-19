<template>
  <div class="ccb-corporate-profile-trace">
    <CcbPageHeader
      title="企业溯源查询"
      description="依托统一社会信用代码溯源企业历史建档、信息变更、销户记录，检测重复建档、失信主体及关键信息篡改风险"
      icon="Search"
    >
      <template #extra>
        <el-button :icon="ArrowLeft" @click="goBack">
          返回档案列表
        </el-button>
      </template>
    </CcbPageHeader>

    <el-card class="trace-search-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18" color="#e6a23c"><Search /></el-icon>
          <span class="header-title">溯源条件</span>
        </div>
      </template>

      <el-form :model="searchForm" label-width="140px" inline @submit.prevent>
        <el-form-item label="统一社会信用代码" required>
          <el-input
            v-model="searchForm.creditCode"
            placeholder="请输入18位统一社会信用代码"
            maxlength="18"
            style="width: 340px"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="企业名称">
          <el-input
            v-model="searchForm.enterpriseName"
            placeholder="请输入企业名称（选填）"
            style="width: 240px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="searchLoading" @click="handleSearch">
            开始溯源查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="searchLoading" class="trace-skeleton">
      <el-skeleton :rows="12" animated>
        <template #template>
          <el-skeleton-paragraph :rows="3" />
          <el-skeleton-table :rows="6" :columns="7" animated />
          <el-skeleton-paragraph :rows="4" />
        </template>
      </el-skeleton>
    </div>

    <div v-else-if="traceResult">
      <el-card class="summary-card" :class="{ 'blocked-card': !traceResult.allowed }">
        <template #header>
          <div class="summary-header">
            <div class="header-left">
              <el-icon :size="20" :class="traceResult.matched ? 'icon-success' : 'icon-unknown'">
                <CircleCheckFilled v-if="traceResult.matched" />
                <QuestionFilled v-else />
              </el-icon>
              <span class="header-title">溯源综合结果</span>
              <el-tag type="info" effect="plain" size="small">
                信用代码：{{ maskCreditCode(traceResult.creditCode) }}
              </el-tag>
            </div>
            <div class="header-right">
              <el-tag
                v-if="traceResult.allowed"
                type="success"
                effect="dark"
                size="large"
                round
              >
                <el-icon><CircleCheckFilled /></el-icon>
                允许建档
              </el-tag>
              <el-tag v-else type="danger" effect="dark" size="large" round>
                <el-icon><CircleCloseFilled /></el-icon>
                已拦截
              </el-tag>
            </div>
          </div>
        </template>

        <el-row :gutter="16" class="summary-row">
          <el-col :span="4">
            <div class="stat-card stat-total">
              <div class="stat-num">{{ traceResult.totalProfiles }}</div>
              <div class="stat-label">建档总数</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card stat-active">
              <div class="stat-num">{{ traceResult.totalActive }}</div>
              <div class="stat-label">有效档案</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card stat-closed">
              <div class="stat-num">{{ traceResult.totalClosed }}</div>
              <div class="stat-label">销户档案</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card stat-abnormal">
              <div class="stat-num">{{ traceResult.totalAbnormal }}</div>
              <div class="stat-label">异常档案</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div :class="['stat-card', traceResult.hasDuplicate ? 'stat-danger' : 'stat-safe']">
              <div class="stat-num">
                <el-icon v-if="traceResult.hasDuplicate"><WarningFilled /></el-icon>
                <el-icon v-else><CircleCheckFilled /></el-icon>
              </div>
              <div class="stat-label">重复建档风险</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div :class="['stat-card', traceResult.hasTampering ? 'stat-danger' : 'stat-safe']">
              <div class="stat-num">
                <el-icon v-if="traceResult.hasTampering"><WarningFilled /></el-icon>
                <el-icon v-else><CircleCheckFilled /></el-icon>
              </div>
              <div class="stat-label">篡改风险</div>
            </div>
          </el-col>
        </el-row>

        <div v-if="traceResult.blockReason || traceResult.riskPrompts.length > 0" class="risk-alerts">
          <el-alert
            v-if="traceResult.blockReason"
            :title="traceResult.blockReason"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
          <el-alert
            v-for="(prompt, idx) in traceResult.riskPrompts"
            :key="idx"
            :title="prompt"
            type="warning"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
        </div>
      </el-card>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-card class="records-card">
            <template #header>
              <div class="card-header">
                <el-icon :size="18" color="#409eff"><Document /></el-icon>
                <span class="header-title">历史建档记录</span>
                <el-tag type="info" effect="plain" size="small">
                  {{ traceResult.historyRecords.length }} 条
                </el-tag>
              </div>
            </template>

            <div v-if="traceResult.historyRecords.length === 0" class="empty-state">
              <el-empty description="未查询到历史建档记录" :image-size="80" />
            </div>
            <el-table
              v-else
              :data="traceResult.historyRecords"
              :stripe="true"
              border
              size="small"
            >
              <el-table-column prop="profileNo" label="档案编号" width="180" />
              <el-table-column prop="enterpriseName" label="企业名称" min-width="140" show-overflow-tooltip />
              <el-table-column prop="customerTypeText" label="客户类型" width="110">
                <template #default="{ row }">
                  <el-tag
                    :type="getCustomerTypeTag(row.customerType)"
                    effect="light"
                    size="small"
                  >
                    {{ row.customerTypeText || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="statusText" label="档案状态" width="100">
                <template #default="{ row }">
                  <el-tag
                    :type="getStatusTagType(row.status)"
                    effect="light"
                    size="small"
                  >
                    {{ row.statusText }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="orgName" label="归属机构" width="120" show-overflow-tooltip />
              <el-table-column prop="operateTime" label="操作时间" width="150" />
              <el-table-column label="备注" min-width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-text v-if="row.remark" type="danger">{{ row.remark }}</el-text>
                  <el-text v-else type="info">-</el-text>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="logs-card">
            <template #header>
              <div class="card-header">
                <el-icon :size="18" color="#67c23a"><Tickets /></el-icon>
                <span class="header-title">档案变更流水</span>
                <el-tag type="info" effect="plain" size="small">
                  {{ traceResult.changeLogs.length }} 条
                </el-tag>
              </div>
            </template>

            <div v-if="traceResult.changeLogs.length === 0" class="empty-state">
              <el-empty description="未查询到变更流水" :image-size="80" />
            </div>
            <el-timeline v-else class="logs-timeline">
              <el-timeline-item
                v-for="log in traceResult.changeLogs.slice(0, 30)"
                :key="log.id"
                :timestamp="log.operateTime"
                :type="getLogTimelineType(log.changeType)"
                placement="top"
                :hollow="log.changeType === '7'"
              >
                <div class="log-item-card" :class="`log-type-${log.changeType}`">
                  <div class="log-item-header">
                    <el-tag
                      :type="getLogTagType(log.changeType)"
                      effect="dark"
                      size="small"
                    >
                      {{ log.changeTypeName }}
                    </el-tag>
                    <span v-if="isTamperingLog(log)" class="tampering-badge">
                      <el-icon><WarningFilled /></el-icon>
                      疑似篡改
                    </span>
                    <span class="log-operator">
                      {{ log.operatorName || '系统' }}
                      <span v-if="log.operatorOrgName">@{{ log.operatorOrgName }}</span>
                    </span>
                  </div>
                  <div v-if="isTamperingLog(log) && log.beforeContent && log.afterContent" class="tampering-detail">
                    <div class="tampering-before">
                      <span class="tampering-label">变更前：</span>
                      <span class="tampering-value">{{ log.beforeContent }}</span>
                    </div>
                    <div class="tampering-after">
                      <span class="tampering-label">变更后：</span>
                      <span class="tampering-value">{{ log.afterContent }}</span>
                    </div>
                  </div>
                  <div v-else-if="log.changeRemark" class="log-item-remark">
                    {{ log.changeRemark }}
                  </div>
                  <div v-if="log.reviewerName" class="log-item-review">
                    <el-icon color="#e6a23c"><Stamp /></el-icon>
                    复核：{{ log.reviewerName }} / {{ log.reviewTime }}
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="action-card">
        <template #header>
          <div class="card-header">
            <el-icon :size="18" color="#f56c6c"><Setting /></el-icon>
            <span class="header-title">合规操作区</span>
          </div>
        </template>

        <div class="action-content">
          <div v-if="traceResult.hasDuplicate" class="duplicate-warning">
            <el-alert
              title="检测到同一信用代码存在多条有效档案，属于重复建档，请立即核查处理"
              type="error"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>建议措施：</p>
                <ol>
                  <li>逐一核查档案真实性，保留有效档案</li>
                  <li>对虚假档案执行锁定待复核操作</li>
                  <li>核实无误后对重复档案执行销户处理</li>
                </ol>
              </template>
            </el-alert>
          </div>

          <div v-if="traceResult.hasDishonest" class="dishonest-warning">
            <el-alert
              title="检测到该企业存在失信记录，属于高风险主体，请审慎办理业务"
              type="error"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>合规要求：</p>
                <ol>
                  <li>核实失信信息是否已修复或解除</li>
                  <li>如仍在失信名单中，需上报风控部门审批</li>
                  <li>不得为失信主体办理新增授信类业务</li>
                </ol>
              </template>
            </el-alert>
          </div>

          <div v-if="traceResult.hasTampering" class="tampering-warning">
            <el-alert
              title="检测到关键信息存在篡改痕迹（信用代码、企业名称、法定代表人、法人身份证号），请核实变更合法性"
              type="error"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>核查要点：</p>
                <ol>
                  <li>核实变更是否经有权机关审批</li>
                  <li>比对工商登记信息确认变更真实性</li>
                  <li>对涉嫌篡改的档案执行锁定并上报</li>
                </ol>
              </template>
            </el-alert>
          </div>

          <div v-if="traceResult.totalAbnormal > 0" class="abnormal-warning">
            <el-alert
              title="检测到异常锁定档案，请及时进行人工复核"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #default>
                <el-button type="warning" @click="goToReview">
                  <el-icon><Stamp /></el-icon>
                  前往复核工作台
                </el-button>
              </template>
            </el-alert>
          </div>

          <div class="action-buttons">
            <CcbPermissionButton permission="corporate:profile:create">
              <el-button
                type="primary"
                :icon="Plus"
                :disabled="!traceResult.allowed"
                @click="goToCreate"
              >
                新建档案
              </el-button>
            </CcbPermissionButton>
            <el-button
              v-if="!traceResult.allowed"
              type="warning"
              :icon="Warning"
              @click="showBlockDetail"
            >
              查看拦截原因
            </el-button>
            <el-button
              v-if="traceResult.totalAbnormal > 0"
              type="danger"
              :icon="Stamp"
              @click="goToReview"
            >
              前往复核
            </el-button>
            <el-button :icon="Download" @click="exportTraceReport">
              导出溯源报告
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div v-else class="empty-state-page">
      <el-empty :image-size="160" description="请输入统一社会信用代码开始溯源查询">
        <template #image>
          <el-icon :size="120" color="#c0c4cc"><Search /></el-icon>
        </template>
        <el-button type="primary" :icon="Search" @click="focusSearch">
          立即查询
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Search,
  Refresh,
  CircleCheckFilled,
  CircleCloseFilled,
  QuestionFilled,
  WarningFilled,
  Document,
  Tickets,
  Setting,
  Plus,
  Warning,
  Download,
  Stamp
} from '@element-plus/icons-vue'
import {
  traceCorporateProfileApi,
  type CorporateTraceResponse,
  type CorporateTraceRecord,
  type CorporateProfileLog
} from '@api/business'

const router = useRouter()

const searchLoading = ref<boolean>(false)
const traceResult = ref<CorporateTraceResponse | null>(null)

const searchForm = reactive({
  creditCode: '',
  enterpriseName: ''
})

const transformKeys = (obj: any): any => {
  if (!obj) return obj
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (typeof obj !== 'object') return obj
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
    result[camelKey] = transformKeys(obj[key])
  }
  return result
}

const CREDIT_CODE_REGEX = /^[0-9A-HJ-NP-RTUW-Y]{2}\d{6}[0-9A-HJ-NP-RTUW-Y]{10}$/

const handleSearch = async (): Promise<void> => {
  if (!searchForm.creditCode.trim()) {
    ElMessage.warning('请输入统一社会信用代码')
    return
  }
  if (searchForm.creditCode.length !== 18) {
    ElMessage.warning('统一社会信用代码必须为18位')
    return
  }
  if (!CREDIT_CODE_REGEX.test(searchForm.creditCode)) {
    ElMessage.warning('统一社会信用代码格式不正确')
    return
  }

  searchLoading.value = true
  traceResult.value = null
  try {
    const res = await traceCorporateProfileApi({
      credit_code: searchForm.creditCode,
      enterprise_name: searchForm.enterpriseName || undefined
    })
    traceResult.value = transformKeys(res.data)
  } catch (_e) {
    ElMessage.error('溯源查询失败')
  } finally {
    searchLoading.value = false
  }
}

const handleReset = (): void => {
  searchForm.creditCode = ''
  searchForm.enterpriseName = ''
  traceResult.value = null
}

const focusSearch = async (): Promise<void> => {
  await nextTick()
  const input = document.querySelector('.trace-search-card input') as HTMLInputElement
  input?.focus()
}

const maskCreditCode = (code: string): string => {
  if (!code || code.length < 18) return code
  return code.substring(0, 6) + '********' + code.substring(14)
}

const goBack = (): void => {
  router.push('/business/corporate-profile')
}

const goToCreate = (): void => {
  router.push({
    path: '/business/corporate-profile',
    query: { creditCode: searchForm.creditCode, enterpriseName: searchForm.enterpriseName }
  })
}

const goToReview = (): void => {
  router.push({ path: '/business/corporate-profile', query: { abnormal: '1' } })
}

const showBlockDetail = (): void => {
  if (!traceResult.value) return
  ElMessageBox.alert(
    `
      <div>
        <p><strong>拦截原因：</strong></p>
        <p>${traceResult.value.blockReason || '未知原因'}</p>
        <hr style="margin:12px 0" />
        <p><strong>风险提示：</strong></p>
        <ul>
          ${traceResult.value.riskPrompts.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    `,
    '拦截详情',
    { dangerouslyUseHTMLString: true, confirmButtonText: '我已知晓' }
  )
}

const exportTraceReport = (): void => {
  ElMessage.success('溯源报告导出任务已提交')
}

const getCustomerTypeTag = (type: number): string => {
  const map: Record<number, string> = { 1: 'primary', 2: 'success', 3: 'warning', 4: 'info' }
  return map[type] || 'info'
}

const getStatusTagType = (status: number): string => {
  const map: Record<number, string> = { 0: 'info', 1: 'success', 2: 'warning', 3: 'info', 4: 'danger' }
  return map[status] || 'info'
}

const TAMPERING_FIELDS = ['credit_code', 'enterprise_name', 'legal_representative', 'legal_id_card_no']

const isTamperingLog = (log: CorporateProfileLog): boolean => {
  if (!log.beforeContent || !log.afterContent) return false
  return TAMPERING_FIELDS.includes(log.changeType) || TAMPERING_FIELDS.some(f => log.changeRemark?.includes(f))
}

const CHANGE_TYPE_COLORS: Record<string, string> = {
  '1': 'primary',
  '2': 'warning',
  '3': 'success',
  '4': 'info',
  '5': 'danger',
  '6': 'info',
  '7': 'danger',
  '8': 'warning',
  '9': 'success'
}

const CHANGE_TYPE_TAG_COLORS: Record<string, string> = {
  '1': 'primary',
  '2': 'warning',
  '3': 'success',
  '4': '',
  '5': 'danger',
  '6': 'info',
  '7': 'danger',
  '8': 'warning',
  '9': 'success'
}

const getLogTimelineType = (changeType: string): string => {
  return CHANGE_TYPE_COLORS[changeType] || 'primary'
}

const getLogTagType = (changeType: string): string => {
  return CHANGE_TYPE_TAG_COLORS[changeType] || ''
}
</script>

<style lang="scss" scoped>
.ccb-corporate-profile-trace {
  .trace-search-card,
  .summary-card,
  .records-card,
  .logs-card,
  .action-card {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .header-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-right: 12px;
    }
  }

  .trace-skeleton {
    padding: 20px;
    background: #fff;
    border-radius: 4px;
  }

  .summary-card {
    border-radius: 6px;

    &.blocked-card {
      border: 2px solid #f56c6c;
      background: linear-gradient(135deg, #fff8f8, #fff0f0);
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .icon-success {
          color: #67c23a;
        }
        .icon-unknown {
          color: #909399;
        }

        .header-title {
          font-size: 16px;
          font-weight: 600;
        }
      }
    }

    .summary-row {
      margin-bottom: 12px;

      .stat-card {
        padding: 16px 12px;
        border-radius: 6px;
        text-align: center;

        .stat-num {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .stat-label {
          font-size: 12px;
          color: #606266;
        }

        &.stat-total {
          background: linear-gradient(135deg, #ecf5ff, #d9ecff);
          .stat-num { color: #409eff; }
        }
        &.stat-active {
          background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
          .stat-num { color: #67c23a; }
        }
        &.stat-closed {
          background: linear-gradient(135deg, #f4f4f5, #e9e9eb);
          .stat-num { color: #909399; }
        }
        &.stat-abnormal {
          background: linear-gradient(135deg, #fef0f0, #fde2e2);
          .stat-num { color: #f56c6c; }
        }
        &.stat-safe {
          background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
          .stat-num { color: #67c23a; }
        }
        &.stat-danger {
          background: linear-gradient(135deg, #fef0f0, #fab6b6);
          .stat-num { color: #c0392b; }
        }
      }
    }

    .risk-alerts {
      margin-top: 8px;
    }
  }

  .records-card,
  .logs-card {
    height: 520px;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      overflow: auto;
    }
  }

  .logs-timeline {
    padding: 4px 0;

    .log-item-card {
      padding: 10px 12px;
      border-radius: 4px;
      background: #fafafa;
      border-left: 3px solid #409eff;

      &.log-type-1 {
        border-left-color: #409eff;
        background: #ecf5ff;
      }
      &.log-type-2 {
        border-left-color: #e6a23c;
        background: #fdf6ec;
      }
      &.log-type-3 {
        border-left-color: #67c23a;
        background: #f0f9eb;
      }
      &.log-type-4 {
        border-left-color: #00bcd4;
        background: #e0f7fa;
      }
      &.log-type-5 {
        border-left-color: #f56c6c;
        background: #fef0f0;
      }
      &.log-type-6 {
        border-left-color: #909399;
        background: #f4f4f5;
      }
      &.log-type-7 {
        border-left-color: #8b0000;
        background: #fde8e8;
      }
      &.log-type-8 {
        border-left-color: #e6a23c;
        background: #fdf6ec;
      }
      &.log-type-9 {
        border-left-color: #67c23a;
        background: #f0f9eb;
      }

      .log-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .tampering-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #f56c6c;
          background: rgba(245, 108, 108, 0.1);
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: 600;
        }

        .log-operator {
          font-size: 12px;
          color: #909399;
        }
      }

      .tampering-detail {
        padding: 6px 10px;
        background: rgba(245, 108, 108, 0.06);
        border-radius: 3px;
        margin-bottom: 6px;

        .tampering-before,
        .tampering-after {
          font-size: 13px;
          line-height: 1.6;

          .tampering-label {
            color: #909399;
            font-weight: 500;
          }
          .tampering-value {
            color: #303133;
          }
        }
        .tampering-before {
          .tampering-value {
            text-decoration: line-through;
            color: #f56c6c;
          }
        }
        .tampering-after {
          .tampering-value {
            color: #e6a23c;
            font-weight: 600;
          }
        }
      }

      .log-item-remark {
        font-size: 13px;
        color: #606266;
        margin-bottom: 4px;
      }

      .log-item-review {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #e6a23c;
        padding: 4px 8px;
        background: rgba(230, 162, 60, 0.1);
        border-radius: 3px;
      }
    }
  }

  .action-card {
    .action-content {
      .duplicate-warning,
      .dishonest-warning,
      .tampering-warning,
      .abnormal-warning {
        margin-bottom: 16px;
      }

      .action-buttons {
        display: flex;
        gap: 12px;
      }
    }
  }

  .empty-state {
    padding: 40px 0;
  }

  .empty-state-page {
    margin-top: 80px;
  }
}
</style>
