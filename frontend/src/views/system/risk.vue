<template>
  <div class="page-container">
    <div class="page-content">
      <el-tabs v-model="activeTab" class="risk-tabs">
        <el-tab-pane label="风控规则配置" name="rules">
          <ProTable
            ref="ruleTableRef"
            :columns="ruleColumns"
            :search-columns="ruleSearchColumns"
            :request="fetchRuleList"
            :show-add="true"
            :show-edit="true"
            :show-delete="true"
            :show-view="false"
            :show-selection="true"
            :show-batch-delete="true"
            :actions-width="220"
            @add="openRuleDialog"
            @edit="openRuleDialog"
            @delete="handleDeleteRule"
            @batch-delete="handleBatchDeleteRule"
          >
            <template #enabledStatus="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" effect="light" size="small">
                {{ row.enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
            <template #actions="{ row }">
              <el-button link type="primary" @click="openRuleDialog(row, true)">编辑</el-button>
              <el-switch
                v-model="row.enabled"
                size="small"
                :active-text="row.enabled ? '启用' : '禁用'"
                inline-prompt
                @change="handleToggleRule(row)"
              />
              <el-button link type="danger" @click="handleDeleteRule(row)">删除</el-button>
            </template>
          </ProTable>
        </el-tab-pane>

        <el-tab-pane label="风险预警列表" name="warnings">
          <div class="warning-stats">
            <div class="stat-item warning">
              <div class="stat-label">高危预警</div>
              <div class="stat-value">{{ warningStats.high }}</div>
            </div>
            <div class="stat-item danger">
              <div class="stat-label">中危预警</div>
              <div class="stat-value">{{ warningStats.medium }}</div>
            </div>
            <div class="stat-item notice">
              <div class="stat-label">低危预警</div>
              <div class="stat-value">{{ warningStats.low }}</div>
            </div>
            <div class="stat-item pending">
              <div class="stat-label">待处理</div>
              <div class="stat-value">{{ warningStats.pending }}</div>
            </div>
          </div>

          <ProTable
            ref="warningTableRef"
            :columns="warningColumns"
            :search-columns="warningSearchColumns"
            :request="fetchWarningList"
            :show-add="false"
            :show-edit="false"
            :show-delete="false"
            :show-view="true"
            :show-selection="true"
            :show-batch-delete="false"
            :actions-width="200"
            @view="openWarningDetail"
          >
            <template #toolbar-left>
              <el-button
                type="primary"
                :disabled="!selectedWarnings.length"
                @click="batchHandleWarning(1)"
              >
                <el-icon><Select /></el-icon>批量通过
              </el-button>
              <el-button
                type="warning"
                :disabled="!selectedWarnings.length"
                @click="batchHandleWarning(2)"
              >
                <el-icon><Warning /></el-icon>批量标记
              </el-button>
              <el-button
                type="danger"
                :disabled="!selectedWarnings.length"
                @click="batchHandleWarning(3)"
              >
                <el-icon><Close /></el-icon>批量拦截
              </el-button>
            </template>

            <template #level="{ row }">
              <el-tag :type="levelMap[row.level]?.type || 'info'" effect="light" size="small">
                {{ row.levelName || levelMap[row.level]?.label }}
              </el-tag>
            </template>

            <template #status="{ row }">
              <el-tag :type="warningStatusMap[row.status]?.type || 'info'" effect="light" size="small">
                {{ row.statusName || warningStatusMap[row.status]?.label }}
              </el-tag>
            </template>

            <template #actions="{ row }">
              <el-button link type="primary" @click="openWarningDetail(row)">详情</el-button>
              <el-button
                v-if="row.status === 0"
                link
                type="success"
                @click="handleWarning(row, 1)"
              >通过</el-button>
              <el-button
                v-if="row.status === 0"
                link
                type="warning"
                @click="handleWarning(row, 2)"
              >标记</el-button>
              <el-button
                v-if="row.status === 0"
                link
                type="danger"
                @click="handleWarning(row, 3)"
              >拦截</el-button>
            </template>
          </ProTable>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      v-model="ruleDialogVisible"
      :title="ruleDialogMode === 'view' ? '查看规则' : ruleDialogData.id ? '编辑规则' : '新增规则'"
      width="720px"
      destroy-on-close
    >
      <el-form :model="ruleFormData" :rules="ruleFormRules" ref="ruleFormRef" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规则名称" prop="name">
              <el-input v-model="ruleFormData.name" placeholder="请输入规则名称" :disabled="ruleDialogMode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则编码" prop="code">
              <el-input v-model="ruleFormData.code" placeholder="请输入规则编码" :disabled="ruleDialogMode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则类型" prop="type">
              <el-select v-model="ruleFormData.type" placeholder="请选择规则类型" style="width: 100%" :disabled="ruleDialogMode === 'view'">
                <el-option label="订单风控" :value="1" />
                <el-option label="用户风控" :value="2" />
                <el-option label="支付风控" :value="3" />
                <el-option label="商品风控" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险等级" prop="level">
              <el-select v-model="ruleFormData.level" placeholder="请选择风险等级" style="width: 100%" :disabled="ruleDialogMode === 'view'">
                <el-option label="低危" :value="1" />
                <el-option label="中危" :value="2" />
                <el-option label="高危" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="触发动作" prop="action">
              <el-radio-group v-model="ruleFormData.action" :disabled="ruleDialogMode === 'view'">
                <el-radio :value="1">仅记录</el-radio>
                <el-radio :value="2">标记预警</el-radio>
                <el-radio :value="3">人工审核</el-radio>
                <el-radio :value="4">自动拦截</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="规则描述" prop="description">
              <el-input
                v-model="ruleFormData.description"
                type="textarea"
                :rows="2"
                placeholder="请输入规则描述"
                :disabled="ruleDialogMode === 'view'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="条件配置">
              <div class="conditions-list">
                <div
                  class="condition-item"
                  v-for="(cond, index) in ruleFormData.conditions"
                  :key="index"
                >
                  <el-select v-model="cond.field" placeholder="字段" style="width: 160px; margin-right: 8px;" :disabled="ruleDialogMode === 'view'">
                    <el-option label="订单金额" value="amount" />
                    <el-option label="用户等级" value="userLevel" />
                    <el-option label="下单频率" value="orderFrequency" />
                    <el-option label="收货地址" value="address" />
                    <el-option label="支付方式" value="payMethod" />
                    <el-option label="IP地址" value="ip" />
                    <el-option label="设备指纹" value="deviceId" />
                  </el-select>
                  <el-select v-model="cond.operator" placeholder="操作符" style="width: 120px; margin-right: 8px;" :disabled="ruleDialogMode === 'view'">
                    <el-option label="大于" value=">" />
                    <el-option label="小于" value="<" />
                    <el-option label="等于" value="==" />
                    <el-option label="不等于" value="!=" />
                    <el-option label="大于等于" value=">=" />
                    <el-option label="小于等于" value="<=" />
                    <el-option label="包含" value="in" />
                    <el-option label="不包含" value="notIn" />
                  </el-select>
                  <el-input v-model="cond.value" placeholder="阈值" style="width: 160px; margin-right: 8px;" :disabled="ruleDialogMode === 'view'" />
                  <el-select v-if="index < ruleFormData.conditions.length - 1" v-model="cond.logic" style="width: 80px; margin-right: 8px;" :disabled="ruleDialogMode === 'view'">
                    <el-option label="且" value="AND" />
                    <el-option label="或" value="OR" />
                  </el-select>
                  <el-button
                    v-if="ruleDialogMode !== 'view'"
                    type="danger"
                    link
                    @click="removeCondition(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-button
                  v-if="ruleDialogMode !== 'view'"
                  type="primary"
                  link
                  @click="addCondition"
                >
                  <el-icon><Plus /></el-icon>添加条件
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button
          v-if="ruleDialogMode !== 'view'"
          type="primary"
          @click="submitRuleForm"
        >确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="warningDetailVisible" title="预警详情" width="640px">
      <el-descriptions :column="2" border v-if="currentWarning">
        <el-descriptions-item label="预警ID">{{ currentWarning.id }}</el-descriptions-item>
        <el-descriptions-item label="预警级别">
          <el-tag :type="levelMap[currentWarning.level]?.type || 'info'" effect="light">
            {{ currentWarning.levelName || levelMap[currentWarning.level]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="规则名称">{{ currentWarning.ruleName }}</el-descriptions-item>
        <el-descriptions-item label="目标类型">{{ currentWarning.targetType }}</el-descriptions-item>
        <el-descriptions-item label="目标ID" :span="2">{{ currentWarning.targetId }}</el-descriptions-item>
        <el-descriptions-item label="目标名称" :span="2">{{ currentWarning.targetName }}</el-descriptions-item>
        <el-descriptions-item label="触发原因" :span="2">{{ currentWarning.reason }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="warningStatusMap[currentWarning.status]?.type || 'info'" effect="light">
            {{ currentWarning.statusName || warningStatusMap[currentWarning.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="触发时间">{{ formatDateTime(currentWarning.createdAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentWarning.handler" label="处理人">{{ currentWarning.handler }}</el-descriptions-item>
        <el-descriptions-item v-if="currentWarning.handleTime" label="处理时间">{{ formatDateTime(currentWarning.handleTime) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentWarning.handleRemark" label="处理备注" :span="2">
          {{ currentWarning.handleRemark }}
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="currentWarning?.status === 0" style="margin-top: 20px;">
        <el-form label-width="80px">
          <el-form-item label="处理备注">
            <el-input v-model="handleRemark" type="textarea" :rows="2" placeholder="请输入处理备注" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="warningDetailVisible = false">关闭</el-button>
        <template v-if="currentWarning?.status === 0">
          <el-button type="success" @click="confirmHandleWarning(1)">通过</el-button>
          <el-button type="warning" @click="confirmHandleWarning(2)">标记</el-button>
          <el-button type="danger" @click="confirmHandleWarning(3)">拦截</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import ProTable from '@/components/ProTable/index.vue'
import type { RiskRule, RiskWarning, RiskCondition } from '@/api/risk'
import { formatDateTime } from '@/utils/date'

const activeTab = ref('rules')
const ruleTableRef = ref()
const warningTableRef = ref()
const ruleFormRef = ref<FormInstance>()

const levelMap: Record<number, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  1: { label: '低危', type: 'info' },
  2: { label: '中危', type: 'warning' },
  3: { label: '高危', type: 'danger' }
}

const warningStatusMap: Record<number, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  0: { label: '待处理', type: 'warning' },
  1: { label: '已通过', type: 'success' },
  2: { label: '已标记', type: 'info' },
  3: { label: '已拦截', type: 'danger' }
}

const warningStats = reactive({ high: 5, medium: 18, low: 32, pending: 27 })
const selectedWarnings = ref<any[]>([])

const ruleSearchColumns = [
  { prop: 'name', label: '规则名称', type: 'input' as const },
  { prop: 'type', label: '规则类型', type: 'select' as const, options: [
    { label: '订单风控', value: 1 }, { label: '用户风控', value: 2 },
    { label: '支付风控', value: 3 }, { label: '商品风控', value: 4 }
  ]},
  { prop: 'level', label: '风险等级', type: 'select' as const, options: [
    { label: '低危', value: 1 }, { label: '中危', value: 2 }, { label: '高危', value: 3 }
  ]},
  { prop: 'enabled', label: '状态', type: 'select' as const, options: [
    { label: '已启用', value: '1' }, { label: '已禁用', value: '0' }
  ]}
]

const ruleColumns = [
  { prop: 'name', label: '规则名称', minWidth: 150 },
  { prop: 'code', label: '规则编码', width: 140 },
  { prop: 'typeName', label: '规则类型', width: 100, align: 'center' },
  { prop: 'levelName', label: '风险等级', width: 100, align: 'center', type: 'status' as const,
    statusMap: { '1': { label: '低危', type: 'info' as const }, '2': { label: '中危', type: 'warning' as const }, '3': { label: '高危', type: 'danger' as const } } },
  { prop: 'actionName', label: '触发动作', width: 100, align: 'center' },
  { prop: 'enabled', label: '状态', width: 100, align: 'center', slot: 'enabledStatus' },
  { prop: 'updatedAt', label: '更新时间', width: 170, type: 'datetime' as const }
]

const warningSearchColumns = [
  { prop: 'level', label: '预警级别', type: 'select' as const, options: [
    { label: '低危', value: 1 }, { label: '中危', value: 2 }, { label: '高危', value: 3 }
  ]},
  { prop: 'status', label: '处理状态', type: 'select' as const, options: [
    { label: '待处理', value: 0 }, { label: '已通过', value: 1 },
    { label: '已标记', value: 2 }, { label: '已拦截', value: 3 }
  ]},
  { prop: 'targetType', label: '目标类型', type: 'select' as const, options: [
    { label: '订单', value: 'order' }, { label: '用户', value: 'user' },
    { label: '支付', value: 'payment' }
  ]},
  { prop: 'timeRange', label: '触发时间', type: 'daterange' as const }
]

const warningColumns = [
  { prop: 'id', label: '预警ID', width: 90 },
  { prop: 'levelName', label: '级别', width: 90, align: 'center', slot: 'level' },
  { prop: 'ruleName', label: '规则名称', minWidth: 140 },
  { prop: 'targetType', label: '目标类型', width: 90, align: 'center' },
  { prop: 'targetName', label: '目标名称', minWidth: 140, showOverflowTooltip: true },
  { prop: 'reason', label: '触发原因', minWidth: 180, showOverflowTooltip: true },
  { prop: 'statusName', label: '状态', width: 90, align: 'center', slot: 'status' },
  { prop: 'handler', label: '处理人', width: 90 },
  { prop: 'createdAt', label: '触发时间', width: 170, type: 'datetime' as const }
]

const mockRules = () => {
  const names = ['大额订单检测', '高频下单检测', '异常地址检测', '新用户大额检测', '异地登录检测', '重复支付检测', '虚拟商品风控', '优惠券滥用检测']
  const types = [1, 2, 3, 4]
  const levels = [1, 2, 3]
  const actions = [1, 2, 3, 4]
  const list = names.map((name, i) => ({
    id: i + 1,
    name,
    code: `RULE_${String(i + 1).padStart(4, '0')}`,
    type: types[i % 4],
    typeName: ['订单风控', '用户风控', '支付风控', '商品风控'][i % 4],
    level: levels[i % 3],
    levelName: ['低危', '中危', '高危'][i % 3],
    description: `${name}规则描述，用于检测异常行为并触发对应动作`,
    conditions: [{ field: 'amount', fieldName: '订单金额', operator: '>', value: '50000', logic: 'AND' as const }],
    action: actions[i % 4],
    actionName: ['仅记录', '标记预警', '人工审核', '自动拦截'][i % 4],
    enabled: i % 3 !== 0,
    createdAt: '2024-06-10 10:00:00',
    updatedAt: '2024-06-15 14:30:00'
  }))
  return { list, total: list.length }
}

const mockWarnings = () => {
  const reasons = [
    '订单金额超过阈值(50000元)',
    '用户1小时内下单超过10次',
    '收货地址与历史地址差异过大',
    '新用户首次下单金额过高',
    '检测到异地登录IP',
    '同一用户短时间多次支付失败',
    '优惠券使用频率异常',
    '设备指纹关联多个账号'
  ]
  const list: RiskWarning[] = []
  for (let i = 0; i < 20; i++) {
    const level = [1, 2, 3][i % 3]
    const status = [0, 0, 0, 1, 2, 3][i % 6]
    list.push({
      id: 10000 + i,
      ruleId: (i % 8) + 1,
      ruleName: ['大额订单检测', '高频下单检测', '异常地址检测', '新用户大额检测'][i % 4],
      level,
      levelName: ['低危', '中危', '高危'][level - 1],
      targetType: ['order', 'user', 'payment'][i % 3],
      targetId: 20000 + i,
      targetName: i % 3 === 0 ? `SO${202406000000 + i}` : `用户${1000 + i}`,
      reason: reasons[i % reasons.length],
      status,
      statusName: ['待处理', '已通过', '已标记', '已拦截'][status],
      handler: status !== 0 ? `管理员${(i % 3) + 1}` : undefined,
      handlerId: status !== 0 ? (i % 3) + 1 : undefined,
      handleRemark: status !== 0 ? '经过核实，处理完成' : undefined,
      handleTime: status !== 0 ? `2024-06-16 ${String(10 + (i % 8)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00` : undefined,
      createdAt: `2024-06-16 ${String((i % 12) + 8).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00`
    })
  }
  return { list, total: list.length }
}

const fetchRuleList = async (params: Record<string, unknown>) => {
  await new Promise(r => setTimeout(r, 300))
  const { list, total } = mockRules()
  const pageNum = (params.pageNum as number) || 1
  const pageSize = (params.pageSize as number) || 10
  const start = (pageNum - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total }
}

const fetchWarningList = async (params: Record<string, unknown>) => {
  await new Promise(r => setTimeout(r, 300))
  const { list, total } = mockWarnings()
  const pageNum = (params.pageNum as number) || 1
  const pageSize = (params.pageSize as number) || 10
  const start = (pageNum - 1) * pageSize
  selectedWarnings.value = []
  return { list: list.slice(start, start + pageSize), total }
}

const ruleDialogVisible = ref(false)
const ruleDialogMode = ref<'add' | 'edit' | 'view'>('add')
const ruleDialogData = ref<Partial<RiskRule>>({})

const ruleFormData = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  type: undefined as number | undefined,
  level: undefined as number | undefined,
  action: undefined as number | undefined,
  description: '',
  conditions: [{ field: '', operator: '', value: '' as any, logic: 'AND' as const }] as Array<{ field: string; fieldName?: string; operator: string; value: any; logic?: 'AND' | 'OR' }>
})

const ruleFormRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  level: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  action: [{ required: true, message: '请选择触发动作', trigger: 'change' }]
}

const addCondition = () => {
  ruleFormData.conditions.push({ field: '', fieldName: '', operator: '', value: '' as any, logic: 'AND' as const })
}

const removeCondition = (index: number) => {
  if (ruleFormData.conditions.length > 1) {
    ruleFormData.conditions.splice(index, 1)
  }
}

const openRuleDialog = (row?: Record<string, unknown>, isView = false) => {
  ruleDialogData.value = row ? { ...row } as Partial<RiskRule> : {}
  ruleDialogMode.value = isView ? 'view' : (row ? 'edit' : 'add')

  if (row) {
    Object.assign(ruleFormData, {
      id: row.id as number,
      name: row.name as string,
      code: row.code as string,
      type: row.type as number,
      level: row.level as number,
      action: row.action as number,
      description: row.description as string,
      conditions: (row.conditions as RiskCondition[])?.length
        ? JSON.parse(JSON.stringify(row.conditions))
        : [{ field: '', fieldName: '', operator: '', value: '' as any, logic: 'AND' as const }]
    })
  } else {
    Object.assign(ruleFormData, {
      id: undefined,
      name: '',
      code: '',
      type: undefined,
      level: undefined,
      action: undefined,
      description: '',
      conditions: [{ field: '', fieldName: '', operator: '', value: '' as any, logic: 'AND' as const }]
    })
  }
  ruleDialogVisible.value = true
}

const submitRuleForm = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success(ruleDialogData.value.id ? '更新成功' : '创建成功')
      ruleDialogVisible.value = false
      ruleTableRef.value?.fetchData()
    }
  })
}

const handleToggleRule = async (row: any) => {
  ElMessage.success(row.enabled ? '规则已启用' : '规则已禁用')
}

const handleDeleteRule = async (_row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该规则吗？', '提示', { type: 'warning' })
    ElMessage.success('删除成功')
    ruleTableRef.value?.fetchData()
  } catch {}
}

const handleBatchDeleteRule = async () => {
  ElMessage.success('批量删除成功')
  ruleTableRef.value?.fetchData()
}

const warningDetailVisible = ref(false)
const currentWarning = ref<RiskWarning | null>(null)
const handleRemark = ref('')

const openWarningDetail = (row: any) => {
  currentWarning.value = { ...row } as RiskWarning
  handleRemark.value = ''
  warningDetailVisible.value = true
}

const handleWarning = (row: any, _status: number) => {
  currentWarning.value = { ...row } as RiskWarning
  handleRemark.value = ''
  warningDetailVisible.value = true
}

const confirmHandleWarning = (status: number) => {
  if (!currentWarning.value) return
  const labels = ['', '已通过', '已标记', '已拦截']
  ElMessage.success(`预警${labels[status]}成功`)
  warningDetailVisible.value = false
  warningTableRef.value?.fetchData()
}

const batchHandleWarning = (status: number) => {
  const labels = ['', '通过', '标记', '拦截']
  ElMessageBox.confirm(`确定要${labels[status]}选中的 ${selectedWarnings.value.length} 条预警吗？`, '提示', { type: 'warning' })
    .then(() => {
      ElMessage.success(`批量${labels[status]}成功`)
      warningTableRef.value?.handleClearSelection()
      warningTableRef.value?.fetchData()
    })
    .catch(() => {})
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-container {
  .warning-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-base;
    margin-bottom: $spacing-base;

    .stat-item {
      background: #fff;
      border-radius: $radius-md;
      padding: $spacing-base;
      box-shadow: $shadow-light;
      border-left: 4px solid;

      &.warning { border-left-color: #f56c6c; }
      &.danger { border-left-color: #e6a23c; }
      &.notice { border-left-color: #909399; }
      &.pending { border-left-color: #409eff; }

      .stat-label {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-bottom: 6px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: $text-primary;
      }
    }
  }

  .conditions-list {
    width: 100%;

    .condition-item {
      display: flex;
      align-items: center;
      margin-bottom: $spacing-sm;
      padding: $spacing-sm;
      background: $bg-color;
      border-radius: $radius-sm;
    }
  }
}

@media screen and (max-width: 1200px) {
  .page-container .warning-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
