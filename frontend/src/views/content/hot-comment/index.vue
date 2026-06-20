<template>
  <div class="hot-comment-page">
    <el-row :gutter="14" class="stats-row">
      <el-col :span="3" v-for="card in statCards" :key="card.key">
        <el-card shadow="hover" class="stat-card" :class="`stat-${card.type}`">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.value }}</div>
          <div v-if="card.suffix" class="stat-suffix">{{ card.suffix }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="anomaly-row" v-if="anomalyData && (anomalyData.suspicious.length || anomalyData.noteSuspicious.length || anomalyData.rankHops.length)">
      <el-col :span="24">
        <el-alert type="warning" show-icon :closable="false" class="anomaly-alert">
          <template #title>
            <div class="anomaly-header">异常刷榜检测：</div>
            <div class="anomaly-badges">
              <el-badge v-if="anomalyData.suspicious.length" type="danger" :value="anomalyData.suspicious.length" :max="99" class="anomaly-badge">
                <el-tag size="small" effect="plain" type="danger">管理员频繁置顶</el-tag>
              </el-badge>
              <el-badge v-if="anomalyData.noteSuspicious.length" type="warning" :value="anomalyData.noteSuspicious.length" :max="99" class="anomaly-badge">
                <el-tag size="small" effect="plain" type="warning">同笔记密集置顶</el-tag>
              </el-badge>
              <el-badge v-if="anomalyData.rankHops.length" type="danger" :value="anomalyData.rankHops.length" :max="99" class="anomaly-badge">
                <el-tag size="small" effect="plain" type="danger">排名异常跳变</el-tag>
              </el-badge>
            </div>
            <div class="anomaly-list">
              <div v-for="(s, i) in anomalyData.suspicious" :key="'s'+i" class="anomaly-item">
                ⚠️ 管理员 <strong>{{ s.handlerName || s.handlerId }}</strong> 24h 内人工置顶 <strong class="danger-text">{{ s.count }}</strong> 次
              </div>
              <div v-for="(n, i) in anomalyData.noteSuspicious" :key="'n'+i" class="anomaly-item">
                ⚠️ 笔记 #<strong>{{ n.noteId }}</strong> 人工置顶 <strong class="danger-text">{{ n.manualTopCount }}</strong> 条
              </div>
              <div v-for="(r, i) in anomalyData.rankHops.slice(0, 5)" :key="'r'+i" class="anomaly-item">
                ⚠️ 评论 #<strong>{{ r.commentId }}</strong> 排名 {{ r.hop }} 跳变 <strong class="danger-text">{{ r.diff }}</strong> 位
              </div>
            </div>
          </template>
        </el-alert>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="main-tabs" @tab-change="onTabChange">
      <el-tab-pane label="热门榜单" name="rank">
        <el-card shadow="never" class="filter-card">
          <el-form :inline="true" :model="filter" class="filter-form" @submit.prevent>
            <el-form-item label="笔记ID">
              <el-input v-model="filter.noteId" placeholder="按笔记过滤" clearable style="width: 140px" />
            </el-form-item>
            <el-form-item label="搜索">
              <el-input v-model="filter.keyword" placeholder="搜索内容/用户" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="置顶">
              <el-select v-model="filter.isTop" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="(n, v) in isTopNames" :key="v" :label="n" :value="Number(v)" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filter.status" placeholder="全部" clearable style="width: 130px">
                <el-option v-for="(n, v) in statusNames" :key="v" :label="n" :value="Number(v)" />
              </el-select>
            </el-form-item>
            <el-form-item label="来源">
              <el-select v-model="filter.sourceType" placeholder="全部" clearable style="width: 120px">
                <el-option v-for="(n, v) in sourceNames" :key="v" :label="n" :value="v" />
              </el-select>
            </el-form-item>
            <el-form-item label="排名区间">
              <el-input-number v-model="filter.rankFrom" :min="1" :max="999" style="width: 90px" controls-position="right" />
              <span class="range-sep">~</span>
              <el-input-number v-model="filter.rankTo" :min="1" :max="999" style="width: 90px" controls-position="right" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadList">搜索</el-button>
              <el-button :icon="RefreshRight" @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="table-card">
          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-button type="primary" :icon="Refresh" @click="onRefreshRanking" :loading="rankLoading">重新刷新榜单</el-button>
              <el-button type="warning" :icon="Top" :disabled="selected.length===0" :loading="batchTopLoading" @click="onBatchTop">
                批量置顶 ({{ selected.length }})
              </el-button>
              <el-button type="success" :icon="Close" :disabled="selected.length===0" :loading="batchCancelLoading" @click="onBatchCancelTop">批量取消置顶</el-button>
              <el-button type="danger" :icon="Delete" :disabled="selected.length===0" :loading="batchOffLoading" @click="onBatchOff">批量下架</el-button>
            </div>
            <div class="toolbar-right">
              <el-tag type="info">共 {{ total }} 条榜单记录</el-tag>
            </div>
          </div>

          <div v-if="loading" class="skeleton-wrapper">
            <el-skeleton :rows="8" animated />
          </div>
          <div v-else>
            <el-table
              ref="tableRef"
              :data="list"
              class="rank-table striped-table"
              :row-class-name="rowClassName"
              @selection-change="onSelectionChange"
              @row-dblclick="onRowDblClick"
              v-loading="loading"
            >
              <el-table-column type="selection" width="50" reserve-selection />
              <el-table-column label="排名" width="80" align="center" fixed="left">
                <template #default="{ row }">
                  <transition name="rank-pop">
                    <div class="rank-num" :class="rankClass(row.rank)">
                      <span v-if="row.rank <= 3" class="rank-crown">{{ crownIcon(row.rank) }}</span>
                      <span v-else>NO.{{ row.rank }}</span>
                    </div>
                  </transition>
                </template>
              </el-table-column>
              <el-table-column label="置顶" width="90" align="center">
                <template #default="{ row }">
                  <transition name="fade-status">
                    <el-tag
                      v-if="row.isTop > 0"
                      :color="isTopColors[row.isTop]"
                      effect="dark"
                      size="small"
                      class="top-tag"
                      :class="{ 'top-glow': row.isTop === 2 }"
                    >
                      {{ isTopNames[row.isTop] }}{{ row.topOrder ? `#${row.topOrder}` : '' }}
                    </el-tag>
                    <span v-else class="text-gray">-</span>
                  </transition>
                </template>
              </el-table-column>
              <el-table-column label="用户" width="160">
                <template #default="{ row }">
                  <div class="user-cell">
                    <el-avatar :size="28" :src="row.avatar">{{ row.nickname.charAt(0) }}</el-avatar>
                    <div class="user-info">
                      <div class="user-name">{{ row.nickname }}</div>
                      <div class="user-id">ID:{{ row.userId }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="评论内容" min-width="260" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="content-cell" :class="{
                    'content-conflict': row.status === 3,
                    'content-low-quality': (row.qualityScore ?? 100) < 50
                  }">
                    <span>{{ row.content }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="点赞" width="70" align="center" prop="likeCount" />
              <el-table-column label="回复" width="70" align="center" prop="replyCount" />
              <el-table-column label="质量" width="80" align="center">
                <template #default="{ row }">
                  <span :class="{ 'danger-text': row.qualityScore < 50, 'quality-text': row.qualityScore >= 80 }">
                    {{ Number(row.qualityScore).toFixed(0) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="热度分" width="80" align="center">
                <template #default="{ row }">
                  <strong>{{ Number(row.hotScore).toFixed(1) }}</strong>
                </template>
              </el-table-column>
              <el-table-column label="权重拆解" min-width="300">
                <template #default="{ row }">
                  <div class="weight-bars" @click="onWeightAlert(row)">
                    <div class="weight-bar-item" v-for="(w, k) in weightBreakdown(row)" :key="k" :title="`${k}: ${w.score}`">
                      <div class="weight-bar-wrap">
                        <div class="weight-bar-fill" :style="{ width: w.pct + '%', background: w.color }"></div>
                      </div>
                      <span class="weight-bar-label">{{ w.label }} {{ w.score }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="笔记ID" width="90" align="center" prop="noteId" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <transition name="fade-status">
                    <el-tag :type="statusTagTypes[row.status]" size="small" effect="light">
                      {{ statusNames[row.status] }}
                    </el-tag>
                  </transition>
                </template>
              </el-table-column>
              <el-table-column label="置顶人" width="100">
                <template #default="{ row }">
                  <span v-if="row.topHandlerName" class="handler-text">{{ row.topHandlerName }}</span>
                  <span v-else class="text-gray">-</span>
                </template>
              </el-table-column>
              <el-table-column label="刷新时间" width="160">
                <template #default="{ row }">{{ formatTime(row.lastRefreshTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="onViewTrace(row)">运维日志</el-button>
                  <el-button
                    link
                    :type="row.isTop === 2 ? 'success' : 'warning'"
                    @click="onToggleTop(row)"
                  >{{ row.isTop === 2 ? '取消置顶' : '置顶' }}</el-button>
                  <el-button link type="danger" @click="onOffRow(row)">下架</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              class="table-pager"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              :current-page="page"
              :page-size="pageSize"
              :page-sizes="[20, 50, 100]"
              @current-change="p => { page = p; loadList() }"
              @size-change="s => { pageSize = s; page = 1; loadList() }"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="操作日志" name="logs">
        <el-card shadow="never">
          <div class="log-toolbar">
            <el-input v-model="logFilter.commentId" placeholder="评论ID" clearable style="width: 160px" />
            <el-select v-model="logFilter.action" placeholder="操作类型" clearable style="width: 160px">
              <el-option v-for="(n, v) in logActionNames" :key="v" :label="n" :value="Number(v)" />
            </el-select>
            <el-button type="primary" @click="loadLogs">搜索</el-button>
          </div>
          <el-table :data="logsList" class="logs-table" size="small" v-loading="logsLoading">
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="110">
              <template #default="{ row }">
                <el-tag size="small" :type="logActionTagType(row.action)">{{ row.actionName || logActionNames[row.action] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="评论ID" width="90" prop="commentId" align="center" />
            <el-table-column label="状态变化" width="120">
              <template #default="{ row }">
                <span v-if="row.beforeStatus !== null && row.afterStatus !== null">
                  {{ statusNames[row.beforeStatus] }} → <strong :class="row.afterStatus === 1 ? 'text-green' : 'text-gray'">{{ statusNames[row.afterStatus] }}</strong>
                </span>
                <span v-else class="text-gray">-</span>
              </template>
            </el-table-column>
            <el-table-column label="置顶变化" width="120">
              <template #default="{ row }">
                <span v-if="row.beforeIsTop !== null && row.afterIsTop !== null">
                  {{ isTopNames[row.beforeIsTop] }} →
                  <strong :class="row.afterIsTop === 2 ? 'warn-text' : 'text-green'">{{ isTopNames[row.afterIsTop] }}</strong>
                </span>
                <span v-else class="text-gray">-</span>
              </template>
            </el-table-column>
            <el-table-column label="排名变化" width="110">
              <template #default="{ row }">
                <span v-if="row.beforeRank && row.afterRank">
                  #{{ row.beforeRank }} → #<strong>{{ row.afterRank }}</strong>
                </span>
                <span v-else class="text-gray">-</span>
              </template>
            </el-table-column>
            <el-table-column label="热度变化" width="150">
              <template #default="{ row }">
                <span v-if="row.beforeHotScore !== null && row.afterHotScore !== null">
                  {{ Number(row.beforeHotScore).toFixed(1) }} →
                  <strong :class="row.afterHotScore > row.beforeHotScore ? 'text-green' : (row.afterHotScore < row.beforeHotScore ? 'danger-text' : '')">
                    {{ Number(row.afterHotScore).toFixed(1) }}
                  </strong>
                </span>
                <span v-else class="text-gray">-</span>
              </template>
            </el-table-column>
            <el-table-column label="质量分" width="80" align="center">
              <template #default="{ row }">
                <span v-if="row.qualityScore !== null">{{ Number(row.qualityScore).toFixed(0) }}</span>
                <span v-else class="text-gray">-</span>
              </template>
            </el-table-column>
            <el-table-column label="冲突原因" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.conflictReason" class="danger-text">{{ row.conflictReason }}</span>
                <span v-else-if="row.anomalyReason" class="warn-text">{{ row.anomalyReason }}</span>
                <span v-else class="text-gray">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作人" width="100" prop="handlerName" />
            <el-table-column label="备注" min-width="140" show-overflow-tooltip prop="handleNote" />
          </el-table>
          <el-pagination
            class="table-pager"
            layout="total, sizes, prev, pager, next"
            :total="logsTotal"
            :current-page="logsPage"
            :page-size="logsPageSize"
            :page-sizes="[20, 50, 100]"
            @current-change="p => { logsPage = p; loadLogs() }"
            @size-change="s => { logsPageSize = s; logsPage = 1; loadLogs() }"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 权重异常弹窗 -->
    <el-dialog v-model="weightAlertVisible" title="权重计算详情" width="460px" class="weight-alert-dialog">
      <div v-if="weightAlertRow" class="weight-alert-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="评论ID">{{ weightAlertRow.commentId }}</el-descriptions-item>
          <el-descriptions-item label="当前排名">NO.{{ weightAlertRow.rank }}</el-descriptions-item>
          <el-descriptions-item label="总热度分" :span="2">
            <strong style="color:#409eff">{{ Number(weightAlertRow.hotScore).toFixed(2) }}</strong>
          </el-descriptions-item>
        </el-descriptions>
        <div class="weight-detail-list">
          <div v-for="(w, k) in weightBreakdown(weightAlertRow)" :key="k" class="weight-detail-row">
            <div class="wd-head">
              <span class="wd-label" :style="{ color: w.color }">{{ w.label }}</span>
              <span class="wd-score">{{ w.score }}</span>
            </div>
            <div class="wd-bar">
              <div class="wd-fill" :style="{ width: w.pct + '%', background: w.color }"></div>
            </div>
          </div>
        </div>
        <el-alert v-if="weightAlertRow.conflictReason" type="error" :closable="false" show-icon :title="weightAlertRow.conflictReason" class="mt-10" />
      </div>
    </el-dialog>

    <!-- 运维日志溯源弹窗 -->
    <el-dialog v-model="traceVisible" :title="`热门评论运维溯源 - #${traceCommentId}`" width="900px" destroy-on-close>
      <div v-if="traceData" class="trace-content" v-loading="traceLoading">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="评论ID">{{ traceCommentId }}</el-descriptions-item>
          <el-descriptions-item label="排名">NO.{{ traceData.hot?.rank || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagTypes[traceData.hot?.status || 0]" size="small">
              {{ statusNames[traceData.hot?.status || 0] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="评论内容" :span="3">
            <div class="trace-content-text">{{ traceData.comment?.content }}</div>
          </el-descriptions-item>
        </el-descriptions>
        <el-row :gutter="12" class="trace-rows">
          <el-col :span="8">
            <el-card shadow="never" class="trace-mini">
              <template #header>评论作者</template>
              <div class="trace-user-row"><span>昵称：</span><strong>{{ traceData.user?.nickname || '-' }}</strong></div>
              <div class="trace-user-row"><span>账号：</span>{{ traceData.user?.username || '-' }}</div>
              <div class="trace-user-row"><span>风险：</span>
                <el-tag v-if="traceData.user" :color="anomalyLevelColors[traceData.user.riskLevel || 0]" effect="dark" size="small">
                  {{ anomalyLevelNames[traceData.user.riskLevel || 0] }}
                </el-tag>
              </div>
              <div class="trace-user-row"><span>违规数：</span><strong :class="{ 'danger-text': (traceData.user?.violationCount || 0) >= 3 }">{{ traceData.user?.violationCount || 0 }}</strong></div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="trace-mini">
              <template #header>热门数据</template>
              <div class="trace-user-row"><span>热度：</span><strong class="text-blue">{{ Number(traceData.hot?.hotScore || 0).toFixed(2) }}</strong></div>
              <div class="trace-user-row"><span>质量：</span>{{ Number(traceData.hot?.qualityScore || 0).toFixed(0) }}</div>
              <div class="trace-user-row"><span>置顶：</span>{{ isTopNames[traceData.hot?.isTop || 0] }}</div>
              <div class="trace-user-row"><span>置顶人：</span>{{ traceData.hot?.topHandler || '-' }}</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="trace-mini">
              <template #header>
                操作统计 <el-tag size="small" :type="traceData.risks.length ? 'danger' : 'success'">{{ traceData.risks.length }}个风险</el-tag>
              </template>
              <div class="trace-user-row"><span>总操作数：</span>{{ traceData.operations.totalOps }}</div>
              <div class="trace-user-row"><span>置顶次数：</span><strong class="warn-text">{{ traceData.operations.topOps }}</strong></div>
              <div class="trace-user-row"><span>取消置顶：</span>{{ traceData.operations.cancelOps }}</div>
              <div class="trace-user-row"><span>下架次数：</span>{{ traceData.operations.offOps }}</div>
            </el-card>
          </el-col>
        </el-row>
        <el-card shadow="never" class="trace-mini" v-if="traceData.risks.length">
          <template #header><span class="danger-text">风险提示</span></template>
          <div v-for="(r, i) in traceData.risks" :key="i" class="risk-row">
            <el-icon color="#f56c6c"><WarningFilled /></el-icon>
            <span>{{ r }}</span>
          </div>
        </el-card>
        <el-card shadow="never" class="trace-mini">
          <template #header>运维操作轨迹 ({{ traceData.logs.length }})</template>
          <el-timeline>
            <el-timeline-item
              v-for="log in traceData.logs"
              :key="log.id"
              :timestamp="formatTime(log.createTime)"
              placement="top"
            >
              <div class="trace-log-item">
                <el-tag size="small" :type="logActionTagType(log.action)">{{ log.actionName }}</el-tag>
                <span v-if="log.beforeIsTop !== log.afterIsTop" class="log-diff">
                  置顶：{{ isTopNames[log.beforeIsTop] }} → {{ isTopNames[log.afterIsTop] }}
                </span>
                <span v-if="log.beforeRank !== log.afterRank" class="log-diff">
                  排名：#{{ log.beforeRank }} → #{{ log.afterRank }}
                </span>
                <span v-if="log.handler" class="log-handler">{{ log.handler }}</span>
                <span v-if="log.note">{{ log.note }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Search, RefreshRight, Refresh, Delete, Top, Close, WarningFilled
} from '@element-plus/icons-vue'
import type { ElTable } from 'element-plus'
import type {
  HotCommentItem, HotCommentStats, HotCommentLogItem,
  HotCommentTraceResult, HotCommentAnomalyResult
} from '@/types/business'
import {
  HOT_COMMENT_IS_TOP_NAMES, HOT_COMMENT_IS_TOP_COLORS,
  HOT_COMMENT_STATUS_NAMES, HOT_COMMENT_STATUS_TAG_TYPES,
  HOT_COMMENT_SOURCE_NAMES, HOT_COMMENT_LOG_ACTION_NAMES,
  INTERACTION_ANOMALY_LEVEL_NAMES, INTERACTION_ANOMALY_LEVEL_COLORS
} from '@/enums/business'
import {
  getHotCommentStats, getHotCommentList, refreshHotCommentRanking,
  manualTopHotComment, cancelTopHotComment, batchTopHotComment, batchOffHotComment,
  getHotCommentTrace, getHotCommentLogs, hotCommentAnomalyDetect
} from '@/api/hot-comment'

const activeTab = ref('rank')
const tableRef = ref<InstanceType<typeof ElTable>>()

const isTopNames = HOT_COMMENT_IS_TOP_NAMES
const isTopColors = HOT_COMMENT_IS_TOP_COLORS
const statusNames = HOT_COMMENT_STATUS_NAMES
const statusTagTypes = HOT_COMMENT_STATUS_TAG_TYPES
const sourceNames = HOT_COMMENT_SOURCE_NAMES
const logActionNames = HOT_COMMENT_LOG_ACTION_NAMES
const anomalyLevelNames = INTERACTION_ANOMALY_LEVEL_NAMES
const anomalyLevelColors = INTERACTION_ANOMALY_LEVEL_COLORS

const stats = ref<HotCommentStats>({
  total: 0, active: 0, top: 0, manualTop: 0, autoTop: 0,
  conflicted: 0, offShelf: 0, todayLogs: 0, avgHot: '0', notesCount: 0
})
const statCards = computed(() => [
  { key: 'total', label: '榜单数据量', value: stats.value.total, type: 'total', suffix: '条' },
  { key: 'active', label: '正常上榜', value: stats.value.active, type: 'active', suffix: '条' },
  { key: 'top', label: '置顶总数', value: stats.value.top, type: 'top', suffix: '条' },
  { key: 'manual', label: '人工置顶', value: stats.value.manualTop, type: 'manual', suffix: '条' },
  { key: 'auto', label: '系统置顶', value: stats.value.autoTop, type: 'auto', suffix: '条' },
  { key: 'conflict', label: '冲突拦截', value: stats.value.conflicted, type: 'conflict', suffix: '条' },
  { key: 'off', label: '已下架', value: stats.value.offShelf, type: 'off', suffix: '条' },
  { key: 'avg', label: '平均热度', value: stats.value.avgHot, type: 'avg', suffix: `覆盖${stats.value.notesCount}笔记` }
])

const anomalyData = ref<HotCommentAnomalyResult | null>(null)

const list = ref<HotCommentItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const rankLoading = ref(false)
const batchTopLoading = ref(false)
const batchCancelLoading = ref(false)
const batchOffLoading = ref(false)
const selected = ref<HotCommentItem[]>([])

const filter = reactive({
  noteId: '', keyword: '', isTop: undefined as number | undefined,
  status: undefined as number | undefined, sourceType: '',
  rankFrom: 1, rankTo: 500
})

const logsList = ref<HotCommentLogItem[]>([])
const logsTotal = ref(0)
const logsPage = ref(1)
const logsPageSize = ref(20)
const logsLoading = ref(false)
const logFilter = reactive({ commentId: '', action: undefined as number | undefined })

const weightAlertVisible = ref(false)
const weightAlertRow = ref<HotCommentItem | null>(null)

const traceVisible = ref(false)
const traceCommentId = ref<number | null>(null)
const traceData = ref<HotCommentTraceResult | null>(null)
const traceLoading = ref(false)

function formatTime(t: string | Date | undefined) {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function crownIcon(r: number) { return ['🥇', '🥈', '🥉'][r - 1] || `NO.${r}` }
function rankClass(r: number) {
  if (r === 1) return 'rank-gold'
  if (r === 2) return 'rank-silver'
  if (r === 3) return 'rank-bronze'
  return ''
}

function weightBreakdown(row: HotCommentItem) {
  const { weightLike, weightReply, weightTime, weightQuality } = row
  const items = [
    { label: '点赞权重', score: Number(weightLike).toFixed(2), color: '#409eff', pct: 0 },
    { label: '回复权重', score: Number(weightReply).toFixed(2), color: '#67c23a', pct: 0 },
    { label: '时间权重', score: Number(weightTime).toFixed(2), color: '#e6a23c', pct: 0 },
    { label: '质量权重', score: Number(weightQuality).toFixed(2), color: '#8e44ad', pct: 0 }
  ]
  const max = Math.max(weightLike, weightReply, weightTime, weightQuality, 0.01)
  return {
    like: { ...items[0], pct: Number((weightLike / max * 100).toFixed(0)) },
    reply: { ...items[1], pct: Number((weightReply / max * 100).toFixed(0)) },
    time: { ...items[2], pct: Number((weightTime / max * 100).toFixed(0)) },
    quality: { ...items[3], pct: Number((weightQuality / max * 100).toFixed(0)) }
  }
}

function rowClassName({ row }: { row: HotCommentItem }) {
  const cls: string[] = []
  if (row.status === 3) cls.push('row-conflict')
  if (row.isTop === 2) cls.push('row-manual-top')
  if (row.isTop === 1) cls.push('row-auto-top')
  if ((row.qualityScore || 0) < 50) cls.push('row-low-quality')
  return cls.join(' ')
}

function logActionTagType(a: number) {
  if (a === 0 || a === 1 || a === 7) return 'info'
  if (a === 2 || a === 5) return 'warning'
  if (a === 4 || a === 6 || a === 8 || a === 9) return 'danger'
  if (a === 3) return 'success'
  return ''
}

async function loadAll() { await Promise.all([loadStats(), loadAnomaly()]) }
async function loadStats() { try { stats.value = await getHotCommentStats() } catch { /* ignore */ } }
async function loadAnomaly() { try { anomalyData.value = await hotCommentAnomalyDetect() } catch { /* ignore */ } }

async function loadList() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, pageSize: pageSize.value }
    if (filter.noteId) params.noteId = Number(filter.noteId)
    if (filter.keyword) params.keyword = filter.keyword
    if (filter.isTop !== undefined) params.isTop = filter.isTop
    if (filter.status !== undefined) params.status = filter.status
    if (filter.sourceType) params.sourceType = filter.sourceType
    if (filter.rankFrom && filter.rankTo) { params.rankFrom = filter.rankFrom; params.rankTo = filter.rankTo }
    const res = await getHotCommentList(params)
    list.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}

function resetFilter() {
  Object.assign(filter, { noteId: '', keyword: '', isTop: undefined, status: undefined, sourceType: '', rankFrom: 1, rankTo: 500 })
  page.value = 1; loadList()
}

async function loadLogs() {
  logsLoading.value = true
  try {
    const params: Record<string, unknown> = { page: logsPage.value, pageSize: logsPageSize.value }
    if (logFilter.commentId) params.commentId = Number(logFilter.commentId)
    if (logFilter.action !== undefined) params.action = logFilter.action
    const res = await getHotCommentLogs(params)
    logsList.value = res.list
    logsTotal.value = res.total
  } finally { logsLoading.value = false }
}

function onTabChange() {
  loadAll()
  if (activeTab.value === 'logs' && logsList.value.length === 0) loadLogs()
}

function onSelectionChange(rows: HotCommentItem[]) { selected.value = rows }

async function onRefreshRanking() {
  try {
    await ElMessageBox.confirm('确认重新刷新整个热门榜单？将重新计算所有权重并排序', '刷新榜单', { type: 'warning' })
    rankLoading.value = true
    const r = await refreshHotCommentRanking()
    ElMessage.success(`刷新完成，新上榜${r.total}条`)
    loadList(); loadAll()
    ElNotification({ title: '榜单已刷新', message: `共更新 ${r.total} 条热门记录`, type: 'success', duration: 3000 })
  } catch { /* cancelled */ }
  finally { rankLoading.value = false }
}

async function onToggleTop(row: HotCommentItem) {
  try {
    if (row.isTop === 2) {
      await ElMessageBox.confirm(`确认取消评论#${row.commentId}的人工置顶？将回归常规排序`, '取消置顶', { type: 'warning' })
      const r = await cancelTopHotComment([row.id])
      ElMessage.success(`取消置顶 ${r.success}/${r.total} 条`)
    } else {
      await ElMessageBox.confirm(`确认将评论#${row.commentId}人工置顶？置顶后优先级高于系统排序`, '人工置顶', { type: 'warning' })
      const r = await manualTopHotComment([row.id])
      if (r.success === 0) {
        ElMessageBox.alert('置顶失败，可能是该评论状态异常或风险过高，请查看溯源日志', '置顶拦截', { type: 'error' })
      } else {
        ElMessage.success(`置顶成功 ${r.success}/${r.total} 条`)
      }
    }
    loadList(); loadAll()
  } catch { /* cancelled */ }
}

async function onOffRow(row: HotCommentItem) {
  try {
    await ElMessageBox.confirm(`确认下架评论#${row.commentId}？操作后会自动补位优质评论`, '下架评论', { type: 'error' })
    const r = await batchOffHotComment([row.id])
    ElMessage.success(`下架成功 ${r.success}/${r.total} 条，已自动补位`)
    loadList(); loadAll()
  } catch { /* cancelled */ }
}

async function onBatchTop() {
  if (selected.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `⚠️ 二次确认：批量置顶 ${selected.value.length} 条热门评论？\n人工置顶优先级高于系统自动排序，且系统将自动检测是否异常`,
      '批量置顶-二次确认',
      { type: 'warning', distinguishCancelAndClose: true }
    )
    batchTopLoading.value = true
    const r = await batchTopHotComment(selected.value.map(i => i.id))
    ElMessage.success(`批量置顶完成：成功${r.success}，失败${r.total - r.success}`)
    tableRef.value?.clearSelection()
    loadList(); loadAll()
  } catch { /* cancelled */ }
  finally { batchTopLoading.value = false }
}

async function onBatchCancelTop() {
  if (selected.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `二次确认：批量取消 ${selected.value.length} 条置顶？`,
      '批量取消置顶', { type: 'warning', distinguishCancelAndClose: true }
    )
    batchCancelLoading.value = true
    const ids = selected.value.filter(i => i.isTop === 2).map(i => i.id)
    if (ids.length === 0) { ElMessage.warning('选择项中没有已人工置顶的评论'); return }
    const r = await cancelTopHotComment(ids)
    ElMessage.success(`取消${r.success}条`)
    tableRef.value?.clearSelection()
    loadList(); loadAll()
  } catch { /* cancelled */ }
  finally { batchCancelLoading.value = false }
}

async function onBatchOff() {
  if (selected.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `⚠️ 二次确认：批量下架 ${selected.value.length} 条热门评论？\n下架后将自动补位新的优质评论`,
      '批量下架-二次确认', { type: 'error', distinguishCancelAndClose: true }
    )
    batchOffLoading.value = true
    const r = await batchOffHotComment(selected.value.map(i => i.id))
    ElMessage.success(`下架${r.success}条，已自动补位`)
    tableRef.value?.clearSelection()
    loadList(); loadAll()
  } catch { /* cancelled */ }
  finally { batchOffLoading.value = false }
}

function onWeightAlert(row: HotCommentItem) {
  weightAlertRow.value = row
  weightAlertVisible.value = true
}

async function onViewTrace(row: HotCommentItem) {
  traceCommentId.value = row.commentId
  traceVisible.value = true
  traceData.value = null
  traceLoading.value = true
  try { traceData.value = await getHotCommentTrace(row.commentId) }
  catch (e: any) { ElMessage.error(e?.message || '加载失败') }
  finally { traceLoading.value = false }
}

function onRowDblClick(row: HotCommentItem) { onViewTrace(row) }

onMounted(() => {
  loadAll()
  loadList()
})
</script>

<style lang="scss" scoped>
.hot-comment-page {
  padding: 16px 20px 24px;

  .stats-row { margin-bottom: 14px; }
  .stat-card {
    border-radius: 10px; transition: all 0.3s ease;
    .stat-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
    .stat-value { font-size: 24px; font-weight: 700; color: #303133; }
    .stat-suffix { font-size: 11px; color: #909399; margin-top: 2px; }
    &.stat-total .stat-value { color: #409eff; }
    &.stat-active .stat-value { color: #67c23a; }
    &.stat-top .stat-value { color: #e6a23c; }
    &.stat-manual .stat-value { color: #d35400; }
    &.stat-auto .stat-value { color: #2980b9; }
    &.stat-conflict .stat-value { color: #c45656; }
    &.stat-off .stat-value { color: #909399; }
    &.stat-avg .stat-value { color: #8e44ad; }
    &:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
  }

  .anomaly-row { margin-bottom: 14px; }
  .anomaly-alert {
    .anomaly-header { font-weight: 600; margin-bottom: 8px; }
    .anomaly-badges { display: flex; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
    .anomaly-badge { margin-right: 0; }
    .anomaly-list { display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px; }
    .anomaly-item { background: #fff; padding: 4px 10px; border-radius: 4px; border: 1px solid #e3f2fd; }
  }

  .filter-card, .table-card { margin-bottom: 14px; }
  .filter-form { margin: 0; .range-sep { margin: 0 6px; } }

  .table-toolbar {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    .toolbar-left > * { margin-right: 8px; }
  }
  .skeleton-wrapper { padding: 0 10px; }
  .striped-table {
    :deep(.el-table__row:nth-child(even) > td) { background-color: #fafbfc; }
  }

  .rank-table {
    .rank-num {
      font-weight: 700; font-size: 14px;
      &.rank-gold { color: #e6a23c; }
      &.rank-silver { color: #95a5a6; }
      &.rank-bronze { color: #cd6133; }
    }
    .rank-crown { font-size: 18px; }
    .top-tag {
      transition: all 0.3s ease;
      &.top-glow {
        animation: top-glow-anim 1.8s ease-in-out infinite;
      }
    }
    .user-cell {
      display: flex; align-items: center; gap: 8px;
      .user-name { font-size: 13px; font-weight: 500; }
      .user-id { font-size: 11px; color: #909399; }
    }
    .content-cell {
      padding: 4px 8px; border-radius: 4px; font-size: 13px;
      transition: all 0.3s ease;
      &.content-conflict {
        background: #fef2f2; border: 1px dashed #f56c6c;
        animation: glow-border-red 2s infinite;
      }
      &.content-low-quality { background: #fdf6ec; }
    }
    .handler-text { color: #e6a23c; font-weight: 500; }
    :deep(.el-table__row) {
      transition: all 0.3s ease;
      &.row-manual-top {
        background: linear-gradient(90deg, rgba(230,162,60,0.08), transparent 30%) !important;
        td:first-child { border-left: 3px solid #e6a23c; }
      }
      &.row-auto-top { td:first-child { border-left: 3px solid #409eff; } }
      &.row-conflict { background: #fff7f7 !important; }
      &.row-low-quality { opacity: 0.85; }
    }

    .weight-bars {
      display: flex; flex-direction: column; gap: 4px; cursor: pointer;
      .weight-bar-item { display: flex; align-items: center; gap: 6px; }
      .weight-bar-wrap { width: 60px; height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
      .weight-bar-fill { height: 100%; transition: width 0.3s ease; }
      .weight-bar-label { font-size: 11px; color: #606266; flex-shrink: 0; }
    }

    .quality-text { color: #67c23a; font-weight: 600; }
    .text-green { color: #67c23a; }
    .text-blue { color: #409eff; }
    .warn-text { color: #e6a23c; }
    .danger-text { color: #f56c6c; }
    .text-gray { color: #909399; }
  }

  .rank-pop-enter-active, .rank-pop-leave-active {
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .rank-pop-enter-from, .rank-pop-leave-to { transform: scale(0.5); opacity: 0; }

  .fade-status-enter-active, .fade-status-leave-active {
    transition: all 0.3s ease;
  }
  .fade-status-enter-from, .fade-status-leave-to {
    opacity: 0; transform: translateY(-4px);
  }

  @keyframes top-glow-anim {
    0%, 100% { box-shadow: 0 0 0 0 rgba(230,162,60,0.4); }
    50% { box-shadow: 0 0 0 5px rgba(230,162,60,0.1); }
  }
  @keyframes glow-border-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,108,108,0.15); }
    50% { box-shadow: 0 0 0 4px rgba(245,108,108,0.15); }
  }

  .table-pager { margin-top: 16px; text-align: right; }

  .log-toolbar { margin-bottom: 12px; display: flex; gap: 10px; align-items: center; }
  .logs-table {
    .text-green { color: #67c23a; }
    .warn-text { color: #e6a23c; }
    .danger-text { color: #f56c6c; }
    .text-gray { color: #909399; }
  }

  .weight-alert-dialog {
    .weight-alert-content {
      .weight-detail-list { padding: 14px 0; }
      .weight-detail-row { margin-bottom: 10px; }
      .wd-head { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .wd-label { font-weight: 600; }
      .wd-score { font-family: monospace; }
      .wd-bar { height: 10px; background: #f2f3f5; border-radius: 5px; overflow: hidden; }
      .wd-fill { height: 100%; transition: width 0.6s ease; }
    }
  }

  .trace-content {
    .trace-content-text {
      padding: 6px 10px; background: #f5f7fa; border-radius: 4px; font-size: 13px;
      max-height: 60px; overflow: auto;
    }
    .trace-rows { margin: 12px 0; }
    .trace-mini {
      &:not(:last-child) { margin-bottom: 12px; }
      .trace-user-row {
        font-size: 13px; padding: 3px 0;
        span:first-child { color: #909399; display: inline-block; width: 70px; }
      }
      .risk-row {
        display: flex; align-items: center; gap: 6px; padding: 3px 0;
        font-size: 13px; color: #606266;
      }
      .trace-log-item {
        .log-diff { margin-left: 8px; font-size: 12px; color: #409eff; }
        .log-handler { margin-left: 8px; font-size: 12px; color: #e6a23c; }
      }
    }
    .danger-text { color: #f56c6c; }
  }

  .mt-10 { margin-top: 10px; }
}
</style>
