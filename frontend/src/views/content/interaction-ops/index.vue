<template>
  <div class="interaction-ops-page">
    <el-row :gutter="14" class="stats-row">
      <el-col :span="3" v-for="card in statCards" :key="card.key">
        <el-card shadow="hover" class="stat-card" :class="`stat-${card.type}`">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.value }}</div>
          <div v-if="card.suffix" class="stat-suffix">{{ card.suffix }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="flow-dist-row" v-if="stats.flowDistribution.length">
      <el-col :span="24">
        <el-card shadow="never" class="flow-dist-card">
          <template #header><span>流量池分布</span></template>
          <div class="flow-dist-bar">
            <div
              v-for="item in stats.flowDistribution"
              :key="item.flowLevel"
              class="flow-dist-item"
              :style="{ width: distPercent(item.count) + '%' }"
            >
              <div class="dist-fill" :style="{ background: flowColor(item.flowLevel) }"></div>
              <div class="dist-label">{{ flowName(item.flowLevel) }}: {{ item.count }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="main-tabs" @tab-change="onTabChange">
      <el-tab-pane label="互动数据" name="data">
        <el-card shadow="never" class="filter-card">
          <el-form :inline="true" :model="filter" class="filter-form" @submit.prevent>
            <el-form-item label="笔记ID">
              <el-input v-model="filter.noteId" placeholder="输入笔记ID" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item label="互动类型">
              <el-select v-model="filter.dataType" placeholder="全部" clearable style="width: 120px">
                <el-option v-for="(l, v) in dataTypeNames" :key="v" :label="l" :value="v" />
              </el-select>
            </el-form-item>
            <el-form-item label="异常等级">
              <el-select v-model="filter.isAnomaly" placeholder="全部" clearable style="width: 130px">
                <el-option v-for="(l, v) in anomalyLevelNames" :key="v" :label="l" :value="Number(v)" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filter.status" placeholder="全部" clearable style="width: 120px">
                <el-option v-for="(l, v) in statusNames" :key="v" :label="l" :value="Number(v)" />
              </el-select>
            </el-form-item>
            <el-form-item label="流量池">
              <el-select v-model="filter.flowLevel" placeholder="全部" clearable style="width: 120px">
                <el-option v-for="(l, v) in flowLevelNames" :key="v" :label="l" :value="Number(v)" />
              </el-select>
            </el-form-item>
            <el-form-item label="优质">
              <el-select v-model="filter.isQuality" placeholder="全部" clearable style="width: 100px">
                <el-option label="优质" :value="1" />
                <el-option label="普通" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadData">搜索</el-button>
              <el-button :icon="RefreshRight" @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="table-card">
          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-button type="primary" :icon="Refresh" @click="loadData">刷新统计</el-button>
              <el-button
                type="warning"
                :icon="Aim"
                :disabled="selected.length === 0"
                :loading="calibrateLoading"
                @click="onBatchCalibrate"
              >批量校准 ({{ selected.length }})</el-button>
              <el-button
                type="danger"
                :icon="Delete"
                :disabled="selected.length === 0"
                :loading="cleanLoading"
                @click="onBatchCleanFake"
              >批量清零虚假</el-button>
              <el-button
                type="success"
                :icon="Star"
                :disabled="selected.length === 0"
                :loading="qualityLoading"
                @click="onBatchMarkQuality"
              >批量标记优质</el-button>
            </div>
            <div class="toolbar-right">
              <el-tag type="info">共 {{ total }} 条</el-tag>
            </div>
          </div>

          <div v-if="loading" class="skeleton-wrapper">
            <el-skeleton :rows="8" animated />
          </div>
          <div v-else>
            <el-table
              ref="tableRef"
              :data="list"
              class="data-table striped-table"
              @selection-change="onSelectionChange"
              v-loading="loading"
            >
              <el-table-column type="selection" width="50" reserve-selection />
              <el-table-column label="笔记ID" width="100">
                <template #default="{ row }">
                  <span class="note-id-link" @click="onViewTrace(row)">{{ row.noteId }}</span>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="80">
                <template #default="{ row }">
                  <span>{{ dataTypeNames[row.dataType] || row.dataType }}</span>
                </template>
              </el-table-column>
              <el-table-column label="总数" width="80" align="center">
                <template #default="{ row }">
                  <strong>{{ row.totalCount }}</strong>
                </template>
              </el-table-column>
              <el-table-column label="真实" width="80" align="center">
                <template #default="{ row }">
                  <span class="real-count">{{ row.realCount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="虚假" width="80" align="center">
                <template #default="{ row }">
                  <span :class="{ 'danger-text': row.fakeCount > 0 }">{{ row.fakeCount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="异常" width="80" align="center">
                <template #default="{ row }">
                  <span :class="{ 'danger-text': row.anomalyCount > 0 }">{{ row.anomalyCount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="异常等级" width="110">
                <template #default="{ row }">
                  <transition name="fade-status">
                    <el-tag
                      v-if="row.isAnomaly > 0"
                      :color="anomalyLevelColors[row.isAnomaly]"
                      effect="dark"
                      size="small"
                      class="anomaly-tag"
                    >{{ anomalyLevelNames[row.isAnomaly] }}</el-tag>
                    <el-tag v-else type="success" size="small" effect="light">正常</el-tag>
                  </transition>
                </template>
              </el-table-column>
              <el-table-column label="异常类型" min-width="180">
                <template #default="{ row }">
                  <el-popover
                    v-if="row.anomalyType"
                    placement="top"
                    :width="360"
                    trigger="hover"
                  >
                    <template #reference>
                      <div class="anomaly-type-cell anomaly-red">
                        <el-tag
                          v-for="t in row.anomalyType.split(',')"
                          :key="t"
                          type="danger"
                          size="small"
                          effect="plain"
                          class="anomaly-type-tag"
                        >{{ anomalyTypeNames[t] || t }}</el-tag>
                      </div>
                    </template>
                    <div class="anomaly-popover" v-if="row.anomalyDetail">
                      <div v-for="(val, key) in parseAnomalyDetail(row.anomalyDetail)" :key="key" class="anomaly-detail-item">
                        <strong>{{ anomalyTypeNames[key] || key }}</strong>：
                        <span v-for="(v, k) in val" :key="k" class="detail-kv">{{ k }}={{ v }};&nbsp;</span>
                      </div>
                    </div>
                  </el-popover>
                  <span v-else class="text-gray">-</span>
                </template>
              </el-table-column>
              <el-table-column label="热度" width="90" align="center">
                <template #default="{ row }">
                  <strong>{{ Number(row.hotScore).toFixed(1) }}</strong>
                </template>
              </el-table-column>
              <el-table-column label="权重" width="90" align="center">
                <template #default="{ row }">
                  <span :class="{ 'quality-weight': row.isQuality }">{{ Number(row.weightScore).toFixed(1) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="流量池" width="90">
                <template #default="{ row }">
                  <el-tag
                    :color="flowLevelColors[row.flowLevel]"
                    effect="dark"
                    size="small"
                  >{{ flowLevelNames[row.flowLevel] }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <transition name="fade-status">
                    <el-tag
                      :type="statusTagTypes[row.status]"
                      effect="light"
                      size="small"
                    >{{ statusNames[row.status] }}</el-tag>
                  </transition>
                </template>
              </el-table-column>
              <el-table-column label="质量分" width="80" align="center">
                <template #default="{ row }">
                  <span :class="{ 'quality-text': row.qualityScore >= 80 }">
                    {{ row.isQuality ? Number(row.qualityScore).toFixed(0) : '-' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="onViewTrace(row)">溯源</el-button>
                  <el-button link type="warning" @click="onLinkWeight(row)">权重联动</el-button>
                  <el-button link type="primary" @click="onRefreshSingle(row)">刷新</el-button>
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
              @current-change="p => { page = p; loadData() }"
              @size-change="s => { pageSize = s; page = 1; loadData() }"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="操作日志" name="logs">
        <el-card shadow="never">
          <div v-if="logsLoading" class="skeleton-wrapper">
            <el-skeleton :rows="6" animated />
          </div>
          <div v-else>
            <el-table :data="logsList" class="logs-table" v-loading="logsLoading">
              <el-table-column label="时间" width="170">
                <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="笔记ID" width="100" prop="noteId" />
              <el-table-column label="类型" width="80">
                <template #default="{ row }">{{ dataTypeNames[row.dataType] || row.dataType }}</template>
              </el-table-column>
              <el-table-column label="操作" width="130">
                <template #default="{ row }">
                  <el-tag size="small">{{ opsActionNames[row.action] || '未知' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="异常类型" width="130">
                <template #default="{ row }">
                  <span v-if="row.anomalyType">{{ row.anomalyType.split(',').map((t: string) => anomalyTypeNames[t] || t).join('、') }}</span>
                  <span v-else class="text-gray">-</span>
                </template>
              </el-table-column>
              <el-table-column label="变动前" min-width="200">
                <template #default="{ row }">
                  <div class="change-cell">
                    <span v-if="row.beforeTotalCount !== null">总数:{{ row.beforeTotalCount }}</span>
                    <span v-if="row.beforeRealCount !== null">真实:{{ row.beforeRealCount }}</span>
                    <span v-if="row.beforeHotScore !== null">热度:{{ Number(row.beforeHotScore).toFixed(1) }}</span>
                    <span v-if="row.beforeFlowLevel !== null">流量:{{ flowLevelNames[row.beforeFlowLevel] }}</span>
                    <span v-if="row.beforeWeightScore !== null">权重:{{ Number(row.beforeWeightScore).toFixed(1) }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="变动后" min-width="200">
                <template #default="{ row }">
                  <div class="change-cell">
                    <span v-if="row.afterTotalCount !== null">总数:<strong :class="changeClass(row.beforeTotalCount, row.afterTotalCount)">{{ row.afterTotalCount }}</strong></span>
                    <span v-if="row.afterRealCount !== null">真实:<strong :class="changeClass(row.beforeRealCount, row.afterRealCount)">{{ row.afterRealCount }}</strong></span>
                    <span v-if="row.afterHotScore !== null">热度:<strong :class="changeClass(row.beforeHotScore, row.afterHotScore)">{{ Number(row.afterHotScore).toFixed(1) }}</strong></span>
                    <span v-if="row.afterFlowLevel !== null">流量:<strong :class="changeClass(row.beforeFlowLevel, row.afterFlowLevel)">{{ flowLevelNames[row.afterFlowLevel] }}</strong></span>
                    <span v-if="row.afterWeightScore !== null">权重:<strong :class="changeClass(row.beforeWeightScore, row.afterWeightScore)">{{ Number(row.afterWeightScore).toFixed(1) }}</strong></span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作人" width="100" prop="handlerName" />
              <el-table-column label="备注" min-width="140" prop="handleNote" show-overflow-tooltip />
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
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="复盘报表" name="report">
        <el-card shadow="never">
          <div class="report-toolbar">
            <el-input v-model="reportNoteId" placeholder="输入笔记ID生成复盘报表" style="width: 300px" clearable>
              <template #prepend>笔记ID</template>
            </el-input>
            <el-button type="primary" :icon="DataAnalysis" @click="onGenReport" :loading="reportLoading">生成报表</el-button>
          </div>

          <div v-if="reportData" class="report-content">
            <div class="report-header-fixed">
              <h3>互动数据复盘报表 - 笔记 #{{ reportData.note.id }}</h3>
              <div class="report-meta">
                <span>标题：{{ reportData.note.title }}</span>
                <span>作者：{{ reportData.note.authorName }}</span>
                <span>生成时间：{{ formatTime(new Date()) }}</span>
              </div>
            </div>

            <el-descriptions :column="4" border size="small" class="report-summary">
              <el-descriptions-item label="真实互动">{{ reportData.summary.totalReal }}</el-descriptions-item>
              <el-descriptions-item label="虚假互动">
                <strong :class="{ 'danger-text': reportData.summary.totalFake > 0 }">{{ reportData.summary.totalFake }}</strong>
              </el-descriptions-item>
              <el-descriptions-item label="异常数">{{ reportData.summary.totalAnomaly }}</el-descriptions-item>
              <el-descriptions-item label="真实性">{{ reportData.summary.authenticityRatio }}%</el-descriptions-item>
              <el-descriptions-item label="唯一IP数">{{ reportData.summary.uniqueIps }}</el-descriptions-item>
              <el-descriptions-item label="唯一用户数">{{ reportData.summary.uniqueUsers }}</el-descriptions-item>
              <el-descriptions-item label="峰值/小时">{{ reportData.summary.maxHourly }}</el-descriptions-item>
              <el-descriptions-item label="平均质量">{{ reportData.summary.avgQuality }}</el-descriptions-item>
            </el-descriptions>

            <h4>互动数据明细</h4>
            <el-table :data="reportData.interactions" class="report-table" border size="small">
              <el-table-column label="类型" width="80">
                <template #default="{ row }">{{ dataTypeNames[row.dataType] }}</template>
              </el-table-column>
              <el-table-column label="总数" width="70" prop="totalCount" align="center" />
              <el-table-column label="真实" width="70" prop="realCount" align="center" />
              <el-table-column label="虚假" width="70" align="center">
                <template #default="{ row }">
                  <span :class="{ 'danger-text': row.fakeCount > 0 }">{{ row.fakeCount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="异常" width="70" align="center">
                <template #default="{ row }">
                  <span :class="{ 'danger-text': row.anomalyCount > 0 }">{{ row.anomalyCount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="热度" width="70" align="center">
                <template #default="{ row }">{{ Number(row.hotScore).toFixed(1) }}</template>
              </el-table-column>
              <el-table-column label="权重" width="70" align="center">
                <template #default="{ row }">{{ Number(row.weightScore).toFixed(1) }}</template>
              </el-table-column>
              <el-table-column label="流量池" width="80">
                <template #default="{ row }">{{ flowLevelNames[row.flowLevel] }}</template>
              </el-table-column>
              <el-table-column label="质量分" width="70" align="center">
                <template #default="{ row }">{{ row.isQuality ? Number(row.qualityScore).toFixed(0) : '-' }}</template>
              </el-table-column>
              <el-table-column label="状态" width="80">
                <template #default="{ row }">{{ statusNames[row.status] }}</template>
              </el-table-column>
              <el-table-column label="异常类型" min-width="120">
                <template #default="{ row }">
                  <span v-if="row.anomalyType">{{ row.anomalyType.split(',').map(t => anomalyTypeNames[t] || t).join('、') }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>

            <h4>变动轨迹</h4>
            <el-timeline>
              <el-timeline-item
                v-for="log in reportData.logs"
                :key="log.id"
                :timestamp="formatTime(log.createTime)"
                placement="top"
              >
                <div class="report-log-item">
                  <el-tag size="small">{{ opsActionNames[log.action] || '未知' }}</el-tag>
                  <span v-if="log.handlerName" class="log-handler">{{ log.handlerName }}</span>
                  <span v-if="log.handleNote">{{ log.handleNote }}</span>
                  <span v-if="log.beforeFlowLevel !== log.afterFlowLevel" class="flow-change-highlight">
                    {{ flowLevelNames[log.beforeFlowLevel] }} → {{ flowLevelNames[log.afterFlowLevel] }}
                  </span>
                </div>
              </el-timeline-item>
            </el-timeline>

            <h4>用户行为溯源（近200条）</h4>
            <el-table :data="reportData.behaviors" size="small" border max-height="300">
              <el-table-column label="用户" width="120">
                <template #default="{ row }">{{ row.userName }}(ID:{{ row.userId }})</template>
              </el-table-column>
              <el-table-column label="行为" width="80">
                <template #default="{ row }">{{ dataTypeNames[row.behaviorType] || row.behaviorType }}</template>
              </el-table-column>
              <el-table-column label="IP" width="130" prop="ip" />
              <el-table-column label="异常" width="70">
                <template #default="{ row }">
                  <el-tag v-if="row.isAbnormal" type="danger" size="small">{{ row.abnormalType || '异常' }}</el-tag>
                  <span v-else class="text-gray">-</span>
                </template>
              </el-table-column>
              <el-table-column label="风险" width="70">
                <template #default="{ row }">
                  <el-tag :color="anomalyLevelColors[row.riskLevel]" effect="dark" size="small">{{ anomalyLevelNames[row.riskLevel] }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="170">
                <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="输入笔记ID并点击生成报表" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 权重变更弹窗 -->
    <el-dialog v-model="weightDialogVisible" title="权重联动变更" width="500px" class="weight-dialog">
      <div v-if="weightResult" class="weight-change-content">
        <el-result icon="success" title="权重联动已完成" :sub-title="`笔记 #${weightResult.noteId}`">
          <template #extra>
            <div class="weight-details">
              <div class="weight-row">
                <span>热度分值：</span><strong>{{ Number(weightResult.totalHotScore).toFixed(1) }}</strong>
              </div>
              <div class="weight-row">
                <span>流量池等级：</span>
                <el-tag :color="flowLevelColors[weightResult.flowLevel]" effect="dark">
                  {{ flowLevelNames[weightResult.flowLevel] }}
                </el-tag>
              </div>
              <div class="weight-row">
                <span>更新数据条数：</span><strong>{{ weightResult.updated }}</strong>
              </div>
            </div>
          </template>
        </el-result>
      </div>
    </el-dialog>

    <!-- 批量校准进度 -->
    <el-dialog v-model="progressVisible" title="批量操作进度" width="400px" :close-on-click-modal="false">
      <div class="progress-content">
        <el-progress :percentage="progressPercent" :status="progressStatus" :stroke-width="20" />
        <div class="progress-text">{{ progressText }}</div>
        <div v-if="progressStatus === 'success'" class="progress-success">
          <el-icon color="#67c23a" :size="24"><CircleCheckFilled /></el-icon>
          <span>操作完成</span>
        </div>
      </div>
    </el-dialog>

    <!-- 溯源弹窗 -->
    <el-dialog v-model="traceVisible" :title="`互动数据溯源 #${traceNoteId}`" width="900px" destroy-on-close>
      <div v-if="traceData" v-loading="traceLoading" class="trace-content">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="笔记标题">{{ traceData.note.title }}</el-descriptions-item>
          <el-descriptions-item label="作者">{{ traceData.note.authorName }}</el-descriptions-item>
          <el-descriptions-item label="流量池">
            <el-tag :color="flowLevelColors[traceData.note.flowLevel]" effect="dark" size="small">{{ flowLevelNames[traceData.note.flowLevel] }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-descriptions :column="4" border size="small" class="trace-summary">
          <el-descriptions-item label="真实互动">{{ traceData.summary.totalReal }}</el-descriptions-item>
          <el-descriptions-item label="虚假互动">
            <strong :class="{ 'danger-text': traceData.summary.totalFake > 0 }">{{ traceData.summary.totalFake }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="真实性">{{ traceData.summary.authenticityRatio }}%</el-descriptions-item>
          <el-descriptions-item label="唯一IP">{{ traceData.summary.uniqueIps }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="traceData.interactions" size="small" border class="trace-interactions">
          <el-table-column label="类型" width="80">
            <template #default="{ row }">{{ dataTypeNames[row.dataType] }}</template>
          </el-table-column>
          <el-table-column label="总数" width="60" prop="totalCount" align="center" />
          <el-table-column label="真实" width="60" prop="realCount" align="center" />
          <el-table-column label="虚假" width="60" align="center">
            <template #default="{ row }"><span :class="{ 'danger-text': row.fakeCount > 0 }">{{ row.fakeCount }}</span></template>
          </el-table-column>
          <el-table-column label="热度" width="70" align="center">
            <template #default="{ row }">{{ Number(row.hotScore).toFixed(1) }}</template>
          </el-table-column>
          <el-table-column label="权重" width="70" align="center">
            <template #default="{ row }">{{ Number(row.weightScore).toFixed(1) }}</template>
          </el-table-column>
          <el-table-column label="流量池" width="80">
            <template #default="{ row }">{{ flowLevelNames[row.flowLevel] }}</template>
          </el-table-column>
          <el-table-column label="异常" width="70">
            <template #default="{ row }">
              <el-tag v-if="row.isAnomaly > 0" :color="anomalyLevelColors[row.isAnomaly]" effect="dark" size="small">{{ anomalyLevelNames[row.isAnomaly] }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
        <el-timeline v-if="traceData.logs.length" class="trace-logs">
          <el-timeline-item v-for="log in traceData.logs" :key="log.id" :timestamp="formatTime(log.createTime)" placement="top">
            <el-tag size="small">{{ opsActionNames[log.action] }}</el-tag>
            <span v-if="log.handlerName" class="text-gray"> {{ log.handlerName }}</span>
            <span v-if="log.handleNote"> {{ log.handleNote }}</span>
            <span v-if="log.beforeFlowLevel !== log.afterFlowLevel" class="flow-change-highlight">
              {{ flowLevelNames[log.beforeFlowLevel] }} → {{ flowLevelNames[log.afterFlowLevel] }}
            </span>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <el-backtop :bottom="40" :right="40" :visibility-height="400" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, RefreshRight, Refresh, Delete, Aim, Star,
  DataAnalysis, CircleCheckFilled
} from '@element-plus/icons-vue'
import type { ElTable } from 'element-plus'
import type {
  InteractionData as InteractionDataType, InteractionOpsStats, InteractionTraceResult
} from '@/types/business'
import {
  InteractionDataType as DataTypeEnum,
  INTERACTION_DATA_TYPE_NAMES,
  INTERACTION_ANOMALY_LEVEL_NAMES,
  INTERACTION_ANOMALY_LEVEL_COLORS,
  INTERACTION_DATA_STATUS_NAMES,
  INTERACTION_DATA_STATUS_TAG_TYPES,
  INTERACTION_FLOW_LEVEL_NAMES,
  INTERACTION_FLOW_LEVEL_COLORS,
  INTERACTION_ANOMALY_TYPE_NAMES,
  INTERACTION_OPS_ACTION_NAMES
} from '@/enums/business'
import {
  getInteractionStats, getInteractionList,
  batchCalibrateInteraction, batchCleanFakeInteraction, batchMarkQualityInteraction,
  linkInteractionWeight, getInteractionTrace, getInteractionAnomalyLogs
} from '@/api/interaction-ops'

const dataTypeNames: Record<string, string> = INTERACTION_DATA_TYPE_NAMES
const anomalyLevelNames: Record<number, string> = INTERACTION_ANOMALY_LEVEL_NAMES
const anomalyLevelColors: Record<number, string> = INTERACTION_ANOMALY_LEVEL_COLORS
const statusNames: Record<number, string> = INTERACTION_DATA_STATUS_NAMES
const statusTagTypes: Record<number, string> = INTERACTION_DATA_STATUS_TAG_TYPES
const flowLevelNames: Record<number, string> = INTERACTION_FLOW_LEVEL_NAMES
const flowLevelColors: Record<number, string> = INTERACTION_FLOW_LEVEL_COLORS
const anomalyTypeNames: Record<string, string> = INTERACTION_ANOMALY_TYPE_NAMES
const opsActionNames: Record<number, string> = INTERACTION_OPS_ACTION_NAMES

const activeTab = ref('data')
const tableRef = ref<InstanceType<typeof ElTable>>()

const stats = ref<InteractionOpsStats>({
  total: 0, anomalyCount: 0, highAnomalyCount: 0, qualityCount: 0,
  calibratedCount: 0, zeroedCount: 0, todayAnomalyLogs: 0,
  anomalyRate: 0, avgHotScore: '0', flowDistribution: []
})

const statCards = computed(() => [
  { key: 'total', label: '数据总量', value: stats.value.total, type: 'total', suffix: '条' },
  { key: 'anomaly', label: '异常数据', value: stats.value.anomalyCount, type: 'danger', suffix: `异常率 ${stats.value.anomalyRate}%` },
  { key: 'high', label: '重度异常', value: stats.value.highAnomalyCount, type: 'risk', suffix: '条' },
  { key: 'quality', label: '优质标记', value: stats.value.qualityCount, type: 'quality', suffix: '条' },
  { key: 'calibrated', label: '已校准', value: stats.value.calibratedCount, type: 'cali', suffix: '条' },
  { key: 'zeroed', label: '已清零', value: stats.value.zeroedCount, type: 'zero', suffix: '条' },
  { key: 'todayLogs', label: '今日操作', value: stats.value.todayAnomalyLogs, type: 'ops', suffix: '条' },
  { key: 'avgHot', label: '平均热度', value: stats.value.avgHotScore, type: 'hot', suffix: '' }
])

function distPercent(count: number) {
  const total = stats.value.flowDistribution.reduce((s, i) => s + i.count, 0)
  return total > 0 ? (count / total * 100) : 0
}
function flowName(l: number) { return flowLevelNames[l] || '未知' }
function flowColor(l: number) { return flowLevelColors[l] || '#909399' }

const list = ref<InteractionDataType[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const selected = ref<InteractionDataType[]>([])
const filter = reactive({
  noteId: '', dataType: '', isAnomaly: undefined as number | undefined,
  status: undefined as number | undefined, flowLevel: undefined as number | undefined,
  isQuality: undefined as number | undefined
})

const calibrateLoading = ref(false)
const cleanLoading = ref(false)
const qualityLoading = ref(false)

const logsList = ref<any[]>([])
const logsTotal = ref(0)
const logsPage = ref(1)
const logsPageSize = ref(20)
const logsLoading = ref(false)

const weightDialogVisible = ref(false)
const weightResult = ref<any>(null)

const progressVisible = ref(false)
const progressPercent = ref(0)
const progressStatus = ref<'' | 'success' | 'exception' | 'warning'>('')
const progressText = ref('')

const traceVisible = ref(false)
const traceNoteId = ref<number | null>(null)
const traceData = ref<InteractionTraceResult | null>(null)
const traceLoading = ref(false)

const reportNoteId = ref('')
const reportLoading = ref(false)
const reportData = ref<InteractionTraceResult | null>(null)

function formatTime(t: string | Date | undefined) {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function parseAnomalyDetail(json: string): Record<string, any> {
  try { return JSON.parse(json) }
  catch { return {} }
}

function changeClass(before: number | null, after: number | null): string {
  if (before === null || after === null) return ''
  if (after > before) return 'change-up'
  if (after < before) return 'change-down'
  return ''
}

async function loadStats() {
  try { stats.value = await getInteractionStats() }
  catch { /* ignore */ }
}

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, pageSize: pageSize.value }
    if (filter.noteId) params.noteId = filter.noteId
    if (filter.dataType) params.dataType = filter.dataType
    if (filter.isAnomaly !== undefined) params.isAnomaly = filter.isAnomaly
    if (filter.status !== undefined) params.status = filter.status
    if (filter.flowLevel !== undefined) params.flowLevel = filter.flowLevel
    if (filter.isQuality !== undefined) params.isQuality = filter.isQuality
    const res = await getInteractionList(params)
    list.value = res.list
    total.value = res.total
  } finally { loading.value = false }
}

function resetFilter() {
  Object.assign(filter, { noteId: '', dataType: '', isAnomaly: undefined, status: undefined, flowLevel: undefined, isQuality: undefined })
  page.value = 1
  loadData()
}

async function loadLogs() {
  logsLoading.value = true
  try {
    const res = await getInteractionAnomalyLogs({ page: logsPage.value, pageSize: logsPageSize.value })
    logsList.value = res.list
    logsTotal.value = res.total
  } finally { logsLoading.value = false }
}

function onTabChange() {
  loadStats()
  if (activeTab.value === 'logs' && logsList.value.length === 0) loadLogs()
}

function onSelectionChange(rows: InteractionDataType[]) { selected.value = rows }

async function onBatchCalibrate() {
  if (selected.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确认批量校准 ${selected.value.length} 条互动数据？将保留真实有效数据`, '批量校准', { type: 'warning' })
    calibrateLoading.value = true
    showProgress(selected.value.length)
    const ids = selected.value.map(i => i.id)
    const r = await batchCalibrateInteraction(ids)
    progressPercent.value = 100
    progressStatus.value = 'success'
    progressText.value = `成功校准 ${r.success}/${r.total} 条`
    tableRef.value?.clearSelection()
    loadData(); loadStats()
  } catch { /* cancelled */ }
  finally { calibrateLoading.value = false; setTimeout(() => { progressVisible.value = false }, 1500) }
}

async function onBatchCleanFake() {
  if (selected.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确认批量清零 ${selected.value.length} 条数据中的虚假互动？此操作不可恢复`, '批量清零', { type: 'error' })
    cleanLoading.value = true
    showProgress(selected.value.length)
    const ids = selected.value.map(i => i.id)
    const r = await batchCleanFakeInteraction(ids)
    progressPercent.value = 100
    progressStatus.value = 'success'
    progressText.value = `成功清零 ${r.success}/${r.total} 条`
    tableRef.value?.clearSelection()
    loadData(); loadStats()
  } catch { /* cancelled */ }
  finally { cleanLoading.value = false; setTimeout(() => { progressVisible.value = false }, 1500) }
}

async function onBatchMarkQuality() {
  if (selected.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确认批量标记 ${selected.value.length} 条为优质互动？`, '批量标记优质', { type: 'success' })
    qualityLoading.value = true
    showProgress(selected.value.length)
    const ids = selected.value.map(i => i.id)
    const r = await batchMarkQualityInteraction(ids)
    progressPercent.value = 100
    progressStatus.value = 'success'
    progressText.value = `成功标记 ${r.success}/${r.total} 条`
    tableRef.value?.clearSelection()
    loadData(); loadStats()
  } catch { /* cancelled */ }
  finally { qualityLoading.value = false; setTimeout(() => { progressVisible.value = false }, 1500) }
}

function showProgress(count: number) {
  progressVisible.value = true
  progressPercent.value = 30
  progressStatus.value = ''
  progressText.value = `正在处理 ${count} 条数据...`
}

async function onLinkWeight(row: InteractionDataType) {
  try {
    const r = await linkInteractionWeight(row.noteId)
    weightResult.value = r
    weightDialogVisible.value = true
    loadData(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.message || '联动失败')
  }
}

async function onRefreshSingle(row: InteractionDataType) {
  try {
    await refreshInteractionDataFn(row.noteId)
    ElMessage.success('刷新成功')
    loadData(); loadStats()
  } catch (e: any) {
    ElMessage.error(e?.message || '刷新失败')
  }
}

async function refreshInteractionDataFn(noteId: number) {
  const { post } = await import('@utils/request')
  return post('/interaction-ops/refresh/' + noteId)
}

async function onViewTrace(row: InteractionDataType) {
  traceNoteId.value = row.noteId
  traceVisible.value = true
  traceData.value = null
  traceLoading.value = true
  try {
    traceData.value = await getInteractionTrace(row.noteId)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally { traceLoading.value = false }
}

async function onGenReport() {
  if (!reportNoteId.value) {
    ElMessage.warning('请输入笔记ID')
    return
  }
  reportLoading.value = true
  try {
    reportData.value = await getInteractionTrace(Number(reportNoteId.value))
  } catch (e: any) {
    ElMessage.error(e?.message || '生成报表失败')
  } finally { reportLoading.value = false }
}

onMounted(() => {
  loadStats()
  loadData()
})
</script>

<style lang="scss" scoped>
.interaction-ops-page {
  padding: 16px 20px 24px;

  .stats-row {
    margin-bottom: 14px;
    .stat-card {
      border-radius: 10px; border: 1px solid #ebeef5;
      transition: all 0.3s ease;
      .stat-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
      .stat-value { font-size: 24px; font-weight: 700; color: #303133; }
      .stat-suffix { font-size: 11px; color: #909399; margin-top: 2px; }
      &.stat-total .stat-value { color: #409eff; }
      &.stat-danger .stat-value { color: #f56c6c; }
      &.stat-risk .stat-value { color: #c45656; }
      &.stat-quality .stat-value { color: #67c23a; }
      &.stat-cali .stat-value { color: #e6a23c; }
      &.stat-zero .stat-value { color: #909399; }
      &.stat-ops .stat-value { color: #8e44ad; }
      &.stat-hot .stat-value { color: #f39c12; }
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    }
  }

  .flow-dist-row { margin-bottom: 14px; }
  .flow-dist-card {
    .flow-dist-bar { display: flex; height: 32px; border-radius: 16px; overflow: hidden; border: 1px solid #ebeef5; }
    .flow-dist-item { position: relative; display: flex; align-items: center; justify-content: center; min-width: 80px; }
    .dist-fill { position: absolute; inset: 0; opacity: 0.2; }
    .dist-label { position: relative; font-size: 12px; font-weight: 500; white-space: nowrap; }
  }

  .filter-card, .table-card { margin-bottom: 14px; }
  .filter-form { margin: 0; }

  .table-toolbar {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    .toolbar-left > * { margin-right: 8px; }
  }

  .skeleton-wrapper { padding: 0 10px; }

  .striped-table {
    :deep(.el-table__row:nth-child(even) > td) { background-color: #fafbfc; }
  }

  .note-id-link { color: #409eff; cursor: pointer; &:hover { text-decoration: underline; } }
  .real-count { color: #67c23a; }
  .anomaly-tag { font-size: 11px; }

  .anomaly-type-cell {
    display: flex; flex-wrap: wrap; gap: 4px;
    &.anomaly-red { padding: 3px 6px; border-radius: 4px; border: 1px solid #fbc4c4; background: #fef2f2; }
    .anomaly-type-tag { font-size: 11px; }
  }

  .anomaly-popover {
    .anomaly-detail-item { margin-bottom: 6px; font-size: 13px; }
    .detail-kv { color: #606266; }
  }

  .quality-weight { color: #e6a23c; font-weight: 600; }
  .quality-text { color: #67c23a; font-weight: 600; }
  .danger-text { color: #f56c6c; }
  .text-gray { color: #909399; }

  .table-pager { margin-top: 16px; text-align: right; }

  .logs-table .change-cell {
    display: flex; flex-wrap: wrap; gap: 6px; font-size: 12px;
    .change-up { color: #67c23a; }
    .change-down { color: #f56c6c; }
  }

  .report-toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
  .report-content {
    h3 { font-size: 16px; margin-bottom: 8px; }
    h4 { font-size: 14px; margin: 16px 0 8px; padding-left: 8px; border-left: 3px solid #409eff; }
    .report-meta { display: flex; gap: 20px; font-size: 13px; color: #909399; margin-bottom: 12px; }
  }
  .report-summary { margin-bottom: 16px; }

  .report-log-item {
    display: flex; align-items: center; gap: 8px;
    .log-handler { font-size: 12px; color: #909399; }
    .flow-change-highlight {
      font-weight: 600; color: #e6a23c;
      animation: float-up 0.5s ease-out;
    }
  }

  .weight-dialog .weight-details {
    .weight-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 14px; }
  }

  .progress-content { text-align: center; }
  .progress-text { margin-top: 12px; font-size: 14px; color: #606266; }
  .progress-success {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    margin-top: 10px; color: #67c23a; font-weight: 600;
  }

  .fade-status-enter-active, .fade-status-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
  .fade-status-enter-from, .fade-status-leave-to { opacity: 0; transform: scale(0.95); }

  @keyframes float-up {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes glow-border-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.15); }
    50% { box-shadow: 0 0 0 5px rgba(245, 108, 108, 0.15); }
  }

  .trace-content {
    .trace-summary { margin: 12px 0; }
    .trace-interactions { margin-bottom: 12px; }
    .trace-logs { margin-top: 12px; }
    .flow-change-highlight { font-weight: 600; color: #e6a23c; animation: float-up 0.5s ease-out; }
  }
}
</style>
