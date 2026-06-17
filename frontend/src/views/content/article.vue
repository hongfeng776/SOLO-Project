<template>
  <div class="page-container article-manage">
    <div class="search-section">
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        :inline="true"
        label-width="auto"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.title"
            placeholder="标题/编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="领域分类">
          <el-select
            v-model="searchForm.domainCategoryId"
            placeholder="请选择"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in domainCategoryList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发布渠道">
          <el-select
            v-model="searchForm.channel"
            placeholder="请选择"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(item, key) in ChannelMap"
              :key="key"
              :label="item.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(item, key) in ArticleStatusMap"
              :key="key"
              :label="item.label"
              :value="Number(key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否置顶">
          <el-select
            v-model="searchForm.topFlag"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="阅读量">
          <el-slider
            v-model="viewCountRange"
            range
            :min="0"
            :max="100000"
            :step="1000"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="点赞量">
          <el-slider
            v-model="likeCountRange"
            range
            :min="0"
            :max="10000"
            :step="100"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="publishDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-button type="primary" @click="openCreateDrawer">
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button
          type="success"
          :disabled="!selectedRows.length || !batchAbility.canTop"
          @click="handleBatchTop"
        >
          <el-icon><Top /></el-icon>批量置顶
        </el-button>
        <el-button
          type="warning"
          :disabled="!selectedRows.length || !batchAbility.canOffline"
          @click="openBatchOfflineDialog"
        >
          <el-icon><Bottom /></el-icon>批量下架
        </el-button>
        <el-button
          :disabled="!selectedRows.length || !batchAbility.canAssignTopic"
          @click="openBatchAssignTopicDialog"
        >
          <el-icon><Collection /></el-icon>批量归类专题
        </el-button>
        <el-button
          type="danger"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </div>
    </div>

    <div v-if="selectedRows.length" class="batch-actions">
      <span class="batch-info">已选择 {{ selectedRows.length }} 项</span>
      <el-button link type="primary" @click="handleClearSelection">取消选择</el-button>
    </div>

    <el-table
      ref="tableRef"
      :data="tableData"
      :loading="loading"
      v-loading="loading"
      highlight-current-row
      class="article-table"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
    >
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column type="index" label="序号" width="60" align="center">
        <template #default="{ $index }">
          {{ (pagination.currentPage - 1) * pagination.pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="封面" width="80" align="center">
        <template #default="{ row }">
          <el-image
            v-if="row.coverImage"
            :src="row.coverImage"
            :preview-src-list="[row.coverImage]"
            fit="cover"
            style="width: 48px; height: 48px; border-radius: 4px;"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="260">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.title && row.title.length > 30"
            :content="row.title"
            effect="dark"
            placement="top"
            :show-after="300"
          >
            <span class="link-btn" @click.stop="openTraceDialog(row)">
              {{ row.title.slice(0, 30) }}...
            </span>
          </el-tooltip>
          <span v-else class="link-btn" @click.stop="openTraceDialog(row)">{{ row.title }}</span>
          <div class="mt-2 flex flex-wrap gap-1">
            <el-tag
              v-if="row.topFlag"
              size="small"
              type="danger"
              effect="dark"
            >置顶</el-tag>
            <el-tag
              v-if="row.topicName"
              size="small"
              type="warning"
              effect="light"
            >专题:{{ row.topicName }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="uniqueCode" label="编码" width="140" />
      <el-table-column label="领域分类" width="120">
        <template #default="{ row }">
          {{ row.domainCategoryName || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="渠道" width="100">
        <template #default="{ row }">
          <el-tag
            v-if="row.channel"
            size="small"
            :type="ChannelMap[row.channel]?.type"
            effect="light"
          >
            {{ ChannelMap[row.channel]?.label }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="ArticleStatusMap[row.status]?.type"
            effect="light"
            size="small"
          >
            <el-icon v-if="row.status === ArticleStatus.Pending" class="is-rotating"><Timer /></el-icon>
            {{ ArticleStatusMap[row.status]?.label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="wordCount" label="字数" width="90" align="right" />
      <el-table-column prop="viewCount" label="阅读" width="80" align="right" />
      <el-table-column prop="likeCount" label="点赞" width="80" align="right" />
      <el-table-column prop="version" label="版本" width="80" align="center" />
      <el-table-column label="发布时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.publishedAt || row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            :disabled="!row.abilityList?.canEdit"
            @click="openEditDrawer(row)"
          >编辑</el-button>
          <el-button link type="success" @click="openTraceDialog(row)">溯源</el-button>
          <el-button link type="warning" @click="openQualityDialog(row)">质量</el-button>
          <el-button
            link
            type="success"
            :disabled="!row.abilityList?.canTop"
            @click="handleTop(row)"
          >{{ row.topFlag ? '取消置顶' : '置顶' }}</el-button>
          <el-button
            link
            type="warning"
            :disabled="!row.abilityList?.canOffline"
            @click="handleOffline(row)"
          >下架</el-button>
          <el-button
            link
            type="danger"
            :disabled="!row.abilityList?.canDelete"
            @click="handleDelete(row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-section">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <el-drawer
      v-model="createDrawerVisible"
      :title="isEditMode ? '编辑图文' : '新增图文'"
      direction="rtl"
      size="720px"
      :destroy-on-close="true"
      class="article-form"
    >
      <template v-if="!isEditMode">
        <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="createFormRules"
          label-width="100px"
        >
          <el-divider content-position="left">基础配置</el-divider>
          <el-form-item label="领域分类" prop="domainCategoryId">
            <el-select
              v-model="createForm.domainCategoryId"
              placeholder="请选择领域分类"
              style="width: 100%"
              @change="handleDomainChange"
            >
              <el-option
                v-for="item in domainCategoryList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="发布权限">
            <el-checkbox v-model="createForm.useOwnPermission">
              使用当前用户拥有的发布权限
            </el-checkbox>
          </el-form-item>
          <el-form-item label="发布渠道" prop="channel">
            <el-select
              v-model="createForm.channel"
              placeholder="请选择发布渠道"
              style="width: 100%"
              @change="handleChannelChange"
            >
              <el-option
                v-for="(item, key) in ChannelMap"
                :key="key"
                :label="item.label"
                :value="key as Channel"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="关联专题">
            <el-select
              v-model="createForm.topicId"
              placeholder="可选，关联到专题"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="topic in topicList"
                :key="topic.id"
                :label="topic.name"
                :value="topic.id"
              />
            </el-select>
          </el-form-item>

          <template v-if="channelTemplates.length">
            <el-divider content-position="left">模板选择</el-divider>
            <el-alert
              v-if="wordConfig.maxWord"
              :title="`字数规则：${wordConfig.minWord} - ${wordConfig.maxWord} 字`"
              type="info"
              :closable="false"
              show-icon
              class="mb-4"
            />
            <el-tabs v-model="createForm.template" type="card" class="template-tabs">
              <el-tab-pane
                v-for="tpl in channelTemplates"
                :key="tpl.key"
                :label="tpl.name"
                :name="tpl.key"
              >
                <div class="template-preview-card">
                  <div class="preview-placeholder">
                    <el-icon :size="48"><Picture /></el-icon>
                    <p>{{ tpl.name }} - 模板预览</p>
                    <p class="preview-desc">{{ tpl.preview }}</p>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </template>

          <el-divider content-position="left">内容编辑</el-divider>
          <el-form-item
            label="标题"
            prop="title"
            :class="{ 'is-shake': titleDuplicate }"
          >
            <el-input
              v-model="createForm.title"
              placeholder="请输入标题"
              maxlength="100"
              show-word-limit
              @blur="handleTitleBlur"
            />
            <div v-if="titleDuplicate" class="mt-2">
              <el-tag size="small" type="warning" effect="dark">
                <el-icon><Warning /></el-icon>疑似重复
              </el-tag>
            </div>
          </el-form-item>
          <el-form-item label="摘要" prop="summary">
            <el-input
              v-model="createForm.summary"
              type="textarea"
              :rows="3"
              placeholder="请输入摘要"
              maxlength="300"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="正文" prop="content" class="content-form-item">
            <el-input
              ref="contentInputRef"
              v-model="createForm.content"
              type="textarea"
              :rows="10"
              placeholder="请输入正文内容"
              @input="debouncedContentValidate"
            />
            <div class="word-progress mt-2">
              <el-progress
                :percentage="contentWordPercent"
                :color="wordProgressColor"
                :status="contentWordPercent > 100 ? 'exception' : undefined"
              />
              <span class="word-count-text">
                已输入 {{ contentWordCount }} / {{ wordConfig.maxWord || 5000 }} 字
              </span>
            </div>
          </el-form-item>
          <el-form-item label="封面图">
            <el-input
              v-model="createForm.coverImage"
              placeholder="请输入封面图URL"
            />
          </el-form-item>
          <el-form-item label="配图">
            <div v-for="(img, idx) in createForm.images" :key="idx" class="image-input-item mb-2">
              <el-input v-model="createForm.images[idx]" placeholder="配图URL" />
              <el-button
                link
                type="danger"
                @click="removeImage(idx)"
                class="ml-2"
              >移除</el-button>
            </div>
            <el-button size="small" @click="addImage">
              <el-icon><Plus /></el-icon>添加配图
            </el-button>
          </el-form-item>

          <template v-if="sensitiveHits.length">
            <el-divider content-position="left">敏感词检测</el-divider>
            <el-alert
              title="检测到敏感词，请修改后再提交"
              type="error"
              :closable="false"
              show-icon
              class="mb-4"
            />
            <div class="sensitive-tags flex flex-wrap gap-2 mb-4">
              <el-tag
                v-for="(hit, idx) in sensitiveHits"
                :key="idx"
                :type="SensitiveLevelMap[hit.level]?.type || 'warning'"
                effect="dark"
              >
                <el-popover
                  :content="`上下文: ${hit.context}`"
                  placement="top"
                  trigger="hover"
                >
                  <template #reference>
                    <span>{{ hit.word }}</span>
                  </template>
                </el-popover>
                <span class="ml-1">[{{ SensitiveLevelMap[hit.level]?.label }}]</span>
              </el-tag>
            </div>
          </template>

          <template v-if="validateErrors.length">
            <el-divider content-position="left">校验错误</el-divider>
            <el-alert
              v-for="(err, idx) in validateErrors"
              :key="idx"
              :title="err.message"
              type="error"
              :closable="false"
              show-icon
              class="mb-2"
            />
          </template>
        </el-form>

        <template #footer>
          <el-button @click="createDrawerVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitLoading"
            @click="handleCreateSubmit"
          >
            <transition name="fade" mode="out-in">
              <span v-if="!submitLoading">提交创建</span>
              <span v-else>提交中...</span>
            </transition>
          </el-button>
        </template>
      </template>

      <template v-else>
        <div class="edit-mode-header">
          <el-alert
            v-if="currentEditMode"
            :title="editModeTitle"
            :type="currentEditMode.mode === 'draft' ? 'success' : 'warning'"
            :closable="false"
            show-icon
          >
            <template #default>
              <el-tag
                :type="currentEditMode.mode === 'draft' ? 'success' : 'warning'"
                effect="light"
                size="small"
                class="ml-2"
              >
                {{ currentEditMode.mode === 'draft' ? '无需审核' : currentEditMode.needReview ? '需重新审核' : '直接发布' }}
              </el-tag>
            </template>
          </el-alert>

          <el-radio-group
            v-if="currentEditMode?.mode === 'published'"
            v-model="editType"
            class="mt-4"
            @change="handleEditTypeChange"
          >
            <el-radio value="incremental" border>
              增量修改(可修改部分字段)
            </el-radio>
            <el-radio value="full" border>
              全覆盖修改(整体替换)
            </el-radio>
          </el-radio-group>
        </div>

        <el-form
          ref="editFormRef"
          :model="editForm"
          :rules="editFormRules"
          label-width="100px"
          class="mt-4"
        >
          <el-form-item label="标题">
            <div :class="{ 'readonly-field': editType === 'incremental' }">
              <el-input
                v-model="editForm.title"
                :readonly="editType === 'incremental'"
                placeholder="请输入标题"
              />
              <span v-if="editType === 'incremental'" class="field-readonly-tag">
                <el-icon><Lock /></el-icon>增量模式不可编辑
              </span>
            </div>
          </el-form-item>
          <el-form-item label="摘要">
            <el-input
              v-model="editForm.summary"
              type="textarea"
              :rows="2"
              placeholder="请输入摘要"
            />
          </el-form-item>
          <el-form-item label="正文">
            <div :class="{ 'readonly-field': editType === 'incremental' }">
              <el-input
                v-model="editForm.content"
                type="textarea"
                :rows="8"
                :readonly="editType === 'incremental'"
                placeholder="请输入正文"
              />
              <span v-if="editType === 'incremental'" class="field-readonly-tag">
                <el-icon><Lock /></el-icon>增量模式不可编辑
              </span>
            </div>
          </el-form-item>
          <el-form-item label="封面图">
            <el-input
              v-model="editForm.coverImage"
              placeholder="请输入封面图URL"
            />
          </el-form-item>
          <el-form-item label="配图">
            <div v-for="(img, idx) in editForm.images" :key="idx" class="image-input-item mb-2">
              <el-input v-model="editForm.images[idx]" placeholder="配图URL" />
              <el-button
                link
                type="danger"
                @click="removeEditImage(idx)"
                class="ml-2"
              >移除</el-button>
            </div>
            <el-button size="small" @click="addEditImage">
              <el-icon><Plus /></el-icon>添加配图
            </el-button>
          </el-form-item>
          <el-form-item
            v-if="editType === 'full'"
            label="领域分类"
          >
            <el-select
              v-model="editForm.domainCategoryId"
              placeholder="请选择领域分类"
              style="width: 100%"
            >
              <el-option
                v-for="item in domainCategoryList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="editType === 'full'"
            label="模板"
          >
            <el-select
              v-model="editForm.template"
              placeholder="请选择模板"
              style="width: 100%"
            >
              <el-option
                v-for="tpl in channelTemplates"
                :key="tpl.key"
                :label="tpl.name"
                :value="tpl.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="修改说明" prop="changeLog">
            <el-input
              v-model="editForm.changeLog"
              type="textarea"
              :rows="2"
              placeholder="请输入本次修改说明"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="createDrawerVisible = false">取消</el-button>
          <el-button
            v-if="currentEditMode?.mode === 'draft'"
            type="success"
            :loading="editLoading"
            @click="handleSaveDraft"
          >
            <transition name="fade" mode="out-in">
              <span v-if="!editLoading">保存草稿</span>
              <span v-else>保存中...</span>
            </transition>
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="editLoading"
            @click="handleEditSubmit"
          >
            <transition name="fade" mode="out-in">
              <span v-if="!editLoading">
                {{ editType === 'incremental' ? '提交增量修改' : '提交全覆盖修改' }}
              </span>
              <span v-else>提交中...</span>
            </transition>
          </el-button>
        </template>
      </template>
    </el-drawer>

    <el-dialog
      v-model="traceDialogVisible"
      :title="`内容溯源 - ${currentTraceArticle?.title || ''}`"
      width="900px"
      :close-on-click-modal="false"
      class="trace-dialog"
    >
      <el-tabs v-model="traceActiveTab">
        <el-tab-pane label="基础信息" name="basic">
          <el-descriptions :column="2" border v-if="traceData?.basic">
            <el-descriptions-item label="标题">{{ traceData.basic.title }}</el-descriptions-item>
            <el-descriptions-item label="编码">{{ traceData.basic.uniqueCode }}</el-descriptions-item>
            <el-descriptions-item label="渠道">
              {{ ChannelMap[traceData.basic.channel]?.label }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              {{ ArticleStatusMap[traceData.basic.status]?.label }}
            </el-descriptions-item>
            <el-descriptions-item label="版本">{{ traceData.basic.version }}</el-descriptions-item>
            <el-descriptions-item label="字数">{{ traceData.basic.wordCount }}</el-descriptions-item>
            <el-descriptions-item label="阅读量">{{ traceData.basic.viewCount }}</el-descriptions-item>
            <el-descriptions-item label="点赞量">{{ traceData.basic.likeCount }}</el-descriptions-item>
            <el-descriptions-item label="发布人">
              {{ traceData.basic.publisherName }}
            </el-descriptions-item>
            <el-descriptions-item label="发布时间">
              {{ formatDateTime(traceData.basic.publishedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="摘要" :span="2">
              {{ traceData.basic.summary }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="版本历史" name="version">
          <div class="timeline-section" v-if="traceData?.versionTimeline?.length">
            <el-timeline>
              <el-timeline-item
                v-for="(item, idx) in traceData.versionTimeline"
                :key="idx"
                :timestamp="formatDateTime(item.timestamp)"
                :type="item.type"
                placement="top"
              >
                <h4>{{ item.title }}</h4>
                <p v-if="item.content">{{ item.content }}</p>
                <p v-if="item.operator" class="text-secondary text-sm">
                  操作人: {{ item.operator }}
                </p>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else description="暂无版本历史" />
        </el-tab-pane>
        <el-tab-pane label="专题归属" name="topic">
          <div v-if="traceData?.topicInfo">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>{{ traceData.topicInfo.name }}</span>
                  <el-tag size="small">
                    {{ ChannelMap[traceData.topicInfo.channel]?.label }}
                  </el-tag>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="专题编码">
                  {{ traceData.topicInfo.uniqueCode }}
                </el-descriptions-item>
                <el-descriptions-item label="资源位">
                  {{ traceData.topicInfo.resourceSlot }}
                </el-descriptions-item>
                <el-descriptions-item label="已发布数">
                  {{ traceData.topicInfo.publishedCount }}
                </el-descriptions-item>
                <el-descriptions-item label="排序">{{ traceData.topicInfo.sort }}</el-descriptions-item>
                <el-descriptions-item label="开始日期">
                  {{ traceData.topicInfo.startDate }}
                </el-descriptions-item>
                <el-descriptions-item label="结束日期">
                  {{ traceData.topicInfo.endDate }}
                </el-descriptions-item>
                <el-descriptions-item label="描述" :span="2">
                  {{ traceData.topicInfo.description }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>
          <el-empty v-else description="未关联专题" />
        </el-tab-pane>
        <el-tab-pane label="审核记录" name="review">
          <div class="timeline-section" v-if="traceData?.reviewTimeline?.length">
            <el-timeline>
              <el-timeline-item
                v-for="(item, idx) in traceData.reviewTimeline"
                :key="idx"
                :timestamp="formatDateTime(item.timestamp)"
                :type="item.type"
                placement="top"
              >
                <h4>{{ item.title }}</h4>
                <p v-if="item.content">{{ item.content }}</p>
                <p v-if="item.operator" class="text-secondary text-sm">
                  审核人: {{ item.operator }}
                </p>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else description="暂无审核记录" />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog
      v-model="qualityDialogVisible"
      :title="`质量报告 - ${currentQualityArticle?.title || ''}`"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="qualityReport">
        <div class="quality-score-section">
          <div class="score-ring">
            <el-progress
              type="dashboard"
              :percentage="qualityReport.qualityScore"
              :color="scoreColor"
              :stroke-width="12"
            />
          </div>
          <div class="score-info">
            <h3>质量评分</h3>
            <p class="score-text" :style="{ color: scoreColor }">
              {{ qualityReport.qualityScore }} / 100
            </p>
            <p class="text-secondary">
              {{ qualityLevelText }}
            </p>
          </div>
        </div>

        <el-divider content-position="left">维度明细</el-divider>
        <div class="dimensions-grid">
          <div
            v-for="(dim, idx) in qualityReport.dimensions"
            :key="idx"
            class="dimension-item"
          >
            <div class="dimension-header">
              <span class="dimension-name">{{ dim.name }}</span>
              <span class="dimension-score">
                {{ dim.score }}/{{ dim.maxScore }}
              </span>
            </div>
            <el-progress
              :percentage="Math.round((dim.score / dim.maxScore) * 100)"
              :show-text="false"
              :stroke-width="8"
            />
            <p class="dimension-desc text-secondary text-sm mt-1">
              {{ dim.description }}
            </p>
          </div>
        </div>

        <el-divider content-position="left">配图分辨率检查</el-divider>
        <el-table
          v-if="qualityReport.imageChecks?.length"
          :data="qualityReport.imageChecks"
          size="small"
          border
        >
          <el-table-column label="图片" width="100">
            <template #default="{ row }">
              <el-image
                :src="row.url"
                :preview-src-list="[row.url]"
                fit="cover"
                style="width: 60px; height: 60px; border-radius: 4px;"
              />
            </template>
          </el-table-column>
          <el-table-column label="分辨率">
            <template #default="{ row }">
              {{ row.width }} × {{ row.height }}
            </template>
          </el-table-column>
          <el-table-column label="是否达标" width="100" align="center">
            <template #default="{ row }">
              <el-icon
                :size="20"
                :color="row.resolution达标 ? '#67C23A' : '#F56C6C'"
              >
                <CircleCheck v-if="row.resolution达标" />
                <CircleClose v-else />
              </el-icon>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="无配图数据" :image-size="60" />

        <el-divider content-position="left">警告列表</el-divider>
        <div v-if="qualityReport.warnings?.length">
          <el-alert
            v-for="(warn, idx) in qualityReport.warnings"
            :key="idx"
            :title="warn.message"
            :type="warn.level === 'high' ? 'error' : warn.level === 'medium' ? 'warning' : 'info'"
            :description="warn.detail"
            :closable="false"
            show-icon
            class="mb-2"
          />
        </div>
        <el-empty v-else description="无警告，质量良好！" :image-size="60" />
      </div>
    </el-dialog>

    <el-dialog
      v-model="batchOfflineVisible"
      title="批量下架"
      width="500px"
    >
      <el-form :model="batchOfflineForm" label-width="80px">
        <el-alert
          :title="`确认对选中的 ${selectedRows.length} 条内容执行下架操作？`"
          type="warning"
          :closable="false"
          show-icon
          class="mb-4"
        />
        <el-form-item label="下架原因">
          <el-input
            v-model="batchOfflineForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入下架原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchOfflineVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="handleBatchOffline">
          确认下架
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchAssignTopicVisible"
      title="批量归类专题"
      width="500px"
    >
      <el-form label-width="80px">
        <el-alert
          :title="`将选中的 ${selectedRows.length} 条内容归类到专题`"
          type="info"
          :closable="false"
          show-icon
          class="mb-4"
        />
        <el-form-item label="选择专题">
          <el-select
            v-model="batchAssignTopicForm.topicId"
            placeholder="请选择目标专题"
            style="width: 100%"
          >
            <el-option
              v-for="topic in topicList"
              :key="topic.id"
              :label="topic.name"
              :value="topic.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchAssignTopicVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="batchLoading"
          :disabled="!batchAssignTopicForm.topicId"
          @click="handleBatchAssignTopic"
        >
          确认归类
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Top,
  Bottom,
  Collection,
  Delete,
  Timer,
  Picture,
  Warning,
  Lock,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import {
  getArticleList,
  getArticle,
  createArticle,
  deleteArticle,
  validateArticleCreate,
  getChannelTemplate,
  scanSensitivePreview,
  getEditMode,
  incrementalEdit,
  fullEdit,
  saveDraft,
  batchTopArticles,
  batchOfflineArticles,
  batchAssignTopic,
  getOperableScope,
  batchAbility as getBatchAbility,
  getArticleFullTrace,
  checkDuplicate,
  validateQuality,
  getTopicList,
  getDomainCategoryList,
  type ArticleQueryParams
} from '@/api/article'
import type {
  ArticleInfo,
  Channel,
  EditMode,
  ArticleFullTrace,
  QualityReport,
  SensitiveHit,
  ValidateError,
  ArticleTopic,
  BatchOperScope
} from '@/types/business'
import {
  ArticleStatus,
  ArticleStatusMap,
  ChannelMap,
  SensitiveLevelMap
} from '@/types/business'
import type { Pagination } from '@/types/api'
import { formatDateTime } from '@/utils/date'
import { debounce } from '@/utils/common'

defineOptions({
  name: 'ArticleManage'
})

const tableRef = ref()
const searchFormRef = ref<FormInstance>()
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()
const contentInputRef = ref()

const loading = ref(false)
const submitLoading = ref(false)
const editLoading = ref(false)
const batchLoading = ref(false)

const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref<ArticleInfo[]>([])
const selectedRows = ref<ArticleInfo[]>([])

const searchForm = reactive<ArticleQueryParams & { topFlag?: boolean }>({
  pageNum: 1,
  pageSize: 10,
  title: '',
  domainCategoryId: undefined,
  channel: undefined,
  status: undefined,
  topFlag: undefined,
  topicId: undefined
})

const viewCountRange = ref<[number, number]>([0, 100000])
const likeCountRange = ref<[number, number]>([0, 10000])
const publishDateRange = ref<[string, string] | null>(null)

const domainCategoryList = ref<{ id: number; name: string; parentId?: number }[]>([])
const topicList = ref<ArticleTopic[]>([])
const channelTemplates = ref<{ key: string; name: string; preview: string }[]>([])
const wordConfig = reactive({ minWord: 0, maxWord: 5000 })

const operScope = ref<BatchOperScope>({
  scope: 'self',
  allowedChannels: [],
  allowedDomains: []
})

const batchAbility = reactive({
  canTop: false,
  canOffline: false,
  canAssignTopic: false,
  canEdit: false,
  canDelete: false
})

const createDrawerVisible = ref(false)
const isEditMode = ref(false)
const currentEditId = ref<number | null>(null)
const currentEditMode = ref<EditMode | null>(null)
const editType = ref<'incremental' | 'full'>('incremental')

const traceDialogVisible = ref(false)
const traceActiveTab = ref('basic')
const currentTraceArticle = ref<ArticleInfo | null>(null)
const traceData = ref<ArticleFullTrace | null>(null)

const qualityDialogVisible = ref(false)
const currentQualityArticle = ref<ArticleInfo | null>(null)
const qualityReport = ref<QualityReport | null>(null)

const batchOfflineVisible = ref(false)
const batchOfflineForm = reactive({ reason: '' })
const batchAssignTopicVisible = ref(false)
const batchAssignTopicForm = reactive({ topicId: null as number | null })

const sensitiveHits = ref<SensitiveHit[]>([])
const validateErrors = ref<ValidateError[]>([])
const titleDuplicate = ref(false)

const createForm = reactive({
  domainCategoryId: null as number | null,
  useOwnPermission: true,
  channel: null as Channel | null,
  topicId: null as number | null,
  template: 'default',
  title: '',
  summary: '',
  content: '',
  coverImage: '',
  images: [] as string[]
})

const createFormRules: FormRules = {
  domainCategoryId: [{ required: true, message: '请选择领域分类', trigger: 'change' }],
  channel: [{ required: true, message: '请选择发布渠道', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }]
}

const editForm = reactive({
  title: '',
  summary: '',
  content: '',
  coverImage: '',
  images: [] as string[],
  domainCategoryId: null as number | null,
  template: 'default',
  changeLog: ''
})

const editFormRules: FormRules = {
  changeLog: [{ required: true, message: '请输入修改说明', trigger: 'blur' }]
}

const contentWordCount = computed(() => {
  return (createForm.content || '').length
})

const contentWordPercent = computed(() => {
  const max = wordConfig.maxWord || 5000
  return Math.min(Math.round((contentWordCount.value / max) * 100), 100)
})

const wordProgressColor = computed(() => {
  const percent = contentWordPercent.value
  if (percent < 50) return '#67C23A'
  if (percent < 80) return '#E6A23C'
  if (percent <= 100) return '#F56C6C'
  return '#F56C6C'
})

const editModeTitle = computed(() => {
  if (!currentEditMode.value) return ''
  return currentEditMode.value.mode === 'draft'
    ? '草稿模式 - 可直接保存草稿，无需审核'
    : '正式发布模式 - 修改后需要根据规则提交审核'
})

const scoreColor = computed(() => {
  const score = qualityReport.value?.qualityScore || 0
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
})

const qualityLevelText = computed(() => {
  const score = qualityReport.value?.qualityScore || 0
  if (score >= 90) return '优秀 - 内容质量非常好'
  if (score >= 80) return '良好 - 内容质量较好'
  if (score >= 60) return '一般 - 建议优化部分内容'
  return '较差 - 需要重点优化'
})

const debouncedContentValidate = debounce(async () => {
  if (!createForm.content) {
    sensitiveHits.value = []
    return
  }
  try {
    const text = `${createForm.title || ''} ${createForm.content}`
    const [validateRes, scanRes] = await Promise.all([
      validateArticleCreate({
        title: createForm.title,
        content: createForm.content,
        channel: createForm.channel || undefined,
        domainCategoryId: createForm.domainCategoryId || undefined,
        topicId: createForm.topicId || undefined
      }),
      scanSensitivePreview(text)
    ])
    if (validateRes.data) {
      validateErrors.value = validateRes.data.errors || []
      sensitiveHits.value = validateRes.data.sensitiveHits || []
      if (validateRes.data.wordConfig) {
        wordConfig.minWord = validateRes.data.wordConfig.minWord
        wordConfig.maxWord = validateRes.data.wordConfig.maxWord
      }
    }
    if (scanRes.data) {
      sensitiveHits.value = [...sensitiveHits.value, ...scanRes.data]
    }
  } catch {
  }
}, 300)

const fetchData = async () => {
  loading.value = true
  try {
    const params: ArticleQueryParams = {
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize,
      title: searchForm.title || undefined,
      domainCategoryId: searchForm.domainCategoryId,
      channel: searchForm.channel,
      status: searchForm.status,
      topFlag: searchForm.topFlag,
      topicId: searchForm.topicId,
      minViewCount: viewCountRange.value[0],
      maxViewCount: viewCountRange.value[1],
      minLikeCount: likeCountRange.value[0],
      maxLikeCount: likeCountRange.value[1],
      startDate: publishDateRange.value?.[0],
      endDate: publishDateRange.value?.[1]
    }
    const res = await getArticleList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch {
  } finally {
    loading.value = false
  }
}

const fetchDomainCategories = async () => {
  try {
    const res = await getDomainCategoryList()
    domainCategoryList.value = res.data
  } catch {
  }
}

const fetchTopics = async () => {
  try {
    const res = await getTopicList()
    topicList.value = res.data
  } catch {
  }
}

const fetchOperScope = async () => {
  try {
    const res = await getOperableScope()
    operScope.value = res.data
  } catch {
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  fetchData()
}

const handleReset = () => {
  searchFormRef.value?.resetFields()
  searchForm.title = ''
  searchForm.domainCategoryId = undefined
  searchForm.channel = undefined
  searchForm.status = undefined
  searchForm.topFlag = undefined
  viewCountRange.value = [0, 100000]
  likeCountRange.value = [0, 10000]
  publishDateRange.value = null
  pagination.currentPage = 1
  fetchData()
}

const handleSelectionChange = async (rows: ArticleInfo[]) => {
  selectedRows.value = rows
  if (rows.length) {
    try {
      const ids = rows.map(r => r.id)
      const res = await getBatchAbility(ids, 1)
      batchAbility.canTop = res.data.canTop
      batchAbility.canOffline = res.data.canOffline
      batchAbility.canAssignTopic = res.data.canAssignTopic
      batchAbility.canEdit = res.data.canEdit
      batchAbility.canDelete = res.data.canDelete
    } catch {
    }
  }
}

const handleClearSelection = () => {
  tableRef.value?.clearSelection()
}

const handleRowClick = (_row: ArticleInfo) => {
}

const openCreateDrawer = () => {
  isEditMode.value = false
  currentEditId.value = null
  currentEditMode.value = null
  createForm.domainCategoryId = null
  createForm.useOwnPermission = true
  createForm.channel = null
  createForm.topicId = null
  createForm.template = 'default'
  createForm.title = ''
  createForm.summary = ''
  createForm.content = ''
  createForm.coverImage = ''
  createForm.images = []
  sensitiveHits.value = []
  validateErrors.value = []
  titleDuplicate.value = false
  channelTemplates.value = []
  wordConfig.minWord = 0
  wordConfig.maxWord = 5000
  createDrawerVisible.value = true
}

const handleDomainChange = () => {
  debouncedContentValidate()
}

const handleChannelChange = async (channel: Channel) => {
  try {
    const res = await getChannelTemplate(channel)
    if (res.data) {
      channelTemplates.value = res.data.templates || []
      if (res.data.wordConfig) {
        wordConfig.minWord = res.data.wordConfig.minWord
        wordConfig.maxWord = res.data.wordConfig.maxWord
      }
      if (channelTemplates.value.length && !createForm.template) {
        createForm.template = channelTemplates.value[0].key
      }
    }
  } catch {
  }
  debouncedContentValidate()
}

const handleTitleBlur = async () => {
  if (!createForm.title || createForm.title.length < 5) {
    titleDuplicate.value = false
    return
  }
  try {
    const res = await checkDuplicate({
      title: createForm.title,
      content: createForm.content
    })
    if (res.data && res.data.similarityReport?.overallSimilarity >= 80) {
      titleDuplicate.value = true
    } else {
      titleDuplicate.value = false
    }
  } catch {
  }
}

const addImage = () => {
  createForm.images.push('')
}

const removeImage = (idx: number) => {
  createForm.images.splice(idx, 1)
}

const addEditImage = () => {
  editForm.images.push('')
}

const removeEditImage = (idx: number) => {
  editForm.images.splice(idx, 1)
}

const handleCreateSubmit = async () => {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
  } catch {
    return
  }
  if (sensitiveHits.value.length) {
    ElMessage.warning('请先处理敏感词后再提交')
    return
  }
  submitLoading.value = true
  try {
    const res = await createArticle({
      title: createForm.title,
      summary: createForm.summary,
      content: createForm.content,
      coverImage: createForm.coverImage,
      images: createForm.images.filter(Boolean),
      domainCategoryId: createForm.domainCategoryId!,
      channel: createForm.channel!,
      template: createForm.template,
      topicId: createForm.topicId || undefined
    })
    ElMessage.success('创建成功')
    createDrawerVisible.value = false
    fetchData()
    void res
  } catch {
  } finally {
    submitLoading.value = false
  }
}

const openEditDrawer = async (row: ArticleInfo) => {
  isEditMode.value = true
  currentEditId.value = row.id
  try {
    const [modeRes, articleRes] = await Promise.all([
      getEditMode(row.id),
      getArticle(row.id)
    ])
    currentEditMode.value = modeRes.data
    editType.value = modeRes.data.allowIncremental ? 'incremental' : 'full'
    if (articleRes.data) {
      editForm.title = articleRes.data.title
      editForm.summary = articleRes.data.summary
      editForm.content = articleRes.data.content
      editForm.coverImage = articleRes.data.coverImage
      editForm.images = [...(articleRes.data.images || [])]
      editForm.domainCategoryId = articleRes.data.domainCategoryId
      editForm.template = articleRes.data.template
      editForm.changeLog = ''

      if (articleRes.data.channel) {
        const tplRes = await getChannelTemplate(articleRes.data.channel)
        if (tplRes.data) {
          channelTemplates.value = tplRes.data.templates || []
        }
      }
    }
    createDrawerVisible.value = true
  } catch {
  }
}

const handleEditTypeChange = () => {
}

const handleSaveDraft = async () => {
  if (!currentEditId.value) return
  editLoading.value = true
  try {
    await saveDraft(currentEditId.value, {
      title: editForm.title,
      summary: editForm.summary,
      content: editForm.content,
      coverImage: editForm.coverImage,
      images: editForm.images.filter(Boolean)
    })
    ElMessage.success('草稿保存成功')
    createDrawerVisible.value = false
    fetchData()
  } catch {
  } finally {
    editLoading.value = false
  }
}

const handleEditSubmit = async () => {
  if (!editFormRef.value || !currentEditId.value) return
  try {
    await editFormRef.value.validate()
  } catch {
    return
  }
  editLoading.value = true
  try {
    if (editType.value === 'incremental') {
      await incrementalEdit(currentEditId.value, {
        coverImage: editForm.coverImage,
        summary: editForm.summary,
        images: editForm.images.filter(Boolean),
        changeLog: editForm.changeLog
      }, 1)
    } else {
      await fullEdit(currentEditId.value, {
        title: editForm.title,
        summary: editForm.summary,
        content: editForm.content,
        coverImage: editForm.coverImage,
        images: editForm.images.filter(Boolean),
        domainCategoryId: editForm.domainCategoryId || undefined,
        template: editForm.template,
        topicId: undefined,
        changeLog: editForm.changeLog
      }, 1)
    }
    ElMessage.success('提交成功')
    createDrawerVisible.value = false
    fetchData()
  } catch {
  } finally {
    editLoading.value = false
  }
}

const openTraceDialog = async (row: ArticleInfo) => {
  currentTraceArticle.value = row
  traceData.value = null
  traceDialogVisible.value = true
  try {
    const res = await getArticleFullTrace(row.id)
    traceData.value = res.data
  } catch {
  }
}

const openQualityDialog = async (row: ArticleInfo) => {
  currentQualityArticle.value = row
  qualityReport.value = null
  qualityDialogVisible.value = true
  try {
    const res = await validateQuality(row.id)
    qualityReport.value = res.data
  } catch {
  }
}

const handleTop = async (row: ArticleInfo) => {
  try {
    await ElMessageBox.confirm(
      row.topFlag ? '确认取消置顶该内容？' : '确认置顶该内容？',
      '提示',
      { type: 'warning' }
    )
    await batchTopArticles([row.id], 1)
    ElMessage.success(row.topFlag ? '已取消置顶' : '已置顶')
    fetchData()
  } catch {
  }
}

const handleOffline = async (row: ArticleInfo) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入下架原因',
      '下架确认',
      {
        confirmButtonText: '确认下架',
        cancelButtonText: '取消',
        inputPattern: /.{2,}/,
        inputErrorMessage: '下架原因至少2个字符',
        type: 'warning'
      }
    )
    await batchOfflineArticles([row.id], reason, 1)
    ElMessage.success('已下架')
    fetchData()
  } catch {
  }
}

const handleDelete = async (row: ArticleInfo) => {
  try {
    await ElMessageBox.confirm(
      `确认删除内容「${row.title}」？此操作不可恢复。`,
      '删除确认',
      { type: 'error' }
    )
    await deleteArticle(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
  }
}

const handleBatchTop = async () => {
  try {
    await ElMessageBox.confirm(
      `确认置顶选中的 ${selectedRows.value.length} 条内容？`,
      '批量置顶',
      { type: 'warning' }
    )
    batchLoading.value = true
    const ids = selectedRows.value.map(r => r.id)
    await batchTopArticles(ids, 1)
    ElMessage.success('批量置顶成功')
    handleClearSelection()
    fetchData()
  } catch {
  } finally {
    batchLoading.value = false
  }
}

const openBatchOfflineDialog = () => {
  batchOfflineForm.reason = ''
  batchOfflineVisible.value = true
}

const handleBatchOffline = async () => {
  if (!batchOfflineForm.reason || batchOfflineForm.reason.length < 2) {
    ElMessage.warning('请输入下架原因（至少2个字符）')
    return
  }
  batchLoading.value = true
  try {
    const ids = selectedRows.value.map(r => r.id)
    await batchOfflineArticles(ids, batchOfflineForm.reason, 1)
    ElMessage.success('批量下架成功')
    batchOfflineVisible.value = false
    handleClearSelection()
    fetchData()
  } catch {
  } finally {
    batchLoading.value = false
  }
}

const openBatchAssignTopicDialog = () => {
  batchAssignTopicForm.topicId = null
  batchAssignTopicVisible.value = true
}

const handleBatchAssignTopic = async () => {
  if (!batchAssignTopicForm.topicId) {
    ElMessage.warning('请选择目标专题')
    return
  }
  batchLoading.value = true
  try {
    const ids = selectedRows.value.map(r => r.id)
    await batchAssignTopic(ids, batchAssignTopicForm.topicId, 1)
    ElMessage.success('批量归类成功')
    batchAssignTopicVisible.value = false
    handleClearSelection()
    fetchData()
  } catch {
  } finally {
    batchLoading.value = false
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedRows.value.length} 条内容？此操作不可恢复。`,
      '批量删除',
      { type: 'error' }
    )
    const promises = selectedRows.value.map(r => deleteArticle(r.id))
    await Promise.all(promises)
    ElMessage.success('批量删除成功')
    handleClearSelection()
    fetchData()
  } catch {
  }
}

watch(createDrawerVisible, (val) => {
  if (!val) {
    nextTick(() => {
      createFormRef.value?.resetFields()
      editFormRef.value?.resetFields()
    })
  }
})

onMounted(() => {
  fetchData()
  fetchDomainCategories()
  fetchTopics()
  fetchOperScope()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-container {
  background: #fff;
  border-radius: $radius-base;
  padding: $spacing-base;
}

.search-section {
  padding-bottom: $spacing-base;
  border-bottom: 1px solid $border-color-lighter;
  margin-bottom: $spacing-base;
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-base;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-base;
  border-top: 1px solid $border-color-lighter;
  margin-top: $spacing-base;
}

.template-preview-card {
  border: 1px solid $border-color-lighter;
  border-radius: $radius-base;
  padding: $spacing-lg;
  background: #fafbfc;

  .preview-placeholder {
    text-align: center;
    color: $text-secondary;

    p {
      margin: $spacing-sm 0 0;
      font-size: $font-size-base;
      color: $text-regular;
      font-weight: 500;
    }

    .preview-desc {
      font-size: $font-size-sm;
      color: $text-secondary;
      font-weight: 400;
      margin-top: $spacing-xs;
    }
  }
}

.image-input-item {
  display: flex;
  align-items: center;
  width: 100%;
}

.word-progress {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .word-count-text {
    flex-shrink: 0;
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}

.content-form-item {
  :deep(.el-textarea__inner) {
    line-height: 1.8;
  }
}

.sensitive-tags {
  padding: $spacing-sm;
  background: rgba(245, 108, 108, 0.05);
  border-radius: $radius-base;
}

.edit-mode-header {
  padding-bottom: $spacing-base;
  border-bottom: 1px solid $border-color-lighter;
}

.quality-score-section {
  display: flex;
  align-items: center;
  gap: $spacing-xxl;
  padding: $spacing-lg;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 100%);
  border-radius: $radius-base;
  margin-bottom: $spacing-base;

  .score-ring {
    flex-shrink: 0;
  }

  .score-info {
    h3 {
      margin: 0 0 $spacing-xs;
      font-size: $font-size-md;
      color: $text-secondary;
    }

    .score-text {
      font-size: 42px;
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
    }
  }
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;
  margin-bottom: $spacing-base;

  .dimension-item {
    padding: $spacing-base;
    border: 1px solid $border-color-lighter;
    border-radius: $radius-base;

    .dimension-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;

      .dimension-name {
        font-weight: 500;
        color: $text-regular;
      }

      .dimension-score {
        font-size: $font-size-sm;
        color: $primary-color;
        font-weight: 600;
      }
    }
  }
}

.mt-2 {
  margin-top: $spacing-sm;
}

.ml-1 {
  margin-left: 4px;
}

.ml-2 {
  margin-left: $spacing-sm;
}

.mb-2 {
  margin-bottom: $spacing-sm;
}

.mb-4 {
  margin-bottom: $spacing-base;
}

.flex {
  display: flex;
}

.flex-wrap {
  flex-wrap: wrap;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: $spacing-sm;
}

.text-secondary {
  color: $text-secondary;
}

.text-sm {
  font-size: $font-size-sm;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.is-rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
