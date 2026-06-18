<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="formModel" label-width="100px" inline @submit.prevent>
        <el-form-item label="用户UID">
          <div class="input-wrapper">
            <el-input
              v-model="formModel.uid"
              :class="{ 'shake-input': shakeFields.includes('uid') }"
              placeholder="请输入用户UID"
              clearable
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
            <el-icon
              v-if="validFields.includes('uid')"
              class="valid-check"
              :size="16"
              color="#67c23a"
            >
              <Check />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="昵称">
          <div class="input-wrapper">
            <el-input
              v-model="formModel.nickname"
              :class="{ 'shake-input': shakeFields.includes('nickname') }"
              placeholder="请输入昵称"
              clearable
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
            <el-icon
              v-if="validFields.includes('nickname')"
              class="valid-check"
              :size="16"
              color="#67c23a"
            >
              <Check />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="活跃度等级">
          <div class="input-wrapper">
            <el-select
              v-model="formModel.activityLevel"
              :class="{ 'shake-input': shakeFields.includes('activityLevel') }"
              placeholder="全部等级"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="(name, value) in ACTIVITY_LEVEL_NAMES"
                :key="value"
                :label="name"
                :value="Number(value)"
              />
            </el-select>
            <el-icon
              v-if="validFields.includes('activityLevel')"
              class="valid-check"
              :size="16"
              color="#67c23a"
            >
              <Check />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="分值区间">
          <div class="input-wrapper">
            <div class="score-range-wrapper">
              <el-input
                v-model="formModel.minScore"
                :class="{ 'shake-input': shakeFields.includes('minScore') }"
                placeholder="最低分"
                clearable
                style="width: 100px"
                type="number"
              />
              <span style="margin: 0 8px">-</span>
              <el-input
                v-model="formModel.maxScore"
                :class="{ 'shake-input': shakeFields.includes('maxScore') }"
                placeholder="最高分"
                clearable
                style="width: 100px"
                type="number"
              />
            </div>
            <el-icon
              v-if="validFields.includes('scoreRange')"
              class="valid-check valid-check-range"
              :size="16"
              color="#67c23a"
            >
              <Check />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="重点运维">
          <div class="input-wrapper">
            <el-select
              v-model="formModel.isFocusMaintenance"
              :class="{ 'shake-input': shakeFields.includes('isFocusMaintenance') }"
              placeholder="全部"
              clearable
              style="width: 120px"
            >
              <el-option label="是" :value="1" />
              <el-option label="否" :value="0" />
            </el-select>
            <el-icon
              v-if="validFields.includes('isFocusMaintenance')"
              class="valid-check"
              :size="16"
              color="#67c23a"
            >
              <Check />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="更新时间">
          <div class="input-wrapper">
            <el-date-picker
              v-model="dateRange"
              :class="{ 'shake-input': shakeFields.includes('dateRange') }"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 260px"
            />
            <el-icon
              v-if="validFields.includes('dateRange')"
              class="valid-check"
              :size="16"
              color="#67c23a"
            >
              <Check />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-alert
        v-if="validationConflicts.length > 0"
        type="warning"
        :closable="false"
        show-icon
        class="validation-alert"
      >
        <template #title>
          <div>
            <span>筛选条件存在冲突：</span>
            <ul class="conflict-list">
              <li v-for="(conflict, idx) in validationConflicts" :key="idx">
                {{ conflict }}
              </li>
            </ul>
          </div>
        </template>
      </el-alert>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">用户活跃度列表</span>
          <div class="header-actions">
            <el-tag v-if="permission.canRefresh" type="success" effect="light">可手动刷新</el-tag>
            <el-tag v-if="permission.canCalculate" type="warning" effect="light">可重新计算</el-tag>
          </div>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
        @row-dblclick="handleViewDetail"
      >
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-info">
              <div class="avatar-wrapper">
                <el-avatar :size="44" :src="row.avatar">{{ row.nickname?.charAt(0) }}</el-avatar>
                <el-tag
                  class="level-tag"
                  :color="ACTIVITY_LEVEL_COLORS[row.activityLevel]"
                  size="small"
                  effect="dark"
                >
                  {{ ACTIVITY_LEVEL_NAMES[row.activityLevel] }}
                </el-tag>
                <el-tag
                  v-if="row.isFocusMaintenance === 1"
                  class="focus-tag"
                  type="danger"
                  size="small"
                  effect="plain"
                >
                  重点运维
                </el-tag>
              </div>
              <div class="info-text">
                <div class="user-name">
                  {{ row.nickname }}
                  <span class="user-uid">UID: {{ row.id }}</span>
                </div>
                <div class="user-extra">
                  <span>{{ row.username }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="行为统计" min-width="240">
          <template #default="{ row }">
            <div class="behavior-stats">
              <div class="stats-group">
                <div class="stats-title">登录</div>
                <div class="stats-items">
                  <div class="stats-item">
                    <span class="stats-label">日</span>
                    <span class="stats-value">{{ row.dailyLoginCount }}</span>
                  </div>
                  <div class="stats-item">
                    <span class="stats-label">周</span>
                    <span class="stats-value">{{ row.weeklyLoginCount }}</span>
                  </div>
                  <div class="stats-item">
                    <span class="stats-label">月</span>
                    <span class="stats-value">{{ row.monthlyLoginCount }}</span>
                  </div>
                </div>
              </div>
              <div class="stats-group">
                <div class="stats-title">互动</div>
                <div class="stats-items">
                  <div class="stats-item">
                    <span class="stats-label">发布</span>
                    <span class="stats-value">{{ row.weeklyPublishCount }}</span>
                  </div>
                  <div class="stats-item">
                    <span class="stats-label">评论</span>
                    <span class="stats-value">{{ row.weeklyCommentCount }}</span>
                  </div>
                  <div class="stats-item">
                    <span class="stats-label">点赞</span>
                    <span class="stats-value">{{ row.weeklyLikeCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="活跃度分值" min-width="280">
          <template #default="{ row }">
            <div class="score-section">
              <div class="score-header">
                <span class="score-label">总分：</span>
                <span class="score-value" :style="{ color: getScoreColor(row.activityScore) }">
                  {{ row.activityScore }}
                </span>
                <span class="score-max">/ 100</span>
                <el-tooltip
                  placement="top"
                  :show-after="300"
                >
                  <template #content>
                    <div class="score-tooltip">
                      <div class="tooltip-title">分值明细</div>
                      <div
                        v-for="(factor, key) in ActivityScoreFactor"
                        :key="key"
                        class="score-item"
                      >
                        <span class="factor-name">{{ ACTIVITY_SCORE_FACTOR_NAMES[factor] }}</span>
                        <span class="factor-score">{{ row.activityScoreDetail?.[factor] || 0 }}</span>
                        <span class="factor-weight">({{ ACTIVITY_SCORE_FACTOR_WEIGHTS[factor] }}%)</span>
                      </div>
                      <div class="tooltip-footer">
                        <el-divider style="margin: 8px 0" />
                        <div class="threshold-info">
                          <div v-if="row.activityLevel < ActivityLevel.HIGH">
                            下一等级({{ ACTIVITY_LEVEL_NAMES[row.activityLevel + 1] }})需要
                            <span class="highlight">{{ ACTIVITY_LEVEL_THRESHOLDS[row.activityLevel + 1]?.min }}</span>分
                          </div>
                          <div v-else>已达最高等级</div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <el-icon class="info-icon"><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
              <el-progress
                :percentage="row.activityScore || 0"
                :stroke-width="10"
                :color="getScoreColor(row.activityScore)"
              />
              <div class="threshold-markers">
                <span
                  v-for="(threshold, level) in ACTIVITY_LEVEL_THRESHOLDS"
                  :key="level"
                  class="threshold-marker"
                  :style="{ left: threshold.min + '%' }"
                >
                  <span class="threshold-line"></span>
                  <span class="threshold-label">{{ ACTIVITY_LEVEL_NAMES[level] }} {{ threshold.min }}分</span>
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="匹配策略" min-width="200">
          <template #default="{ row }">
            <div class="strategies-section">
              <div class="strategies-list">
                <el-tooltip
                  v-for="strategyKey in (row.activityStrategies || []).slice(0, 3)"
                  :key="strategyKey"
                  :content="OPERATION_STRATEGY_NAMES[strategyKey]"
                  placement="top"
                >
                  <el-tag
                    type="primary"
                    effect="light"
                    size="small"
                    class="strategy-tag"
                  >
                    {{ OPERATION_STRATEGY_NAMES[strategyKey] }}
                  </el-tag>
                </el-tooltip>
                <el-tooltip
                  v-if="(row.activityStrategies?.length || 0) > 3"
                  placement="top"
                >
                  <template #content>
                    <div class="more-strategies">
                      <div
                        v-for="strategyKey in (row.activityStrategies || []).slice(3)"
                        :key="strategyKey"
                        class="strategy-item"
                      >
                        {{ OPERATION_STRATEGY_NAMES[strategyKey] }}
                      </div>
                    </div>
                  </template>
                  <el-tag type="info" effect="light" size="small">
                    +{{ (row.activityStrategies?.length || 0) - 3 }}
                  </el-tag>
                </el-tooltip>
                <span v-if="!row.activityStrategies?.length" class="no-strategy">暂无策略</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            <div class="time-column">
              <div class="time-item">
                {{ row.lastActivityUpdateTime ? formatDateTime(row.lastActivityUpdateTime) : '-' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="permission.canRefresh"
              link
              type="warning"
              size="small"
              :loading="refreshingIds.includes(row.id)"
              @click="handleRefresh(row)"
            >
              刷新
            </el-button>
            <el-button
              v-if="permission.canCalculate"
              link
              type="success"
              size="small"
              @click="handleCalculate(row)"
            >
              重算
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="detailDialogVisible"
      :title="detailDialogTitle"
      width="780px"
      class="detail-dialog"
      destroy-on-close
    >
      <el-skeleton
        v-if="detailLoading"
        :loading="detailLoading"
        :rows="8"
        animated
      />
      <template v-else>
        <div v-if="userDetail" class="detail-content">
          <div class="detail-section">
            <div class="section-title">用户信息</div>
            <div class="user-detail-card">
              <div class="user-detail-info">
                <el-avatar :size="60" :src="userDetail.user.avatar">
                  {{ userDetail.user.nickname?.charAt(0) }}
                </el-avatar>
                <div class="user-detail-text">
                  <div class="detail-name">
                    {{ userDetail.user.nickname }}
                    <span class="detail-uid">UID: {{ userDetail.user.id }}</span>
                  </div>
                  <el-tag
                    :color="userDetail.levelInfo.levelColor"
                    size="default"
                    effect="dark"
                  >
                    {{ userDetail.levelInfo.levelName }}
                  </el-tag>
                  <el-tag
                    v-if="userDetail.user.isFocusMaintenance === 1"
                    type="danger"
                    size="small"
                    effect="plain"
                    style="margin-left: 8px"
                  >
                    重点运维
                  </el-tag>
                </div>
              </div>
              <div class="detail-score-info">
                <div class="detail-score">
                  <span class="detail-score-label">当前分值：</span>
                  <span class="detail-score-value" :style="{ color: getScoreColor(userDetail.user.activityScore) }">
                    {{ userDetail.user.activityScore }}
                  </span>
                  <span class="detail-score-max">/ 100</span>
                </div>
                <div v-if="userDetail.levelInfo.nextLevel" class="next-level-info">
                  距离「{{ userDetail.levelInfo.nextLevel }}」还差
                  <span class="highlight">{{ userDetail.levelInfo.scoreToNextLevel }}</span>分
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">行为统计</div>
            <div class="behavior-detail-grid">
              <div class="behavior-card">
                <div class="behavior-icon login-icon">
                  <el-icon :size="24"><User /></el-icon>
                </div>
                <div class="behavior-info">
                  <div class="behavior-title">登录行为</div>
                  <div class="behavior-values">
                    <span>日: {{ userDetail.user.dailyLoginCount }}</span>
                    <span>周: {{ userDetail.user.weeklyLoginCount }}</span>
                    <span>月: {{ userDetail.user.monthlyLoginCount }}</span>
                  </div>
                </div>
              </div>
              <div class="behavior-card">
                <div class="behavior-icon publish-icon">
                  <el-icon :size="24"><Document /></el-icon>
                </div>
                <div class="behavior-info">
                  <div class="behavior-title">发布行为</div>
                  <div class="behavior-values">
                    <span>周发布: {{ userDetail.user.weeklyPublishCount }}</span>
                  </div>
                </div>
              </div>
              <div class="behavior-card">
                <div class="behavior-icon interact-icon">
                  <el-icon :size="24"><ChatDotRound /></el-icon>
                </div>
                <div class="behavior-info">
                  <div class="behavior-title">互动行为</div>
                  <div class="behavior-values">
                    <span>周评论: {{ userDetail.user.weeklyCommentCount }}</span>
                    <span>周点赞: {{ userDetail.user.weeklyLikeCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">分值明细</div>
            <div class="score-detail-list">
              <div
                v-for="(factor, key) in ActivityScoreFactor"
                :key="key"
                class="score-detail-item"
              >
                <div class="score-detail-header">
                  <span class="factor-label">{{ ACTIVITY_SCORE_FACTOR_NAMES[factor] }}</span>
                  <span class="factor-weight-badge">{{ ACTIVITY_SCORE_FACTOR_WEIGHTS[factor] }}%</span>
                </div>
                <div class="score-detail-body">
                  <el-progress
                    :percentage="Math.round((userDetail.user.activityScoreDetail?.[factor] || 0) / ACTIVITY_SCORE_FACTOR_WEIGHTS[factor] * 100)"
                    :stroke-width="8"
                    :color="getScoreColor(userDetail.user.activityScoreDetail?.[factor] || 0)"
                  />
                  <span class="score-detail-value">
                    {{ userDetail.user.activityScoreDetail?.[factor] || 0 }} / {{ ACTIVITY_SCORE_FACTOR_WEIGHTS[factor] }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">匹配策略</div>
            <div class="strategies-detail">
              <div
                v-for="strategy in userDetail.currentStrategies"
                :key="strategy.key"
                class="strategy-detail-item"
                :class="{ 'strategy-enabled': strategy.enabled }"
              >
                <div class="strategy-header">
                  <span class="strategy-name">{{ strategy.name }}</span>
                  <el-tag
                    :type="strategy.enabled ? 'success' : 'info'"
                    size="small"
                  >
                    {{ strategy.enabled ? '已启用' : '未启用' }}
                  </el-tag>
                </div>
                <div class="strategy-desc">{{ strategy.description }}</div>
              </div>
              <div v-if="!userDetail.currentStrategies?.length" class="empty-strategies">
                暂无匹配策略
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">分值变动记录</div>
            <div class="score-logs-table">
              <el-table
                :data="userDetail.recentScoreLogs || []"
                size="small"
                stripe
              >
                <el-table-column label="时间" prop="createTime" width="160">
                  <template #default="{ row }">
                    {{ formatDateTime(row.createTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="变动类型" width="120">
                  <template #default="{ row }">
                    <el-tag size="small">{{ row.logType }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="等级变化" width="160">
                  <template #default="{ row }">
                    <span
                      :style="{ color: ACTIVITY_LEVEL_COLORS[row.oldLevel] }"
                    >
                      {{ ACTIVITY_LEVEL_NAMES[row.oldLevel] }}
                    </span>
                    <el-icon style="margin: 0 4px"><ArrowRight /></el-icon>
                    <span
                      :style="{ color: ACTIVITY_LEVEL_COLORS[row.newLevel] }"
                    >
                      {{ ACTIVITY_LEVEL_NAMES[row.newLevel] }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="分值变化" width="120">
                  <template #default="{ row }">
                    <span>{{ row.oldScore }}</span>
                    <el-icon style="margin: 0 4px"><ArrowRight /></el-icon>
                    <span :class="{ 'score-increase': row.newScore > row.oldScore, 'score-decrease': row.newScore < row.oldScore }">
                      {{ row.newScore }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" />
              </el-table>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="permission.canRefresh && userDetail"
          type="warning"
          :loading="detailRefreshing"
          @click="handleRefreshDetail"
        >
          刷新数据
        </el-button>
      </template>
    </el-dialog>

    <Transition name="fade">
      <el-dialog
        v-model="benefitDialogVisible"
        title="权益变更通知"
        width="480px"
        class="benefit-dialog"
        :close-on-click-modal="false"
      >
        <div v-if="refreshResult" class="benefit-content">
          <div class="benefit-result-header">
            <el-icon class="result-icon success" :size="48">
              <CircleCheckFilled />
            </el-icon>
            <div class="result-title">数据刷新成功</div>
          </div>

          <div class="benefit-changes">
            <div v-if="refreshResult.oldLevel !== refreshResult.newLevel" class="change-item level-change">
              <div class="change-label">活跃度等级</div>
              <div class="change-values">
                <el-tag
                  :color="ACTIVITY_LEVEL_COLORS[refreshResult.oldLevel]"
                  size="default"
                  effect="light"
                >
                  {{ ACTIVITY_LEVEL_NAMES[refreshResult.oldLevel] }}
                </el-tag>
                <el-icon style="margin: 0 8px"><ArrowRight /></el-icon>
                <el-tag
                  :color="ACTIVITY_LEVEL_COLORS[refreshResult.newLevel]"
                  size="default"
                  effect="dark"
                >
                  {{ ACTIVITY_LEVEL_NAMES[refreshResult.newLevel] }}
                </el-tag>
              </div>
            </div>

            <div class="change-item score-change">
              <div class="change-label">活跃度分值</div>
              <div class="change-values">
                <span class="old-score">{{ refreshResult.oldScore }}</span>
                <el-icon style="margin: 0 8px"><ArrowRight /></el-icon>
                <span
                  class="new-score"
                  :class="{ 'score-increase': refreshResult.newScore > refreshResult.oldScore, 'score-decrease': refreshResult.newScore < refreshResult.oldScore }"
                >
                  {{ refreshResult.newScore }}
                  <span
                    v-if="refreshResult.newScore !== refreshResult.oldScore"
                    class="score-diff"
                  >
                    ({{ refreshResult.newScore > refreshResult.oldScore ? '+' : '' }}{{ refreshResult.newScore - refreshResult.oldScore }})
                  </span>
                </span>
              </div>
            </div>

            <div v-if="refreshResult.strategiesAdded?.length" class="change-item strategies-added">
              <div class="change-label">新增策略</div>
              <div class="strategy-tags">
                <el-tag
                  v-for="s in refreshResult.strategiesAdded"
                  :key="s"
                  type="success"
                  effect="light"
                >
                  {{ OPERATION_STRATEGY_NAMES[s] }}
                </el-tag>
              </div>
            </div>

            <div v-if="refreshResult.strategiesRemoved?.length" class="change-item strategies-removed">
              <div class="change-label">移除策略</div>
              <div class="strategy-tags">
                <el-tag
                  v-for="s in refreshResult.strategiesRemoved"
                  :key="s"
                  type="info"
                  effect="light"
                >
                  {{ OPERATION_STRATEGY_NAMES[s] }}
                </el-tag>
              </div>
            </div>

            <div v-if="refreshResult.markedAbnormal" class="change-item abnormal-warning">
              <el-alert type="warning" :closable="false" show-icon>
                <template #title>
                  <div>
                    <div>检测到异常行为</div>
                    <div v-if="refreshResult.abnormalType" class="abnormal-type">
                      异常类型：{{ refreshResult.abnormalType }}
                    </div>
                  </div>
                </template>
              </el-alert>
            </div>
          </div>

          <div class="result-message">{{ refreshResult.message }}</div>
        </div>
        <template #footer>
          <el-button type="primary" @click="benefitDialogVisible = false">确定</el-button>
        </template>
      </el-dialog>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  Search,
  Refresh,
  InfoFilled,
  Check,
  User,
  Document,
  ChatDotRound,
  ArrowRight,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime } from '@hooks/index'
import {
  getActivityList,
  getUserActivityDetail,
  calculateActivityScore,
  validateFilterConditions,
  refreshActivityData
} from '@api/activity-operation'
import type {
  ActivityListUser,
  ActivityUserDetail,
  ActivityPermission,
  ActivityRefreshResult
} from '@/types/business'
import {
  ActivityLevel,
  ACTIVITY_LEVEL_NAMES,
  ACTIVITY_LEVEL_COLORS,
  ACTIVITY_LEVEL_THRESHOLDS,
  ActivityScoreFactor,
  ACTIVITY_SCORE_FACTOR_NAMES,
  ACTIVITY_SCORE_FACTOR_WEIGHTS,
  OperationStrategyType,
  OPERATION_STRATEGY_NAMES,
  ACTIVITY_LEVEL_STRATEGY_MAP
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'

const userStore = useUserStore()

const canView = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator') ||
    userStore.hasPermission('activity:view')
})

const permission = ref<ActivityPermission>({
  canView: false,
  canCalculate: false,
  canRefresh: false,
  canBatch: false,
  canAbnormal: false,
  canStrategy: false
})

const dateRange = ref<string[]>([])
const shakeFields = ref<string[]>([])
const validFields = ref<string[]>([])
const validationConflicts = ref<string[]>([])
const refreshingIds = ref<number[]>([])

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch: baseHandleSearch,
  handleReset: baseHandleReset,
  handlePaginate
} = useFetchList<ActivityListUser, Record<string, unknown>>({
  fetchApi: async (params) => {
    const result = await getActivityList(params)
    permission.value = result.permission
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    uid: undefined,
    nickname: '',
    activityLevel: undefined,
    minScore: undefined,
    maxScore: undefined,
    isFocusMaintenance: undefined,
    updateStartDate: '',
    updateEndDate: ''
  },
  immediate: false
})

const formModel = computed<Record<string, any>>({
  get: () => queryParams as Record<string, any>,
  set: () => {}
})

watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.updateStartDate = newVal[0]
    queryParams.updateEndDate = newVal[1]
  } else {
    queryParams.updateStartDate = ''
    queryParams.updateEndDate = ''
  }
})

const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const detailRefreshing = ref(false)
const userDetail = ref<ActivityUserDetail | null>(null)
const currentUserId = ref<number | null>(null)

const detailDialogTitle = computed(() => {
  return userDetail.value
    ? `用户活跃度详情 - ${userDetail.value.user.nickname}`
    : '用户活跃度详情'
})

const benefitDialogVisible = ref(false)
const refreshResult = ref<ActivityRefreshResult | null>(null)

const triggerShake = (fields: string[]) => {
  shakeFields.value = fields
  setTimeout(() => {
    shakeFields.value = []
  }, 500)
}

const handleValidateFilters = async () => {
  try {
    const conditions = {
      uid: queryParams.uid,
      nickname: queryParams.nickname,
      activityLevel: queryParams.activityLevel,
      minScore: queryParams.minScore,
      maxScore: queryParams.maxScore,
      isFocusMaintenance: queryParams.isFocusMaintenance,
      updateStartDate: queryParams.updateStartDate,
      updateEndDate: queryParams.updateEndDate
    }
    const result = await validateFilterConditions(conditions)
    validationConflicts.value = result.conflicts || []

    const allFields = ['uid', 'nickname', 'activityLevel', 'minScore', 'maxScore', 'scoreRange', 'isFocusMaintenance', 'dateRange']
    if (result.valid) {
      validFields.value = allFields
      return true
    } else {
      const conflictFields: string[] = []
      if (result.conflicts?.some(c => c.includes('分值') || c.includes('score'))) {
        conflictFields.push('minScore', 'maxScore', 'scoreRange')
      }
      if (result.conflicts?.some(c => c.includes('时间') || c.includes('date'))) {
        conflictFields.push('dateRange')
      }
      if (result.conflicts?.some(c => c.includes('等级') || c.includes('level'))) {
        conflictFields.push('activityLevel')
      }
      if (conflictFields.length === 0) {
        conflictFields.push('uid', 'nickname', 'isFocusMaintenance')
      }
      triggerShake(conflictFields)
      validFields.value = allFields.filter(f => !conflictFields.includes(f))
      return false
    }
  } catch {
    validationConflicts.value = []
    validFields.value = []
    return true
  }
}

const handleSearch = async () => {
  const valid = await handleValidateFilters()
  if (!valid) {
    ElMessage.warning('筛选条件存在冲突，请调整后重试')
    return
  }
  baseHandleSearch()
}

const handleReset = () => {
  dateRange.value = []
  validationConflicts.value = []
  validFields.value = []
  shakeFields.value = []
  baseHandleReset()
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 50) return '#409eff'
  if (score >= 20) return '#e6a23c'
  return '#909399'
}

const loadUserDetail = async (id: number) => {
  detailLoading.value = true
  try {
    userDetail.value = await getUserActivityDetail(id)
  } catch {
    ElMessage.error('获取用户详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleViewDetail = (row: ActivityListUser) => {
  currentUserId.value = row.id
  detailDialogVisible.value = true
  loadUserDetail(row.id)
}

const handleRefresh = async (row: ActivityListUser) => {
  refreshingIds.value.push(row.id)
  try {
    const result = await refreshActivityData(row.id)
    refreshResult.value = result
    benefitDialogVisible.value = true
    ElMessage.success('刷新成功')
    fetchData()
  } catch {
    ElMessage.error('刷新失败')
  } finally {
    refreshingIds.value = refreshingIds.value.filter(id => id !== row.id)
  }
}

const handleCalculate = async (row: ActivityListUser) => {
  try {
    const result = await calculateActivityScore(row.id)
    ElMessage.success(`重新计算成功，当前分值：${result.totalScore}，等级：${ACTIVITY_LEVEL_NAMES[result.level]}`)
    fetchData()
  } catch {
    ElMessage.error('计算失败')
  }
}

const handleRefreshDetail = async () => {
  if (!currentUserId.value) return
  detailRefreshing.value = true
  try {
    const result = await refreshActivityData(currentUserId.value)
    refreshResult.value = result
    benefitDialogVisible.value = true
    await loadUserDetail(currentUserId.value)
    fetchData()
  } catch {
    ElMessage.error('刷新失败')
  } finally {
    detailRefreshing.value = false
  }
}

onMounted(() => {
  if (canView.value) {
    fetchData()
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .validation-alert {
    margin-top: 16px;

    .conflict-list {
      margin: 8px 0 0 20px;
      padding: 0;

      li {
        padding: 2px 0;
        color: $text-secondary;
      }
    }
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    .valid-check {
      margin-left: 6px;
      flex-shrink: 0;
    }

    .valid-check-range {
      position: absolute;
      right: -24px;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  .score-range-wrapper {
    display: flex;
    align-items: center;
  }

  .shake-input {
    animation: shake 0.5s cubic-bezier(.36, .07, .19, .97) both;
  }

  @keyframes shake {
    10%, 90% {
      transform: translateX(-1px);
    }
    20%, 80% {
      transform: translateX(2px);
    }
    30%, 50%, 70% {
      transform: translateX(-4px);
    }
    40%, 60% {
      transform: translateX(4px);
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar-wrapper {
      position: relative;

      .level-tag {
        position: absolute;
        top: -6px;
        right: -6px;
      }

      .focus-tag {
        position: absolute;
        bottom: -6px;
        left: -6px;
      }
    }

    .info-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .user-name {
        font-weight: 600;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: 8px;

        .user-uid {
          font-size: 12px;
          color: $text-secondary;
          font-weight: normal;
        }
      }

      .user-extra {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .behavior-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .stats-group {
      .stats-title {
        font-size: 11px;
        color: $text-placeholder;
        margin-bottom: 4px;
      }

      .stats-items {
        display: flex;
        gap: 12px;

        .stats-item {
          display: flex;
          align-items: center;
          gap: 4px;
          background-color: $bg-color;
          padding: 2px 8px;
          border-radius: 4px;

          .stats-label {
            font-size: 11px;
            color: $text-placeholder;
          }

          .stats-value {
            font-size: 13px;
            font-weight: 600;
            color: $text-primary;
          }
        }
      }
    }
  }

  .score-section {
    position: relative;

    .score-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;

      .score-label {
        font-size: 12px;
        color: $text-placeholder;
      }

      .score-value {
        font-size: 18px;
        font-weight: 600;
      }

      .score-max {
        font-size: 12px;
        color: $text-placeholder;
      }

      .info-icon {
        cursor: help;
        color: $text-placeholder;
        font-size: 14px;
      }
    }

    .threshold-markers {
      position: relative;
      height: 20px;
      margin-top: 4px;

      .threshold-marker {
        position: absolute;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;

        .threshold-line {
          width: 1px;
          height: 8px;
          background-color: $border-color-lighter;
        }

        .threshold-label {
          font-size: 10px;
          color: $text-placeholder;
          white-space: nowrap;
        }
      }
    }
  }

  .score-tooltip {
    min-width: 220px;

    .tooltip-title {
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 8px;
    }

    .score-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;

      .factor-name {
        color: $text-secondary;
      }

      .factor-score {
        font-weight: 600;
        color: $text-primary;
      }

      .factor-weight {
        color: $text-placeholder;
        font-size: 11px;
      }
    }

    .threshold-info {
      font-size: 12px;
      color: $text-secondary;

      .highlight {
        color: $color-primary;
        font-weight: 600;
      }
    }
  }

  .strategies-section {
    .strategies-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .strategy-tag {
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .no-strategy {
        font-size: 12px;
        color: $text-placeholder;
      }
    }
  }

  .more-strategies {
    .strategy-item {
      padding: 4px 0;
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .time-column {
    font-size: 12px;
    color: $text-secondary;
  }

  .detail-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .detail-section {
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 12px;
      padding-left: 8px;
      border-left: 3px solid $color-primary;
    }
  }

  .user-detail-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background-color: $bg-color;
    border-radius: 8px;

    .user-detail-info {
      display: flex;
      align-items: center;
      gap: 16px;

      .user-detail-text {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .detail-name {
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
          display: flex;
          align-items: center;
          gap: 8px;

          .detail-uid {
            font-size: 12px;
            color: $text-secondary;
            font-weight: normal;
          }
        }
      }
    }

    .detail-score-info {
      text-align: right;

      .detail-score {
        display: flex;
        align-items: baseline;
        justify-content: flex-end;
        gap: 4px;

        .detail-score-label {
          font-size: 12px;
          color: $text-placeholder;
        }

        .detail-score-value {
          font-size: 28px;
          font-weight: 700;
        }

        .detail-score-max {
          font-size: 12px;
          color: $text-placeholder;
        }
      }

      .next-level-info {
        margin-top: 4px;
        font-size: 12px;
        color: $text-secondary;

        .highlight {
          color: $color-primary;
          font-weight: 600;
        }
      }
    }
  }

  .behavior-detail-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .behavior-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background-color: $bg-color;
      border-radius: 8px;

      .behavior-icon {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        &.login-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.publish-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.interact-icon {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
      }

      .behavior-info {
        .behavior-title {
          font-size: 12px;
          color: $text-placeholder;
          margin-bottom: 4px;
        }

        .behavior-values {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: $text-primary;
        }
      }
    }
  }

  .score-detail-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .score-detail-item {
      .score-detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .factor-label {
          font-size: 13px;
          font-weight: 500;
          color: $text-primary;
        }

        .factor-weight-badge {
          font-size: 11px;
          padding: 2px 8px;
          background-color: $bg-color;
          border-radius: 10px;
          color: $text-secondary;
        }
      }

      .score-detail-body {
        display: flex;
        align-items: center;
        gap: 12px;

        .el-progress {
          flex: 1;
        }

        .score-detail-value {
          font-size: 13px;
          font-weight: 600;
          color: $text-primary;
          white-space: nowrap;
        }
      }
    }
  }

  .strategies-detail {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .strategy-detail-item {
      padding: 12px;
      background-color: $bg-color;
      border-radius: 8px;
      border: 1px solid transparent;
      transition: all 0.2s;

      &.strategy-enabled {
        border-color: rgba(103, 194, 58, 0.3);
        background-color: rgba(103, 194, 58, 0.05);
      }

      .strategy-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .strategy-name {
          font-size: 13px;
          font-weight: 600;
          color: $text-primary;
        }
      }

      .strategy-desc {
        font-size: 12px;
        color: $text-secondary;
        line-height: 1.5;
      }
    }

    .empty-strategies {
      padding: 24px;
      text-align: center;
      color: $text-placeholder;
      font-size: 13px;
    }
  }

  .score-logs-table {
    .score-increase {
      color: #67c23a;
      font-weight: 600;
    }

    .score-decrease {
      color: #f56c6c;
      font-weight: 600;
    }
  }

  .benefit-content {
    padding: 8px 0;

    .benefit-result-header {
      text-align: center;
      margin-bottom: 24px;

      .result-icon {
        margin-bottom: 8px;

        &.success {
          color: #67c23a;
        }
      }

      .result-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
      }
    }

    .benefit-changes {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      background-color: $bg-color;
      border-radius: 8px;
      margin-bottom: 16px;

      .change-item {
        .change-label {
          font-size: 12px;
          color: $text-placeholder;
          margin-bottom: 8px;
        }

        .change-values {
          display: flex;
          align-items: center;
          font-size: 14px;
        }

        .old-score {
          color: $text-secondary;
        }

        .new-score {
          font-weight: 600;
          color: $text-primary;

          .score-diff {
            font-size: 12px;
            margin-left: 4px;
          }

          &.score-increase {
            color: #67c23a;

            .score-diff {
              color: #67c23a;
            }
          }

          &.score-decrease {
            color: #f56c6c;

            .score-diff {
              color: #f56c6c;
            }
          }
        }

        .strategy-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .abnormal-warning {
          margin-top: 8px;

          .abnormal-type {
            margin-top: 4px;
            font-size: 12px;
            color: $text-secondary;
          }
        }
      }
    }

    .result-message {
      text-align: center;
      font-size: 13px;
      color: $text-secondary;
      padding: 8px;
      background-color: rgba(64, 158, 255, 0.05);
      border-radius: 6px;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.benefit-dialog) {
  .el-dialog__body {
    padding-top: 12px;
  }
}
</style>
