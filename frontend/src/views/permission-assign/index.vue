<template>
  <div class="user-permission-page">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="用户名/UID/昵称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="账号角色">
          <el-select v-model="filterForm.role" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in UserFilterRoleOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="item in UserStatusOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchUsers">搜索</el-button>
          <el-button :icon="Refresh" @click="handleResetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card card-wrapper">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="User" @click="handleAssignDialogOpen">权限分配</el-button>
          <el-button type="warning" :icon="Avatar" :disabled="selectedUsers.length === 0" @click="handleBatchDialogOpen">批量分配</el-button>
          <el-button type="info" :icon="DataAnalysis" @click="handleTraceDialogOpen">唯一性校验</el-button>
          <el-button type="success" :icon="Tickets" @click="handleLogDialogOpen">分配日志</el-button>
        </div>
        <div class="toolbar-stats">
          <span class="stat-item">选中: <b>{{ selectedUsers.length }}</b></span>
        </div>
      </div>

      <DataTable
        :data="userList"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        show-selection
        :row-class-name="getRowClassName"
        @selection-change="handleUserSelection"
        @refresh="fetchUsers"
        @row-dblclick="handleRowDblClick"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="uid" label="UID" width="140" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column label="绑定角色" width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.roleName" :type="RoleTypeTagType[row.role] || 'info'" effect="dark" size="small">
              {{ row.roleName }}
            </el-tag>
            <el-tag v-else type="info" size="small">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small" effect="dark">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限数" width="90" align="center">
          <template #default="{ row }">
            <span class="perm-count">{{ row.totalPermCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="角色继承" width="90" align="center">
          <template #default="{ row }">{{ row.rolePermCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="直接分配" width="90" align="center">
          <template #default="{ row }">{{ row.directPermCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="校验状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.statusCheck?.level === 'error'" type="danger" size="small" effect="dark">异常</el-tag>
            <el-tag v-else-if="row.statusCheck?.level === 'warning'" type="warning" size="small">提示</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleAssignOne(row)">分配权限</el-button>
            <el-button type="info" link size="small" @click="handleViewDetail(row)">查看详情</el-button>
            <el-button type="success" link size="small" @click="handleTraceOne(row)">溯源校验</el-button>
            <el-button
              type="danger"
              link
              size="small"
              :disabled="row.statusCheck?.level === 'error'"
              @click="handleCleanOne(row)"
            >清理冗余</el-button>
          </template>
        </el-table-column>
      </DataTable>
    </div>

    <el-dialog
      v-model="assignDialogVisible"
      title="账号权限分配"
      width="720px"
      :close-on-click-modal="false"
      @closed="handleAssignDialogClosed"
      class="assign-dialog"
    >
      <div class="assign-step-bar">
        <div class="step-node" :class="{ active: assignStep === 1, done: assignStep > 1 }">
          <span class="step-dot">1</span>
          <span class="step-name">选择账号与角色</span>
        </div>
        <div class="step-line" :class="{ done: assignStep > 1 }"></div>
        <div class="step-node" :class="{ active: assignStep === 2 }">
          <span class="step-dot">2</span>
          <span class="step-name">附加权限配置</span>
        </div>
      </div>

      <div v-show="assignStep === 1" class="step-panel slide-fade">
        <el-form label-width="100px" class="step-form">
          <el-form-item label="选择账号" required>
            <el-select
              v-model="assignForm.userId"
              filterable
              remote
              reserve-keyword
              placeholder="搜索并选择账号"
              :remote-method="searchUsers"
              :loading="searchUserLoading"
              style="width: 100%"
              class="user-select-input"
              @change="handleAssignUserChange"
            >
              <el-option
                v-for="u in userOptions"
                :key="u.id"
                :label="`${u.username || u.uid} (${u.nickname || '-'})`"
                :value="u.id"
                :disabled="u.blocked"
              >
                <div class="user-option-item">
                  <span>{{ u.username }}</span>
                  <span class="user-option-meta">{{ u.uid }} · {{ u.nickname }}</span>
                  <el-tag v-if="u.blocked" type="danger" size="small">禁止操作</el-tag>
                  <el-tag v-else :type="RoleTypeTagType[u.role] || 'info'" size="small">
                    {{ RoleTypeLabel[u.role] || u.role }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-alert v-if="assignUserStatusCheck && assignUserStatusCheck.level !== 'success'"
            :title="assignUserStatusCheck.reason || ''"
            :type="assignUserStatusCheck.level === 'error' ? 'error' : 'warning'"
            :closable="false"
            show-icon
            class="status-alert"
          />
          <el-form-item label="分配角色" required>
            <el-select
              v-model="assignForm.roleId"
              placeholder="请选择核心角色(仅可绑定一个)"
              style="width: 100%"
              @change="handleAssignRoleChange"
            >
              <el-option
                v-for="r in allRoles"
                :key="r.id"
                :label="r.name"
                :value="r.id"
                :disabled="r.isSystem && r.type === 'super_admin'"
              >
                <span>{{ r.name }}</span>
                <span class="role-option-meta">层级:{{ r.level }} · {{ r.code }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-alert v-if="matchCheckResult && (matchCheckResult.issues.length > 0)"
            type="error"
            :closable="false"
            show-icon
            class="match-alert"
            :class="{ 'shake-anim': showMatchShake }"
          >
            <div>匹配度: <b>{{ matchCheckResult.matchScore }}分</b></div>
            <div v-for="(issue, i) in matchCheckResult.issues" :key="i" class="match-issue-item">
              <el-tag size="small" :type="issue.level === 'error' ? 'danger' : 'warning'" effect="dark">
                {{ issue.level === 'error' ? '冲突' : '警告' }}
              </el-tag>
              <span class="issue-text">{{ issue.reason }}</span>
              <span v-if="issue.permissions" class="issue-perms">
                涉及: {{ issue.permissions.map(p => p.name).join(', ') }}
              </span>
            </div>
          </el-alert>
          <el-alert v-if="matchCheckResult && matchCheckResult.issues.length === 0 && assignForm.roleId"
            type="success"
            :closable="false"
            show-icon
            :title="`角色权限匹配度: ${matchCheckResult.matchScore}分 · 共${matchCheckResult.permCount}项权限`"
            class="match-alert"
          />
        </el-form>
      </div>

      <div v-show="assignStep === 2" class="step-panel slide-fade">
        <el-form label-width="100px" class="step-form">
          <el-form-item label="附加权限">
            <div class="perm-tree-container">
              <el-alert v-if="assignUniqueCheck && (assignUniqueCheck.duplicates.length > 0 || assignUniqueCheck.overreach.length > 0)"
                type="error"
                :closable="false"
                :class="{ 'shake-anim': showUniqueShake }"
                class="perm-alert"
              >
                <div v-if="assignUniqueCheck.duplicates.length">
                  重复分配: {{ assignUniqueCheck.duplicates.length }}项
                </div>
                <div v-if="assignUniqueCheck.overreach.length">
                  越权配置: {{ assignUniqueCheck.overreach.map(p => p.permissionName).join(', ') }}
                </div>
              </el-alert>
              <el-tree
                ref="assignPermTreeRef"
                :data="permissionTree"
                show-checkbox
                node-key="id"
                :props="{ children: 'children', label: 'name' }"
                @check="handleAssignPermCheck"
                class="perm-tree"
              >
                <template #default="{ data }">
                  <span
                    class="perm-tree-node"
                    :class="{
                      'abnormal-highlight': isAssignAbnormalPerm(data.id)
                    }"
                  >
                    <span>{{ data.name }}</span>
                    <el-tag v-if="data.isCore" size="small" type="danger" effect="dark" class="core-tag">核心</el-tag>
                    <el-tag :type="PermMenuLevelTagType[data.level]" size="small" class="level-tag">
                      {{ PermMenuLevelLabel[data.level] }}
                    </el-tag>
                    <el-tag v-if="isInRolePerms(data.id)" size="small" type="primary" effect="plain" class="inherit-tag">
                      角色继承
                    </el-tag>
                  </span>
                </template>
              </el-tree>
            </div>
          </el-form-item>
          <el-form-item label="变更原因">
            <el-input v-model="assignForm.reason" type="textarea" :rows="2" placeholder="请填写变更原因(建议)" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="assignStep > 1" @click="assignStep--">上一步</el-button>
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button v-if="assignStep < 2" type="primary"
            :disabled="!assignForm.userId || !assignForm.roleId || hasMatchErrors"
            @click="assignStep++"
          >下一步</el-button>
          <el-button v-if="assignStep === 2" type="primary"
            :loading="submitLoading"
            :disabled="hasUniqueBlockErrors"
            class="ripple-btn"
            @click="handleAssignSubmit"
          >确认分配</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="账号权限详情" width="860px" class="detail-dialog">
      <div v-if="detailData" v-loading="detailLoading">
        <el-descriptions :column="2" border size="small" title="账号信息">
          <el-descriptions-item label="UID">{{ detailData.user?.uid }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ detailData.user?.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detailData.user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(detailData.user?.status)" size="small" effect="dark">
              {{ getStatusLabel(detailData.user?.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="角色" :span="2">
            <el-tag :type="RoleTypeTagType[detailData.role?.type || ''] || 'info'" effect="dark" size="small">
              {{ detailData.role?.name || '未分配' }}
            </el-tag>
            <span v-if="detailData.role?.level" class="detail-meta">层级: {{ detailData.role.level }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title">
          角色继承权限 <el-tag size="small" type="primary">{{ detailData.rolePermissions?.length || 0 }}</el-tag>
        </h4>
        <el-table :data="detailData.rolePermissions || []" size="small" max-height="200">
          <el-table-column prop="name" label="权限名称" width="140" />
          <el-table-column prop="code" label="权限编码" width="160" />
          <el-table-column label="层级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="PermMenuLevelTagType[row.level]" size="small">{{ PermMenuLevelLabel[row.level] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="核心" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isCore" type="danger" size="small">核心</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" show-overflow-tooltip />
        </el-table>

        <h4 class="section-title">
          直接分配权限 <el-tag size="small" type="success">{{ detailData.directPermissions?.length || 0 }}</el-tag>
        </h4>
        <el-table v-if="detailData.directPermissions?.length" :data="detailData.directPermissions" size="small" max-height="200">
          <el-table-column prop="name" label="权限名称" width="140" />
          <el-table-column prop="code" label="权限编码" width="160" />
          <el-table-column label="来源" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="PermSourceTagType[row.source || ''] || 'info'" size="small">
                {{ PermSourceLabel[row.source || ''] || row.source }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="覆盖" width="90" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isOverride" size="small" type="warning">
                {{ OverrideTypeLabel[row.overrideType || ''] || '覆盖' }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="expiresAt" label="过期时间" width="160" />
        </el-table>
        <EmptyState v-else description="暂无直接分配的权限" />
      </div>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量账号权限分配" width="680px" class="batch-dialog">
      <div class="batch-summary">
        <div class="batch-item">
          <span class="batch-label">选中账号</span>
          <span class="batch-value highlight">{{ batchUserList.length }}</span>
          <span class="batch-meta">个</span>
        </div>
        <div class="batch-item">
          <span class="batch-label">正常账号</span>
          <span class="batch-value success">{{ validBatchUsers.length }}</span>
        </div>
        <div class="batch-item">
          <span class="batch-label">过滤跳过</span>
          <span class="batch-value danger">{{ invalidBatchUsers.length }}</span>
        </div>
      </div>
      <el-alert type="warning" :closable="false" show-icon class="batch-alert">
        系统自动过滤异常状态账号（封禁/冻结），仅对合规账号统一生效。超级管理员账号将被跳过。
      </el-alert>
      <el-form label-width="100px" style="margin-top: 12px;">
        <el-form-item label="分配角色">
          <el-select v-model="batchForm.roleId" placeholder="可选：统一绑定核心角色" clearable style="width: 100%">
            <el-option
              v-for="r in allRoles"
              :key="r.id"
              :label="r.name"
              :value="r.id"
              :disabled="r.isSystem && r.type === 'super_admin'"
            >
              {{ r.name }} · 层级{{ r.level }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="附加通用权限">
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
        <el-form-item label="变更原因">
          <el-input v-model="batchForm.reason" type="textarea" :rows="2" placeholder="批量操作原因" />
        </el-form-item>
      </el-form>
      <div v-if="batchProgress.show" class="batch-progress-wrap">
        <el-progress :percentage="batchProgress.percentage" :status="batchProgress.status" />
        <div class="batch-progress-text">{{ batchProgress.text }}</div>
      </div>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          :disabled="!batchForm.roleId && batchSelectedPermIds.length === 0"
          style="border-radius: 8px;"
          @click="handleBatchSubmit"
        >
          确认批量分配
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="traceDialogVisible" title="账号权限唯一性校验" width="920px" class="trace-dialog">
      <div class="trace-search">
        <el-form :inline="true" label-width="70px">
          <el-form-item label="账号">
            <el-select
              v-model="traceForm.userId"
              filterable
              remote
              reserve-keyword
              placeholder="搜索并选择账号"
              :remote-method="searchTraceUsers"
              :loading="searchTraceLoading"
              clearable
              style="width: 240px"
              @change="handleTraceSearch"
            >
              <el-option
                v-for="u in traceUserOptions"
                :key="u.id"
                :label="`${u.username || u.uid} (${u.nickname || '-'})`"
                :value="u.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" :loading="traceLoading" @click="handleTraceSearch">执行校验</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="traceLoading" class="skeleton-wrap">
        <div v-for="i in 3" :key="i" class="skeleton-item">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
      </div>

      <div v-else-if="traceResult" class="trace-content">
        <el-card shadow="never" class="score-card">
          <div class="score-left">
            <div class="score-circle" :class="scoreClass">
              {{ traceResult.validation.score }}<span class="score-unit">分</span>
            </div>
          </div>
          <div class="score-right">
            <h3>{{ traceResult.user.username || traceResult.user.uid }}</h3>
            <div class="score-meta">
              <el-tag :type="RoleTypeTagType[traceResult.role?.type || ''] || 'info'" effect="dark" size="small">
                {{ traceResult.role?.name || '未分配角色' }}
              </el-tag>
              <span>总权限 <b>{{ traceResult.validation.totalPermissionCount }}</b> 项</span>
              <span>核心权限 <b>{{ traceResult.validation.corePermissionCount }}</b> 项</span>
            </div>
            <div class="score-stats">
              <div class="stat danger">冲突 <b>{{ traceResult.validation.conflictCount }}</b></div>
              <div class="stat warning">重复 <b>{{ traceResult.validation.duplicateCount }}</b></div>
              <div class="stat danger">越权 <b>{{ traceResult.validation.overreachCount }}</b></div>
              <div class="stat info">冗余 <b>{{ traceResult.validation.redundantCount }}</b></div>
            </div>
          </div>
        </el-card>

        <el-collapse class="trace-collapse">
          <el-collapse-item :title="`校验问题列表 (${traceResult.validation.issues.length})`">
            <div v-if="traceResult.validation.issues.length === 0" class="empty-tips">
              <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
              全部校验通过，权限配置合规
            </div>
            <div v-else>
              <div
                v-for="(issue, i) in traceResult.validation.issues"
                :key="i"
                class="issue-item"
                :class="'severity-' + issue.severity"
              >
                <el-tag :type="UserPermValidationTypeTagType[issue.type] || 'info'" size="small" effect="dark">
                  {{ UserPermValidationTypeLabel[issue.type] || issue.type }}
                </el-tag>
                <span class="issue-sev-tag" :class="'sev-' + issue.severity">
                  {{ issue.severity === 'high' ? '高危' : issue.severity === 'medium' ? '中危' : '提示' }}
                </span>
                <span class="issue-desc">{{ issue.description }}</span>
                <el-tag v-if="issue.permissionName" type="danger" size="small" class="perm-name-tag">
                  {{ issue.permissionName }}
                </el-tag>
              </div>
            </div>
          </el-collapse-item>
          <el-collapse-item :title="`权限变更历史 (${traceResult.logs.length}条)`">
            <el-table :data="traceResult.logs.slice(0, 30)" size="small" max-height="300">
              <el-table-column label="类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="UserPermChangeTypeTagType[row.changeType] || 'info'" size="small">
                    {{ UserPermChangeTypeLabel[row.changeType] || row.changeType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="角色变更" width="160">
                <template #default="{ row }">
                  <div v-if="row.oldRoleName || row.newRoleName" class="role-change">
                    <span v-if="row.oldRoleName" class="old-role">{{ row.oldRoleName }}</span>
                    <span class="change-arrow">→</span>
                    <span v-if="row.newRoleName" class="new-role">{{ row.newRoleName }}</span>
                  </div>
                  <span v-else>-</span>
                </template>
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
              <el-table-column prop="operatorName" label="操作人" width="80" />
              <el-table-column prop="reason" label="原因" min-width="120" show-overflow-tooltip />
              <el-table-column label="生效时间" width="150">
                <template #default="{ row }">{{ formatDate(row.tookEffectAt || row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
          <el-collapse-item title="详细权限清单">
            <h5 class="sub-title">角色继承</h5>
            <el-table :data="traceResult.rolePermissions" size="small">
              <el-table-column prop="name" label="权限名称" width="140" />
              <el-table-column prop="code" label="编码" width="140" />
              <el-table-column label="层级" width="80">
                <template #default="{ row }">
                  <el-tag :type="PermMenuLevelTagType[row.level]" size="small">{{ PermMenuLevelLabel[row.level] }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" show-overflow-tooltip />
            </el-table>
            <h5 class="sub-title" style="margin-top: 12px;">直接分配</h5>
            <el-table
              v-if="traceResult.directPermissions.length"
              :data="traceResult.directPermissions"
              size="small"
              :row-class-name="getAbnormalPermRowClass"
            >
              <el-table-column prop="name" label="权限名称" width="140" />
              <el-table-column prop="code" label="编码" width="140" />
              <el-table-column label="来源" width="80">
                <template #default="{ row }">
                  <el-tag :type="PermSourceTagType[row.source || ''] || 'info'" size="small">
                    {{ PermSourceLabel[row.source || ''] }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="校验" width="80">
                <template #default="{ row }">
                  <el-tag v-if="isTraceAbnormal(row)" type="danger" size="small">异常</el-tag>
                  <el-tag v-else type="success" size="small">正常</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" show-overflow-tooltip />
            </el-table>
            <EmptyState v-else description="无直接分配权限" />
          </el-collapse-item>
        </el-collapse>
      </div>
      <EmptyState v-else-if="traceSearched" description="请选择账号并执行校验" />
    </el-dialog>

    <el-dialog v-model="logDialogVisible" title="权限分配日志" width="820px" class="log-dialog">
      <el-form :inline="true" class="log-filter">
        <el-form-item label="变更类型">
          <el-select v-model="logFilter.changeType" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="(label, key) in UserPermChangeTypeLabel" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="logLoading" :data="logList" size="small" max-height="420">
        <el-table-column label="账号" width="140">
          <template #default="{ row }">
            <span>{{ row.userName }}</span>
            <span class="log-meta">{{ row.userUid }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变更类型" width="100">
          <template #default="{ row }">
            <el-tag :type="UserPermChangeTypeTagType[row.changeType] || 'info'" size="small">
              {{ UserPermChangeTypeLabel[row.changeType] || row.changeType }}
            </el-tag>
          </template>
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
        <el-table-column label="角色变更" width="160">
          <template #default="{ row }">
            <div v-if="row.oldRoleName || row.newRoleName" class="role-change-mini">
              <span v-if="row.oldRoleName" class="old">{{ row.oldRoleName }}</span>
              <span class="arrow">→</span>
              <span v-if="row.newRoleName" class="new">{{ row.newRoleName }}</span>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="80" />
        <el-table-column prop="reason" label="原因" min-width="120" show-overflow-tooltip />
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <div v-if="logTotal > 0" class="log-pagination">
        <el-pagination
          v-model:current-page="logPage"
          :page-size="20"
          :total="logTotal"
          layout="total, prev, pager, next"
          @current-change="fetchLogs"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, User, Avatar, DataAnalysis, Tickets,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import DataTable from '@/components/business/DataTable/index.vue'
import EmptyState from '@/components/business/EmptyState/index.vue'
import {
  RoleTypeLabel, RoleTypeTagType, PermMenuLevelLabel, PermMenuLevelTagType,
  UserStatusOption, UserFilterRoleOption,
  PermSourceLabel, PermSourceTagType, OverrideTypeLabel,
  UserPermChangeTypeLabel, UserPermChangeTypeTagType,
  UserPermValidationTypeLabel, UserPermValidationTypeTagType
} from '@/constants'
import {
  getUserPermissionList, getUserPermissionDetail, assignRoleToUser,
  addDirectPermissions, batchAssignPermissions,
  traceUserPermissions, getUserPermissionLogs, cleanRedundantPermissions,
  getAllRoles, getUsersForSelect, validateUserStatus,
  validateRolePermissionMatch, validatePermissionUniqueness
} from '@/api/userPermission'
import { getPermissionMenuTree } from '@/api/rolePermission'
import type {
  UserPermRow, RoleItem, PermissionMenu, MatchCheckResult, UniqueCheckResult,
  UserPermDetail, UserPermTraceResult, UserPermLog, MatchIssue,
  UserPermissionItem, UserPermValidationIssue, UserSelectOption
} from '@/types'

const loading = ref(false)
const userList = ref<UserPermRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedUsers = ref<UserPermRow[]>([])

const filterForm = reactive({ keyword: '', role: '', status: '' })
const permissionTree = ref<PermissionMenu[]>([])
const allRoles = ref<RoleItem[]>([])

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserPermissionList({
      page: page.value, pageSize: pageSize.value,
      keyword: filterForm.keyword, status: filterForm.status, role: filterForm.role
    })
    userList.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '获取列表失败')
  } finally {
    loading.value = false
  }
}

const fetchPermissionTree = async () => {
  try {
    const res = await getPermissionMenuTree()
    permissionTree.value = res.data || []
  } catch {}
}

const fetchAllRoles = async () => {
  try {
    const res = await getAllRoles()
    allRoles.value = res.data || []
  } catch {}
}

const handleResetFilter = () => {
  filterForm.keyword = ''
  filterForm.role = ''
  filterForm.status = ''
  page.value = 1
  fetchUsers()
}

const handleUserSelection = (rows: UserPermRow[]) => {
  selectedUsers.value = rows
}

const getStatusLabel = (s: string) => ({
  active: '正常', pending: '待审核', banned: '已封禁',
  frozen: '已冻结', disabled: '已停用', deleted: '已删除'
} as Record<string, string>)[s] || s || '-'

const getStatusTagType = (s: string) => ({
  active: 'success', pending: 'warning', banned: 'danger',
  frozen: 'danger', disabled: 'info', deleted: 'info'
} as Record<string, string>)[s] || 'info'

const getRowClassName = ({ row }: { row: UserPermRow }) => {
  const selectedIds = new Set(selectedUsers.value.map(u => u.id))
  if (selectedIds.has(row.id)) return 'row-selected-highlight'
  if (row.statusCheck?.level === 'error') return 'row-status-error'
  return ''
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const handleRowDblClick = (row: UserPermRow) => {
  if (row.statusCheck?.level === 'error') {
    ElMessage.warning(row.statusCheck.reason || '账号状态异常，禁止编辑')
    return
  }
  handleAssignOne(row)
}

// ================ 功能点1&2：单账号权限分配 ================

const assignDialogVisible = ref(false)
const assignStep = ref(1)
const submitLoading = ref(false)
const assignForm = reactive({
  userId: null as number | null,
  roleId: null as number | null,
  permissionIds: [] as number[],
  reason: ''
})
const assignPermTreeRef = ref()
const userOptions = ref<UserSelectOption[]>([])
const searchUserLoading = ref(false)
const assignUserStatusCheck = ref<any>(null)
const matchCheckResult = ref<MatchCheckResult | null>(null)
const assignUniqueCheck = ref<UniqueCheckResult | null>(null)
const showMatchShake = ref(false)
const showUniqueShake = ref(false)
const rolePermIdsCache = ref<Set<number>>(new Set())

const hasMatchErrors = computed(() =>
  matchCheckResult.value?.issues.some((i: MatchIssue) => i.level === 'error') || false
)

const hasUniqueBlockErrors = computed(() =>
  (assignUniqueCheck.value?.overreach.length || 0) > 0
)

const searchUsers = async (q: string) => {
  searchUserLoading.value = true
  try {
    const res = await getUsersForSelect({ keyword: q })
    userOptions.value = res.data || []
  } finally {
    searchUserLoading.value = false
  }
}

const handleAssignUserChange = async (userId: number) => {
  assignUserStatusCheck.value = null
  matchCheckResult.value = null
  assignUniqueCheck.value = null
  if (!userId) return
  try {
    const res = await validateUserStatus(userId)
    assignUserStatusCheck.value = res.data
  } catch {}
}

const handleAssignRoleChange = async (roleId: number) => {
  matchCheckResult.value = null
  rolePermIdsCache.value = new Set()
  if (!roleId || !assignForm.userId) return
  try {
    const res = await validateRolePermissionMatch({
      userId: assignForm.userId, roleId,
      additionalPermIds: assignForm.permissionIds
    })
    matchCheckResult.value = res.data
    if (hasMatchErrors.value) {
      showMatchShake.value = true
      setTimeout(() => showMatchShake.value = false, 800)
    }
    const role = allRoles.value.find(r => r.id === roleId)
    if (role) {
      // 角色信息缓存
    }
  } catch (e: any) {
    ElMessage.error(e.message || '匹配校验失败')
  }
}

const handleAssignPermCheck = async () => {
  await nextTick()
  const tree = assignPermTreeRef.value
  if (!tree) return
  const checkedKeys = tree.getCheckedKeys(false) as number[]
  assignForm.permissionIds = checkedKeys
  assignUniqueCheck.value = null
  if (!assignForm.userId) return
  try {
    const res = await validatePermissionUniqueness({
      userId: assignForm.userId, permissionIds: checkedKeys, source: 'direct_assign'
    })
    assignUniqueCheck.value = res.data
    if ((res.data.overreach?.length || 0) > 0) {
      showUniqueShake.value = true
      setTimeout(() => showUniqueShake.value = false, 800)
    }
  } catch {}
}

const isInRolePerms = (id: number) => rolePermIdsCache.value.has(id)

const isAssignAbnormalPerm = (id: number) => {
  if (!assignUniqueCheck.value) return false
  if (assignUniqueCheck.value.duplicates.includes(id)) return true
  if (assignUniqueCheck.value.overreach.some(o => o.permissionId === id)) return true
  return false
}

const handleAssignDialogOpen = () => {
  assignStep.value = 1
  assignForm.userId = null
  assignForm.roleId = null
  assignForm.permissionIds = []
  assignForm.reason = ''
  assignUserStatusCheck.value = null
  matchCheckResult.value = null
  assignUniqueCheck.value = null
  userOptions.value = []
  assignDialogVisible.value = true
}

const handleAssignOne = (row: UserPermRow) => {
  if (row.statusCheck?.level === 'error') {
    ElMessage.warning(row.statusCheck.reason || '账号状态异常，禁止操作')
    return
  }
  assignStep.value = 1
  assignForm.userId = row.id
  assignForm.roleId = row.roleId
  assignForm.permissionIds = []
  assignForm.reason = ''
  assignDialogVisible.value = true
  nextTick(async () => {
    await handleAssignUserChange(row.id)
    if (row.roleId) {
      await handleAssignRoleChange(row.roleId)
    }
  })
}

const handleAssignDialogClosed = () => {
  assignForm.userId = null
  assignForm.roleId = null
  assignForm.permissionIds = []
  assignForm.reason = ''
  assignUserStatusCheck.value = null
  matchCheckResult.value = null
  assignUniqueCheck.value = null
}

const handleAssignSubmit = async () => {
  if (!assignForm.userId || !assignForm.roleId) return
  try {
    await ElMessageBox.confirm(
      `确定为该账号执行以下操作：\n1. 分配角色角色\n${assignForm.permissionIds.length ? '2. 附加' + assignForm.permissionIds.length + '项权限' : ''}\n操作将立即生效。`,
      '二次确认',
      { confirmButtonText: '确认生效', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  submitLoading.value = true
  try {
    if (assignForm.roleId) {
      const roleRes = await assignRoleToUser({
        userId: assignForm.userId, roleId: assignForm.roleId!, reason: assignForm.reason || '权限分配'
      })
      rolePermIdsCache.value = new Set((roleRes.data?.rolePermissions || []).map((p: any) => p.id))
    }
    if (assignForm.permissionIds.length > 0) {
      await addDirectPermissions({
        userId: assignForm.userId, permissionIds: assignForm.permissionIds, reason: assignForm.reason
      })
    }
    ElMessage({
      message: '权限分配成功，已即时生效',
      type: 'success',
      customClass: 'success-toast-green'
    })
    assignDialogVisible.value = false
    fetchUsers()
  } catch (e: any) {
    ElMessage.error(e.message || '分配失败')
  } finally {
    submitLoading.value = false
  }
}

// ================ 查看详情 ================

const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<UserPermDetail | null>(null)

const handleViewDetail = async (row: UserPermRow) => {
  detailLoading.value = true
  detailDialogVisible.value = true
  try {
    const res = await getUserPermissionDetail(row.id)
    detailData.value = res.data
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  } finally {
    detailLoading.value = false
  }
}

// ================ 功能点3：批量分配 ================

const batchDialogVisible = ref(false)
const batchUserList = computed(() => selectedUsers.value)
const validBatchUsers = computed(() =>
  batchUserList.value.filter(u => u.statusCheck?.level !== 'error' && u.role !== 'super_admin')
)
const invalidBatchUsers = computed(() =>
  batchUserList.value.filter(u => u.statusCheck?.level === 'error' || u.role === 'super_admin')
)
const batchPermTreeRef = ref()
const batchSelectedPermIds = ref<number[]>([])
const batchForm = reactive({ roleId: null as number | null, reason: '' })
const batchProgress = reactive({ show: false, percentage: 0, status: '' as '' | 'success' | 'warning' | 'exception', text: '' })

const handleBatchDialogOpen = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择要分配的账号')
    return
  }
  batchForm.roleId = null
  batchForm.reason = ''
  batchSelectedPermIds.value = []
  batchProgress.show = false
  batchDialogVisible.value = true
  await nextTick()
  if (batchPermTreeRef.value) {
    batchPermTreeRef.value.setCheckedKeys([])
    batchPermTreeRef.value.setCheckedNodes([])
  }
}

const handleBatchPermCheck = () => {
  const tree = batchPermTreeRef.value
  if (!tree) return
  batchSelectedPermIds.value = tree.getCheckedKeys(false) as number[]
}

const handleBatchSubmit = async () => {
  const validIds = validBatchUsers.value.map(u => u.id)
  if (validIds.length === 0) {
    ElMessage.warning('无可操作的合规账号')
    return
  }
  submitLoading.value = true
  batchProgress.show = true
  batchProgress.percentage = 10
  batchProgress.text = `正在为 ${validIds.length} 个账号执行分配...`
  try {
    const res = await batchAssignPermissions({
      userIds: validIds,
      roleId: batchForm.roleId || undefined,
      permissionIds: batchSelectedPermIds.value.length ? batchSelectedPermIds.value : undefined,
      reason: batchForm.reason
    })
    const r = res.data
    batchProgress.percentage = 100
    batchProgress.status = r.success?.length === validIds.length ? 'success' : 'warning'
    batchProgress.text = `完成：成功${r.success?.length || 0}，跳过${r.skipped?.length || 0}，失败${r.failed?.length || 0}`
    if (r.failed?.length) {
      ElMessage.warning(`部分账号失败: ${r.failed.slice(0, 3).map((f: any) => f.reason).join('; ')}`)
    } else {
      ElMessage.success('批量分配完成')
    }
    fetchUsers()
  } catch (e: any) {
    batchProgress.percentage = 100
    batchProgress.status = 'exception'
    batchProgress.text = e.message || '执行失败'
    ElMessage.error(e.message || '批量分配失败')
  } finally {
    submitLoading.value = false
  }
}

// ================ 功能点4：唯一性校验溯源 ================

const traceDialogVisible = ref(false)
const traceLoading = ref(false)
const traceSearched = ref(false)
const traceResult = ref<UserPermTraceResult | null>(null)
const traceForm = reactive({ userId: null as number | null })
const traceUserOptions = ref<UserSelectOption[]>([])
const searchTraceLoading = ref(false)

const scoreClass = computed(() => {
  const s = traceResult.value?.validation.score || 0
  if (s >= 80) return 'score-good'
  if (s >= 60) return 'score-warn'
  return 'score-bad'
})

const searchTraceUsers = async (q: string) => {
  searchTraceLoading.value = true
  try {
    const res = await getUsersForSelect({ keyword: q })
    traceUserOptions.value = res.data || []
  } finally { searchTraceLoading.value = false }
}

const handleTraceSearch = async () => {
  if (!traceForm.userId) {
    ElMessage.warning('请选择账号')
    return
  }
  traceLoading.value = true
  traceSearched.value = true
  try {
    const res = await traceUserPermissions(traceForm.userId)
    traceResult.value = res.data
  } catch (e: any) {
    ElMessage.error(e.message || '校验失败')
    traceResult.value = null
  } finally {
    traceLoading.value = false
  }
}

const handleTraceOne = (row: UserPermRow) => {
  traceForm.userId = row.id
  traceResult.value = null
  traceSearched.value = false
  traceDialogVisible.value = true
  nextTick(() => handleTraceSearch())
}

const handleTraceDialogOpen = () => {
  traceForm.userId = null
  traceResult.value = null
  traceSearched.value = false
  traceDialogVisible.value = true
}

const isTraceAbnormal = (row: UserPermissionItem) => {
  if (!traceResult.value) return false
  const issues = traceResult.value.validation.issues
  return issues.some((i: UserPermValidationIssue) => i.permissionId === row.id)
}

const getAbnormalPermRowClass = ({ row }: { row: UserPermissionItem }) =>
  isTraceAbnormal(row) ? 'row-abnormal-perm' : ''

// ================ 清理冗余 ================

const handleCleanOne = async (row: UserPermRow) => {
  try {
    await ElMessageBox.confirm(
      `将清理账号"${row.username || row.uid}"的冗余权限（角色已继承的重复权限），确定继续？`,
      '清理确认',
      { confirmButtonText: '确认清理', cancelButtonText: '取消', type: 'info' }
    )
  } catch { return }
  try {
    const res = await cleanRedundantPermissions(row.id)
    if (res.data.cleanedCount > 0) {
      ElMessage.success(`已清理${res.data.cleanedCount}个冗余权限`)
    } else {
      ElMessage.info('未发现冗余权限')
    }
    fetchUsers()
  } catch (e: any) {
    ElMessage.error(e.message || '清理失败')
  }
}

// ================ 日志 ================

const logDialogVisible = ref(false)
const logLoading = ref(false)
const logList = ref<UserPermLog[]>([])
const logTotal = ref(0)
const logPage = ref(1)
const logFilter = reactive({ changeType: '' })

const fetchLogs = async () => {
  logLoading.value = true
  try {
    const res = await getUserPermissionLogs({
      page: logPage.value, pageSize: 20,
      changeType: logFilter.changeType || undefined
    })
    logList.value = res.data.list || []
    logTotal.value = res.data.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '获取日志失败')
  } finally { logLoading.value = false }
}

const handleLogDialogOpen = () => {
  logPage.value = 1
  logFilter.changeType = ''
  logDialogVisible.value = true
  fetchLogs()
}

onMounted(() => {
  fetchUsers()
  fetchPermissionTree()
  fetchAllRoles()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.user-permission-page { padding: 16px; }

.card-wrapper {
  background: $bg-color-ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.filter-form { :deep(.el-form-item) { margin-bottom: 0; } }

.table-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
  .toolbar-left { display: flex; gap: 8px; flex-wrap: wrap;
    :deep(.el-button) { border-radius: 8px; }
  }
  .toolbar-stats .stat-item { color: $text-secondary; font-size: 13px; b { color: $primary-color; } }
}

.perm-count { color: $primary-color; font-weight: 600; }

.row-selected-highlight { background: rgba(64, 158, 255, 0.08) !important; }
.row-status-error { background: rgba(245, 108, 108, 0.06) !important; }
.row-abnormal-perm { background: rgba(245, 108, 108, 0.1) !important; }

// 分配弹窗步骤
.assign-step-bar {
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
  .step-node {
    display: flex; align-items: center; gap: 8px;
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%;
      background: #dcdfe6; color: #fff; display: flex;
      align-items: center; justify-content: center; font-weight: 600;
      transition: all 0.3s;
    }
    .step-name { font-size: 14px; color: $text-secondary; font-weight: 500; }
    &.active .step-dot { background: $primary-color; }
    &.active .step-name { color: $text-primary; }
    &.done .step-dot { background: $color-success; }
    &.done .step-name { color: $color-success; }
  }
  .step-line {
    width: 80px; height: 2px; background: #dcdfe6; margin: 0 12px;
    transition: background 0.3s;
    &.done { background: $color-success; }
  }
}

.step-panel { min-height: 300px; }

.step-form { :deep(.el-select) { } }

.slide-fade { animation: slideFade 0.3s ease; }
@keyframes slideFade {
  0% { opacity: 0; transform: translateX(20px); }
  100% { opacity: 1; transform: translateX(0); }
}

// 用户选择器
.user-select-input {
  :deep(.el-select__wrapper) {
    transition: all 0.3s;
    &.is-focused {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3),
                  0 0 12px rgba(64, 158, 255, 0.2);
      border-color: $primary-color;
    }
  }
}

.user-option-item {
  display: flex; align-items: center; gap: 8px;
  .user-option-meta { color: $text-secondary; font-size: 12px; }
}

.status-alert { margin-bottom: 16px; }
.match-alert { margin-bottom: 12px;
  .match-issue-item {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 0; border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
    &:last-child { border-bottom: none; }
    .issue-text { flex: 1; }
    .issue-perms { color: rgba(255, 255, 255, 0.9); font-size: 12px; }
  }
}

.shake-anim { animation: shakeAnim 0.6s ease; }
@keyframes shakeAnim {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}

.dialog-footer { display: flex; justify-content: flex-end; gap: 8px; }

.ripple-btn {
  position: relative; overflow: hidden;
  &::after {
    content: '';
    position: absolute; top: 50%; left: 50%;
    width: 0; height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: translate(-50%, -50%);
    transition: all 0.5s;
  }
  &:active::after { width: 200px; height: 200px; opacity: 0; }
}

// 权限树
.perm-tree-container {
  max-height: 300px; overflow-y: auto;
  border: 1px solid #ebeef5; border-radius: 4px; padding: 8px;
  &.batch-tree { max-height: 220px; }
}
.perm-tree {
  width: 100%;
  .perm-tree-node {
    display: inline-flex; align-items: center; gap: 6px; font-size: 13px;
    &.abnormal-highlight {
      color: $color-danger;
      background: rgba(245, 108, 108, 0.12);
      padding: 0 6px; border-radius: 4px;
      font-weight: 600;
    }
    .core-tag { margin-left: 4px; }
    .level-tag { }
    .inherit-tag { margin-left: 4px; }
  }
}

.success-toast-green { :deep(.el-message) { background: #f0f9eb !important; } }

.detail-meta { margin-left: 8px; color: $text-secondary; font-size: 12px; }
.section-title {
  font-size: 14px; font-weight: 600; margin: 16px 0 8px;
  padding-left: 8px; border-left: 3px solid $primary-color;
}

// 批量弹窗
.batch-summary {
  display: flex; gap: 32px; padding: 16px;
  background: #f5f7fa; border-radius: 8px; margin-bottom: 16px;
  .batch-item {
    display: flex; align-items: baseline; gap: 4px;
    .batch-label { color: $text-secondary; font-size: 13px; }
    .batch-value { font-size: 24px; font-weight: 700;
      &.highlight { color: $primary-color; }
      &.success { color: $color-success; }
      &.danger { color: $color-danger; }
    }
    .batch-meta { color: $text-secondary; font-size: 12px; }
  }
}
.batch-alert { margin-bottom: 12px; }
.batch-progress-wrap { margin-top: 16px;
  .batch-progress-text { margin-top: 6px; font-size: 12px; color: $text-secondary; }
}

// 溯源弹窗
.trace-search { margin-bottom: 16px; }

.score-card {
  display: flex; gap: 24px; padding: 20px;
  margin-bottom: 16px; background: linear-gradient(135deg, #f0f9ff, #ffffff);
  .score-left {
    .score-circle {
      width: 90px; height: 90px; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-size: 32px; font-weight: 700; color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      .score-unit { font-size: 12px; font-weight: 500; }
    }
    .score-good { background: linear-gradient(135deg, #67c23a, #85ce61); }
    .score-warn { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
    .score-bad { background: linear-gradient(135deg, #f56c6c, #f89898); }
  }
  .score-right {
    flex: 1;
    h3 { margin: 0 0 8px; font-size: 16px; font-weight: 600; }
    .score-meta { display: flex; gap: 12px; margin-bottom: 12px; b { color: $primary-color; } }
    .score-stats { display: flex; gap: 24px;
      .stat { font-size: 13px; color: $text-secondary;
        b { font-size: 16px; margin-left: 4px; }
        &.danger b { color: $color-danger; }
        &.warning b { color: #e6a23c; }
        &.info b { color: #909399; }
      }
    }
  }
}

.trace-collapse { margin-bottom: 8px; }

.issue-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; margin-bottom: 6px;
  background: #fff; border-left: 3px solid #dcdfe6;
  border-radius: 4px;
  &.severity-high { border-left-color: $color-danger; background: rgba(245, 108, 108, 0.04); }
  &.severity-medium { border-left-color: #e6a23c; background: rgba(230, 162, 60, 0.04); }
  &.severity-low { border-left-color: #909399; }

  .issue-sev-tag {
    padding: 1px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;
    &.sev-high { background: rgba(245, 108, 108, 0.12); color: $color-danger; }
    &.sev-medium { background: rgba(230, 162, 60, 0.12); color: #e6a23c; }
    &.sev-low { background: rgba(144, 147, 153, 0.12); color: #909399; }
  }
  .issue-desc { flex: 1; font-size: 13px; }
}

.sub-title {
  font-size: 13px; font-weight: 600; margin: 12px 0 8px;
  color: $text-regular;
}

.empty-tips {
  padding: 24px; text-align: center; color: $color-success;
  .success-icon { font-size: 32px; margin-right: 8px; vertical-align: middle; }
}

.role-change {
  display: flex; align-items: center; gap: 6px; font-size: 12px;
  .old-role { color: $color-danger; text-decoration: line-through; }
  .change-arrow { color: $text-secondary; }
  .new-role { color: $color-success; font-weight: 600; }
}
.role-change-mini {
  display: flex; align-items: center; gap: 4px; font-size: 12px;
  .old { color: $text-secondary; text-decoration: line-through; }
  .arrow { color: $text-secondary; }
  .new { color: $primary-color; font-weight: 500; }
}

// 日志
.log-filter { :deep(.el-form-item) { margin-bottom: 0; } }
.log-meta { display: block; font-size: 11px; color: $text-secondary; }
.log-pagination { margin-top: 12px; text-align: right; }

.text-success { color: $color-success; font-weight: 600; }
.text-danger { color: $color-danger; font-weight: 600; }

// 骨架屏
.skeleton-wrap {
  padding: 16px;
  .skeleton-item {
    display: flex; gap: 12px; margin-bottom: 16px;
    .skeleton-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeletonLoad 1.5s infinite;
    }
    .skeleton-lines { flex: 1; }
    .skeleton-line {
      height: 14px; border-radius: 4px; margin-bottom: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeletonLoad 1.5s infinite;
      &.long { width: 80%; }
      &.medium { width: 60%; }
      &.short { width: 40%; }
    }
  }
}

@keyframes skeletonLoad {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.perm-name-tag { margin-left: auto; }
</style>
