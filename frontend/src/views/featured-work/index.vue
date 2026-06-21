<template>
  <div class="featured-work-page">
    <div class="page-header">
      <h2 class="page-title">作品精选收录管理</h2>
    </div>

    <el-tabs v-model="activeTab" class="featured-tabs">
      <el-tab-pane label="收录管理" name="entry">
        <div class="card-wrapper">
          <div class="overview-section">
            <div v-if="overviewLoading" class="skeleton-overview">
              <div v-for="i in 6" :key="i" class="skeleton-card">
                <div class="skeleton-line short" />
                <div class="skeleton-line long" />
              </div>
            </div>
            <div v-else class="overview-cards">
              <div class="overview-card card-pending">
                <div class="overview-label">待核验</div>
                <div class="overview-value">{{ overview?.pendingCount || 0 }}</div>
                <div class="overview-desc">等待人工核验</div>
              </div>
              <div class="overview-card card-verified">
                <div class="overview-label">已核验</div>
                <div class="overview-value">{{ overview?.verifiedCount || 0 }}</div>
                <div class="overview-desc">核验通过待上架</div>
              </div>
              <div class="overview-card card-featured">
                <div class="overview-label">已收录</div>
                <div class="overview-value">{{ overview?.featuredCount || 0 }}</div>
                <div class="overview-desc">精选专区上架中</div>
              </div>
              <div class="overview-card card-removed">
                <div class="overview-label">已取消</div>
                <div class="overview-value">{{ overview?.removedCount || 0 }}</div>
                <div class="overview-desc">历史取消收录</div>
              </div>
              <div class="overview-card card-rejected">
                <div class="overview-label">不予收录</div>
                <div class="overview-value">{{ overview?.rejectedCount || 0 }}</div>
                <div class="overview-desc">收录申请未通过</div>
              </div>
              <div class="overview-card card-score">
                <div class="overview-label">平均评分</div>
                <div class="overview-value">{{ overview?.avgOverallScore || 0 }}</div>
                <div class="overview-desc">已收录作品均值</div>
              </div>
            </div>
          </div>

          <div class="card-title">待收录作品池</div>

          <el-form :inline="true" :model="resourceFilter" class="filter-form">
            <el-form-item label="关键词">
              <el-input v-model="resourceFilter.keyword" placeholder="标题/素材编码" clearable style="width: 200px">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="resourceFilter.categoryId" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="c in categoryOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="resourceFilter.fileType" placeholder="全部" clearable style="width: 120px">
                <el-option label="图片" value="image" />
                <el-option label="视频" value="video" />
                <el-option label="音频" value="audio" />
                <el-option label="模板" value="template" />
              </el-select>
            </el-form-item>
            <el-form-item label="筛选条件">
              <el-checkbox v-model="resourceFilter.originalOnly" border>仅原创</el-checkbox>
              <el-checkbox v-model="resourceFilter.noViolation" border>无违规</el-checkbox>
            </el-form-item>
            <el-form-item label="最小点赞">
              <el-input-number v-model="resourceFilter.minLikeCount" :min="0" :step="10" style="width: 120px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchResourceList" :loading="resourceLoading">查询</el-button>
              <el-button @click="resetResourceFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-tag v-if="resourceSelected.length > 0" type="primary" effect="light">
                已选 {{ resourceSelected.length }} 项
              </el-tag>
            </div>
            <div class="toolbar-right">
              <el-select v-model="batchDefaultLevel" placeholder="批量默认等级" style="width: 140px">
                <el-option v-for="l in levelOptions" :key="l.value" :label="l.label" :value="l.value" />
              </el-select>
              <el-button
                type="warning"
                :icon="Promotion"
                :disabled="resourceSelected.length === 0"
                @click="handleBatchFeature"
                :loading="batchFeatureLoading"
              >
                批量差异化收录
              </el-button>
            </div>
          </div>

          <div v-if="resourceLoading" class="skeleton-table">
            <div v-for="i in 6" :key="i" class="skeleton-row">
              <div class="skeleton-line medium" />
              <div class="skeleton-line long" />
              <div class="skeleton-line short" />
              <div class="skeleton-line short" />
              <div class="skeleton-line medium" />
            </div>
          </div>
          <el-table
            v-else
            ref="resourceTableRef"
            :data="resourceList"
            v-loading="resourceLoading"
            border
            stripe
            class="featured-table"
            @selection-change="handleResourceSelectionChange"
            :row-class-name="resourceRowClassName"
          >
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="预览" width="70" align="center">
              <template #default="{ row }">
                <el-image
                  :src="row.coverUrl"
                  fit="cover"
                  style="width: 48px; height: 48px; border-radius: 4px"
                  :preview-src-list="[row.coverUrl]"
                />
              </template>
            </el-table-column>
            <el-table-column label="作品标题" min-width="180">
              <template #default="{ row }">
                <div class="title-cell">
                  <span class="title-text">{{ row.title }}</span>
                  <el-tag
                    v-if="row.violationCount > 0 || row.isBlocked"
                    type="danger"
                    size="small"
                    class="violation-tag"
                    effect="dark"
                  >
                    <el-icon><Warning /></el-icon>
                    违规
                  </el-tag>
                </div>
                <div class="sub-info">{{ row.materialCode }} · {{ row.fileTypeLabel }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="authorName" label="作者" width="100" />
            <el-table-column label="原创" width="70" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isOriginal" type="success" size="small">原创</el-tag>
                <el-tag v-else type="info" size="small">转载</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="合规" width="70" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.violationCount === 0 && !row.isBlocked" type="success" size="small">合规</el-tag>
                <el-tag v-else type="danger" size="small">违规</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="画质评分" width="90" align="center">
              <template #default="{ row }">
                <el-rate :model-value="row._resolutionScore / 20" disabled size="small" />
                <div class="score-num">{{ row._resolutionScore }}分</div>
              </template>
            </el-table-column>
            <el-table-column label="内容质量" width="90" align="center">
              <template #default="{ row }">
                <el-rate :model-value="row._qualityScore / 20" disabled size="small" />
                <div class="score-num">{{ row._qualityScore }}分</div>
              </template>
            </el-table-column>
            <el-table-column label="互动数据" width="140" align="center">
              <template #default="{ row }">
                <div class="metric-row">
                  <span class="metric"><el-icon><View /></el-icon>{{ row.viewCount }}</span>
                  <span class="metric"><el-icon><Star /></el-icon>{{ row.likeCount }}</span>
                  <span class="metric"><el-icon><Download /></el-icon>{{ row.downloadCount }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  link
                  :class="{ 'feature-btn-glow': hoveredBtn === 'feature-' + row.id }"
                  @mouseenter="hoveredBtn = 'feature-' + row.id"
                  @mouseleave="hoveredBtn = null"
                  @click="handlePreValidate(row)"
                  :loading="loadingBtns['pre-' + row.id]"
                >
                  前置校验
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  link
                  :class="{ 'feature-btn-glow': hoveredBtn === 'create-' + row.id }"
                  @mouseenter="hoveredBtn = 'create-' + row.id"
                  @mouseleave="hoveredBtn = null"
                  @click="openFeatureDialog(row)"
                  :disabled="row.isFeatured"
                >
                  {{ row.isFeatured ? '已收录' : '收录入库' }}
                </el-button>
                <el-button
                  type="info"
                  size="small"
                  link
                  :disabled="row.isFeatured"
                  @click="openPrevalidateDialog(row)"
                >
                  校验详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="resourcePage"
              v-model:page-size="resourcePageSize"
              :total="resourceTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchResourceList"
              @current-change="fetchResourceList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="已收录作品" name="featured">
        <div class="card-wrapper">
          <div class="card-title">已收录作品管控</div>

          <el-form :inline="true" :model="featuredFilter" class="filter-form">
            <el-form-item label="关键词">
              <el-input v-model="featuredFilter.keyword" placeholder="收录编号/标题/作者" clearable style="width: 200px">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="featuredFilter.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="待核验" value="pending_verify" />
                <el-option label="已核验" value="verified" />
                <el-option label="已收录" value="featured" />
                <el-option label="已取消" value="removed" />
                <el-option label="不予收录" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item label="等级">
              <el-select v-model="featuredFilter.featuredLevel" placeholder="全部" clearable style="width: 120px">
                <el-option v-for="l in levelOptions" :key="l.value" :label="l.label" :value="l.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="展示位置">
              <el-select v-model="featuredFilter.displayPosition" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="p in positionOptions" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchFeaturedList" :loading="featuredLoading">查询</el-button>
              <el-button @click="resetFeaturedFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-tag v-if="featuredSelected.length > 0" type="primary">
                已选 {{ featuredSelected.length }} 项
              </el-tag>
            </div>
            <div class="toolbar-right">
              <el-button
                type="danger"
                :icon="Delete"
                :disabled="featuredSelected.length === 0"
                @click="handleBatchCancel"
                :loading="batchCancelLoading"
              >
                批量取消收录
              </el-button>
            </div>
          </div>

          <el-table
            ref="featuredTableRef"
            :data="featuredList"
            v-loading="featuredLoading"
            border
            class="featured-table status-transition-table"
            @selection-change="handleFeaturedSelectionChange"
          >
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column prop="featuredCode" label="收录编号" width="140" />
            <el-table-column label="作品" min-width="200">
              <template #default="{ row }">
                <div class="featured-item-cell">
                  <el-image
                    :src="row.coverUrl"
                    fit="cover"
                    style="width: 42px; height: 42px; border-radius: 4px; flex-shrink: 0"
                    :preview-src-list="[row.coverUrl]"
                  />
                  <div class="featured-item-info">
                    <div class="featured-item-title">{{ row.resourceTitle }}</div>
                    <div class="featured-item-sub">{{ row.resourceTypeLabel }} · {{ row.categoryName }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <span :class="['status-badge', 'status-' + row.status]">
                  {{ statusLabel[row.status] }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="精选等级" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="levelTagType[row.featuredLevel]" effect="light">
                  {{ levelLabel[row.featuredLevel] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="展示权重" width="100" align="center">
              <template #default="{ row }">
                <span class="weight-badge">{{ row.displayWeight }}</span>
              </template>
            </el-table-column>
            <el-table-column label="展示位置" width="110" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.displayPosition" type="info" size="small">
                  {{ positionLabel[row.displayPosition] }}
                </el-tag>
                <span v-else class="muted-text">-</span>
              </template>
            </el-table-column>
            <el-table-column label="综合评分" width="90" align="center">
              <template #default="{ row }">
                <span class="score-badge" :class="scoreClass(row.overallScore)">
                  {{ row.overallScore }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="authorName" label="作者" width="90" />
            <el-table-column label="收录时间" width="160">
              <template #default="{ row }">
                <span class="time-standard">{{ row.featuredTime ? formatDateTime(row.featuredTime) : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="330" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  link
                  @click="openWeightDialog(row)"
                >
                  调权重
                </el-button>
                <el-button
                  size="small"
                  type="warning"
                  link
                  @click="openPositionDialog(row)"
                >
                  调位置
                </el-button>
                <el-button
                  size="small"
                  type="success"
                  link
                  @click="openLevelDialog(row)"
                >
                  调等级
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  link
                  :disabled="row.status !== 'featured'"
                  @click="openCancelDialog(row)"
                >
                  取消收录
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="featuredPage"
              v-model:page-size="featuredPageSize"
              :total="featuredTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchFeaturedList"
              @current-change="fetchFeaturedList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="溯源校验" name="trace">
        <div class="card-wrapper">
          <div class="card-title">收录记录溯源校验</div>

          <div class="trace-search">
            <el-input v-model="traceKeyword" placeholder="输入收录编号/作品标题/收录人" clearable style="width: 360px">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="fetchTraceFeaturedList" :loading="traceLoading">溯源查询</el-button>
          </div>

          <div v-if="traceLoading" class="skeleton-table">
            <div v-for="i in 6" :key="i" class="skeleton-row">
              <div class="skeleton-line medium" />
              <div class="skeleton-line long" />
              <div class="skeleton-line short" />
              <div class="skeleton-line medium" />
              <div class="skeleton-line long" />
            </div>
          </div>
          <el-table
            v-else
            :data="traceFeaturedList"
            v-loading="traceLoading"
            border
            class="featured-table"
          >
            <el-table-column prop="featuredCode" label="收录编号" width="140" />
            <el-table-column label="作品标题" min-width="200">
              <template #default="{ row }">{{ row.resourceTitle }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <span :class="['status-badge', 'status-' + row.status]">
                  {{ statusLabel[row.status] }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="收录人" width="100">
              <template #default="{ row }">{{ row.featuredOperatorName || '-' }}</template>
            </el-table-column>
            <el-table-column label="收录时间" width="160">
              <template #default="{ row }">
                <span class="time-standard">{{ row.featuredTime ? formatDateTime(row.featuredTime) : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="核验人" width="100">
              <template #default="{ row }">{{ row.verifyOperatorName || '-' }}</template>
            </el-table-column>
            <el-table-column label="核验时间" width="160">
              <template #default="{ row }">
                <span class="time-standard">{{ row.verifyTime ? formatDateTime(row.verifyTime) : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openTraceDetail(row)">
                  溯源详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="traceDetailVisible" class="card-wrapper mt-15">
          <div class="card-title">
            溯源校验详情
            <el-tag v-if="traceDetail" :type="traceDetail.recheckResult.overallPass ? 'success' : 'danger'" effect="light" class="ml-10">
              {{ traceDetail.recheckResult.overallPass ? '校验通过' : '存在异常' }}
            </el-tag>
          </div>

          <div v-if="traceDetailLoading" class="skeleton-table">
            <div v-for="i in 4" :key="i" class="skeleton-row">
              <div class="skeleton-line long" />
              <div class="skeleton-line long" />
              <div class="skeleton-line long" />
            </div>
          </div>
          <template v-else-if="traceDetail">
            <el-descriptions :column="3" border class="trace-descriptions">
              <el-descriptions-item label="收录编号">{{ traceDetail.featured.featuredCode }}</el-descriptions-item>
              <el-descriptions-item label="作品标题">{{ traceDetail.featured.resourceTitle }}</el-descriptions-item>
              <el-descriptions-item label="当前状态">
                <span :class="['status-badge', 'status-' + traceDetail.featured.status]">
                  {{ statusLabel[traceDetail.featured.status] }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="收录时间">
                <span class="time-standard">{{ formatDateTime(traceDetail.traceInfo.featuredAt) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="收录操作人员">{{ traceDetail.traceInfo.featuredBy }}</el-descriptions-item>
              <el-descriptions-item label="核验时间">
                <span class="time-standard">{{ formatDateTime(traceDetail.traceInfo.verifiedAt) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="核验操作人员">{{ traceDetail.traceInfo.verifiedBy }}</el-descriptions-item>
              <el-descriptions-item label="核验依据" :span="2">{{ traceDetail.traceInfo.verifyBasis }}</el-descriptions-item>
            </el-descriptions>

            <div class="section-subtitle">质量复核</div>
            <el-descriptions :column="4" border size="small">
              <el-descriptions-item label="综合评分">
                <span class="score-badge" :class="scoreClass(traceDetail.featured.overallScore)">
                  {{ traceDetail.featured.overallScore }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="质量评分">{{ traceDetail.featured.qualityScore }}</el-descriptions-item>
              <el-descriptions-item label="原创评分">{{ traceDetail.featured.originalScore }}</el-descriptions-item>
              <el-descriptions-item label="画质评分">{{ traceDetail.featured.resolutionScore }}</el-descriptions-item>
            </el-descriptions>

            <div v-if="traceDetail.recheckResult.totalIssues > 0" class="section-subtitle">
              <el-icon class="warning-icon"><Warning /></el-icon>
              复核问题（{{ traceDetail.recheckResult.totalIssues }}项）
            </div>
            <el-alert
              v-if="traceDetail.recheckResult.totalIssues > 0"
              :title="'需复核问题 ' + traceDetail.recheckResult.totalIssues + ' 项，其中：违规收录 ' + traceDetail.recheckResult.violationIssueCount + ' 项，账号异常 ' + traceDetail.recheckResult.accountIssueCount + ' 项，质量下降 ' + traceDetail.recheckResult.qualityIssueCount + ' 项'"
              type="warning"
              :closable="false"
              show-icon
              class="recheck-alert"
            />

            <el-table
              v-if="traceDetail.recheckResult.issues.length > 0"
              :data="traceDetail.recheckResult.issues"
              border
              size="small"
              class="recheck-table"
            >
              <el-table-column label="问题类型" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="issueTypeTag(row.type)" size="small">{{ issueTypeLabel(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="严重程度" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="severityTag(row.severity)" effect="dark" size="small">
                    {{ severityLabel(row.severity) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="问题描述" min-width="300">
                <template #default="{ row }">{{ row.message }}</template>
              </el-table-column>
              <el-table-column label="字段" width="120">
                <template #default="{ row }">{{ row.field || '-' }}</template>
              </el-table-column>
              <el-table-column label="建议操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button size="small" type="danger" link v-if="row.severity === 'critical'">取消收录</el-button>
                  <el-button size="small" type="warning" link v-else-if="row.severity === 'high'">降权处理</el-button>
                  <el-button size="small" type="info" link v-else>持续观察</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="section-subtitle">操作日志（{{ traceDetail.operationLogs.length }}条）</div>
            <el-table
              :data="traceDetail.operationLogs"
              border
              size="small"
              max-height="400"
              class="logs-table"
            >
              <el-table-column label="操作时间" width="160">
                <template #default="{ row }">
                  <span class="time-standard">{{ formatDateTime(row.createdAt) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作类型" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="opTypeTag(row.operationType)" size="small">
                    {{ opTypeLabel(row.operationType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作结果" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="logResultTag(row.result)" size="small">
                    {{ logResultLabel(row.result) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作人员" width="100">
                <template #default="{ row }">{{ row.operatorName || '-' }}</template>
              </el-table-column>
              <el-table-column label="变更字段" width="160">
                <template #default="{ row }">
                  <el-tag
                    v-for="(f, idx) in row.changeFields"
                    :key="idx"
                    style="margin-right: 4px; margin-bottom: 2px"
                    size="small"
                  >
                    {{ f }}
                  </el-tag>
                  <span v-if="!row.changeFields || row.changeFields.length === 0" class="muted-text">-</span>
                </template>
              </el-table-column>
              <el-table-column label="变更前快照" min-width="150">
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.beforeSnapshot"
                    placement="top-start"
                    :content="JSON.stringify(row.beforeSnapshot, null, 2)"
                  >
                    <span class="snapshot-text">点击查看</span>
                  </el-tooltip>
                  <span v-else class="muted-text">-</span>
                </template>
              </el-table-column>
              <el-table-column label="变更后快照" min-width="150">
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.afterSnapshot"
                    placement="top-start"
                    :content="JSON.stringify(row.afterSnapshot, null, 2)"
                  >
                    <span class="snapshot-text">点击查看</span>
                  </el-tooltip>
                  <span v-else class="muted-text">-</span>
                </template>
              </el-table-column>
              <el-table-column label="原因/说明" min-width="160">
                <template #default="{ row }">
                  {{ row.reason || row.failReason || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="耗时" width="70" align="center">
                <template #default="{ row }">{{ row.duration }}ms</template>
              </el-table-column>
            </el-table>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="prevalidateDialogVisible"
      title="前置校验结果"
      width="640px"
      class="dialog-scale-fade"
      destroy-on-close
    >
      <div v-if="prevalidateResult" class="prevalidate-result">
        <div class="result-header" :class="prevalidateResult.blocked ? 'result-blocked' : prevalidateResult.valid ? 'result-valid' : 'result-warn'">
          <el-icon class="result-icon">
            <CircleCheck v-if="prevalidateResult.valid" />
            <CircleClose v-else-if="prevalidateResult.blocked" />
            <Warning v-else />
          </el-icon>
          <div class="result-main">
            <div class="result-title">
              {{ prevalidateResult.blocked ? '已拦截 - 禁止收录' : prevalidateResult.valid ? '校验通过 - 可收录' : '校验未通过 - 有风险项' }}
            </div>
            <div class="result-sub">综合评分 {{ prevalidateResult.checkResults.overall.score }} 分</div>
          </div>
        </div>

        <div class="checks-grid">
          <div class="check-item" :class="{ pass: prevalidateResult.checkResults.status.valid }">
            <div class="check-label">作品状态</div>
            <div class="check-value">{{ prevalidateResult.checkResults.status.status }}</div>
            <div class="check-result">
              <el-icon><Check v-if="prevalidateResult.checkResults.status.valid" /><Close v-else /></el-icon>
              {{ prevalidateResult.checkResults.status.valid ? '通过' : '不通过' }}
            </div>
          </div>
          <div class="check-item" :class="{ pass: prevalidateResult.checkResults.compliance.score >= 80 }">
            <div class="check-label">合规评分</div>
            <div class="check-value">{{ prevalidateResult.checkResults.compliance.score }}分</div>
            <div class="check-result">
              <el-icon><Check v-if="prevalidateResult.checkResults.compliance.score >= 80" /><Close v-else /></el-icon>
              {{ prevalidateResult.checkResults.compliance.score >= 80 ? '达标' : '偏低' }}
            </div>
          </div>
          <div class="check-item" :class="{ pass: prevalidateResult.checkResults.original.score >= 50 }">
            <div class="check-label">原创评分</div>
            <div class="check-value">{{ prevalidateResult.checkResults.original.score }}分</div>
            <div class="check-result">
              <el-icon><Check v-if="prevalidateResult.checkResults.original.score >= 50" /><Close v-else /></el-icon>
              {{ prevalidateResult.checkResults.original.score >= 50 ? '达标' : '偏低' }}
            </div>
          </div>
          <div class="check-item" :class="{ pass: !prevalidateResult.checkResults.violation.hasViolation }">
            <div class="check-label">违规记录</div>
            <div class="check-value">{{ prevalidateResult.checkResults.violation.violationCount }}次</div>
            <div class="check-result">
              <el-icon><Check v-if="!prevalidateResult.checkResults.violation.hasViolation" /><Close v-else /></el-icon>
              {{ prevalidateResult.checkResults.violation.hasViolation ? '有违规' : '无违规' }}
            </div>
          </div>
          <div class="check-item" :class="{ pass: prevalidateResult.checkResults.quality.resolutionScore >= 50 }">
            <div class="check-label">画质评分</div>
            <div class="check-value">{{ prevalidateResult.checkResults.quality.resolutionScore }}分</div>
            <div class="check-result">
              <el-icon><Check v-if="prevalidateResult.checkResults.quality.resolutionScore >= 50" /><Close v-else /></el-icon>
              {{ prevalidateResult.checkResults.quality.resolutionScore >= 50 ? '达标' : '偏低' }}
            </div>
          </div>
          <div class="check-item" :class="{ pass: prevalidateResult.checkResults.account.normal }">
            <div class="check-label">账号状态</div>
            <div class="check-value">{{ prevalidateResult.checkResults.account.status }}</div>
            <div class="check-result">
              <el-icon><Check v-if="prevalidateResult.checkResults.account.normal" /><Close v-else /></el-icon>
              {{ prevalidateResult.checkResults.account.normal ? '正常' : '异常拦截' }}
            </div>
          </div>
        </div>

        <div v-if="prevalidateResult.errors.length > 0" class="errors-section">
          <div class="section-label"><el-icon><CircleClose /></el-icon> 拦截原因</div>
          <ul>
            <li v-for="(e, i) in prevalidateResult.errors" :key="i">{{ e }}</li>
          </ul>
        </div>

        <div v-if="prevalidateResult.warnings.length > 0" class="warnings-section">
          <div class="section-label"><el-icon><Warning /></el-icon> 风险提示</div>
          <ul>
            <li v-for="(w, i) in prevalidateResult.warnings" :key="i">{{ w }}</li>
          </ul>
        </div>

        <div v-if="prevalidateResult.valid" class="suggest-section">
          <div class="section-label"><el-icon><MagicStick /></el-icon> 收录建议</div>
          <div class="suggest-row">
            <span>建议等级：<el-tag :type="levelTagType[prevalidateResult.suggestedLevel]">{{ levelLabel[prevalidateResult.suggestedLevel] }}</el-tag></span>
            <span>建议权重：<b class="weight-val">{{ prevalidateResult.suggestedWeight }}</b></span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="prevalidateDialogVisible = false">关闭</el-button>
        <el-button
          v-if="prevalidateResult?.valid"
          type="primary"
          @click="quickFeatureFromPrevalidate"
        >
          立即收录
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="featureDialogVisible"
      title="作品收录入库"
      width="560px"
      class="dialog-scale-fade"
      destroy-on-close
    >
      <div v-if="featureTargetResource" class="feature-dialog-content">
        <div class="resource-preview">
          <el-image
            :src="featureTargetResource.coverUrl"
            fit="cover"
            style="width: 80px; height: 80px; border-radius: 6px; flex-shrink: 0"
          />
          <div class="resource-info">
            <div class="resource-title">{{ featureTargetResource.title }}</div>
            <div class="resource-sub">
              <el-tag size="small">{{ featureTargetResource.fileTypeLabel }}</el-tag>
              <span class="muted-text"> · {{ featureTargetResource.materialCode }}</span>
            </div>
            <div class="resource-metrics">
              <span>画质 {{ featureTargetResource._resolutionScore }}分</span>
              <span>内容 {{ featureTargetResource._qualityScore }}分</span>
            </div>
          </div>
        </div>

        <el-form :model="featureForm" :rules="featureRules" ref="featureFormRef" label-width="100px" class="feature-form">
          <el-form-item label="精选等级" prop="featuredLevel">
            <el-select v-model="featureForm.featuredLevel" style="width: 100%">
              <el-option v-for="l in levelOptions" :key="l.value" :label="l.label" :value="l.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="展示权重" prop="displayWeight">
            <el-input-number v-model="featureForm.displayWeight" :min="0" :max="99999" style="width: 100%" />
            <div class="form-tip">等级越高建议权重越大：钻石>铂金>黄金>白银>普通</div>
          </el-form-item>
          <el-form-item label="展示位置">
            <el-select v-model="featureForm.displayPosition" placeholder="选择展示位置（可选）" clearable style="width: 100%">
              <el-option v-for="p in positionOptions" :key="p.value" :label="p.label" :value="p.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="收录依据" prop="verifyReason">
            <el-input
              v-model="featureForm.verifyReason"
              type="textarea"
              :rows="2"
              placeholder="描述入选理由，如：内容质量高、原创、互动数据优秀等"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="featureForm.remark" type="textarea" :rows="2" placeholder="选填" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="featureDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeature" :loading="featureSubmitting">
          <span class="ripple-btn-content">
            确认收录
            <span class="ripple-effect"></span>
          </span>
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="weightDialogVisible"
      title="调整展示权重"
      width="440px"
      class="dialog-scale-fade"
      destroy-on-close
    >
      <div v-if="weightTarget" class="adjust-info">
        <div class="info-row">
          <span class="info-label">作品：</span>
          <span class="info-value">{{ weightTarget.resourceTitle }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">当前权重：</span>
          <span class="info-value weight-current">{{ weightTarget.displayWeight }}</span>
        </div>
      </div>
      <el-form :model="weightForm" :rules="weightRules" ref="weightFormRef" label-width="100px" style="margin-top: 10px">
        <el-form-item label="目标权重" prop="newWeight">
          <el-input-number v-model="weightForm.newWeight" :min="0" :max="99999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input v-model="weightForm.reason" type="textarea" :rows="2" placeholder="请说明调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="weightDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWeight" :loading="weightSubmitting">
          <span class="ripple-btn-content">
            确认调整
            <span class="ripple-effect"></span>
          </span>
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="positionDialogVisible"
      title="调整展示位置"
      width="440px"
      class="dialog-scale-fade"
      destroy-on-close
    >
      <div v-if="positionTarget" class="adjust-info">
        <div class="info-row">
          <span class="info-label">作品：</span>
          <span class="info-value">{{ positionTarget.resourceTitle }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">当前位置：</span>
          <span class="info-value">
            <el-tag v-if="positionTarget.displayPosition" type="info">
              {{ positionLabel[positionTarget.displayPosition] }}
            </el-tag>
            <span v-else class="muted-text">未设置</span>
          </span>
        </div>
      </div>
      <el-form :model="positionForm" :rules="positionRules" ref="positionFormRef" label-width="100px" style="margin-top: 10px">
        <el-form-item label="目标位置" prop="newPosition">
          <el-select v-model="positionForm.newPosition" placeholder="请选择展示位置" clearable style="width: 100%">
            <el-option v-for="p in positionOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input v-model="positionForm.reason" type="textarea" :rows="2" placeholder="请说明调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="positionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPosition" :loading="positionSubmitting">
          <span class="ripple-btn-content">
            确认调整
            <span class="ripple-effect"></span>
          </span>
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="levelDialogVisible"
      title="调整精选等级"
      width="440px"
      class="dialog-scale-fade"
      destroy-on-close
    >
      <div v-if="levelTarget" class="adjust-info">
        <div class="info-row">
          <span class="info-label">作品：</span>
          <span class="info-value">{{ levelTarget.resourceTitle }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">当前等级：</span>
          <span class="info-value">
            <el-tag :type="levelTagType[levelTarget.featuredLevel]">{{ levelLabel[levelTarget.featuredLevel] }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">综合评分：</span>
          <span class="info-value score-badge" :class="scoreClass(levelTarget.overallScore)">{{ levelTarget.overallScore }}分</span>
        </div>
      </div>
      <el-form :model="levelForm" :rules="levelRules" ref="levelFormRef" label-width="100px" style="margin-top: 10px">
        <el-form-item label="目标等级" prop="newLevel">
          <el-select v-model="levelForm.newLevel" style="width: 100%">
            <el-option v-for="l in levelOptions" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="同步调整权重">
          <el-switch v-model="levelForm.autoAdjustWeight" />
          <span class="form-tip ml-10">根据等级自动计算建议权重</span>
        </el-form-item>
        <el-form-item v-if="!levelForm.autoAdjustWeight" label="指定权重" prop="displayWeight">
          <el-input-number v-model="levelForm.displayWeight" :min="0" :max="99999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input v-model="levelForm.reason" type="textarea" :rows="2" placeholder="请说明调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitLevel" :loading="levelSubmitting">
          <span class="ripple-btn-content">
            确认调整
            <span class="ripple-effect"></span>
          </span>
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="cancelDialogVisible"
      title="取消收录"
      width="480px"
      class="dialog-scale-fade"
      destroy-on-close
    >
      <el-alert
        title="取消收录后作品将自动从精选专区移除，相关收录标签也会同步清理。"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <div v-if="cancelTarget" class="adjust-info">
        <div class="info-row">
          <span class="info-label">作品：</span>
          <span class="info-value">{{ cancelTarget.resourceTitle || (cancelTarget as any).title }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">收录编号：</span>
          <span class="info-value">{{ cancelTarget.featuredCode || '-' }}</span>
        </div>
      </div>
      <el-form :model="cancelForm" :rules="cancelRules" ref="cancelFormRef" label-width="100px" style="margin-top: 10px">
        <el-form-item label="取消原因" prop="reason">
          <el-input v-model="cancelForm.reason" type="textarea" :rows="3" placeholder="请填写取消收录原因，将计入操作日志" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">返回</el-button>
        <el-button type="danger" @click="submitCancel" :loading="cancelSubmitting">
          <span class="ripple-btn-content">
            确认取消收录
            <span class="ripple-effect"></span>
          </span>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Promotion,
  Delete,
  Warning,
  View,
  Star,
  Download,
  CircleCheck,
  CircleClose,
  Check,
  Close,
  MagicStick
} from '@element-plus/icons-vue'
import type {
  FeaturedPreValidateResult,
  FeaturedStatusOverview,
  FeaturedLevel,
  DisplayPosition
} from '@/types'
import {
  getResourceListForFeatured,
  preValidateFeatured,
  createFeaturedWork,
  getFeaturedList,
  getFeaturedStatusOverview,
  cancelFeatured,
  adjustFeaturedWeight,
  adjustFeaturedPosition,
  adjustFeaturedLevel,
  batchFeatureWorks,
  batchCancelFeatured,
  traceFeaturedWork
} from '@/api/featuredWork'

const activeTab = ref('entry')
const hoveredBtn = ref<string | null>(null)
const loadingBtns = reactive<Record<string, boolean>>({})

const statusLabel: Record<string, string> = {
  pending_verify: '待核验',
  verified: '已核验',
  featured: '已收录',
  removed: '已取消',
  rejected: '不予收录'
}
const levelLabel: Record<string, string> = {
  normal: '普通推荐',
  silver: '白银精选',
  gold: '黄金精选',
  platinum: '铂金精选',
  diamond: '钻石精选'
}
const levelTagType: Record<string, string> = {
  normal: 'info',
  silver: '',
  gold: 'warning',
  platinum: 'danger',
  diamond: 'success'
}
const levelOptions = [
  { value: 'normal' as FeaturedLevel, label: '普通推荐' },
  { value: 'silver' as FeaturedLevel, label: '白银精选' },
  { value: 'gold' as FeaturedLevel, label: '黄金精选' },
  { value: 'platinum' as FeaturedLevel, label: '铂金精选' },
  { value: 'diamond' as FeaturedLevel, label: '钻石精选' }
]
const positionOptions = [
  { value: 'home_banner' as DisplayPosition, label: '首页Banner' },
  { value: 'home_recommend' as DisplayPosition, label: '首页推荐' },
  { value: 'category_top' as DisplayPosition, label: '分类顶部' },
  { value: 'special_zone' as DisplayPosition, label: '专区展示' },
  { value: 'editor_pick' as DisplayPosition, label: '编辑精选' },
  { value: 'hot_list' as DisplayPosition, label: '热门榜单' }
]
const positionLabel: Record<string, string> = {
  home_banner: '首页Banner',
  home_recommend: '首页推荐',
  category_top: '分类顶部',
  special_zone: '专区展示',
  editor_pick: '编辑精选',
  hot_list: '热门榜单'
}
const fileTypeLabel: Record<string, string> = {
  image: '图片',
  video: '视频',
  audio: '音频',
  template: '模板'
}

const categoryOptions = ref<{ id: number; name: string }[]>([
  { id: 1, name: '人物写真' },
  { id: 2, name: '自然风光' },
  { id: 3, name: '城市建筑' },
  { id: 4, name: '美食生活' },
  { id: 5, name: '科技数码' },
  { id: 6, name: '艺术创作' }
])

const overview = ref<FeaturedStatusOverview | null>(null)
const overviewLoading = ref(false)

const resourceFilter = reactive({
  keyword: '',
  categoryId: null as number | null,
  fileType: '' as string,
  originalOnly: false,
  noViolation: false,
  minLikeCount: 0
})
const resourceList = ref<any[]>([])
const resourceTotal = ref(0)
const resourcePage = ref(1)
const resourcePageSize = ref(10)
const resourceLoading = ref(false)
const resourceSelected = ref<any[]>([])
const resourceTableRef = ref<any | null>(null)

const batchDefaultLevel = ref<FeaturedLevel>('silver')
const batchFeatureLoading = ref(false)

const featuredFilter = reactive({
  keyword: '',
  status: '' as string,
  featuredLevel: '' as FeaturedLevel | '',
  displayPosition: '' as DisplayPosition | ''
})
const featuredList = ref<any[]>([])
const featuredTotal = ref(0)
const featuredPage = ref(1)
const featuredPageSize = ref(10)
const featuredLoading = ref(false)
const featuredSelected = ref<any[]>([])
const featuredTableRef = ref<any | null>(null)
const batchCancelLoading = ref(false)

const traceKeyword = ref('')
const traceLoading = ref(false)
const traceFeaturedList = ref<any[]>([])
const traceDetailVisible = ref(false)
const traceDetailLoading = ref(false)
const traceDetail = ref<any | null>(null)

const prevalidateDialogVisible = ref(false)
const prevalidateResult = ref<FeaturedPreValidateResult | null>(null)
const prevalidateTarget = ref<any | null>(null)

const featureDialogVisible = ref(false)
const featureTargetResource = ref<any | null>(null)
const featureFormRef = ref<FormInstance | null>(null)
const featureSubmitting = ref(false)
const featureForm = reactive({
  resourceId: 0,
  featuredLevel: 'silver' as FeaturedLevel,
  displayWeight: 500,
  displayPosition: null as DisplayPosition | null,
  verifyReason: '',
  remark: ''
})
const featureRules: FormRules = {
  featuredLevel: [{ required: true, message: '请选择精选等级', trigger: 'change' }],
  displayWeight: [{ required: true, message: '请输入展示权重', trigger: 'blur' }],
  verifyReason: [{ required: true, message: '请填写收录依据', trigger: 'blur' }]
}

const weightDialogVisible = ref(false)
const weightTarget = ref<any | null>(null)
const weightFormRef = ref<FormInstance | null>(null)
const weightSubmitting = ref(false)
const weightForm = reactive({ newWeight: 0, reason: '' })
const weightRules: FormRules = {
  newWeight: [{ required: true, message: '请输入目标权重', trigger: 'blur' }],
  reason: [{ required: true, message: '请填写调整原因', trigger: 'blur' }]
}

const positionDialogVisible = ref(false)
const positionTarget = ref<any | null>(null)
const positionFormRef = ref<FormInstance | null>(null)
const positionSubmitting = ref(false)
const positionForm = reactive({ newPosition: null as DisplayPosition | null, reason: '' })
const positionRules: FormRules = {
  newPosition: [{ required: true, message: '请选择目标位置', trigger: 'change' }],
  reason: [{ required: true, message: '请填写调整原因', trigger: 'blur' }]
}

const levelDialogVisible = ref(false)
const levelTarget = ref<any | null>(null)
const levelFormRef = ref<FormInstance | null>(null)
const levelSubmitting = ref(false)
const levelForm = reactive({
  newLevel: 'silver' as FeaturedLevel,
  autoAdjustWeight: true,
  displayWeight: 500,
  reason: ''
})
const levelRules: FormRules = {
  newLevel: [{ required: true, message: '请选择目标等级', trigger: 'change' }],
  reason: [{ required: true, message: '请填写调整原因', trigger: 'blur' }]
}

const cancelDialogVisible = ref(false)
const cancelTarget = ref<any | null>(null)
const cancelFormRef = ref<FormInstance | null>(null)
const cancelSubmitting = ref(false)
const cancelForm = reactive({ reason: '' })
const cancelRules: FormRules = {
  reason: [{ required: true, message: '请填写取消原因', trigger: 'blur' }]
}

const formatDateTime = (d: string | Date | null | undefined) => {
  if (!d) return '-'
  const date = new Date(d)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const scoreClass = (score: number) => {
  if (score >= 80) return 'score-high'
  if (score >= 70) return 'score-mid'
  return 'score-low'
}

const issueTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    compliance: '合规性',
    quality: '质量问题',
    account: '账号异常',
    violation: '违规问题',
    original: '原创性'
  }
  return map[t] || t
}
const issueTypeTag = (t: string) => {
  const map: Record<string, string> = {
    compliance: 'warning',
    quality: 'info',
    account: 'danger',
    violation: 'danger',
    original: 'warning'
  }
  return map[t] || 'info'
}
const severityLabel = (s: string) => {
  const map: Record<string, string> = {
    critical: '致命',
    high: '严重',
    medium: '中等',
    low: '轻微'
  }
  return map[s] || s
}
const severityTag = (s: string) => {
  const map: Record<string, string> = {
    critical: 'danger',
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return map[s] || 'info'
}
const opTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    pre_validate: '前置校验',
    verify_pass: '核验通过',
    verify_reject: '核验不通过',
    featured: '作品收录',
    adjust_weight: '调权重',
    adjust_position: '调位置',
    adjust_level: '调等级',
    cancel_featured: '取消收录',
    batch_featured: '批量收录',
    batch_cancel: '批量取消',
    trace_verify: '溯源校验',
    auto_expire: '自动到期',
    compliance_recheck: '合规复核',
    quality_recheck: '质量复核'
  }
  return map[t] || t
}
const opTypeTag = (t: string) => {
  const map: Record<string, string> = {
    pre_validate: 'info',
    verify_pass: 'success',
    verify_reject: 'danger',
    featured: 'success',
    adjust_weight: 'warning',
    adjust_position: 'warning',
    adjust_level: 'warning',
    cancel_featured: 'danger',
    batch_featured: 'primary',
    batch_cancel: 'danger',
    trace_verify: 'info',
    auto_expire: 'info',
    compliance_recheck: 'warning',
    quality_recheck: 'info'
  }
  return map[t] || 'info'
}
const logResultLabel = (r: string) => {
  const map: Record<string, string> = {
    success: '成功',
    fail: '失败',
    warning: '警告',
    blocked: '拦截',
    filtered: '过滤'
  }
  return map[r] || r
}
const logResultTag = (r: string) => {
  const map: Record<string, string> = {
    success: 'success',
    fail: 'danger',
    warning: 'warning',
    blocked: 'danger',
    filtered: 'info'
  }
  return map[r] || 'info'
}

const resourceRowClassName = ({ row, rowIndex }: { row: any; rowIndex: number }) => {
  if (row.violationCount > 0 || row.isBlocked) return 'row-violation'
  if (row.isFeatured) return 'row-featured'
  if (resourceSelected.value.some(s => s.id === row.id)) return 'row-selected-highlight'
  return rowIndex % 2 === 0 ? 'row-zebra-0' : 'row-zebra-1'
}

const fetchOverview = async () => {
  overviewLoading.value = true
  try {
    const res = await getFeaturedStatusOverview()
    overview.value = res.data
  } finally {
    overviewLoading.value = false
  }
}

const fetchResourceList = async () => {
  resourceLoading.value = true
  try {
    const res = await getResourceListForFeatured({
      page: resourcePage.value,
      pageSize: resourcePageSize.value,
      keyword: resourceFilter.keyword || undefined,
      categoryId: resourceFilter.categoryId || undefined,
      fileType: resourceFilter.fileType || undefined,
      originalOnly: resourceFilter.originalOnly,
      noViolation: resourceFilter.noViolation,
      minLikeCount: resourceFilter.minLikeCount || undefined,
      sortBy: 'likeCount',
      sortOrder: 'desc'
    })
    resourceList.value = res.data.list.map(item => ({
      ...item,
      fileTypeLabel: fileTypeLabel[item.fileType] || item.fileType,
      isOriginal: item.source === 'original' || item.source === 'self_upload',
      _resolutionScore: Math.min(100, Math.round((item.likeCount || 0) / 2 + 30 + Math.random() * 40)),
      _qualityScore: Math.min(100, Math.round((item.viewCount || 0) / 100 + 25 + Math.random() * 50))
    }))
    resourceTotal.value = res.data.total
  } finally {
    resourceLoading.value = false
  }
}

const resetResourceFilter = () => {
  resourceFilter.keyword = ''
  resourceFilter.categoryId = null
  resourceFilter.fileType = ''
  resourceFilter.originalOnly = false
  resourceFilter.noViolation = false
  resourceFilter.minLikeCount = 0
  resourcePage.value = 1
  fetchResourceList()
}

const handleResourceSelectionChange = (selection: any[]) => {
  resourceSelected.value = selection
}

const handlePreValidate = async (row: any) => {
  const key = 'pre-' + row.id
  loadingBtns[key] = true
  try {
    const res = await preValidateFeatured(row.id)
    prevalidateResult.value = res.data
    prevalidateTarget.value = row
    prevalidateDialogVisible.value = true
  } finally {
    loadingBtns[key] = false
  }
}

const openPrevalidateDialog = async (row: any) => {
  prevalidateTarget.value = row
  try {
    const res = await preValidateFeatured(row.id)
    prevalidateResult.value = res.data
  } catch {}
  prevalidateDialogVisible.value = true
}

const quickFeatureFromPrevalidate = () => {
  if (!prevalidateTarget.value) return
  if (prevalidateResult.value?.valid) {
    featureForm.featuredLevel = prevalidateResult.value.suggestedLevel
    featureForm.displayWeight = prevalidateResult.value.suggestedWeight
  }
  prevalidateDialogVisible.value = false
  openFeatureDialog(prevalidateTarget.value)
}

const openFeatureDialog = (row: any) => {
  featureTargetResource.value = row
  featureForm.resourceId = row.id
  const score = (row._resolutionScore || 50) + (row._qualityScore || 50)
  if (score >= 160) {
    featureForm.featuredLevel = 'diamond'
    featureForm.displayWeight = 950
  } else if (score >= 140) {
    featureForm.featuredLevel = 'platinum'
    featureForm.displayWeight = 800
  } else if (score >= 120) {
    featureForm.featuredLevel = 'gold'
    featureForm.displayWeight = 600
  } else if (score >= 100) {
    featureForm.featuredLevel = 'silver'
    featureForm.displayWeight = 400
  } else {
    featureForm.featuredLevel = 'normal'
    featureForm.displayWeight = 200
  }
  featureForm.displayPosition = null
  featureForm.verifyReason = ''
  featureForm.remark = ''
  nextTick(() => featureFormRef.value?.clearValidate())
  featureDialogVisible.value = true
}

const submitFeature = async () => {
  if (!featureFormRef.value) return
  const valid = await featureFormRef.value.validate().catch(() => false)
  if (!valid) return
  featureSubmitting.value = true
  try {
    await createFeaturedWork({
      resourceId: featureForm.resourceId,
      featuredLevel: featureForm.featuredLevel,
      displayWeight: featureForm.displayWeight,
      displayPosition: featureForm.displayPosition || undefined,
      verifyReason: featureForm.verifyReason || undefined,
      remark: featureForm.remark || undefined
    })
    ElMessage.success('作品收录成功，标签已同步更新')
    featureDialogVisible.value = false
    fetchResourceList()
    fetchFeaturedList()
    fetchOverview()
  } finally {
    featureSubmitting.value = false
  }
}

const fetchFeaturedList = async () => {
  featuredLoading.value = true
  try {
    const res = await getFeaturedList({
      page: featuredPage.value,
      pageSize: featuredPageSize.value,
      keyword: featuredFilter.keyword || undefined,
      status: (featuredFilter.status || undefined) as any,
      featuredLevel: (featuredFilter.featuredLevel || undefined) as any,
      displayPosition: (featuredFilter.displayPosition || undefined) as any,
      sortBy: 'displayWeight',
      sortOrder: 'desc'
    })
    featuredList.value = res.data.list.map(item => ({
      ...item,
      resourceTypeLabel: fileTypeLabel[item.resourceType] || item.resourceType
    }))
    featuredTotal.value = res.data.total
  } finally {
    featuredLoading.value = false
  }
}

const resetFeaturedFilter = () => {
  featuredFilter.keyword = ''
  featuredFilter.status = ''
  featuredFilter.featuredLevel = ''
  featuredFilter.displayPosition = ''
  featuredPage.value = 1
  fetchFeaturedList()
}

const handleFeaturedSelectionChange = (selection: any[]) => {
  featuredSelected.value = selection
}

const openWeightDialog = (row: any) => {
  weightTarget.value = row
  weightForm.newWeight = row.displayWeight
  weightForm.reason = ''
  nextTick(() => weightFormRef.value?.clearValidate())
  weightDialogVisible.value = true
}
const submitWeight = async () => {
  if (!weightFormRef.value || !weightTarget.value) return
  const valid = await weightFormRef.value.validate().catch(() => false)
  if (!valid) return
  weightSubmitting.value = true
  try {
    await adjustFeaturedWeight(weightTarget.value.id, {
      newWeight: weightForm.newWeight,
      reason: weightForm.reason
    })
    ElMessage.success('展示权重调整成功')
    weightDialogVisible.value = false
    fetchFeaturedList()
    fetchOverview()
  } finally {
    weightSubmitting.value = false
  }
}

const openPositionDialog = (row: any) => {
  positionTarget.value = row
  positionForm.newPosition = row.displayPosition
  positionForm.reason = ''
  nextTick(() => positionFormRef.value?.clearValidate())
  positionDialogVisible.value = true
}
const submitPosition = async () => {
  if (!positionFormRef.value || !positionTarget.value) return
  const valid = await positionFormRef.value.validate().catch(() => false)
  if (!valid) return
  positionSubmitting.value = true
  try {
    await adjustFeaturedPosition(positionTarget.value.id, {
      newPosition: positionForm.newPosition,
      reason: positionForm.reason
    })
    ElMessage.success('展示位置调整成功')
    positionDialogVisible.value = false
    fetchFeaturedList()
  } finally {
    positionSubmitting.value = false
  }
}

const openLevelDialog = (row: any) => {
  levelTarget.value = row
  levelForm.newLevel = row.featuredLevel
  levelForm.autoAdjustWeight = true
  levelForm.displayWeight = row.displayWeight
  levelForm.reason = ''
  nextTick(() => levelFormRef.value?.clearValidate())
  levelDialogVisible.value = true
}
const submitLevel = async () => {
  if (!levelFormRef.value || !levelTarget.value) return
  const valid = await levelFormRef.value.validate().catch(() => false)
  if (!valid) return
  levelSubmitting.value = true
  try {
    await adjustFeaturedLevel(levelTarget.value.id, {
      newLevel: levelForm.newLevel,
      displayWeight: levelForm.autoAdjustWeight ? undefined : levelForm.displayWeight,
      reason: levelForm.reason
    })
    ElMessage.success('精选等级调整成功')
    levelDialogVisible.value = false
    fetchFeaturedList()
    fetchOverview()
  } finally {
    levelSubmitting.value = false
  }
}

const openCancelDialog = (row: any) => {
  cancelTarget.value = row
  cancelForm.reason = ''
  nextTick(() => cancelFormRef.value?.clearValidate())
  cancelDialogVisible.value = true
}
const submitCancel = async () => {
  if (!cancelFormRef.value || !cancelTarget.value) return
  const valid = await cancelFormRef.value.validate().catch(() => false)
  if (!valid) return
  cancelSubmitting.value = true
  try {
    await cancelFeatured(cancelTarget.value.id, {
      reason: cancelForm.reason
    })
    ElMessage.success('取消收录成功，作品已从精选专区移除')
    cancelDialogVisible.value = false
    fetchFeaturedList()
    fetchResourceList()
    fetchOverview()
  } finally {
    cancelSubmitting.value = false
  }
}

const handleBatchFeature = async () => {
  if (resourceSelected.value.length === 0) return
  batchFeatureLoading.value = true
  try {
    const resourceIds = resourceSelected.value.map(r => r.id)
    const res = await batchFeatureWorks({
      resourceIds,
      defaultLevel: batchDefaultLevel.value,
      defaultPosition: undefined
    })
    const r = res.data
    ElMessage.success(
      `批量收录完成：成功${r.success.length}项，过滤${r.filtered.length}项，失败${r.failed.length}项`
    )
    if (r.filtered.length > 0) {
      const filtered = r.filtered.map(f => `${f.title}:${f.reason}`).join('\n')
      ElMessageBox.alert(filtered, '已过滤不合规作品', { dangerouslyUseHTMLString: false })
    }
    fetchResourceList()
    fetchFeaturedList()
    fetchOverview()
    resourceTableRef.value?.clearSelection()
  } finally {
    batchFeatureLoading.value = false
  }
}

const handleBatchCancel = async () => {
  if (featuredSelected.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认批量取消选中的 ${featuredSelected.value.length} 个收录作品？此操作将自动从专区移除。`,
      '批量取消收录确认',
      { type: 'warning' }
    )
  } catch { return }
  batchCancelLoading.value = true
  try {
    const featuredIds = featuredSelected.value.map(f => f.id)
    const res = await batchCancelFeatured({
      featuredIds,
      reason: '批量操作取消收录'
    })
    const r = res.data
    ElMessage.success(
      `批量取消完成：成功${r.success.length}项，过滤${r.filtered.length}项，失败${r.failed.length}项`
    )
    fetchFeaturedList()
    fetchResourceList()
    fetchOverview()
    featuredTableRef.value?.clearSelection()
  } finally {
    batchCancelLoading.value = false
  }
}

const fetchTraceFeaturedList = async () => {
  traceLoading.value = true
  try {
    const res = await getFeaturedList({
      keyword: traceKeyword.value.trim() || undefined,
      page: 1,
      pageSize: 50
    } as any)
    traceFeaturedList.value = res.data.list
    if (traceFeaturedList.value.length === 0) {
      ElMessage.info('未找到匹配的收录记录')
    }
  } finally {
    traceLoading.value = false
  }
}

const openTraceDetail = async (row: any) => {
  traceDetailVisible.value = true
  traceDetailLoading.value = true
  traceDetail.value = null
  try {
    const res = await traceFeaturedWork(row.id)
    traceDetail.value = res.data
  } finally {
    traceDetailLoading.value = false
  }
}

onMounted(() => {
  fetchOverview()
  fetchResourceList()
})
</script>

<style lang="scss" scoped>
.featured-work-page {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 20px;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.card-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}
.mt-15 {
  margin-top: 15px;
}
.ml-10 {
  margin-left: 10px;
}
.ml-16 {
  margin-left: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.overview-section {
  margin-bottom: 20px;
}
.skeleton-overview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.skeleton-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.overview-card {
  border-radius: 10px;
  padding: 16px;
  color: #fff;
  transition: all 0.3s ease;
}
.overview-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}
.card-pending {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.card-verified {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}
.card-featured {
  background: linear-gradient(135deg, #10b981, #059669);
}
.card-removed {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}
.card-rejected {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.card-score {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}
.overview-label {
  font-size: 13px;
  opacity: 0.9;
}
.overview-value {
  font-size: 28px;
  font-weight: 700;
  margin: 8px 0 4px;
}
.overview-desc {
  font-size: 12px;
  opacity: 0.85;
}

.filter-form {
  margin-bottom: 16px;
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.featured-table {
  margin-bottom: 16px;
}

.skeleton-table {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}
.skeleton-row {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}
.skeleton-row:last-child {
  border-bottom: none;
}
.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-line.short { width: 80px; }
.skeleton-line.medium { width: 140px; }
.skeleton-line.long { flex: 1; }

.featured-table:deep(.el-table__row) {
  transition: background-color 0.3s ease, transform 0.15s ease;
}
.featured-table:deep(.el-table__row:hover) {
  background-color: #eff6ff !important;
}
.featured-table:deep(.row-violation) {
  background-color: #fef2f2 !important;
}
.featured-table:deep(.row-violation:hover) {
  background-color: #fee2e2 !important;
}
.featured-table:deep(.row-featured) {
  background-color: #ecfdf5 !important;
}
.featured-table:deep(.row-featured:hover) {
  background-color: #d1fae5 !important;
}
.featured-table:deep(.row-selected-highlight) {
  background-color: #fffbeb !important;
  box-shadow: inset 3px 0 0 #f59e0b;
}
.featured-table:deep(.row-zebra-0) {
  background-color: #ffffff;
}
.featured-table:deep(.row-zebra-1) {
  background-color: #fafbfc;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.title-text {
  font-weight: 500;
  color: #1f2937;
}
.violation-tag {
  animation: blink 1.5s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.sub-info {
  font-size: 12px;
  color: #6b7280;
}

.score-num {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.metric-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #4b5563;
}
.metric {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.feature-btn-glow {
  position: relative;
  animation: btn-glow 2s ease-in-out infinite;
}
@keyframes btn-glow {
  0%, 100% {
    text-shadow: 0 0 4px rgba(64, 158, 255, 0.5);
    filter: brightness(1);
  }
  50% {
    text-shadow: 0 0 8px rgba(64, 158, 255, 0.8), 0 0 16px rgba(64, 158, 255, 0.4);
    filter: brightness(1.15);
  }
}

.featured-item-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.featured-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.featured-item-title {
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.featured-item-sub {
  font-size: 12px;
  color: #6b7280;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-pending_verify {
  background: #fef3c7;
  color: #92400e;
}
.status-verified {
  background: #dbeafe;
  color: #1e40af;
}
.status-featured {
  background: #d1fae5;
  color: #065f46;
}
.status-removed {
  background: #e5e7eb;
  color: #374151;
}
.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.weight-badge {
  display: inline-block;
  min-width: 50px;
  padding: 3px 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.score-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.score-high {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
}
.score-mid {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
}
.score-low {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
}

.muted-text {
  color: #9ca3af;
  font-size: 12px;
}

.time-standard {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #4b5563;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.trace-search {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.trace-descriptions {
  margin-bottom: 20px;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 20px 0 12px;
  padding-left: 10px;
  border-left: 3px solid #6366f1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.warning-icon {
  color: #f59e0b;
}

.recheck-alert {
  margin-bottom: 12px;
}
.recheck-table {
  margin-bottom: 20px;
}
.snapshot-text {
  color: #4f46e5;
  cursor: pointer;
  text-decoration: underline;
  font-size: 12px;
}

.status-transition-table:deep(.el-table__row) {
  position: relative;
}

.dialog-scale-fade {
  :deep(.el-dialog) {
    animation: dialog-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 12px;
    overflow: hidden;
  }
}
@keyframes dialog-scale-in {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.prevalidate-result {
  .result-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  .result-icon {
    font-size: 40px;
    flex-shrink: 0;
  }
  .result-valid {
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    color: #065f46;
  }
  .result-valid .result-icon {
    color: #10b981;
  }
  .result-blocked {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    color: #991b1b;
  }
  .result-blocked .result-icon {
    color: #ef4444;
    animation: shake-icon 0.5s ease;
  }
  .result-warn {
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    color: #92400e;
  }
  .result-warn .result-icon {
    color: #f59e0b;
  }
  @keyframes shake-icon {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  .result-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .result-sub {
    font-size: 14px;
    opacity: 0.9;
  }
}

.checks-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.check-item {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fafafa;
  transition: all 0.25s ease;
}
.check-item.pass {
  border-color: #6ee7b7;
  background: #ecfdf5;
}
.check-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}
.check-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}
.check-result {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.check-item:not(.pass) .check-result {
  color: #dc2626;
}
.check-item.pass .check-result {
  color: #059669;
}

.errors-section,
.warnings-section {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
}
.errors-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.warnings-section {
  background: #fffbeb;
  border: 1px solid #fde68a;
}
.section-label {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}
.errors-section ul,
.warnings-section ul {
  margin: 0;
  padding-left: 20px;
}
.errors-section li {
  color: #991b1b;
  margin-bottom: 4px;
}
.warnings-section li {
  color: #92400e;
  margin-bottom: 4px;
}

.suggest-section {
  padding: 14px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}
.suggest-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 8px;
}
.weight-val {
  color: #2563eb;
  font-size: 16px;
}

.resource-preview {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 16px;
}
.resource-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.resource-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}
.resource-sub {
  font-size: 12px;
  color: #6b7280;
}
.resource-metrics {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #4b5563;
}

.feature-form {
  :deep(.form-tip) {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 4px;
  }
}

.ripple-btn-content {
  position: relative;
  display: inline-flex;
  overflow: hidden;
  padding: 0 6px;
}
.ripple-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.6);
  opacity: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(1);
}
.ripple-btn-content:hover .ripple-effect {
  animation: ripple 1.2s ease-out infinite;
}
@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(12);
    opacity: 0;
  }
}

.adjust-info {
  padding: 12px 14px;
  background: #f9fafb;
  border-radius: 8px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.info-row:last-child {
  margin-bottom: 0;
}
.info-label {
  color: #6b7280;
  width: 80px;
  flex-shrink: 0;
}
.info-value {
  color: #1f2937;
  font-weight: 500;
}
.weight-current {
  color: #2563eb;
  font-size: 16px;
  font-weight: 700;
}
.ml-10 {
  margin-left: 10px;
}

.form-tip {
  font-size: 12px;
  color: #9ca3af;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}
</style>