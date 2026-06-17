<template>
  <div class="recruitment-config-page">
    <PageContainer title="招聘配置管理">
      <template #toolbar>
        <el-button type="primary" @click="handleAdd" v-if="isAdmin">
          <el-icon><Plus /></el-icon>
          <span>新建配置</span>
        </el-button>
        <el-button type="success" @click="handleBatchEnable" :disabled="selectedIds.length === 0" v-if="isAdmin">
          <el-icon><VideoPlay /></el-icon>
          <span>批量启用</span>
        </el-button>
        <el-button type="warning" @click="handleBatchDisable" :disabled="selectedIds.length === 0" v-if="isAdmin">
          <el-icon><VideoPause /></el-icon>
          <span>批量停用</span>
        </el-button>
        <el-button @click="handleBatchReplace" :disabled="selectedIds.length === 0" v-if="isAdmin">
          <el-icon><Refresh /></el-icon>
          <span>批量替换福利</span>
        </el-button>
        <el-button @click="handleViewLogs">
          <el-icon><Document /></el-icon>
          <span>变更记录</span>
        </el-button>
      </template>

      <SearchForm :fields="searchFields" v-model="searchParams" @search="handleSearch" @reset="handleReset" />

      <div class="sticky-category-bar" v-if="configList.length > 0">
        <div class="category-item active" @click="scrollToCategory('basic')">配置列表</div>
        <div class="category-item" @click="scrollToCategory('logs')">变更记录</div>
        <div class="category-item" @click="scrollToCategory('stats')">配置统计</div>
      </div>

      <ProTable
        :data="configList"
        :loading="loading"
        :pagination="pagination"
        :columns="tableColumns"
        :selectable="true"
        :highlight-current-row="true"
        @selection-change="handleSelectionChange"
        @current-change="handleCurrentChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #status="{ row }">
          <el-tag :type="configStatusType[row.configStatus]" effect="light">
            {{ configStatusLabel[row.configStatus] }}
          </el-tag>
        </template>
        <template #tags="{ row }">
          <div class="tag-list">
            <el-tag
              v-for="tag in row.displayTags ? row.displayTags.split(',').slice(0, 3) : []"
              :key="tag"
              size="small"
              type="primary"
              effect="plain"
              class="mini-tag"
            >
              {{ tag }}
            </el-tag>
            <span v-if="row.displayTags && row.displayTags.split(',').length > 3" class="more-tags">
              +{{ row.displayTags.split(',').length - 3 }}
            </span>
          </div>
        </template>
        <template #welfare="{ row }">
          <div class="tag-list">
            <el-tag
              v-for="tag in row.welfareTags ? row.welfareTags.split(',').slice(0, 4) : []"
              :key="tag"
              size="small"
              type="success"
              effect="plain"
              class="mini-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </template>
        <template #activity="{ row }">
          <el-progress
            :percentage="row.activityLevel || 0"
            :stroke-width="8"
            :color="getActivityColor(row.activityLevel)"
            :show-text="false"
            style="width: 80px"
          />
          <span class="activity-text">{{ row.activityLevel || 0 }}分</span>
        </template>
        <template #action="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.configStatus === 'disabled'"
            type="success"
            link
            size="small"
            @click="handleToggleStatus(row, 'enabled')"
          >
            启用
          </el-button>
          <el-button
            v-else
            type="warning"
            link
            size="small"
            @click="handleToggleStatus(row, 'disabled')"
          >
            停用
          </el-button>
          <el-button type="info" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button type="info" link size="small" @click="handleViewConfigLogs(row)">日志</el-button>
        </template>
      </ProTable>
    </PageContainer>

    <el-dialog
      v-model="editDialogVisible"
      :title="isEdit ? '编辑招聘配置' : '新建招聘配置'"
      width="900px"
      class="zoom-dialog"
      :close-on-click-modal="false"
      @open="handleDialogOpen"
    >
      <el-alert
        v-if="completenessResult && !completenessResult.isReached"
        :title="`企业基础信息完整度为 ${completenessResult.score}%，未达到 ${completenessResult.threshold}% 的要求，无法配置招聘信息`"
        type="error"
        :closable="false"
        show-icon
        class="completeness-alert"
      />

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="config-form"
        :disabled="completenessResult && !completenessResult.isReached"
      >
        <el-form-item label="企业名称">
          <el-select
            v-model="formData.companyId"
            placeholder="请选择企业"
            filterable
            style="width: 100%"
            :disabled="isEdit"
            @change="handleCompanyChange"
          >
            <el-option
              v-for="company in companyList"
              :key="company.id"
              :label="company.name"
              :value="company.id"
            />
          </el-select>
        </el-form-item>

        <div class="form-section-title" data-category="basic">
          <el-icon><InfoFilled /></el-icon>
          <span>基础配置</span>
        </div>

        <el-form-item label="岗位分类">
          <el-select
            v-model="selectedJobCategories"
            multiple
            placeholder="请选择岗位分类"
            style="width: 100%"
            @change="handleJobCategoryChange"
          >
            <el-option
              v-for="cat in availableJobCategories"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            />
          </el-select>
          <div class="form-tip">选择岗位分类后将自动筛选对应类别的福利标签</div>
        </el-form-item>

        <div class="form-section-title" data-category="display">
          <el-icon><Star /></el-icon>
          <span>展示配置</span>
        </div>

        <el-form-item label="招聘展示标签">
          <el-checkbox-group v-model="selectedDisplayTags" @change="handleDisplayTagsChange">
            <el-checkbox
              v-for="tag in displayTags"
              :key="tag"
              :label="tag"
              :class="{ 'tag-error': isTagViolation(tag) }"
            >
              {{ tag }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <div class="form-section-title" data-category="welfare">
          <el-icon><Present /></el-icon>
          <span>福利配置</span>
        </div>

        <el-form-item label="招聘福利标签">
          <div class="welfare-category">
            <div class="welfare-category-title">通用福利</div>
            <div class="welfare-tags">
              <el-tag
                v-for="tag in generalWelfareTags"
                :key="tag"
                :type="isWelfareSelected(tag) ? 'success' : 'info'"
                :effect="isWelfareSelected(tag) ? 'dark' : 'plain'"
                class="welfare-tag-item"
                :class="{ 'tag-mismatch': !isWelfareAllowed(tag) }"
                @click="toggleWelfareTag(tag)"
                @mouseenter="handleTagHover(tag, true)"
                @mouseleave="handleTagHover(tag, false)"
              >
                {{ tag }}
                <el-icon v-if="!isWelfareAllowed(tag)" class="mismatch-icon"><WarningFilled /></el-icon>
              </el-tag>
            </div>
          </div>
          <div class="welfare-category" v-for="(tags, cat) in categoryWelfareTags" :key="cat">
            <div class="welfare-category-title">{{ jobCategoryLabel[cat as keyof typeof jobCategoryLabel] || cat }}类福利</div>
            <div class="welfare-tags">
              <el-tag
                v-for="tag in tags"
                :key="tag"
                :type="isWelfareSelected(tag) ? 'success' : 'info'"
                :effect="isWelfareSelected(tag) ? 'dark' : 'plain'"
                class="welfare-tag-item"
                :class="{ 'tag-mismatch': !isCategorySelected(cat) }"
                @click="toggleWelfareTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <div v-if="mismatchWelfareTags.length > 0" class="mismatch-warning">
            <el-icon><WarningFilled /></el-icon>
            <span>以下福利标签与所选岗位分类不匹配：{{ mismatchWelfareTags.join('、') }}</span>
          </div>
        </el-form-item>

        <div class="form-section-title" data-category="requirement">
          <el-icon><DocumentCopy /></el-icon>
          <span>要求配置</span>
        </div>

        <el-form-item label="应聘要求">
          <el-input
            v-model="formData.requirements"
            type="textarea"
            :rows="4"
            placeholder="请输入应聘要求..."
            @focus="handleInputFocus"
            @blur="handleInputBlur"
          />
        </el-form-item>

        <el-form-item label="工作类型">
          <el-checkbox-group v-model="selectedWorkTypes">
            <el-checkbox v-for="type in workTypeOptions" :key="type.value" :label="type.value">
              {{ type.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <div v-if="complianceIssues.length > 0" class="compliance-warning">
        <el-alert
          :title="`检测到 ${complianceIssues.length} 项合规问题`"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <div>{{ complianceIssues.join('；') }}</div>
          </template>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ isEdit ? '保存修改' : '创建配置' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="statusConfirmVisible"
      title="状态确认"
      width="420px"
      class="zoom-dialog"
    >
      <div class="confirm-content">
        <el-icon :size="32" :color="targetStatus === 'enabled' ? '#67c23a' : '#e6a23c'">
          <component :is="targetStatus === 'enabled' ? 'VideoPlay' : 'VideoPause'" />
        </el-icon>
        <div class="confirm-text">
          <p>确定要将该企业招聘配置 <strong>{{ targetStatus === 'enabled' ? '启用' : '停用' }}</strong> 吗？</p>
          <p class="tip" v-if="targetStatus === 'disabled'">停用后，前台将不再展示该企业招聘信息，且自动暂停所有岗位曝光推送</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="statusConfirmVisible = false">取消</el-button>
        <el-button
          :type="targetStatus === 'enabled' ? 'success' : 'warning'"
          :loading="statusLoading"
          @click="confirmToggleStatus"
        >
          确认{{ targetStatus === 'enabled' ? '启用' : '停用' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="配置详情"
      width="700px"
      class="zoom-dialog"
    >
      <el-descriptions v-if="currentConfig" :column="2" border>
        <el-descriptions-item label="企业名称" :span="2">{{ currentConfig.companyName }}</el-descriptions-item>
        <el-descriptions-item label="配置状态">
          <el-tag :type="configStatusType[currentConfig.configStatus]">
            {{ configStatusLabel[currentConfig.configStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版本号">v{{ currentConfig.version }}</el-descriptions-item>
        <el-descriptions-item label="招聘展示标签" :span="2">
          <el-tag v-for="tag in displayTagsList" :key="tag" type="primary" effect="plain" class="detail-tag">
            {{ tag }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="招聘福利标签" :span="2">
          <el-tag v-for="tag in welfareTagsList" :key="tag" type="success" effect="plain" class="detail-tag">
            {{ tag }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="工作类型" :span="2">
          <el-tag v-for="type in workTypesList" :key="type" type="info" effect="plain" class="detail-tag">
            {{ workTypeLabel[type as keyof typeof workTypeLabel] || type }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="应聘要求" :span="2">
          <div class="requirements-content">{{ currentConfig.requirements || '暂无' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="最近启用时间">{{ currentConfig.activatedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最近停用时间">{{ currentConfig.deactivatedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentConfig.createdByName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新人">{{ currentConfig.updatedByName || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="logsDialogVisible"
      title="配置变更记录"
      width="900px"
      class="zoom-dialog"
    >
      <div class="log-search-bar">
        <el-date-picker
          v-model="logSearchParams.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 280px"
          @change="handleLogSearch"
        />
        <el-select
          v-model="logSearchParams.action"
          placeholder="操作类型"
          clearable
          style="width: 160px"
          @change="handleLogSearch"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="(label, key) in configLogActionLabel"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-input
          v-model="logSearchParams.operator"
          placeholder="操作人"
          clearable
          style="width: 160px"
          @keyup.enter="handleLogSearch"
        />
      </div>
      <div class="log-list-container">
        <el-table :data="configLogList" height="400" style="width: 100%" v-loading="logsLoading">
          <el-table-column prop="created_at" label="操作时间" width="180" />
          <el-table-column prop="companyName" label="企业名称" width="160" />
          <el-table-column label="操作类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ configLogActionLabel[row.action as keyof typeof configLogActionLabel] || row.action }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="100" />
          <el-table-column prop="changedFields" label="变更字段">
            <template #default="{ row }">
              <span class="changed-fields">{{ row.changedFields || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="合规" width="80" align="center">
            <template #default="{ row }">
              <el-icon :color="row.isComplianceChecked ? '#67c23a' : '#e6a23c'">
                <component :is="row.isComplianceChecked ? 'CircleCheckFilled' : 'WarningFilled'" />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="showLogDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog
        v-model="logDetailVisible"
        title="变更详情"
        width="600px"
        append-to-body
        class="zoom-dialog"
      >
        <div v-if="currentLog" class="log-detail">
          <div class="log-detail-item">
            <label>操作类型：</label>
            <span>{{ configLogActionLabel[currentLog.action as keyof typeof configLogActionLabel] || currentLog.action }}</span>
          </div>
          <div class="log-detail-item">
            <label>操作人：</label>
            <span>{{ currentLog.operatorName || '-' }}</span>
          </div>
          <div class="log-detail-item">
            <label>变更字段：</label>
            <span>{{ currentLog.changedFields || '-' }}</span>
          </div>
          <div class="log-compare">
            <div class="log-compare-item log-old">
              <div class="log-compare-title">变更前 (v{{ currentLog.versionBefore || 0 }})</div>
              <pre v-if="currentLog.oldValues">{{ formatJson(currentLog.oldValues) }}</pre>
              <span v-else class="empty-text">无</span>
            </div>
            <div class="log-compare-item log-new">
              <div class="log-compare-title">变更后 (v{{ currentLog.versionAfter || 0 }})</div>
              <pre v-if="currentLog.newValues">{{ formatJson(currentLog.newValues) }}</pre>
              <span v-else class="empty-text">无</span>
            </div>
          </div>
          <div v-if="currentLog.operationRemark" class="log-detail-item">
            <label>操作备注：</label>
            <span>{{ currentLog.operationRemark }}</span>
          </div>
        </div>
      </el-dialog>
    </el-dialog>

    <el-dialog
      v-model="batchReplaceVisible"
      title="批量替换福利标签"
      width="600px"
      class="zoom-dialog"
    >
      <el-form label-width="120px">
        <el-form-item label="选中数量">
          <el-tag type="info">已选择 {{ selectedIds.length }} 个配置</el-tag>
        </el-form-item>
        <el-form-item label="移除标签">
          <el-select v-model="batchReplace.oldTags" multiple placeholder="选择要移除的福利标签" style="width: 100%">
            <el-option
              v-for="tag in generalWelfareTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="新增标签">
          <el-select v-model="batchReplace.newTags" multiple placeholder="选择要新增的福利标签" style="width: 100%">
            <el-option
              v-for="tag in generalWelfareTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div v-if="batchResult" class="batch-result">
        <el-alert
          :title="`批量操作完成：成功 ${batchResult.success} 个，失败 ${batchResult.failed} 个`"
          :type="batchResult.failed > 0 ? 'warning' : 'success'"
          :closable="false"
          show-icon
        >
          <template #default>
            <div v-if="batchResult.errors.length > 0" class="batch-errors">
              <div v-for="(err, idx) in batchResult.errors" :key="idx" class="batch-error-item">
                {{ err.companyName }}：{{ err.message }}
              </div>
            </div>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="batchReplaceVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="confirmBatchReplace">确认替换</el-button>
      </template>
    </el-dialog>

    <div class="success-toast" v-if="showSuccessCheck">
      <el-icon :size="48" color="#67c23a"><CircleCheckFilled /></el-icon>
      <span>操作成功</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus, VideoPlay, VideoPause, Refresh, Document, Star, Present,
  DocumentCopy, InfoFilled, WarningFilled, CircleCheckFilled
} from '@element-plus/icons-vue';
import PageContainer from '@/components/PageContainer/index.vue';
import SearchForm from '@/components/SearchForm/index.vue';
import ProTable from '@/components/ProTable/index.vue';
import { useUserStore } from '@/store/modules/user';
import {
  getRecruitmentConfigListApi,
  getRecruitmentConfigDetailApi,
  checkInfoCompletenessApi,
  getMatchingWelfareByIndustryApi,
  validateConfigApi,
  checkDuplicateConfigApi,
  createRecruitmentConfigApi,
  updateRecruitmentConfigApi,
  enableConfigApi,
  disableConfigApi,
  batchEnableConfigApi,
  batchDisableConfigApi,
  batchReplaceWelfareApi,
  getConfigLogsApi,
  getConfigLogsByConfigIdApi,
  type RecruitmentConfigItem,
  type ConfigLogItem,
  type CompletenessResult,
  type ConfigValidateResult,
  type BatchConfigResult,
} from '@/api/recruitment-config';
import { getCompanyListApi } from '@/api/company';
import {
  ConfigStatus,
  ConfigStatusLabel,
  ConfigStatusType,
  ConfigLogAction,
  ConfigLogActionLabel,
  WorkTypeLabel,
  DISPLAY_TAGS,
  WELFARE_TAGS,
  GENERAL_WELFARE_TAGS,
  INDUSTRY_JOB_CATEGORY_MAP,
  JobCategory,
  JobCategoryLabel,
  VIOLATION_KEYWORDS,
  FALSE_RECRUITMENT_KEYWORDS,
} from '@/constants/recruitment';

const userStore = useUserStore();

const loading = ref(false);
const submitLoading = ref(false);
const statusLoading = ref(false);
const logsLoading = ref(false);
const batchLoading = ref(false);

const configList = ref<RecruitmentConfigItem[]>([]);
const companyList = ref<any[]>([]);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const searchParams = reactive({
  companyName: '',
  configStatus: '',
  activityLevelMin: undefined as number | undefined,
  positionGapMin: undefined as number | undefined,
});

const searchFields = [
  { key: 'companyName', label: '企业名称', type: 'input', placeholder: '请输入企业名称' },
  { key: 'configStatus', label: '配置状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '已启用', value: 'enabled' },
    { label: '已停用', value: 'disabled' },
  ]},
  { key: 'activityLevelMin', label: '最低活跃度', type: 'select', options: [
    { label: '不限', value: '' },
    { label: '70分以上', value: 70 },
    { label: '40分以上', value: 40 },
    { label: '20分以上', value: 20 },
  ]},
  { key: 'positionGapMin', label: '岗位缺口', type: 'select', options: [
    { label: '不限', value: '' },
    { label: '10人以上', value: 10 },
    { label: '50人以上', value: 50 },
    { label: '100人以上', value: 100 },
  ]},
];

const tableColumns = [
  { type: 'selection', width: 50, fixed: 'left' },
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'companyName', label: '企业名称', width: 160, fixed: 'left' },
  { prop: 'configStatus', label: '状态', width: 100, slot: 'status' },
  { prop: 'displayTags', label: '展示标签', width: 200, slot: 'tags' },
  { prop: 'welfareTags', label: '福利标签', width: 260, slot: 'welfare' },
  { prop: 'version', label: '版本', width: 80 },
  { prop: 'activityLevel', label: '活跃度', width: 140, slot: 'activity' },
  { prop: 'positionGapCount', label: '岗位缺口', width: 100 },
  { prop: 'updatedByName', label: '更新人', width: 100 },
  { prop: 'updated_at', label: '更新时间', width: 170 },
  { label: '操作', width: 240, slot: 'action', fixed: 'right' },
];

const selectedIds = ref<number[]>([]);
const currentRow = ref<RecruitmentConfigItem | null>(null);

const configStatusLabel = ConfigStatusLabel;
const configStatusType = ConfigStatusType;
const configLogActionLabel = ConfigLogActionLabel;
const workTypeLabel = WorkTypeLabel;
const jobCategoryLabel = JobCategoryLabel;

const editDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<any>(null);
const currentConfig = ref<RecruitmentConfigItem | null>(null);
const completenessResult = ref<CompletenessResult | null>(null);

const formData = reactive({
  companyId: undefined as number | undefined,
  displayTags: '',
  welfareTags: '',
  requirements: '',
  workTypes: '',
  jobCategories: '',
});

const formRules = {
  companyId: [{ required: true, message: '请选择企业', trigger: 'change' }],
};

const selectedDisplayTags = ref<string[]>([]);
const selectedWelfareTags = ref<string[]>([]);
const selectedJobCategories = ref<string[]>([]);
const selectedWorkTypes = ref<string[]>([]);

const displayTags = DISPLAY_TAGS;
const generalWelfareTags = GENERAL_WELFARE_TAGS;
const categoryWelfareTags = WELFARE_TAGS;

const companyIndustry = ref('');

const availableJobCategories = computed(() => {
  const industry = companyIndustry.value;
  const categories = INDUSTRY_JOB_CATEGORY_MAP[industry] || [];
  return categories.map(cat => ({
    value: cat,
    label: (JobCategoryLabel as any)[cat] || cat,
  }));
});

const mismatchWelfareTags = computed(() => {
  const selected = selectedWelfareTags.value;
  const industry = companyIndustry.value;
  const jobCats = selectedJobCategories.value;
  const allowedSet = new Set(GENERAL_WELFARE_TAGS);
  for (const cat of jobCats) {
    const tags = WELFARE_TAGS[cat] || [];
    tags.forEach(t => allowedSet.add(t));
  }
  if (jobCats.length === 0 && industry) {
    const allCats = INDUSTRY_JOB_CATEGORY_MAP[industry] || [];
    for (const cat of allCats) {
      const tags = WELFARE_TAGS[cat] || [];
      tags.forEach(t => allowedSet.add(t));
    }
  }
  return selected.filter(t => !allowedSet.has(t));
});

const canSubmit = computed(() => {
  if (!formData.companyId) return false;
  if (!completenessResult.value?.isReached) return false;
  if (mismatchWelfareTags.value.length > 0) return false;
  if (complianceIssues.value.filter(i => i.startsWith('包含违规')).length > 0) return false;
  return true;
});

const complianceIssues = computed<string[]>(() => {
  const issues: string[] = [];
  const allTexts = [
    formData.displayTags,
    formData.welfareTags,
    formData.requirements,
  ].join(' ');

  for (const keyword of VIOLATION_KEYWORDS) {
    if (allTexts.includes(keyword)) {
      issues.push(`包含违规关键词：${keyword}`);
    }
  }
  for (const keyword of FALSE_RECRUITMENT_KEYWORDS) {
    if (allTexts.includes(keyword)) {
      issues.push(`疑似虚假招聘描述：${keyword}`);
    }
  }
  return issues;
});

const displayTagsList = computed(() => currentConfig.value?.displayTags ? currentConfig.value.displayTags.split(',').filter(Boolean) : []);
const welfareTagsList = computed(() => currentConfig.value?.welfareTags ? currentConfig.value.welfareTags.split(',').filter(Boolean) : []);
const workTypesList = computed(() => currentConfig.value?.workTypes ? currentConfig.value.workTypes.split(',').filter(Boolean) : []);

const statusConfirmVisible = ref(false);
const targetStatus = ref<'enabled' | 'disabled'>('enabled');
const targetConfigId = ref<number | null>(null);

const detailDialogVisible = ref(false);
const logsDialogVisible = ref(false);
const logDetailVisible = ref(false);

const configLogList = ref<ConfigLogItem[]>([]);
const currentLog = ref<ConfigLogItem | null>(null);
const logSearchParams = reactive({
  dateRange: [] as any,
  action: '',
  operator: '',
});

const batchReplaceVisible = ref(false);
const batchReplace = reactive({
  oldTags: [] as string[],
  newTags: [] as string[],
});
const batchResult = ref<BatchConfigResult | null>(null);

const showSuccessCheck = ref(false);

const workTypeOptions = [
  { label: '全职', value: 'full_time' },
  { label: '兼职', value: 'part_time' },
  { label: '合同制', value: 'contract' },
  { label: '实习', value: 'internship' },
  { label: '远程办公', value: 'remote' },
];

const isAdmin = computed(() => userStore.role === 'admin');

function getActivityColor(level: number | undefined): string {
  const l = level || 0;
  if (l >= 70) return '#67c23a';
  if (l >= 40) return '#e6a23c';
  return '#909399';
}

function isWelfareSelected(tag: string): boolean {
  return selectedWelfareTags.value.includes(tag);
}

function isWelfareAllowed(tag: string): boolean {
  const industry = companyIndustry.value;
  const jobCats = selectedJobCategories.value;
  const allowedSet = new Set(GENERAL_WELFARE_TAGS);
  for (const cat of jobCats) {
    const tags = WELFARE_TAGS[cat] || [];
    tags.forEach(t => allowedSet.add(t));
  }
  if (jobCats.length === 0 && industry) {
    const allCats = INDUSTRY_JOB_CATEGORY_MAP[industry] || [];
    for (const cat of allCats) {
      const tags = WELFARE_TAGS[cat] || [];
      tags.forEach(t => allowedSet.add(t));
    }
  }
  return allowedSet.has(tag);
}

function isCategorySelected(cat: string): boolean {
  if (selectedJobCategories.value.length === 0) return true;
  return selectedJobCategories.value.includes(cat);
}

function isTagViolation(tag: string): boolean {
  return VIOLATION_KEYWORDS.some(kw => tag.includes(kw));
}

function toggleWelfareTag(tag: string) {
  if (formData.companyId && completenessResult.value && !completenessResult.value.isReached) {
    return;
  }
  const idx = selectedWelfareTags.value.indexOf(tag);
  if (idx > -1) {
    selectedWelfareTags.value.splice(idx, 1);
  } else {
    selectedWelfareTags.value.push(tag);
  }
  updateFormDataFromSelections();
}

function handleDisplayTagsChange() {
  formData.displayTags = selectedDisplayTags.value.join(',');
}

function handleJobCategoryChange() {
  formData.jobCategories = selectedJobCategories.value.join(',');
  updateFormDataFromSelections();
}

function updateFormDataFromSelections() {
  formData.displayTags = selectedDisplayTags.value.join(',');
  formData.welfareTags = selectedWelfareTags.value.join(',');
  formData.workTypes = selectedWorkTypes.value.join(',');
  formData.jobCategories = selectedJobCategories.value.join(',');
}

function populateSelectionsFromFormData() {
  selectedDisplayTags.value = formData.displayTags ? formData.displayTags.split(',').filter(Boolean) : [];
  selectedWelfareTags.value = formData.welfareTags ? formData.welfareTags.split(',').filter(Boolean) : [];
  selectedWorkTypes.value = formData.workTypes ? formData.workTypes.split(',').filter(Boolean) : [];
  selectedJobCategories.value = formData.jobCategories ? formData.jobCategories.split(',').filter(Boolean) : [];
}

async function loadConfigList() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    };
    const result = await getRecruitmentConfigListApi(params);
    configList.value = result.list;
    pagination.total = result.total;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

async function loadCompanyList() {
  try {
    const result = await getCompanyListApi({ page: 1, pageSize: 100, status: 1 });
    companyList.value = result.list;
  } catch (err: any) {
    console.error('加载企业列表失败', err);
  }
}

function handleSearch() {
  pagination.page = 1;
  loadConfigList();
}

function handleReset() {
  searchParams.companyName = '';
  searchParams.configStatus = '';
  searchParams.activityLevelMin = undefined;
  searchParams.positionGapMin = undefined;
  pagination.page = 1;
  loadConfigList();
}

function handlePageChange(page: number) {
  pagination.page = page;
  loadConfigList();
}

function handleSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.page = 1;
  loadConfigList();
}

function handleSelectionChange(rows: any[]) {
  selectedIds.value = rows.map(r => r.id);
}

function handleCurrentChange(row: any) {
  currentRow.value = row;
}

async function handleAdd() {
  isEdit.value = false;
  resetForm();
  editDialogVisible.value = true;
  await loadCompanyList();
}

async function handleEdit(row: RecruitmentConfigItem) {
  isEdit.value = true;
  currentConfig.value = row;
  formData.companyId = row.companyId;
  companyIndustry.value = '';
  await checkCompleteness(row.companyId);
  await loadConfigDetail(row.id);
  editDialogVisible.value = true;
}

function handleDetail(row: RecruitmentConfigItem) {
  currentConfig.value = row;
  detailDialogVisible.value = true;
}

async function loadConfigDetail(id: number) {
  try {
    const config = await getRecruitmentConfigDetailApi(id);
    currentConfig.value = config;
    Object.assign(formData, {
      displayTags: config.displayTags,
      welfareTags: config.welfareTags,
      requirements: config.requirements,
      workTypes: config.workTypes,
      jobCategories: config.jobCategories,
    });
    populateSelectionsFromFormData();
    const company = companyList.value.find(c => c.id === formData.companyId);
    if (company) {
      companyIndustry.value = company.industry || '';
    }
  } catch (err: any) {
    ElMessage.error(err.message || '加载配置详情失败');
  }
}

async function handleCompanyChange(companyId: number) {
  companyIndustry.value = '';
  const company = companyList.value.find(c => c.id === companyId);
  if (company) {
    companyIndustry.value = company.industry || '';
  }
  await checkCompleteness(companyId);
  selectedJobCategories.value = [];
  updateFormDataFromSelections();
}

async function checkCompleteness(companyId: number) {
  try {
    const result = await checkInfoCompletenessApi(companyId);
    completenessResult.value = result;
  } catch (err: any) {
    completenessResult.value = null;
  }
}

function resetForm() {
  formData.companyId = undefined;
  formData.displayTags = '';
  formData.welfareTags = '';
  formData.requirements = '';
  formData.workTypes = '';
  formData.jobCategories = '';
  selectedDisplayTags.value = [];
  selectedWelfareTags.value = [];
  selectedJobCategories.value = [];
  selectedWorkTypes.value = [];
  completenessResult.value = null;
  companyIndustry.value = '';
  batchResult.value = null;
}

async function handleSubmit() {
  if (!formData.companyId) {
    ElMessage.warning('请选择企业');
    return;
  }
  if (!completenessResult.value?.isReached) {
    ElMessage.error('企业基础信息完整度未达标，无法提交');
    return;
  }
  if (mismatchWelfareTags.value.length > 0) {
    ElMessage.error(`存在不匹配的福利标签：${mismatchWelfareTags.value.join('、')}`);
    return;
  }

  submitLoading.value = true;
  try {
    updateFormDataFromSelections();

    if (isEdit.value && currentConfig.value) {
      const dupResult = await checkDuplicateConfigApi(currentConfig.value.id, formData);
      if (dupResult.isDuplicate) {
        ElMessage.warning(dupResult.message);
        submitLoading.value = false;
        return;
      }
    }

    const validResult = await validateConfigApi(formData, companyIndustry.value);
    if (!validResult.valid) {
      ElMessage.error(validResult.errors.join('；'));
      submitLoading.value = false;
      return;
    }

    if (isEdit.value && currentConfig.value) {
      await updateRecruitmentConfigApi(currentConfig.value.id, formData);
      ElMessage.success('修改成功');
    } else {
      await createRecruitmentConfigApi(formData.companyId!, formData);
      ElMessage.success('创建成功');
    }

    showSuccessToast();
    editDialogVisible.value = false;
    loadConfigList();
  } catch (err: any) {
    ElMessage.error(err.message || '提交失败');
  } finally {
    submitLoading.value = false;
  }
}

function handleToggleStatus(row: RecruitmentConfigItem, status: 'enabled' | 'disabled') {
  targetConfigId.value = row.id;
  targetStatus.value = status;
  statusConfirmVisible.value = true;
}

async function confirmToggleStatus() {
  if (!targetConfigId.value) return;
  statusLoading.value = true;
  try {
    if (targetStatus.value === 'enabled') {
      await enableConfigApi(targetConfigId.value);
      ElMessage.success('启用成功');
    } else {
      await disableConfigApi(targetConfigId.value);
      ElMessage.success('停用成功');
    }
    showSuccessToast();
    statusConfirmVisible.value = false;
    loadConfigList();
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败');
  } finally {
    statusLoading.value = false;
  }
}

async function handleBatchEnable() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的配置');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量启用选中的 ${selectedIds.value.length} 个配置吗？`,
      '批量启用确认',
      { type: 'success' }
    );
  } catch {
    return;
  }

  try {
    const result = await batchEnableConfigApi(selectedIds.value);
    if (result.failed > 0) {
      ElMessage.warning(`批量启用完成：成功 ${result.success} 个，失败 ${result.failed} 个`);
    } else {
      showSuccessToast();
      ElMessage.success('批量启用成功');
    }
    loadConfigList();
  } catch (err: any) {
    ElMessage.error(err.message || '批量操作失败');
  }
}

async function handleBatchDisable() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的配置');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量停用选中的 ${selectedIds.value.length} 个配置吗？停用后前台将不再展示相关招聘信息。`,
      '批量停用确认',
      { type: 'warning' }
    );
  } catch {
    return;
  }

  try {
    const result = await batchDisableConfigApi(selectedIds.value);
    if (result.failed > 0) {
      ElMessage.warning(`批量停用完成：成功 ${result.success} 个，失败 ${result.failed} 个`);
    } else {
      showSuccessToast();
      ElMessage.success('批量停用成功');
    }
    loadConfigList();
  } catch (err: any) {
    ElMessage.error(err.message || '批量操作失败');
  }
}

function handleBatchReplace() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的配置');
    return;
  }
  batchReplace.oldTags = [];
  batchReplace.newTags = [];
  batchResult.value = null;
  batchReplaceVisible.value = true;
}

async function confirmBatchReplace() {
  if (batchReplace.oldTags.length === 0 && batchReplace.newTags.length === 0) {
    ElMessage.warning('请至少选择一个要移除或新增的标签');
    return;
  }

  batchLoading.value = true;
  try {
    const result = await batchReplaceWelfareApi(
      selectedIds.value,
      batchReplace.oldTags,
      batchReplace.newTags
    );
    batchResult.value = result;
    if (result.failed === 0) {
      showSuccessToast();
    }
    loadConfigList();
  } catch (err: any) {
    ElMessage.error(err.message || '批量替换失败');
  } finally {
    batchLoading.value = false;
  }
}

async function handleViewLogs() {
  logsLoading.value = true;
  try {
    const result = await getConfigLogsApi({ page: 1, pageSize: 50 });
    configLogList.value = result.list;
    logsDialogVisible.value = true;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    logsLoading.value = false;
  }
}

async function handleViewConfigLogs(row: RecruitmentConfigItem) {
  logsLoading.value = true;
  try {
    const result = await getConfigLogsByConfigIdApi(row.id);
    configLogList.value = result.list;
    logsDialogVisible.value = true;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    logsLoading.value = false;
  }
}

function handleLogSearch() {
  loadConfigLogs();
}

async function loadConfigLogs() {
  logsLoading.value = true;
  try {
    const params: any = { page: 1, pageSize: 50 };
    if (logSearchParams.action) {
      params.action = logSearchParams.action;
    }
    const result = await getConfigLogsApi(params);
    configLogList.value = result.list;
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败');
  } finally {
    logsLoading.value = false;
  }
}

function showLogDetail(row: ConfigLogItem) {
  currentLog.value = row;
  logDetailVisible.value = true;
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function handleInputFocus(e: Event) {
  const target = e.target as HTMLElement;
  target.style.transform = 'scale(1.02)';
  target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
  target.style.transition = 'all 0.2s ease';
}

function handleInputBlur(e: Event) {
  const target = e.target as HTMLElement;
  target.style.transform = 'scale(1)';
  target.style.boxShadow = 'none';
}

function handleDialogOpen() {
  nextTick(() => {
    formRef.value?.clearValidate?.();
  });
}

function handleTagHover(tag: string, isHover: boolean) {
  // 悬浮效果由CSS处理
}

function showSuccessToast() {
  showSuccessCheck.value = true;
  setTimeout(() => {
    showSuccessCheck.value = false;
  }, 1500);
}

function scrollToCategory(category: string) {
  // 滚动到指定分类
}

onMounted(() => {
  loadConfigList();
  loadCompanyList();
});
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.recruitment-config-page {
  .zoom-dialog :deep(.el-dialog) {
    animation: dialogZoomIn 0.3s ease-out;
    transform-origin: center center;
  }

  @keyframes dialogZoomIn {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .sticky-category-bar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    gap: $spacing-md;
    padding: $spacing-sm 0;
    background: $bg-color;
    border-bottom: 1px solid $border-color;
    margin-bottom: $spacing-base;

    .category-item {
      padding: $spacing-xs $spacing-base;
      border-radius: $border-radius;
      cursor: pointer;
      font-size: $font-size-sm;
      color: $text-secondary;
      transition: all 0.2s;

      &:hover {
        background: $bg-light;
        color: $text-primary;
      }

      &.active {
        background: $primary-color;
        color: $bg-white;
      }
    }
  }

  .completeness-alert {
    margin-bottom: $spacing-base;
  }

  .config-form {
    .form-section-title {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
      margin: $spacing-lg 0 $spacing-base 0;
      padding-bottom: $spacing-sm;
      border-bottom: 1px solid $border-light;

      &:first-of-type {
        margin-top: 0;
      }

      .el-icon {
        color: $primary-color;
      }
    }

    .form-tip {
      font-size: $font-size-xs;
      color: $text-placeholder;
      margin-top: $spacing-xs;
    }

    .tag-error {
      :deep(.el-checkbox__label) {
        color: $danger-color;
      }
    }
  }

  .welfare-category {
    margin-bottom: $spacing-base;

    &:last-child {
      margin-bottom: 0;
    }

    .welfare-category-title {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-bottom: $spacing-sm;
      font-weight: 500;
    }

    .welfare-tags {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-xs;
    }

    .welfare-tag-item {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: scale(1.05);
      }

      &.tag-mismatch {
        opacity: 0.4;
        position: relative;

        .mismatch-icon {
          margin-left: 4px;
          font-size: 12px;
          color: $warning-color;
        }
      }
    }
  }

  .mismatch-warning {
    display: flex;
    align-items: flex-start;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-base;
    background: rgba(230, 162, 60, 0.1);
    border-radius: $border-radius-sm;
    color: $warning-color;
    font-size: $font-size-sm;
    margin-top: $spacing-sm;

    .el-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
  }

  .compliance-warning {
    margin-top: $spacing-base;
  }

  .mini-tag {
    margin-right: 4px;
    margin-bottom: 2px;
  }

  .more-tags {
    font-size: $font-size-xs;
    color: $text-placeholder;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .activity-text {
    font-size: $font-size-xs;
    color: $text-secondary;
    margin-left: $spacing-xs;
  }

  .confirm-content {
    display: flex;
    align-items: flex-start;
    gap: $spacing-base;

    .confirm-text {
      flex: 1;

      p {
        margin: 0 0 $spacing-sm 0;
        color: $text-primary;

        &.tip {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }
  }

  .detail-tag {
    margin-right: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  .requirements-content {
    line-height: 1.6;
    color: $text-primary;
    white-space: pre-wrap;
  }

  .log-search-bar {
    display: flex;
    gap: $spacing-base;
    margin-bottom: $spacing-base;
  }

  .log-list-container {
    .changed-fields {
      font-size: $font-size-xs;
      color: $text-secondary;
    }
  }

  .log-detail {
    .log-detail-item {
      display: flex;
      margin-bottom: $spacing-sm;

      label {
        width: 80px;
        flex-shrink: 0;
        color: $text-secondary;
      }

      span {
        flex: 1;
        color: $text-primary;
      }
    }

    .log-compare {
      display: flex;
      gap: $spacing-base;
      margin: $spacing-base 0;

      .log-compare-item {
        flex: 1;
        padding: $spacing-sm;
        border-radius: $border-radius-sm;

        &.log-old {
          background: rgba(230, 162, 60, 0.05);
          border-left: 3px solid $warning-color;
        }

        &.log-new {
          background: rgba(16, 185, 129, 0.05);
          border-left: 3px solid $success-color;
        }

        .log-compare-title {
          font-size: $font-size-sm;
          font-weight: 500;
          color: $text-secondary;
          margin-bottom: $spacing-xs;
        }

        pre {
          margin: 0;
          padding: $spacing-xs;
          background: $bg-white;
          border-radius: $border-radius-sm;
          font-size: $font-size-xs;
          max-height: 200px;
          overflow: auto;
          white-space: pre-wrap;
        }

        .empty-text {
          font-size: $font-size-sm;
          color: $text-placeholder;
        }
      }
    }
  }

  .batch-result {
    margin-top: $spacing-base;

    .batch-errors {
      margin-top: $spacing-sm;

      .batch-error-item {
        font-size: $font-size-xs;
        color: $text-secondary;
        margin-bottom: $spacing-xs;
      }
    }
  }

  .success-toast {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 3000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xl $spacing-2xl;
    background: rgba(0, 0, 0, 0.7);
    border-radius: $border-radius-lg;
    color: $bg-white;
    animation: fadeInScale 0.3s ease-out;

    @keyframes fadeInScale {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  }
}
</style>
