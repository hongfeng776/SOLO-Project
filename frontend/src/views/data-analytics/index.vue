<template>
  <div class="data-analytics-page">
    <div class="page-header"><h2 class="page-title">数据筛选汇总溯源</h2></div>

    <el-tabs v-model="activeTab" class="da-tabs">
      <el-tab-pane label="数据筛选" name="filter">
        <div class="card-wrapper">
          <div class="overview-section">
            <div v-if="overviewLoading" class="skeleton-overview">
              <div v-for="i in 7" :key="i" class="skeleton-card"><div class="skeleton-line short" /><div class="skeleton-line long" /></div>
            </div>
            <div v-else class="overview-cards">
              <div class="overview-card card-total"><div class="overview-label">总作品数</div><div class="overview-value">{{ formatNum(overview?.totalResources) }}</div><div class="overview-desc">全平台作品总量</div></div>
              <div class="overview-card card-views"><div class="overview-label">总浏览量</div><div class="overview-value">{{ formatNum(overview?.totalViews) }}</div><div class="overview-desc">累计浏览次数</div></div>
              <div class="overview-card card-likes"><div class="overview-label">总点赞数</div><div class="overview-value">{{ formatNum(overview?.totalLikes) }}</div><div class="overview-desc">累计点赞次数</div></div>
              <div class="overview-card card-favorites"><div class="overview-label">总收藏数</div><div class="overview-value">{{ formatNum(overview?.totalFavorites) }}</div><div class="overview-desc">累计收藏次数</div></div>
              <div class="overview-card card-shares"><div class="overview-label">总转发数</div><div class="overview-value">{{ formatNum(overview?.totalShares) }}</div><div class="overview-desc">累计转发次数</div></div>
              <div class="overview-card card-comments"><div class="overview-label">总评论数</div><div class="overview-value">{{ formatNum(overview?.totalComments) }}</div><div class="overview-desc">累计评论次数</div></div>
              <div class="overview-card card-anomaly"><div class="overview-label">数据异常</div><div class="overview-value anomaly-glow">{{ overview?.abnormalCount || 0 }}</div><div class="overview-desc">疑似/确认异常</div></div>
            </div>
          </div>

          <div class="card-title">作品数据筛选</div>

          <el-form :inline="true" :model="filterForm" class="filter-form" :class="{ 'has-error': filterErrors.length > 0 }">
            <el-form-item label="关键词">
              <el-input v-model="filterForm.keyword" placeholder="标题/素材编码" clearable style="width: 200px" class="filter-input" @focus="onFocus" @blur="onBlur">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="作品类型">
              <el-select v-model="filterForm.fileType" placeholder="全部" clearable style="width: 120px" class="filter-input" @focus="onFocus" @blur="onBlur">
                <el-option label="图片" value="image" /><el-option label="视频" value="video" /><el-option label="音频" value="audio" /><el-option label="模板" value="template" />
              </el-select>
            </el-form-item>
            <el-form-item label="质量等级">
              <el-select v-model="filterForm.qualityLevel" placeholder="全部" clearable style="width: 130px">
                <el-option label="优质" value="excellent" /><el-option label="良好" value="good" /><el-option label="普通" value="normal" /><el-option label="低质" value="low_quality" /><el-option label="违规" value="violation" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至" start-placeholder="开始" end-placeholder="结束" style="width: 340px" value-format="YYYY-MM-DD HH:mm:ss" class="filter-input" @focus="onFocus" @blur="onBlur" />
            </el-form-item>
            <el-form-item label="筛选条件">
              <el-checkbox v-model="filterForm.includeDeleted" border>含已删除</el-checkbox>
              <el-checkbox v-model="filterForm.includeHidden" border>含隐藏</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleFilter" :loading="listLoading">查询</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <div v-if="filterErrors.length" class="filter-errors">
            <div v-for="(err, i) in filterErrors" :key="i" class="error-item">{{ err }}</div>
          </div>

          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-tag v-if="selected.length > 0" type="primary" effect="light">已选 {{ selected.length }} 项</el-tag>
            </div>
            <div class="toolbar-right">
              <el-button type="warning" :icon="DataAnalysis" :disabled="selected.length === 0" @click="handleBatchSummary" :loading="summaryLoading" class="batch-btn">批量汇总</el-button>
            </div>
          </div>

          <el-table ref="tableRef" v-loading="listLoading" :data="dataList" stripe border height="520" @selection-change="handleSelectionChange" :row-class-name="rowClassName">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="id" label="ID" width="70" align="center" />
            <el-table-column prop="title" label="作品标题" min-width="200">
              <template #default="{ row }">
                <div class="title-cell">
                  <el-image v-if="row.coverUrl" :src="row.coverUrl" fit="cover" class="cover-thumb" />
                  <span class="title-text">{{ row.title }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="viewCount" label="浏览" width="90" align="center">
              <template #default="{ row }"><span class="num-text">{{ formatNum(row.viewCount) }}</span></template>
            </el-table-column>
            <el-table-column prop="likeCount" label="点赞" width="80" align="center">
              <template #default="{ row }"><span class="num-text">{{ formatNum(row.likeCount) }}</span></template>
            </el-table-column>
            <el-table-column prop="favoriteCount" label="收藏" width="80" align="center">
              <template #default="{ row }"><span class="num-text">{{ formatNum(row.favoriteCount) }}</span></template>
            </el-table-column>
            <el-table-column prop="shareCount" label="转发" width="80" align="center">
              <template #default="{ row }"><span class="num-text">{{ formatNum(row.shareCount) }}</span></template>
            </el-table-column>
            <el-table-column prop="commentCount" label="评论" width="80" align="center">
              <template #default="{ row }"><span class="num-text">{{ formatNum(row.commentCount) }}</span></template>
            </el-table-column>
            <el-table-column prop="hotnessScore" label="热度" width="90" align="center">
              <template #default="{ row }"><span class="hotness-text">{{ Number(row.hotnessScore || 0).toFixed(0) }}</span></template>
            </el-table-column>
            <el-table-column label="数据状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.dataIntegrityStatus === 'abnormal'" type="danger" size="small" effect="dark">异常</el-tag>
                <el-tag v-else-if="row.dataIntegrityStatus === 'suspected'" type="warning" size="small">疑似</el-tag>
                <span v-else class="text-muted">正常</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openDetailDialog(row)">数据复盘</el-button>
                <el-button type="info" link size="small" @click="openTraceDialog(row)">溯源校验</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @size-change="fetchDataList" @current-change="fetchDataList" />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量汇总" name="summary">
        <div class="card-wrapper">
          <div class="card-title">批量数据简报</div>

          <div v-if="summaryResult" class="summary-content">
            <div class="summary-stats">
              <div class="stat-card"><div class="stat-value">{{ summaryResult.total }}</div><div class="stat-label">作品总数</div></div>
              <div class="stat-card"><div class="stat-value">{{ formatNum(summaryResult.totalViews) }}</div><div class="stat-label">总浏览量</div></div>
              <div class="stat-card"><div class="stat-value">{{ formatNum(summaryResult.totalLikes) }}</div><div class="stat-label">总点赞数</div></div>
              <div class="stat-card"><div class="stat-value">{{ formatNum(summaryResult.totalFavorites) }}</div><div class="stat-label">总收藏数</div></div>
              <div class="stat-card"><div class="stat-value">{{ formatNum(summaryResult.totalShares) }}</div><div class="stat-label">总转发数</div></div>
              <div class="stat-card"><div class="stat-value">{{ formatNum(summaryResult.totalComments) }}</div><div class="stat-label">总评论数</div></div>
            </div>

            <div class="summary-averages">
              <div class="avg-item"><span class="avg-label">平均浏览</span><span class="avg-value">{{ summaryResult.avgViews }}</span></div>
              <div class="avg-item"><span class="avg-label">平均点赞</span><span class="avg-value">{{ summaryResult.avgLikes }}</span></div>
              <div class="avg-item"><span class="avg-label">平均热度</span><span class="avg-value">{{ summaryResult.avgHotness }}</span></div>
              <div class="avg-item"><span class="avg-label">异常作品</span><span class="avg-value anomaly">{{ summaryResult.anomalyCount }}</span></div>
            </div>

            <div class="summary-distribution">
              <div class="dist-section">
                <div class="dist-title">质量分布</div>
                <div class="dist-items">
                  <div v-for="(count, level) in summaryResult.qualityDistribution" :key="level" class="dist-item">
                    <span :class="['dist-level', `ql-${level}`]">{{ qualityLevelLabel[level] || level }}</span>
                    <span class="dist-count">{{ count }}</span>
                  </div>
                </div>
              </div>
              <div class="dist-section">
                <div class="dist-title">状态分布</div>
                <div class="dist-items">
                  <div v-for="(count, status) in summaryResult.statusDistribution" :key="status" class="dist-item">
                    <span class="dist-level">{{ statusLabel[status] || status }}</span>
                    <span class="dist-count">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="summary-tops">
              <div class="top-section">
                <div class="top-title">浏览量TOP10</div>
                <div v-for="(item, i) in summaryResult.topByViews" :key="i" class="top-item">
                  <span class="top-rank">{{ i + 1 }}</span>
                  <span class="top-name" :title="item.title">{{ item.title }}</span>
                  <span class="top-value">{{ formatNum(item.value) }}</span>
                </div>
              </div>
              <div class="top-section">
                <div class="top-title">点赞数TOP10</div>
                <div v-for="(item, i) in summaryResult.topByLikes" :key="i" class="top-item">
                  <span class="top-rank">{{ i + 1 }}</span>
                  <span class="top-name" :title="item.title">{{ item.title }}</span>
                  <span class="top-value">{{ formatNum(item.value) }}</span>
                </div>
              </div>
              <div class="top-section">
                <div class="top-title">热度TOP10</div>
                <div v-for="(item, i) in summaryResult.topByHotness" :key="i" class="top-item">
                  <span class="top-rank">{{ i + 1 }}</span>
                  <span class="top-name" :title="item.title">{{ item.title }}</span>
                  <span class="top-value">{{ Number(item.value).toFixed(0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <el-empty v-else description="请在数据筛选页选择作品后点击「批量汇总」" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="溯源校验" name="trace">
        <div class="card-wrapper">
          <div class="card-title">数据溯源校验</div>
          <el-empty v-if="!traceData" description="请在数据筛选页点击作品的「溯源校验」按钮" />
          <div v-else class="trace-content">
            <div class="trace-header">
              <span class="trace-title">{{ traceData.resource?.title }}</span>
              <span :class="['quality-level-tag', `ql-${traceData.resource?.qualityLevel}`]">
                <span class="level-bar" /><span>{{ qualityLevelLabel[traceData.resource?.qualityLevel] }}</span>
              </span>
            </div>

            <div class="trace-current">
              <div class="trace-stat"><div class="trace-stat-val">{{ formatNum(traceData.currentData.viewCount) }}</div><div class="trace-stat-label">浏览</div></div>
              <div class="trace-stat"><div class="trace-stat-val">{{ formatNum(traceData.currentData.likeCount) }}</div><div class="trace-stat-label">点赞</div></div>
              <div class="trace-stat"><div class="trace-stat-val">{{ formatNum(traceData.currentData.favoriteCount) }}</div><div class="trace-stat-label">收藏</div></div>
              <div class="trace-stat"><div class="trace-stat-val">{{ formatNum(traceData.currentData.shareCount) }}</div><div class="trace-stat-label">转发</div></div>
              <div class="trace-stat"><div class="trace-stat-val">{{ formatNum(traceData.currentData.commentCount) }}</div><div class="trace-stat-label">评论</div></div>
            </div>

            <div class="trace-summary">
              <div class="summary-row"><span>统计周期</span><span>{{ traceData.snapshotDays }}天</span></div>
              <div class="summary-row"><span>总增量·浏览</span><span class="num-highlight">{{ formatNum(traceData.totalIncrements.views) }}</span></div>
              <div class="summary-row"><span>总增量·点赞</span><span class="num-highlight">{{ formatNum(traceData.totalIncrements.likes) }}</span></div>
              <div class="summary-row"><span>日均·浏览</span><span>{{ traceData.avgDaily.views }}</span></div>
              <div class="summary-row"><span>日均·点赞</span><span>{{ traceData.avgDaily.likes }}</span></div>
              <div class="summary-row" v-if="traceData.peakDay"><span>峰值日</span><span>{{ traceData.peakDay.date }} (浏览+{{ formatNum(traceData.peakDay.viewIncrement) }})</span></div>
            </div>

            <div class="trace-integrity">
              <div class="section-title">数据完整性校验</div>
              <div v-if="traceData.integrityCheck.hasIssues" class="integrity-issues">
                <div v-for="(issue, i) in traceData.integrityCheck.issues" :key="i" class="issue-item">
                  <el-icon :class="['issue-icon', `sev-${issue.severity}`]"><Warning /></el-icon>
                  <span>{{ issue.description }}</span>
                </div>
              </div>
              <div v-else class="no-issue">数据完整性校验通过，评分 {{ traceData.integrityCheck.score }}</div>
            </div>

            <div class="trace-daily">
              <div class="section-title">每日增量明细</div>
              <el-table :data="traceData.dailyIncrements" stripe border size="small" max-height="300">
                <el-table-column prop="date" label="日期" width="110" align="center" />
                <el-table-column prop="viewIncrement" label="浏览+" width="80" align="center" />
                <el-table-column prop="likeIncrement" label="点赞+" width="70" align="center" />
                <el-table-column prop="favoriteIncrement" label="收藏+" width="70" align="center" />
                <el-table-column prop="shareIncrement" label="转发+" width="70" align="center" />
                <el-table-column prop="commentIncrement" label="评论+" width="70" align="center" />
                <el-table-column prop="hotnessScore" label="热度" width="80" align="center" />
                <el-table-column label="异常" width="60" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.isAnomaly" type="danger" size="small">!</el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="detailDialogVisible" title="作品数据复盘" width="600px" class="detail-dialog">
      <div v-if="detailData" class="detail-content">
        <div class="detail-header">
          <span class="detail-title">{{ detailData.resource?.title }}</span>
          <el-tag v-if="detailData.dataIntegrityStatus === 'abnormal'" type="danger" size="small" effect="dark">数据异常</el-tag>
          <el-tag v-else-if="detailData.dataIntegrityStatus === 'suspected'" type="warning" size="small">疑似异常</el-tag>
        </div>
        <div class="detail-data-cards">
          <div class="data-card">
            <div class="data-card-value">{{ formatNum(detailData.currentData.viewCount) }}</div><div class="data-card-label">浏览量</div>
          </div>
          <div class="data-card">
            <div class="data-card-value">{{ formatNum(detailData.currentData.likeCount) }}</div><div class="data-card-label">点赞数</div>
          </div>
          <div class="data-card">
            <div class="data-card-value">{{ formatNum(detailData.currentData.favoriteCount) }}</div><div class="data-card-label">收藏数</div>
          </div>
          <div class="data-card">
            <div class="data-card-value">{{ formatNum(detailData.currentData.shareCount) }}</div><div class="data-card-label">转发数</div>
          </div>
          <div class="data-card">
            <div class="data-card-value">{{ formatNum(detailData.currentData.commentCount) }}</div><div class="data-card-label">评论数</div>
          </div>
          <div class="data-card">
            <div class="data-card-value hotness">{{ Number(detailData.currentData.hotnessScore || 0).toFixed(0) }}</div><div class="data-card-label">热度评分</div>
          </div>
        </div>
        <div v-if="detailData.integrityCheck.hasIssues" class="detail-issues">
          <div class="section-title">数据异常</div>
          <div v-for="(issue, i) in detailData.integrityCheck.issues" :key="i" class="issue-item">
            <el-icon :class="['issue-icon', `sev-${issue.severity}`]"><Warning /></el-icon>
            <span>{{ issue.description }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, DataAnalysis, Warning } from '@element-plus/icons-vue'
import {
  getDataOverview,
  preValidateDataQuery,
  getDataResourceList,
  getResourceDataDetail,
  traceResourceData,
  batchSummaryData
} from '@/api/dataAnalytics'

const activeTab = ref('filter')
const overview = ref<any>(null)
const overviewLoading = ref(false)
const dataList = ref<any[]>([])
const listLoading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selected = ref<any[]>([])
const tableRef = ref<any>(null)
const filterErrors = ref<string[]>([])

const filterForm = reactive({
  keyword: '',
  fileType: '',
  qualityLevel: '',
  includeDeleted: false,
  includeHidden: false
})
const dateRange = ref<string[]>([])

const summaryResult = ref<any>(null)
const summaryLoading = ref(false)

const detailDialogVisible = ref(false)
const detailData = ref<any>(null)

const traceData = ref<any>(null)

const qualityLevelLabel: Record<string, string> = { excellent: '优质', good: '良好', normal: '普通', low_quality: '低质', violation: '违规' }
const statusLabel: Record<string, string> = { published: '已发布', approved: '已审核', pending: '待审核', rejected: '已拒绝', offline: '已下架', draft: '草稿' }

const formatNum = (num: any) => {
  if (num === undefined || num === null) return '0'
  return Number(num).toLocaleString('zh-CN')
}

const onFocus = (e: any) => {
  const el = e.target?.closest('.filter-input') || e.target?.closest('.el-input') || e.target?.closest('.el-select')
  if (el) el.classList.add('input-focused')
}

const onBlur = (e: any) => {
  const el = e.target?.closest('.filter-input') || e.target?.closest('.el-input') || e.target?.closest('.el-select')
  if (el) el.classList.remove('input-focused')
}

const rowClassName = ({ row }: any) => {
  if (row.dataIntegrityStatus === 'abnormal') return 'row-anomaly'
  if (row.dataIntegrityStatus === 'suspected') return 'row-suspected'
  return ''
}

const fetchOverview = async () => {
  overviewLoading.value = true
  try { overview.value = (await getDataOverview()).data } finally { overviewLoading.value = false }
}

const fetchDataList = async () => {
  listLoading.value = true
  filterErrors.value = []
  try {
    const params: any = {
      page: page.value, pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      fileType: filterForm.fileType || undefined,
      qualityLevel: filterForm.qualityLevel || undefined,
      includeDeleted: filterForm.includeDeleted,
      includeHidden: filterForm.includeHidden,
      sortBy: 'hotnessScore', sortOrder: 'desc'
    }
    if (dateRange.value?.length === 2) { params.startTime = dateRange.value[0]; params.endTime = dateRange.value[1] }

    const validateRes = await preValidateDataQuery(params)
    if (!validateRes.data.canQuery) {
      filterErrors.value = validateRes.data.errors
      listLoading.value = false; return
    }

    const res = await getDataResourceList(params)
    dataList.value = res.data.list; total.value = res.data.total
  } catch (e: any) {
    ElMessage.error(e?.message || '查询失败')
  } finally { listLoading.value = false }
}

const handleFilter = () => { page.value = 1; fetchDataList() }
const resetFilter = () => {
  filterForm.keyword = ''; filterForm.fileType = ''; filterForm.qualityLevel = ''
  filterForm.includeDeleted = false; filterForm.includeHidden = false; dateRange.value = []
  filterErrors.value = []; page.value = 1; fetchDataList()
}

const handleSelectionChange = (selection: any[]) => { selected.value = selection }

const handleBatchSummary = async () => {
  if (selected.value.length === 0) return
  summaryLoading.value = true
  try {
    const ids = selected.value.map(r => r.id)
    const res = await batchSummaryData(ids)
    summaryResult.value = res.data
    activeTab.value = 'summary'
    ElMessage.success('批量汇总完成')
  } catch (e: any) { ElMessage.error(e?.message || '汇总失败') }
  finally { summaryLoading.value = false }
}

const openDetailDialog = async (row: any) => {
  detailData.value = null; detailDialogVisible.value = true
  try { detailData.value = (await getResourceDataDetail(row.id)).data }
  catch (e: any) { ElMessage.error(e?.message || '获取详情失败') }
}

const openTraceDialog = async (row: any) => {
  try {
    const res = await traceResourceData(row.id, 30)
    traceData.value = res.data; activeTab.value = 'trace'
  } catch (e: any) { ElMessage.error(e?.message || '溯源校验失败') }
}

onMounted(() => { fetchOverview(); fetchDataList() })
</script>

<style scoped lang="scss">
.data-analytics-page { padding: 16px; }
.page-header { margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }

.card-wrapper { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.card-title { font-size: 16px; font-weight: 600; color: #303133; margin: 20px 0 16px; padding-left: 10px; border-left: 3px solid #409eff; }

.overview-cards { display: grid; grid-template-columns: repeat(7,1fr); gap: 12px; }
.overview-card { padding: 16px; border-radius: 8px; cursor: pointer; transition: all 0.3s; &:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); } }
.card-total { background: linear-gradient(135deg,#ecf5ff,#d9ecff); .overview-label{color:#409eff;} .overview-value{color:#2b85e4;} }
.card-views { background: linear-gradient(135deg,#e8f7ef,#d1efd9); .overview-label{color:#52c41a;} .overview-value{color:#389e0d;} }
.card-likes { background: linear-gradient(135deg,#fff0f6,#ffd6e7); .overview-label{color:#eb2f96;} .overview-value{color:#c41d7f;} }
.card-favorites { background: linear-gradient(135deg,#f9f0ff,#efdbff); .overview-label{color:#9254de;} .overview-value{color:#722ed1;} }
.card-shares { background: linear-gradient(135deg,#f0f5ff,#d6e4ff); .overview-label{color:#2f54eb;} .overview-value{color:#1d39c4;} }
.card-comments { background: linear-gradient(135deg,#fdf6ec,#faecd8); .overview-label{color:#e6a23c;} .overview-value{color:#b88230;} }
.card-anomaly { background: linear-gradient(135deg,#fef0f0,#fde2e2); .overview-label{color:#f56c6c;} .overview-value{color:#dd6161;} }

.anomaly-glow { animation: anomaly-blink 2s ease-in-out infinite; }
@keyframes anomaly-blink { 0%,100%{text-shadow:0 0 5px rgba(245,108,108,0.3);} 50%{text-shadow:0 0 15px rgba(245,108,108,0.8);} }

.overview-label { font-size: 12px; margin-bottom: 6px; font-weight: 500; }
.overview-value { font-size: 22px; font-weight: 700; line-height: 1.2; margin-bottom: 4px; }
.overview-desc { font-size: 11px; color: #909399; }

.filter-form { margin-bottom: 16px; transition: all 0.3s; &.has-error { animation: shake 0.4s ease; } }
@keyframes shake { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-5px);} 40%,80%{transform:translateX(5px);} }

:deep(.input-focused) { transform: scale(1.03); transition: transform 0.2s ease; box-shadow: 0 2px 8px rgba(64,158,255,0.2); }

.filter-errors { padding: 10px 16px; background: #fef0f0; border-radius: 6px; margin-bottom: 12px; animation: shake 0.4s ease; }
.error-item { font-size: 13px; color: #f56c6c; line-height: 1.8; }

.title-cell { display: flex; align-items: center; gap: 10px; }
.cover-thumb { width: 36px; height: 36px; border-radius: 4px; flex-shrink: 0; }
.title-text { font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.num-text { font-family: 'Courier New',monospace; font-size: 13px; }
.hotness-text { font-weight: 700; font-family: 'Courier New',monospace; color: #e6a23c; }
.text-muted { color: #c0c4cc; font-size: 12px; }

:deep(.row-anomaly) { background-color: #fef0f0 !important; }
:deep(.row-suspected) { background-color: #fdf6ec !important; }

.batch-btn { transition: all 0.3s; &:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(230,162,60,0.4); transform: translateY(-1px); } }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

.skeleton-card { padding: 16px; background: #f5f7fa; border-radius: 8px; }
.skeleton-line { height: 12px; background: linear-gradient(90deg,#f0f2f5 25%,#e8eaed 50%,#f0f2f5 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; border-radius: 4px; &.short{width:60%;} &.long{width:90%;} }
@keyframes skeleton-loading { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
.skeleton-overview { display: grid; grid-template-columns: repeat(7,1fr); gap: 12px; }

.quality-level-tag { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 500;
  &.ql-excellent{background:#e8f7ef;color:#389e0d; .level-bar{background:#52c41a;}}
  &.ql-good{background:#ecf5ff;color:#2b85e4; .level-bar{background:#409eff;}}
  &.ql-normal{background:#f0f0f0;color:#595959; .level-bar{background:#8c8c8c;}}
  &.ql-low_quality{background:#fdf6ec;color:#b88230; .level-bar{background:#e6a23c;}}
  &.ql-violation{background:#fef0f0;color:#dd6161; .level-bar{background:#f56c6c; animation: level-blink 1.5s infinite;}}
}
@keyframes level-blink { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
.level-bar { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

.summary-content { animation: fade-in 0.4s ease; }
@keyframes fade-in { 0%{opacity:0;transform:translateY(10px);} 100%{opacity:1;transform:translateY(0);} }

.summary-stats { display: grid; grid-template-columns: repeat(6,1fr); gap: 14px; margin-bottom: 20px; }
.stat-card { padding: 18px; background: #f5f7fa; border-radius: 8px; text-align: center; transition: all 0.3s; &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); } }
.stat-value { font-size: 24px; font-weight: 700; color: #409eff; margin-bottom: 6px; font-family: 'Courier New',monospace; }
.stat-label { font-size: 13px; color: #606266; }

.summary-averages { display: flex; gap: 24px; padding: 14px 20px; background: #fafafa; border-radius: 8px; margin-bottom: 20px; }
.avg-item { display: flex; align-items: center; gap: 8px; }
.avg-label { font-size: 13px; color: #909399; }
.avg-value { font-size: 15px; font-weight: 600; color: #303133; font-family: 'Courier New',monospace; &.anomaly{color:#f56c6c;} }

.summary-distribution { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.dist-section { padding: 14px; background: #f5f7fa; border-radius: 8px; }
.dist-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 10px; }
.dist-items { display: flex; flex-wrap: wrap; gap: 10px; }
.dist-item { display: flex; align-items: center; gap: 6px; }
.dist-level { font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #ecf5ff; color: #409eff; }
.dist-count { font-size: 14px; font-weight: 600; font-family: 'Courier New',monospace; }

.summary-tops { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.top-section { padding: 14px; background: #f5f7fa; border-radius: 8px; }
.top-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 10px; }
.top-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px dashed #ebeef5; &:last-child{border-bottom:none;} }
.top-rank { width: 20px; height: 20px; border-radius: 50%; background: #409eff; color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.top-name { font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.top-value { font-size: 13px; font-weight: 600; color: #e6a23c; font-family: 'Courier New',monospace; flex-shrink: 0; }

.trace-content { padding: 4px 0; }
.trace-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #ebeef5; }
.trace-title { font-size: 16px; font-weight: 600; color: #303133; }

.trace-current { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; margin-bottom: 20px; }
.trace-stat { padding: 14px; background: linear-gradient(135deg,#f5f7fa,#e9ecef); border-radius: 8px; text-align: center; }
.trace-stat-val { font-size: 22px; font-weight: 700; color: #409eff; font-family: 'Courier New',monospace; }
.trace-stat-label { font-size: 12px; color: #606266; margin-top: 6px; }

.trace-summary { padding: 14px 20px; background: #fafafa; border-radius: 8px; margin-bottom: 20px; }
.summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #606266; border-bottom: 1px dashed #ebeef5; &:last-child{border-bottom:none;} }
.num-highlight { font-weight: 600; color: #409eff; font-family: 'Courier New',monospace; }

.trace-integrity { margin-bottom: 20px; }
.section-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 10px; }
.integrity-issues { display: flex; flex-direction: column; gap: 8px; }
.issue-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #fef6f6; border-radius: 6px; font-size: 13px; color: #606266; }
.issue-icon { font-size: 16px; &.sev-high{color:#f56c6c;} &.sev-medium{color:#e6a23c;} &.sev-low{color:#909399;} }
.no-issue { padding: 12px; background: #f0f9eb; border-radius: 6px; font-size: 13px; color: #67c23a; }

.trace-daily { margin-bottom: 20px; }

.detail-dialog { :deep(.el-dialog){border-radius:12px; animation: dialog-scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1);} }
@keyframes dialog-scale-in { 0%{opacity:0;transform:scale(0.9) translateY(-20px);} 100%{opacity:1;transform:scale(1) translateY(0);} }

.detail-content { padding: 4px 0; }
.detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #ebeef5; }
.detail-title { font-size: 15px; font-weight: 600; color: #303133; }

.detail-data-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 18px; }
.data-card { padding: 16px; background: #f5f7fa; border-radius: 8px; text-align: center; transition: all 0.3s; cursor: default; &:hover { transform: scale(1.06); box-shadow: 0 6px 18px rgba(0,0,0,0.1); } }
.data-card-value { font-size: 24px; font-weight: 700; color: #409eff; font-family: 'Courier New',monospace; &.hotness{color:#e6a23c;} }
.data-card-label { font-size: 12px; color: #606266; margin-top: 6px; }

.detail-issues { margin-top: 16px; }

@media screen and (max-width:1400px) { .overview-cards,.skeleton-overview{grid-template-columns:repeat(4,1fr);} }
</style>
