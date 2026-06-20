<template>
  <div class="ccb-customer-privacy-rule">
    <CcbPageHeader
      title="隐私防护规则配置"
      description="根据客户等级、信息敏感度、操作岗位配置差异化脱敏策略"
      icon="Setting"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="规则编码" prop="ruleCode">
        <el-input v-model="searchForm.ruleCode" placeholder="请输入规则编码" clearable />
      </el-form-item>
      <el-form-item label="规则名称" prop="ruleName">
        <el-input v-model="searchForm.ruleName" placeholder="请输入规则名称" clearable />
      </el-form-item>
      <el-form-item label="客户等级" prop="customerLevel">
        <el-select v-model="searchForm.customerLevel" placeholder="请选择客户等级" clearable>
          <el-option v-for="(t, k) in customerLevelOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="敏感度" prop="sensitivityLevel">
        <el-select v-model="searchForm.sensitivityLevel" placeholder="请选择敏感度" clearable>
          <el-option v-for="(t, k) in sensitivityLevelOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作岗位" prop="operatorPosition">
        <el-select v-model="searchForm.operatorPosition" placeholder="请选择操作岗位" clearable>
          <el-option v-for="(t, k) in operatorPositionOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="场景类型" prop="sceneType">
        <el-select v-model="searchForm.sceneType" placeholder="请选择场景类型" clearable>
          <el-option v-for="(t, k) in sceneOptions" :key="k" :label="t.name" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否全局" prop="isGlobal">
        <el-select v-model="searchForm.isGlobal" placeholder="请选择" clearable>
          <el-option label="全局规则" :value="1" />
          <el-option label="非全局规则" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <CcbPermissionButton permission="customer:privacy:config">
          <el-button type="primary" :icon="Plus" @click="handleAddRule">
            新增规则
          </el-button>
        </CcbPermissionButton>
        <CcbPermissionButton permission="customer:privacy:config">
          <el-button type="success" :icon="Upload" @click="handleBatchConfig">
            批量配置
          </el-button>
        </CcbPermissionButton>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">规则总数：</el-text>
        <el-text type="primary" size="large" bold>{{ total }}</el-text>
        <el-divider direction="vertical" />
        <el-tag type="success" effect="plain">已启用 {{ stats.enabled }}</el-tag>
        <el-tag type="info" effect="plain">全局规则 {{ stats.global }}</el-tag>
        <el-tag type="warning" effect="plain">高端客户 {{ stats.highLevel }}</el-tag>
      </div>
    </div>

    <div v-if="listLoading" class="skeleton-wrapper">
      <el-skeleton :rows="8" animated :throttle="200">
        <template #template>
          <el-skeleton-table :rows="8" :columns="10" animated />
        </template>
      </el-skeleton>
    </div>

    <el-table
      v-else
      v-loading="listLoading"
      :data="tableData"
      :stripe="true"
      border
      style="width: 100%"
    >
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="ruleCode" label="规则编码" width="140" />
      <el-table-column prop="ruleName" label="规则名称" width="140" show-overflow-tooltip />
      <el-table-column prop="customerLevel" label="适用客户等级" width="120">
        <template #default="{ row }">
          <el-tag :type="getCustomerLevelTagType(row.customerLevel)" effect="light" size="small">
            {{ customerLevelOptions[row.customerLevel] || '全部' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sensitivityLevel" label="信息敏感度" width="100">
        <template #default="{ row }">
          <el-tag :type="getSensitivityTagType(row.sensitivityLevel)" effect="light" size="small">
            {{ sensitivityLevelOptions[row.sensitivityLevel] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operatorPosition" label="操作岗位" width="100">
        <template #default="{ row }">
          {{ operatorPositionOptions[row.operatorPosition] || '全部' }}
        </template>
      </el-table-column>
      <el-table-column prop="sceneType" label="适用场景" width="120">
        <template #default="{ row }">
          <el-tag effect="plain" size="small">
            {{ sceneOptions[row.sceneType]?.name || '全部' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="desensitizationLevel" label="脱敏级别" width="100">
        <template #default="{ row }">
          <el-tag :type="getDesensitizationTagType(getRuleDesensitizationLevel(row))" effect="light" size="small">
            {{ desensitizationLevelOptions[getRuleDesensitizationLevel(row)] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="timeLimit" label="时效限制" width="90">
        <template #default="{ row }">
          {{ row.timeLimit || '-' }} 分钟
        </template>
      </el-table-column>
      <el-table-column label="控制项" width="140">
        <template #default="{ row }">
          <div class="control-tags">
            <el-tag v-if="row.needRecord" type="warning" effect="dark" size="small">需备案</el-tag>
            <el-tag v-if="row.needOperationLog" type="info" effect="dark" size="small">需日志</el-tag>
            <el-tag v-if="row.isGlobal" type="success" effect="dark" size="small">全局</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <CcbPermissionButton permission="customer:privacy:config">
            <el-button type="primary" link size="small" @click="handleEditRule(row)">
              编辑
            </el-button>
          </CcbPermissionButton>
          <CcbPermissionButton permission="customer:privacy:config">
            <el-button type="success" link size="small" @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </CcbPermissionButton>
          <CcbPermissionButton permission="customer:privacy:config">
            <el-button type="danger" link size="small" @click="handleDeleteRule(row)">
              删除
            </el-button>
          </CcbPermissionButton>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageParams.page"
        v-model:page-size="pageParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog
      v-model="ruleDialogVisible"
      :title="ruleDialogTitle"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="ruleDialogLoading" class="form-skeleton">
        <el-skeleton :rows="10" animated />
      </div>
      <el-form
        v-else
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="120px"
        class="rule-form"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规则编码" prop="ruleCode">
              <el-input v-model="ruleForm.ruleCode" placeholder="请输入规则编码" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则名称" prop="ruleName">
              <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用客户等级" prop="customerLevel">
              <el-select v-model="ruleForm.customerLevel" placeholder="请选择" style="width: 100%">
                <el-option v-for="(t, k) in customerLevelOptions" :key="k" :label="t" :value="Number(k)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信息敏感度" prop="sensitivityLevel">
              <el-select v-model="ruleForm.sensitivityLevel" placeholder="请选择" style="width: 100%">
                <el-option v-for="(t, k) in sensitivityLevelOptions" :key="k" :label="t" :value="Number(k)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="操作岗位" prop="operatorPosition">
              <el-select v-model="ruleForm.operatorPosition" placeholder="请选择" style="width: 100%">
                <el-option v-for="(t, k) in operatorPositionOptions" :key="k" :label="t" :value="Number(k)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用场景" prop="sceneType">
              <el-select v-model="ruleForm.sceneType" placeholder="请选择" style="width: 100%">
                <el-option v-for="(t, k) in sceneOptions" :key="k" :label="t.name" :value="Number(k)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="脱敏级别" prop="desensitizationLevel">
              <el-select v-model="ruleForm.desensitizationLevel" placeholder="请选择" style="width: 100%">
                <el-option v-for="(t, k) in desensitizationLevelOptions" :key="k" :label="t" :value="Number(k)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时效限制（分钟）" prop="timeLimit">
              <el-input-number v-model="ruleForm.timeLimit" :min="5" :max="480" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">脱敏规则配置</el-divider>

        <el-form-item label="敏感字段">
          <el-select
            v-model="ruleForm.sensitiveFieldList"
            multiple
            filterable
            placeholder="请选择敏感字段"
            style="width: 100%"
          >
            <el-option v-for="field in sensitiveFieldOptions" :key="field.value" :label="field.label" :value="field.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="脱敏方式详情">
          <div class="desensitization-config">
            <el-table
              :data="ruleForm.desensitizationRuleList"
              border
              size="small"
              style="width: 100%"
            >
              <el-table-column prop="fieldName" label="字段名" width="140" />
              <el-table-column prop="method" label="脱敏方式" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.method" style="width: 100%">
                    <el-option v-for="(t, k) in desensitizationMethodOptions" :key="k" :label="t" :value="Number(k)" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="keepStart" label="保留前N位" width="110">
                <template #default="{ row }">
                  <el-input-number v-model="row.keepStart" :min="0" :max="10" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column prop="keepEnd" label="保留后N位" width="110">
                <template #default="{ row }">
                  <el-input-number v-model="row.keepEnd" :min="0" :max="10" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column prop="maskChar" label="掩码字符" width="100">
                <template #default="{ row }">
                  <el-input v-model="row.maskChar" maxlength="3" placeholder="*" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="removeDesensitizationRule($index)">
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" link size="small" @click="addDesensitizationRule" style="margin-top: 8px">
              + 添加脱敏规则
            </el-button>
          </div>
        </el-form-item>

        <el-divider content-position="left">留存规则配置</el-divider>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="留存天数" prop="retentionDays">
              <el-input-number v-model="ruleForm.retentionDays" :min="7" :max="3650" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="需要操作日志">
              <el-switch v-model="ruleForm.needOperationLog" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">控制项</el-divider>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="需要备案">
              <el-switch v-model="ruleForm.needRecord" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="全局生效">
              <el-switch v-model="ruleForm.isGlobal" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-switch v-model="ruleForm.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRule" :loading="ruleDialogLoading">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchConfigDialogVisible"
      title="批量配置隐私规则"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="batchConfigFormRef" :model="batchConfigForm" :rules="batchConfigRules" label-width="120px">
        <el-form-item label="批量名称" prop="batchName">
          <el-input v-model="batchConfigForm.batchName" placeholder="请输入批量配置名称" />
        </el-form-item>
        <el-form-item label="配置模式" prop="configMode">
          <el-radio-group v-model="batchConfigForm.configMode">
            <el-radio :value="1">增量添加（已存在则跳过）</el-radio>
            <el-radio :value="2">全量覆盖（已存在则更新）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="快速模板">
          <div class="template-buttons">
            <el-button size="small" @click="applyTemplate('highLevel')">高端客户强保护模板</el-button>
            <el-button size="small" @click="applyTemplate('operation')">日常运维模板</el-button>
            <el-button size="small" @click="applyTemplate('risk')">风控核查模板</el-button>
            <el-button size="small" @click="applyTemplate('audit')">审计溯源模板</el-button>
          </div>
        </el-form-item>
        <el-form-item label="规则列表">
          <div class="batch-rules-wrapper">
            <el-table
              :data="batchConfigForm.items"
              border
              size="small"
              style="width: 100%"
            >
              <el-table-column type="index" label="#" width="50" />
              <el-table-column prop="ruleCode" label="规则编码" width="130">
                <template #default="{ row }">
                  <el-input v-model="row.ruleCode" size="small" placeholder="编码" />
                </template>
              </el-table-column>
              <el-table-column prop="ruleName" label="规则名称" width="140">
                <template #default="{ row }">
                  <el-input v-model="row.ruleName" size="small" placeholder="名称" />
                </template>
              </el-table-column>
              <el-table-column prop="customerLevel" label="客户等级" width="100">
                <template #default="{ row }">
                  <el-select v-model="row.customerLevel" size="small" placeholder="选择" style="width: 100%">
                    <el-option v-for="(t, k) in customerLevelOptions" :key="k" :label="t" :value="Number(k)" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="sensitivityLevel" label="敏感度" width="90">
                <template #default="{ row }">
                  <el-select v-model="row.sensitivityLevel" size="small" placeholder="选择" style="width: 100%">
                    <el-option v-for="(t, k) in sensitivityLevelOptions" :key="k" :label="t" :value="Number(k)" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="sceneType" label="场景" width="100">
                <template #default="{ row }">
                  <el-select v-model="row.sceneType" size="small" placeholder="选择" style="width: 100%">
                    <el-option v-for="(t, k) in sceneOptions" :key="k" :label="t.name" :value="Number(k)" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="timeLimit" label="时效(分)" width="90">
                <template #default="{ row }">
                  <el-input-number v-model="row.timeLimit" size="small" :min="5" :max="480" controls-position="right" />
                </template>
              </el-table-column>
              <el-table-column label="控制" width="80">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="removeBatchRule($index)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" link size="small" @click="addBatchRule" style="margin-top: 8px">
              + 添加规则
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBatchConfig" :loading="batchConfigLoading">
          提交批量配置
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchResultDialogVisible" title="批量配置结果" width="600px">
      <el-result
        :icon="batchResult?.success_count > 0 ? 'success' : 'warning'"
        :title="`批量配置完成：成功 ${batchResult?.success_count} 条，失败 ${batchResult?.fail_count} 条`"
      >
        <template #extra>
          <div class="batch-result-detail">
            <el-descriptions :column="2" border size="small" style="margin-bottom: 16px">
              <el-descriptions-item label="总条数">{{ batchResult?.total_count }}</el-descriptions-item>
              <el-descriptions-item label="成功">{{ batchResult?.success_count }}</el-descriptions-item>
              <el-descriptions-item label="失败">{{ batchResult?.fail_count }}</el-descriptions-item>
              <el-descriptions-item label="跳过">{{ batchResult?.skip_count }}</el-descriptions-item>
            </el-descriptions>
            <el-table
              v-if="batchResult?.items && batchResult.items.length > 0"
              :data="batchResult.items.filter(i => i.process_result !== 1)"
              border
              size="small"
              max-height="300"
            >
              <el-table-column prop="ruleCode" label="规则编码" width="140" />
              <el-table-column prop="processResult" label="处理结果" width="100">
                <template #default="{ row }">
                  <el-tag :type="getProcessResultTagType(row.process_result)" size="small">
                    {{ getProcessResultText(row.process_result) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="processMessage" label="处理信息" show-overflow-tooltip />
            </el-table>
          </div>
        </template>
      </el-result>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Upload, Setting } from '@element-plus/icons-vue'
import {
  getPrivacyRuleListApi,
  getPrivacyRuleDetailApi,
  createPrivacyRuleApi,
  updatePrivacyRuleApi,
  deletePrivacyRuleApi,
  batchConfigPrivacyApi,
  type CustomerPrivacyRule,
  type PrivacyRuleQueryParams,
  type PrivacyRuleForm,
  type PrivacyBatchConfigRequest,
  type PrivacyBatchConfigResponse,
  type PrivacyBatchConfigItem,
  type DesensitizationRuleConfig
} from '@api/business'

const listLoading = ref(false)
const ruleDialogVisible = ref(false)
const ruleDialogLoading = ref(false)
const batchConfigDialogVisible = ref(false)
const batchConfigLoading = ref(false)
const batchResultDialogVisible = ref(false)

const ruleFormRef = ref<FormInstance>()
const batchConfigFormRef = ref<FormInstance>()

const total = ref(0)
const tableData = ref<CustomerPrivacyRule[]>([])

const stats = reactive({
  enabled: 0,
  global: 0,
  highLevel: 0
})

const isEdit = ref(false)

const searchForm = reactive<PrivacyRuleQueryParams>({
  page: 1,
  pageSize: 10,
  keyword: '',
  ruleCode: '',
  ruleName: '',
  customerLevel: undefined,
  sensitivityLevel: undefined,
  operatorPosition: undefined,
  sceneType: undefined,
  isGlobal: undefined,
  status: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const ruleForm = reactive<any>({
  id: '',
  ruleCode: '',
  ruleName: '',
  customerLevel: 0,
  sensitivityLevel: 2,
  operatorPosition: 0,
  sceneType: 1,
  desensitizationLevel: 2,
  timeLimit: 30,
  sensitiveFieldList: [] as string[],
  desensitizationRuleList: [] as DesensitizationRuleConfig[],
  retentionDays: 90,
  needOperationLog: 1,
  needRecord: 1,
  isGlobal: 0,
  status: 1
})

const batchConfigForm = reactive<any>({
  batchName: '',
  configMode: 1,
  items: [] as PrivacyBatchConfigItem[]
})

const batchResult = ref<PrivacyBatchConfigResponse | null>(null)

const ruleFormRules: FormRules = {
  ruleCode: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  customerLevel: [{ required: true, message: '请选择客户等级', trigger: 'change' }],
  sensitivityLevel: [{ required: true, message: '请选择敏感度', trigger: 'change' }],
  sceneType: [{ required: true, message: '请选择场景类型', trigger: 'change' }],
  desensitizationLevel: [{ required: true, message: '请选择脱敏级别', trigger: 'change' }],
  timeLimit: [{ required: true, message: '请输入时效限制', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const batchConfigRules: FormRules = {
  batchName: [{ required: true, message: '请输入批量名称', trigger: 'blur' }],
  configMode: [{ required: true, message: '请选择配置模式', trigger: 'change' }]
}

const ruleDialogTitle = computed(() => isEdit.value ? '编辑规则' : '新增规则')

const customerLevelOptions: Record<number, string> = {
  0: '全部等级',
  1: '普通客户',
  2: '银卡客户',
  3: '金卡客户',
  4: '白金客户',
  5: '钻石客户'
}

const sensitivityLevelOptions: Record<number, string> = {
  1: '低敏感',
  2: '中敏感',
  3: '高敏感',
  4: '极高敏感'
}

const operatorPositionOptions: Record<number, string> = {
  0: '全部岗位',
  1: '柜员',
  2: '客户经理',
  3: '风控专员',
  4: '审计人员',
  5: '系统管理员'
}

const sceneOptions: Record<number, { name: string; desc: string }> = {
  1: { name: '日常运维查看', desc: '日常客户信息维护' },
  2: { name: '业务审核查看', desc: '业务流程审核' },
  3: { name: '风控核查查看', desc: '风险核查调查' },
  4: { name: '审计溯源查看', desc: '内部审计检查' }
}

const desensitizationLevelOptions: Record<number, string> = {
  1: '不脱敏',
  2: '部分脱敏',
  3: '完全脱敏',
  4: '加密展示'
}

const desensitizationMethodOptions: Record<number, string> = {
  1: '掩码',
  2: '替换',
  3: '隐藏',
  4: '加密'
}

const sensitiveFieldOptions = [
  { label: '身份证号', value: 'id_card_no' },
  { label: '法人身份证号', value: 'legal_id_card_no' },
  { label: '手机号', value: 'mobile' },
  { label: '法人手机号', value: 'legal_mobile' },
  { label: '联系电话', value: 'contact_phone' },
  { label: '电子邮箱', value: 'contact_email' },
  { label: '地址', value: 'address' },
  { label: '注册地址', value: 'registered_address' },
  { label: '经营地址', value: 'business_address' },
  { label: '银行账号', value: 'bank_account' },
  { label: '信用卡号', value: 'credit_card_no' }
]

const processResultOptions: Record<number, string> = {
  1: '成功',
  2: '失败',
  3: '越权拦截',
  4: '违规拦截',
  5: '跳过'
}

function getCustomerLevelTagType(level: number): string {
  const types: Record<number, string> = {
    0: 'info',
    1: 'info',
    2: '',
    3: 'warning',
    4: 'danger',
    5: 'danger'
  }
  return types[level] || 'info'
}

function getSensitivityTagType(level: number): string {
  const types: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'danger',
    4: 'danger'
  }
  return types[level] || 'info'
}

function getDesensitizationTagType(level: number): string {
  const types: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'danger',
    4: 'info'
  }
  return types[level] || 'info'
}

function getRuleDesensitizationLevel(row: any): number {
  return row.desensitization_level || row.desensitizationLevel || 2
}

function getProcessResultTagType(result: number): string {
  const types: Record<number, string> = {
    1: 'success',
    2: 'danger',
    3: 'warning',
    4: 'danger',
    5: 'info'
  }
  return types[result] || 'info'
}

function getProcessResultText(result: number): string {
  return processResultOptions[result] || '未知'
}

async function loadList() {
  listLoading.value = true
  try {
    const params: PrivacyRuleQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize
    }
    const res = await getPrivacyRuleListApi(params)
    tableData.value = res.list
    total.value = res.total
    updateStats()
  } catch (e) {
    console.error('加载规则列表失败', e)
  } finally {
    listLoading.value = false
  }
}

function updateStats() {
  stats.enabled = tableData.value.filter(r => r.status === 1).length
  stats.global = tableData.value.filter(r => r.is_global === 1).length
  stats.highLevel = tableData.value.filter(r => r.customer_level >= 4).length
}

function handleSearch() {
  pageParams.page = 1
  loadList()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.ruleCode = ''
  searchForm.ruleName = ''
  searchForm.customerLevel = undefined
  searchForm.sensitivityLevel = undefined
  searchForm.operatorPosition = undefined
  searchForm.sceneType = undefined
  searchForm.isGlobal = undefined
  searchForm.status = undefined
  pageParams.page = 1
  loadList()
}

function handlePageChange() {
  loadList()
}

function handleAddRule() {
  isEdit.value = false
  resetRuleForm()
  ruleDialogVisible.value = true
}

async function handleEditRule(row: CustomerPrivacyRule) {
  isEdit.value = true
  ruleDialogLoading.value = true
  try {
    const detail = await getPrivacyRuleDetailApi(row.id)
    Object.assign(ruleForm, detail)
    try {
      ruleForm.desensitizationRuleList = detail.desensitization_rule_list || JSON.parse(detail.desensitization_rules || '[]')
    } catch {
      ruleForm.desensitizationRuleList = []
    }
    try {
      ruleForm.sensitiveFieldList = detail.sensitive_field_list || JSON.parse(detail.sensitive_fields || '[]')
    } catch {
      ruleForm.sensitiveFieldList = []
    }
    try {
      const retention = detail.retention_rule_config || JSON.parse(detail.retention_rules || '{}')
      ruleForm.retentionDays = retention.retention_days || 90
    } catch {
      ruleForm.retentionDays = 90
    }
    ruleDialogVisible.value = true
  } catch (e) {
    console.error('获取规则详情失败', e)
    ElMessage.error('获取规则详情失败')
  } finally {
    ruleDialogLoading.value = false
  }
}

function resetRuleForm() {
  ruleForm.id = ''
  ruleForm.ruleCode = ''
  ruleForm.ruleName = ''
  ruleForm.customerLevel = 0
  ruleForm.sensitivityLevel = 2
  ruleForm.operatorPosition = 0
  ruleForm.sceneType = 1
  ruleForm.desensitizationLevel = 2
  ruleForm.timeLimit = 30
  ruleForm.sensitiveFieldList = []
  ruleForm.desensitizationRuleList = []
  ruleForm.retentionDays = 90
  ruleForm.needOperationLog = 1
  ruleForm.needRecord = 1
  ruleForm.isGlobal = 0
  ruleForm.status = 1
}

function addDesensitizationRule() {
  ruleForm.desensitizationRuleList.push({
    field: '',
    fieldName: '',
    method: 1,
    method_text: '掩码',
    keepStart: 3,
    keepEnd: 4,
    maskChar: '*'
  })
}

function removeDesensitizationRule(index: number) {
  ruleForm.desensitizationRuleList.splice(index, 1)
}

async function handleSaveRule() {
  if (!ruleFormRef.value) return
  const valid = await ruleFormRef.value.validate().catch(() => false)
  if (!valid) return

  ruleDialogLoading.value = true
  try {
    const formData: PrivacyRuleForm = {
      ...ruleForm,
      sensitive_fields: JSON.stringify(ruleForm.sensitiveFieldList || []),
      desensitization_rules: JSON.stringify(ruleForm.desensitizationRuleList || []),
      retention_rules: JSON.stringify({
        retention_days: ruleForm.retentionDays || 90,
        need_operation_log: ruleForm.needOperationLog === 1,
        need_regular_cleanup: true
      })
    }

    if (isEdit.value) {
      await updatePrivacyRuleApi(ruleForm.id, formData)
      ElMessage.success('规则更新成功')
    } else {
      await createPrivacyRuleApi(formData)
      ElMessage.success('规则创建成功')
    }
    ruleDialogVisible.value = false
    loadList()
  } catch (e) {
    console.error('保存规则失败', e)
  } finally {
    ruleDialogLoading.value = false
  }
}

async function handleToggleStatus(row: CustomerPrivacyRule) {
  const newStatus = row.status === 1 ? 0 : 1
  const actionText = newStatus === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定要${actionText}该规则吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updatePrivacyRuleApi(row.id, { ...row, status: newStatus } as any)
    ElMessage.success(`${actionText}成功`)
    loadList()
  } catch (e) {
    console.error(`${actionText}失败`, e)
  }
}

async function handleDeleteRule(row: CustomerPrivacyRule) {
  try {
    await ElMessageBox.confirm('确定要删除该规则吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    await deletePrivacyRuleApi(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    console.error('删除失败', e)
  }
}

function handleBatchConfig() {
  batchConfigForm.batchName = `批量配置_${new Date().toISOString().slice(0, 10)}`
  batchConfigForm.items = []
  batchConfigDialogVisible.value = true
}

function addBatchRule() {
  batchConfigForm.items.push({
    ruleCode: '',
    ruleName: '',
    customerLevel: 0,
    sensitivityLevel: 2,
    sceneType: 1,
    timeLimit: 30,
    needRecord: 1,
    needOperationLog: 1,
    isGlobal: 0
  })
}

function removeBatchRule(index: number) {
  batchConfigForm.items.splice(index, 1)
}

function applyTemplate(type: string) {
  batchConfigForm.items = []
  const templates: Record<string, PrivacyBatchConfigItem[]> = {
    highLevel: [
      { ruleCode: 'PRIV-HIGH-001', ruleName: '钻石客户隐私保护', customerLevel: 5, sensitivityLevel: 4, sceneType: 1, timeLimit: 15, needRecord: 1, needOperationLog: 1, isGlobal: 1 },
      { ruleCode: 'PRIV-HIGH-002', ruleName: '白金客户隐私保护', customerLevel: 4, sensitivityLevel: 3, sceneType: 1, timeLimit: 20, needRecord: 1, needOperationLog: 1, isGlobal: 1 },
      { ruleCode: 'PRIV-HIGH-003', ruleName: '金卡客户隐私保护', customerLevel: 3, sensitivityLevel: 2, sceneType: 1, timeLimit: 30, needRecord: 1, needOperationLog: 1, isGlobal: 1 }
    ],
    operation: [
      { ruleCode: 'PRIV-OP-001', ruleName: '日常运维查看', customerLevel: 0, sensitivityLevel: 2, sceneType: 1, timeLimit: 30, needRecord: 0, needOperationLog: 1, isGlobal: 1 },
      { ruleCode: 'PRIV-OP-002', ruleName: '业务审核查看', customerLevel: 0, sensitivityLevel: 2, sceneType: 2, timeLimit: 60, needRecord: 1, needOperationLog: 1, isGlobal: 1 }
    ],
    risk: [
      { ruleCode: 'PRIV-RISK-001', ruleName: '风控核查查看', customerLevel: 0, sensitivityLevel: 3, sceneType: 3, timeLimit: 120, needRecord: 1, needOperationLog: 1, isGlobal: 1 }
    ],
    audit: [
      { ruleCode: 'PRIV-AUDIT-001', ruleName: '审计溯源查看', customerLevel: 0, sensitivityLevel: 4, sceneType: 4, timeLimit: 240, needRecord: 1, needOperationLog: 1, isGlobal: 1 }
    ]
  }
  batchConfigForm.items = templates[type] || []
}

async function handleSubmitBatchConfig() {
  if (!batchConfigFormRef.value) return
  const valid = await batchConfigFormRef.value.validate().catch(() => false)
  if (!valid) return

  const items = batchConfigForm.items.filter((item: any) => item.ruleCode && item.ruleName)
  if (items.length === 0) {
    ElMessage.warning('请至少填写一条有效的规则')
    return
  }

  batchConfigLoading.value = true
  try {
    const res = await batchConfigPrivacyApi({
      batch_name: batchConfigForm.batchName,
      config_mode: batchConfigForm.configMode,
      items: items,
      overwrite_existing: batchConfigForm.configMode === 2
    })
    batchResult.value = res
    batchConfigDialogVisible.value = false
    batchResultDialogVisible.value = true
    loadList()
  } catch (e) {
    console.error('批量配置失败', e)
  } finally {
    batchConfigLoading.value = false
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="scss">
.ccb-customer-privacy-rule {
  padding: 0;
}

.control-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.desensitization-config,
.batch-rules-wrapper {
  width: 100%;
}

.template-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.skeleton-wrapper,
.form-skeleton {
  padding: 20px 0;
}

.batch-result-detail {
  width: 100%;
}
</style>
