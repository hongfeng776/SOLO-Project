<template>
  <div class="interview-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="面试阶段" prop="stage">
        <el-select v-model="searchForm.stage" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in InterviewStageLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="面试结果" prop="result">
        <el-select v-model="searchForm.result" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in InterviewResultLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="面试官" prop="interviewer">
        <el-input v-model="searchForm.interviewer" placeholder="请输入" clearable style="width: 140px" />
      </el-form-item>
    </SearchForm>

    <ProTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      show-selection
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
    >
      <template #toolbar>
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">安排面试</el-button>
          <el-button type="danger" :icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </template>

      <el-table-column label="候选人" width="120">
        <template #default="{ row }">{{ row.resume?.name || '-' }}</template>
      </el-table-column>
      <el-table-column label="应聘岗位" width="140">
        <template #default="{ row }">{{ row.job?.title || '-' }}</template>
      </el-table-column>
      <el-table-column label="面试阶段" width="100" align="center">
        <template #default="{ row }">{{ InterviewStageLabel[row.stage] }}</template>
      </el-table-column>
      <el-table-column prop="interviewer" label="面试官" width="100" />
      <el-table-column label="面试时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.interviewTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="location" label="面试地点" min-width="120" />
      <el-table-column label="面试结果" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="InterviewResultType[row.result]" size="small">
            {{ InterviewResultLabel[row.result] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="score" label="评分" width="80" align="center" />
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </ProTable>

    <ModalForm
      v-model="dialogVisible"
      :title="dialogTitle"
      :form-data="formData"
      :rules="formRules"
      :loading="submitLoading"
      width="650px"
      @submit="handleSubmit"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="简历ID" prop="resumeId">
            <el-input-number v-model="formData.resumeId" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位ID" prop="jobId">
            <el-input-number v-model="formData.jobId" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="面试阶段" prop="stage">
            <el-select v-model="formData.stage" style="width: 100%">
              <el-option v-for="(label, key) in InterviewStageLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="面试官" prop="interviewer">
            <el-input v-model="formData.interviewer" placeholder="请输入面试官" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="面试时间" prop="interviewTime">
            <el-date-picker
              v-model="formData.interviewTime"
              type="datetime"
              placeholder="选择面试时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="选择结束时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="面试地点" prop="location">
            <el-input v-model="formData.location" placeholder="请输入地点" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="面试方式" prop="type">
            <el-select v-model="formData.type" style="width: 100%">
              <el-option label="现场面试" value="onsite" />
              <el-option label="视频面试" value="video" />
              <el-option label="电话面试" value="phone" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="面试结果" prop="result">
            <el-select v-model="formData.result" style="width: 100%">
              <el-option v-for="(label, key) in InterviewResultLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="评分" prop="score">
            <el-input-number v-model="formData.score" :min="0" :max="100" :precision="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="综合评价" prop="evaluation">
        <el-input v-model="formData.evaluation" type="textarea" :rows="2" placeholder="请输入综合评价" />
      </el-form-item>
      <el-form-item label="面试反馈" prop="feedback">
        <el-input v-model="formData.feedback" type="textarea" :rows="3" placeholder="请输入详细反馈" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="下一轮" prop="nextStage">
            <el-select v-model="formData.nextStage" placeholder="请选择" style="width: 100%" clearable>
              <el-option v-for="(label, key) in InterviewStageLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="下轮时间" prop="nextTime">
            <el-date-picker
              v-model="formData.nextTime"
              type="datetime"
              placeholder="选择时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </ModalForm>

    <el-dialog v-model="detailVisible" title="面试详情" width="650px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="候选人">{{ detailData.resume?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="应聘岗位">{{ detailData.job?.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试阶段">{{ InterviewStageLabel[detailData.stage] }}</el-descriptions-item>
        <el-descriptions-item label="面试官">{{ detailData.interviewer || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试时间">{{ formatDateTime(detailData.interviewTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatDateTime(detailData.endTime) }}</el-descriptions-item>
        <el-descriptions-item label="面试地点">{{ detailData.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试方式">{{ detailData.type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试结果">
          <el-tag :type="InterviewResultType[detailData.result]">{{ InterviewResultLabel[detailData.result] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="评分">{{ detailData.score || '-' }}</el-descriptions-item>
        <el-descriptions-item label="综合评价" :span="2">{{ detailData.evaluation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试反馈" :span="2">{{ detailData.feedback || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下一轮">{{ detailData.nextStage ? InterviewStageLabel[detailData.nextStage] : '-' }}</el-descriptions-item>
        <el-descriptions-item label="下轮时间">{{ formatDateTime(detailData.nextTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { SearchForm, ProTable, ModalForm } from '@/components';
import {
  getInterviewListApi,
  createInterviewApi,
  updateInterviewApi,
  deleteInterviewApi,
  batchDeleteInterviewApi,
  getInterviewDetailApi,
  type InterviewItem,
} from '@/api/interview';
import {
  InterviewStage,
  InterviewStageLabel,
  InterviewResult,
  InterviewResultLabel,
  InterviewResultType,
  DATETIME_FORMAT,
} from '@/constants/recruitment';

const loading = ref(false);
const tableData = ref<InterviewItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);

const searchForm = reactive({
  stage: '',
  result: '',
  interviewer: '',
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);

const formData = reactive<Partial<InterviewItem>>({
  resumeId: 1,
  jobId: 1,
  stage: InterviewStage.FIRST,
  interviewer: '',
  interviewTime: undefined,
  endTime: undefined,
  location: '',
  type: 'onsite',
  result: InterviewResult.PENDING,
  score: undefined,
  evaluation: '',
  feedback: '',
  nextStage: '',
  nextTime: undefined,
  remark: '',
});

const formRules: FormRules = {
  resumeId: [{ required: true, message: '请输入简历ID', trigger: 'blur' }],
  jobId: [{ required: true, message: '请输入岗位ID', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择面试阶段', trigger: 'change' }],
};

const detailVisible = ref(false);
const detailData = ref<InterviewItem>({} as InterviewItem);

const formatDateTime = (val: string | undefined) => {
  if (!val) return '-';
  return dayjs(val).format(DATETIME_FORMAT);
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    };
    if (!params.stage) delete (params as any).stage;
    if (!params.result) delete (params as any).result;
    const res = await getInterviewListApi(params);
    tableData.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  fetchList();
};

const handleReset = () => {
  page.value = 1;
};

const handlePageChange = (p: number, ps: number) => {
  page.value = p;
  pageSize.value = ps;
  fetchList();
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item) => item.id);
};

const handleAdd = () => {
  isEdit.value = false;
  dialogTitle.value = '安排面试';
  Object.assign(formData, {
    resumeId: 1,
    jobId: 1,
    stage: InterviewStage.FIRST,
    interviewer: '',
    interviewTime: undefined,
    endTime: undefined,
    location: '',
    type: 'onsite',
    result: InterviewResult.PENDING,
    score: undefined,
    evaluation: '',
    feedback: '',
    nextStage: '',
    nextTime: undefined,
    remark: '',
  });
  dialogVisible.value = true;
};

const handleEdit = (row: InterviewItem) => {
  isEdit.value = true;
  dialogTitle.value = '编辑面试';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleView = async (row: InterviewItem) => {
  try {
    const res = await getInterviewDetailApi(row.id);
    detailData.value = res;
    detailVisible.value = true;
  } catch (error) {
    console.error(error);
  }
};

const handleSubmit = async () => {
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      await updateInterviewApi(formData.id!, formData);
      ElMessage.success('更新成功');
    } else {
      await createInterviewApi(formData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: InterviewItem) => {
  ElMessageBox.confirm('确定要删除该面试记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteInterviewApi(row.id);
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteInterviewApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      fetchList();
    })
    .catch(() => {});
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.interview-page {
  .toolbar-left {
    display: flex;
    gap: $spacing-sm;
  }
}
</style>
