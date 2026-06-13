<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>

    <el-form :inline="true" :model="queryForm" class="filter-bar" @submit.prevent>
      <el-form-item label="用户名">
        <el-input
          v-model="queryForm.username"
          placeholder="请输入用户名"
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item label="操作模块">
        <el-input
          v-model="queryForm.module"
          placeholder="请输入模块"
          clearable
          style="width: 160px"
        />
      </el-form-item>
      <el-form-item label="操作类型">
        <el-select
          v-model="queryForm.operation"
          placeholder="全部"
          clearable
          style="width: 140px"
        >
          <el-option label="新增" value="create" />
          <el-option label="修改" value="update" />
          <el-option label="删除" value="delete" />
          <el-option label="查询" value="query" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="queryForm.status"
          placeholder="全部"
          clearable
          style="width: 120px"
        >
          <el-option label="成功" :value="1" />
          <el-option label="失败" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 340px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="tableData"
      border
      stripe
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="username" label="操作人" width="120" />
      <el-table-column prop="module" label="模块" width="120" />
      <el-table-column prop="operation" label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="operationTagType(row.operation)" size="small">
            {{ operationText(row.operation) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="method" label="方法" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="methodTagType(row.method)" size="small" effect="plain">
            {{ row.method }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="请求路径" min-width="220">
        <template #default="{ row }">
          <EllipsisText :text="row.path" :width="220" />
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="status" label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small" round>
            {{ row.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="cost_time" label="耗时" width="100" align="center">
        <template #default="{ row }">
          <FormattedNumber :value="row.cost_time" suffix="ms" />
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="操作时间" width="170">
        <template #default="{ row }">
          <FormattedDate :value="row.created_at" format="YYYY-MM-DD HH:mm:ss" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-dialog v-model="detailVisible" title="日志详情" width="720px">
      <div v-loading="detailLoading">
        <el-descriptions v-if="currentLog" :column="2" border>
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.username }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ operationText(currentLog.operation) }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ currentLog.method }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'" size="small">
            {{ currentLog.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="耗时">
          <FormattedNumber :value="currentLog.cost_time" suffix="ms" />
        </el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">
          <FormattedDate :value="currentLog.created_at" format="YYYY-MM-DD HH:mm:ss" />
        </el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">
          <code>{{ currentLog.path }}</code>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre style="max-height: 200px; overflow: auto; margin: 0; background: #f5f7fa; padding: 10px; border-radius: 4px;">{{ formatParams(currentLog.params) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentLog.error_msg" label="错误信息" :span="2">
          <span style="color: #f53f3f">{{ currentLog.error_msg }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="User-Agent" :span="2">
          <EllipsisText :text="currentLog.user_agent" :width="600" />
        </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import FormattedDate from '@/components/FormattedDate.vue';
import FormattedNumber from '@/components/FormattedNumber.vue';
import EllipsisText from '@/components/EllipsisText.vue';
import { getOperationLogList, getOperationLogDetail } from '@/api/log';
import type { OperationLogItem, OperationLogQuery } from '@/types';

const loading = ref(false);
const tableData = ref<OperationLogItem[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentLog = ref<OperationLogItem | null>(null);

const queryForm = reactive<OperationLogQuery>({
  page: 1,
  pageSize: 20,
  username: '',
  module: '',
  operation: '',
  status: ''
});

async function fetchList() {
  loading.value = true;
  try {
    const params: OperationLogQuery = { ...queryForm };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0];
      params.endTime = dateRange.value[1];
    }
    const res = await getOperationLogList(params);
    tableData.value = res.list;
    total.value = res.total;
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryForm.page = 1;
  fetchList();
}

function handleReset() {
  queryForm.username = '';
  queryForm.module = '';
  queryForm.operation = '';
  queryForm.status = '';
  queryForm.page = 1;
  dateRange.value = [];
  fetchList();
}

async function handleView(row: OperationLogItem) {
  detailVisible.value = true;
  detailLoading.value = true;
  currentLog.value = null;
  try {
    const res = await getOperationLogDetail(row.id);
    currentLog.value = res;
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    detailLoading.value = false;
  }
}

function operationText(op: string) {
  const map: Record<string, string> = {
    create: '新增',
    update: '修改',
    delete: '删除',
    query: '查询',
    other: '其他'
  };
  return map[op] || op;
}

function operationTagType(op: string) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    query: 'primary',
    other: 'info'
  };
  return map[op] || 'info';
}

function methodTagType(method: string) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    POST: 'success',
    PUT: 'warning',
    PATCH: 'warning',
    DELETE: 'danger',
    GET: 'primary'
  };
  return map[method] || 'info';
}

function formatParams(params: string) {
  if (!params) return '-';
  try {
    return JSON.stringify(JSON.parse(params), null, 2);
  } catch {
    return params;
  }
}

onMounted(() => {
  fetchList();
});
</script>
