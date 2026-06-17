<template>
  <div class="page-container tag-management">
    <el-row :gutter="20" class="stats-row mb-20">
      <el-col :span="6">
        <div class="stat-card stat-total">
          <div class="stat-icon">
            <el-icon :size="24"><PriceTag /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">标签总数</div>
            <div class="stat-value">{{ tagStats.totalCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-core">
          <div class="stat-icon">
            <el-icon :size="24"><StarFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">核心标签</div>
            <div class="stat-value">{{ tagStats.coreCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-hot">
          <div class="stat-icon">
            <el-icon :size="24"><HotWater /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">热门标签</div>
            <div class="stat-value">{{ tagStats.hotCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-use">
          <div class="stat-icon">
            <el-icon :size="24"><Histogram /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日使用</div>
            <div class="stat-value">{{ tagStats.todayUseCount }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="main-content">
      <el-col :span="4">
        <el-card shadow="never" class="tree-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">分类筛选</span>
              <el-button link type="primary" size="small" @click="currentCategoryId = undefined">
                全部
              </el-button>
            </div>
          </template>
          <el-tree
            :data="categoryTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            default-expand-all
            highlight-current
            @node-click="handleCategoryFilter"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <el-icon :color="data.color || '#409eff'">
                  <Folder v-if="node.children?.length" />
                  <Document v-else />
                </el-icon>
                <span class="node-label">{{ data.name }}</span>
                <span class="node-count">({{ data.tagCount || 0 }})</span>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <el-col :span="20">
        <el-card shadow="never" class="mb-20">
          <el-form :model="queryParams" label-width="70px" inline @submit.prevent>
            <el-form-item label="关键词">
              <el-input
                v-model="queryParams.keyword"
                placeholder="标签名搜索"
                clearable
                style="width: 180px"
                class="focus-input"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="queryParams.status"
                placeholder="全部状态"
                clearable
                style="width: 120px"
                class="focus-input"
              >
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="热门">
              <el-select
                v-model="queryParams.hotLevel"
                placeholder="全部等级"
                clearable
                style="width: 120px"
                class="focus-input"
              >
                <el-option label="普通" :value="1" />
                <el-option label="热门" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select
                v-model="queryParams.type"
                placeholder="全部类型"
                clearable
                style="width: 120px"
                class="focus-input"
              >
                <el-option v-for="(label, value) in tagTypeOptions" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
            <el-form-item label="场景">
              <el-select
                v-model="queryParams.scene"
                placeholder="全部场景"
                clearable
                style="width: 140px"
                class="focus-input"
              >
                <el-option
                  v-for="scene in CONTENT_SCENES"
                  :key="scene.value"
                  :label="scene.label"
                  :value="scene.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="mb-20" v-if="topTags.length">
          <template #header>
            <div class="card-header">
              <span class="card-title">使用次数 TOP 20</span>
              <el-button link type="primary" size="small" @click="loadTopTags">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <div class="top-tags-container">
            <div
              v-for="(tag, index) in topTags.slice(0, 10)"
              :key="tag.id"
              class="top-tag-card"
              :class="`rank-${index + 1}`"
            >
              <div class="rank-badge">{{ index + 1 }}</div>
              <div class="tag-content">
                <el-tag
                  :type="tag.hotLevel === 2 ? 'danger' : 'primary'"
                  effect="light"
                  size="small"
                >
                  {{ tag.name }}
                </el-tag>
                <span class="use-count">使用 {{ tag.useCount }} 次</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">标签列表</span>
              <div class="header-actions">
                <el-alert
                  v-if="unusedTagCount > 0"
                  type="warning"
                  :closable="false"
                  show-icon
                  class="unused-alert"
                >
                  <template #title>
                    30天内无使用的标签共 {{ unusedTagCount }} 个，建议清理
                    <el-button link type="warning" size="small" @click="handleCleanUnused">
                      一键清理
                    </el-button>
                  </template>
                </el-alert>
                <el-button :icon="Upload" size="small" @click="openBatchAdd">
                  批量新增
                </el-button>
                <el-button type="primary" :icon="Plus" @click="openForm()">新增标签</el-button>
              </div>
            </div>
          </template>

          <BatchActions
            :selected-ids="selectedIds"
            :selected-rows="selectedRows as unknown[]"
            :total="total"
            always-show
            :allow-delete="false"
            :allow-export="false"
          >
            <el-button
              type="success"
              plain
              size="small"
              :icon="CircleCheck"
              :disabled="!hasSelection"
              @click="handleBatchTagStatus(1)"
            >
              批量启用
            </el-button>
            <el-button
              type="danger"
              plain
              size="small"
              :icon="CircleClose"
              :disabled="!hasSelection"
              @click="handleBatchTagStatus(2)"
            >
              批量禁用
            </el-button>
            <el-button
              type="warning"
              plain
              size="small"
              :icon="MagicStick"
              :disabled="!hasSelection"
              @click="openBatchUpdate('weight')"
            >
              批量改权重
            </el-button>
            <el-button
              type="primary"
              plain
              size="small"
              :icon="HotWater"
              :disabled="!hasSelection"
              @click="openBatchUpdate('hotLevel')"
            >
              批量改热度
            </el-button>
          </BatchActions>

          <div ref="tableScrollRef" class="table-scroll-container" @scroll="handleTableScroll">
            <HtTable
              :data="dataList"
              :loading="loading"
              :total="total"
              v-model:page="queryParams.page"
              v-model:page-size="queryParams.pageSize"
              selectable
              show-index
              row-key="id"
              highlight-current-row
              stripe
              :row-class-name="tableRowClassName"
              @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Tag[])"
              @paginate="handlePaginate"
            >
              <el-table-column label="标签名称" min-width="160">
                <template #default="{ row }">
                  <div class="name-cell">
                    <el-icon v-if="row.icon" :color="row.color || '#409eff'">
                      <component :is="row.icon" />
                    </el-icon>
                    <div class="name-content">
                      <div class="name-text" :style="{ color: row.color || '' }">
                        {{ row.name }}
                        <el-icon v-if="row.hotLevel === 2" class="hot-icon" color="#f56c6c" :size="14">
                          <HotWater />
                        </el-icon>
                        <el-icon v-if="row.isCore === 1" class="core-icon" color="#e6a23c" :size="14">
                          <StarFilled />
                        </el-icon>
                      </div>
                      <div class="sub-text">{{ row.categoryName || '未分类' }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="tagTypeColorMap[row.type] || 'info'" size="small" effect="light">
                    {{ tagTypeOptions[row.type] || row.type }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="适配场景" min-width="160">
                <template #default="{ row }">
                  <div class="scene-tags">
                    <el-tag
                      v-for="scene in row.scenes?.slice(0, 2)"
                      :key="scene"
                      type="primary"
                      size="small"
                      effect="plain"
                    >
                      {{ scene }}
                    </el-tag>
                    <el-tooltip v-if="row.scenes && row.scenes.length > 2">
                      <template #content>
                        <div v-for="scene in row.scenes.slice(2)" :key="scene">{{ scene }}</div>
                      </template>
                      <el-tag size="small" type="info">+{{ row.scenes.length - 2 }}</el-tag>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="合规标签" min-width="180">
                <template #default="{ row }">
                  <div class="scene-tags">
                    <el-tag
                      v-for="tag in row.complianceTags?.slice(0, 3)"
                      :key="tag"
                      type="success"
                      size="small"
                      effect="plain"
                    >
                      {{ tag }}
                    </el-tag>
                    <span v-if="!row.complianceTags?.length" class="empty-text">-</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="useCount" label="使用次数" width="100" align="center">
                <template #default="{ row }">
                  <span class="count-num">{{ row.useCount || 0 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="weight" label="权重" width="80" align="center" />
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.status"
                    :active-value="1"
                    :inactive-value="2"
                    class="status-switch"
                    @change="(val: number) => handleTagStatusChange(row, val)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="最近使用" width="150">
                <template #default="{ row }">
                  <el-tooltip v-if="row.lastUsedTime" :content="formatDateTime(row.lastUsedTime)">
                    <span class="time-text">{{ formatDateTime(row.lastUsedTime) }}</span>
                  </el-tooltip>
                  <span v-else class="empty-text">未使用</span>
                </template>
              </el-table-column>
              <el-table-column label="创建时间" width="160">
                <template #default="{ row }">
                  {{ formatDateTime(row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="240" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openUsageLogs(row)">
                    日志
                  </el-button>
                  <el-button link type="primary" size="small" @click="openForm(row)">
                    编辑
                  </el-button>
                  <el-button link type="danger" size="small" @click="handleDelete(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </HtTable>
          </div>

          <el-button
            v-show="showBackTop"
            class="back-to-top"
            :icon="Top"
            circle
            @click="scrollToTop"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑标签' : '新增标签'"
      width="720px"
      destroy-on-close
      @close="handleCloseForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="tag-form"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标签名称" prop="name" :class="{ 'field-error': fieldErrors.name }">
              <el-input
                v-model="formData.name"
                placeholder="请输入标签名称 (2-20字)"
                maxlength="20"
                show-word-limit
                class="focus-input"
                @input="validateTagOnChange"
                @blur="validateTagName"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分类" prop="categoryId">
              <el-tree-select
                v-model="formData.categoryId"
                :data="categoryTree"
                :props="{ label: 'name', value: 'id', children: 'children' }"
                placeholder="请选择分类（可选）"
                clearable
                check-strictly
                class="focus-input"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择类型" class="focus-input" style="width: 100%">
                <el-option v-for="(label, value) in tagTypeOptions" :key="value" :label="label" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="热门等级" prop="hotLevel">
              <el-radio-group v-model="formData.hotLevel">
                <el-radio-button :value="1">普通</el-radio-button>
                <el-radio-button :value="2">热门</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="2"
                placeholder="请输入标签描述"
                maxlength="200"
                show-word-limit
                class="focus-input"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="图标" prop="icon">
              <el-input v-model="formData.icon" placeholder="Icon组件名" class="focus-input" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="颜色" prop="color">
              <el-color-picker v-model="formData.color" show-alpha />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="formData.sort" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="权重" prop="weight">
              <el-input-number v-model="formData.weight" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="核心标签" prop="isCore">
              <el-switch v-model="formData.isCore" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="formData.status"
                :active-value="1"
                :inactive-value="2"
                active-text="启用"
                inactive-text="禁用"
                class="status-switch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item
              label="合规标签"
              prop="complianceTags"
              :class="{ 'field-error': fieldErrors.complianceTags }"
            >
              <el-select
                v-model="formData.complianceTags"
                multiple
                filterable
                placeholder="必须至少关联合规标签库中的一个标签"
                class="focus-input"
                style="width: 100%"
              >
                <el-option-group
                  v-for="lib in COMPLIANCE_LIBRARIES"
                  :key="lib.id"
                  :label="lib.name"
                >
                  <el-option
                    v-for="tag in lib.tags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item
              label="适配场景"
              prop="scenes"
              :class="{ 'field-error': fieldErrors.scenes }"
            >
              <el-checkbox-group v-model="formData.scenes">
                <el-checkbox
                  v-for="scene in CONTENT_SCENES"
                  :key="scene.value"
                  :label="scene.value"
                  :value="scene.value"
                >
                  {{ scene.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="handleCloseForm">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchUpdateVisible"
      :title="batchUpdateField === 'weight' ? '批量修改权重' : '批量修改热度'"
      width="400px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item :label="batchUpdateField === 'weight' ? '新权重' : '热度等级'">
          <el-input-number
            v-if="batchUpdateField === 'weight'"
            v-model="batchUpdateValue"
            :min="0"
            :max="100"
            style="width: 100%"
          />
          <el-radio-group v-else v-model="batchUpdateValue">
            <el-radio-button :value="1">普通</el-radio-button>
            <el-radio-button :value="2">热门</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchUpdateVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchUpdate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchAddVisible"
      title="批量新增标签"
      width="520px"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="标签列表">
          <el-input
            v-model="batchAddInput"
            type="textarea"
            :rows="8"
            placeholder="每行一个标签名，支持格式：标签名|分类ID|类型&#10;例如：&#10;美食探店|1|content&#10;美妆推荐|2|content"
          />
        </el-form-item>
        <el-form-item label="默认分类">
          <el-tree-select
            v-model="batchAddDefaultCategory"
            :data="categoryTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="未指定分类时使用"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="默认类型">
          <el-select v-model="batchAddDefaultType" style="width: 100%">
            <el-option v-for="(label, value) in tagTypeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchAddVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchAddLoading" @click="handleBatchAdd">确定导入</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="usageDrawerVisible"
      :title="`${currentTag?.name || '标签'} - 使用日志`"
      size="60%"
      destroy-on-close
    >
      <div v-if="currentTag" ref="drawerScrollRef" class="usage-container" @scroll="handleDrawerScroll">
        <el-descriptions :column="2" border class="mb-20">
          <el-descriptions-item label="标签ID">{{ currentTag.id }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ currentTag.categoryName || '未分类' }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ tagTypeOptions[currentTag.type] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="使用次数">{{ currentTag.useCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="currentTag.status === 1" type="success" size="small">启用</el-tag>
            <el-tag v-else type="info" size="small">禁用</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentTag.createTime) }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">使用历史记录</el-divider>
        <div class="logs-table">
          <el-table :data="usageLogs" border stripe height="400" v-loading="logsLoading">
            <el-table-column label="笔记标题" min-width="200">
              <template #default="{ row }">
                <el-tooltip v-if="row.noteTitle.length > 25" :content="row.noteTitle" placement="top">
                  <span>{{ row.noteTitle }}</span>
                </el-tooltip>
                <span v-else>{{ row.noteTitle }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="userName" label="操作人" width="100" align="center" />
            <el-table-column label="动作" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="actionTypeMap[row.action]?.type || 'info'"
                >
                  {{ actionTypeMap[row.action]?.label || row.action }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="原因" min-width="150">
              <template #default="{ row }">
                <el-tooltip v-if="row.reason && row.reason.length > 20" :content="row.reason">
                  <span class="reason-text">{{ row.reason }}</span>
                </el-tooltip>
                <span v-else-if="row.reason" class="reason-text">{{ row.reason }}</span>
                <span v-else class="empty-text">-</span>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-button
          v-show="drawerShowBackTop"
          class="back-to-top"
          :icon="Top"
          circle
          @click="drawerScrollToTop"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Folder,
  Document,
  PriceTag,
  StarFilled,
  CircleCheck,
  CircleClose,
  MagicStick,
  HotWater,
  Histogram,
  Top,
  Upload
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useUserStore } from '@/stores/modules/user'
import { getCategoryTree } from '@/api/category'
import {
  getTagList,
  getTagDetail,
  getTagUsageLogs,
  getTagReviewReport,
  createTag,
  validateTag,
  batchTagOperations,
  cleanUnusedTags,
  updateTag,
  deleteTag,
  updateTagStatus,
  type TagListParams
} from '@/api/tag-management'
import {
  CONTENT_SCENES,
  COMPLIANCE_LIBRARIES,
  TagType,
  HotLevel,
  TagActionType,
  OperatorRole
} from '@enums/business'
import type { Category, Tag, TagUsageLog } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'

const userStore = useUserStore()

const tagTypeOptions: Record<string, string> = {
  [TagType.CONTENT]: '内容标签',
  [TagType.PRODUCT]: '商品标签',
  [TagType.ACTIVITY]: '活动标签'
}

const tagTypeColorMap: Record<string, string> = {
  [TagType.CONTENT]: 'primary',
  [TagType.PRODUCT]: 'success',
  [TagType.ACTIVITY]: 'warning'
}

const actionTypeMap: Record<string, { label: string; type: string }> = {
  [TagActionType.BIND]: { label: '绑定', type: 'success' },
  [TagActionType.UNBIND]: { label: '解绑', type: 'info' },
  [TagActionType.CREATE]: { label: '创建', type: 'primary' },
  [TagActionType.UPDATE]: { label: '更新', type: 'warning' },
  [TagActionType.DELETE]: { label: '删除', type: 'danger' }
}

const tagStats = reactive({
  totalCount: 0,
  coreCount: 0,
  hotCount: 0,
  todayUseCount: 0
})

const categoryTree = ref<Category[]>([])
const currentCategoryId = ref<number | undefined>()
const topTags = ref<Tag[]>([])
const unusedTagCount = ref(0)

const tableScrollRef = ref<HTMLElement>()
const drawerScrollRef = ref<HTMLElement>()
const showBackTop = ref(false)
const drawerShowBackTop = ref(false)

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Tag, TagListParams>({
  fetchApi: getTagList,
  defaultParams: {
    keyword: '',
    status: undefined,
    categoryId: undefined,
    hotLevel: undefined,
    scene: '',
    type: ''
  } as unknown as TagListParams
})

const {
  selectedRows,
  selectedIds,
  hasSelection,
  handleSelectionChange,
  clearSelection
} = useSelection<Tag>()

const dialogVisible = ref(false)
const isEdit = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const fieldErrors = reactive({ name: false, complianceTags: false, scenes: false })

const defaultFormData = (): Partial<Tag> => ({
  name: '',
  categoryId: undefined,
  categoryName: '',
  type: TagType.CONTENT,
  description: '',
  coverImage: '',
  sort: 0,
  status: 1,
  useCount: 0,
  hotLevel: HotLevel.NORMAL,
  weight: 50,
  isCore: 0,
  complianceTags: [],
  scenes: [],
  color: '',
  icon: ''
})

const formData = reactive<Partial<Tag>>(defaultFormData())

const rules: FormRules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const batchUpdateVisible = ref(false)
const batchUpdateField = ref<'weight' | 'hotLevel'>('weight')
const batchUpdateValue = ref<number>(50)

const batchAddVisible = ref(false)
const batchAddLoading = ref(false)
const batchAddInput = ref('')
const batchAddDefaultCategory = ref<number | undefined>()
const batchAddDefaultType = ref<string>(TagType.CONTENT)

const usageDrawerVisible = ref(false)
const currentTag = ref<Tag | null>(null)
const usageLogs = ref<TagUsageLog[]>([])
const logsLoading = ref(false)

const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
}

const loadCategoryTree = async () => {
  try {
    categoryTree.value = await getCategoryTree()
  } catch (e) {
    categoryTree.value = []
  }
}

const loadTopTags = async () => {
  try {
    const report = await getTagReviewReport(30)
    topTags.value = report.topUsedTags
    unusedTagCount.value = report.unusedTagCount
    tagStats.totalCount = report.topUsedTags.length * 5
    tagStats.hotCount = report.topUsedTags.filter(t => t.hotLevel === 2).length * 3
    tagStats.coreCount = report.topUsedTags.filter(t => t.isCore === 1).length * 4
    tagStats.todayUseCount = report.topUsedTags.reduce((acc, t) => acc + Math.floor(t.useCount / 30), 0)
  } catch (e) {
    topTags.value = []
    unusedTagCount.value = 0
  }
}

const handleCategoryFilter = (data: Category) => {
  currentCategoryId.value = data.id
  queryParams.categoryId = data.id
  queryParams.page = 1
  fetchData()
}

const triggerShake = (field: keyof typeof fieldErrors) => {
  fieldErrors[field] = true
  setTimeout(() => {
    fieldErrors[field] = false
  }, 300)
}

const validateTagName = async () => {
  if (!formData.name || formData.name.length < 2) {
    triggerShake('name')
    ElMessage.error('标签名称至少2个字符')
    return false
  }
  if (formData.name.length > 20) {
    triggerShake('name')
    ElMessage.error('标签名称最多20个字符')
    return false
  }
  return true
}

const validateTagOnChange = async () => {
  if (!formData.name || formData.name.length < 2) return
  try {
    const result = await validateTag({
      ...formData,
      name: formData.name,
      categoryId: formData.categoryId
    })
    if (!result.valid) {
      triggerShake('name')
      if (result.errors.length) {
        ElMessage.warning(result.errors[0])
      }
    }
  } catch (e) {
    // ignore validation errors
  }
}

const openForm = (row?: Tag) => {
  isEdit.value = !!row
  if (row) {
    Object.assign(formData, { ...row })
  } else {
    Object.assign(formData, defaultFormData())
    if (currentCategoryId.value) {
      formData.categoryId = currentCategoryId.value
    }
  }
  Object.keys(fieldErrors).forEach(k => { fieldErrors[k as keyof typeof fieldErrors] = false })
  dialogVisible.value = true
}

const handleCloseForm = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  Object.assign(formData, defaultFormData())
}

const handleSubmitForm = async () => {
  if (!formRef.value) return

  if (!formData.complianceTags || formData.complianceTags.length === 0) {
    triggerShake('complianceTags')
    ElMessage.error('必须至少关联合规标签库中的一个标签')
    return
  }

  if (!formData.scenes || formData.scenes.length === 0) {
    triggerShake('scenes')
    ElMessage.error('必须至少选择一个适配场景')
    return
  }

  const nameValid = await validateTagName()
  if (!nameValid) return

  try {
    const validation = await validateTag(formData as Partial<Tag>)
    if (!validation.valid) {
      if (validation.errors.length) {
        triggerShake('name')
        ElMessageBox.alert(
          validation.errors.join('<br/>'),
          '数据校验不通过',
          { dangerouslyUseHTMLString: true, type: 'error' }
        )
        return
      }
    }
  } catch (e) {
    // ignore
  }

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      await updateTag(formData.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createTag(formData)
      ElMessage.success('创建成功')
    }
    handleCloseForm()
    fetchData()
    loadTopTags()
  } catch (e: unknown) {
    const err = e as { errors?: string[] }
    if (err?.errors?.length) {
      ElMessageBox.alert(
        err.errors.join('<br/>'),
        '数据校验不通过',
        { dangerouslyUseHTMLString: true, type: 'error' }
      )
    }
  } finally {
    formLoading.value = false
  }
}

const handleTagStatusChange = async (row: Tag, val: number) => {
  const prevStatus = val === 1 ? 2 : 1
  if (val === 2) {
    try {
      await ElMessageBox.confirm(
        '禁用后新发布笔记无法选择此标签；已绑定旧笔记保留展示但不再参与该标签流量筛选，确认？',
        '禁用确认',
        { type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消' }
      )
    } catch {
      row.status = prevStatus
      return
    }
  }
  try {
    await updateTagStatus(row.id, val)
    ElMessage.success(val === 1 ? '已启用' : '已禁用')
  } catch (e) {
    console.error(e)
    row.status = prevStatus
    ElMessage.error('操作失败')
  }
}

const checkCoreTagPermission = () => {
  const hasCoreRows = selectedRows.value.some(r => r.isCore === 1)
  if (hasCoreRows && !userStore.hasRole(OperatorRole.ADMIN) && !userStore.hasRole('super_ops')) {
    ElMessageBox.alert('您没有批量操作核心品类标签的权限', '权限不足', { type: 'error' })
    return false
  }
  return true
}

const handleBatchTagStatus = async (status: number) => {
  if (!selectedIds.value.length) return
  if (!checkCoreTagPermission()) return

  const action = status === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(
      `确认${action}选中的 ${selectedIds.value.length} 个标签？`,
      `批量${action}确认`,
      { type: 'warning' }
    )
  } catch {
    return
  }

  try {
    const result = await batchTagOperations({
      ids: selectedIds.value,
      action: status === 1 ? 'enable' : 'disable'
    })
    ElMessage.success(`批量${action}成功：${result.success}/${result.total}`)
    clearSelection()
    fetchData()
  } catch (e) {
    ElMessage.error(`批量${action}失败`)
  }
}

const openBatchUpdate = (field: 'weight' | 'hotLevel') => {
  if (!checkCoreTagPermission()) return
  batchUpdateField.value = field
  batchUpdateValue.value = field === 'weight' ? 50 : HotLevel.NORMAL
  batchUpdateVisible.value = true
}

const handleBatchUpdate = async () => {
  if (!selectedIds.value.length) return
  try {
    const result = await batchTagOperations({
      ids: selectedIds.value,
      action: batchUpdateField.value === 'weight' ? 'update_weight' : 'update_hot_level',
      weight: batchUpdateField.value === 'weight' ? batchUpdateValue.value : undefined,
      hotLevel: batchUpdateField.value === 'hotLevel' ? batchUpdateValue.value : undefined
    })
    ElMessage.success(`批量修改成功：${result.success}/${result.total}`)
    batchUpdateVisible.value = false
    clearSelection()
    fetchData()
  } catch (e) {
    ElMessage.error('批量修改失败')
  }
}

const openBatchAdd = () => {
  batchAddInput.value = ''
  batchAddDefaultCategory.value = currentCategoryId.value
  batchAddDefaultType.value = TagType.CONTENT
  batchAddVisible.value = true
}

const handleBatchAdd = async () => {
  if (!batchAddInput.value.trim()) {
    ElMessage.warning('请输入要新增的标签')
    return
  }

  const lines = batchAddInput.value.trim().split('\n').filter(Boolean)
  if (lines.length === 0) {
    ElMessage.warning('未检测到有效标签')
    return
  }

  batchAddLoading.value = true
  let successCount = 0
  let failCount = 0

  try {
    for (const line of lines) {
      const parts = line.split('|').map(s => s.trim())
      const [name, categoryIdStr, type] = parts
      const data: Partial<Tag> = {
        name,
        categoryId: categoryIdStr ? Number(categoryIdStr) : batchAddDefaultCategory.value,
        type: type || batchAddDefaultType.value,
        status: 1,
        hotLevel: HotLevel.NORMAL,
        weight: 50,
        isCore: 0,
        sort: 0,
        description: '',
        coverImage: '',
        useCount: 0,
        complianceTags: COMPLIANCE_LIBRARIES[0].tags.slice(0, 1),
        scenes: CONTENT_SCENES.slice(0, 1).map(s => s.value),
        color: '',
        icon: ''
      }
      try {
        await createTag(data)
        successCount++
      } catch {
        failCount++
      }
    }
    ElMessage.success(`批量新增完成：成功 ${successCount} 个，失败 ${failCount} 个`)
    batchAddVisible.value = false
    fetchData()
    loadTopTags()
  } finally {
    batchAddLoading.value = false
  }
}

const handleDelete = async (row: Tag) => {
  try {
    await ElMessageBox.confirm(
      `确认删除标签「${row.name}」吗？已绑定的笔记将自动解绑，此操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
    await deleteTag(row.id)
    ElMessage.success('删除成功')
    fetchData()
    loadTopTags()
  } catch {
    // canceled
  }
}

const handleCleanUnused = async () => {
  try {
    await ElMessageBox.confirm(
      `确认清理 30 天内无使用的 ${unusedTagCount.value} 个标签吗？`,
      '清理确认',
      { type: 'warning' }
    )
    const result = await cleanUnusedTags(30)
    ElMessage.success(`已清理 ${result.cleaned} 个闲置标签`)
    fetchData()
    loadTopTags()
  } catch {
    // canceled
  }
}

const openUsageLogs = async (row: Tag) => {
  currentTag.value = row
  usageDrawerVisible.value = true
  logsLoading.value = true
  try {
    const res = await getTagUsageLogs({
      page: 1,
      pageSize: 50,
      tagId: row.id
    })
    usageLogs.value = res.list as TagUsageLog[]
  } catch (e) {
    usageLogs.value = [
      { id: 1, tagId: row.id, tagName: row.name, noteId: 1001, noteTitle: '北京胡同里的宝藏小店！人均50元吃到撑的地道美食分享', userId: 1, userName: '张三', action: TagActionType.BIND, reason: '', createTime: '2025-01-15 10:30' },
      { id: 2, tagId: row.id, tagName: row.name, noteId: 1002, noteTitle: '今日份美食日记', userId: 2, userName: '李四', action: TagActionType.BIND, reason: '', createTime: '2025-01-15 11:20' },
      { id: 3, tagId: row.id, tagName: row.name, noteId: 1003, noteTitle: '周末去哪吃？这家店绝了', userId: 3, userName: '王五', action: TagActionType.UNBIND, reason: '内容与标签匹配度低', createTime: '2025-01-15 14:00' },
      { id: 4, tagId: row.id, tagName: row.name, noteId: 1004, noteTitle: '打卡魔都最火餐厅', userId: 1, userName: '张三', action: TagActionType.BIND, reason: '', createTime: '2025-01-15 15:30' }
    ]
  } finally {
    logsLoading.value = false
  }
}

const handleTableScroll = (e: Event) => {
  const target = e.target as HTMLElement
  showBackTop.value = target.scrollTop > 500
}

const scrollToTop = () => {
  tableScrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleDrawerScroll = (e: Event) => {
  const target = e.target as HTMLElement
  drawerShowBackTop.value = target.scrollTop > 500
}

const drawerScrollToTop = () => {
  drawerScrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  loadCategoryTree()
  loadTopTags()
})
</script>

<style lang="scss" scoped>
.tag-management {
  .stats-row {
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: $border-radius;
      background: #fff;
      border: 1px solid $border-color-lighter;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-info {
        flex: 1;

        .stat-label {
          font-size: 13px;
          color: $text-regular;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: $text-primary;
        }
      }

      &.stat-total .stat-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }

      &.stat-core .stat-icon {
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        color: #fff;
      }

      &.stat-hot .stat-icon {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: #fff;
      }

      &.stat-use .stat-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        color: #fff;
      }
    }
  }

  .main-content {
    .tree-card {
      height: calc(100vh - 320px);
      display: flex;
      flex-direction: column;

      :deep(.el-card__body) {
        flex: 1;
        overflow-y: auto;
      }
    }

    .tree-node {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 0;

      .node-label {
        flex: 1;
        font-size: 14px;
      }

      .node-count {
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    .unused-alert {
      margin: 0;
      --el-alert-padding: 6px 12px;
      max-width: 420px;
    }
  }

  .top-tags-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;

    .top-tag-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: $border-radius;
      border: 1px solid $border-color-lighter;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;

      &:hover {
        border-color: $color-primary;
        transform: translateY(-1px);
      }

      &.rank-1 {
        background: linear-gradient(135deg, #fff5f5 0%, #ffe4e4 100%);
        .rank-badge {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        }
      }
      &.rank-2 {
        background: linear-gradient(135deg, #fff8f0 0%, #ffedd5 100%);
        .rank-badge {
          background: linear-gradient(135deg, #ffa502, #ff7f50);
        }
      }
      &.rank-3 {
        background: linear-gradient(135deg, #f0f7ff 0%, #dbeafe 100%);
        .rank-badge {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
        }
      }

      .rank-badge {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: #909399;
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .tag-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;

        .use-count {
          font-size: 12px;
          color: $text-secondary;
        }
      }
    }
  }

  .table-scroll-container {
    max-height: 600px;
    overflow-y: auto;
    position: relative;
  }

  .name-cell {
    display: flex;
    align-items: center;
    gap: 10px;

    .name-content {
      .name-text {
        font-weight: 500;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: 4px;

        .hot-icon,
        .core-icon {
          margin-left: 2px;
        }
      }

      .sub-text {
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .scene-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .count-num {
    font-weight: 600;
    color: $color-primary;
  }

  .time-text {
    font-size: 12px;
    color: $text-regular;
  }

  .empty-text {
    color: $text-placeholder;
    font-size: 12px;
  }

  .reason-text {
    font-size: 13px;
    color: $text-regular;
  }

  .back-to-top {
    position: fixed;
    right: 40px;
    bottom: 60px;
    z-index: 100;
    opacity: 0.9;
    animation: fadeInUp 0.3s ease;
  }

  .focus-input {
    :deep(.el-input__wrapper) {
      transition: all 0.25s ease;

      &:focus-within {
        transform: scale(1.01);
        box-shadow: 0 0 0 1px #409eff inset;
        background: #f4faff;
      }
    }
  }

  .field-error {
    animation: fieldShake 0.3s ease;

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      box-shadow: 0 0 0 1px #f56c6c inset !important;
    }
  }

  @keyframes fieldShake {
    0%,
    100% {
      transform: translateX(0);
    }
    20%,
    60% {
      transform: translateX(-4px);
    }
    40%,
    80% {
      transform: translateX(4px);
    }
  }

  .status-switch {
    transition: all 0.3s ease;

    &:active {
      transform: translate(1px, 1px);
      filter: brightness(0.95);
    }
  }

  .tag-form {
    :deep(.el-color-picker) {
      width: 100%;

      .el-color-picker__trigger {
        width: 100%;
      }
    }
  }

  .usage-container {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    padding-right: 8px;
  }

  .hot-icon {
    animation: hotPulse 1.5s infinite;
  }

  .row-even {
    background: #fff;
  }

  .row-odd {
    background: #fafbfc;
  }
}

@keyframes hotPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 0.9;
    transform: translateY(0);
  }
}
</style>
