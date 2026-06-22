<template>
  <div class="ccb-business-device-workorder">
    <CcbPageHeader
      title="设备运维工单"
      description="设备运维工单全生命周期管理：创建、派单、处理、验收一体化流程"
      icon="Tickets"
    />

    <el-row :gutter="16" class="mb15">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card card-pending">
          <div class="stat-card-header">
            <span class="stat-label">待派单数</span>
            <el-icon class="stat-icon warning-icon"><Clock /></el-icon>
          </div>
          <div class="stat-value-row">
            <span class="stat-number text-warning">{{ statistics.pending_count || 0 }}</span>
            <span v-if="statistics.today_created_count > 0" class="today-badge">
              今日 +{{ statistics.today_created_count }}
            </span>
          </div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            <span>紧急工单：{{ urgentCount }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">处理中</span>
            <el-icon class="stat-icon primary-icon"><Loading /></el-icon>
          </div>
          <div class="stat-value-row">
            <span class="stat-number text-primary">{{ statistics.processing_count || 0 }}</span>
          </div>
          <div class="stat-progress">
            <el-progress
              :percentage="processingProgress"
              :stroke-width="6"
              color="#409eff"
              show-text="false"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">待验收</span>
            <el-icon class="stat-icon warning-icon"><CircleCheck /></el-icon>
          </div>
          <div class="stat-value-row">
            <span class="stat-number text-warning">{{ statistics.acceptance_count || 0 }}</span>
          </div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            <span>平均处理：{{ statistics.avg_processing_hours || 0 }}小时</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">已完成 / 超时</span>
            <el-icon class="stat-icon success-icon"><Finished /></el-icon>
          </div>
          <div class="stat-value-row">
            <span class="stat-number text-success">{{ statistics.completed_count || 0 }}</span>
            <span class="overdue-badge" v-if="statistics.overdue_count > 0">
              超时 {{ statistics.overdue_count }}
            </span>
          </div>
          <div class="stat-trend">
            <el-icon><TrendCharts /></el-icon>
            <span>今日完成：{{ statistics.today_completed_count || 0 }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键字" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="工单编号/档案号/SN码/故障描述" clearable />
      </el-form-item>
      <el-form-item label="工单类型" prop="order_type">
        <el-select v-model="searchForm.order_type" placeholder="请选择" clearable>
          <el-option v-for="item in WORK_ORDER_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="工单状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择" clearable>
          <el-option v-for="item in WORK_ORDER_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="运维等级" prop="maintenance_level">
        <el-select v-model="searchForm.maintenance_level" placeholder="请选择" clearable>
          <el-option v-for="item in MAINTENANCE_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="验收状态" prop="acceptance_status">
        <el-select v-model="searchForm.acceptance_status" placeholder="请选择" clearable>
          <el-option v-for="item in ACCEPTANCE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理人" prop="assignee_id">
        <el-input v-model="searchForm.assignee_id" placeholder="处理人ID/姓名" clearable />
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="searchForm.priority" placeholder="请选择" clearable>
          <el-option v-for="item in PRIORITY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否超时" prop="is_overdue">
        <el-select v-model="searchForm.is_overdue" placeholder="请选择" clearable>
          <el-option label="是" :value="1" />
          <el-option label="否" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围" prop="timeRange">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 280px"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog" v-permission="'business:device-workorder:create'">
          创建工单
        </el-button>
        <el-button type="warning" :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button type="success" :icon="Download" @click="handleExport" v-permission="'business:device-workorder:export'">
          导出
        </el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          共 <el-text type="primary" size="large">{{ total }}</el-text> 条记录
        </el-text>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      :row-class-name="getRowClassName"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="order_no" label="工单编号" width="180" show-overflow-tooltip />
      <el-table-column label="档案编号/SN码" width="260">
        <template #default="{ row }">
          <div class="device-sn-cell">
            <div class="archive-no">{{ row.archive_no }}</div>
            <div class="sn-code text-info">{{ row.sn_code }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="device_type_text" label="设备类型" width="110" />
      <el-table-column label="工单类型" width="110">
        <template #default="{ row }">
          <el-tag :type="getOrderType(row.order_type)" effect="light" size="small">
            {{ row.order_type_text || getOrderTypeLabel(row.order_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="运维等级" width="90">
        <template #default="{ row }">
          <el-tag :type="getLevelType(row.maintenance_level)" effect="light" size="small">
            {{ row.maintenance_level_text || getLevelLabel(row.maintenance_level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="getStatusType(row.status)"
            effect="light"
            size="small"
            :class="{ 'pulse-tag': row.status === 1 || row.status === 3 }"
          >
            {{ row.status_text || getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="优先级" width="80">
        <template #default="{ row }">
          <el-tag :type="getPriorityType(row.priority)" effect="light" size="small">
            {{ row.priority_text || getPriorityLabel(row.priority) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fault_description" label="故障描述" min-width="160" show-overflow-tooltip />
      <el-table-column prop="assignee_name" label="处理人" width="100" show-overflow-tooltip />
      <el-table-column label="验收状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getAcceptanceType(row.acceptance_status)" effect="light" size="small">
            {{ row.acceptance_status_text || getAcceptanceLabel(row.acceptance_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="预计/实际完成" width="180">
        <template #default="{ row }">
          <div class="time-cell">
            <div class="expected-time">
              <span class="time-label">预计：</span>
              <span>{{ row.expected_finish_time || '-' }}</span>
            </div>
            <div class="actual-time" v-if="row.actual_finish_time">
              <span class="time-label">实际：</span>
              <span class="text-success">{{ row.actual_finish_time }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="170" />
      <el-table-column label="是否超时" width="80" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.is_overdue === 1" type="danger" effect="dark" size="small">超时</el-tag>
          <span v-else class="text-placeholder">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 0 || row.status === 1"
            type="warning" link size="small"
            @click="openAssignDialog(row)"
            v-permission="'business:device-workorder:assign'"
          >派单</el-button>
          <el-button
            v-if="row.status === 2"
            type="primary" link size="small"
            @click="handleStartProcess(row)"
            v-permission="'business:device-workorder:process'"
          >开始处理</el-button>
          <el-button
            v-if="row.status === 3"
            type="success" link size="small"
            @click="openSubmitAcceptance(row)"
            v-permission="'business:device-workorder:submit-acceptance'"
          >提交验收</el-button>
          <el-button
            v-if="row.status === 4"
            type="success" link size="small"
            @click="openAcceptanceDialog(row)"
            v-permission="'business:device-workorder:acceptance'"
          >验收</el-button>
          <el-button
            v-if="row.status !== 5 && row.status !== 6"
            type="danger" link size="small"
            @click="handleCancel(row)"
            v-permission="'business:device-workorder:cancel'"
          >取消</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="showDetail"
      title="工单详情"
      width="820px"
      class="detail-dialog"
      destroy-on-close
    >
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border class="mb20">
          <el-descriptions-item label="工单编号">{{ currentDetail.order_no }}</el-descriptions-item>
          <el-descriptions-item label="工单类型">
            <el-tag :type="getOrderType(currentDetail.order_type)" effect="light" size="small">
              {{ currentDetail.order_type_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="档案编号">{{ currentDetail.archive_no }}</el-descriptions-item>
          <el-descriptions-item label="SN码">{{ currentDetail.sn_code }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ currentDetail.device_type_text }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ currentDetail.device_model }}</el-descriptions-item>
          <el-descriptions-item label="运维等级">
            <el-tag :type="getLevelType(currentDetail.maintenance_level)" effect="light" size="small">
              {{ currentDetail.maintenance_level_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(currentDetail.priority)" effect="light" size="small">
              {{ currentDetail.priority_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="工单状态">
            <el-tag :type="getStatusType(currentDetail.status)" effect="light" size="small">
              {{ currentDetail.status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="验收状态">
            <el-tag :type="getAcceptanceType(currentDetail.acceptance_status)" effect="light" size="small">
              {{ currentDetail.acceptance_status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="保修状态">
            <el-tag :type="getWarrantyType(currentDetail.warranty_status)" effect="light" size="small">
              {{ currentDetail.warranty_status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentDetail.assignee_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="归属网点">{{ currentDetail.org_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="安装位置">{{ currentDetail.install_location || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentDetail.creator_name }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentDetail.created_at }}</el-descriptions-item>
          <el-descriptions-item label="预计完成时间" :span="2">{{ currentDetail.expected_finish_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际完成时间" :span="2">{{ currentDetail.actual_finish_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="费用预估" :span="2">{{ currentDetail.cost_estimate ? '¥' + currentDetail.cost_estimate : '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际费用" :span="2">{{ currentDetail.cost_actual ? '¥' + currentDetail.cost_actual : '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4 class="section-title">工单流程</h4>
          <el-steps :active="getActiveStep(currentDetail.status)" finish-status="success" align-center class="mb15">
            <el-step title="草稿" description="创建" />
            <el-step title="待派单" description="分配处理人" />
            <el-step title="已派单" description="等待开始" />
            <el-step title="处理中" description="运维处理" />
            <el-step title="待验收" description="提交验收" />
            <el-step title="已完成" description="验收通过" />
          </el-steps>
        </div>

        <div class="detail-section">
          <h4 class="section-title">故障与处理信息</h4>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="故障描述">{{ currentDetail.fault_description || '-' }}</el-descriptions-item>
            <el-descriptions-item label="故障代码">{{ currentDetail.fault_code || '-' }}</el-descriptions-item>
            <el-descriptions-item label="维护内容">{{ currentDetail.maintenance_content || '-' }}</el-descriptions-item>
            <el-descriptions-item label="维护结果">{{ currentDetail.maintenance_result || '-' }}</el-descriptions-item>
            <el-descriptions-item label="使用配件">{{ currentDetail.used_parts || '-' }}</el-descriptions-item>
            <el-descriptions-item label="维护工时">{{ currentDetail.maintenance_hours ? currentDetail.maintenance_hours + ' 小时' : '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section" v-if="currentDetail.status >= 4">
          <h4 class="section-title">验收信息</h4>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="验收人">{{ currentDetail.acceptance_by_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="验收时间">{{ currentDetail.acceptance_time || '-' }}</el-descriptions-item>
            <el-descriptions-item label="验收备注">{{ currentDetail.acceptance_remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4 class="section-title">操作日志</h4>
          <el-table :data="orderLogs" size="small" border>
            <el-table-column prop="log_type_text" label="操作类型" width="110" />
            <el-table-column prop="before_status_text" label="变更前" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.before_status !== undefined && row.before_status !== null" type="info" effect="light" size="small">
                  {{ row.before_status_text }}
                </el-tag>
                <span v-else class="text-placeholder">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="after_status_text" label="变更后" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.after_status as WorkOrderStatus)" effect="light" size="small">
                  {{ row.after_status_text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operation_detail" label="操作详情" show-overflow-tooltip />
            <el-table-column prop="operator_name" label="操作人" width="100" />
            <el-table-column prop="created_at" label="时间" width="170" />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="showCreateDialog"
      title="创建工单"
      width="620px"
      class="create-dialog"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="100px" ref="createFormRef">
        <el-form-item label="档案编号" required>
          <el-input v-model="createForm.archive_no" placeholder="请输入档案编号" />
        </el-form-item>
        <el-form-item label="SN码" required>
          <el-input v-model="createForm.sn_code" placeholder="请输入SN码" />
        </el-form-item>
        <el-form-item label="设备类型" required>
          <el-select v-model="createForm.device_type" placeholder="请选择设备类型" style="width: 100%">
            <el-option v-for="item in DEVICE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单类型" required>
          <el-select v-model="createForm.order_type" placeholder="请选择工单类型" style="width: 100%">
            <el-option v-for="item in WORK_ORDER_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="运维等级">
          <el-select v-model="createForm.maintenance_level" placeholder="请选择运维等级" style="width: 100%">
            <el-option v-for="item in MAINTENANCE_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="createForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option v-for="item in PRIORITY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input v-model="createForm.fault_description" type="textarea" :rows="3" placeholder="请输入故障描述" />
        </el-form-item>
        <el-form-item label="故障代码">
          <el-input v-model="createForm.fault_code" placeholder="请输入故障代码" />
        </el-form-item>
        <el-form-item label="预计完成时间">
          <el-date-picker
            v-model="createForm.expected_finish_time"
            type="datetime"
            placeholder="请选择预计完成时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="createForm.assignee_id" placeholder="请输入处理人ID" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="submitCreate">确认创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showAssignDialog"
      title="工单派单"
      width="480px"
      class="assign-dialog"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="工单编号">
          <el-text>{{ currentAssignOrder?.order_no }}</el-text>
        </el-form-item>
        <el-form-item label="处理人" required>
          <el-input v-model="assignForm.assignee_id" placeholder="请输入处理人ID" />
        </el-form-item>
        <el-form-item label="派单备注">
          <el-input v-model="assignForm.remark" type="textarea" :rows="3" placeholder="请输入派单备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" :loading="assignLoading" @click="submitAssign">确认派单</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showSubmitAcceptance"
      title="提交验收"
      width="560px"
      class="submit-dialog"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="submitForm" label-width="100px">
        <el-form-item label="工单编号">
          <el-text>{{ currentProcessOrder?.order_no }}</el-text>
        </el-form-item>
        <el-form-item label="维护内容" required>
          <el-input v-model="submitForm.maintenance_content" type="textarea" :rows="3" placeholder="请输入维护内容" />
        </el-form-item>
        <el-form-item label="维护结果" required>
          <el-input v-model="submitForm.maintenance_result" type="textarea" :rows="3" placeholder="请输入维护结果" />
        </el-form-item>
        <el-form-item label="使用配件">
          <el-input v-model="submitForm.used_parts" placeholder="请输入使用配件" />
        </el-form-item>
        <el-form-item label="维护工时">
          <el-input-number v-model="submitForm.maintenance_hours" :min="0" :precision="1" :step="0.5" />
        </el-form-item>
        <el-form-item label="实际费用">
          <el-input-number v-model="submitForm.cost_actual" :min="0" :precision="2" :step="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSubmitAcceptance = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitAcceptance">提交验收</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showAcceptanceDialog"
      title="工单验收"
      width="520px"
      class="acceptance-dialog"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="acceptanceForm" label-width="100px">
        <el-form-item label="工单编号">
          <el-text>{{ currentAcceptOrder?.order_no }}</el-text>
        </el-form-item>
        <el-form-item label="验收结果" required>
          <el-radio-group v-model="acceptanceForm.acceptance_status">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="验收备注" required>
          <el-input v-model="acceptanceForm.acceptance_remark" type="textarea" :rows="4" placeholder="请输入验收备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAcceptanceDialog = false">取消</el-button>
        <el-button type="primary" :loading="acceptanceLoading" @click="submitAcceptanceResult">确认验收</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Tickets,
  Clock,
  Loading,
  CircleCheck,
  Finished,
  TrendCharts,
  Plus,
  Refresh,
  Download
} from '@element-plus/icons-vue'
import { DEVICE_TYPE_OPTIONS } from '@api/deviceArchive'
import {
  WORK_ORDER_TYPE_OPTIONS,
  WORK_ORDER_STATUS_OPTIONS,
  MAINTENANCE_LEVEL_OPTIONS,
  ACCEPTANCE_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  WARRANTY_STATUS_OPTIONS,
  WORK_ORDER_LOG_TYPE_OPTIONS,
  type DeviceWorkOrderVO,
  type WorkOrderQueryParams,
  type WorkOrderStatistics,
  type WorkOrderType,
  type WorkOrderStatus,
  type MaintenanceLevel,
  type AcceptanceStatus,
  type DeviceWorkOrderLogVO,
  type CreateWorkOrderRequest,
  type UpdateWorkOrderRequest,
  getWorkOrderListApi,
  getWorkOrderStatisticsApi,
  getWorkOrderDetailApi,
  createWorkOrderApi,
  updateWorkOrderApi,
  getWorkOrderLogListApi
} from '@api/deviceWorkOrder'

const loading = ref(false)
const createLoading = ref(false)
const assignLoading = ref(false)
const submitLoading = ref(false)
const acceptanceLoading = ref(false)

const showDetail = ref(false)
const showCreateDialog = ref(false)
const showAssignDialog = ref(false)
const showSubmitAcceptance = ref(false)
const showAcceptanceDialog = ref(false)

const currentDetail = ref<DeviceWorkOrderVO | null>(null)
const currentAssignOrder = ref<DeviceWorkOrderVO | null>(null)
const currentProcessOrder = ref<DeviceWorkOrderVO | null>(null)
const currentAcceptOrder = ref<DeviceWorkOrderVO | null>(null)

const tableData = ref<DeviceWorkOrderVO[]>([])
const total = ref(0)
const selection = ref<DeviceWorkOrderVO[]>([])
const orderLogs = ref<DeviceWorkOrderLogVO[]>([])

const statistics = reactive<WorkOrderStatistics>({
  total_count: 0,
  pending_count: 0,
  processing_count: 0,
  acceptance_count: 0,
  completed_count: 0,
  cancelled_count: 0,
  overdue_count: 0,
  today_created_count: 0,
  today_completed_count: 0,
  avg_processing_hours: 0,
  monthly_cost: 0,
  type_distribution: {}
})

const dateRange = ref<string[]>([])

const searchForm = reactive<WorkOrderQueryParams & { keyword?: string }>({
  page: 1,
  pageSize: 10,
  keyword: '',
  device_type: undefined,
  order_type: undefined,
  status: undefined,
  maintenance_level: undefined,
  acceptance_status: undefined,
  assignee_id: undefined,
  priority: undefined,
  is_overdue: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const createFormRef = ref()
const createForm = reactive<CreateWorkOrderRequest>({
  archive_no: '',
  sn_code: '',
  device_type: 1,
  order_type: 1,
  maintenance_level: undefined,
  fault_description: '',
  fault_code: '',
  expected_finish_time: '',
  assignee_id: '',
  priority: 2,
  remark: ''
})

const assignForm = reactive({
  assignee_id: '',
  remark: ''
})

const submitForm = reactive({
  maintenance_content: '',
  maintenance_result: '',
  used_parts: '',
  maintenance_hours: 0,
  cost_actual: 0
})

const acceptanceForm = reactive<{ acceptance_status: AcceptanceStatus | undefined; acceptance_remark: string }>({
  acceptance_status: undefined,
  acceptance_remark: ''
})

const urgentCount = computed(() => {
  return tableData.value.filter(r => r.priority === 4 && (r.status === 1 || r.status === 2 || r.status === 3)).length
})

const processingProgress = computed(() => {
  if (!statistics.total_count) return 0
  return Math.round((statistics.processing_count / statistics.total_count) * 100)
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: WorkOrderQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      start_time: dateRange.value?.[0],
      end_time: dateRange.value?.[1]
    }
    const res = await getWorkOrderListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch work order list:', e)
  } finally {
    loading.value = false
  }
}

const fetchStatistics = async () => {
  try {
    const res = await getWorkOrderStatisticsApi()
    Object.assign(statistics, res.data)
  } catch (e) {
    console.error('Failed to fetch work order statistics:', e)
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.device_type = undefined
  searchForm.order_type = undefined
  searchForm.status = undefined
  searchForm.maintenance_level = undefined
  searchForm.acceptance_status = undefined
  searchForm.assignee_id = undefined
  searchForm.priority = undefined
  searchForm.is_overdue = undefined
  dateRange.value = []
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (val: DeviceWorkOrderVO[]) => {
  selection.value = val
}

const getRowClassName = ({ row }: { row: DeviceWorkOrderVO }) => {
  if (row.is_overdue === 1) {
    return 'overdue-row'
  }
  if (row.priority === 4 && row.status < 5) {
    return 'urgent-row'
  }
  return ''
}

const getOrderType = (type: WorkOrderType) => {
  const opt = WORK_ORDER_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.type || 'info'
}

const getOrderTypeLabel = (type: WorkOrderType) => {
  const opt = WORK_ORDER_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.label || '未知'
}

const getLevelType = (level: MaintenanceLevel) => {
  const opt = MAINTENANCE_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.type || 'info'
}

const getLevelLabel = (level: MaintenanceLevel) => {
  const opt = MAINTENANCE_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.label || '未知'
}

const getStatusType = (status: WorkOrderStatus) => {
  const opt = WORK_ORDER_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || 'info'
}

const getStatusLabel = (status: WorkOrderStatus) => {
  const opt = WORK_ORDER_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getPriorityType = (priority: number) => {
  const opt = PRIORITY_OPTIONS.find(o => o.value === priority)
  return opt?.type || 'info'
}

const getPriorityLabel = (priority: number) => {
  const opt = PRIORITY_OPTIONS.find(o => o.value === priority)
  return opt?.label || '未知'
}

const getAcceptanceType = (status: AcceptanceStatus) => {
  const opt = ACCEPTANCE_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || 'info'
}

const getAcceptanceLabel = (status: AcceptanceStatus) => {
  const opt = ACCEPTANCE_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getWarrantyType = (status: number) => {
  const opt = WARRANTY_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || 'info'
}

const getActiveStep = (status: WorkOrderStatus) => {
  if (status === 6) return 0
  if (status === 5) return 5
  return status
}

const refreshData = () => {
  fetchData()
  fetchStatistics()
  ElMessage.success('数据已刷新')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

const handleDetail = async (row: DeviceWorkOrderVO) => {
  try {
    const res = await getWorkOrderDetailApi(row.id)
    currentDetail.value = res.data
    showDetail.value = true
    fetchOrderLogs(row.id)
  } catch (e) {
    console.error('Failed to fetch work order detail:', e)
  }
}

const fetchOrderLogs = async (orderId: string) => {
  try {
    const res = await getWorkOrderLogListApi({
      page: 1,
      pageSize: 20,
      order_id: orderId
    })
    orderLogs.value = res.data.list
  } catch (e) {
    console.error('Failed to fetch order logs:', e)
  }
}

const openCreateDialog = () => {
  Object.assign(createForm, {
    archive_no: '',
    sn_code: '',
    device_type: 1,
    order_type: 1,
    maintenance_level: undefined,
    fault_description: '',
    fault_code: '',
    expected_finish_time: '',
    assignee_id: '',
    priority: 2,
    remark: ''
  })
  showCreateDialog.value = true
}

const submitCreate = async () => {
  if (!createForm.archive_no || !createForm.sn_code) {
    ElMessage.warning('请填写档案编号和SN码')
    return
  }
  createLoading.value = true
  try {
    await createWorkOrderApi(createForm)
    ElMessage.success('工单创建成功')
    showCreateDialog.value = false
    fetchData()
    fetchStatistics()
  } catch (e) {
    console.error('Failed to create work order:', e)
  } finally {
    createLoading.value = false
  }
}

const openAssignDialog = (row: DeviceWorkOrderVO) => {
  currentAssignOrder.value = row
  assignForm.assignee_id = row.assignee_id || ''
  assignForm.remark = ''
  showAssignDialog.value = true
}

const submitAssign = async () => {
  if (!currentAssignOrder.value || !assignForm.assignee_id) {
    ElMessage.warning('请填写处理人')
    return
  }
  assignLoading.value = true
  try {
    await updateWorkOrderApi(
      currentAssignOrder.value.id,
      2 as WorkOrderStatus,
      {
        assignee_id: assignForm.assignee_id,
        remark: assignForm.remark
      }
    )
    ElMessage.success('派单成功')
    showAssignDialog.value = false
    fetchData()
    fetchStatistics()
  } catch (e) {
    console.error('Failed to assign work order:', e)
  } finally {
    assignLoading.value = false
  }
}

const handleStartProcess = async (row: DeviceWorkOrderVO) => {
  try {
    await ElMessageBox.confirm(
      `确认开始处理工单 ${row.order_no}？`,
      '确认开始',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
    await updateWorkOrderApi(row.id, 3 as WorkOrderStatus)
    ElMessage.success('已开始处理')
    fetchData()
    fetchStatistics()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to start process:', e)
    }
  }
}

const openSubmitAcceptance = (row: DeviceWorkOrderVO) => {
  currentProcessOrder.value = row
  submitForm.maintenance_content = ''
  submitForm.maintenance_result = ''
  submitForm.used_parts = ''
  submitForm.maintenance_hours = 0
  submitForm.cost_actual = 0
  showSubmitAcceptance.value = true
}

const submitAcceptance = async () => {
  if (!currentProcessOrder.value || !submitForm.maintenance_content || !submitForm.maintenance_result) {
    ElMessage.warning('请填写维护内容和维护结果')
    return
  }
  submitLoading.value = true
  try {
    await updateWorkOrderApi(
      currentProcessOrder.value.id,
      4 as WorkOrderStatus,
      {
        maintenance_content: submitForm.maintenance_content,
        maintenance_result: submitForm.maintenance_result,
        used_parts: submitForm.used_parts || undefined,
        maintenance_hours: submitForm.maintenance_hours || undefined,
        cost_actual: submitForm.cost_actual || undefined
      }
    )
    ElMessage.success('已提交验收')
    showSubmitAcceptance.value = false
    fetchData()
    fetchStatistics()
  } catch (e) {
    console.error('Failed to submit acceptance:', e)
  } finally {
    submitLoading.value = false
  }
}

const openAcceptanceDialog = (row: DeviceWorkOrderVO) => {
  currentAcceptOrder.value = row
  acceptanceForm.acceptance_status = undefined
  acceptanceForm.acceptance_remark = ''
  showAcceptanceDialog.value = true
}

const submitAcceptanceResult = async () => {
  if (!currentAcceptOrder.value || acceptanceForm.acceptance_status === undefined) {
    ElMessage.warning('请选择验收结果')
    return
  }
  if (!acceptanceForm.acceptance_remark) {
    ElMessage.warning('请填写验收备注')
    return
  }
  acceptanceLoading.value = true
  try {
    const targetStatus = acceptanceForm.acceptance_status === 1 ? 5 : 3
    await updateWorkOrderApi(
      currentAcceptOrder.value.id,
      targetStatus as WorkOrderStatus,
      {
        acceptance_status: acceptanceForm.acceptance_status,
        acceptance_remark: acceptanceForm.acceptance_remark
      }
    )
    ElMessage.success(acceptanceForm.acceptance_status === 1 ? '验收通过' : '验收不通过，已退回处理')
    showAcceptanceDialog.value = false
    fetchData()
    fetchStatistics()
  } catch (e) {
    console.error('Failed to submit acceptance result:', e)
  } finally {
    acceptanceLoading.value = false
  }
}

const handleCancel = async (row: DeviceWorkOrderVO) => {
  try {
    await ElMessageBox.confirm(
      `确认取消工单 ${row.order_no}？此操作不可撤销`,
      '确认取消',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
    await updateWorkOrderApi(row.id, 6 as WorkOrderStatus)
    ElMessage.success('工单已取消')
    fetchData()
    fetchStatistics()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to cancel work order:', e)
    }
  }
}

onMounted(() => {
  fetchData()
  fetchStatistics()
})
</script>

<style scoped>
.ccb-business-device-workorder {
  padding: 16px;
}

.stat-card {
  height: 100%;
}

.card-pending {
  border-left: 4px solid #e6a23c;
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.stat-icon {
  font-size: 22px;
}

.warning-icon {
  color: #e6a23c;
}

.primary-icon {
  color: #409eff;
}

.success-icon {
  color: #67c23a;
}

.danger-icon {
  color: #f56c6c;
}

.stat-value-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.text-warning {
  color: #e6a23c;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.text-info {
  color: #909399;
}

.text-placeholder {
  color: #c0c4cc;
}

.today-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #fdf6ec;
  color: #e6a23c;
  font-size: 12px;
  border-radius: 10px;
  font-weight: 500;
}

.overdue-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #fef0f0;
  color: #f56c6c;
  font-size: 12px;
  border-radius: 10px;
  font-weight: 500;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.stat-progress {
  margin-top: 8px;
}

.device-sn-cell {
  line-height: 1.5;
}

.archive-no {
  font-weight: 500;
  color: #303133;
}

.sn-code {
  font-size: 12px;
}

.time-cell {
  line-height: 1.6;
  font-size: 12px;
}

.time-label {
  color: #909399;
}

.actual-time {
  color: #606266;
}

.overdue-row {
  background-color: #fef0f0 !important;
}

.overdue-row:hover > td {
  background-color: #fde2e2 !important;
}

.urgent-row {
  background-color: #fdf6ec !important;
}

.urgent-row:hover > td {
  background-color: #faecd8 !important;
}

.pulse-tag {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.ccb-table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ccb-table-toolbar-left {
  display: flex;
  gap: 8px;
}

.ccb-table-toolbar-right {
  display: flex;
  align-items: center;
}

.detail-content {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.mb15 {
  margin-bottom: 15px;
}

.mb20 {
  margin-bottom: 20px;
}

.detail-dialog :deep(.el-dialog__body) {
  max-height: 65vh;
  overflow-y: auto;
}
</style>
