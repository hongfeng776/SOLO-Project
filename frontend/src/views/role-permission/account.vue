<template>
  <div class="account-perm-page">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="用户名/UID/昵称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in AccountStatusOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色类型">
          <el-select v-model="filterForm.role" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in RoleTypeOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchAccounts">搜索</el-button>
          <el-button :icon="Refresh" @click="handleResetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card card-wrapper">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAssignOpen">分配权限</el-button>
          <el-button type="warning" :icon="UserFilled" :disabled="selectedAccounts.length === 0" @click="handleBatchAssignOpen">批量分配</el-button>
          <el-button type="info" :icon="DataAnalysis" @click="handleTraceOpen">溯源校验</el-button>
        </div>
      </div>

      <DataTable
        :data="accountList"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        show-selection
        @selection-change="handleAccountSelection"
        @refresh="fetchAccounts"
      >
        <el-table-column prop="id" label="ID" width="65" align="center" />
        <el-table-column prop="uid" label="UID" width="130" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" width="110" />
        <el-table-column prop="nickname" label="昵称" width="100" />
        <el-table-column label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="AccountStatusTagType[row.status]" size="small">
              {{ AccountStatusLabel[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核心角色" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.coreRoleName" type="primary" size="small" effect="dark">{{ row.coreRoleName }}</el-tag>
            <span v-else class="text-muted">未绑定</span>
          </template>
        </el-table-column>
        <el-table-column label="附属权限" width="85" align="center">
          <template #default="{ row }">{{ row.auxPermCount }}</template>
        </el-table-column>
        <el-table-column label="总权限数" width="85" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.allPermCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleAdjustOpen(row)">调整权限</el-button>
            <el-button type="success" link size="small" @click="handleViewDetail(row)">查看详情</el-button>
            <el-button type="info" link size="small" @click="handleTraceOne(row)">溯源</el-button>
            <el-button type="warning" link size="small" @click="handleCleanup(row)">清理冗余</el-button>
          </template>
        </el-table-column>
      </DataTable>
    </div>

    <el-dialog v-model="assignDialogVisible" title="分配账号权限" width="720px" @closed="handleAssignClosed" class="assign-dialog">
      <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-width="100px">
        <el-form-item label="选择账号" prop="userId">
          <el-select
            v-model="assignForm.userId"
            placeholder="搜索用户名/UID"
            filterable
            remote
            :remote-method="handleUserSearch"
            :loading="userSearchLoading"
            style="width: 100%"
            class="glow-select"
          >
            <el-option v-for="u in userSearchResults" :key="u.id" :label="`${u.username} (${u.uid})`" :value="u.id">
              <span>{{ u.username }}</span>
              <span class="search-uid">{{ u.uid }}</span>
              <el-tag :type="AccountStatusTagType[u.status]" size="small" style="margin-left:8px">{{ AccountStatusLabel[u.status] }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="assignForm.userId && !accountStatusValid" label="">
          <el-alert type="error" :closable="false" show-icon :title="accountStatusReason" class="shake-alert" />
        </el-form-item>
        <el-form-item label="绑定核心角色" prop="roleId">
          <el-select v-model="assignForm.roleId" placeholder="选择核心角色(可选)" clearable style="width: 100%" @change="handleAssignRoleChange">
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
          <div v-if="roleMatchResult && !roleMatchResult.matched" class="field-error">
            角色权限匹配度: {{ roleMatchResult.matchScore }}%，存在{{ roleMatchResult.mismatchCount }}个不匹配
          </div>
        </el-form-item>
        <el-form-item label="附属权限">
          <div class="perm-tree-container">
            <el-alert v-if="stackConflicts.length" type="error" :closable="false" class="shake-alert perm-alert">
              <template v-for="conflict in stackConflicts" :key="conflict.mutexGroup">
                <div>{{ conflict.description }}</div>
              </template>
            </el-alert>
            <el-tree
              ref="assignPermTreeRef"
              :data="permissionTree"
              show-checkbox
              node-key="id"
              :default-checked-keys="assignForm.permissionIds"
              :props="{ children: 'children', label: 'name' }"
              @check="handleAssignPermCheck"
              class="perm-tree"
            >
              <template #default="{ data }">
                <span class="perm-tree-node" :class="{ 'conflict-node': isConflictPerm(data.id) }">
                  <span>{{ data.name }}</span>
                  <el-tag v-if="data.isCore" size="small" type="danger" effect="dark" class="core-tag">核心</el-tag>
                  <el-tag :type="PermMenuLevelTagType[data.level]" size="small" class="level-tag">
                    {{ PermMenuLevelLabel[data.level] }}
                  </el-tag>
                  <span v-if="data.mutexGroup" class="mutex-badge">互斥</span>
                  <span v-if="isConflictPerm(data.id)" class="conflict-badge">冲突</span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="!accountStatusValid || stackConflicts.length > 0" @click="handleAssignSubmit" class="ripple-btn">确认分配</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustDialogVisible" :title="'调整权限 - ' + (adjustUser?.username || '')" width="780px" @closed="handleAdjustClosed" class="adjust-dialog">
      <div class="adjust-steps">
        <div class="step-indicator" :class="{ active: adjustStep === 1, completed: adjustStep > 1 }" @click="adjustStep = 1">
          <span class="step-num">1</span>
          <span class="step-label">角色调整</span>
        </div>
        <div class="step-line" :class="{ active: adjustStep > 1 }"></div>
        <div class="step-indicator" :class="{ active: adjustStep === 2 }">
          <span class="step-num">2</span>
          <span class="step-label">权限调整</span>
        </div>
      </div>

      <div v-show="adjustStep === 1" class="step-panel">
        <el-form label-width="100px">
          <el-form-item label="当前核心角色">
            <el-tag v-if="adjustDetail?.coreRole" type="primary" effect="dark">{{ adjustDetail.coreRole.name }}</el-tag>
            <span v-else class="text-muted">未绑定核心角色</span>
          </el-form-item>
          <el-form-item label="调整核心角色">
            <el-select v-model="adjustForm.roleId" placeholder="选择核心角色" clearable style="width: 100%">
              <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-show="adjustStep === 2" class="step-panel">
        <el-alert v-if="adjustStackConflicts.length" type="error" :closable="false" class="shake-alert perm-alert">
          <template v-for="conflict in adjustStackConflicts" :key="conflict.mutexGroup">
            <div>{{ conflict.description }}</div>
          </template>
        </el-alert>
        <div class="perm-tree-container">
          <el-tree
            ref="adjustPermTreeRef"
            :data="permissionTree"
            show-checkbox
            node-key="id"
            :default-checked-keys="adjustForm.addPermissionIds"
            :props="{ children: 'children', label: 'name' }"
            @check="handleAdjustPermCheck"
            class="perm-tree"
          >
            <template #default="{ data }">
              <span class="perm-tree-node" :class="{ 'conflict-node': isAdjustConflictPerm(data.id) }">
                <span>{{ data.name }}</span>
                <el-tag v-if="data.isCore" size="small" type="danger" effect="dark" class="core-tag">核心</el-tag>
                <el-tag :type="PermMenuLevelTagType[data.level]" size="small" class="level-tag">
                  {{ PermMenuLevelLabel[data.level] }}
                </el-tag>
                <span v-if="isAdjustConflictPerm(data.id)" class="conflict-badge">冲突</span>
              </span>
            </template>
          </el-tree>
        </div>
        <el-form label-width="100px" style="margin-top: 12px;">
          <el-form-item label="变更原因">
            <el-input v-model="adjustForm.reason" type="textarea" :rows="2" placeholder="请填写变更原因" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="adjust-dialog-footer">
          <el-button v-if="adjustStep > 1" @click="adjustStep--">上一步</el-button>
          <el-button v-if="adjustStep < 2" type="primary" @click="adjustStep++">下一步</el-button>
          <el-button v-if="adjustStep === 2" type="primary" :loading="submitLoading" :disabled="adjustStackConflicts.length > 0" @click="handleAdjustSubmit" class="ripple-btn">
            确认修改
          </el-button>
          <el-button @click="adjustDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" :title="'账号权限详情 - ' + (detailData?.username || '')" width="800px" class="detail-dialog">
      <div v-if="detailLoading" v-loading="true" style="min-height: 200px"></div>
      <div v-else-if="detailData">
        <el-descriptions title="账号信息" :column="2" border size="small" class="detail-desc">
          <el-descriptions-item label="UID">{{ detailData.uid }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ detailData.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detailData.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="AccountStatusTagType[detailData.status]" size="small">{{ AccountStatusLabel[detailData.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="核心角色">
            <el-tag v-if="detailData.coreRole" type="primary" effect="dark">{{ detailData.coreRole.name }}</el-tag>
            <span v-else>未绑定</span>
          </el-descriptions-item>
          <el-descriptions-item label="有效权限数">{{ detailData.effectivePermCount }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title">附属权限 ({{ detailData.auxPermissions?.length || 0 }}项)</h4>
        <el-table :data="detailData.auxPermissions" max-height="300" size="small" class="detail-perm-table">
          <el-table-column label="权限名称" width="140">
            <template #default="{ row }">{{ row.permission?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="权限编码" width="160">
            <template #default="{ row }">{{ row.permission?.code || '-' }}</template>
          </el-table-column>
          <el-table-column label="层级" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.permission" :type="PermMenuLevelTagType[row.permission.level]" size="small">
                {{ PermMenuLevelLabel[row.permission.level] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.source === 'role' ? 'primary' : row.source === 'batch' ? 'warning' : 'success'">
                {{ BindingSourceLabel[row.source] || row.source }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="核心" width="60" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.permission?.isCore" type="danger" size="small">核心</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量账号权限分配" width="600px" @closed="handleBatchClosed" class="batch-dialog">
      <el-alert title="系统将自动过滤封禁、冻结等异常状态账号，仅对合规账号生效" type="warning" :closable="false" show-icon class="batch-alert" />
      <div class="batch-selected-info">
        已选择 <em>{{ selectedAccounts.length }}</em> 个账号
        <span v-if="selectedAccounts.length" class="batch-selected-accounts">
          ({{ selectedAccounts.map(a => a.username).join('、') }})
        </span>
      </div>

      <el-tabs v-model="batchTab" class="batch-tabs">
        <el-tab-pane label="批量分配角色" name="role">
          <el-form label-width="100px" style="margin-top: 12px;">
            <el-form-item label="核心角色">
              <el-select v-model="batchForm.roleId" placeholder="选择角色" style="width: 100%">
                <el-option v-for="r in roleOptions" :key="r.id" :label="r.name" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="批量分配权限" name="permission">
          <el-form label-width="100px" style="margin-top: 12px;">
            <el-form-item label="附属权限">
              <div class="perm-tree-container batch-tree">
                <el-tree
                  ref="batchPermTreeRef"
                  :data="permissionTree"
                  show-checkbox
                  node-key="id"
                  :props="{ children: 'children', label: 'name' }"
                  @check="handleBatchPermCheck"
                  class="perm-tree"
                >
                  <template #default="{ data }">
                    <span class="perm-tree-node">
                      <span>{{ data.name }}</span>
                      <el-tag :type="PermMenuLevelTagType[data.level]" size="small" class="level-tag">
                        {{ PermMenuLevelLabel[data.level] }}
                      </el-tag>
                    </span>
                  </template>
                </el-tree>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div v-if="batchProgress.show" class="batch-progress">
        <el-progress :percentage="batchProgress.percentage" :status="batchProgress.status" />
        <span class="batch-progress-text">{{ batchProgress.text }}</span>
      </div>

      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="batchForm.roleId == null && batchPermIds.length === 0" @click="handleBatchSubmit" class="round-btn">
          确认分配
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="traceDialogVisible" title="账号权限溯源校验" width="900px" class="trace-dialog">
      <div class="trace-search">
        <el-form :inline="true" :model="traceForm" class="trace-search-form">
          <el-form-item label="账号">
            <el-select v-model="traceForm.userId" placeholder="搜索账号" clearable filterable style="width: 240px">
              <el-option v-for="a in accountList" :key="a.id" :label="`${a.username} (${a.uid})`" :value="a.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" :loading="traceLoading" @click="handleTraceSearch">检索</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="traceLoading" class="skeleton-wrap">
        <div v-for="i in 3" :key="i" class="skeleton-item">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
          </div>
        </div>
      </div>

      <div v-else-if="traceResult" class="trace-result">
        <div class="trace-user-card">
          <div class="trace-user-header">
            <el-tag :type="AccountStatusTagType[traceResult.user.status]" effect="dark" size="large">
              {{ traceResult.user.username }}
            </el-tag>
            <el-tag :type="AccountStatusTagType[traceResult.user.status]" size="small">
              {{ AccountStatusLabel[traceResult.user.status] }}
            </el-tag>
            <span class="trace-user-meta">UID: {{ traceResult.user.uid }} | 角色: {{ RoleTypeLabel[traceResult.user.role] }}</span>
          </div>

          <el-descriptions :column="2" border size="small" class="trace-desc">
            <el-descriptions-item label="有效权限">{{ traceResult.detail.effectivePermCount }}</el-descriptions-item>
            <el-descriptions-item label="附属权限">{{ traceResult.detail.auxPermissions?.length || 0 }}</el-descriptions-item>
            <el-descriptions-item label="合规评分">
              <span :class="{ 'score-danger': traceResult.validation.score < 60, 'score-warning': traceResult.validation.score >= 60 && traceResult.validation.score < 80, 'score-success': traceResult.validation.score >= 80 }">
                {{ traceResult.validation.score }}分
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="校验状态">
              <el-tag :type="traceResult.validation.valid ? 'success' : 'danger'" size="small">
                {{ traceResult.validation.valid ? '合规' : '存在异常' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="traceResult.validation.issues.length" class="validation-issues">
            <h4 class="section-title">校验问题</h4>
            <div v-for="(issue, idx) in traceResult.validation.issues" :key="idx" class="validation-issue-item" :class="'severity-' + issue.severity">
              <el-tag :type="issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'info'" size="small" effect="dark">
                {{ AccountPermIssueTypeLabel[issue.type] || issue.type }}
              </el-tag>
              <span class="issue-desc">{{ issue.description }}</span>
              <el-tooltip :content="issue.permissions.map(p => p.name + '(' + p.code + ')').join(', ')" placement="top" :show-after="100">
                <el-tag size="small" type="info" class="issue-fields-tag">{{ issue.permissions.length }}项</el-tag>
              </el-tooltip>
            </div>
          </div>
        </div>

        <el-collapse v-if="traceResult.logs.length" class="trace-logs-collapse">
          <el-collapse-item :title="'权限变更历史 (' + traceResult.logs.length + '条)'">
            <el-table :data="traceResult.logs" max-height="300" size="small" @row-dblclick="handleLogRowDblClick">
              <el-table-column label="变更类型" width="110">
                <template #default="{ row }">
                  <el-tag :type="AccountPermChangeTypeTagType[row.changeType]" size="small">
                    {{ AccountPermChangeTypeLabel[row.changeType] || row.changeType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="operatorName" label="操作人" width="90" />
              <el-table-column label="涉及角色" width="100">
                <template #default="{ row }">{{ row.roleName || '-' }}</template>
              </el-table-column>
              <el-table-column label="新增" width="60" align="center">
                <template #default="{ row }">
                  <span v-if="row.addedPermissions?.length" class="text-success">+{{ row.addedPermissions.length }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="移除" width="60" align="center">
                <template #default="{ row }">
                  <span v-if="row.removedPermissions?.length" class="text-danger">-{{ row.removedPermissions.length }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="原因" min-width="120">
                <template #default="{ row }">
                  <el-tooltip :content="row.reason" placement="top" :disabled="!row.reason || row.reason.length <= 20">
                    <span>{{ row.reason || '-' }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="150">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>

      <EmptyState v-else-if="traceSearched" description="未检索到匹配的账号权限信息" />
    </el-dialog>

    <el-dialog v-model="logDialogVisible" title="账号权限分配日志" width="800px" class="log-dialog">
      <el-form :inline="true" :model="logFilter" class="log-filter-form">
        <el-form-item label="变更类型">
          <el-select v-model="logFilter.changeType" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="(label, key) in AccountPermChangeTypeLabel" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="logList" v-loading="logLoading" max-height="400" size="small" @row-dblclick="handleLogRowDblClick">
        <el-table-column prop="username" label="用户" width="100" />
        <el-table-column label="变更类型" width="110">
          <template #default="{ row }">
            <el-tag :type="AccountPermChangeTypeTagType[row.changeType]" size="small">
              {{ AccountPermChangeTypeLabel[row.changeType] || row.changeType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="roleName" label="角色" width="90" />
        <el-table-column prop="operatorName" label="操作人" width="90" />
        <el-table-column label="新增" width="55" align="center">
          <template #default="{ row }">
            <span v-if="row.addedPermissions?.length" class="text-success">+{{ row.addedPermissions.length }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="移除" width="55" align="center">
          <template #default="{ row }">
            <span v-if="row.removedPermissions?.length" class="text-danger">-{{ row.removedPermissions.length }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="原因" min-width="100">
          <template #default="{ row }">
            <el-tooltip :content="row.reason" placement="top" :disabled="!row.reason || row.reason.length <= 15">
              <span>{{ row.reason || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="145">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <div class="log-pagination" v-if="logTotal > 0">
        <el-pagination v-model:current-page="logPage" :page-size="20" :total="logTotal" layout="total, prev, pager, next" @current-change="fetchLogs" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, UserFilled, DataAnalysis } from '@element-plus/icons-vue'
import DataTable from '@/components/business/DataTable/index.vue'
import EmptyState from '@/components/business/EmptyState/index.vue'
import {
  AccountStatusLabel, AccountStatusTagType, AccountStatusOption,
  AccountPermChangeTypeLabel, AccountPermChangeTypeTagType,
  AccountPermIssueTypeLabel, BindingSourceLabel,
  RoleTypeLabel, RoleTypeOption,
  PermMenuLevelLabel, PermMenuLevelTagType
} from '@/constants'
import {
  getAccountList, getAccountDetail, assignRole, addPermissions,
  adjustPermissions, batchAssignRole, batchAddPermissions,
  validateAccountStatus, checkConflict, checkRoleMatch,
  traceAccount, cleanupRedundant, getAccountLogs
} from '@/api/accountPermission'
import { getRoleList, getPermissionMenuTree } from '@/api/rolePermission'
import type {
  AccountPermissionItem, AccountPermissionDetail, AccountPermConflict,
  AccountRoleMatchResult, AccountTraceResult, AccountPermLog,
  RoleItem, PermissionMenu
} from '@/types'

const loading = ref(false)
const accountList = ref<AccountPermissionItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedAccounts = ref<AccountPermissionItem[]>([])
const roleOptions = ref<RoleItem[]>([])
const permissionTree = ref<PermissionMenu[]>([])

const filterForm = reactive({ keyword: '', status: '', role: '' })

const fetchAccounts = async () => {
  loading.value = true
  try {
    const res = await getAccountList({ page: page.value, pageSize: pageSize.value, ...filterForm })
    accountList.value = res.data.list || []
    total.value = res.data.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取账号列表失败')
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const res = await getRoleList({ page: 1, pageSize: 100 })
    roleOptions.value = res.data.list || []
  } catch { /* ignore */ }
}

const fetchPermTree = async () => {
  try {
    const res = await getPermissionMenuTree()
    permissionTree.value = res.data || []
  } catch { /* ignore */ }
}

const handleResetFilter = () => {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.role = ''
  page.value = 1
  fetchAccounts()
}

const handleAccountSelection = (rows: AccountPermissionItem[]) => {
  selectedAccounts.value = rows
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

// ================ 功能点1：分配权限 ================

const assignDialogVisible = ref(false)
const submitLoading = ref(false)
const assignFormRef = ref()
const assignPermTreeRef = ref()
const userSearchLoading = ref(false)
const userSearchResults = ref<AccountPermissionItem[]>([])
const accountStatusValid = ref(true)
const accountStatusReason = ref('')
const roleMatchResult = ref<AccountRoleMatchResult | null>(null)
const stackConflicts = ref<AccountPermConflict[]>([])
const conflictPermIds = ref<Set<number>>(new Set())

const assignForm = reactive({
  userId: null as number | null,
  roleId: null as number | null,
  permissionIds: [] as number[]
})

const assignRules = {
  userId: [{ required: true, message: '请选择账号', trigger: 'change' }]
}

const isConflictPerm = (id: number) => conflictPermIds.value.has(id)

const handleUserSearch = async (query: string) => {
  if (!query) { userSearchResults.value = []; return }
  userSearchLoading.value = true
  try {
    const res = await getAccountList({ keyword: query, page: 1, pageSize: 20 })
    userSearchResults.value = res.data.list || []
  } catch { userSearchResults.value = [] }
  finally { userSearchLoading.value = false }
}

const handleAssignOpen = () => {
  assignDialogVisible.value = true
  accountStatusValid.value = true
  accountStatusReason.value = ''
  roleMatchResult.value = null
  stackConflicts.value = []
  conflictPermIds.value = new Set()
}

const handleAssignClosed = () => {
  assignForm.userId = null
  assignForm.roleId = null
  assignForm.permissionIds = []
  accountStatusValid.value = true
  accountStatusReason.value = ''
  roleMatchResult.value = null
  stackConflicts.value = []
  conflictPermIds.value = new Set()
}

const handleAssignRoleChange = async () => {
  if (assignForm.roleId && assignForm.userId) {
    try {
      const res = await checkRoleMatch(assignForm.userId, assignForm.roleId)
      roleMatchResult.value = res.data
    } catch { roleMatchResult.value = null }
  } else {
    roleMatchResult.value = null
  }
}

const handleAssignPermCheck = async () => {
  await nextTick()
  const tree = assignPermTreeRef.value
  if (!tree || !assignForm.userId) return
  const checkedKeys = tree.getCheckedKeys(false) as number[]
  assignForm.permissionIds = checkedKeys
  if (checkedKeys.length > 0) {
    try {
      const res = await checkConflict(assignForm.userId, checkedKeys)
      stackConflicts.value = res.data.conflicts || []
      const ids = new Set<number>()
      stackConflicts.value.forEach(c => c.permissions.forEach(p => ids.add(p.id)))
      conflictPermIds.value = ids
    } catch {
      stackConflicts.value = []
      conflictPermIds.value = new Set()
    }
  } else {
    stackConflicts.value = []
    conflictPermIds.value = new Set()
  }
}

const handleAssignSubmit = async () => {
  if (!assignForm.userId) { ElMessage.warning('请选择账号'); return }
  try {
    const statusRes = await validateAccountStatus(assignForm.userId)
    accountStatusValid.value = statusRes.data.valid
    if (!statusRes.data.valid) {
      accountStatusReason.value = statusRes.data.reason || '账号状态异常'
      return
    }
  } catch { /* proceed */ }

  submitLoading.value = true
  try {
    if (assignForm.roleId) {
      await assignRole(assignForm.userId, assignForm.roleId)
    }
    if (assignForm.permissionIds.length > 0) {
      await addPermissions(assignForm.userId, assignForm.permissionIds)
    }
    ElMessage.success('权限分配成功')
    assignDialogVisible.value = false
    fetchAccounts()
  } catch (e: any) {
    ElMessage.error(e.message || '分配失败')
  } finally {
    submitLoading.value = false
  }
}

// ================ 功能点2：调整权限 ================

const adjustDialogVisible = ref(false)
const adjustStep = ref(1)
const adjustUser = ref<AccountPermissionItem | null>(null)
const adjustDetail = ref<AccountPermissionDetail | null>(null)
const adjustPermTreeRef = ref()
const adjustStackConflicts = ref<AccountPermConflict[]>([])
const adjustConflictPermIds = ref<Set<number>>(new Set())

const adjustForm = reactive({
  roleId: null as number | null,
  addPermissionIds: [] as number[],
  removePermissionIds: [] as number[],
  reason: ''
})

const isAdjustConflictPerm = (id: number) => adjustConflictPermIds.value.has(id)

const handleAdjustOpen = async (row: AccountPermissionItem) => {
  adjustUser.value = row
  adjustStep.value = 1
  adjustStackConflicts.value = []
  adjustConflictPermIds.value = new Set()
  try {
    const res = await getAccountDetail(row.id)
    adjustDetail.value = res.data
    adjustForm.roleId = adjustDetail.value.coreRoleId
    adjustForm.addPermissionIds = []
    adjustForm.removePermissionIds = []
    adjustForm.reason = ''
    adjustDialogVisible.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  }
}

const handleAdjustClosed = () => {
  adjustStep.value = 1
  adjustUser.value = null
  adjustDetail.value = null
  adjustForm.roleId = null
  adjustForm.addPermissionIds = []
  adjustForm.removePermissionIds = []
  adjustForm.reason = ''
  adjustStackConflicts.value = []
  adjustConflictPermIds.value = new Set()
}

const handleAdjustPermCheck = async () => {
  await nextTick()
  const tree = adjustPermTreeRef.value
  if (!tree || !adjustUser.value) return
  const checkedKeys = tree.getCheckedKeys(false) as number[]
  adjustForm.addPermissionIds = checkedKeys
  if (checkedKeys.length > 0) {
    try {
      const res = await checkConflict(adjustUser.value.id, checkedKeys)
      adjustStackConflicts.value = res.data.conflicts || []
      const ids = new Set<number>()
      adjustStackConflicts.value.forEach(c => c.permissions.forEach(p => ids.add(p.id)))
      adjustConflictPermIds.value = ids
    } catch {
      adjustStackConflicts.value = []
      adjustConflictPermIds.value = new Set()
    }
  } else {
    adjustStackConflicts.value = []
    adjustConflictPermIds.value = new Set()
  }
}

const handleAdjustSubmit = async () => {
  if (!adjustUser.value) return
  await ElMessageBox.confirm('确认调整该账号的权限？调整后将即时生效', '二次确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
  submitLoading.value = true
  try {
    await adjustPermissions(adjustUser.value.id, {
      roleId: adjustForm.roleId,
      addPermissionIds: adjustForm.addPermissionIds,
      removePermissionIds: adjustForm.removePermissionIds,
      reason: adjustForm.reason
    })
    ElMessage.success('权限调整成功，已即时生效')
    adjustDialogVisible.value = false
    fetchAccounts()
  } catch (e: any) {
    ElMessage.error(e.message || '调整失败')
  } finally {
    submitLoading.value = false
  }
}

// ================ 查看详情 ================

const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<AccountPermissionDetail | null>(null)

const handleViewDetail = async (row: AccountPermissionItem) => {
  detailLoading.value = true
  detailDialogVisible.value = true
  try {
    const res = await getAccountDetail(row.id)
    detailData.value = res.data
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  } finally {
    detailLoading.value = false
  }
}

// ================ 功能点3：批量分配 ================

const batchDialogVisible = ref(false)
const batchTab = ref('role')
const batchPermTreeRef = ref()
const batchPermIds = ref<number[]>([])
const batchProgress = reactive({ show: false, percentage: 0, status: '' as '' | 'success' | 'exception', text: '' })

const batchForm = reactive({ roleId: null as number | null })

const handleBatchAssignOpen = () => {
  batchForm.roleId = null
  batchPermIds.value = []
  batchTab.value = 'role'
  batchProgress.show = false
  batchProgress.percentage = 0
  batchProgress.status = ''
  batchProgress.text = ''
  batchDialogVisible.value = true
}

const handleBatchClosed = () => {
  batchForm.roleId = null
  batchPermIds.value = []
}

const handleBatchPermCheck = async () => {
  await nextTick()
  const tree = batchPermTreeRef.value
  if (!tree) return
  batchPermIds.value = tree.getCheckedKeys(false) as number[]
}

const handleBatchSubmit = async () => {
  const userIds = selectedAccounts.value.map(a => a.id)
  if (userIds.length === 0) { ElMessage.warning('请先选择账号'); return }
  submitLoading.value = true
  batchProgress.show = true
  batchProgress.percentage = 10
  batchProgress.text = '正在批量分配...'

  try {
    let res
    if (batchTab.value === 'role' && batchForm.roleId) {
      res = (await batchAssignRole(userIds, batchForm.roleId)).data
    } else if (batchTab.value === 'permission' && batchPermIds.value.length > 0) {
      res = (await batchAddPermissions(userIds, batchPermIds.value)).data
    } else {
      ElMessage.warning('请选择角色或权限')
      submitLoading.value = false
      batchProgress.show = false
      return
    }
    batchProgress.percentage = 100
    batchProgress.status = 'success'
    batchProgress.text = `完成：成功${res.success?.length || 0}个，失败${res.failed?.length || 0}个，过滤异常${res.filteredCount || 0}个`
    if (res.failed?.length) {
      ElMessage.warning(`部分账号操作失败: ${res.failed.map((f: any) => f.reason).join('; ')}`)
    } else {
      ElMessage.success('批量分配成功')
    }
    fetchAccounts()
  } catch (e: any) {
    batchProgress.percentage = 100
    batchProgress.status = 'exception'
    batchProgress.text = e.message || '分配失败'
    ElMessage.error(e.message || '批量分配失败')
  } finally {
    submitLoading.value = false
  }
}

// ================ 功能点4：溯源校验 ================

const traceDialogVisible = ref(false)
const traceLoading = ref(false)
const traceSearched = ref(false)
const traceResult = ref<AccountTraceResult | null>(null)
const traceForm = reactive({ userId: null as number | null })

const handleTraceOpen = () => {
  traceForm.userId = null
  traceResult.value = null
  traceSearched.value = false
  traceDialogVisible.value = true
}

const handleTraceSearch = async () => {
  if (!traceForm.userId) { ElMessage.warning('请选择账号'); return }
  traceLoading.value = true
  traceSearched.value = true
  try {
    const res = await traceAccount(traceForm.userId)
    traceResult.value = res.data
  } catch (e: any) {
    ElMessage.error(e.message || '溯源查询失败')
    traceResult.value = null
  } finally {
    traceLoading.value = false
  }
}

const handleTraceOne = (row: AccountPermissionItem) => {
  traceForm.userId = row.id
  traceResult.value = null
  traceSearched.value = false
  traceDialogVisible.value = true
  nextTick(() => handleTraceSearch())
}

const handleCleanup = (row: AccountPermissionItem) => {
  ElMessageBox.confirm(`确认清理用户"${row.username}"的冗余权限？`, '清理确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      const res = await cleanupRedundant(row.id)
      ElMessage.success(`清理完成：移除${res.data.removedCount}个冗余权限`)
      fetchAccounts()
    } catch (e: any) {
      ElMessage.error(e.message || '清理失败')
    }
  }).catch(() => {})
}

// ================ 日志 ================

const logDialogVisible = ref(false)
const logLoading = ref(false)
const logList = ref<AccountPermLog[]>([])
const logTotal = ref(0)
const logPage = ref(1)
const logFilter = reactive({ changeType: '', userId: undefined as number | undefined })

const fetchLogs = async () => {
  logLoading.value = true
  try {
    const res = await getAccountLogs({
      page: logPage.value,
      pageSize: 20,
      changeType: logFilter.changeType || undefined,
      userId: logFilter.userId || undefined
    })
    logList.value = res.data.list || []
    logTotal.value = res.data.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取日志失败')
  } finally {
    logLoading.value = false
  }
}

const handleLogRowDblClick = (row: AccountPermLog) => {
  handleTraceOne({ id: row.userId, username: row.username, uid: row.userUid } as AccountPermissionItem)
}

onMounted(() => {
  fetchAccounts()
  fetchRoles()
  fetchPermTree()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.account-perm-page { padding: 16px; }

.card-wrapper {
  background: $bg-color-ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.filter-form { :deep(.el-form-item) { margin-bottom: 0; } }

.table-toolbar {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
  .toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
}

.text-muted { color: $text-secondary; }
.text-success { color: $color-success; }
.text-danger { color: $color-danger; }

.search-uid { color: $text-secondary; font-size: 12px; margin-left: 8px; }

.glow-select {
  :deep(.el-input__wrapper:focus-within) {
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.35), 0 0 12px rgba(64, 158, 255, 0.15);
    border-color: $primary-color;
  }
}

.shake-alert {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
}

.perm-tree-container {
  max-height: 350px; overflow-y: auto;
  border: 1px solid #ebeef5; border-radius: 4px; padding: 8px; width: 100%;
  &.batch-tree { max-height: 250px; }
}

.perm-tree {
  width: 100%;
  .perm-tree-node {
    display: inline-flex; align-items: center; gap: 6px; font-size: 13px;
    &.conflict-node { color: $color-danger; background: rgba(245, 108, 108, 0.08); padding: 0 4px; border-radius: 3px; }
  }
  .core-tag { margin-left: 4px; }
  .level-tag { margin-left: 2px; }
  .mutex-badge { background: #e6a23c; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 3px; }
  .conflict-badge { background: $color-danger; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 3px; }
  :deep(.el-checkbox__input.is-focus .el-checkbox__inner) {
    border-color: $color-danger;
    box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
  }
}

.perm-alert { margin-bottom: 12px; }

.field-error { color: $color-danger; font-size: 12px; line-height: 1.4; margin-top: 4px; }

.ripple-btn {
  position: relative; overflow: hidden;
  &::after {
    content: ''; position: absolute; top: 50%; left: 50%;
    width: 0; height: 0; border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.5s, height 0.5s;
  }
  &:active::after { width: 200px; height: 200px; }
}

.round-btn { border-radius: 8px !important; }

.adjust-steps {
  display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
  .step-indicator {
    display: flex; align-items: center; gap: 6px; cursor: pointer; opacity: 0.5; transition: all 0.3s;
    &.active { opacity: 1; } &.completed { opacity: 0.8; }
    .step-num {
      width: 28px; height: 28px; border-radius: 50%; background: #dcdfe6; color: #fff;
      display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; transition: background 0.3s;
    }
    &.active .step-num { background: $primary-color; } &.completed .step-num { background: $color-success; }
    .step-label { font-size: 14px; font-weight: 500; }
  }
  .step-line {
    width: 60px; height: 2px; background: #dcdfe6; margin: 0 12px; transition: background 0.3s;
    &.active { background: $color-success; }
  }
}

.adjust-dialog-footer { display: flex; justify-content: flex-end; gap: 8px; }

.section-title {
  font-size: 14px; font-weight: 600; margin: 16px 0 8px; padding-left: 8px;
  border-left: 3px solid $primary-color;
}

.detail-desc { margin-bottom: 12px; }
.detail-perm-table { margin-bottom: 12px; }

.batch-alert { margin-bottom: 12px; }
.batch-selected-info {
  font-size: 14px; color: $text-regular; margin: 12px 0 8px;
  em { color: $primary-color; font-style: normal; font-weight: 600; }
  .batch-selected-accounts { color: $text-secondary; font-size: 12px; }
}

.batch-tabs { margin-top: 8px; }

.batch-progress {
  margin-top: 16px;
  .batch-progress-text { font-size: 12px; color: $text-secondary; margin-top: 4px; display: block; }
}

.trace-search { margin-bottom: 16px; }
.trace-search-form { :deep(.el-form-item) { margin-bottom: 0; } }

.trace-user-card {
  padding: 16px; background: #f5f7fa; border-radius: 8px; margin-bottom: 16px;
  .trace-user-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
    .trace-user-meta { font-size: 13px; color: $text-secondary; }
  }
}

.trace-desc { margin-bottom: 8px; }
.score-success { color: $color-success; font-weight: 600; }
.score-warning { color: #e6a23c; font-weight: 600; }
.score-danger { color: $color-danger; font-weight: 600; }

.validation-issues {
  margin-top: 12px;
  .validation-issue-item {
    display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #ebeef5;
    &.severity-high { border-left: 3px solid $color-danger; padding-left: 8px; }
    &.severity-medium { border-left: 3px solid #e6a23c; padding-left: 8px; }
    &.severity-low { border-left: 3px solid #909399; padding-left: 8px; }
    .issue-desc { flex: 1; font-size: 13px; }
    .issue-fields-tag { cursor: pointer; }
  }
}

.trace-logs-collapse { margin-bottom: 16px; }

.log-filter-form { :deep(.el-form-item) { margin-bottom: 0; } margin-bottom: 12px; }
.log-pagination { margin-top: 12px; text-align: right; }

.skeleton-wrap {
  padding: 16px;
  .skeleton-item {
    display: flex; gap: 12px; margin-bottom: 16px;
    .skeleton-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;
    }
    .skeleton-lines { flex: 1; }
    .skeleton-line {
      height: 14px; border-radius: 4px; margin-bottom: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%; animation: skeleton-loading 1.5s infinite;
      &.long { width: 80%; } &.medium { width: 60%; }
    }
  }
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; } 100% { background-position: -200% 0; }
}

:deep(.el-table__body tr.selected-row) { background-color: rgba(64, 158, 255, 0.06); }
</style>
