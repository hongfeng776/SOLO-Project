<template>
  <div class="dm-admin-page">
    <el-row :gutter="16" class="stats-row">
      <el-col :span="3" v-for="stat in statCards" :key="stat.key">
        <el-card shadow="hover" class="stat-card" :class="`stat-${stat.type}`">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
          <div v-if="stat.suffix" class="stat-suffix">{{ stat.suffix }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="main-tabs" @tab-change="onTabChange">
      <el-tab-pane label="消息管控" name="messages">
        <el-card shadow="never" class="filter-card">
          <el-form :inline="true" :model="msgFilter" class="filter-form" @submit.prevent>
            <el-form-item label="关键词">
              <el-input v-model="msgFilter.keyword" placeholder="搜索消息内容" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="消息状态">
              <el-select v-model="msgFilter.status" placeholder="全部" clearable style="width: 140px">
                <el-option label="待审核" :value="0" />
                <el-option label="已发送正常" :value="1" />
                <el-option label="已拦截" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="风险等级">
              <el-select v-model="msgFilter.riskLevel" placeholder="全部" clearable style="width: 120px">
                <el-option v-for="item in dmRiskOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="违规类型">
              <el-input v-model="msgFilter.violationType" placeholder="如：敏感词" clearable style="width: 140px" />
            </el-form-item>
            <el-form-item label="举报">
              <el-select v-model="msgFilter.isReported" placeholder="全部" clearable style="width: 110px">
                <el-option label="已举报" :value="1" />
                <el-option label="未举报" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="发送时间">
              <el-date-picker
                v-model="msgFilter.timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 360px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadMessages">搜索</el-button>
              <el-button :icon="RefreshRight" @click="resetMsgFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="table-card">
          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-button
                type="danger"
                :icon="Delete"
                :disabled="selectedMessages.length === 0"
                :loading="batchRemoveLoading"
                @click="onBatchRemoveMsg"
                v-ripple
              >批量清理违规 ({{ selectedMessages.length }})</el-button>
              <el-button
                type="warning"
                :icon="Warning"
                :disabled="selectedMessages.length === 0"
                @click="onBatchPunishMsg"
              >批量处罚账号</el-button>
              <el-button :icon="Refresh" @click="loadMessages">刷新</el-button>
            </div>
            <div class="toolbar-right">
              <el-tag type="info">共 {{ msgTotal }} 条消息</el-tag>
            </div>
          </div>

          <div v-if="msgLoading" class="skeleton-wrapper">
            <el-skeleton :rows="8" animated :throttle="200" />
          </div>
          <div v-else>
            <el-table
              ref="msgTableRef"
              :data="msgList"
              :row-class-name="getMessageRowClass"
              @selection-change="onMsgSelectionChange"
              @row-dblclick="onMsgDblClick"
              class="msg-table dm-striped-table"
              v-loading="msgLoading"
            >
              <el-table-column type="selection" width="50" reserve-selection />
              <el-table-column label="发送者" width="170">
                <template #default="{ row }">
                  <div class="sender-cell">
                    <el-avatar :src="row.senderAvatar" :size="32">{{ row.senderName.charAt(0) }}</el-avatar>
                    <div class="sender-info">
                      <div class="sender-name">{{ row.senderName }}</div>
                      <div class="sender-id">ID:{{ row.senderId }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="接收者" width="170">
                <template #default="{ row }">
                  <div class="sender-cell">
                    <el-avatar :src="row.receiverAvatar" :size="32">{{ row.receiverName.charAt(0) }}</el-avatar>
                    <div class="sender-info">
                      <div class="sender-name">{{ row.receiverName }}</div>
                      <div class="sender-id">ID:{{ row.receiverId }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="消息内容" min-width="280" show-overflow-tooltip>
                <template #default="{ row }">
                  <div
                    class="content-cell"
                    :class="{
                      'violation-content': row.status === 2 || row.riskLevel >= 2,
                      'pending-content': row.status === 0
                    }"
                  >
                    <span v-html="computeHighlight(row.content, row.sensitiveWords)"></span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <transition name="fade-status">
                    <el-tag :type="dmStatusTagType(row.status)" effect="light">
                      {{ dmStatusName(row.status) }}
                    </el-tag>
                  </transition>
                </template>
              </el-table-column>
              <el-table-column label="风险" width="90">
                <template #default="{ row }">
                  <el-tag :color="dmRiskColor(row.riskLevel)" effect="dark" class="risk-tag">
                    {{ dmRiskName(row.riskLevel) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="违规类型" width="130">
                <template #default="{ row }">
                  <span v-if="row.violationType" class="violation-type-text">{{ row.violationType }}</span>
                  <span v-else class="text-gray">-</span>
                </template>
              </el-table-column>
              <el-table-column label="举报" width="70">
                <template #default="{ row }">
                  <el-badge v-if="row.reportCount > 0" :value="row.reportCount" class="badge-report">
                    <el-icon :size="18" color="#e6a23c"><WarningFilled /></el-icon>
                  </el-badge>
                  <span v-else class="text-gray">-</span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="170">
                <template #default="{ row }">
                  <div class="time-cell">{{ formatTime(row.createTime) }}</div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="260" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="onViewMsgTrace(row)">溯源</el-button>
                  <el-button link type="primary" @click="onViewConversation(row)">会话</el-button>
                  <el-button link type="warning" @click="onPunishMsg(row)">处罚</el-button>
                  <el-button link type="danger" @click="onRemoveMsg(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              class="table-pager"
              layout="total, sizes, prev, pager, next, jumper"
              :total="msgTotal"
              :current-page="msgPage"
              :page-size="msgPageSize"
              :page-sizes="[20, 50, 100, 200]"
              @current-change="p => { msgPage = p; loadMessages() }"
              @size-change="s => { msgPageSize = s; msgPage = 1; loadMessages() }"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="会话管控" name="conversations">
        <el-card shadow="never" class="filter-card">
          <el-form :inline="true" :model="convFilter" class="filter-form">
            <el-form-item label="搜索">
              <el-input v-model="convFilter.keyword" placeholder="用户名" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="风险等级">
              <el-select v-model="convFilter.riskLevel" placeholder="全部" clearable style="width: 120px">
                <el-option v-for="item in dmRiskOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="会话状态">
              <el-select v-model="convFilter.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="已封禁" :value="0" />
                <el-option label="正常" :value="1" />
                <el-option label="已限制" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="违规次数 ≥">
              <el-input-number v-model="convFilter.violationMin" :min="0" :max="50" :step="1" style="width: 130px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadConversations">搜索</el-button>
              <el-button :icon="RefreshRight" @click="resetConvFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="table-card">
          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-button
                type="danger"
                :icon="Delete"
                :disabled="selectedConversations.length === 0"
                @click="onBatchCleanConv"
              >批量清理会话</el-button>
              <el-button
                type="warning"
                :icon="Lock"
                :disabled="selectedConversations.length === 0"
                @click="onBatchRestrictConv"
              >批量封禁会话</el-button>
              <el-button
                type="success"
                :icon="Unlock"
                :disabled="selectedConversations.length === 0"
                @click="onBatchUnrestrictConv"
              >批量解除限制</el-button>
              <el-button :icon="Refresh" @click="loadConversations">刷新</el-button>
            </div>
            <div class="toolbar-right">
              <el-tag type="info">共 {{ convTotal }} 个会话</el-tag>
            </div>
          </div>

          <div v-if="convLoading" class="skeleton-wrapper">
            <el-skeleton :rows="6" animated :throttle="200" />
          </div>
          <div v-else>
            <el-table
              :data="convList"
              class="conv-table dm-striped-table"
              @selection-change="onConvSelectionChange"
              @row-dblclick="onConvDblClick"
              v-loading="convLoading"
            >
              <el-table-column type="selection" width="50" />
              <el-table-column label="参与者" min-width="280">
                <template #default="{ row }">
                  <div class="conv-participants">
                    <div class="participant">
                      <el-avatar :src="row.participantAAvatar" :size="36">{{ row.participantAName.charAt(0) }}</el-avatar>
                      <div class="p-info">
                        <div class="p-name">{{ row.participantAName }}</div>
                        <div class="p-id">ID:{{ row.participantAId }}</div>
                      </div>
                    </div>
                    <el-icon class="conv-arrow"><Right /></el-icon>
                    <div class="participant">
                      <el-avatar :src="row.participantBAvatar" :size="36">{{ row.participantBName.charAt(0) }}</el-avatar>
                      <div class="p-info">
                        <div class="p-name">{{ row.participantBName }}</div>
                        <div class="p-id">ID:{{ row.participantBId }}</div>
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="最后消息" min-width="240" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="last-msg">
                    <div class="last-content">
                      <span v-html="computeHighlight(row.lastMessageContent)"></span>
                    </div>
                    <div class="last-time">{{ row.lastMessageTime ? formatTime(row.lastMessageTime) : '-' }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="消息数" width="90" align="center">
                <template #default="{ row }"><strong>{{ row.messageCount }}</strong></template>
              </el-table-column>
              <el-table-column label="违规数" width="90" align="center">
                <template #default="{ row }">
                  <strong :class="{ 'danger-text': row.violationCount >= 5 }">{{ row.violationCount }}</strong>
                </template>
              </el-table-column>
              <el-table-column label="风险" width="90">
                <template #default="{ row }">
                  <el-tag :color="dmRiskColor(row.riskLevel)" effect="dark">{{ dmRiskName(row.riskLevel) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <transition name="fade-status">
                    <el-tag :type="dmConvStatusTagType(row.status)" effect="light">
                      {{ dmConvStatusName(row.status) }}
                    </el-tag>
                  </transition>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="260" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="onViewConversationDetail(row)">查看记录</el-button>
                  <el-button link type="primary" @click="onViewConvTrace(row)">溯源</el-button>
                  <el-button
                    link
                    :type="row.status === 1 ? 'warning' : 'success'"
                    @click="onToggleConvRestrict(row)"
                  >{{ row.status === 1 ? '封禁' : '解除' }}</el-button>
                  <el-button link type="danger" @click="onCleanConv(row)">清理</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              class="table-pager"
              layout="total, sizes, prev, pager, next, jumper"
              :total="convTotal"
              :current-page="convPage"
              :page-size="convPageSize"
              :page-sizes="[20, 50, 100]"
              @current-change="p => { convPage = p; loadConversations() }"
              @size-change="s => { convPageSize = s; convPage = 1; loadConversations() }"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="发送测试" name="send">
        <el-card shadow="never" class="send-card">
          <el-form :model="sendForm" :rules="sendRules" ref="sendFormRef" label-width="100px" class="send-form">
            <el-form-item label="发送者ID" prop="senderId">
              <el-input-number v-model="sendForm.senderId" :min="1" style="width: 200px" />
            </el-form-item>
            <el-form-item label="接收者ID" prop="receiverId">
              <el-input-number v-model="sendForm.receiverId" :min="1" style="width: 200px" />
            </el-form-item>
            <el-form-item label="消息内容" prop="content">
              <el-input
                v-model="sendForm.content"
                type="textarea"
                :rows="5"
                placeholder="输入私信发送内容，将实时进行合规校验"
                maxlength="1000"
                show-word-limit
                @input="onContentInput"
                :class="{ 'input-red-border': sendCheckResult && !sendCheckResult.canSend }"
              />
            </el-form-item>
            <el-form-item label="实时校验">
              <div class="compliance-result">
                <div v-if="sendCheckLoading" class="checking">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span>合规校验中...</span>
                </div>
                <div v-else-if="sendCheckResult && !sendCheckResult.canSend" class="check-fail">
                  <el-alert type="error" :closable="false" show-icon>
                    <template #title>
                      <div>发送已被拦截，原因：</div>
                      <ul class="violation-list">
                        <li v-for="(v, i) in sendCheckResult.violations" :key="i">
                          <strong>{{ v.typeName }}：</strong>{{ v.message }}
                        </li>
                      </ul>
                      <div v-if="sendCheckResult.recommendedPunishment" class="recommended-punish">
                        <el-tag type="danger" size="small">
                          建议处罚：{{ sendCheckResult.recommendedPunishment.typeName }}
                          （{{ sendCheckResult.recommendedPunishment.reason }}）
                        </el-tag>
                      </div>
                    </template>
                  </el-alert>
                </div>
                <div v-else-if="sendCheckResult && sendCheckResult.passed" class="check-pass">
                  <el-alert type="success" :closable="false" show-icon title="内容合规，可正常发送" />
                </div>
                <div v-else class="check-default">
                  <span class="text-gray">输入内容将自动进行合规校验</span>
                </div>
                <div class="sender-status">
                  <span>当前发送次数：<strong :class="dailyCountDangerClass">{{ dailyCountText }}</strong></span>
                </div>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :icon="Promotion"
                :disabled="!canSendBtn"
                :loading="sendLoading"
                @click="onSend"
              >发送私信</el-button>
              <el-button
                type="success"
                :icon="View"
                @click="onShowHighlightPreview"
                :disabled="!sendForm.content"
              >高亮预览</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 消息溯源弹窗 -->
    <el-dialog
      v-model="traceVisible"
      :title="`消息溯源 #${curTraceMessageId}`"
      width="900px"
      destroy-on-close
      class="trace-dialog"
    >
      <div v-if="traceData" class="trace-content">
        <el-descriptions :column="2" border class="trace-desc">
          <el-descriptions-item label="消息ID">{{ traceData.message.id }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ formatTime(traceData.message.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="消息状态">
            <el-tag :type="dmStatusTagType(traceData.message.status)">{{ dmStatusName(traceData.message.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :color="dmRiskColor(traceData.riskAnalysis.finalRiskLevel)" effect="dark">
              {{ dmRiskName(traceData.riskAnalysis.finalRiskLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="消息内容" :span="2">
            <div class="trace-msg-content" v-html="computeHighlight(traceData.message.content, traceData.message.sensitiveWords)"></div>
          </el-descriptions-item>
        </el-descriptions>

        <el-row :gutter="16" class="trace-rows">
          <el-col :span="12">
            <el-card shadow="never" class="mini-card">
              <template #header>
                <div class="card-header"><el-icon><User /></el-icon> 发送方信息</div>
              </template>
              <div v-if="traceData.sender" class="user-card">
                <div class="user-row"><span>昵称：</span><strong>{{ traceData.sender.nickname }}</strong></div>
                <div class="user-row"><span>账号：</span>{{ traceData.sender.username }}</div>
                <div class="user-row"><span>用户ID：</span>{{ traceData.sender.id }}</div>
                <div class="user-row">
                  <span>用户风险：</span>
                  <el-tag :color="dmRiskColor(traceData.sender.riskLevel)" effect="dark" size="small">
                    {{ dmRiskName(traceData.sender.riskLevel) }}
                  </el-tag>
                </div>
                <div class="user-row">
                  <span>累计违规：</span>
                  <strong :class="{'danger-text': traceData.sender.violationCount >= 3}">
                    {{ traceData.sender.violationCount }}次
                  </strong>
                </div>
                <div class="user-row" v-if="traceData.sender.isPermanentBanned">
                  <el-tag type="danger">永久封禁账号</el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="mini-card">
              <template #header>
                <div class="card-header"><el-icon><Monitor /></el-icon> 设备 & IP信息</div>
              </template>
              <div class="device-card">
                <el-popover placement="top" :width="260" trigger="hover" v-if="traceData.device.ip">
                  <template #reference>
                    <div class="device-row pointer"><span>发送IP：</span><strong class="highlight">{{ traceData.device.ip }}</strong></div>
                  </template>
                  <div>同IP发送数量：<strong>{{ traceData.riskAnalysis.sameIpCount }}</strong></div>
                  <div class="text-gray">（24小时内统计）</div>
                </el-popover>
                <div v-else class="device-row"><span>发送IP：</span>-</div>
                <el-popover placement="top" :width="380" trigger="hover" v-if="traceData.device.userAgent">
                  <template #reference>
                    <div class="device-row pointer"><span>User-Agent：</span><span class="text-gray truncate">{{ traceData.device.userAgent.substring(0, 30) }}...</span></div>
                  </template>
                  <div style="font-size: 12px; word-break: break-all;">{{ traceData.device.userAgent }}</div>
                </el-popover>
                <div v-else class="device-row"><span>User-Agent：</span>-</div>
                <div class="device-row"><span>设备信息：</span>{{ traceData.device.deviceInfo || '-' }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="mini-card risk-card" :class="{'risk-high-card': traceData.riskAnalysis.isAbnormal}">
          <template #header>
            <div class="card-header">
              <el-icon><Warning /></el-icon> 风险分析
              <el-tag v-if="traceData.riskAnalysis.isAbnormal" type="danger" size="small" style="margin-left: 8px">存在异常</el-tag>
              <el-tag v-else type="success" size="small" style="margin-left: 8px">未发现异常</el-tag>
            </div>
          </template>
          <div class="risk-grid">
            <div class="risk-item"><span>24h发送量</span><strong>{{ traceData.riskAnalysis.user24hMessageCount }}</strong></div>
            <div class="risk-item"><span>相同内容数</span><strong>{{ traceData.riskAnalysis.sameContentCount }}</strong></div>
            <div class="risk-item"><span>同IP发送量</span><strong>{{ traceData.riskAnalysis.sameIpCount }}</strong></div>
            <div class="risk-item"><span>1h对该用户</span><strong>{{ traceData.riskAnalysis.sameSenderToReceiver1h }}</strong></div>
            <div class="risk-item"><span>被该接收方举报</span><strong>{{ traceData.riskAnalysis.reportedByReceiver }}</strong></div>
            <div class="risk-item"><span>累计被举报</span><strong>{{ traceData.riskAnalysis.senderTotalReported }}</strong></div>
          </div>
          <div v-if="traceData.riskAnalysis.reasons.length > 0" class="risk-reasons">
            <div class="label">风险原因：</div>
            <div v-for="(r, i) in traceData.riskAnalysis.reasons" :key="i" class="reason-item">
              <el-icon color="#f56c6c"><WarningFilled /></el-icon>
              <span>{{ r }}</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="mini-card" v-if="traceData.auditLogs.length > 0">
          <template #header>
            <div class="card-header"><el-icon><Tickets /></el-icon> 审核日志 ({{ traceData.auditLogs.length }})</div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="log in traceData.auditLogs"
              :key="log.id"
              :timestamp="formatTime(log.createTime)"
              placement="top"
            >
              <div class="log-item">
                <el-tag size="small">{{ dmAuditActionName(log.action) }}</el-tag>
                <span v-if="log.handlerName" class="log-handler">操作人：{{ log.handlerName }}</span>
                <span v-if="log.violationType" class="log-vtype">违规：{{ log.violationType }}</span>
                <div v-if="log.violationDetail" class="log-detail">{{ log.violationDetail }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </el-dialog>

    <!-- 会话记录弹窗 -->
    <el-dialog
      v-model="convDialogVisible"
      :title="`会话详情 #${curConvId}`"
      width="880px"
      destroy-on-close
      class="conv-dialog"
    >
      <div v-if="convDetailData" class="conv-detail">
        <div class="conv-header">
          <div class="conv-participants-inline">
            <el-avatar :src="convDetailData.participants.userA?.avatar" :size="32">{{ convDetailData.participants.userA?.nickname.charAt(0) }}</el-avatar>
            <span class="p-name">{{ convDetailData.participants.userA?.nickname }}</span>
            <el-icon><Right /></el-icon>
            <el-avatar :src="convDetailData.participants.userB?.avatar" :size="32">{{ convDetailData.participants.userB?.nickname.charAt(0) }}</el-avatar>
            <span class="p-name">{{ convDetailData.participants.userB?.nickname }}</span>
          </div>
          <div class="conv-status-inline">
            <el-tag :type="dmConvStatusTagType(curConvStatus)" size="small">{{ dmConvStatusName(curConvStatus) }}</el-tag>
            <el-button
              link
              :type="curConvStatus === 1 ? 'warning' : 'success'"
              @click="onToggleCurConvRestrict"
            >{{ curConvStatus === 1 ? '封禁会话' : '解除封禁' }}</el-button>
          </div>
        </div>
        <div class="risk-flags" v-if="convDetailData.riskFlags.length > 0">
          <el-tag v-for="(f, i) in convDetailData.riskFlags" :key="i" type="warning" effect="dark" class="risk-flag-tag">
            {{ f }}
          </el-tag>
        </div>
        <el-descriptions :column="4" border size="small" class="conv-stats">
          <el-descriptions-item label="消息总数">{{ convDetailData.stats.totalMessages }}</el-descriptions-item>
          <el-descriptions-item label="拦截数">{{ convDetailData.stats.interceptionCount }}</el-descriptions-item>
          <el-descriptions-item label="高风险消息">{{ convDetailData.stats.riskMsgCount }}</el-descriptions-item>
          <el-descriptions-item label="不同IP数">{{ convDetailData.stats.uniqueIps }}</el-descriptions-item>
          <el-descriptions-item label="峰值/小时">{{ convDetailData.stats.maxHourly }}</el-descriptions-item>
          <el-descriptions-item label="平均/小时">{{ convDetailData.stats.avgPerHour.toFixed(1) }}</el-descriptions-item>
          <el-descriptions-item label="A方违规">
            <el-tag v-if="convDetailData.participants.userA" size="small"
              :color="dmRiskColor(convDetailData.participants.userA.riskLevel)" effect="dark">
              {{ convDetailData.participants.userA.violationCount }}次
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="B方违规">
            <el-tag v-if="convDetailData.participants.userB" size="small"
              :color="dmRiskColor(convDetailData.participants.userB.riskLevel)" effect="dark">
              {{ convDetailData.participants.userB.violationCount }}次
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="chat-area" v-loading="convMsgsLoading">
          <div
            v-for="msg in convDetailData.messages"
            :key="msg.id"
            class="chat-bubble-row"
            :class="{
              'is-sender-a': msg.senderId === convDetailData.conversation.participantAId,
              'is-risk': msg.riskLevel >= 2,
              'is-intercepted': msg.intercepted === 1
            }"
          >
            <el-avatar
              :size="28"
              :src="msg.senderId === convDetailData.conversation.participantAId
                ? convDetailData.participants.userA?.avatar
                : convDetailData.participants.userB?.avatar"
              class="chat-avatar"
            >
              {{ msg.senderName.charAt(0) }}
            </el-avatar>
            <div class="chat-wrapper">
              <div class="chat-meta">
                <span class="chat-name">{{ msg.senderName }}</span>
                <span class="chat-time">{{ formatTime(msg.createTime) }}</span>
                <el-tag
                  v-if="msg.intercepted === 1"
                  type="danger" size="small" effect="dark"
                  class="chat-tag"
                >已拦截</el-tag>
                <el-tag
                  v-else-if="msg.riskLevel >= 2"
                  :color="dmRiskColor(msg.riskLevel)" size="small" effect="dark"
                  class="chat-tag"
                >{{ dmRiskName(msg.riskLevel) }}</el-tag>
              </div>
              <div
                class="chat-bubble"
                :class="{
                  'bubble-danger': msg.status === 2 || msg.riskLevel >= 2,
                  'bubble-pending': msg.status === 0
                }"
              >
                <span v-html="computeHighlight(msg.content, msg.sensitiveWords)"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 处罚弹窗 -->
    <el-dialog
      v-model="punishVisible"
      :title="punishDialogTitle"
      width="560px"
      destroy-on-close
    >
      <el-form :model="punishForm" label-width="110px">
        <el-form-item label="处罚账号">
          <div class="punish-user-info">
            <el-avatar :src="punishUserAvatar" :size="36">{{ punishUserName.charAt(0) }}</el-avatar>
            <div>
              <div class="user-name-row">
                <strong>{{ punishUserName }}</strong>
                <el-tag size="small" type="info">ID: {{ punishUserId }}</el-tag>
              </div>
              <div class="text-gray">将执行私信功能处罚</div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="处罚类型" required>
          <el-select v-model="punishForm.type" placeholder="选择处罚类型" style="width: 100%">
            <el-option
              v-for="item in punishTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时长（分钟）">
          <el-input-number v-model="punishForm.duration" :min="0" :max="999999" style="width: 100%" />
          <div class="form-tip text-gray">0 表示永久或即时生效</div>
        </el-form-item>
        <el-form-item label="违规类型">
          <el-input v-model="punishForm.violationType" placeholder="如：敏感词、引流" />
        </el-form-item>
        <el-form-item label="处罚原因" required>
          <el-input v-model="punishForm.reason" type="textarea" :rows="3" placeholder="详细说明处罚原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="punishVisible = false">取消</el-button>
        <el-button type="primary" :loading="punishLoading" @click="onConfirmPunish">
          确认处罚
        </el-button>
      </template>
    </el-dialog>

    <!-- 高亮预览弹窗 -->
    <el-dialog v-model="highlightVisible" title="敏感词高亮预览" width="600px">
      <div class="highlight-preview">
        <span v-for="(p, i) in highlightParts" :key="i"
          :class="{'sensitive-highlight': p.isSensitive}">{{ p.text }}</span>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Search, RefreshRight, Refresh, Delete, Warning, Lock, Unlock,
  Right, User, Monitor, Tickets, View, Promotion, Loading, WarningFilled
} from '@element-plus/icons-vue'
import type { ElTable, FormInstance, FormRules } from 'element-plus'
import type {
  DirectMessage, DmConversation, DmComplianceCheckResult, DmStats,
  DmMessageTraceResult, DmConversationTraceResult, DmAuditLogItem, HighlightPart, DmPunishment
} from '@/types/business'
import {
  DirectMessageStatus, DM_STATUS_NAMES, DM_STATUS_TAG_TYPES,
  DmRiskLevel, DM_RISK_LEVEL_NAMES, DM_RISK_LEVEL_COLORS,
  DmConversationStatus, DM_CONVERSATION_STATUS_NAMES, DM_CONVERSATION_STATUS_TAG_TYPES,
  DmPunishmentType, DM_PUNISHMENT_TYPE_NAMES, DM_PUNISHMENT_DURATIONS,
  DmAuditAction, DM_AUDIT_ACTION_NAMES
} from '@/enums/business'
import {
  getDmStats, getDmMessageList, getDmConversationList,
  sendDmMessage, deleteDmMessage, batchRemoveDmMessages,
  punishDmAccount, restrictDmConversation,
  getDmMessageTrace, getDmConversationTrace, getDmConversationMessages,
  checkDmCompliance, highlightDmContent
} from '@/api/direct-message'

const activeTab = ref('messages')
const msgTableRef = ref<InstanceType<typeof ElTable>>()
const sendFormRef = ref<FormInstance>()

// 统计卡片
const stats = ref<DmStats>({
  total: 0, todayNew: 0, intercepted: 0, pending: 0, riskHigh: 0, reported: 0,
  conversations: 0, riskConversations: 0, interceptionRate: 0, riskRate: 0
})
const statCards = computed(() => [
  { key: 'total', label: '消息总数', value: stats.value.total, type: 'total', suffix: '条' },
  { key: 'todayNew', label: '今日新增', value: stats.value.todayNew, type: 'new', suffix: '条' },
  { key: 'intercepted', label: '已拦截', value: stats.value.intercepted, type: 'danger', suffix: `拦截率 ${stats.value.interceptionRate}%` },
  { key: 'pending', label: '待审核', value: stats.value.pending, type: 'warn', suffix: '条' },
  { key: 'riskHigh', label: '高风险消息', value: stats.value.riskHigh, type: 'risk', suffix: `风险率 ${stats.value.riskRate}%` },
  { key: 'reported', label: '被举报消息', value: stats.value.reported, type: 'report', suffix: '条' },
  { key: 'conversations', label: '会话总数', value: stats.value.conversations, type: 'conv', suffix: '个' },
  { key: 'riskConversations', label: '风险会话', value: stats.value.riskConversations, type: 'risk-conv', suffix: '个' }
])

// 消息列表
const msgList = ref<DirectMessage[]>([])
const msgTotal = ref(0)
const msgPage = ref(1)
const msgPageSize = ref(20)
const msgLoading = ref(false)
const selectedMessages = ref<DirectMessage[]>([])
const msgFilter = reactive({
  keyword: '',
  status: undefined as number | undefined,
  riskLevel: undefined as number | undefined,
  violationType: '',
  isReported: undefined as number | undefined,
  timeRange: [] as string[]
})

// 会话列表
const convList = ref<DmConversation[]>([])
const convTotal = ref(0)
const convPage = ref(1)
const convPageSize = ref(20)
const convLoading = ref(false)
const selectedConversations = ref<DmConversation[]>([])
const convFilter = reactive({
  keyword: '',
  riskLevel: undefined as number | undefined,
  status: undefined as number | undefined,
  violationMin: 0
})

// 发送
const sendForm = reactive({
  senderId: 1,
  receiverId: 2,
  content: ''
})
const sendRules: FormRules = {
  senderId: [{ required: true, message: '请输入发送者ID', trigger: 'blur' }],
  receiverId: [{ required: true, message: '请输入接收者ID', trigger: 'blur' }],
  content: [{ required: true, message: '请输入发送内容', trigger: 'blur' }]
}
const sendCheckResult = ref<DmComplianceCheckResult | null>(null)
const sendCheckLoading = ref(false)
const sendLoading = ref(false)
const highlightVisible = ref(false)
const highlightParts = ref<HighlightPart[]>([])

const canSendBtn = computed(() => {
  if (!sendForm.content || !sendForm.senderId || !sendForm.receiverId) return false
  if (sendCheckLoading.value) return false
  if (sendCheckResult.value && sendCheckResult.value.senderStatus?.isDmRestricted) return false
  if (sendCheckResult.value && sendCheckResult.value.senderStatus?.isBanned) return false
  if (sendCheckResult.value && sendCheckResult.value.senderStatus?.dailyLimit > 0
    && sendCheckResult.value.senderStatus.dailyCount >= sendCheckResult.value.senderStatus.dailyLimit) return false
  return true
})
const dailyCountText = computed(() => {
  if (!sendCheckResult.value) return '-'
  const s = sendCheckResult.value.senderStatus
  return `${s.dailyCount} / ${s.dailyLimit}`
})
const dailyCountDangerClass = computed(() => {
  if (!sendCheckResult.value) return ''
  const s = sendCheckResult.value.senderStatus
  const ratio = s.dailyLimit > 0 ? s.dailyCount / s.dailyLimit : 0
  return ratio >= 0.8 ? 'danger-text' : (ratio >= 0.5 ? 'warn-text' : '')
})

// 溯源
const traceVisible = ref(false)
const curTraceMessageId = ref<number | null>(null)
const traceData = ref<DmMessageTraceResult | null>(null)

// 会话详情
const convDialogVisible = ref(false)
const curConvId = ref<number | null>(null)
const curConvStatus = ref(1)
const convDetailData = ref<DmConversationTraceResult | null>(null)
const convMsgsLoading = ref(false)

// 处罚
const punishVisible = ref(false)
const punishLoading = ref(false)
const batchRemoveLoading = ref(false)
const punishUserId = ref(0)
const punishUserName = ref('用户')
const punishUserAvatar = ref('')
const punishIsBatch = ref(false)
const punishBatchIds = ref<number[]>([])
const punishForm = reactive({
  type: DmPunishmentType.TEMP_RESTRICT_DM,
  duration: DM_PUNISHMENT_DURATIONS[DmPunishmentType.TEMP_RESTRICT_DM],
  reason: '',
  violationType: ''
})
const punishTypeOptions = computed(() => Object.entries(DM_PUNISHMENT_TYPE_NAMES).map(([value, label]) => ({ value, label })))
const punishDialogTitle = computed(() => punishIsBatch.value
  ? `批量处罚账号 (${punishBatchIds.value.length}个)`
  : `处罚账号：${punishUserName.value}`
)

watch(() => punishForm.type, (type) => {
  punishForm.duration = DM_PUNISHMENT_DURATIONS[type] || 0
})

// 工具方法
function dmStatusName(s: number) { return DM_STATUS_NAMES[s] || '未知' }
function dmStatusTagType(s: number) { return DM_STATUS_TAG_TYPES[s] || 'info' }
function dmRiskName(l: number) { return DM_RISK_LEVEL_NAMES[l] || '正常' }
function dmRiskColor(l: number) { return DM_RISK_LEVEL_COLORS[l] || '#67c23a' }
function dmConvStatusName(s: number) { return DM_CONVERSATION_STATUS_NAMES[s] || '未知' }
function dmConvStatusTagType(s: number) { return DM_CONVERSATION_STATUS_TAG_TYPES[s] || 'info' }
function dmAuditActionName(a: number) { return DM_AUDIT_ACTION_NAMES[a] || '未知操作' }

const dmRiskOptions = computed(() => Object.entries(DM_RISK_LEVEL_NAMES).map(([v, l]) => ({ value: Number(v), label: l })))

function formatTime(t: string | Date | undefined) {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function computeHighlight(text: string, sensitiveWords?: string): string {
  if (!text) return ''
  const escaped = text.replace(/[&<>"']/g, (m: string) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  } as Record<string, string>)[m])
  if (!sensitiveWords) return escaped
  const words = sensitiveWords.split(',').filter(Boolean)
  if (words.length === 0) return escaped
  const pattern = words
    .map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    .join('|')
  const re = new RegExp(`(${pattern})`, 'gi')
  return escaped.replace(re, '<span class="sensitive-highlight">$1</span>')
}

function getMessageRowClass({ row }: { row: DirectMessage }) {
  const classes: string[] = []
  if (row.riskLevel >= 2 || row.status === 2) classes.push('row-risk-high')
  else if (row.riskLevel === 1) classes.push('row-risk-low')
  if (row.status === 2) classes.push('row-intercepted')
  return classes.join(' ')
}

// 加载方法
async function loadStats() {
  try { stats.value = await getDmStats() }
  catch { /* ignore */ }
}

async function loadMessages() {
  msgLoading.value = true
  try {
    const params: Record<string, unknown> = { page: msgPage.value, pageSize: msgPageSize.value }
    if (msgFilter.keyword) params.keyword = msgFilter.keyword
    if (msgFilter.status !== undefined) params.status = msgFilter.status
    if (msgFilter.riskLevel !== undefined) params.riskLevel = msgFilter.riskLevel
    if (msgFilter.violationType) params.violationType = msgFilter.violationType
    if (msgFilter.isReported !== undefined) params.isReported = msgFilter.isReported
    if (msgFilter.timeRange?.length === 2) {
      params.startTime = msgFilter.timeRange[0]
      params.endTime = msgFilter.timeRange[1]
    }
    const res = await getDmMessageList(params)
    msgList.value = res.list
    msgTotal.value = res.total
  } finally {
    msgLoading.value = false
  }
}

function resetMsgFilter() {
  Object.assign(msgFilter, {
    keyword: '', status: undefined, riskLevel: undefined,
    violationType: '', isReported: undefined, timeRange: []
  })
  msgPage.value = 1
  loadMessages()
}

async function loadConversations() {
  convLoading.value = true
  try {
    const params: Record<string, unknown> = { page: convPage.value, pageSize: convPageSize.value }
    if (convFilter.keyword) params.keyword = convFilter.keyword
    if (convFilter.riskLevel !== undefined) params.riskLevel = convFilter.riskLevel
    if (convFilter.status !== undefined) params.status = convFilter.status
    if (convFilter.violationMin > 0) params.violationMin = convFilter.violationMin
    const res = await getDmConversationList(params)
    convList.value = res.list
    convTotal.value = res.total
  } finally { convLoading.value = false }
}

function resetConvFilter() {
  Object.assign(convFilter, { keyword: '', riskLevel: undefined, status: undefined, violationMin: 0 })
  convPage.value = 1
  loadConversations()
}

function onTabChange() {
  loadStats()
  if (activeTab.value === 'messages' && msgList.value.length === 0) loadMessages()
  if (activeTab.value === 'conversations' && convList.value.length === 0) loadConversations()
}

function onMsgSelectionChange(rows: DirectMessage[]) { selectedMessages.value = rows }
function onConvSelectionChange(rows: DmConversation[]) { selectedConversations.value = rows }

// 操作方法
async function onRemoveMsg(row: DirectMessage) {
  try {
    await ElMessageBox.confirm(`确认删除该私信？删除后将记入操作日志`, '删除私信', { type: 'warning' })
    await deleteDmMessage(row.id)
    ElMessage.success('删除成功')
    loadMessages(); loadStats()
  } catch (e) { /* cancelled */ }
}

async function onBatchRemoveMsg() {
  if (selectedMessages.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认批量清理 ${selectedMessages.value.length} 条消息？此操作不可恢复`,
      '批量清理',
      { type: 'error' }
    )
    batchRemoveLoading.value = true
    const ids = selectedMessages.value.map(m => m.id)
    const r = await batchRemoveDmMessages(ids)
    ElMessage.success(`成功清理 ${r.success}/${r.total} 条`)
    msgTableRef.value?.clearSelection()
    loadMessages(); loadStats()
  } catch (e) { /* cancelled */ }
  finally { batchRemoveLoading.value = false }
}

async function onCleanConv(row: DmConversation) {
  try {
    await ElMessageBox.confirm(`将会话 #${row.id} 中所有违规消息删除？`, '清理会话', { type: 'warning' })
    const messages = (await getDmConversationMessages(row.id, { page: 1, pageSize: 500 })).list
    const toRemove = messages.filter(m => m.status === 2 || m.riskLevel >= 2).map(m => m.id)
    if (toRemove.length === 0) {
      ElMessage.info('未发现违规消息，无需清理')
      return
    }
    const r = await batchRemoveDmMessages(toRemove)
    ElMessage.success(`已清理 ${r.success} 条违规消息`)
    loadConversations(); loadStats()
  } catch { /* cancelled */ }
}

async function onBatchCleanConv() {
  if (selectedConversations.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认批量清理 ${selectedConversations.value.length} 个会话中的违规消息？`,
      '批量清理会话',
      { type: 'warning' }
    )
    let total = 0
    for (const conv of selectedConversations.value) {
      try {
        const messages = (await getDmConversationMessages(conv.id, { page: 1, pageSize: 500 })).list
        const toRemove = messages.filter(m => m.status === 2 || m.riskLevel >= 2).map(m => m.id)
        if (toRemove.length > 0) {
          const r = await batchRemoveDmMessages(toRemove)
          total += r.success
        }
      } catch { /* per conv ignore */ }
    }
    ElMessage.success(`共清理 ${total} 条违规消息`)
    loadConversations(); loadStats()
  } catch { /* cancelled */ }
}

async function onToggleConvRestrict(row: DmConversation) {
  const restrict = row.status === DmConversationStatus.NORMAL
  const text = restrict ? '封禁' : '解除'
  try {
    await ElMessageBox.confirm(`确认${text}会话 #${row.id} ？`, `${text}会话`, { type: 'warning' })
    await restrictDmConversation({
      conversationId: row.id, restrict, reason: `人工${text}会话`
    })
    ElMessage.success(`会话已${text}`)
    loadConversations(); loadStats()
  } catch { /* cancelled */ }
}

async function onBatchRestrictConv() {
  if (selectedConversations.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认批量封禁 ${selectedConversations.value.length} 个会话？`,
      '批量封禁会话',
      { type: 'error' }
    )
    for (const conv of selectedConversations.value) {
      try {
        await restrictDmConversation({ conversationId: conv.id, restrict: true, reason: '批量封禁会话' })
      } catch { /* ignore */ }
    }
    ElMessage.success('批量封禁完成')
    loadConversations(); loadStats()
  } catch { /* cancelled */ }
}

async function onBatchUnrestrictConv() {
  if (selectedConversations.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认批量解除 ${selectedConversations.value.length} 个会话限制？`,
      '批量解除',
      { type: 'warning' }
    )
    for (const conv of selectedConversations.value) {
      try {
        await restrictDmConversation({ conversationId: conv.id, restrict: false, reason: '批量解除限制' })
      } catch { /* ignore */ }
    }
    ElMessage.success('批量解除完成')
    loadConversations()
  } catch { /* cancelled */ }
}

async function onToggleCurConvRestrict() {
  if (curConvId.value == null) return
  const restrict = curConvStatus.value === DmConversationStatus.NORMAL
  const text = restrict ? '封禁' : '解除'
  try {
    await restrictDmConversation({ conversationId: curConvId.value, restrict, reason: `人工${text}` })
    curConvStatus.value = restrict ? DmConversationStatus.BANNED : DmConversationStatus.NORMAL
    ElMessage.success(`会话已${text}`)
    onViewConversationDetail({ id: curConvId.value } as DmConversation)
    loadConversations(); loadStats()
  } catch (e) { /* ignore */ }
}

async function onPunishMsg(row: DirectMessage) {
  punishIsBatch.value = false
  punishUserId.value = row.senderId
  punishUserName.value = row.senderName
  punishUserAvatar.value = row.senderAvatar
  punishBatchIds.value = []
  punishForm.violationType = row.violationType || ''
  punishForm.reason = row.violationDetail || '私信违规'
  punishVisible.value = true
}

function onBatchPunishMsg() {
  if (selectedMessages.value.length === 0) return
  const users = new Map<number, { name: string; avatar: string }>()
  selectedMessages.value.forEach(m => {
    if (!users.has(m.senderId)) users.set(m.senderId, { name: m.senderName, avatar: m.senderAvatar })
  })
  const ids = Array.from(users.keys())
  punishIsBatch.value = true
  punishUserId.value = ids[0] || 0
  punishUserName.value = ids.length > 1 ? `${ids.length}个用户` : (users.get(ids[0])?.name || '')
  punishUserAvatar.value = users.get(ids[0])?.avatar || ''
  punishBatchIds.value = ids
  punishForm.violationType = selectedMessages.value[0]?.violationType || ''
  punishForm.reason = '批量私信违规处罚'
  punishVisible.value = true
}

async function onConfirmPunish() {
  if (!punishForm.type || !punishForm.reason) {
    ElMessage.warning('请选择处罚类型并填写原因')
    return
  }
  punishLoading.value = true
  try {
    const punishment: DmPunishment = {
      type: punishForm.type,
      typeName: DM_PUNISHMENT_TYPE_NAMES[punishForm.type] || punishForm.type,
      duration: punishForm.duration,
      reason: punishForm.reason
    }
    let success = 0
    if (punishIsBatch.value) {
      for (const uid of punishBatchIds.value) {
        try {
          await punishDmAccount({
            userId: uid, punishment,
            related: { violationType: punishForm.violationType, reason: punishForm.reason }
          })
          success++
        } catch { /* ignore */ }
      }
      ElMessage.success(`成功处罚 ${success}/${punishBatchIds.value.length} 个账号`)
      ElNotification({
        title: '处罚已生效',
        message: `批量处罚：${punishment.typeName}`,
        type: 'warning',
        duration: 3000
      })
    } else {
      await punishDmAccount({
        userId: punishUserId.value, punishment,
        related: { violationType: punishForm.violationType, reason: punishForm.reason }
      })
      ElMessage.success('处罚已执行')
      ElNotification({
        title: `${punishment.typeName} 已生效`,
        message: `用户：${punishUserName.value} - ${punishment.reason}`,
        type: 'warning',
        duration: 4000
      })
    }
    punishVisible.value = false
    loadStats(); loadMessages()
  } catch (e: any) {
    ElMessage.error(e?.message || '执行失败')
  } finally { punishLoading.value = false }
}

// 溯源 & 查看
async function onViewMsgTrace(row: DirectMessage) {
  curTraceMessageId.value = row.id
  traceVisible.value = true
  traceData.value = null
  try { traceData.value = await getDmMessageTrace(row.id) }
  catch (e: any) { ElMessage.error(e?.message || '加载失败') }
}

function onMsgDblClick(row: DirectMessage) { onViewMsgTrace(row) }

async function onViewConversationDetail(row: DmConversation) {
  curConvId.value = row.id
  curConvStatus.value = row.status
  convDialogVisible.value = true
  convDetailData.value = null
  convMsgsLoading.value = true
  try {
    convDetailData.value = await getDmConversationTrace(row.id)
    curConvStatus.value = convDetailData.value.conversation.status
  } catch (e: any) { ElMessage.error(e?.message || '加载失败') }
  finally { convMsgsLoading.value = false }
}

async function onViewConversation(row: DirectMessage) {
  const conv: DmConversation = { id: row.conversationId } as DmConversation
  curConvId.value = row.conversationId
  convDialogVisible.value = true
  convDetailData.value = null
  convMsgsLoading.value = true
  try {
    convDetailData.value = await getDmConversationTrace(row.conversationId)
    curConvStatus.value = convDetailData.value.conversation.status
  } catch (e: any) { ElMessage.error(e?.message || '加载失败') }
  finally { convMsgsLoading.value = false }
}

function onConvDblClick(row: DmConversation) { onViewConversationDetail(row) }

async function onViewConvTrace(row: DmConversation) {
  curConvId.value = row.id
  curConvStatus.value = row.status
  convDialogVisible.value = true
  convDetailData.value = null
  convMsgsLoading.value = true
  try {
    convDetailData.value = await getDmConversationTrace(row.id)
    curConvStatus.value = convDetailData.value.conversation.status
  } catch (e: any) { ElMessage.error(e?.message || '加载失败') }
  finally { convMsgsLoading.value = false }
}

// 发送 & 校验
let debounceTimer: number | null = null
function onContentInput() {
  if (!sendForm.content || !sendForm.senderId || !sendForm.receiverId) {
    sendCheckResult.value = null
    return
  }
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(async () => {
    sendCheckLoading.value = true
    try {
      sendCheckResult.value = await checkDmCompliance({
        content: sendForm.content,
        senderId: sendForm.senderId,
        receiverId: sendForm.receiverId
      })
    } finally { sendCheckLoading.value = false }
  }, 300)
}

async function onShowHighlightPreview() {
  try {
    highlightParts.value = await highlightDmContent(sendForm.content)
    highlightVisible.value = true
  } catch { /* ignore */ }
}

async function onSend() {
  try {
    await sendFormRef.value?.validate()
  } catch { return }
  sendLoading.value = true
  try {
    const r = await sendDmMessage({
      senderId: sendForm.senderId,
      receiverId: sendForm.receiverId,
      content: sendForm.content,
      contentType: 1
    })
    if (r.intercepted) {
      ElNotification({
        title: '私信已拦截',
        message: `违规类型：${r.complianceResult.violations.map(v => v.typeName).join('、')}`,
        type: 'error',
        duration: 5000
      })
    } else {
      ElMessage.success('发送成功')
      if (r.punishment) {
        ElNotification({
          title: `已触发处罚：${r.punishment.typeName}`,
          message: r.punishment.reason,
          type: 'warning',
          duration: 5000
        })
      }
    }
    // 刷新校验结果
    onContentInput()
    loadStats(); loadMessages(); loadConversations()
  } catch (e: any) {
    ElMessage.error(e?.message || '发送失败')
  } finally { sendLoading.value = false }
}

onMounted(() => {
  loadStats()
  loadMessages()
  loadConversations()
})
</script>

<style lang="scss" scoped>
.dm-admin-page {
  padding: 16px 20px 24px;

  .stats-row {
    margin-bottom: 16px;
    .stat-card {
      border-radius: 10px;
      border: 1px solid #ebeef5;
      transition: all 0.3s ease;
      .stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
      .stat-value { font-size: 26px; font-weight: 700; line-height: 1.3; color: #303133; }
      .stat-suffix { font-size: 12px; color: #909399; margin-top: 4px; }

      &.stat-total .stat-value { color: #409eff; }
      &.stat-new .stat-value { color: #67c23a; }
      &.stat-danger .stat-value { color: #f56c6c; }
      &.stat-warn .stat-value { color: #e6a23c; }
      &.stat-risk .stat-value { color: #c45656; }
      &.stat-report .stat-value { color: #e6a23c; }
      &.stat-conv .stat-value { color: #8e44ad; }
      &.stat-risk-conv .stat-value { color: #d63031; }

      &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    }
  }

  .main-tabs {
    :deep(.el-tabs__header) { margin-bottom: 16px; }
  }

  .filter-card, .table-card, .send-card {
    margin-bottom: 16px;
  }

  .filter-form { margin: 0; }

  .table-toolbar {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 14px;
    .toolbar-left > * { margin-right: 8px; }
  }

  .skeleton-wrapper { padding: 0 10px; }

  .dm-striped-table {
    :deep(.el-table__row:nth-child(even) > td) { background-color: #fafbfc; }
  }

  .msg-table, .conv-table {
    .sender-cell {
      display: flex; align-items: center; gap: 10px;
      .sender-info .sender-name { font-weight: 500; font-size: 13px; }
      .sender-id { font-size: 11px; color: #909399; margin-top: 2px; }
    }
    .content-cell {
      font-size: 13px; line-height: 1.6;
      &.violation-content {
        padding: 4px 8px; border-radius: 4px;
        border: 1px solid #fbc4c4;
        background: linear-gradient(135deg, #fef2f2, #fff);
        animation: glow-border-red 2s ease-in-out infinite;
      }
      &.pending-content { color: #b88230; }
    }
    .violation-type-text { color: #c45656; font-weight: 500; font-size: 12px; }
    .time-cell { font-size: 12px; color: #909399; font-family: monospace; }
    .badge-report { margin-right: 0; }
    .risk-tag { font-size: 12px; }

    &:deep(.el-table__row) {
      transition: background-color 0.3s ease;
      &.row-risk-high > td {
        background-color: #fef2f2 !important;
      }
      &.row-risk-low > td {
        background-color: #fdf6ec !important;
      }
      &.row-intercepted > td {
        border-top: 1px dashed #f56c6c;
        border-bottom: 1px dashed #f56c6c;
      }
    }
  }

  .conv-table {
    .conv-participants {
      display: flex; align-items: center; gap: 6px;
      .participant { display: flex; align-items: center; gap: 8px; }
      .conv-arrow { color: #c0c4cc; }
      .p-info .p-name { font-weight: 500; font-size: 13px; }
      .p-info .p-id { font-size: 11px; color: #909399; }
    }
    .last-msg {
      .last-content { font-size: 13px; }
      .last-time { font-size: 11px; color: #909399; margin-top: 3px; }
    }
    .danger-text { color: #f56c6c; }
  }

  .table-pager { margin-top: 16px; text-align: right; }

  .send-card {
    .input-red-border :deep(.el-textarea__inner) {
      border: 2px solid #f56c6c;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
      &:focus {
        box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.15);
      }
    }
    .compliance-result {
      min-height: 60px;
      .checking {
        display: flex; align-items: center; gap: 8px; color: #909399;
        .el-icon { font-size: 16px; color: #409eff; }
      }
      .check-default { padding: 8px 0; }
      .sender-status { margin-top: 12px; font-size: 13px;
        .danger-text { color: #f56c6c; }
        .warn-text { color: #e6a23c; }
      }
      .violation-list {
        margin: 6px 0 8px 0; padding-left: 20px;
        li { margin: 2px 0; font-size: 13px; }
      }
      .recommended-punish { margin-top: 8px; }
    }
  }

  .trace-dialog {
    .trace-desc { margin-bottom: 16px; }
    .trace-msg-content {
      font-size: 13px; line-height: 1.6; padding: 10px; background: #f5f7fa; border-radius: 6px;
    }
    .trace-rows { margin: 16px 0; }
    .mini-card {
      &:not(:last-child) { margin-bottom: 16px; }
      .card-header {
        display: flex; align-items: center; font-weight: 600; gap: 6px;
        font-size: 14px;
      }
    }
    .user-card, .device-card {
      font-size: 13px;
      .user-row, .device-row {
        padding: 4px 0; display: flex; align-items: center; gap: 6px;
        span:first-child { color: #909399; width: 90px; flex-shrink: 0; }
        .highlight { color: #409eff; font-family: monospace; }
        .pointer { cursor: pointer; &:hover { background: #f5f7fa; border-radius: 4px; } }
        .truncate {
          display: inline-block; max-width: 220px; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap; vertical-align: middle;
        }
      }
      .danger-text { color: #f56c6c; }
    }
    .risk-card {
      border-left: 3px solid #67c23a;
      &.risk-high-card { border-left-color: #f56c6c; background: #fff7f7; }
      .risk-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        margin: 8px 0 12px;
        .risk-item {
          background: #fff; padding: 8px 12px; border-radius: 6px;
          display: flex; flex-direction: column; gap: 4px;
          border: 1px solid #ebeef5;
          span { font-size: 12px; color: #909399; }
          strong { font-size: 18px; color: #303133; }
        }
      }
      .risk-reasons {
        padding: 10px 12px; background: #fff; border-radius: 6px; border: 1px solid #fbc4c4;
        .label { font-weight: 600; margin-bottom: 6px; color: #c45656; }
        .reason-item {
          display: flex; align-items: center; gap: 6px; padding: 3px 0; font-size: 13px;
        }
      }
    }
    .log-item {
      .el-tag { margin-right: 8px; }
      .log-handler, .log-vtype {
        font-size: 12px; color: #909399; margin-right: 10px;
      }
      .log-detail {
        font-size: 12px; color: #606266; margin-top: 4px;
      }
    }
  }

  .conv-dialog {
    .conv-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 0 14px; border-bottom: 1px solid #ebeef5; margin-bottom: 14px;
      .conv-participants-inline {
        display: flex; align-items: center; gap: 10px;
        .p-name { font-weight: 500; }
        .el-icon { color: #c0c4cc; }
      }
      .conv-status-inline { display: flex; align-items: center; gap: 10px; }
    }
    .risk-flags { margin-bottom: 14px; .risk-flag-tag { margin-right: 6px; } }
    .conv-stats { margin-bottom: 14px; }

    .chat-area {
      max-height: 480px; overflow-y: auto; padding: 12px 8px;
      background: #fafbfc; border-radius: 10px; border: 1px solid #ebeef5;
    }
    .chat-bubble-row {
      display: flex; gap: 10px; padding: 10px 4px; margin-bottom: 8px;
      border-radius: 8px; transition: background 0.3s ease;

      &.is-sender-a {
        background: #ecf5ff;
        .chat-bubble { background: #fff; border: 1px solid #dbe8ff; }
      }
      &:not(.is-sender-a) {
        background: #f0f9eb;
        .chat-bubble { background: #fff; border: 1px solid #d4ead5; }
      }
      &.is-risk {
        background: #fef2f2;
        .chat-bubble { border-color: #fbc4c4; }
      }
      &.is-intercepted {
        background: repeating-linear-gradient(
          45deg, #fef2f2, #fef2f2 10px, #ffe0e0 10px, #ffe0e0 20px
        );
      }

      .chat-avatar { flex-shrink: 0; margin-top: 4px; }
      .chat-wrapper { flex: 1; min-width: 0; }
      .chat-meta {
        display: flex; align-items: center; gap: 10px; margin-bottom: 4px;
        .chat-name { font-weight: 500; font-size: 13px; }
        .chat-time { font-size: 11px; color: #909399; font-family: monospace; }
        .chat-tag { flex-shrink: 0; }
      }
      .chat-bubble {
        display: inline-block; padding: 8px 12px; border-radius: 10px;
        font-size: 13px; line-height: 1.6;
        &.bubble-danger {
          background: #fff2f2; border: 1px dashed #f56c6c;
          animation: glow-border-red 2.5s ease-in-out infinite;
        }
        &.bubble-pending { background: #fdf6ec; color: #b88230; }
      }
    }
  }

  .punish-user-info {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; background: #f5f7fa; border-radius: 8px;
    .user-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  }
  .form-tip { font-size: 12px; margin-top: 4px; }

  .highlight-preview {
    font-size: 15px; line-height: 1.8; padding: 16px; background: #fff;
    border-radius: 8px; border: 1px solid #ebeef5;
  }

  // 通用状态过渡动画
  .fade-status-enter-active, .fade-status-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .fade-status-enter-from, .fade-status-leave-to {
    opacity: 0; transform: scale(0.95);
  }

  // 红色边框发光动画 - 违规消息提示
  @keyframes glow-border-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.15); }
    50% { box-shadow: 0 0 0 5px rgba(245, 108, 108, 0.15); }
  }

  .danger-text { color: #f56c6c; }
  .warn-text { color: #e6a23c; }
  .text-gray { color: #909399; }
}
</style>