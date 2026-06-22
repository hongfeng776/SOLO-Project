<template>
  <div class="quality-control-page">
    <div class="page-header">
      <h2 class="page-title">人机协同内容质检中心</h2>
    </div>

    <el-tabs v-model="activeTab" class="qc-tabs">
      <el-tab-pane label="质量筛查" name="assess">
        <div class="card-wrapper">
          <div class="overview-section">
            <div v-if="statsLoading" class="skeleton-overview">
              <div v-for="i in 7" :key="i" class="skeleton-card">
                <div class="skeleton-line short" />
                <div class="skeleton-line long" />
              </div>
            </div>
            <div v-else class="overview-cards">
              <div class="overview-card card-excellent" @click="quickFilter('excellent')">
                <div class="overview-label">优质作品</div>
                <div class="overview-value">{{ stats?.levelDistribution?.excellent || 0 }}</div>
                <div class="overview-desc">评分 ≥ 85</div>
              </div>
              <div class="overview-card card-good" @click="quickFilter('good')">
                <div class="overview-label">良好作品</div>
                <div class="overview-value">{{ stats?.levelDistribution?.good || 0 }}</div>
                <div class="overview-desc">70 ≤ 评分 &lt; 85</div>
              </div>
              <div class="overview-card card-normal" @click="quickFilter('normal')">
                <div class="overview-label">普通作品</div>
                <div class="overview-value">{{ stats?.levelDistribution?.normal || 0 }}</div>
                <div class="overview-desc">50 ≤ 评分 &lt; 70</div>
              </div>
              <div class="overview-card card-low" @click="quickFilter('low_quality')">
                <div class="overview-label">低质作品</div>
                <div class="overview-value">{{ stats?.levelDistribution?.low_quality || 0 }}</div>
                <div class="overview-desc">30 ≤ 评分 &lt; 50</div>
              </div>
              <div class="overview-card card-violation" @click="quickFilter('violation')">
                <div class="overview-label">违规作品</div>
                <div class="overview-value violation-glow">{{ stats?.levelDistribution?.violation || 0 }}</div>
                <div class="overview-desc">评分 &lt; 30</div>
              </div>
              <div class="overview-card card-pending" @click="activeTab = 'review'">
                <div class="overview-label">待复核</div>
                <div class="overview-value">{{ stats?.pendingReview || 0 }}</div>
                <div class="overview-desc">等待人工复核</div>
              </div>
              <div class="overview-card card-avg">
                <div class="overview-label">平均质量分</div>
                <div class="overview-value">{{ stats?.avgQualityScore || 0 }}</div>
                <div class="overview-desc">今日评估 {{ stats?.todayAssessments || 0 }} 次</div>
              </div>
            </div>
          </div>

          <div class="card-title">作品质量筛查</div>

          <el-form :inline="true" :model="filterForm" class="filter-form">
            <el-form-item label="关键词">
              <el-input v-model="filterForm.keyword" placeholder="标题/素材编码" clearable style="width: 200px">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="质量等级">
              <el-select v-model="filterForm.qualityLevel" placeholder="全部" clearable style="width: 140px">
                <el-option label="优质" value="excellent" />
                <el-option label="良好" value="good" />
                <el-option label="普通" value="normal" />
                <el-option label="低质" value="low_quality" />
                <el-option label="违规" value="violation" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="filterForm.fileType" placeholder="全部" clearable style="width: 120px">
                <el-option label="图片" value="image" />
                <el-option label="视频" value="video" />
                <el-option label="音频" value="audio" />
                <el-option label="模板" value="template" />
              </el-select>
            </el-form-item>
            <el-form-item label="分数范围">
              <el-input-number v-model="filterForm.minScore" :min="0" :max="100" placeholder="最低" controls-position="right" style="width: 100px" />
              <span style="margin: 0 8px; color: #909399">-</span>
              <el-input-number v-model="filterForm.maxScore" :min="0" :max="100" placeholder="最高" controls-position="right" style="width: 100px" />
            </el-form-item>
            <el-form-item label="筛选条件">
              <el-checkbox v-model="filterForm.needsReview" border>待复核</el-checkbox>
              <el-checkbox v-model="filterForm.hasViolation" border>有违规</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchQualityList" :loading="listLoading">查询</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-tag v-if="selected.length > 0" type="primary" effect="light">已选 {{ selected.length }} 项</el-tag>
              <el-tag v-if="batchAssessing" type="warning" effect="dark">
                批量评估进度: {{ batchProgress.done }}/{{ batchProgress.total }}
              </el-tag>
            </div>
            <div class="toolbar-right">
              <el-button
                type="warning"
                :icon="MagicStick"
                :disabled="selected.length === 0"
                @click="handleBatchAssess"
                :loading="batchAssessing"
                class="batch-btn"
              >
                批量质量评估
              </el-button>
            </div>
          </div>

          <div v-if="listLoading && qualityList.length === 0" class="skeleton-table">
            <div v-for="i in 6" :key="i" class="skeleton-row">
              <div class="skeleton-line short" />
              <div class="skeleton-line long" />
              <div class="skeleton-line medium" />
              <div class="skeleton-line short" />
            </div>
          </div>

          <el-table
            v-else
            ref="tableRef"
            v-loading="listLoading"
            :data="qualityList"
            stripe
            border
            class="quality-table"
            height="600"
            @selection-change="handleSelectionChange"
            :row-class-name="tableRowClassName"
          >
            <el-table-column type="selection" width="50" align="center" fixed="left" />
            <el-table-column prop="id" label="ID" width="70" align="center" fixed="left" />
            <el-table-column prop="title" label="作品标题" min-width="220" fixed="left">
              <template #default="{ row }">
                <div class="title-cell">
                  <el-image
                    v-if="row.coverUrl"
                    :src="row.coverUrl"
                    fit="cover"
                    class="cover-thumb"
                    :preview-src-list="[row.coverUrl]"
                  />
                  <span class="title-text">{{ row.title }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="fileType" label="类型" width="70" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="fileTypeTagType[row.fileType] || 'info'">
                  {{ fileTypeLabel[row.fileType] || row.fileType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="质量等级" width="110" align="center">
              <template #default="{ row }">
                <div :class="['quality-level-tag', `qlevel-${row.qualityLevel}`]">
                  <span class="level-bar" />
                  <span>{{ qualityLevelLabel[row.qualityLevel] }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="qualityScore" label="综合分" width="90" align="center">
              <template #default="{ row }">
                <span :class="['score-text', getScoreClass(row.qualityScore)]">
                  {{ Number(row.qualityScore || 0).toFixed(0) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="五维评分" width="260" align="center">
              <template #default="{ row }">
                <div class="score-dimensions">
                  <div class="dim-item" v-tooltip="`画质: ${Number(row.resolutionQualityScore || 0).toFixed(0)}`">
                    <div class="dim-bar">
                      <div class="dim-fill" :style="{ width: `${row.resolutionQualityScore || 0}%` }" />
                    </div>
                    <span class="dim-label">画质</span>
                  </div>
                  <div class="dim-item" v-tooltip="`内容: ${Number(row.contentQualityScore || 0).toFixed(0)}`">
                    <div class="dim-bar">
                      <div class="dim-fill dim-content" :style="{ width: `${row.contentQualityScore || 0}%` }" />
                    </div>
                    <span class="dim-label">内容</span>
                  </div>
                  <div class="dim-item" v-tooltip="`构图: ${Number(row.compositionScore || 0).toFixed(0)}`">
                    <div class="dim-bar">
                      <div class="dim-fill dim-composition" :style="{ width: `${row.compositionScore || 0}%` }" />
                    </div>
                    <span class="dim-label">构图</span>
                  </div>
                  <div class="dim-item" v-tooltip="`合规: ${Number(row.complianceQualityScore || 0).toFixed(0)}`">
                    <div class="dim-bar">
                      <div class="dim-fill dim-compliance" :style="{ width: `${row.complianceQualityScore || 0}%` }" />
                    </div>
                    <span class="dim-label">合规</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="质量标记" width="150" align="center">
              <template #default="{ row }">
                <div class="flags-wrap" v-if="row.qualityFlags?.items?.length">
                  <el-tag
                    v-for="(f, idx) in row.qualityFlags.items.slice(0, 2)"
                    :key="idx"
                    size="small"
                    type="danger"
                    effect="light"
                    class="flag-tag"
                  >
                    {{ f }}
                  </el-tag>
                  <el-tooltip v-if="row.qualityFlags.items.length > 2" :content="row.qualityFlags.items.join('，')" placement="top">
                    <el-tag size="small" type="info">+{{ row.qualityFlags.items.length - 2 }}</el-tag>
                  </el-tooltip>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="复核状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.qualityReviewStatus === 'pending'" type="warning" size="small" effect="dark">待复核</el-tag>
                <el-tag v-else-if="row.qualityReviewStatus === 'approved'" type="success" size="small">已通过</el-tag>
                <el-tag v-else-if="row.qualityReviewStatus === 'rejected'" type="danger" size="small">已锁定</el-tag>
                <el-tag v-else-if="row.qualityReviewStatus === 'locked'" type="info" size="small" effect="dark">已锁定</el-tag>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="qualityAssessedAt" label="评估时间" width="160" align="center">
              <template #default="{ row }">
                <span class="time-text">{{ formatTime(row.qualityAssessedAt) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="handleAssess(row)"
                  :loading="assessingIds[row.id]"
                >
                  质量评估
                </el-button>
                <el-button
                  v-if="row.qualityReviewStatus === 'pending'"
                  type="warning"
                  link
                  size="small"
                  @click="openReviewDialog(row)"
                >
                  人工复核
                </el-button>
                <el-button type="info" link size="small" @click="openDetailDialog(row)">
                  质量详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="fetchQualityList"
              @current-change="fetchQualityList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="质量复核" name="review">
        <div class="card-wrapper">
          <div class="card-title">人工质量复核</div>

          <el-form :inline="true" :model="reviewFilter" class="filter-form">
            <el-form-item label="关键词">
              <el-input v-model="reviewFilter.keyword" placeholder="标题/素材编码" clearable style="width: 200px">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="复核状态">
              <el-select v-model="reviewFilter.qualityReviewStatus" placeholder="全部" clearable style="width: 130px">
                <el-option label="待复核" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已锁定" value="rejected" />
                <el-option label="已锁定(复核)" value="locked" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchQualityList" :loading="listLoading">查询</el-button>
              <el-button @click="resetReviewFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-tag v-if="reviewSelected.length > 0" type="warning" effect="light">已选 {{ reviewSelected.length }} 项</el-tag>
            </div>
            <div class="toolbar-right">
              <el-button
                type="success"
                :icon="Check"
                :disabled="reviewSelected.length === 0"
                @click="handleBatchReview(true)"
                :loading="batchReviewLoading"
              >
                批量通过
              </el-button>
              <el-button
                type="danger"
                :icon="Close"
                :disabled="reviewSelected.length === 0"
                @click="handleBatchReview(false)"
                :loading="batchReviewLoading"
              >
                批量锁定
              </el-button>
            </div>
          </div>

          <el-table
            ref="reviewTableRef"
            v-loading="listLoading"
            :data="qualityList"
            stripe
            border
            height="600"
            @selection-change="handleReviewSelectionChange"
            :row-class-name="tableRowClassName"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="id" label="ID" width="70" align="center" />
            <el-table-column prop="title" label="作品标题" min-width="220">
              <template #default="{ row }">
                <div class="title-cell">
                  <el-image v-if="row.coverUrl" :src="row.coverUrl" fit="cover" class="cover-thumb" />
                  <span class="title-text">{{ row.title }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="质量等级" width="110" align="center">
              <template #default="{ row }">
                <div :class="['quality-level-tag', `qlevel-${row.qualityLevel}`]">
                  <span class="level-bar" />
                  <span>{{ qualityLevelLabel[row.qualityLevel] }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="qualityScore" label="综合分" width="90" align="center">
              <template #default="{ row }">
                <span :class="['score-text', getScoreClass(row.qualityScore)]">
                  {{ Number(row.qualityScore || 0).toFixed(0) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="质量标记" min-width="180" align="center">
              <template #default="{ row }">
                <div class="flags-wrap" v-if="row.qualityFlags?.items?.length">
                  <el-tag v-for="(f, idx) in row.qualityFlags.items" :key="idx" size="small" type="danger" effect="light">
                    {{ f }}
                  </el-tag>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="复核状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.qualityReviewStatus === 'pending'" type="warning" size="small" effect="dark">待复核</el-tag>
                <el-tag v-else-if="row.qualityReviewStatus === 'approved'" type="success" size="small">已通过</el-tag>
                <el-tag v-else-if="row.qualityReviewStatus === 'rejected'" type="danger" size="small">已锁定</el-tag>
                <el-tag v-else-if="row.qualityReviewStatus === 'locked'" type="info" size="small" effect="dark">已锁定</el-tag>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="authorName" label="作者" width="100" align="center" />
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="success"
                  link
                  size="small"
                  :disabled="row.qualityReviewStatus === 'locked'"
                  @click="openReviewDialog(row, true)"
                >
                  通过
                </el-button>
                <el-button
                  type="danger"
                  link
                  size="small"
                  :disabled="row.qualityReviewStatus === 'locked'"
                  @click="openReviewDialog(row, false)"
                >
                  锁定
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="fetchQualityList"
              @current-change="fetchQualityList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="溯源复盘" name="trace">
        <div class="card-wrapper">
          <div class="card-title">质量评估与复核日志</div>

          <el-tabs v-model="traceSubTab" class="sub-tabs">
            <el-tab-pane label="评估日志" name="assess">
              <el-form :inline="true" :model="assessLogFilter" class="filter-form">
                <el-form-item label="关键词">
                  <el-input v-model="assessLogFilter.keyword" placeholder="作品/操作人" clearable style="width: 180px">
                    <template #prefix><el-icon><Search /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="评估类型">
                  <el-select v-model="assessLogFilter.assessType" placeholder="全部" clearable style="width: 130px">
                    <el-option label="自动评估" value="auto" />
                    <el-option label="人工评估" value="manual" />
                    <el-option label="批量评估" value="batch" />
                    <el-option label="复核再评估" value="recheck" />
                  </el-select>
                </el-form-item>
                <el-form-item label="结果等级">
                  <el-select v-model="assessLogFilter.newQualityLevel" placeholder="全部" clearable style="width: 130px">
                    <el-option label="优质" value="excellent" />
                    <el-option label="良好" value="good" />
                    <el-option label="普通" value="normal" />
                    <el-option label="低质" value="low_quality" />
                    <el-option label="违规" value="violation" />
                  </el-select>
                </el-form-item>
                <el-form-item label="筛选条件">
                  <el-checkbox v-model="assessLogFilter.misjudgmentOnly" border>仅误判</el-checkbox>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="fetchAssessLogs" :loading="assessLogLoading">查询</el-button>
                </el-form-item>
              </el-form>

              <el-table v-loading="assessLogLoading" :data="assessLogList" stripe border>
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="resourceTitle" label="作品标题" min-width="200" />
                <el-table-column label="等级变更" width="180" align="center">
                  <template #default="{ row }">
                    <div class="level-transition">
                      <span :class="['mini-level', `qlevel-${row.oldQualityLevel}`]">
                        {{ row.oldQualityLevel ? qualityLevelLabel[row.oldQualityLevel] : '-' }}
                      </span>
                      <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                      <span :class="['mini-level', `qlevel-${row.newQualityLevel}`]">
                        {{ qualityLevelLabel[row.newQualityLevel] }}
                      </span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="newQualityScore" label="新评分" width="80" align="center">
                  <template #default="{ row }">
                    <span :class="['score-text', getScoreClass(row.newQualityScore)]">{{ Number(row.newQualityScore || 0).toFixed(0) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="assessType" label="类型" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" :type="assessTypeTag[row.assessType] || 'info'">
                      {{ assessTypeLabel[row.assessType] }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="operatorName" label="操作人" width="90" align="center">
                  <template #default="{ row }">
                    <span>{{ row.operatorName || '系统' }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="isMisjudgment" label="误判" width="70" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.isMisjudgment" type="danger" size="small" effect="dark">是</el-tag>
                    <span v-else class="text-muted">否</span>
                  </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="操作时间" width="160" align="center">
                  <template #default="{ row }">
                    <span class="time-text">{{ formatTime(row.createdAt) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="复核日志" name="review">
              <el-form :inline="true" :model="reviewLogFilter" class="filter-form">
                <el-form-item label="关键词">
                  <el-input v-model="reviewLogFilter.keyword" placeholder="作品/复核人" clearable style="width: 180px">
                    <template #prefix><el-icon><Search /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="复核结果">
                  <el-select v-model="reviewLogFilter.reviewResult" placeholder="全部" clearable style="width: 130px">
                    <el-option label="复核通过" value="approved" />
                    <el-option label="复核不通过" value="rejected" />
                    <el-option label="状态锁定" value="locked" />
                  </el-select>
                </el-form-item>
                <el-form-item label="筛选条件">
                  <el-checkbox v-model="reviewLogFilter.misjudgmentOnly" border>误判记录</el-checkbox>
                  <el-checkbox v-model="reviewLogFilter.omissionsOnly" border>漏判记录</el-checkbox>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="fetchReviewLogs" :loading="reviewLogLoading">查询</el-button>
                </el-form-item>
              </el-form>

              <el-table v-loading="reviewLogLoading" :data="reviewLogList" stripe border>
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="resourceTitle" label="作品标题" min-width="200" />
                <el-table-column prop="reviewResult" label="复核结果" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.reviewResult === 'approved'" type="success" size="small">通过</el-tag>
                    <el-tag v-else-if="row.reviewResult === 'rejected'" type="danger" size="small">不通过</el-tag>
                    <el-tag v-else type="info" size="small" effect="dark">锁定</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="consistencyScore" label="一致性" width="80" align="center">
                  <template #default="{ row }">
                    <span :class="['score-text', getScoreClass(row.consistencyScore)]">
                      {{ Number(row.consistencyScore || 0).toFixed(0) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="异常标记" width="140" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.misjudgmentFound" type="danger" size="small" effect="dark">误判</el-tag>
                    <el-tag v-if="row.omissionsFound" type="warning" size="small" effect="dark">漏判</el-tag>
                    <span v-if="!row.misjudgmentFound && !row.omissionsFound" class="text-muted">无</span>
                  </template>
                </el-table-column>
                <el-table-column prop="reviewerName" label="复核人" width="90" align="center" />
                <el-table-column prop="reviewReason" label="复核意见" min-width="150" show-overflow-tooltip />
                <el-table-column prop="reviewedAt" label="复核时间" width="160" align="center">
                  <template #default="{ row }">
                    <span class="time-text">{{ formatTime(row.reviewedAt) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="assessDialogVisible"
      title="质量评估进度"
      width="420px"
      :close-on-click-modal="false"
      class="assess-dialog"
    >
      <div class="assess-content">
        <div class="assess-title">{{ assessTarget?.title || '质量评估中...' }}</div>
        <el-progress
          :percentage="assessProgress"
          :status="assessProgress === 100 ? 'success' : undefined"
          :stroke-width="14"
          :show-text="true"
          class="assess-progress"
        />
        <div class="assess-hint" v-if="assessProgress < 100">
          正在进行画质、内容、构图、合规性多维检测...
        </div>
        <div class="assess-result" v-if="assessResult">
          <div class="result-row">
            <span class="result-label">综合质量等级</span>
            <span :class="['quality-level-tag', `qlevel-${assessResult.level}`]">
              <span class="level-bar" />
              <span>{{ qualityLevelLabel[assessResult.level] }}</span>
            </span>
          </div>
          <div class="result-row">
            <span class="result-label">综合评分</span>
            <span :class="['score-text big', getScoreClass(assessResult.scores.overall)]">
              {{ assessResult.scores.overall }}
            </span>
          </div>
          <div class="result-row" v-if="assessResult.flags.length">
            <span class="result-label">问题标记</span>
            <div class="flags-wrap">
              <el-tag v-for="(f, i) in assessResult.flags" :key="i" size="small" type="danger" effect="light">
                {{ f }}
              </el-tag>
            </div>
          </div>
          <div class="result-row" v-if="assessResult.needsReview">
            <el-alert title="该作品需人工复核" type="warning" :closable="false" show-icon />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="assessDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reviewDialogVisible"
      title="质量人工复核"
      width="560px"
      :close-on-click-modal="false"
      class="review-dialog"
    >
      <div v-if="reviewTarget" class="review-content">
        <div class="review-header">
          <span class="review-title">{{ reviewTarget.title }}</span>
          <span :class="['quality-level-tag', `qlevel-${reviewTarget.qualityLevel}`]">
            <span class="level-bar" />
            <span>{{ qualityLevelLabel[reviewTarget.qualityLevel] }}</span>
          </span>
        </div>

        <div class="review-scores">
          <div class="review-score-item">
            <div class="review-score-bar">
              <div class="review-score-fill" :style="{ width: `${reviewTarget.resolutionQualityScore || 0}%` }" />
            </div>
            <span class="review-score-label">画质 {{ Number(reviewTarget.resolutionQualityScore || 0).toFixed(0) }}</span>
          </div>
          <div class="review-score-item">
            <div class="review-score-bar">
              <div class="review-score-fill dim-content" :style="{ width: `${reviewTarget.contentQualityScore || 0}%` }" />
            </div>
            <span class="review-score-label">内容 {{ Number(reviewTarget.contentQualityScore || 0).toFixed(0) }}</span>
          </div>
          <div class="review-score-item">
            <div class="review-score-bar">
              <div class="review-score-fill dim-composition" :style="{ width: `${reviewTarget.compositionScore || 0}%` }" />
            </div>
            <span class="review-score-label">构图 {{ Number(reviewTarget.compositionScore || 0).toFixed(0) }}</span>
          </div>
          <div class="review-score-item">
            <div class="review-score-bar">
              <div class="review-score-fill dim-compliance" :style="{ width: `${reviewTarget.complianceQualityScore || 0}%` }" />
            </div>
            <span class="review-score-label">合规 {{ Number(reviewTarget.complianceQualityScore || 0).toFixed(0) }}</span>
          </div>
        </div>

        <div v-if="reviewTarget.qualityFlags?.items?.length" class="review-flags">
          <div class="flags-label">系统检测到的问题：</div>
          <div class="flags-wrap">
            <el-tag v-for="(f, i) in reviewTarget.qualityFlags.items" :key="i" size="small" type="danger" effect="light">
              {{ f }}
            </el-tag>
          </div>
        </div>

        <el-form :model="reviewForm" label-width="90px" class="review-form">
          <el-form-item label="复核结果">
            <el-radio-group v-model="reviewForm.reviewResult">
              <el-radio label="approved" border>复核通过，恢复正常流量</el-radio>
              <el-radio label="rejected" border>复核不通过，锁定低质状态</el-radio>
              <el-radio label="locked" border>状态锁定</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="reviewForm.reviewResult === 'approved'" label="调整等级">
            <el-select v-model="reviewForm.newLevel" placeholder="选择调整后等级（可选）" clearable style="width: 200px">
              <el-option label="优质" value="excellent" />
              <el-option label="良好" value="good" />
              <el-option label="普通" value="normal" />
              <el-option label="低质" value="low_quality" />
            </el-select>
          </el-form-item>
          <el-form-item label="复核意见">
            <el-input
              v-model="reviewForm.reviewReason"
              type="textarea"
              :rows="3"
              placeholder="请输入复核意见"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item v-if="reviewForm.reviewResult === 'locked'" label="锁定原因">
            <el-input v-model="reviewForm.lockReason" placeholder="请输入状态锁定原因" maxlength="200" show-word-limit />
          </el-form-item>
          <el-form-item label="规则优化建议">
            <el-input v-model="reviewForm.ruleOptimizationNote" placeholder="针对此案例的规则优化建议（选填）" maxlength="500" show-word-limit />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview" :loading="reviewSubmitting" class="submit-review-btn">
          确认复核
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="作品质量详情"
      width="680px"
      class="detail-dialog"
    >
      <div v-if="detailData" class="detail-content">
        <div class="detail-header">
          <div class="detail-title-wrap">
            <span class="detail-title">{{ detailData.resource?.title }}</span>
            <span :class="['quality-level-tag', `qlevel-${detailData.resource?.qualityLevel}`]">
              <span class="level-bar" />
              <span>{{ qualityLevelLabel[detailData.resource?.qualityLevel] }}</span>
            </span>
          </div>
          <div class="detail-overall">
            <span class="overall-label">综合评分</span>
            <span :class="['overall-score', getScoreClass(detailData.scores.overall)]">
              {{ detailData.scores.overall }}
            </span>
          </div>
        </div>

        <div class="detail-dimensions">
          <div class="dim-card">
            <div class="dim-score" :class="getScoreClass(detailData.scores.resolution)">{{ detailData.scores.resolution }}</div>
            <div class="dim-name">画质</div>
          </div>
          <div class="dim-card">
            <div class="dim-score dim-content" :class="getScoreClass(detailData.scores.content)">{{ detailData.scores.content }}</div>
            <div class="dim-name">内容</div>
          </div>
          <div class="dim-card">
            <div class="dim-score dim-composition" :class="getScoreClass(detailData.scores.composition)">{{ detailData.scores.composition }}</div>
            <div class="dim-name">构图</div>
          </div>
          <div class="dim-card">
            <div class="dim-score dim-compliance" :class="getScoreClass(detailData.scores.compliance)">{{ detailData.scores.compliance }}</div>
            <div class="dim-name">合规</div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <span>一致性校验</span>
            <el-tag :type="detailData.consistency.consistent ? 'success' : 'danger'" size="small">
              {{ detailData.consistency.consistent ? '一致' : '异常' }}
            </el-tag>
            <span class="consistency-score">一致性评分 {{ detailData.consistency.score }}</span>
          </div>
          <div v-if="detailData.consistency.issues.length" class="consistency-issues">
            <div v-for="(issue, i) in detailData.consistency.issues" :key="i" class="issue-item">
              <el-icon :class="['issue-icon', `severity-${issue.severity}`]"><Warning /></el-icon>
              <span>{{ issue.description }}</span>
            </div>
          </div>
          <div v-else class="no-issue text-muted">未发现判定标准不一致问题</div>
        </div>

        <div v-if="detailData.flags.length" class="detail-section">
          <div class="section-title">质量问题标记</div>
          <div class="flags-wrap">
            <el-tag v-for="(f, i) in detailData.flags" :key="i" type="danger" effect="light">
              {{ f }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">历史评估与复核记录</div>
          <el-timeline class="qc-timeline">
            <el-timeline-item
              v-for="log in detailData.assessmentLogs?.slice(0, 5)"
              :key="'a' + log.id"
              :timestamp="formatTime(log.createdAt)"
              type="primary"
            >
              <div class="timeline-item-title">
                <el-tag size="small" :type="assessTypeTag[log.assessType] || 'info'">
                  {{ assessTypeLabel[log.assessType] }}评估
                </el-tag>
                <span :class="['mini-level', `qlevel-${log.newQualityLevel}`]">
                  {{ qualityLevelLabel[log.newQualityLevel] }}
                </span>
                <span class="timeline-operator">{{ log.operatorName || '系统' }}</span>
                <el-tag v-if="log.isMisjudgment" type="danger" size="small" effect="dark">误判</el-tag>
              </div>
              <div class="timeline-scores">
                画质 {{ log.resolutionScore }} / 内容 {{ log.contentScore }} / 构图 {{ log.compositionScore }} / 合规 {{ log.complianceScore }} / 综合 {{ log.newQualityScore }}
              </div>
              <div v-if="log.qualityFlags?.items?.length" class="timeline-flags">
                <el-tag v-for="(f, i) in log.qualityFlags.items" :key="i" size="small" type="danger" effect="light">
                  {{ f }}
                </el-tag>
              </div>
            </el-timeline-item>
            <el-timeline-item
              v-for="log in detailData.reviewLogs?.slice(0, 5)"
              :key="'r' + log.id"
              :timestamp="formatTime(log.reviewedAt)"
              :type="log.reviewResult === 'approved' ? 'success' : log.reviewResult === 'rejected' ? 'danger' : 'info'"
            >
              <div class="timeline-item-title">
                <el-tag size="small" :type="log.reviewResult === 'approved' ? 'success' : log.reviewResult === 'rejected' ? 'danger' : 'info'">
                  {{ log.reviewResult === 'approved' ? '复核通过' : log.reviewResult === 'rejected' ? '复核不通过' : '状态锁定' }}
                </el-tag>
                <span class="timeline-operator">{{ log.reviewerName }}</span>
                <el-tag v-if="log.misjudgmentFound" type="danger" size="small" effect="dark">误判</el-tag>
                <el-tag v-if="log.omissionsFound" type="warning" size="small" effect="dark">漏判</el-tag>
              </div>
              <div v-if="log.reviewReason" class="timeline-reason">意见：{{ log.reviewReason }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Check,
  Close,
  ArrowRight,
  Warning,
  MagicStick
} from '@element-plus/icons-vue'
import type { QualityLevel, ReviewResult } from '@/types'
import {
  getQualityStats,
  getQualityResourceList,
  getResourceQualityDetail,
  getQualityAssessmentLogs,
  getQualityReviewLogs,
  assessResourceQuality,
  batchAssessQuality,
  reviewResourceQuality
} from '@/api/qualityControl'

const activeTab = ref('assess')
const traceSubTab = ref('assess')

const stats = ref<any>(null)
const statsLoading = ref(false)

const qualityList = ref<any[]>([])
const listLoading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selected = ref<any[]>([])
const tableRef = ref<any>(null)
const reviewSelected = ref<any[]>([])
const reviewTableRef = ref<any>(null)

const filterForm = reactive({
  keyword: '',
  qualityLevel: '',
  fileType: '',
  minScore: undefined as number | undefined,
  maxScore: undefined as number | undefined,
  needsReview: false,
  hasViolation: false
})

const reviewFilter = reactive({
  keyword: '',
  qualityReviewStatus: 'pending'
})

const assessLogFilter = reactive({
  keyword: '',
  assessType: '',
  newQualityLevel: '',
  misjudgmentOnly: false
})

const reviewLogFilter = reactive({
  keyword: '',
  reviewResult: '',
  misjudgmentOnly: false,
  omissionsOnly: false
})

const assessLogList = ref<any[]>([])
const assessLogLoading = ref(false)
const assessLogTotal = ref(0)

const reviewLogList = ref<any[]>([])
const reviewLogLoading = ref(false)
const reviewLogTotal = ref(0)

const assessDialogVisible = ref(false)
const assessTarget = ref<any>(null)
const assessProgress = ref(0)
const assessResult = ref<any>(null)
const assessingIds = reactive<Record<number, boolean>>({})

const batchAssessing = ref(false)
const batchProgress = reactive({ done: 0, total: 0 })

const reviewDialogVisible = ref(false)
const reviewTarget = ref<any>(null)
const reviewSubmitting = ref(false)
const batchReviewLoading = ref(false)

const reviewForm = reactive({
  reviewResult: 'approved' as ReviewResult,
  newLevel: '' as QualityLevel | '',
  reviewReason: '',
  lockReason: '',
  ruleOptimizationNote: ''
})

const detailDialogVisible = ref(false)
const detailData = ref<any>(null)

const qualityLevelLabel: Record<string, string> = {
  excellent: '优质',
  good: '良好',
  normal: '普通',
  low_quality: '低质',
  violation: '违规'
}

const fileTypeLabel: Record<string, string> = {
  image: '图片',
  video: '视频',
  audio: '音频',
  template: '模板'
}

const fileTypeTagType: Record<string, string> = {
  image: 'success',
  video: 'primary',
  audio: 'warning',
  template: 'info'
}

const assessTypeLabel: Record<string, string> = {
  auto: '自动',
  manual: '人工',
  batch: '批量',
  recheck: '复核'
}

const assessTypeTag: Record<string, string> = {
  auto: 'info',
  manual: '',
  batch: 'warning',
  recheck: 'success'
}

const getScoreClass = (score: any) => {
  const s = Number(score || 0)
  if (s >= 85) return 'score-excellent'
  if (s >= 70) return 'score-good'
  if (s >= 50) return 'score-normal'
  if (s >= 30) return 'score-low'
  return 'score-violation'
}

const tableRowClassName = ({ row }: any) => {
  if (row.qualityLevel === 'violation') return 'row-violation'
  if (row.qualityLevel === 'low_quality') return 'row-low'
  if (row.qualityReviewStatus === 'pending') return 'row-pending'
  return ''
}

const fetchStats = async () => {
  statsLoading.value = true
  try {
    const res = await getQualityStats()
    stats.value = res.data
  } finally {
    statsLoading.value = false
  }
}

const fetchQualityList = async () => {
  listLoading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || reviewFilter.keyword || undefined,
      qualityLevel: filterForm.qualityLevel || undefined,
      qualityReviewStatus: activeTab.value === 'review' ? (reviewFilter.qualityReviewStatus || 'pending') : undefined,
      fileType: filterForm.fileType || undefined,
      minScore: filterForm.minScore,
      maxScore: filterForm.maxScore,
      needsReview: filterForm.needsReview,
      hasViolation: filterForm.hasViolation,
      sortBy: 'qualityAssessedAt',
      sortOrder: 'desc'
    }
    const res = await getQualityResourceList(params)
    qualityList.value = res.data.list
    total.value = res.data.total
  } finally {
    listLoading.value = false
  }
}

const fetchAssessLogs = async () => {
  assessLogLoading.value = true
  try {
    const params: any = {
      ...assessLogFilter,
      keyword: assessLogFilter.keyword || undefined,
      assessType: assessLogFilter.assessType || undefined,
      newQualityLevel: assessLogFilter.newQualityLevel || undefined,
      page: 1,
      pageSize: 50
    }
    const res = await getQualityAssessmentLogs(params)
    assessLogList.value = res.data.list
    assessLogTotal.value = res.data.total
  } finally {
    assessLogLoading.value = false
  }
}

const fetchReviewLogs = async () => {
  reviewLogLoading.value = true
  try {
    const params: any = {
      ...reviewLogFilter,
      keyword: reviewLogFilter.keyword || undefined,
      reviewResult: reviewLogFilter.reviewResult || undefined,
      page: 1,
      pageSize: 50
    }
    const res = await getQualityReviewLogs(params)
    reviewLogList.value = res.data.list
    reviewLogTotal.value = res.data.total
  } finally {
    reviewLogLoading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.qualityLevel = ''
  filterForm.fileType = ''
  filterForm.minScore = undefined
  filterForm.maxScore = undefined
  filterForm.needsReview = false
  filterForm.hasViolation = false
  page.value = 1
  fetchQualityList()
}

const resetReviewFilter = () => {
  reviewFilter.keyword = ''
  reviewFilter.qualityReviewStatus = 'pending'
  page.value = 1
  fetchQualityList()
}

const quickFilter = (level: string) => {
  filterForm.qualityLevel = level as any
  activeTab.value = 'assess'
  page.value = 1
  fetchQualityList()
}

const handleSelectionChange = (selection: any[]) => {
  selected.value = selection
}

const handleReviewSelectionChange = (selection: any[]) => {
  reviewSelected.value = selection
}

const handleAssess = async (row: any) => {
  assessTarget.value = row
  assessProgress.value = 0
  assessResult.value = null
  assessDialogVisible.value = true
  assessingIds[row.id] = true

  const steps = [20, 40, 60, 80, 95, 100]
  for (const p of steps) {
    await new Promise(r => setTimeout(r, 150))
    assessProgress.value = p
  }

  try {
    const res = await assessResourceQuality(row.id)
    assessResult.value = res.data
    ElMessage.success(res.message || '评估完成')
    fetchQualityList()
    fetchStats()
    fetchAssessLogs()
  } catch (e: any) {
    ElMessage.error(e?.message || '评估失败')
  } finally {
    assessingIds[row.id] = false
  }
}

const handleBatchAssess = async () => {
  if (selected.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定对选中的 ${selected.value.length} 个作品进行批量质量评估吗？`,
      '批量质量评估',
      { type: 'warning' }
    )
  } catch {
    return
  }

  batchAssessing.value = true
  batchProgress.total = selected.value.length
  batchProgress.done = 0

  try {
    const ids = selected.value.map(r => r.id)
    const res = await batchAssessQuality({ ids })

    const msg = `批量评估完成：优质${res.data.excellent.length}，良好${res.data.good.length}，普通${res.data.normal.length}，低质${res.data.low_quality.length}，违规${res.data.violation.length}，失败${res.data.failedCount}`
    ElMessage.success(msg)

    fetchQualityList()
    fetchStats()
    fetchAssessLogs()
    tableRef.value?.clearSelection()
  } catch (e: any) {
    ElMessage.error(e?.message || '批量评估失败')
  } finally {
    batchAssessing.value = false
  }
}

const openReviewDialog = (row: any, preselect?: boolean) => {
  reviewTarget.value = row
  reviewForm.reviewResult = preselect === undefined ? 'approved' : (preselect ? 'approved' : 'rejected')
  reviewForm.newLevel = ''
  reviewForm.reviewReason = ''
  reviewForm.lockReason = ''
  reviewForm.ruleOptimizationNote = ''
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  if (!reviewTarget.value) return

  reviewSubmitting.value = true
  try {
    const res = await reviewResourceQuality(reviewTarget.value.id, {
      reviewResult: reviewForm.reviewResult,
      newLevel: reviewForm.newLevel || undefined,
      reviewReason: reviewForm.reviewReason || undefined,
      lockReason: reviewForm.lockReason || undefined,
      ruleOptimizationNote: reviewForm.ruleOptimizationNote || undefined
    })

    ElMessage.success(res.data.message || '复核完成')
    reviewDialogVisible.value = false
    fetchQualityList()
    fetchStats()
    fetchReviewLogs()
    fetchAssessLogs()
  } catch (e: any) {
    ElMessage.error(e?.message || '复核失败')
  } finally {
    reviewSubmitting.value = false
  }
}

const handleBatchReview = async (pass: boolean) => {
  if (reviewSelected.value.length === 0) return

  const action = pass ? '通过' : '锁定'
  try {
    await ElMessageBox.confirm(
      `确定批量${action}选中的 ${reviewSelected.value.length} 个作品吗？`,
      `批量${action}`,
      { type: pass ? 'success' : 'warning' }
    )
  } catch {
    return
  }

  batchReviewLoading.value = true
  try {
    let success = 0
    let failed = 0

    for (const item of reviewSelected.value) {
      if (item.qualityReviewStatus === 'locked') {
        failed++
        continue
      }
      try {
        await reviewResourceQuality(item.id, {
          reviewResult: pass ? 'approved' : 'rejected'
        })
        success++
      } catch {
        failed++
      }
    }

    ElMessage.success(`批量${action}完成：成功${success}个，失败${failed}个`)
    fetchQualityList()
    fetchStats()
    fetchReviewLogs()
    reviewTableRef.value?.clearSelection()
  } finally {
    batchReviewLoading.value = false
  }
}

const openDetailDialog = async (row: any) => {
  detailData.value = null
  detailDialogVisible.value = true

  try {
    const res = await getResourceQualityDetail(row.id)
    detailData.value = res.data
  } catch (e: any) {
    ElMessage.error(e?.message || '获取详情失败')
  }
}

const formatTime = (time: string) => {
  if (!time) return '-'
  const d = new Date(time)
  const pad = (n: number) => (n < 10 ? '0' + n : n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => {
  fetchStats()
  fetchQualityList()
})
</script>

<style scoped lang="scss">
.quality-control-page { padding: 16px; }

.page-header { margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }

.card-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 16px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.overview-card {
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12); }
}

.card-excellent { background: linear-gradient(135deg, #e8f7ef 0%, #d1efd9 100%); .overview-label{color:#52c41a;} .overview-value{color:#389e0d;} }
.card-good { background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%); .overview-label{color:#409eff;} .overview-value{color:#2b85e4;} }
.card-normal { background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%); .overview-label{color:#8c8c8c;} .overview-value{color:#595959;} }
.card-low { background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%); .overview-label{color:#e6a23c;} .overview-value{color:#b88230;} }
.card-violation { background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%); .overview-label{color:#f56c6c;} .overview-value{color:#dd6161;} }
.card-pending { background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%); .overview-label{color:#fa8c16;} .overview-value{color:#d46b08;} }
.card-avg { background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%); .overview-label{color:#9254de;} .overview-value{color:#722ed1;} }

.violation-glow { animation: violation-blink 2s ease-in-out infinite; }
@keyframes violation-blink {
  0%, 100% { text-shadow: 0 0 5px rgba(245, 108, 108, 0.3); }
  50% { text-shadow: 0 0 15px rgba(245, 108, 108, 0.8); }
}

.overview-label { font-size: 12px; margin-bottom: 6px; font-weight: 500; }
.overview-value { font-size: 24px; font-weight: 700; line-height: 1.2; margin-bottom: 4px; }
.overview-desc { font-size: 11px; color: #909399; }

.filter-form { margin-bottom: 16px; }

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.batch-btn {
  transition: all 0.3s ease;
  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(230, 162, 60, 0.4);
    transform: translateY(-1px);
  }
}

.quality-table {
  :deep(.el-table__row.row-violation) { background-color: #fef0f0 !important; }
  :deep(.el-table__row.row-low) { background-color: #fdf6ec !important; }
  :deep(.el-table__row.row-pending) { background-color: #fffbe6 !important; }
  :deep(.el-table__body tr:hover > td) { background-color: #ecf5ff !important; }
}

.title-cell { display: flex; align-items: center; gap: 10px; }
.cover-thumb { width: 40px; height: 40px; border-radius: 4px; flex-shrink: 0; }
.title-text { font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.quality-level-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;

  &.qlevel-excellent {
    background: #e8f7ef; color: #389e0d;
    .level-bar { background: #52c41a; box-shadow: 0 0 6px #52c41a; }
  }
  &.qlevel-good {
    background: #ecf5ff; color: #2b85e4;
    .level-bar { background: #409eff; box-shadow: 0 0 6px #409eff; }
  }
  &.qlevel-normal {
    background: #f0f0f0; color: #595959;
    .level-bar { background: #8c8c8c; }
  }
  &.qlevel-low_quality {
    background: #fdf6ec; color: #b88230;
    .level-bar { background: #e6a23c; box-shadow: 0 0 6px #e6a23c; }
  }
  &.qlevel-violation {
    background: #fef0f0; color: #dd6161;
    .level-bar { background: #f56c6c; box-shadow: 0 0 8px #f56c6c; animation: level-blink 1.5s infinite; }
  }
}
@keyframes level-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.level-bar { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

.mini-level {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;

  &.qlevel-excellent { background: #e8f7ef; color: #389e0d; }
  &.qlevel-good { background: #ecf5ff; color: #2b85e4; }
  &.qlevel-normal { background: #f0f0f0; color: #595959; }
  &.qlevel-low_quality { background: #fdf6ec; color: #b88230; }
  &.qlevel-violation { background: #fef0f0; color: #dd6161; }
}

.score-text {
  font-weight: 700;
  font-family: 'Courier New', monospace;
  &.big { font-size: 24px; }
  &.score-excellent { color: #389e0d; }
  &.score-good { color: #2b85e4; }
  &.score-normal { color: #595959; }
  &.score-low { color: #e6a23c; }
  &.score-violation { color: #f56c6c; }
}

.score-dimensions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.dim-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.dim-bar {
  width: 35px;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}
.dim-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 3px;
  transition: width 0.6s ease;
  &.dim-content { background: linear-gradient(90deg, #67c23a, #85ce61); }
  &.dim-composition { background: linear-gradient(90deg, #e6a23c, #f0c78a); }
  &.dim-compliance { background: linear-gradient(90deg, #f56c6c, #f89898); }
}
.dim-label { font-size: 11px; color: #606266; }

.flags-wrap { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.flag-tag { animation: flag-pop 0.3s ease; }
@keyframes flag-pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.text-muted { color: #c0c4cc; font-size: 12px; }
.time-text { font-size: 12px; color: #909399; font-family: 'Courier New', monospace; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

.level-transition {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.arrow-icon { font-size: 14px; color: #c0c4cc; }

.skeleton-card { padding: 16px; background: #f5f7fa; border-radius: 8px; }
.skeleton-table { padding: 10px 0; display: flex; flex-direction: column; gap: 12px; }
.skeleton-row {
  padding: 12px 16px; background: #fafafa; border-radius: 6px;
  display: flex; gap: 12px; align-items: center;
}
.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  &.short { width: 8%; }
  &.medium { width: 20%; }
  &.long { width: 40%; }
}
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-overview { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }

.assess-dialog {
  :deep(.el-dialog) { border-radius: 12px; animation: dialog-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
}
@keyframes dialog-scale-in {
  0% { opacity: 0; transform: scale(0.9) translateY(-20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.assess-content { padding: 10px 0; }
.assess-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 18px;
  text-align: center;
}
.assess-progress { margin: 20px 0; }
.assess-hint { font-size: 13px; color: #909399; text-align: center; margin-top: 12px; }

.assess-result {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  animation: result-fade-in 0.4s ease;
}
@keyframes result-fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
  &:last-child { border-bottom: none; }
}
.result-label { font-size: 13px; color: #606266; }

.review-dialog {
  :deep(.el-dialog) { border-radius: 12px; animation: dialog-scale-in 0.3s ease; }
}
.review-content { padding: 4px 0; }
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #ebeef5;
}
.review-title { font-size: 15px; font-weight: 600; color: #303133; }

.review-scores {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.review-score-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.review-score-bar {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
.review-score-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 4px;
  transition: width 0.6s ease;
  &.dim-content { background: linear-gradient(90deg, #67c23a, #85ce61); }
  &.dim-composition { background: linear-gradient(90deg, #e6a23c, #f0c78a); }
  &.dim-compliance { background: linear-gradient(90deg, #f56c6c, #f89898); }
}
.review-score-label { font-size: 12px; color: #606266; }

.review-flags { margin-bottom: 14px; }
.flags-label { font-size: 13px; color: #f56c6c; margin-bottom: 8px; }

.review-form { margin-top: 16px; }
.submit-review-btn {
  transition: all 0.3s ease;
  &:hover:not(:disabled) { transform: translateX(2px); }
}

.detail-dialog {
  :deep(.el-dialog) { border-radius: 12px; }
}
.detail-content { padding: 4px 0; }
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}
.detail-title-wrap { display: flex; align-items: center; gap: 12px; }
.detail-title { font-size: 16px; font-weight: 600; color: #303133; }
.detail-overall { display: flex; align-items: baseline; gap: 8px; }
.overall-label { font-size: 13px; color: #606266; }
.overall-score {
  font-size: 32px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  text-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  &.score-excellent { color: #389e0d; }
  &.score-good { color: #2b85e4; }
  &.score-normal { color: #595959; }
  &.score-low { color: #e6a23c; }
  &.score-violation { color: #f56c6c; }
}

.detail-dimensions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.dim-card {
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa, #e9ecef);
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
}
.dim-score {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #409eff;
  margin-bottom: 4px;
  &.dim-content { color: #67c23a; }
  &.dim-composition { color: #e6a23c; }
  &.dim-compliance { color: #f56c6c; }
}
.dim-name { font-size: 13px; color: #606266; }

.detail-section { margin-bottom: 20px; }
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.consistency-score {
  margin-left: auto;
  font-size: 13px;
  color: #909399;
}
.consistency-issues { display: flex; flex-direction: column; gap: 8px; }
.issue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef6f6;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
}
.issue-icon {
  font-size: 16px;
  &.severity-high { color: #f56c6c; }
  &.severity-warning { color: #e6a23c; }
  &.severity-low { color: #909399; }
}
.no-issue { padding: 12px; background: #f0f9eb; border-radius: 6px; }

.qc-timeline { padding: 10px 0 0 10px; }
.timeline-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.timeline-operator { font-size: 13px; color: #606266; font-weight: 500; }
.timeline-scores { font-size: 12px; color: #909399; margin-bottom: 6px; }
.timeline-flags { display: flex; gap: 4px; flex-wrap: wrap; }
.timeline-reason { font-size: 13px; color: #606266; }

.sub-tabs {
  :deep(.el-tabs__header) { margin-bottom: 16px; }
}

@media screen and (max-width: 1500px) {
  .overview-cards { grid-template-columns: repeat(4, 1fr); }
  .skeleton-overview { grid-template-columns: repeat(4, 1fr); }
}
</style>
