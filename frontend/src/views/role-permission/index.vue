<template>
  <div class="role-permission-page">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="角色名称/编码" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="角色类型">
          <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in RoleTypeOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="item in RoleStatusOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchRoles">搜索</el-button>
          <el-button :icon="Refresh" @click="handleResetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card card-wrapper">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAddRole">新增角色</el-button>
          <el-button type="warning" :icon="CopyDocument" :disabled="selectedRoles.length === 0" @click="handleBatchCopyOpen">批量复制模板</el-button>
          <el-button type="warning" :icon="Edit" :disabled="selectedRoles.length === 0" @click="handleBatchModifyOpen">批量修改权限</el-button>
          <el-button type="info" :icon="DataAnalysis" @click="handleTraceOpen">溯源校验</el-button>
          <el-button type="success" :icon="SetUp" @click="handleInitData">初始化权限数据</el-button>
        </div>
      </div>

      <DataTable
        :data="roleList"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        show-selection
        @selection-change="handleRoleSelection"
        @refresh="fetchRoles"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="角色名称" width="140">
          <template #default="{ row }">
            <span class="role-name-link" @click="handleViewRole(row)">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="角色编码" width="140" />
        <el-table-column label="角色类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="RoleTypeTagType[row.type] || 'info'" size="small" effect="dark">
              {{ RoleTypeLabel[row.type] || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="层级" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限数" width="80" align="center">
          <template #default="{ row }">{{ row.permCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="绑定用户" width="90" align="center">
          <template #default="{ row }">{{ row.boundUserCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="系统内置" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isSystem" type="danger" size="small" effect="dark">是</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEditRole(row)">编辑权限</el-button>
            <el-button type="info" link size="small" @click="handleViewRole(row)">查看详情</el-button>
            <el-button type="success" link size="small" @click="handleTraceOne(row)">溯源</el-button>
            <el-tooltip v-if="row.isSystem" content="系统内置角色禁止删除" placement="top" :show-after="200">
              <el-button type="danger" link size="small" :disabled="true">删除</el-button>
            </el-tooltip>
            <el-button v-else type="danger" link size="small" @click="handleDeleteRole(row)">删除</el-button>
          </template>
        </el-table-column>
      </DataTable>
    </div>

    <el-dialog v-model="createDialogVisible" title="新增角色" width="680px" @closed="handleCreateDialogClosed" class="create-dialog">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <div class="validated-input-wrap">
            <el-input
              v-model="createForm.name"
              placeholder="请输入角色名称"
              class="focus-scale-input"
              @blur="validateCreateField('name')"
            />
            <el-icon v-if="nameValidation.valid && createForm.name" class="check-icon success"><CircleCheckFilled /></el-icon>
            <el-icon v-if="!nameValidation.valid && nameValidation.reason" class="check-icon error"><CircleCloseFilled /></el-icon>
          </div>
          <div v-if="!nameValidation.valid && nameValidation.reason" class="field-error">{{ nameValidation.reason }}</div>
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <div class="validated-input-wrap">
            <el-input
              v-model="createForm.code"
              placeholder="小写字母、数字、下划线"
              class="focus-scale-input"
              @blur="validateCreateField('code')"
            />
            <el-icon v-if="codeValidation.valid && createForm.code" class="check-icon success"><CircleCheckFilled /></el-icon>
            <el-icon v-if="!codeValidation.valid && codeValidation.reason" class="check-icon error"><CircleCloseFilled /></el-icon>
          </div>
          <div v-if="!codeValidation.valid && codeValidation.reason" class="field-error">{{ codeValidation.reason }}</div>
        </el-form-item>
        <el-form-item label="角色类型" prop="type">
          <el-select v-model="createForm.type" placeholder="请选择角色类型" style="width: 100%">
            <el-option v-for="item in RoleTypeOption.filter(o => o.value)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色层级" prop="level">
          <el-input-number v-model="createForm.level" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="角色描述" />
        </el-form-item>
        <el-form-item label="权限配置">
          <div class="perm-tree-container">
            <el-alert v-if="configValidation.errors.length" type="error" :closable="false" class="perm-alert">
              <template v-for="err in configValidation.errors" :key="err">
                <div>{{ err }}</div>
              </template>
            </el-alert>
            <el-tree
              ref="createPermTreeRef"
              :data="permissionTree"
              show-checkbox
              node-key="id"
              :default-checked-keys="createForm.permissionIds"
              :props="{ children: 'children', label: 'name' }"
              @check="handleCreatePermCheck"
              class="perm-tree"
            >
              <template #default="{ data }">
                <span class="perm-tree-node" :class="{ 'conflict-node': isConflictNode(data.id) }">
                  <span>{{ data.name }}</span>
                  <el-tag v-if="data.isCore" size="small" type="danger" effect="dark" class="core-tag">核心</el-tag>
                  <el-tag :type="PermMenuLevelTagType[data.level]" size="small" class="level-tag">
                    {{ PermMenuLevelLabel[data.level] }}
                  </el-tag>
                  <span v-if="data.mutexGroup" class="mutex-badge">互斥</span>
                  <span v-if="isConflictNode(data.id)" class="conflict-badge">冲突</span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="configValidation.errors.length > 0" @click="handleCreateSubmit">确认创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" :title="'编辑角色权限 - ' + (editRole?.name || '')" width="780px" @closed="handleEditDialogClosed" class="edit-dialog">
      <div class="edit-steps">
        <div class="step-indicator" :class="{ active: editStep === 1, completed: editStep > 1 }" @click="editStep = 1">
          <span class="step-num">1</span>
          <span class="step-label">基础信息</span>
        </div>
        <div class="step-line" :class="{ active: editStep > 1 }"></div>
        <div class="step-indicator" :class="{ active: editStep === 2 }">
          <span class="step-num">2</span>
          <span class="step-label">权限配置</span>
        </div>
      </div>

      <div class="edit-step-content">
        <div v-show="editStep === 1" class="step-panel">
          <el-form :model="editForm" label-width="100px">
            <el-form-item label="角色名称">
              <div class="validated-input-wrap">
                <el-input
                  v-model="editForm.name"
                  class="focus-scale-input"
                  @blur="validateEditNameField"
                />
                <el-icon v-if="editNameValidation.valid && editForm.name" class="check-icon success"><CircleCheckFilled /></el-icon>
                <el-icon v-if="!editNameValidation.valid && editNameValidation.reason" class="check-icon error"><CircleCloseFilled /></el-icon>
              </div>
              <div v-if="!editNameValidation.valid && editNameValidation.reason" class="field-error">{{ editNameValidation.reason }}</div>
            </el-form-item>
            <el-form-item label="角色层级">
              <el-input-number v-model="editForm.level" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="editForm.description" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
        </div>

        <div v-show="editStep === 2" class="step-panel">
          <el-alert v-if="editRole?.isSystem && editRole?.type === 'super_admin'" title="超级管理员权限禁止自定义修改" type="error" :closable="false" show-icon class="perm-alert" />
          <el-alert v-if="(editRole?.boundUserCount ?? 0) > 0" :title="`该角色已绑定${editRole?.boundUserCount}个用户，核心权限禁止删除`" type="warning" :closable="false" show-icon class="perm-alert" />
          <el-alert v-if="editConfigValidation.errors.length" type="error" :closable="false" class="perm-alert">
            <template v-for="err in editConfigValidation.errors" :key="err">
              <div>{{ err }}</div>
            </template>
          </el-alert>
          <div class="perm-tree-container">
            <el-tree
              ref="editPermTreeRef"
              :data="permissionTree"
              show-checkbox
              node-key="id"
              :default-checked-keys="editForm.permissionIds"
              :props="{ children: 'children', label: 'name' }"
              @check="handleEditPermCheck"
              class="perm-tree"
            >
              <template #default="{ data }">
                <span class="perm-tree-node" :class="{ 'conflict-node': isEditConflictNode(data.id) }">
                  <span>{{ data.name }}</span>
                  <el-tag v-if="data.isCore" size="small" type="danger" effect="dark" class="core-tag">核心</el-tag>
                  <el-tag :type="PermMenuLevelTagType[data.level]" size="small" class="level-tag">
                    {{ PermMenuLevelLabel[data.level] }}
                  </el-tag>
                  <span v-if="data.mutexGroup" class="mutex-badge">互斥</span>
                  <span v-if="isEditConflictNode(data.id)" class="conflict-badge">冲突</span>
                </span>
              </template>
            </el-tree>
          </div>
          <el-form-item label="变更原因" style="margin-top: 12px;">
            <el-input v-model="editForm.reason" type="textarea" :rows="2" placeholder="请填写变更原因" />
          </el-form-item>
        </div>
      </div>

      <template #footer>
        <div class="edit-dialog-footer">
          <el-button v-if="editStep > 1" @click="editStep--">上一步</el-button>
          <el-button v-if="editStep < 2" type="primary" @click="editStep++">下一步</el-button>
          <el-button v-if="editStep === 2" type="primary" :loading="submitLoading" :disabled="editConfigValidation.errors.length > 0" @click="handleEditSubmit">
            确认修改
          </el-button>
          <el-button @click="editDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" :title="'角色详情 - ' + (detailData?.name || '')" width="800px" class="detail-dialog">
      <div v-if="detailData" v-loading="detailLoading">
        <el-descriptions title="角色信息" :column="2" border size="small" class="detail-desc">
          <el-descriptions-item label="角色名称">{{ detailData.name }}</el-descriptions-item>
          <el-descriptions-item label="角色编码">{{ detailData.code }}</el-descriptions-item>
          <el-descriptions-item label="角色类型">
            <el-tag :type="RoleTypeTagType[detailData.type] || 'info'" size="small" effect="dark">
              {{ RoleTypeLabel[detailData.type] || detailData.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="层级">{{ detailData.level }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailData.status === 'active' ? 'success' : 'info'" size="small">
              {{ detailData.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="系统内置">{{ detailData.isSystem ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ detailData.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title">权限列表 ({{ detailData.permissions?.length || 0 }}项)</h4>
        <el-table :data="detailData.permissions" max-height="250" size="small" class="detail-perm-table">
          <el-table-column prop="name" label="权限名称" width="140" />
          <el-table-column prop="code" label="权限编码" width="160" />
          <el-table-column label="层级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="PermMenuLevelTagType[row.level]" size="small">{{ PermMenuLevelLabel[row.level] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="核心权限" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isCore" type="danger" size="small">核心</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
        </el-table>

        <h4 class="section-title">绑定用户 ({{ detailData.boundUsers?.length || 0 }}人)</h4>
        <el-table v-if="detailData.boundUsers?.length" :data="detailData.boundUsers" max-height="200" size="small">
          <el-table-column prop="uid" label="UID" width="140" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="nickname" label="昵称" width="120" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '正常' : row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <EmptyState v-else description="暂无绑定用户" />
      </div>
    </el-dialog>

    <el-dialog v-model="batchCopyDialogVisible" title="批量复制角色权限模板" width="560px" class="batch-dialog">
      <el-alert title="批量复制将使用源角色的权限配置覆盖目标角色的附属权限，核心权限保持不变" type="warning" :closable="false" show-icon class="batch-alert" />
      <el-form :model="batchCopyForm" label-width="100px" style="margin-top: 16px;">
        <el-form-item label="源角色" required>
          <el-select v-model="batchCopyForm.sourceRoleId" placeholder="选择源角色" style="width: 100%">
            <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标角色" required>
          <el-select v-model="batchCopyForm.targetRoleIds" multiple placeholder="选择目标角色" style="width: 100%">
            <el-option v-for="r in roleList.filter(r => r.id !== batchCopyForm.sourceRoleId && !r.isSystem)" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div v-if="batchProgress.show" class="batch-progress">
        <el-progress :percentage="batchProgress.percentage" :status="batchProgress.status" />
        <span class="batch-progress-text">{{ batchProgress.text }}</span>
      </div>
      <template #footer>
        <el-button @click="batchCopyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="!batchCopyForm.sourceRoleId || batchCopyForm.targetRoleIds.length === 0" @click="handleBatchCopySubmit">
          确认复制
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchModifyDialogVisible" title="批量修改角色权限" width="560px" class="batch-dialog">
      <el-alert title="核心权限禁止批量修改，系统将自动保留目标角色的核心权限" type="warning" :closable="false" show-icon class="batch-alert" />
      <div class="batch-selected-info">
        已选择 <em>{{ selectedRoles.length }}</em> 个角色
      </div>
      <el-form label-width="100px" style="margin-top: 16px;">
        <el-form-item label="附属权限">
          <div class="perm-tree-container batch-tree">
            <el-tree
              ref="batchPermTreeRef"
              :data="permissionTreeNoCore"
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
      <div v-if="batchProgress.show" class="batch-progress">
        <el-progress :percentage="batchProgress.percentage" :status="batchProgress.status" />
        <span class="batch-progress-text">{{ batchProgress.text }}</span>
      </div>
      <template #footer>
        <el-button @click="batchModifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="batchModifyPermissionIds.length === 0" @click="handleBatchModifySubmit">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="traceDialogVisible" title="角色权限溯源校验" width="900px" class="trace-dialog">
      <div class="trace-search">
        <el-form :inline="true" :model="traceForm" class="trace-search-form">
          <el-form-item label="角色">
            <el-select v-model="traceForm.roleId" placeholder="选择角色" clearable style="width: 200px" filterable>
              <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" :loading="traceLoading" @click="handleTraceSearch">检索</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="traceLoading" class="skeleton-wrap">
        <div v-for="i in 2" :key="i" class="skeleton-item">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
          </div>
        </div>
      </div>

      <div v-else-if="traceResult" class="trace-result">
        <div class="trace-role-card">
          <div class="trace-role-header">
            <el-tag :type="RoleTypeTagType[traceResult.role.type] || 'info'" effect="dark" size="large">
              {{ traceResult.role.name }}
            </el-tag>
            <span class="trace-role-meta">编码: {{ traceResult.role.code }} | 层级: {{ traceResult.role.level }}</span>
          </div>
          <el-descriptions :column="2" border size="small" class="trace-desc">
            <el-descriptions-item label="权限数量">{{ traceResult.permissions.length }}</el-descriptions-item>
            <el-descriptions-item label="绑定用户">{{ traceResult.boundUsers.length }}</el-descriptions-item>
            <el-descriptions-item label="合规评分">
              <span :class="{ 'score-danger': traceResult.compliance.score < 60, 'score-warning': traceResult.compliance.score >= 60 && traceResult.compliance.score < 80, 'score-success': traceResult.compliance.score >= 80 }">
                {{ traceResult.compliance.score }}分
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="合规状态">
              <el-tag :type="traceResult.compliance.consistent ? 'success' : 'danger'" size="small">
                {{ traceResult.compliance.consistent ? '合规' : '存在异常' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="traceResult.compliance.issues.length" class="compliance-issues">
            <h4 class="section-title">合规问题</h4>
            <div v-for="(issue, idx) in traceResult.compliance.issues" :key="idx" class="compliance-issue-item" :class="'severity-' + issue.severity">
              <el-tag :type="ComplianceIssueSeverityTagType[issue.severity]" size="small" effect="dark">
                {{ ComplianceIssueTypeLabel[issue.type] || issue.type }}
              </el-tag>
              <span class="issue-desc">{{ issue.description }}</span>
              <el-tooltip :content="issue.fields.join(', ')" placement="top" :show-after="100">
                <el-tag size="small" type="info" class="issue-fields-tag">{{ issue.fields.length }}个字段</el-tag>
              </el-tooltip>
            </div>
          </div>
        </div>

        <el-collapse v-if="traceResult.logs.length" class="trace-logs-collapse">
          <el-collapse-item :title="'配置历史 (' + traceResult.logs.length + '条)'">
            <el-table :data="traceResult.logs" max-height="300" size="small">
              <el-table-column label="变更类型" width="110">
                <template #default="{ row }">
                  <el-tag :type="PermChangeTypeTagType[row.changeType]" size="small">
                    {{ PermChangeTypeLabel[row.changeType] || row.changeType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="operatorName" label="操作人" width="100" />
              <el-table-column label="新增权限" width="80" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.addedPermissions?.length" size="small" type="success">+{{ row.addedPermissions.length }}</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="移除权限" width="80" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.removedPermissions?.length" size="small" type="danger">-{{ row.removedPermissions.length }}</el-tag>
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
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>

        <div v-if="traceResult.boundUsers.length" class="trace-bound-users">
          <h4 class="section-title">绑定用户清单</h4>
          <el-table :data="traceResult.boundUsers" max-height="200" size="small">
            <el-table-column prop="uid" label="UID" width="140" />
            <el-table-column prop="username" label="用户名" width="120" />
            <el-table-column prop="nickname" label="昵称" width="120" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                  {{ row.status === 'active' ? '正常' : row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="注册时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <EmptyState v-else-if="traceSearched" description="未检索到匹配的角色信息" />
    </el-dialog>

    <el-dialog v-model="logDialogVisible" title="权限配置日志" width="800px" class="log-dialog">
      <el-form :inline="true" :model="logFilter" class="log-filter-form">
        <el-form-item label="变更类型">
          <el-select v-model="logFilter.changeType" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="(label, key) in PermChangeTypeLabel" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="logList" v-loading="logLoading" max-height="400" size="small" @row-dblclick="handleLogRowDblClick">
        <el-table-column prop="roleName" label="角色" width="120" />
        <el-table-column label="变更类型" width="110">
          <template #default="{ row }">
            <el-tag :type="PermChangeTypeTagType[row.changeType]" size="small">
              {{ PermChangeTypeLabel[row.changeType] || row.changeType }}
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
        <el-table-column prop="operatorName" label="操作人" width="90" />
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
      <div class="log-pagination" v-if="logTotal > 0">
        <el-pagination v-model:current-page="logPage" :page-size="20" :total="logTotal" layout="total, prev, pager, next" @current-change="fetchLogs" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Plus, Edit, CopyDocument,
  DataAnalysis, SetUp, CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import DataTable from '@/components/business/DataTable/index.vue'
import EmptyState from '@/components/business/EmptyState/index.vue'
import {
  RoleTypeLabel, RoleTypeTagType, RoleStatusOption, RoleTypeOption,
  PermMenuLevelLabel, PermMenuLevelTagType,
  PermChangeTypeLabel, PermChangeTypeTagType,
  ComplianceIssueTypeLabel, ComplianceIssueSeverityTagType
} from '@/constants'
import {
  getRoleList, getRoleDetail, createRole, updateRolePermissions, deleteRole,
  getPermissionMenuTree, validateRoleName, validateRoleCode, validatePermissionConfig,
  batchCopyTemplate, batchModifyPermissions, traceRole, getPermissionLogs, initDefaultData
} from '@/api/rolePermission'
import type {
  RoleItem, RoleDetail, PermissionMenu, ValidateConfigResult,
  TraceRoleResult, RolePermissionLog, PermissionConflict
} from '@/types'

const loading = ref(false)
const roleList = ref<RoleItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedRoles = ref<RoleItem[]>([])

const filterForm = reactive({ keyword: '', type: '', status: '' })

const permissionTree = ref<PermissionMenu[]>([])
const permissionTreeNoCore = computed(() => filterCoreFromTree(permissionTree.value))

function filterCoreFromTree(nodes: PermissionMenu[]): PermissionMenu[] {
  return nodes
    .filter(n => !n.isCore)
    .map(n => ({
      ...n,
      children: n.children ? filterCoreFromTree(n.children) : []
    }))
    .filter(n => !n.children || n.children.length > 0 || !n.isCore)
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await getRoleList({
      page: page.value,
      pageSize: pageSize.value,
      ...filterForm
    })
    roleList.value = res.data.list || []
    total.value = res.data.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const fetchPermissionTree = async () => {
  try {
    const res = await getPermissionMenuTree()
    permissionTree.value = res.data || []
  } catch (e: any) {
    console.error('获取权限菜单树失败', e)
  }
}

const handleResetFilter = () => {
  filterForm.keyword = ''
  filterForm.type = ''
  filterForm.status = ''
  page.value = 1
  fetchRoles()
}

const handleRoleSelection = (rows: RoleItem[]) => {
  selectedRoles.value = rows
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

// ================ 功能点1：新增角色 ================

const createDialogVisible = ref(false)
const submitLoading = ref(false)
const createFormRef = ref()
const createPermTreeRef = ref()

const createForm = reactive({
  name: '',
  code: '',
  type: 'member',
  level: 0,
  description: '',
  permissionIds: [] as number[]
})

const createRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择角色类型', trigger: 'change' }]
}

const nameValidation = ref<{ valid: boolean; reason?: string }>({ valid: true })
const codeValidation = ref<{ valid: boolean; reason?: string }>({ valid: true })
const configValidation = ref<ValidateConfigResult>({ valid: true, errors: [], conflicts: [], adaptIssues: [] })
const conflictPermIds = ref<Set<number>>(new Set())

const isConflictNode = (id: number) => conflictPermIds.value.has(id)

const validateCreateField = async (field: 'name' | 'code') => {
  if (field === 'name' && createForm.name) {
    const res = await validateRoleName(createForm.name)
    nameValidation.value = res.data
  }
  if (field === 'code' && createForm.code) {
    const res = await validateRoleCode(createForm.code)
    codeValidation.value = res.data
  }
}

const handleCreatePermCheck = async () => {
  await nextTick()
  const tree = createPermTreeRef.value
  if (!tree) return
  const checkedKeys = tree.getCheckedKeys(false) as number[]
  createForm.permissionIds = checkedKeys
  await _validateConfig(0, checkedKeys, conflictPermIds, configValidation)
}

const _validateConfig = async (_roleLevel: number, permIds: number[], conflictSet: { value: Set<number> }, resultRef: { value: ValidateConfigResult }) => {
  if (permIds.length === 0) {
    resultRef.value = { valid: true, errors: [], conflicts: [], adaptIssues: [] }
    conflictSet.value = new Set()
    return
  }
  try {
    const res = await validatePermissionConfig(0, permIds)
    const data = res.data
    resultRef.value = data
    const ids = new Set<number>()
    data.conflicts.forEach((c: PermissionConflict) => c.permissions.forEach(p => ids.add(p.id)))
    data.adaptIssues.forEach((i: any) => ids.add(i.permissionId))
    conflictSet.value = ids
  } catch {
    resultRef.value = { valid: true, errors: [], conflicts: [], adaptIssues: [] }
    conflictSet.value = new Set()
  }
}

const handleAddRole = () => {
  createDialogVisible.value = true
  nameValidation.value = { valid: true }
  codeValidation.value = { valid: true }
  configValidation.value = { valid: true, errors: [], conflicts: [], adaptIssues: [] }
  conflictPermIds.value = new Set()
}

const handleCreateDialogClosed = () => {
  createForm.name = ''
  createForm.code = ''
  createForm.type = 'member'
  createForm.level = 0
  createForm.description = ''
  createForm.permissionIds = []
  nameValidation.value = { valid: true }
  codeValidation.value = { valid: true }
  configValidation.value = { valid: true, errors: [], conflicts: [], adaptIssues: [] }
  conflictPermIds.value = new Set()
}

const handleCreateSubmit = async () => {
  if (!nameValidation.value.valid) { ElMessage.warning(nameValidation.value.reason || '角色名称校验未通过'); return }
  if (!codeValidation.value.valid) { ElMessage.warning(codeValidation.value.reason || '角色编码校验未通过'); return }
  if (configValidation.value.errors.length) { ElMessage.warning('请先解决权限配置冲突'); return }
  submitLoading.value = true
  try {
    await createRole({ ...createForm })
    ElMessage.success('角色创建成功')
    createDialogVisible.value = false
    fetchRoles()
  } catch (e: any) {
    ElMessage.error(e.message || '创建失败')
  } finally {
    submitLoading.value = false
  }
}

// ================ 功能点2：编辑角色权限 ================

const editDialogVisible = ref(false)
const editStep = ref(1)
const editRole = ref<RoleItem | null>(null)
const editPermTreeRef = ref()
const editForm = reactive({
  name: '',
  level: 0,
  description: '',
  permissionIds: [] as number[],
  reason: ''
})
const editNameValidation = ref<{ valid: boolean; reason?: string }>({ valid: true })
const editConfigValidation = ref<ValidateConfigResult>({ valid: true, errors: [], conflicts: [], adaptIssues: [] })
const editConflictPermIds = ref<Set<number>>(new Set())

const isEditConflictNode = (id: number) => editConflictPermIds.value.has(id)

const validateEditNameField = async () => {
  if (editForm.name && editRole.value) {
    const res = await validateRoleName(editForm.name, editRole.value.id)
    editNameValidation.value = res.data
  }
}

const handleEditPermCheck = async () => {
  await nextTick()
  const tree = editPermTreeRef.value
  if (!tree) return
  const checkedKeys = tree.getCheckedKeys(false) as number[]
  editForm.permissionIds = checkedKeys
  if (editRole.value) {
    await _validateConfig(editRole.value.level, checkedKeys, editConflictPermIds, editConfigValidation)
  }
}

const handleEditRole = async (row: RoleItem) => {
  editRole.value = row
  editStep.value = 1
  editNameValidation.value = { valid: true }
  editConfigValidation.value = { valid: true, errors: [], conflicts: [], adaptIssues: [] }
  editConflictPermIds.value = new Set()
  try {
    const res = await getRoleDetail(row.id)
    const detail = res.data
    editForm.name = detail.name
    editForm.level = detail.level
    editForm.description = detail.description || ''
    editForm.permissionIds = detail.permissions?.map((p: PermissionMenu) => p.id) || []
    editForm.reason = ''
    editDialogVisible.value = true
    await nextTick()
    if (editPermTreeRef.value) {
      editPermTreeRef.value.setCheckedKeys(editForm.permissionIds)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '获取角色详情失败')
  }
}

const handleEditDialogClosed = () => {
  editStep.value = 1
  editForm.name = ''
  editForm.level = 0
  editForm.description = ''
  editForm.permissionIds = []
  editForm.reason = ''
  editRole.value = null
  editNameValidation.value = { valid: true }
  editConfigValidation.value = { valid: true, errors: [], conflicts: [], adaptIssues: [] }
  editConflictPermIds.value = new Set()
}

const handleEditSubmit = async () => {
  if (!editRole.value) return
  if (!editNameValidation.value.valid) { ElMessage.warning(editNameValidation.value.reason || '角色名称校验未通过'); return }
  if (editConfigValidation.value.errors.length) { ElMessage.warning('请先解决权限配置冲突'); return }
  submitLoading.value = true
  try {
    await updateRolePermissions(editRole.value.id, {
      name: editForm.name,
      level: editForm.level,
      description: editForm.description,
      permissionIds: editForm.permissionIds,
      reason: editForm.reason
    })
    ElMessage.success('权限更新成功')
    editDialogVisible.value = false
    fetchRoles()
  } catch (e: any) {
    ElMessage.error(e.message || '更新失败')
  } finally {
    submitLoading.value = false
  }
}

// ================ 查看角色详情 ================

const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<RoleDetail | null>(null)

const handleViewRole = async (row: RoleItem) => {
  detailLoading.value = true
  detailDialogVisible.value = true
  try {
    const res = await getRoleDetail(row.id)
    detailData.value = res.data
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  } finally {
    detailLoading.value = false
  }
}

// ================ 删除角色 ================

const handleDeleteRole = (row: RoleItem) => {
  ElMessageBox.confirm(`确定删除角色"${row.name}"？该操作不可恢复`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRole(row.id)
      ElMessage.success('删除成功')
      fetchRoles()
    } catch (e: any) {
      ElMessage.error(e.message || '删除失败')
    }
  }).catch(() => {})
}

// ================ 功能点3：批量操作 ================

const batchCopyDialogVisible = ref(false)
const batchCopyForm = reactive({ sourceRoleId: null as number | null, targetRoleIds: [] as number[] })
const batchModifyDialogVisible = ref(false)
const batchModifyPermissionIds = ref<number[]>([])
const batchPermTreeRef = ref()
const batchProgress = reactive({ show: false, percentage: 0, status: '' as '' | 'success' | 'exception', text: '' })

const handleBatchCopyOpen = () => {
  batchCopyForm.sourceRoleId = null
  batchCopyForm.targetRoleIds = []
  batchProgress.show = false
  batchProgress.percentage = 0
  batchProgress.status = ''
  batchProgress.text = ''
  batchCopyDialogVisible.value = true
}

const handleBatchCopySubmit = async () => {
  if (!batchCopyForm.sourceRoleId || batchCopyForm.targetRoleIds.length === 0) return
  submitLoading.value = true
  batchProgress.show = true
  batchProgress.percentage = 10
  batchProgress.text = '正在复制权限模板...'
  try {
    const res = await batchCopyTemplate(batchCopyForm.sourceRoleId!, batchCopyForm.targetRoleIds)
    const result = res.data
    batchProgress.percentage = 100
    batchProgress.status = 'success'
    batchProgress.text = `完成：成功${result.success?.length || 0}个，失败${result.failed?.length || 0}个`
    if (result.failed?.length) {
      ElMessage.warning(`部分角色复制失败: ${result.failed.map((f: any) => f.reason).join('; ')}`)
    } else {
      ElMessage.success('批量复制成功')
    }
    fetchRoles()
  } catch (e: any) {
    batchProgress.percentage = 100
    batchProgress.status = 'exception'
    batchProgress.text = e.message || '复制失败'
    ElMessage.error(e.message || '批量复制失败')
  } finally {
    submitLoading.value = false
  }
}

const handleBatchModifyOpen = () => {
  batchModifyPermissionIds.value = []
  batchProgress.show = false
  batchProgress.percentage = 0
  batchProgress.status = ''
  batchProgress.text = ''
  batchModifyDialogVisible.value = true
}

const handleBatchPermCheck = async () => {
  await nextTick()
  const tree = batchPermTreeRef.value
  if (!tree) return
  batchModifyPermissionIds.value = tree.getCheckedKeys(false) as number[]
}

const handleBatchModifySubmit = async () => {
  const roleIds = selectedRoles.value.filter(r => !r.isSystem).map(r => r.id)
  if (roleIds.length === 0) { ElMessage.warning('无可操作的非系统角色'); return }
  submitLoading.value = true
  batchProgress.show = true
  batchProgress.percentage = 10
  batchProgress.text = '正在批量修改权限...'
  try {
    const res = await batchModifyPermissions(roleIds, batchModifyPermissionIds.value)
    const result = res.data
    batchProgress.percentage = 100
    batchProgress.status = 'success'
    batchProgress.text = `完成：成功${result.success?.length || 0}个，失败${result.failed?.length || 0}个`
    if (result.failed?.length) {
      ElMessage.warning(`部分角色修改失败: ${result.failed.map((f: any) => f.reason).join('; ')}`)
    } else {
      ElMessage.success('批量修改成功')
    }
    fetchRoles()
  } catch (e: any) {
    batchProgress.percentage = 100
    batchProgress.status = 'exception'
    batchProgress.text = e.message || '修改失败'
    ElMessage.error(e.message || '批量修改失败')
  } finally {
    submitLoading.value = false
  }
}

// ================ 功能点4：溯源校验 ================

const traceDialogVisible = ref(false)
const traceLoading = ref(false)
const traceSearched = ref(false)
const traceResult = ref<TraceRoleResult | null>(null)
const traceForm = reactive({ roleId: null as number | null })

const handleTraceOpen = () => {
  traceForm.roleId = null
  traceResult.value = null
  traceSearched.value = false
  traceDialogVisible.value = true
}

const handleTraceSearch = async () => {
  if (!traceForm.roleId) { ElMessage.warning('请选择角色'); return }
  traceLoading.value = true
  traceSearched.value = true
  try {
    const res = await traceRole(traceForm.roleId!)
    traceResult.value = res.data
  } catch (e: any) {
    ElMessage.error(e.message || '溯源查询失败')
    traceResult.value = null
  } finally {
    traceLoading.value = false
  }
}

const handleTraceOne = (row: RoleItem) => {
  traceForm.roleId = row.id
  traceResult.value = null
  traceSearched.value = false
  traceDialogVisible.value = true
  nextTick(() => handleTraceSearch())
}

// ================ 日志 ================

const logDialogVisible = ref(false)
const logLoading = ref(false)
const logList = ref<RolePermissionLog[]>([])
const logTotal = ref(0)
const logPage = ref(1)
const logFilter = reactive({ changeType: '' })

const fetchLogs = async () => {
  logLoading.value = true
  try {
    const res = await getPermissionLogs({
      page: logPage.value,
      pageSize: 20,
      changeType: logFilter.changeType || undefined
    })
    logList.value = res.data.list || []
    logTotal.value = res.data.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取日志失败')
  } finally {
    logLoading.value = false
  }
}

const handleLogRowDblClick = (row: RolePermissionLog) => {
  handleTraceOne({ id: row.roleId, name: row.roleName } as RoleItem)
}

// ================ 初始化 ================

const handleInitData = () => {
  ElMessageBox.confirm('确定初始化角色权限默认数据？已有数据不会被覆盖', '初始化确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await initDefaultData()
      ElMessage.success('初始化完成')
      fetchRoles()
      fetchPermissionTree()
    } catch (e: any) {
      ElMessage.error(e.message || '初始化失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchRoles()
  fetchPermissionTree()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.role-permission-page {
  padding: 16px;
}

.card-wrapper {
  background: $bg-color-ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.filter-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .toolbar-left {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.role-name-link {
  color: $primary-color;
  cursor: pointer;
  &:hover { text-decoration: underline; }
}

.validated-input-wrap {
  position: relative;
  width: 100%;

  .check-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;

    &.success { color: $color-success; }
    &.error { color: $color-danger; }
  }
}

.field-error {
  color: $color-danger;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;
}

.focus-scale-input {
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    transition: box-shadow 0.2s, border-color 0.2s;
    &:focus-within {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }
}

.perm-tree-container {
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
  width: 100%;

  &.batch-tree {
    max-height: 250px;
  }
}

.perm-tree {
  width: 100%;

  .perm-tree-node {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;

    &.conflict-node {
      color: $color-danger;
      background: rgba(245, 108, 108, 0.08);
      padding: 0 4px;
      border-radius: 3px;
    }
  }

  .core-tag { margin-left: 4px; }
  .level-tag { margin-left: 2px; }
  .mutex-badge {
    background: #e6a23c;
    color: #fff;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
  }
  .conflict-badge {
    background: $color-danger;
    color: #fff;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
  }

  :deep(.el-checkbox__input.is-focus .el-checkbox__inner) {
    border-color: $color-danger;
    box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
  }
}

.perm-alert {
  margin-bottom: 12px;
}

.edit-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;

  .step-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    opacity: 0.5;
    transition: all 0.3s;

    &.active { opacity: 1; }
    &.completed { opacity: 0.8; }

    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #dcdfe6;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.3s;
    }

    &.active .step-num { background: $primary-color; }
    &.completed .step-num { background: $color-success; }

    .step-label { font-size: 14px; font-weight: 500; }
  }

  .step-line {
    width: 60px;
    height: 2px;
    background: #dcdfe6;
    margin: 0 12px;
    transition: background 0.3s;

    &.active { background: $color-success; }
  }
}

.edit-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 16px 0 8px;
  padding-left: 8px;
  border-left: 3px solid $primary-color;
}

.detail-desc { margin-bottom: 12px; }
.detail-perm-table { margin-bottom: 12px; }

.batch-alert { margin-bottom: 12px; }
.batch-selected-info {
  font-size: 14px;
  color: $text-regular;
  margin-bottom: 8px;
  em { color: $primary-color; font-style: normal; font-weight: 600; }
}

.batch-progress {
  margin-top: 16px;
  .batch-progress-text {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 4px;
    display: block;
  }
}

.trace-search { margin-bottom: 16px; }
.trace-search-form {
  :deep(.el-form-item) { margin-bottom: 0; }
}

.trace-role-card {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;

  .trace-role-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .trace-role-meta {
      font-size: 13px;
      color: $text-secondary;
    }
  }
}

.trace-desc { margin-bottom: 8px; }

.score-success { color: $color-success; font-weight: 600; }
.score-warning { color: #e6a23c; font-weight: 600; }
.score-danger { color: $color-danger; font-weight: 600; }

.compliance-issues {
  margin-top: 12px;

  .compliance-issue-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #ebeef5;

    &.severity-high { border-left: 3px solid $color-danger; padding-left: 8px; }
    &.severity-medium { border-left: 3px solid #e6a23c; padding-left: 8px; }
    &.severity-low { border-left: 3px solid #909399; padding-left: 8px; }

    .issue-desc { flex: 1; font-size: 13px; }
    .issue-fields-tag { cursor: pointer; }
  }
}

.trace-logs-collapse {
  margin-bottom: 16px;
}

.trace-bound-users {
  margin-bottom: 12px;
}

.log-filter-form {
  :deep(.el-form-item) { margin-bottom: 0; }
  margin-bottom: 12px;
}

.log-pagination {
  margin-top: 12px;
  text-align: right;
}

.skeleton-wrap {
  padding: 16px;
  .skeleton-item {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
    }
    .skeleton-lines { flex: 1; }
    .skeleton-line {
      height: 14px;
      border-radius: 4px;
      margin-bottom: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      &.long { width: 80%; }
      &.medium { width: 60%; }
    }
  }
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.text-success { color: $color-success; }
.text-danger { color: $color-danger; }
.text-muted { color: $text-secondary; }
</style>
