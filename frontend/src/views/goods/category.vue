<template>
  <div class="page-container category-manage">
    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-button type="primary" :disabled="!canAddRoot" @click="handleAddRoot">
          <el-icon><FolderAdd /></el-icon>新增顶级类目
        </el-button>
        <el-button type="success" :disabled="!selectedNode || !canAddChild" @click="handleAddChild">
          <el-icon><Plus /></el-icon>新增子级
        </el-button>
        <el-button type="warning" :disabled="!selectedNode" @click="handleEditNode">
          <el-icon><Edit /></el-icon>编辑
        </el-button>
        <el-button type="danger" :disabled="!selectedNode" @click="handleDeleteNode">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-checkbox v-model="multiSelectMode" @change="(val: any) => handleMultiSelectChange(val as boolean)">
          <el-icon><Select /></el-icon>批量模式
        </el-checkbox>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索类目名称/编码"
          clearable
          style="width: 240px; margin-left: 12px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button style="margin-left: 12px;" @click="refreshTree">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <div v-if="batchCheckedKeys.length" class="batch-actions">
      <span class="batch-info">已选择 {{ batchCheckedKeys.length }} 项</span>
      <el-button link type="primary" @click="clearBatchSelection">取消选择</el-button>
      <el-button type="success" size="small" :disabled="!canBatchToggleStatus" @click="handleBatchEnable">
        <el-icon><CircleCheck /></el-icon>批量启用
      </el-button>
      <el-button type="info" size="small" :disabled="!canBatchToggleStatus" @click="handleBatchDisable">
        <el-icon><CircleClose /></el-icon>批量禁用
      </el-button>
      <el-button type="primary" size="small" :disabled="!canBatchMove" @click="openBatchMoveDialog">
        <el-icon><Promotion /></el-icon>批量移动
      </el-button>
    </div>

    <div class="main-content">
      <div class="tree-panel">
        <div class="tree-panel-header">
          <span class="tree-title">
            <el-icon><Menu /></el-icon>
            类目结构
          </span>
          <span v-if="totalCategoryCount" class="tree-count">共 {{ totalCategoryCount }} 个类目</span>
        </div>
        <el-tree
          ref="categoryTreeRef"
          :data="categoryTreeData"
          :props="treeProps"
          node-key="id"
          :expand-on-click-node="false"
          :default-expand-all="false"
          :highlight-current="true"
          :show-checkbox="multiSelectMode"
          :check-strictly="multiSelectMode"
          @node-click="handleNodeClick"
          @check="handleNodeCheck"
        >
          <template #default="{ data }">
            <div class="tree-node-content" :class="{ 'node-disabled': data.status === 0 }">
              <span class="node-label">
                <el-icon v-if="data.level === 1" class="node-icon level-1"><FirstAidKit /></el-icon>
                <el-icon v-else-if="data.level === 2" class="node-icon level-2"><Goods /></el-icon>
                <el-icon v-else class="node-icon level-3"><Present /></el-icon>
                {{ data.name }}
              </span>
              <span class="node-extra">
                <el-tag v-if="data.status === 0" type="info" size="small" effect="plain">禁用</el-tag>
                <el-tag v-if="data.productCount !== undefined" type="primary" size="small" effect="plain" class="count-tag">
                  {{ data.productCount }}件
                </el-tag>
                <el-tooltip v-if="data.level >= 3" content="已达最大层级，无法继续添加子级">
                  <el-icon class="add-disabled-icon"><CirclePlusFilled /></el-icon>
                </el-tooltip>
              </span>
            </div>
          </template>
        </el-tree>
      </div>

      <div class="content-panel">
        <el-tabs v-model="contentActiveTab" class="content-tabs">
          <el-tab-pane label="类目信息" name="info">
            <div v-if="selectedNode" class="info-content">
              <el-alert
                v-if="editPermissionInfo?.type === 'hasProducts'"
                :title="`该类目下有 ${editPermissionInfo.productCount} 件商品，修改类目信息将同步更新商品类目标签`"
                type="warning"
                :closable="false"
                show-icon
                class="mb-16"
              />
              <el-form
                ref="categoryFormRef"
                :model="categoryForm"
                :rules="formRules"
                label-width="100px"
                label-position="right"
                class="category-form"
                :error-class="formErrorClass"
                @validate="handleFormValidate"
              >
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="类目名称" prop="name">
                      <div class="form-item-wrapper">
                        <el-input
                          v-model="categoryForm.name"
                          placeholder="请输入类目名称"
                          clearable
                          :disabled="isFormReadOnly"
                          @blur="handleNameBlur"
                        />
                        <span v-if="editPermissionInfo?.type === 'hasProducts'" class="lock-tag">
                          <el-icon><Lock /></el-icon>
                        </span>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="类目编码" prop="code">
                      <div class="form-item-wrapper">
                        <el-input
                          v-model="categoryForm.code"
                          placeholder="请输入类目编码"
                          clearable
                          :disabled="isFormReadOnly || formMode === 'edit'"
                          @blur="handleCodeBlur"
                        />
                        <span v-if="editPermissionInfo?.type === 'hasProducts' && formMode === 'edit'" class="lock-tag">
                          <el-icon><Lock /></el-icon>
                        </span>
                      </div>
                      <div v-if="codeDuplicateError" class="error-tip">
                        <el-icon><Warning /></el-icon>
                        {{ codeDuplicateError }}
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="上级类目">
                      <el-tree-select
                        v-model="categoryForm.parentId"
                        :data="parentOptions"
                        :props="{ label: 'name', value: 'id', children: 'children', disabled: (item: CategoryTree) => item.level >= 3 || item.status === 0 }"
                        placeholder="顶级类目（无上级）"
                        clearable
                        check-strictly
                        :disabled="isFormReadOnly"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="层级" prop="level">
                      <el-tag type="info" effect="plain">第 {{ displayLevel }} 级</el-tag>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="排序值" prop="sort">
                      <el-input-number
                        v-model="categoryForm.sort"
                        :min="0"
                        :max="9999"
                        style="width: 100%"
                        :disabled="isFormReadOnly"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="状态" prop="status">
                      <el-radio-group v-model="categoryForm.status" :disabled="isFormReadOnly">
                        <el-radio :value="1">启用</el-radio>
                        <el-radio :value="0">禁用</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="图标">
                      <el-input
                        v-model="categoryForm.icon"
                        placeholder="图标名称（可选）"
                        clearable
                        :disabled="isFormReadOnly"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="商品数量">
                      <el-tag type="success" effect="plain">
                        {{ selectedNode.productCount ?? 0 }} 件商品
                      </el-tag>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="必需字段">
                  <el-input
                    v-model="categoryForm.requiredFieldsJson"
                    type="textarea"
                    :rows="3"
                    placeholder="JSON格式，如：[{&quot;field&quot;:&quot;brandId&quot;,&quot;label&quot;:&quot;品牌&quot;,&quot;required&quot;:true}]"
                    :disabled="isFormReadOnly"
                  />
                </el-form-item>
              </el-form>

              <el-alert
                v-for="rule in qualificationRules"
                :key="rule.level"
                :title="`第${rule.level}级资质要求：${rule.title}`"
                :type="rule.required ? 'warning' : 'info'"
                :closable="false"
                show-icon
                class="mb-8"
              >
                <template #default>
                  <div class="rule-fields">
                    <el-tag
                      v-for="field in rule.fields"
                      :key="field"
                      size="small"
                      :type="rule.required ? 'danger' : 'info'"
                      effect="plain"
                      class="mr-4 mb-4"
                    >
                      {{ field }}
                    </el-tag>
                  </div>
                </template>
              </el-alert>

              <div v-if="formMode !== 'view'" class="form-actions">
                <el-button @click="resetForm">重置</el-button>
                <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="handleSubmit">
                  {{ formMode === 'add' ? '确认新增' : '保存修改' }}
                </el-button>
              </div>
            </div>
            <div v-else class="empty-tip">
              <el-icon class="empty-icon"><Folder /></el-icon>
              <p>请在左侧选择一个类目查看详情</p>
            </div>
          </el-tab-pane>

          <el-tab-pane label="子类目列表" name="children">
            <div v-if="selectedNode" class="children-table-wrapper">
              <div class="table-toolbar">
                <span class="table-title">「{{ selectedNode.name }}」的子类目</span>
                <el-button type="primary" size="small" :disabled="!canAddChild" @click="handleAddChild">
                  <el-icon><Plus /></el-icon>新增子级
                </el-button>
              </div>
              <el-table
                ref="childrenTableRef"
                :data="childrenList"
                border
                stripe
                v-loading="childrenLoading"
                v-column-resizeable="'category_children_columns'"
              >
                <el-table-column type="index" label="序号" width="60" align="center" min-width="60" />
                <el-table-column prop="name" label="类目名称" min-width="160">
                  <template #default="{ row }">
                    <span>{{ row.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="code" label="编码" width="140" min-width="120" />
                <el-table-column prop="level" label="层级" width="80" align="center" min-width="80">
                  <template #default="{ row }">
                    第 {{ row.level }} 级
                  </template>
                </el-table-column>
                <el-table-column prop="sort" label="排序" width="90" align="center" min-width="80" />
                <el-table-column prop="productCount" label="商品数量" width="100" align="center" min-width="90">
                  <template #default="{ row }">
                    <el-tag type="primary" size="small" effect="plain">{{ row.productCount ?? 0 }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="90" align="center" min-width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                      {{ row.status === 1 ? '启用' : '禁用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center" fixed="right" min-width="180">
                  <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleQuickEdit(row as CategoryTree)">编辑</el-button>
                    <el-button link type="primary" size="small" @click="handleTrace(row as CategoryTree)">溯源</el-button>
                    <el-button link type="danger" size="small" @click="handleQuickDelete(row as CategoryTree)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!childrenList.length && !childrenLoading" class="empty-state py-20">
                <el-icon class="empty-icon"><Files /></el-icon>
                <div class="empty-text">暂无子类目</div>
              </div>
            </div>
            <div v-else class="empty-tip">
              <el-icon class="empty-icon"><List /></el-icon>
              <p>请选择一个类目查看子类目列表</p>
            </div>
          </el-tab-pane>

          <el-tab-pane label="操作日志" name="logs">
            <div v-if="selectedNode" class="logs-content" v-loading="logsLoading">
              <el-timeline v-if="hierarchyLogs.length">
                <el-timeline-item
                  v-for="log in hierarchyLogs"
                  :key="log.id"
                  :timestamp="log.timestamp"
                  placement="top"
                  :type="log.type"
                >
                  <el-card shadow="hover">
                    <h4 class="log-title">{{ log.title }}</h4>
                    <p v-if="log.content" class="log-content">{{ log.content }}</p>
                    <p v-if="log.operator" class="log-operator">
                      <el-icon><User /></el-icon>操作人：{{ log.operator }}
                    </p>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <div v-else class="empty-state py-20">
                <el-icon class="empty-icon"><Document /></el-icon>
                <div class="empty-text">暂无操作日志</div>
              </div>
            </div>
            <div v-else class="empty-tip">
              <el-icon class="empty-icon"><Document /></el-icon>
              <p>请选择一个类目查看操作日志</p>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <el-dialog
      v-model="confirmEditDialogVisible"
      :title="confirmDialogTitle"
      width="480px"
      :close-on-click-modal="false"
      center
      class="dialog-center-zoom"
    >
      <el-alert
        :title="editPermissionInfo?.confirmTips || '确认修改？'"
        type="warning"
        :closable="false"
        show-icon
      />
      <div class="confirm-detail mt-16">
        <div v-if="pendingChanges.name">
          <p><strong>类目名称：</strong>{{ selectedNode?.name }} → {{ pendingChanges.name }}</p>
        </div>
        <div v-if="pendingChanges.parentId !== undefined">
          <p><strong>上级类目变更：</strong>将重新归类商品</p>
        </div>
        <p class="text-muted mt-8">
          <el-icon><WarningFilled /></el-icon>
          该类目下有 {{ editPermissionInfo?.productCount ?? 0 }} 件商品标签将同步更新
        </p>
      </div>
      <template #footer>
        <el-button @click="confirmEditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmEditWithLinkage">
          确认并同步更新
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchMoveDialogVisible"
      title="批量移动类目"
      width="480px"
      :close-on-click-modal="false"
      class="form-dialog"
    >
      <el-form label-width="100px">
        <el-form-item label="目标父级">
          <el-tree-select
            v-model="batchMoveTargetId"
            :data="parentOptions"
            :props="{ label: 'name', value: 'id', children: 'children', disabled: (item: CategoryTree) => isBatchMoveTargetDisabled(item) }"
            placeholder="设为顶级类目"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-alert
          title="将把选中的 {{ batchCheckedKeys.length }} 个类目移动到目标父级下，可能影响层级和商品关联"
          type="warning"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="batchMoveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmBatchMove">
          确认移动
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      title="数据溯源"
      width="880px"
      :close-on-click-modal="false"
      class="trace-dialog"
    >
      <div v-loading="traceLoading">
        <el-tabs v-model="traceActiveTab">
          <el-tab-pane label="基础信息" name="basic">
            <el-descriptions :column="2" border v-if="traceData.basicInfo">
              <el-descriptions-item label="类目ID">{{ traceData.basicInfo.id }}</el-descriptions-item>
              <el-descriptions-item label="类目名称">{{ traceData.basicInfo.name }}</el-descriptions-item>
              <el-descriptions-item label="类目编码">{{ traceData.basicInfo.code }}</el-descriptions-item>
              <el-descriptions-item label="层级">第 {{ traceData.basicInfo.level }} 级</el-descriptions-item>
              <el-descriptions-item label="父级ID">{{ traceData.basicInfo.parentId ?? '无' }}</el-descriptions-item>
              <el-descriptions-item label="排序值">{{ traceData.basicInfo.sort }}</el-descriptions-item>
              <el-descriptions-item label="图标">{{ traceData.basicInfo.icon || '-' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="traceData.basicInfo.status === 1 ? 'success' : 'info'" size="small">
                  {{ traceData.basicInfo.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="商品数量" :span="2">
                <el-tag type="primary" effect="plain">
                  {{ traceData.productStats?.count ?? 0 }} 件
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="必需字段配置" :span="2">
                <code v-if="traceData.basicInfo.requiredFieldsJson" class="json-code">
                  {{ traceData.basicInfo.requiredFieldsJson }}
                </code>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="层级日志" name="hierarchy">
            <div class="timeline-section">
              <el-timeline v-if="traceData.hierarchyLogs?.length">
                <el-timeline-item
                  v-for="log in traceData.hierarchyLogs"
                  :key="log.id"
                  :timestamp="log.timestamp"
                  placement="top"
                  :type="log.type"
                >
                  <p><strong>{{ log.title }}</strong></p>
                  <p v-if="log.content" class="text-sm text-muted">{{ log.content }}</p>
                  <p v-if="log.operator" class="text-sm text-muted">操作人：{{ log.operator }}</p>
                </el-timeline-item>
              </el-timeline>
              <div v-else class="empty-state py-10">
                <div class="empty-text">暂无层级变更日志</div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="商品统计" name="product">
            <el-row :gutter="16" class="mb-16">
              <el-col :span="12">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-item">
                    <span class="stat-label">商品总数</span>
                    <span class="stat-value">{{ traceData.productStats?.count ?? 0 }}</span>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-item">
                    <span class="stat-label">热销Top商品数</span>
                    <span class="stat-value">{{ traceData.productStats?.topGoods?.length ?? 0 }}</span>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <h4 class="mb-12">热销商品TOP10</h4>
            <el-table
              v-if="traceData.productStats?.topGoods?.length"
              :data="traceData.productStats.topGoods"
              border
              size="small"
            >
              <el-table-column type="index" label="排名" width="70" align="center" />
              <el-table-column label="商品" min-width="200">
                <template #default="{ row }">
                  <div class="goods-cell">
                    <el-image
                      v-if="row.coverImage"
                      :src="row.coverImage"
                      style="width: 40px; height: 40px; border-radius: 4px; margin-right: 8px;"
                      fit="cover"
                    />
                    <span>{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="price" label="售价" width="100" align="right">
                <template #default="{ row }">
                  <span class="amount-text">{{ formatAmount(row.price) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="sales" label="销量" width="100" align="center" />
            </el-table>
            <div v-else class="empty-state py-10">
              <div class="empty-text">暂无商品数据</div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="权限配置" name="permission">
            <el-table
              v-if="traceData.permissionConfigs?.length"
              :data="traceData.permissionConfigs"
              border
              size="small"
            >
              <el-table-column prop="roleName" label="角色" width="140">
                <template #default="{ row }">
                  <el-tag :type="RoleTypeMap[row.roleId]?.type || 'info'" size="small">
                    {{ row.roleName }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="permissionName" label="权限项" min-width="180" />
              <el-table-column prop="permission" label="权限标识" min-width="160" />
              <el-table-column label="是否启用" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                    {{ row.enabled ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div v-else class="empty-state py-10">
              <div class="empty-text">暂无权限配置</div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button type="primary" @click="traceDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="progressDialogVisible"
      title="批量处理中..."
      width="480px"
      :close-on-click-modal="false"
      :show-close="false"
      center
      class="dialog-center-zoom"
    >
      <div class="progress-content">
        <el-progress
          :percentage="progressData.percent"
          :stroke-width="18"
          status="success"
          :format="() => `${progressData.percent}%`"
        />
        <div class="progress-stats mt-16">
          <el-row :gutter="16">
            <el-col :span="8" align="center">
              <div class="stat-number total">{{ progressData.total }}</div>
              <div class="stat-label">总数</div>
            </el-col>
            <el-col :span="8" align="center">
              <div class="stat-number success">{{ progressData.success }}</div>
              <div class="stat-label">成功</div>
            </el-col>
            <el-col :span="8" align="center">
              <div class="stat-number fail">{{ progressData.fail }}</div>
              <div class="stat-label">失败</div>
            </el-col>
          </el-row>
        </div>
        <div v-if="progressData.currentItem" class="current-item mt-12">
          <el-icon><Loading /></el-icon>
          正在处理：{{ progressData.currentItem }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  nextTick,
  onMounted,
  type Directive
} from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
  type ElTree
} from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Edit,
  Folder,
  FolderAdd,
  Menu,
  Goods,
  Present,
  FirstAidKit,
  Lock,
  Warning,
  WarningFilled,
  User,
  Document,
  CircleCheck,
  CircleClose,
  Promotion,
  Select,
  CirclePlusFilled,
  List,
  Files,
  Loading
} from '@element-plus/icons-vue'
import { formatAmount } from '@/utils/amount'
import {
  RoleTypeMap,
  type CategoryTree,
  type CategoryCreateData,
  type ValidateCreateResult,
  type EditPermissionType,
  type QualificationRule,
  type CategoryFullTrace,
  type CategoryConstraintError,
  type TimelineItem,
  type BatchProgressEvent
} from '@/types/business'
import {
  getCategory,
  createCategory,
  deleteCategory,
  validateCategoryCreate,
  getLevelQualificationRules,
  getEditPermissionType,
  updateCategoryLinkage,
  batchToggleStatus,
  batchMove,
  getCategoryFullTrace,
  checkCategoryConstraints,
  getTreeWithStats,
  type BatchToggleStatusData,
  type BatchMoveData,
  type UpdateCategoryLinkageData
} from '@/api/category'

const vColumnResizeable: Directive = {
  mounted(el, binding) {
    const table = el.querySelector('.el-table__header-wrapper table') as HTMLElement | null
    if (!table) return
    const storageKey = binding.value || 'table_columns'
    const savedWidths: Record<string, number> = {}
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) Object.assign(savedWidths, JSON.parse(saved))
    } catch {
    }
    const headers = table.querySelectorAll('th') as NodeListOf<HTMLElement>
    headers.forEach((th) => {
      const prop = th.getAttribute('prop') || th.querySelector('.cell')?.textContent?.trim()
      if (!prop) return
      if (savedWidths[prop]) {
        th.style.width = `${savedWidths[prop]}px`
        th.style.minWidth = `${savedWidths[prop]}px`
      }
      const handle = document.createElement('div')
      handle.className = 'column-resize-handle'
      th.style.position = 'relative'
      th.appendChild(handle)
      let startX = 0
      let startWidth = 0
      let isDragging = false
      handle.addEventListener('mousedown', (e: MouseEvent) => {
        isDragging = true
        startX = e.clientX
        startWidth = th.offsetWidth
        e.preventDefault()
        e.stopPropagation()
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      })
      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
        const diff = e.clientX - startX
        const newWidth = Math.max(60, startWidth + diff)
        th.style.width = `${newWidth}px`
        th.style.minWidth = `${newWidth}px`
        savedWidths[prop] = newWidth
      }
      const onMouseUp = () => {
        if (!isDragging) return
        isDragging = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        try {
          localStorage.setItem(storageKey, JSON.stringify(savedWidths))
        } catch {
        }
      }
    })
  }
}

const categoryTreeRef = ref<InstanceType<typeof ElTree>>()
const childrenTableRef = ref<any>()
const categoryFormRef = ref<FormInstance>()

const treeLoading = ref(false)
const childrenLoading = ref(false)
const logsLoading = ref(false)
const submitting = ref(false)
const traceLoading = ref(false)
const searchKeyword = ref('')
const multiSelectMode = ref(false)
const batchCheckedKeys = ref<number[]>([])

const categoryTreeData = ref<CategoryTree[]>([])
const parentOptions = ref<CategoryTree[]>([])
const selectedNode = ref<CategoryTree | null>(null)

const contentActiveTab = ref('info')
const formMode = ref<'view' | 'add' | 'edit'>('view')
const categoryForm = reactive<Partial<CategoryCreateData>>({
  name: '',
  code: '',
  parentId: undefined,
  icon: '',
  sort: 0,
  status: 1,
  requiredFieldsJson: ''
})
const pendingChanges = reactive<Record<string, any>>({})
const originalForm = reactive<Record<string, any>>({})

const formErrorClass = ref('')
const codeDuplicateError = ref('')
const validateResult = ref<ValidateCreateResult | null>(null)
const qualificationRules = ref<QualificationRule[]>([])
const editPermissionInfo = ref<EditPermissionType | null>(null)

const confirmEditDialogVisible = ref(false)
const confirmDialogTitle = ref('确认修改')
const batchMoveDialogVisible = ref(false)
const batchMoveTargetId = ref<number | null>(null)
const traceDialogVisible = ref(false)
const traceActiveTab = ref('basic')
const traceData = reactive<Partial<CategoryFullTrace>>({})
const hierarchyLogs = ref<TimelineItem[]>([])

const progressDialogVisible = ref(false)
const progressData = reactive<BatchProgressEvent>({
  total: 0,
  success: 0,
  fail: 0,
  percent: 0,
  currentItem: ''
})

const treeProps = {
  label: 'name',
  children: 'children'
}

const totalCategoryCount = computed(() => {
  const count = (arr: CategoryTree[]): number => {
    let n = 0
    arr.forEach((item) => {
      n++
      if (item.children?.length) n += count(item.children)
    })
    return n
  }
  return count(categoryTreeData.value)
})

const canAddRoot = computed(() => {
  return true
})

const canAddChild = computed(() => {
  if (!selectedNode.value) return false
  if (selectedNode.value.status === 0) return false
  if (selectedNode.value.level >= 3) return false
  return true
})

const displayLevel = computed(() => {
  if (formMode.value === 'add') {
    if (categoryForm.parentId) {
      const findLevel = (arr: CategoryTree[]): number | null => {
        for (const item of arr) {
          if (item.id === categoryForm.parentId) return item.level
          if (item.children?.length) {
            const found = findLevel(item.children)
            if (found !== null) return found
          }
        }
        return null
      }
      const parentLevel = findLevel(categoryTreeData.value) ?? 0
      return parentLevel + 1
    }
    return 1
  }
  return selectedNode.value?.level ?? 1
})

const isFormReadOnly = computed(() => formMode.value === 'view')

const canSubmit = computed(() => {
  if (formMode.value === 'view') return false
  if (!categoryForm.name?.trim() || !categoryForm.code?.trim()) return false
  if (codeDuplicateError.value) return false
  if (validateResult.value && !validateResult.value.canSubmit) return false
  return true
})

const canBatchToggleStatus = computed(() => {
  if (!batchCheckedKeys.value.length) return false
  return true
})

const canBatchMove = computed(() => {
  if (!batchCheckedKeys.value.length) return false
  return true
})

const childrenList = computed(() => {
  return selectedNode.value?.children || []
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入类目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入类目编码', trigger: 'blur' },
    { min: 2, max: 32, message: '长度在 2 到 32 个字符', trigger: 'blur' }
  ],
  sort: [{ type: 'number', min: 0, max: 9999, message: '排序值范围 0-9999', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const initCategoryForm = () => {
  Object.assign(categoryForm, {
    name: '',
    code: '',
    parentId: undefined,
    icon: '',
    sort: 0,
    status: 1,
    requiredFieldsJson: ''
  })
  Object.assign(originalForm, {})
  codeDuplicateError.value = ''
  validateResult.value = null
  qualificationRules.value = []
  editPermissionInfo.value = null
  pendingChanges.name = undefined
  pendingChanges.parentId = undefined
}

const loadCategoryTree = async () => {
  treeLoading.value = true
  try {
    const res = await getTreeWithStats()
    categoryTreeData.value = res.data
    parentOptions.value = res.data
  } finally {
    treeLoading.value = false
  }
}

const refreshTree = async () => {
  await loadCategoryTree()
  ElMessage.success('刷新成功')
}

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    categoryTreeRef.value?.filter('')
    return
  }
  categoryTreeRef.value?.filter(searchKeyword.value.trim())
}

const handleNodeClick = (data: CategoryTree) => {
  if (multiSelectMode.value) return
  selectedNode.value = data
  contentActiveTab.value = 'info'
  formMode.value = 'view'
  loadNodeDetail(data)
}

const handleNodeCheck = (_data: CategoryTree, checked: { checkedKeys: number[] }) => {
  batchCheckedKeys.value = checked.checkedKeys as number[]
}

const handleMultiSelectChange = (val: boolean) => {
  batchCheckedKeys.value = []
  if (!val) {
    clearBatchSelection()
  }
}

const clearBatchSelection = () => {
  categoryTreeRef.value?.setCheckedKeys([])
  batchCheckedKeys.value = []
}

const loadNodeDetail = async (node: CategoryTree) => {
  logsLoading.value = true
  try {
    const [permissionRes, categoryRes] = await Promise.all([
      getEditPermissionType(node.id),
      getCategory(node.id)
    ])
    editPermissionInfo.value = permissionRes.data
    const detail = categoryRes.data

    Object.assign(categoryForm, {
      name: detail.name,
      code: detail.code,
      parentId: detail.parentId ?? undefined,
      icon: detail.icon || '',
      sort: detail.sort,
      status: detail.status,
      requiredFieldsJson: detail.requiredFieldsJson || ''
    })
    Object.assign(originalForm, { ...categoryForm })

    try {
      const rulesRes = await getLevelQualificationRules(detail.level)
      qualificationRules.value = rulesRes.data
    } catch {
      qualificationRules.value = []
    }

    try {
      const traceRes = await getCategoryFullTrace(node.id)
      traceData.basicInfo = traceRes.data.basicInfo
      hierarchyLogs.value = traceRes.data.hierarchyLogs || []
      traceData.hierarchyLogs = traceRes.data.hierarchyLogs || []
      traceData.productStats = traceRes.data.productStats
      traceData.permissionConfigs = traceRes.data.permissionConfigs
    } catch {
      hierarchyLogs.value = []
    }
  } finally {
    logsLoading.value = false
  }
}

const handleAddRoot = async () => {
  try {
    const res = await validateCategoryCreate({})
    validateResult.value = res.data
    if (!res.data.valid) {
      const errorList = res.data.errors.map((e) => `• ${e.message}`).join('\n')
      await ElMessageBox.alert(`新增顶级类目校验未通过：\n\n${errorList}`, '校验异常', {
        confirmButtonText: '我知道了',
        type: 'error'
      })
      return
    }
    qualificationRules.value = res.data.levelRules
  } catch {
  }
  formMode.value = 'add'
  selectedNode.value = null
  initCategoryForm()
  categoryForm.parentId = undefined
  categoryForm.status = 1
  contentActiveTab.value = 'info'
}

const handleAddChild = async () => {
  if (!selectedNode.value) return
  const parentId = selectedNode.value.id

  if (selectedNode.value.status === 0) {
    ElMessageBox.alert('上级类目已禁用，无法新增子类目', '校验异常', {
      confirmButtonText: '我知道了',
      type: 'error'
    })
    return
  }

  if (selectedNode.value.level >= 3) {
    ElMessage.warning('已达最大层级（3级），无法继续添加子级')
    return
  }

  try {
    const res = await validateCategoryCreate({ parentId })
    validateResult.value = res.data
    if (!res.data.valid) {
      const errorList = res.data.errors.map((e) => `• ${e.message}`).join('\n')
      await ElMessageBox.alert(`新增子类目校验未通过：\n\n${errorList}`, '校验异常', {
        confirmButtonText: '我知道了',
        type: 'error'
      })
      return
    }
    qualificationRules.value = res.data.levelRules
  } catch {
  }

  formMode.value = 'add'
  initCategoryForm()
  categoryForm.parentId = parentId
  categoryForm.sort = (selectedNode.value.children?.length || 0) + 1
  contentActiveTab.value = 'info'
}

const handleEditNode = () => {
  if (!selectedNode.value) return
  formMode.value = 'edit'
  pendingChanges.name = undefined
  pendingChanges.parentId = undefined
}

const handleDeleteNode = async () => {
  if (!selectedNode.value) return
  const node = selectedNode.value
  const hasChildren = node.children?.length ?? 0 > 0
  const hasProducts = (node.productCount ?? 0) > 0

  let msg = `确定要删除类目「${node.name}」吗？`
  if (hasChildren) msg += `\n该类目下还有 ${node.children?.length} 个子类目`
  if (hasProducts) msg += `\n该类目下还有 ${node.productCount} 件商品，删除后这些商品的类目将被清空`

  try {
    await ElMessageBox.confirm(msg, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await deleteCategory(node.id)
    ElMessage.success('删除成功')
    selectedNode.value = null
    initCategoryForm()
    formMode.value = 'view'
    await loadCategoryTree()
  } catch {
  }
}

const handleNameBlur = async () => {
  if (!categoryForm.name?.trim()) return
  await runConstraintsCheck()
}

const handleCodeBlur = async () => {
  if (!categoryForm.code?.trim()) return
  await runConstraintsCheck()
}

const runConstraintsCheck = async () => {
  try {
    const res = await checkCategoryConstraints({
      name: categoryForm.name,
      code: categoryForm.code,
      id: formMode.value === 'edit' ? selectedNode.value?.id : undefined,
      parentId: categoryForm.parentId
    })
    if (!res.data.valid) {
      const codeErr = res.data.errors.find((e: CategoryConstraintError) => e.code.includes('CODE'))
      const nameErr = res.data.errors.find((e: CategoryConstraintError) => e.code.includes('NAME'))
      if (codeErr) {
        codeDuplicateError.value = codeErr.message
        triggerShake()
      }
      if (nameErr) {
        ElMessage.warning(nameErr.message)
        triggerShake()
      }
    } else {
      codeDuplicateError.value = ''
    }
  } catch {
    codeDuplicateError.value = ''
  }
}

const triggerShake = () => {
  formErrorClass.value = 'is-shake'
  nextTick(() => {
    formErrorClass.value = ''
  })
}

const handleFormValidate = (_prop: string | string[], isValid: boolean, _message: string) => {
  if (!isValid) {
    triggerShake()
  }
}

const resetForm = () => {
  if (formMode.value === 'edit' && selectedNode.value) {
    loadNodeDetail(selectedNode.value)
  } else {
    initCategoryForm()
    if (formMode.value === 'add' && selectedNode.value) {
      categoryForm.parentId = selectedNode.value.id
    }
  }
  categoryFormRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!categoryFormRef.value) return
  try {
    await categoryFormRef.value.validate()
  } catch {
    triggerShake()
    return
  }

  if (formMode.value === 'add') {
    await handleCreate()
  } else if (formMode.value === 'edit') {
    await handleUpdate()
  }
}

const handleCreate = async () => {
  try {
    const submitData: CategoryCreateData = {
      name: categoryForm.name!.trim(),
      code: categoryForm.code!.trim(),
      parentId: categoryForm.parentId,
      icon: categoryForm.icon || undefined,
      sort: categoryForm.sort ?? 0,
      status: categoryForm.status ?? 1,
      requiredFieldsJson: categoryForm.requiredFieldsJson || undefined
    }
    submitting.value = true
    await createCategory(submitData)
    ElMessage.success('新增成功')
    formMode.value = 'view'
    initCategoryForm()
    await loadCategoryTree()
  } catch {
  } finally {
    submitting.value = false
  }
}

const handleUpdate = async () => {
  if (!selectedNode.value) return
  const id = selectedNode.value.id
  const hasNameChange = categoryForm.name !== originalForm.name
  const hasParentChange = categoryForm.parentId !== originalForm.parentId

  const linkageData: UpdateCategoryLinkageData = {}
  if (hasNameChange) {
    linkageData.name = categoryForm.name
    pendingChanges.name = categoryForm.name
  }
  if (hasParentChange) {
    linkageData.parentId = categoryForm.parentId ?? null
    pendingChanges.parentId = categoryForm.parentId
  }
  linkageData.icon = categoryForm.icon
  linkageData.sort = categoryForm.sort
  linkageData.status = categoryForm.status
  linkageData.requiredFieldsJson = categoryForm.requiredFieldsJson

  const needConfirm = editPermissionInfo.value?.type === 'hasProducts' && (hasNameChange || hasParentChange)
  if (needConfirm) {
    confirmDialogTitle.value = '修改确认'
    confirmEditDialogVisible.value = true
    return
  }

  await doUpdate(id, linkageData, false)
}

const confirmEditWithLinkage = async () => {
  if (!selectedNode.value) return
  const id = selectedNode.value.id
  const linkageData: UpdateCategoryLinkageData = {
    name: pendingChanges.name,
    parentId: pendingChanges.parentId ?? null,
    icon: categoryForm.icon,
    sort: categoryForm.sort,
    status: categoryForm.status,
    requiredFieldsJson: categoryForm.requiredFieldsJson
  }
  await doUpdate(id, linkageData, true)
}

const doUpdate = async (id: number, data: UpdateCategoryLinkageData, needConfirm: boolean) => {
  try {
    submitting.value = true
    const res = await updateCategoryLinkage(id, data, needConfirm)
    confirmEditDialogVisible.value = false
    ElMessage.success(
      res.data.updatedProductCount
        ? `保存成功，已同步更新 ${res.data.updatedProductCount} 件商品标签`
        : '保存成功'
    )
    formMode.value = 'view'
    await loadCategoryTree()
    const updated = findNodeById(categoryTreeData.value, id)
    if (updated) {
      selectedNode.value = updated
      loadNodeDetail(updated)
    }
  } catch {
  } finally {
    submitting.value = false
  }
}

const findNodeById = (arr: CategoryTree[], id: number): CategoryTree | null => {
  for (const item of arr) {
    if (item.id === id) return item
    if (item.children?.length) {
      const found = findNodeById(item.children, id)
      if (found) return found
    }
  }
  return null
}

const handleQuickEdit = (row: CategoryTree) => {
  selectedNode.value = row
  formMode.value = 'edit'
  loadNodeDetail(row)
  contentActiveTab.value = 'info'
}

const handleQuickDelete = async (row: CategoryTree) => {
  selectedNode.value = row
  await handleDeleteNode()
}

const handleTrace = async (row: CategoryTree) => {
  traceActiveTab.value = 'basic'
  traceDialogVisible.value = true
  traceLoading.value = true
  Object.assign(traceData, {
    basicInfo: undefined,
    hierarchyLogs: [],
    productStats: undefined,
    permissionConfigs: []
  })
  try {
    const res = await getCategoryFullTrace(row.id)
    Object.assign(traceData, res.data)
  } finally {
    traceLoading.value = false
  }
}

const handleBatchEnable = async () => {
  await handleBatchToggleStatus(1)
}

const handleBatchDisable = async () => {
  await handleBatchToggleStatus(0)
}

const handleBatchToggleStatus = async (status: number) => {
  if (!batchCheckedKeys.value.length) return
  try {
    await ElMessageBox.confirm(
      `确定要批量${status === 1 ? '启用' : '禁用'}选中的 ${batchCheckedKeys.value.length} 个类目吗？`,
      '批量操作确认',
      { type: 'warning' }
    )
    const data: BatchToggleStatusData = {
      ids: batchCheckedKeys.value,
      status
    }
    await startBatchProgress(
      batchCheckedKeys.value,
      async (itemId) => {
        const node = findNodeById(categoryTreeData.value, itemId)
        return node?.name || `类目#${itemId}`
      },
      async () => batchToggleStatus(data)
    )
  } catch {
  }
}

const openBatchMoveDialog = () => {
  batchMoveTargetId.value = null
  batchMoveDialogVisible.value = true
}

const isBatchMoveTargetDisabled = (item: CategoryTree): boolean => {
  if (batchCheckedKeys.value.includes(item.id)) return true
  if (item.status === 0) return true
  return false
}

const confirmBatchMove = async () => {
  try {
    const data: BatchMoveData = {
      ids: batchCheckedKeys.value,
      targetParentId: batchMoveTargetId.value
    }
    batchMoveDialogVisible.value = false
    await startBatchProgress(
      batchCheckedKeys.value,
      async (itemId) => {
        const node = findNodeById(categoryTreeData.value, itemId)
        return node?.name || `类目#${itemId}`
      },
      async () => batchMove(data)
    )
  } catch {
  }
}

const startBatchProgress = async (
  ids: number[],
  getItemName: (id: number) => Promise<string> | string,
  batchApi: () => Promise<any>
) => {
  progressData.total = ids.length
  progressData.success = 0
  progressData.fail = 0
  progressData.percent = 0
  progressData.currentItem = ''
  progressDialogVisible.value = true

  let currentIndex = 0
  const interval = setInterval(async () => {
    if (currentIndex < ids.length) {
      try {
        progressData.currentItem = await getItemName(ids[currentIndex])
      } catch {
        progressData.currentItem = `类目#${ids[currentIndex]}`
      }
      progressData.success = currentIndex
      progressData.percent = Math.round((currentIndex / ids.length) * 100)
      currentIndex++
    }
  }, 50)

  try {
    const res = await batchApi()
    clearInterval(interval)
    progressData.success = res.data.successCount ?? ids.length
    progressData.fail = res.data.failCount ?? 0
    progressData.percent = 100
    progressData.currentItem = '处理完成'
    await new Promise((resolve) => setTimeout(resolve, 500))
    ElMessage.success(`批量处理完成：成功${progressData.success} / 失败${progressData.fail}`)
    clearBatchSelection()
    await loadCategoryTree()
  } catch {
    clearInterval(interval)
    progressData.fail = ids.length - progressData.success
    progressData.percent = 100
    ElMessage.error('批量处理失败')
  } finally {
    setTimeout(() => {
      progressDialogVisible.value = false
    }, 800)
  }
}

onMounted(async () => {
  await loadCategoryTree()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.category-manage {
  background: #fff;
  border-radius: $radius-md;
  padding: $spacing-base;
  box-shadow: $shadow-light;

  .toolbar-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: $spacing-base;
    margin-bottom: $spacing-base;
    border-bottom: 1px solid $border-color-lighter;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
    }
  }

  .main-content {
    display: flex;
    gap: $spacing-base;
    min-height: calc(100vh - 240px);
  }

  .tree-panel {
    width: 320px;
    flex-shrink: 0;
    border: 1px solid $border-color-lighter;
    border-radius: $radius-base;
    background: #fafbfc;
    display: flex;
    flex-direction: column;

    .tree-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-sm $spacing-base;
      border-bottom: 1px solid $border-color-lighter;
      background: #fff;
      border-radius: $radius-base $radius-base 0 0;

      .tree-title {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        font-weight: 600;
        font-size: $font-size-md;
        color: $text-primary;
      }

      .tree-count {
        font-size: $font-size-xs;
        color: $text-secondary;
      }
    }

    :deep(.el-tree) {
      flex: 1;
      background: transparent;
      padding: $spacing-sm;
      overflow-y: auto;
      max-height: calc(100vh - 300px);
    }

    .tree-node-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding-right: $spacing-xs;

      &.node-disabled {
        .node-label {
          color: $text-secondary;
          opacity: 0.6;
        }
      }

      .node-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: $font-size-sm;

        .node-icon {
          font-size: 14px;

          &.level-1 {
            color: #409EFF;
          }
          &.level-2 {
            color: #67C23A;
          }
          &.level-3 {
            color: #E6A23C;
          }
        }
      }

      .node-extra {
        display: flex;
        align-items: center;
        gap: 4px;

        .count-tag {
          font-size: 10px;
        }

        .add-disabled-icon {
          color: #dcdfe6;
          font-size: 14px;
        }
      }
    }
  }

  .content-panel {
    flex: 1;
    min-width: 0;

    .content-tabs {
      height: 100%;

      :deep(.el-tabs__content) {
        height: calc(100% - 44px);
        overflow-y: auto;
      }
    }

    .info-content {
      padding: $spacing-base;

      .form-item-wrapper {
        position: relative;
        width: 100%;

        .lock-tag {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: #909399;
          display: flex;
          align-items: center;
        }
      }

      .error-tip {
        color: $danger-color;
        font-size: $font-size-xs;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .rule-fields {
        margin-top: 8px;
      }

      .form-actions {
        display: flex;
        justify-content: center;
        gap: $spacing-base;
        margin-top: $spacing-lg;
        padding-top: $spacing-base;
        border-top: 1px solid $border-color-lighter;
      }
    }

    .children-table-wrapper {
      padding: $spacing-base;

      .table-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: $spacing-base;

        .table-title {
          font-weight: 600;
          color: $text-primary;
        }
      }
    }

    .logs-content {
      padding: $spacing-base;

      .log-title {
        margin: 0 0 8px 0;
        font-size: $font-size-sm;
      }

      .log-content {
        margin: 0 0 8px 0;
        color: $text-regular;
      }

      .log-operator {
        margin: 0;
        color: $text-secondary;
        font-size: $font-size-xs;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .empty-tip {
      padding: $spacing-xxl 0;
      text-align: center;
      color: $text-secondary;

      .empty-icon {
        font-size: 64px;
        color: $border-color-light;
        margin-bottom: $spacing-base;
      }

      p {
        margin: 0;
        font-size: $font-size-base;
      }
    }
  }
}

.confirm-detail {
  p {
    margin: 0 0 8px 0;
  }
}

.progress-content {
  padding: $spacing-base 0;

  .progress-stats {
    .stat-number {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;

      &.total {
        color: $text-primary;
      }
      &.success {
        color: $success-color;
      }
      &.fail {
        color: $danger-color;
      }
    }

    .stat-label {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-top: 4px;
    }
  }

  .current-item {
    text-align: center;
    color: $text-regular;
    font-size: $font-size-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    .el-icon {
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.stat-card {
  .stat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .stat-label {
      color: $text-secondary;
      font-size: $font-size-sm;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: $primary-color;
    }
  }
}

.goods-cell {
  display: flex;
  align-items: center;
}

.json-code {
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: $font-size-xs;
  word-break: break-all;
  display: block;
}

.mb-4 { margin-bottom: 4px; }
.mb-8 { margin-bottom: 8px; }
.mb-12 { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.mt-20 { margin-top: 20px; }
.py-10 { padding-top: 40px; padding-bottom: 40px; }
.py-20 { padding-top: 80px; padding-bottom: 80px; }
.text-sm { font-size: 12px; }
.text-muted { color: $text-secondary; }
.mr-4 { margin-right: 8px; }
</style>
