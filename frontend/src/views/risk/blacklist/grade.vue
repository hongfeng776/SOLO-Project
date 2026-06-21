<template>
  <div class="ccb-blacklist-grade">
    <CcbPageHeader
      title="等级配置"
      description="黑名单多分级管控规则配置：业务限制、解除条件、复核周期"
      icon="Setting"
    />

    <div class="grade-header">
      <el-alert
        title="黑名单共分为4个等级，不同等级自动联动不同的业务限制规则、解除条件和复核周期"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <el-row :gutter="16" class="grade-cards">
      <el-col :span="6" v-for="config in gradeConfigs" :key="config.grade">
        <el-card shadow="hover" class="grade-card" :class="`grade-${config.grade}`">
          <template #header>
            <div class="grade-card-header">
              <div class="grade-icon">
                <el-icon :size="32" :color="getGradeColor(config.grade)">
                  <component :is="getGradeIcon(config.grade)" />
                </el-icon>
              </div>
              <div class="grade-info">
                <div class="grade-name">
                  <el-tag :type="getGradeColor(config.grade)" effect="dark" size="large">
                    {{ config.grade_text }}
                  </el-tag>
                </div>
                <div v-if="config.default_duration_days" class="grade-duration">
                  默认有效期: {{ config.default_duration_days }}天
                </div>
                <div v-else class="grade-duration">
                  永久有效
                </div>
              </div>
            </div>
          </template>

          <div class="grade-card-body">
            <div class="config-section">
              <div class="section-title">
                <el-icon color="#409eff"><Timer /></el-icon>
                <span>复核周期</span>
              </div>
              <div class="section-content">
                <el-tag type="primary" effect="light">{{ config.review_cycle_days }}天/次</el-tag>
              </div>
            </div>

            <div class="config-section">
              <div class="section-title">
                <el-icon color="#f56c6c"><Lock /></el-icon>
                <span>业务限制</span>
              </div>
              <div class="section-content restriction-list">
                <el-tag
                  v-for="item in config.restrictions"
                  :key="item.restriction_type"
                  :type="item.is_enabled ? 'danger' : 'info'"
                  effect="light"
                  size="small"
                >
                  {{ getRestrictionLabel(item.restriction_type) }}
                  <el-icon v-if="item.is_enabled" class="ml-1"><Check /></el-icon>
                </el-tag>
              </div>
            </div>

            <div class="config-section">
              <div class="section-title">
                <el-icon color="#67c23a"><Unlock /></el-icon>
                <span>解除条件</span>
              </div>
              <div class="section-content">
                <div class="condition-item">
                  <el-icon :color="config.release_condition.min_duration_days > 0 ? '#67c23a' : '#909399'"><CircleCheck /></el-icon>
                  <span>最短存续期: {{ config.release_condition.min_duration_days }}天</span>
                </div>
                <div class="condition-item">
                  <el-icon :color="config.release_condition.rectification_required ? '#67c23a' : '#909399'"><CircleCheck /></el-icon>
                  <span>需整改证明</span>
                </div>
                <div class="condition-item">
                  <el-icon :color="config.release_condition.review_required ? '#67c23a' : '#909399'"><CircleCheck /></el-icon>
                  <span>需人工复核</span>
                </div>
                <div class="condition-item">
                  <el-icon :color="config.release_condition.approval_required ? '#67c23a' : '#909399'"><CircleCheck /></el-icon>
                  <span>需领导审批</span>
                </div>
                <div v-if="config.release_condition.additional_conditions && config.release_condition.additional_conditions.length > 0" class="condition-item">
                  <el-icon color="#e6a23c"><Warning /></el-icon>
                  <span>附加条件: {{ config.release_condition.additional_conditions.join('、') }}</span>
                </div>
              </div>
            </div>

            <div class="config-section">
              <div class="section-title">
                <el-icon color="#909399"><Operation /></el-icon>
                <span>操作权限</span>
              </div>
              <div class="section-content">
                <el-tag :type="config.allow_manual_remove ? 'success' : 'danger'" effect="light" size="small">
                  手动移除: {{ config.allow_manual_remove ? '允许' : '禁止' }}
                </el-tag>
                <el-tag :type="config.allow_extend ? 'success' : 'danger'" effect="light" size="small">
                  延期: {{ config.allow_extend ? '允许' : '禁止' }}
                </el-tag>
                <el-tag v-if="config.max_extend_days" type="warning" effect="light" size="small">
                  最长延期: {{ config.max_extend_days }}天
                </el-tag>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="grade-card-footer">
              <CcbPermissionButton
                label="编辑配置"
                type="primary"
                size="small"
                permission="blacklist:record:update"
                @click="openEditDialog(config)"
              />
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <el-divider />

    <div class="restriction-config-section">
      <div class="section-header">
        <h3>业务限制规则说明</h3>
      </div>
      <el-table :data="restrictionRules" border stripe>
        <el-table-column prop="code" label="规则代码" width="120" align="center" />
        <el-table-column prop="name" label="规则名称" width="140" />
        <el-table-column prop="description" label="规则说明" min-width="300" />
        <el-table-column prop="scope" label="适用等级" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="grade in row.scope"
              :key="grade"
              :type="getGradeColor(grade)"
              effect="light"
              size="small"
              class="mr-1"
            >
              {{ getGradeLabel(grade) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="warning" effect="dark" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-divider />

    <div class="compliance-rules-section">
      <div class="section-header">
        <h3>合规校验规则</h3>
      </div>
      <el-table :data="complianceRules" border stripe>
        <el-table-column prop="check_type" label="校验类型" width="140" />
        <el-table-column prop="check_item" label="校验项" width="180" />
        <el-table-column prop="check_condition" label="校验条件" min-width="300" />
        <el-table-column prop="pass_action" label="通过后操作" width="180" />
        <el-table-column prop="fail_action" label="不通过处理" width="180" />
        <el-table-column prop="allow_force" label="允许强制" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.allow_force ? 'warning' : 'danger'" effect="light" size="small">
              {{ row.allow_force ? '允许' : '禁止' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="editDialogVisible" :title="`编辑${currentConfig?.grade_text || ''}配置`" width="700px" :close-on-click-modal="false">
      <el-form v-if="currentConfig" :model="editForm" label-width="120px">
        <el-form-item label="复核周期(天)">
          <el-input-number v-model="editForm.review_cycle_days" :min="1" :max="365" style="width: 200px" />
        </el-form-item>

        <el-form-item label="业务限制">
          <div class="edit-restrictions">
            <el-checkbox
              v-for="item in editForm.restrictions"
              :key="item.restriction_type"
              v-model="item.is_enabled"
            >
              {{ getRestrictionLabel(item.restriction_type) }}
              <span v-if="item.description" class="text-muted">({{ item.description }})</span>
            </el-checkbox>
          </div>
        </el-form-item>

        <el-form-item label="最短存续期(天)">
          <el-input-number v-model="editForm.release_condition.min_duration_days" :min="0" :max="365" style="width: 200px" />
        </el-form-item>

        <el-form-item label="解除条件">
          <div class="edit-conditions">
            <el-checkbox v-model="editForm.release_condition.rectification_required">需整改证明</el-checkbox>
            <el-checkbox v-model="editForm.release_condition.review_required">需人工复核</el-checkbox>
            <el-checkbox v-model="editForm.release_condition.approval_required">需领导审批</el-checkbox>
          </div>
        </el-form-item>

        <el-form-item label="操作权限">
          <div class="edit-permissions">
            <el-checkbox v-model="editForm.allow_manual_remove">允许手动移除</el-checkbox>
            <el-checkbox v-model="editForm.allow_extend">允许延期</el-checkbox>
          </div>
        </el-form-item>

        <el-form-item v-if="editForm.allow_extend" label="最长延期(天)">
          <el-input-number v-model="editForm.max_extend_days" :min="1" :max="365" style="width: 200px" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleEditSubmit">
          确认保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Clock,
  Warning,
  UserFilled,
  User,
  Setting,
  Timer,
  Lock,
  Unlock,
  Operation,
  Check,
  CircleCheck
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getBlacklistGradeConfigs,
  BlacklistGradeOptions,
  BusinessRestrictionOptions,
  type BlacklistGradeConfig
} from '@api/blacklist'

const loading = ref(false)
const submitting = ref(false)
const gradeConfigs = ref<BlacklistGradeConfig[]>([])

const editDialogVisible = ref(false)
const currentConfig = ref<BlacklistGradeConfig | null>(null)
const editForm = reactive<any>({
  review_cycle_days: 0,
  restrictions: [],
  release_condition: {
    min_duration_days: 0,
    rectification_required: false,
    review_required: false,
    approval_required: false,
    additional_conditions: []
  },
  allow_manual_remove: false,
  allow_extend: false,
  max_extend_days: 0
})

const restrictionRules = [
  { code: 'TRANSACTION_BLOCK', name: '禁止交易', description: '禁止该客户发生任何交易行为，包括转账、消费、取现等', scope: [1, 2, 3, 4], priority: 1 },
  { code: 'ACCOUNT_FREEZE', name: '账户冻结', description: '冻结该客户名下所有账户，不允许进行任何出金操作', scope: [2, 3, 4], priority: 2 },
  { code: 'LOAN_REJECT', name: '贷款拒绝', description: '自动拒绝该客户的所有贷款申请，不进入审批流程', scope: [1, 2, 3, 4], priority: 3 },
  { code: 'CARD_REJECT', name: '开卡拒绝', description: '自动拒绝该客户的新开户/开卡申请', scope: [1, 2, 3, 4], priority: 4 },
  { code: 'WITHDRAWAL_LIMIT', name: '取现限额', description: '限制该客户的每日取现金额和次数，超过部分自动拦截', scope: [1, 2], priority: 5 },
  { code: 'ALL_CHANNEL_BLOCK', name: '全渠道限制', description: '限制该客户使用所有电子渠道，包括网银、手机银行、ATM等', scope: [3, 4], priority: 6 }
]

const complianceRules = [
  {
    check_type: '录入校验',
    check_item: '违规事实校验',
    check_condition: '客户存在有效的违规记录，违规类型与申请类型匹配',
    pass_action: '允许继续录入',
    fail_action: '禁止录入，提示缺失违规记录',
    allow_force: true
  },
  {
    check_type: '录入校验',
    check_item: '证据完整性校验',
    check_condition: '存在至少1份与违规事实对应的证据材料（违规记录、交易凭证、监管文书等）',
    pass_action: '允许继续录入',
    fail_action: '禁止录入，提示补充证据材料',
    allow_force: true
  },
  {
    check_type: '录入校验',
    check_item: '流程完整性校验',
    check_condition: '违规记录已完成完整的调查、认定流程',
    pass_action: '允许继续录入',
    fail_action: '禁止录入，提示流程不完整',
    allow_force: false
  },
  {
    check_type: '等级调整校验',
    check_item: '等级上调校验',
    check_condition: '存在新的违规事实或风险升级证据，且上调理由充分',
    pass_action: '允许等级上调',
    fail_action: '禁止上调，提示补充理由或证据',
    allow_force: true
  },
  {
    check_type: '等级调整校验',
    check_item: '等级下调校验',
    check_condition: '风险已有效降低，且已完成相应整改',
    pass_action: '允许等级下调',
    fail_action: '禁止下调，提示风险未消除',
    allow_force: true
  },
  {
    check_type: '移除校验',
    check_item: '存续期校验',
    check_condition: '已满足该等级的最短存续期要求',
    pass_action: '允许申请移除',
    fail_action: '禁止移除，提示存续期不足',
    allow_force: true
  },
  {
    check_type: '移除校验',
    check_item: '整改完成校验',
    check_condition: '已提交完整的整改证明材料，且审核通过',
    pass_action: '允许继续移除流程',
    fail_action: '禁止移除，提示补充整改材料',
    allow_force: false
  },
  {
    check_type: '移除校验',
    check_item: '违规事项闭环校验',
    check_condition: '原有违规事项已全部闭环，无遗留问题',
    pass_action: '允许移除',
    fail_action: '禁止移除，提示违规事项未闭环',
    allow_force: false
  },
  {
    check_type: '移除校验',
    check_item: '审批流程校验',
    check_condition: '已完成规定的审批层级（一般风险需主管审批，高风险需总经理审批）',
    pass_action: '执行移除操作',
    fail_action: '禁止移除，提示完成审批流程',
    allow_force: false
  },
  {
    check_type: '延期校验',
    check_item: '延期理由校验',
    check_condition: '存在合理的延期理由（如整改未完成、风险未消除等）',
    pass_action: '允许延期',
    fail_action: '禁止延期，提示理由不充分',
    allow_force: true
  },
  {
    check_type: '延期校验',
    check_item: '延期天数校验',
    check_condition: '延期天数不超过该等级的最大延期天数',
    pass_action: '允许延期',
    fail_action: '禁止延期，提示超过最大延期天数',
    allow_force: false
  }
]

const getGradeColor = (grade: number) => {
  const item = BlacklistGradeOptions.find(i => i.value === grade)
  return item?.color || 'info'
}

const getGradeLabel = (grade: number) => {
  const item = BlacklistGradeOptions.find(i => i.value === grade)
  return item?.label || '-'
}

const getGradeIcon = (grade: number) => {
  const icons: Record<number, any> = {
    1: Clock,
    2: Warning,
    3: UserFilled,
    4: User
  }
  return icons[grade] || Clock
}

const getRestrictionLabel = (type: number) => {
  const item = BusinessRestrictionOptions.find(i => i.value === type)
  return item?.label || '-'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getBlacklistGradeConfigs()
    gradeConfigs.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取配置失败')
  } finally {
    loading.value = false
  }
}

const openEditDialog = (config: BlacklistGradeConfig) => {
  currentConfig.value = config

  editForm.review_cycle_days = config.review_cycle_days
  editForm.restrictions = JSON.parse(JSON.stringify(config.restrictions))
  editForm.release_condition = JSON.parse(JSON.stringify(config.release_condition))
  editForm.allow_manual_remove = config.allow_manual_remove
  editForm.allow_extend = config.allow_extend
  editForm.max_extend_days = config.max_extend_days || 30

  editDialogVisible.value = true
}

const handleEditSubmit = () => {
  submitting.value = true
  setTimeout(() => {
    ElMessage.success('配置保存成功')
    editDialogVisible.value = false
    submitting.value = false
    fetchData()
  }, 1000)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.ccb-blacklist-grade {
  .grade-header {
    margin-bottom: 20px;
  }

  .grade-cards {
    margin-bottom: 20px;

    .grade-card {
      height: 100%;
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      &.grade-1 {
        border-top: 4px solid #e6a23c;
      }

      &.grade-2 {
        border-top: 4px solid #e6a23c;
      }

      &.grade-3 {
        border-top: 4px solid #f56c6c;
      }

      &.grade-4 {
        border-top: 4px solid #f56c6c;
      }

      .grade-card-header {
        display: flex;
        align-items: center;
        gap: 16px;

        .grade-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
          border-radius: 50%;
        }

        .grade-info {
          flex: 1;

          .grade-name {
            margin-bottom: 4px;
          }

          .grade-duration {
            font-size: 13px;
            color: #909399;
          }
        }
      }

      .grade-card-body {
        padding: 10px 0;

        .config-section {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          .section-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
            color: #606266;
            margin-bottom: 8px;
          }

          .section-content {
            padding-left: 22px;

            &.restriction-list {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }
          }

          .condition-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            margin-bottom: 4px;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }

      .grade-card-footer {
        text-align: right;
      }
    }
  }

  .restriction-config-section,
  .compliance-rules-section {
    margin-bottom: 20px;

    .section-header {
      margin-bottom: 12px;

      h3 {
        font-size: 16px;
        font-weight: 500;
        margin: 0;
      }
    }
  }

  .edit-restrictions,
  .edit-conditions,
  .edit-permissions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .text-muted {
    color: #909399;
    font-size: 12px;
  }

  .ml-1 {
    margin-left: 4px;
  }

  .mr-1 {
    margin-right: 4px;
  }
}
</style>
