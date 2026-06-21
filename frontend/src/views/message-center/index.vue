<template>
  <div class="message-center">
    <el-card class="stats-card">
      <div class="stats-row">
        <div class="stat-item" v-for="stat in statsList" :key="stat.key">
          <div class="stat-icon" :style="{ background: stat.color + '20' }">
          <el-icon :size="24" :style="{ color: stat.color }">
            <component :is="stat.icon" />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </el-card>

  <el-card class="filter-card">
    <el-form :model="queryParams" inline class="filter-form">
      <el-form-item label="业务类型">
        <el-select v-model="queryParams.businessType" placeholder="请选择" clearable style="width: 160px">
          <el-option v-for="item in MESSAGE_BUSINESS_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="推送状态">
        <el-select v-model="queryParams.deliveryStatus" placeholder="请选择" clearable style="width: 140px">
          <el-option v-for="item in MESSAGE_DELIVERY_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="阅读状态">
        <el-select v-model="queryParams.readStatus" placeholder="请选择" clearable style="width: 120px">
          <el-option label="已读" value="read" />
          <el-option label="未读" value="unread" />
        </el-select>
      </el-form-item>
      <el-form-item label="推送渠道">
        <el-select v-model="queryParams.pushChannel" placeholder="请选择" clearable style="width: 120px">
          <el-option v-for="item in MESSAGE_PUSH_CHANNEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="queryParams.keyword" placeholder="搜索标题/内容" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="推送时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
        <el-button @click="handleReset" :icon="Refresh">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>

  <el-card class="table-card">
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button
          v-if="isAdmin"
          type="danger"
          plain
          :disabled="selectedIds.length === 0"
          @click="handleBatchRetry"
          :icon="RefreshRight"
        >
          批量重发
        </el-button>
        <el-button
          type="success"
          plain
          :disabled="selectedIds.length === 0"
          @click="handleBatchMarkRead"
          :icon="Check"
        >
          批量已读
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
          :icon="Delete"
        >
          批量删除
        </el-button>
        <el-button
          type="warning"
          plain
          @click="handleBatchMarkOverdue"
          :icon="Clock"
        >
          标记逾期未读
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" plain @click="handleMarkAllRead" :icon="Check">
          全部已读
        </el-button>
        <el-button @click="loadData" :icon="Refresh">刷新</el-button>
      </div>
    </div>

    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="tableData"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      stripe
      style="width: 100%"
      class="message-table"
      :row-class-name="tableRowClassName"
    >
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="title" label="消息标题" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="message-title-cell">
            <el-icon v-if="row.readStatus === 'unread'" class="unread-dot">
              <CircleCheck />
            </el-icon>
            <span :class="{ 'unread-text': row.readStatus === 'unread' }">{{ row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="businessType" label="业务类型" width="130" align="center">
        <template #default="{ row }">
          <el-tag :type="getBusinessTypeTag(row.businessType)" size="small">
            {{ MessageBusinessTypeLabel[row.businessType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="deliveryStatus" label="推送状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="MessageDeliveryStatusType[row.deliveryStatus]" size="small" effect="light">
            {{ MessageDeliveryStatusLabel[row.deliveryStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="pushChannel" label="推送渠道" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="info">
            {{ MessagePushChannelLabel[row.pushChannel] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="receiverName" label="接收人" width="100" align="center" />
      <el-table-column prop="priority" label="优先级" width="90" align="center">
        <template #default="{ row }">
          <el-progress :percentage="row.priority" :stroke-width="8" :show-text="false" />
        </template>
      </el-table-column>
      <el-table-column prop="retryCount" label="重试次数" width="90" align="center">
        <template #default="{ row }">
          <span :class="{ 'retry-warning': row.retryCount > 0 }">{{ row.retryCount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="isAbnormal" label="异常" width="70" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.isAbnormal" class="abnormal-icon">
            <Warning />
          </el-icon>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="170" align="center">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click.stop="handleViewDetail(row)" :icon="View">
            查看
          </el-button>
          <el-button
            v-if="row.deliveryStatus === MessageDeliveryStatus.SENT_FAILED"
            type="warning"
            link
            @click.stop="handleRetry(row)"
            :icon="RefreshRight"
          >
            重发
          </el-button>
          <el-button type="info" link @click.stop="handleViewLogs(row)" :icon="Document">
            日志
          </el-button>
          <el-button type="danger" link @click.stop="handleDelete(row)" :icon="Delete">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pagination"
      v-model:current-page="queryParams.page"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </el-card>

  <el-dialog
    v-model="detailDialogVisible"
    title="消息详情"
    width="600px"
    :close-on-click-modal="false"
    class="detail-dialog"
  >
    <div v-if="currentMessage" class="message-detail">
      <div class="detail-header">
        <h3>{{ currentMessage.title }}</h3>
        <div class="detail-meta">
          <el-tag :type="MessageDeliveryStatusType[currentMessage.deliveryStatus]" size="small">
            {{ MessageDeliveryStatusLabel[currentMessage.deliveryStatus] }}
          </el-tag>
          <el-tag size="small" type="info">
            {{ MessageBusinessTypeLabel[currentMessage.businessType] }}
          </el-tag>
          <span class="meta-time">{{ formatDateTime(currentMessage.created_at) }}</span>
        </div>
      </div>
      <el-descriptions :column="2" border class="detail-desc">
        <el-descriptions-item label="消息编码">{{ currentMessage.messageCode }}</el-descriptions-item>
        <el-descriptions-item label="接收人">{{ currentMessage.receiverName }}</el-descriptions-item>
        <el-descriptions-item label="推送渠道">
          {{ MessagePushChannelLabel[currentMessage.pushChannel] }}
        </el-descriptions-item>
        <el-descriptions-item label="优先级">{{ currentMessage.priority }}</el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ currentMessage.retryCount }}</el-descriptions-item>
        <el-descriptions-item label="跳转类型">
          {{ MessageJumpTypeLabel[currentMessage.jumpType] }}
        </el-descriptions-item>
        <el-descriptions-item label="发送时间" v-if="currentMessage.sentAt">
          {{ formatDateTime(currentMessage.sentAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="阅读时间" v-if="currentMessage.readAt">
          {{ formatDateTime(currentMessage.readAt) }}
        </el-descriptions-item>
      </el-descriptions>
      <div class="detail-content">
        <h4>消息内容</h4>
        <div class="content-text">{{ currentMessage.content }}</div>
      </div>
      <div v-if="currentMessage.failedReason" class="detail-failed">
        <el-alert :title="'失败原因：' + currentMessage.failedReason" type="error" show-icon :closable="false" />
      </div>
      <div v-if="currentMessage.jumpType !== MessageJumpType.NONE" class="detail-jump">
        <el-button type="primary" @click="handleJumpToBusiness" :icon="Link">
          跳转到{{ MessageJumpTypeLabel[currentMessage.jumpType] }}
        </el-button>
      </div>
    </div>
    <template #footer>
      <el-button @click="detailDialogVisible = false">关闭</el-button>
      <el-button
        v-if="currentMessage && currentMessage.deliveryStatus === MessageDeliveryStatus.SENT_FAILED"
        type="warning"
        @click="handleRetryFromDetail"
      >
        重新推送
      </el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="logsDialogVisible"
    title="消息推送日志"
    width="700px"
    :close-on-click-modal="false"
    class="logs-dialog"
  >
    <el-table :data="logsList" v-loading="logsLoading">
      <el-table-column prop="id" label="ID" width="60" align="center" />
      <el-table-column prop="action" label="操作类型" width="130" align="center">
        <template #default="{ row }">
          <el-tag size="small">{{ MessageDeliveryLogActionLabel[row.action] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="actionDetail" label="操作详情" min-width="200" show-overflow-tooltip />
      <el-table-column prop="oldDeliveryStatus" label="原状态" width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.oldDeliveryStatus">
            {{ MessageDeliveryStatusLabel[row.oldDeliveryStatus] }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="newDeliveryStatus" label="新状态" width="100" align="center">
        <template #default="{ row }">
          <span v-if="row.newDeliveryStatus">
            {{ MessageDeliveryStatusLabel[row.newDeliveryStatus] }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="operatorName" label="操作人" width="100" align="center" />
      <el-table-column prop="created_at" label="操作时间" width="170" align="center">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="logs-pagination"
      v-model:current-page="logsPage"
      v-model:page-size="logsPageSize"
      :total="logsTotal"
      layout="prev, pager, next"
      @current-change="loadLogs"
      small
    />
    <template #footer>
      <el-button @click="logsDialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="deleteConfirmVisible"
    title="确认删除"
    width="420px"
    :close-on-click-modal="false"
    class="confirm-dialog"
  >
    <div class="confirm-content">
      <el-icon class="confirm-icon warning">
      <Warning />
    </el-icon>
    <span>确定要删除选中的消息吗？此操作不可恢复。</span>
  </div>
  <template #footer>
    <el-button @click="deleteConfirmVisible = false">取消</el-button>
    <el-button type="danger" @click="confirmDelete">确定删除</el-button>
  </template>
</el-dialog>
</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import {
Search,
Refresh,
Delete,
Check,
View,
Document,
Clock,
Link,
Warning,
CircleCheck,
RefreshRight,
Bell,
CheckCircle,
Close,
CircleClose,
} from '@element-plus/icons-vue';
import {
MessageDeliveryStatus,
MessageDeliveryStatusLabel,
MessageDeliveryStatusType,
MessageBusinessType,
MessageBusinessTypeLabel,
MESSAGE_BUSINESS_TYPE_OPTIONS,
MESSAGE_DELIVERY_STATUS_OPTIONS,
MessagePushChannel,
MessagePushChannelLabel,
MESSAGE_PUSH_CHANNEL_OPTIONS,
MessageJumpType,
MessageJumpTypeLabel,
MessageDeliveryLogAction,
MessageDeliveryLogActionLabel,
MESSAGE_MAX_RETRY_COUNT,
MESSAGE_UNREAD_OVERDUE_DAYS,
MessageTemplateScene,
MessageTemplateSceneLabel,
UserRole,
} from '@/constants/recruitment';
import {
getMessageList,
getUnreadCount,
getMessageStats,
markMessageAsRead,
markMessageAsUnread,
markAllMessagesAsRead,
retryMessage,
batchRetryMessages,
batchMarkMessagesRead,
batchDeleteMessages,
batchMarkOverdueUnread,
getMessageLogs,
deleteMessage,
type MessageDeliveryItem,
type MessageDeliveryLogItem,
type MessageDeliveryStats,
} from '@/api/message-delivery';
import { useUserStore } from '@/store/modules/user';

const router = useRouter();
const userStore = useUserStore();

const isAdmin = computed(() => userStore.userInfo?.role === UserRole.ADMIN);

const loading = ref(false);
const tableData = ref<MessageDeliveryItem[]>([]);
const total = ref(0);
const selectedIds = ref<number[]>([]);
const dateRange = ref<string[]>([]);

const queryParams = reactive({
page: 1,
pageSize: 20,
businessType: '',
deliveryStatus: '',
readStatus: '',
pushChannel: '',
keyword: '',
startTime: '',
endTime: '',
sortBy: 'created_at',
sortOrder: 'DESC',
});

const stats = ref<MessageDeliveryStats>({
totalCount: 0,
successCount: 0,
failedCount: 0,
readCount: 0,
unreadCount: 0,
successRate: 0,
readRate: 0,
});

const statsList = computed(() => [
{
key: 'total',
label: '消息总数',
value: stats.value.totalCount,
icon: Bell,
color: '#409eff',
},
{
key: 'success',
label: '推送成功',
value: stats.value.successCount,
icon: CheckCircle,
color: '#67c23a',
},
{
key: 'failed',
label: '推送失败',
value: stats.value.failedCount,
icon: CircleClose,
color: '#f56c6c',
},
{
key: 'unread',
label: '未读消息',
value: stats.value.unreadCount,
icon: Bell,
color: '#e6a23c',
},
{
key: 'readRate',
label: '读取率',
value: stats.value.readRate + '%',
icon: View,
color: '#909399',
},
]);

const detailDialogVisible = ref(false);
const currentMessage = ref<MessageDeliveryItem | null>(null);

const logsDialogVisible = ref(false);
const logsList = ref<MessageDeliveryLogItem[]>([]);
const logsLoading = ref(false);
const logsPage = ref(1);
const logsPageSize = ref(10);
const logsTotal = ref(0);

const deleteConfirmVisible = ref(false);
const deleteTargetIds = ref<number[]>([]);

const tableRef = ref();

const loadData = async () => {
loading.value = true;
try {
const params = { ...queryParams };
if (dateRange.value && dateRange.value.length === 2) {
params.startTime = dateRange.value[0];
params.endTime = dateRange.value[1];
}
const res: any = await getMessageList(params);
tableData.value = res.list || [];
total.value = res.total || 0;
} catch (error: any) {
ElMessage.error(error.message || '加载消息列表失败');
} finally {
loading.value = false;
}
};

const loadStats = async () => {
try {
const res: any = await getMessageStats(30);
stats.value = res;
} catch (error: any) {
console.error('加载统计数据失败', error);
}
};

const handleSearch = () => {
queryParams.page = 1;
loadData();
};

const handleReset = () => {
queryParams.businessType = '';
queryParams.deliveryStatus = '';
queryParams.readStatus = '';
queryParams.pushChannel = '';
queryParams.keyword = '';
dateRange.value = [];
queryParams.startTime = '';
queryParams.endTime = '';
queryParams.page = 1;
loadData();
};

const handleSizeChange = (size: number) => {
queryParams.pageSize = size;
queryParams.page = 1;
loadData();
};

const handleCurrentChange = (page: number) => {
queryParams.page = page;
loadData();
};

const handleSelectionChange = (selection: any[]) => {
selectedIds.value = selection.map(item => item.id);
};

const handleRowClick = (row: MessageDeliveryItem) => {
handleViewDetail(row);
};

const tableRowClassName = ({ row }: { row: MessageDeliveryItem }) => {
if (row.readStatus === 'unread') {
return 'unread-row';
}
return '';
};

const getBusinessTypeTag = (type: MessageBusinessType) => {
const tagMap: Record<string, string> = {
[MessageBusinessType.INTERVIEW_APPOINT]: '',
[MessageBusinessType.INTERVIEW_CANCEL]: 'danger',
[MessageBusinessType.INTERVIEW_REMIND]: 'warning',
[MessageBusinessType.INTERVIEW_RESULT]: 'success',
[MessageBusinessType.INTERVIEW_STATUS_CHANGE]: 'info',
[MessageBusinessType.ONBOARD_CREATE]: 'primary',
[MessageBusinessType.ONBOARD_AUDIT]: 'warning',
[MessageBusinessType.ONBOARD_STATUS_CHANGE]: 'info',
[MessageBusinessType.APPROVAL_SUBMIT]: '',
[MessageBusinessType.APPROVAL_PASS]: 'success',
[MessageBusinessType.APPROVAL_REJECT]: 'danger',
[MessageBusinessType.PROBATION_START]: 'primary',
[MessageBusinessType.PROBATION_END]: 'success',
[MessageBusinessType.REGULARIZATION_SUBMIT]: 'warning',
[MessageBusinessType.REGULARIZATION_APPROVAL]: 'success',
[MessageBusinessType.RISK_WARNING]: 'danger',
[MessageBusinessType.SYSTEM_NOTICE]: 'info',
};
return tagMap[type] || '';
};

const formatDateTime = (dateStr: string) => {
if (!dateStr) return '-';
const date = new Date(dateStr);
return date.toLocaleString('zh-CN', {
year: 'numeric',
month: '2-digit',
day: '2-digit',
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
});
};

const handleViewDetail = async (row: MessageDeliveryItem) => {
currentMessage.value = { ...row };
detailDialogVisible.value = true;
if (row.readStatus === 'unread') {
try {
await markMessageAsRead(row.id);
row.readStatus = 'read';
loadStats();
} catch (error: any) {
console.error('标记已读失败', error);
}
}
};

const handleRetry = async (row: MessageDeliveryItem) => {
try {
await ElMessageBox.confirm('确定要重新推送这条消息吗？', '确认重发', {
confirmButtonText: '确定',
cancelButtonText: '取消',
type: 'warning',
});
await retryMessage(row.id);
ElMessage.success('重新推送成功');
loadData();
loadStats();
} catch (error: any) {
if (error !== 'cancel') {
ElMessage.error(error.message || '重发失败');
}
}
};

const handleRetryFromDetail = () => {
if (currentMessage.value) {
handleRetry(currentMessage.value);
detailDialogVisible.value = false;
}
};

const handleViewLogs = async (row: MessageDeliveryItem) => {
logsDialogVisible.value = true;
logsPage.value = 1;
loadLogs(row.id);
};

const loadLogs = async (messageId?: number) => {
if (!currentMessage.value && !messageId) return;
const id = messageId || currentMessage.value?.id;
if (!id) return;
logsLoading.value = true;
try {
const res: any = await getMessageLogs(id, logsPage.value, logsPageSize.value);
logsList.value = res.list || [];
logsTotal.value = res.total || 0;
} catch (error: any) {
ElMessage.error(error.message || '加载日志失败');
} finally {
logsLoading.value = false;
}
};

const handleDelete = (row: MessageDeliveryItem) => {
deleteTargetIds.value = [row.id];
deleteConfirmVisible.value = true;
};

const confirmDelete = async () => {
try {
if (deleteTargetIds.value.length === 1) {
await deleteMessage(deleteTargetIds.value[0]);
} else {
await batchDeleteMessages(deleteTargetIds.value);
}
ElMessage.success('删除成功');
deleteConfirmVisible.value = false;
loadData();
loadStats();
} catch (error: any) {
ElMessage.error(error.message || '删除失败');
}
};

const handleBatchRetry = async () => {
try {
await ElMessageBox.confirm(
`确定要重新推送选中的 ${selectedIds.value.length} 条消息吗？',
'批量重发',
{
confirmButtonText: '确定',
cancelButtonText: '取消',
type: 'warning',
}
);
const res: any = await batchRetryMessages(selectedIds.value);
ElMessage.success(`成功重发 ${res.successCount} 条，失败 ${res.failCount} 条');
loadData();
loadStats();
} catch (error: any) {
if (error !== 'cancel') {
ElMessage.error(error.message || '批量重发失败');
}
}
};

const handleBatchMarkRead = async () => {
try {
const res: any = await batchMarkMessagesRead(selectedIds.value);
ElMessage.success(`成功标记 ${res.successCount} 条`);
loadData();
loadStats();
} catch (error: any) {
ElMessage.error(error.message || '批量标记失败');
}
};

const handleBatchDelete = () => {
deleteTargetIds.value = [...selectedIds.value];
deleteConfirmVisible.value = true;
};

const handleBatchMarkOverdue = async () => {
try {
await ElMessageBox.confirm(
`确定要将超过 ${MESSAGE_UNREAD_OVERDUE_DAYS} 天未读的消息标记为已读吗？`,
'标记逾期未读',
{
confirmButtonText: '确定',
cancelButtonText: '取消',
type: 'warning',
}
);
const res: any = await batchMarkOverdueUnread();
ElMessage.success(`成功标记 ${res.successCount} 条逾期未读消息');
loadData();
loadStats();
} catch (error: any) {
if (error !== 'cancel') {
ElMessage.error(error.message || '操作失败');
}
}
};

const handleMarkAllRead = async () => {
try {
await ElMessageBox.confirm('确定要将所有消息标记为已读吗？', '全部已读', {
confirmButtonText: '确定',
cancelButtonText: '取消',
type: 'warning',
});
await markAllMessagesAsRead();
ElMessage.success('已全部标记为已读');
loadData();
loadStats();
} catch (error: any) {
if (error !== 'cancel') {
ElMessage.error(error.message || '操作失败');
}
}
};

const handleJumpToBusiness = () => {
if (!currentMessage.value) return;
const jumpType = currentMessage.value.jumpType;
const businessId = currentMessage.value.businessId;
const jumpMap: Record<string, string> = {
[MessageJumpType.INTERVIEW_DETAIL]: `/interview/${businessId}`,
[MessageJumpType.ONBOARD_DETAIL]: `/onboard/${businessId}`,
[MessageJumpType.APPROVAL_DETAIL]: `/approval/${businessId}`,
[MessageJumpType.PROBATION_DETAIL]: `/probation/${businessId}`,
[MessageJumpType.REGULARIZATION_DETAIL]: `/regularization/${businessId}`,
[MessageJumpType.RESUME_DETAIL]: `/resume/${businessId}`,
[MessageJumpType.JOB_DETAIL]: `/job/${businessId}`,
};
const path = jumpMap[jumpType];
if (path) {
router.push(path);
detailDialogVisible.value = false;
} else {
ElMessage.info('该消息暂不支持跳转');
}
};

onMounted(() => {
loadData();
loadStats();
});
</script>

<style scoped lang="scss">
.message-center {
  padding: 20px;
}

.stats-card {
  margin-bottom: 16px;

.stats-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  flex: 1;
  min-width: 180px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
}

.filter-card {
  margin-bottom: 16px;

.filter-form {
  .el-form-item {
    margin-bottom: 0;
    margin-right: 12px;
  }
}
}

.table-card {
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

.toolbar-left,
  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}

.message-table {
  .unread-row {
    background-color: #ecf5ff !important;
  }

  .message-title-cell {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .unread-dot {
    color: #409eff;
    font-size: 8px;
  }

  .unread-text {
    font-weight: 600;
    color: #303133;
  }

  .retry-warning {
    color: #e6a23c;
    font-weight: 600;
  }

  .abnormal-icon {
    color: #f56c6c;
    font-size: 18px;
  }
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-dialog {
  .detail-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;

    h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #303133;
    }

    .detail-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      .meta-time {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .detail-desc {
    margin-bottom: 20px;
  }

  .detail-content {
    margin-bottom: 16px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #606266;
    }

    .content-text {
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      line-height: 1.8;
      color: #303133;
    }
  }

  .detail-failed {
    margin-bottom: 16px;
  }

  .detail-jump {
    text-align: right;
  }
}

.logs-dialog {
  .logs-pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
}

.confirm-dialog {
  .confirm-content {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #606266;
  }

  .confirm-icon {
    font-size: 24px;
    color: #e6a23c;
  }
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>
