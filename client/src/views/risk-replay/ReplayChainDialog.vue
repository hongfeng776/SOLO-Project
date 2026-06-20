<template>
  <el-dialog
    :model-value="visible"
    title="风控事件处理链路溯源"
    width="960px"
    :close-on-click-modal="true"
    class="chain-dialog"
    @update:model-value="handleUpdateVisible"
  >
    <div v-if="event" class="chain-wrapper">
      <div class="event-summary-card">
        <div class="esc-left">
          <div class="esc-event-id">
            <el-icon><Warning /></el-icon>
            <span class="id-label">事件编号</span>
            <strong>{{ event.eventId }}</strong>
            <el-tag
              size="small"
              :color="getRiskLevelBg(event.riskLevel)"
              effect="light"
              style="margin-left: 8px"
            >
              {{ RISK_LEVEL_LABELS[event.riskLevel as CustomerRiskLevel] || '中风险' }}
            </el-tag>
          </div>
          <div class="esc-row">
            <span class="esc-k">客户：</span>
            <span class="esc-v">{{ event.customerName }}（{{ event.customerAccount }}）</span>
            <span class="esc-sep">|</span>
            <span class="esc-k">异常类型：</span>
            <span class="esc-v" :style="{ color: '#C0392B' }">
              {{ INTERCEPTION_TYPE_LABELS[event.exceptionType as keyof typeof INTERCEPTION_TYPE_LABELS] || '异常交易' }}
            </span>
            <span class="esc-sep">|</span>
            <span class="esc-k">涉及金额：</span>
            <span class="esc-v" :style="{ color: '#8E44AD', fontWeight: 600 }">
              ¥{{ formatThousands(event.involvedAmount || 0) }}
            </span>
          </div>
        </div>
        <div class="esc-right">
          <div class="esc-effect-tag" :style="effectStyle(event.interceptionEffect)">
            <el-icon><CircleCheckFilled /></el-icon>
            {{ INTERCEPTION_EFFECT_LABELS[event.interceptionEffect as InterceptionEffectiveness] || '处理中' }}
          </div>
          <div class="esc-time-info">
            <el-icon><Clock /></el-icon>
            发生：{{ event.occurredAt }}
          </div>
        </div>
      </div>

      <div class="chain-section-title">
        <el-icon color="#2980B9"><Connection /></el-icon>
        8 节点处理链路
        <span class="cst-hint">共 {{ chainNodes.length }} 个环节，总耗时 {{ totalDuration }}</span>
      </div>

      <div class="timeline-chain">
        <div
          v-for="(node, idx) in chainNodes"
          :key="node.key"
          class="chain-node"
          :class="{
            'is-done': node.status === 'done',
            'is-active': node.status === 'active',
            'is-pending': node.status === 'pending',
            'is-skipped': node.status === 'skipped',
          }"
        >
          <div class="node-top-row">
            <div class="node-badge" :style="{ background: nodeColor(node) }">
              <el-icon v-if="node.status === 'done'"><Check /></el-icon>
              <el-icon v-else-if="node.status === 'active'" class="node-active-pulse"><Loading /></el-icon>
              <el-icon v-else-if="node.status === 'skipped'"><Close /></el-icon>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <div class="node-arrow" v-if="idx < chainNodes.length - 1">
              <div class="arrow-line" />
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="node-body">
            <div class="node-title" :style="{ color: node.status === 'pending' ? '#b4bcc4' : '#2c3e50' }">
              {{ node.label }}
            </div>
            <div class="node-meta">
              <el-tag v-if="node.channel !== undefined" size="small" effect="plain" :color="HANDLE_CHANNEL_COLORS[node.channel]">
                {{ HANDLE_CHANNEL_LABELS[node.channel] }}
              </el-tag>
              <span v-if="node.operator" class="nm-operator">
                <el-icon><User /></el-icon>{{ node.operator }}
              </span>
            </div>
            <div class="node-time" v-if="node.time">
              <el-icon><Timer /></el-icon>
              {{ node.time }}
            </div>
            <div class="node-desc">{{ node.description }}</div>
            <div class="node-validity" v-if="node.validity">
              <el-tag
                size="small"
                effect="light"
                :color="RULE_VALIDITY_COLORS[node.validity.status as RuleValidityStatus] + '1A'"
                style="border: none"
              >
                <span :style="{ color: RULE_VALIDITY_COLORS[node.validity.status as RuleValidityStatus] }">
                  <el-icon><MagicStick /></el-icon>
                  {{ RULE_VALIDITY_LABELS[node.validity.status as RuleValidityStatus] }}
                </span>
              </el-tag>
              <span class="nv-score">匹配度 {{ node.validity.matchScore }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="info-grid-row">
        <div class="info-panel compliance-panel">
          <div class="ip-header" style="border-bottom-color: #16A085">
            <el-icon color="#16A085"><DocumentChecked /></el-icon>
            <h4>合规校验报告</h4>
            <el-tag
              size="small"
              :type="compliancePassed ? 'success' : 'danger'"
              effect="light"
            >{{ compliancePassed ? '通过' : '不通过' }}</el-tag>
          </div>
          <ul class="check-list">
            <li v-for="c in complianceChecks" :key="c.key" class="check-item">
              <el-icon :color="c.passed ? '#27AE60' : '#E74C3C'">
                <component :is="c.passed ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
              </el-icon>
              <span class="ci-name">{{ c.name }}</span>
              <span class="ci-desc">{{ c.desc }}</span>
              <el-tag v-if="!c.passed" type="danger" size="small" effect="plain">
                需复核
              </el-tag>
            </li>
          </ul>
        </div>

        <div class="info-panel dedup-panel">
          <div class="ip-header" style="border-bottom-color: '#8E44AD'">
            <el-icon color="#8E44AD"><CopyDocument /></el-icon>
            <h4>重复数据与无效数据检测</h4>
            <el-tag size="small" type="info" effect="light">已拦截 {{ dedupResult.interceptedCount }} 条</el-tag>
          </div>
          <div class="dedup-stats">
            <div class="ds-block">
              <div class="ds-label">重复事件</div>
              <div class="ds-value" :style="{ color: dedupResult.dupCount > 0 ? '#E74C3C' : '#27AE60' }">
                {{ dedupResult.dupCount }} 条
              </div>
            </div>
            <div class="ds-block">
              <div class="ds-label">无效记录</div>
              <div class="ds-value" :style="{ color: dedupResult.invalidCount > 0 ? '#F39C12' : '#27AE60' }">
                {{ dedupResult.invalidCount }} 条
              </div>
            </div>
            <div class="ds-block">
              <div class="ds-label">数据缺口</div>
              <div class="ds-value" :style="{ color: dedupResult.gapCount > 0 ? '#8E44AD' : '#27AE60' }">
                {{ dedupResult.gapCount }} 次
              </div>
            </div>
          </div>
          <div class="dedup-note">
            <el-icon color="#2980B9"><InfoFilled /></el-icon>
            <span>本链路涉及的 <strong>{{ chainNodes.filter(n => n.status === 'done').length }} 个节点</strong> 均已通过指纹去重检测，未影响最终复盘统计口径</span>
          </div>
        </div>
      </div>

      <div class="info-panel rule-evidence-panel">
        <div class="ip-header" style="border-bottom-color: '#2980B9'">
          <el-icon color="#2980B9"><DataLine /></el-icon>
          <h4>规则落地证据链</h4>
          <span class="re-sub">共匹配 {{ ruleEvidence.length }} 条风控规则，其中生效 {{ ruleEvidence.filter(r => r.applied).length }} 条</span>
        </div>
        <el-table :data="ruleEvidence" size="small" stripe style="width: 100%">
          <el-table-column prop="ruleCode" label="规则编号" width="140" />
          <el-table-column prop="ruleName" label="规则名称" />
          <el-table-column label="生效情况" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.applied ? 'success' : 'info'" effect="plain">
                {{ row.applied ? '已触发' : '未命中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="threshold" label="阈值条件" width="220" />
          <el-table-column prop="actualValue" label="实际值" width="120">
            <template #default="{ row }">
              <span :style="{ color: row.breached ? '#E74C3C' : '#27AE60', fontWeight: 600 }">{{ row.actualValue }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="impactWeight" label="影响权重" width="90">
            <template #default="{ row }">
              <el-progress :percentage="row.impactWeight" :stroke-width="4" :show-text="false" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div v-else class="chain-empty">
      <el-empty description="请选择风控事件查看链路" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleUpdateVisible(false)">关闭</el-button>
        <el-button type="primary" @click="handleCopyLink">
          <el-icon><Link /></el-icon>
          复制链路编号
        </el-button>
        <el-button type="warning" @click="handleExportChain">
          <el-icon><Download /></el-icon>
          导出链路报告
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Warning, Clock, Connection, Check, Loading, Close, ArrowRight,
  User, Timer, MagicStick, DocumentChecked, CopyDocument,
  DataLine, InfoFilled, Link, Download, CircleCheckFilled,
} from '@element-plus/icons-vue'
import {
  InterceptionEffectiveness,
  HandleChannel,
  RuleValidityStatus,
  CustomerRiskLevel,
} from '@/enums'
import {
  INTERCEPTION_EFFECT_LABELS, INTERCEPTION_EFFECT_COLORS, INTERCEPTION_EFFECT_BG_COLORS,
  HANDLE_CHANNEL_LABELS, HANDLE_CHANNEL_COLORS,
  RULE_VALIDITY_LABELS, RULE_VALIDITY_COLORS,
  RISK_LEVEL_LABELS,
  INTERCEPTION_TYPE_LABELS,
} from '@/constants/dictionaries'
import type { IReplayEvent } from '@/types/api'

interface IProps {
  visible: boolean
  event?: IReplayEvent | null
}

const props = withDefaults(defineProps<IProps>(), {
  visible: false,
  event: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

interface IChainNode {
  key: string
  label: string
  status: 'done' | 'active' | 'pending' | 'skipped'
  time?: string
  operator?: string
  channel?: HandleChannel
  description: string
  validity?: { status: RuleValidityStatus; matchScore: number }
}

const chainNodes = ref<IChainNode[]>([])

const totalDuration = computed(() => {
  const base = props.event?.avgHandleTime || 2.4
  return `${base.toFixed(1)} 小时`
})

const compliancePassed = computed(() => complianceChecks.value.every((c) => c.passed))
const complianceChecks = ref([
  { key: 'auth', name: '操作人员权限', passed: true, desc: '具备对应处理权限' },
  { key: 'sla', name: '时效合规', passed: true, desc: '节点处理均在 SLA 内完成' },
  { key: 'segregation', name: '岗位分离', passed: true, desc: '审核与复核非同一人' },
  { key: 'audit', name: '审计留痕', passed: true, desc: '关键操作已记录日志' },
  { key: 'escalate', name: '升级审批', passed: false, desc: '高危事件缺少二级审批记录' },
])

const dedupResult = reactive({
  interceptedCount: 14,
  dupCount: 0,
  invalidCount: 1,
  gapCount: 0,
})

const ruleEvidence = ref([
  { ruleCode: 'R-RT-0023', ruleName: '日内回转交易频次监测', applied: true, threshold: '> 20 次/日', actualValue: '37 次', breached: true, impactWeight: 35 },
  { ruleCode: 'R-RT-0041', ruleName: '反向交易比例限制', applied: true, threshold: '反向占比 > 60%', actualValue: '68%', breached: true, impactWeight: 28 },
  { ruleCode: 'R-MON-0017', ruleName: '单票持仓集中度', applied: false, threshold: '> 40%', actualValue: '22%', breached: false, impactWeight: 18 },
  { ruleCode: 'R-MON-0029', ruleName: '大额委托金额监测', applied: true, threshold: '> 200 万', actualValue: '¥358 万', breached: true, impactWeight: 19 },
])

function buildChainNodes() {
  if (!props.event) {
    chainNodes.value = []
    return
  }
  const baseTime = props.event.occurredAt ? props.event.occurredAt.replace('T', ' ').slice(0, 16) : '2025-02-14 09:32'
  const addMin = (s: string, m: number) => {
    try {
      const d = new Date(s.replace(/-/g, '/'))
      d.setMinutes(d.getMinutes() + m)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch { return s }
  }

  const effect = props.event.interceptionEffect as InterceptionEffectiveness
  const appealed = props.event.appealed === true || props.event.recurCount && props.event.recurCount > 0

  chainNodes.value = [
    {
      key: 'trigger', label: '规则触发', status: 'done',
      time: baseTime,
      operator: '风控引擎',
      channel: HandleChannel.SYSTEM_AUTO,
      description: '实时监测到异常交易特征，命中 3 条风控规则',
      validity: { status: RuleValidityStatus.FULLY_EFFECTIVE, matchScore: 97 },
    },
    {
      key: 'precheck', label: '智能预审', status: 'done',
      time: addMin(baseTime, 1),
      operator: 'AI预审模型',
      channel: HandleChannel.SYSTEM_AUTO,
      description: '自动关联客户画像与历史行为，预判风险等级中高',
      validity: { status: RuleValidityStatus.PARTIALLY_EFFECTIVE, matchScore: 82 },
    },
    {
      key: 'intercept', label: '交易拦截', status: 'done',
      time: addMin(baseTime, 2),
      operator: '交易网关',
      channel: HandleChannel.SYSTEM_AUTO,
      description: `已拦截委托订单 2 笔，冻结金额 ¥${formatThousands(props.event.involvedAmount || 0)}`,
      validity: { status: effect === InterceptionEffectiveness.OVER_INTERCEPTED ? RuleValidityStatus.OVERLY_AGGRESSIVE : RuleValidityStatus.FULLY_EFFECTIVE, matchScore: effect === InterceptionEffectiveness.OVER_INTERCEPTED ? 64 : 94 },
    },
    {
      key: 'review1', label: '一级人工审核', status: 'done',
      time: addMin(baseTime, 18),
      operator: '张晓峰',
      channel: HandleChannel.MANUAL_FIRST,
      description: '核实为对敲行为，维持拦截结论并提交复核',
      validity: { status: RuleValidityStatus.FULLY_EFFECTIVE, matchScore: 90 },
    },
    {
      key: 'review2', label: '二级人工复核', status: props.event.riskLevel === CustomerRiskLevel.CRITICAL || props.event.riskLevel === CustomerRiskLevel.HIGH ? 'done' : 'skipped',
      time: props.event.riskLevel === CustomerRiskLevel.CRITICAL || props.event.riskLevel === CustomerRiskLevel.HIGH ? addMin(baseTime, 62) : undefined,
      operator: props.event.riskLevel === CustomerRiskLevel.CRITICAL || props.event.riskLevel === CustomerRiskLevel.HIGH ? '李娜' : undefined,
      channel: HandleChannel.MANUAL_SECOND,
      description: props.event.riskLevel === CustomerRiskLevel.CRITICAL || props.event.riskLevel === CustomerRiskLevel.HIGH ? '确认违规，升级至合规审计归档' : '事件风险等级不足，跳过二级复核',
      validity: props.event.riskLevel === CustomerRiskLevel.CRITICAL || props.event.riskLevel === CustomerRiskLevel.HIGH ? { status: RuleValidityStatus.FULLY_EFFECTIVE, matchScore: 88 } : undefined,
    },
    {
      key: 'compliance', label: '合规审计', status: 'done',
      time: addMin(baseTime, 130),
      operator: '王建国',
      channel: HandleChannel.COMPLIANCE_REVIEW,
      description: '符合《异常交易行为监控指引》第 12 条，处理流程合规',
      validity: { status: RuleValidityStatus.FULLY_EFFECTIVE, matchScore: 95 },
    },
    {
      key: 'appeal', label: '客户申诉', status: appealed ? 'done' : 'skipped',
      time: appealed ? addMin(baseTime, 420) : undefined,
      operator: appealed ? props.event.customerName : undefined,
      channel: HandleChannel.APPEALS_CLEARED,
      description: appealed ? '客户提交申诉材料 3 份，经审核维持原结论' : '客户未发起申诉，流程直接关闭',
      validity: appealed ? { status: RuleValidityStatus.PARTIALLY_EFFECTIVE, matchScore: 76 } : undefined,
    },
    {
      key: 'close', label: '事件关闭', status: 'active',
      time: addMin(baseTime, 520),
      operator: '系统自动',
      channel: HandleChannel.SYSTEM_AUTO,
      description: '生成复盘档案，纳入风险模型训练样本',
      validity: { status: RuleValidityStatus.FULLY_EFFECTIVE, matchScore: 99 },
    },
  ]
}

function nodeColor(node: IChainNode): string {
  if (node.status === 'done') return '#27AE60'
  if (node.status === 'active') return '#2980B9'
  if (node.status === 'skipped') return '#BDC3C7'
  return '#D5DBDB'
}

function effectStyle(effect: InterceptionEffectiveness | undefined) {
  const e = effect ?? InterceptionEffectiveness.PARTIALLY_EFFECTIVE
  return {
    background: INTERCEPTION_EFFECT_BG_COLORS[e],
    color: INTERCEPTION_EFFECT_COLORS[e],
    border: `1px solid ${INTERCEPTION_EFFECT_COLORS[e]}33`,
  }
}

function getRiskLevelBg(level: CustomerRiskLevel | undefined) {
  const map: Record<string, string> = {
    [CustomerRiskLevel.LOW]: '#ECF0F1',
    [CustomerRiskLevel.MEDIUM]: '#FEF9E7',
    [CustomerRiskLevel.HIGH]: '#FDEDEC',
    [CustomerRiskLevel.CRITICAL]: '#FADBD8',
  }
  return map[String(level)] || '#FEF9E7'
}

function formatThousands(n: number): string {
  if (!n && n !== 0) return '0'
  return n.toLocaleString('zh-CN')
}

function handleUpdateVisible(v: boolean) {
  emit('update:visible', v)
}

function handleCopyLink() {
  const text = props.event?.eventId || 'UNKNOWN'
  try {
    navigator.clipboard.writeText(text)
    ElMessage.success(`已复制链路编号：${text}`)
  } catch {
    ElMessage.success(`链路编号：${text}`)
  }
}

function handleExportChain() {
  ElMessage.success('链路溯源报告已加入导出任务队列')
}

watch(() => [props.visible, props.event], () => {
  if (props.visible && props.event) buildChainNodes()
}, { immediate: true })
</script>

<style lang="scss" scoped>
.chain-dialog {
  :deep(.el-dialog__body) { padding: 18px 24px; }
}

.chain-wrapper {
  .event-summary-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: linear-gradient(135deg, #fef9f7, #fdf2ef);
    border: 1px solid #f6dcd0;
    border-radius: 8px;
    margin-bottom: 18px;
    .esc-left {
      .esc-event-id {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        color: #C0392B;
        .id-label { color: #7f8c9a; font-size: 12px; margin-left: 2px; }
        strong { color: #2c3e50; font-size: 15px; }
      }
      .esc-row {
        font-size: 12px;
        color: #5d6d7e;
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
        .esc-k { color: #95a5a6; }
        .esc-v { color: #2c3e50; }
        .esc-sep { color: #D5DBDB; margin: 0 4px; }
      }
    }
    .esc-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      .esc-effect-tag {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 14px;
        font-size: 12px;
        font-weight: 600;
      }
      .esc-time-info {
        font-size: 12px;
        color: #7f8c9a;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .chain-section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 12px;
    .cst-hint {
      margin-left: 10px;
      font-size: 12px;
      color: #95a5a6;
      font-weight: normal;
    }
  }

  .timeline-chain {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    padding: 14px 8px 18px;
    border: 1px solid #eef2f7;
    border-radius: 8px;
    background: #fafcfe;
    margin-bottom: 18px;

    .chain-node {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      .node-top-row {
        width: 100%;
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        .node-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          flex-shrink: 0;
          .node-active-pulse { animation: pulse 1.2s infinite; }
        }
        .node-arrow {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 4px;
          .arrow-line {
            flex: 1;
            height: 2px;
            background: repeating-linear-gradient(90deg, #D5DBDB 0 4px, transparent 4px 8px);
          }
          .arrow-icon {
            color: #BDC3C7;
            font-size: 14px;
            flex-shrink: 0;
            margin-left: -4px;
          }
        }
      }
      &.is-done {
        .node-top-row .node-arrow .arrow-line { background: repeating-linear-gradient(90deg, #27AE60 0 4px, transparent 4px 8px); }
        .node-top-row .node-arrow .arrow-icon { color: #27AE60; }
      }
      &.is-active {
        .node-top-row .node-arrow .arrow-line { background: repeating-linear-gradient(90deg, #2980B9 0 4px, transparent 4px 8px); }
        .node-top-row .node-arrow .arrow-icon { color: #2980B9; }
      }
      .node-body {
        width: 100%;
        padding: 0 4px;
        .node-title {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
          text-align: center;
        }
        .node-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 6px;
          .nm-operator {
            font-size: 11px;
            color: #7f8c9a;
            display: flex;
            align-items: center;
            gap: 2px;
            justify-content: center;
          }
        }
        .node-time {
          font-size: 10px;
          color: #95a5a6;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }
        .node-desc {
          font-size: 10px;
          color: #5d6d7e;
          line-height: 1.45;
          padding: 4px 6px;
          background: white;
          border-radius: 4px;
          border: 1px solid #eef2f7;
        }
        .node-validity {
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
          .nv-score { font-size: 10px; color: #7f8c9a; }
        }
      }
      &.is-pending .node-body { opacity: 0.55; }
      &.is-skipped .node-body { opacity: 0.7; .node-title { text-decoration: line-through; color: #BDC3C7; } }
    }
  }

  .info-grid-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 16px;
  }

  .info-panel {
    border: 1px solid #eef2f7;
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
    .ip-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      border-bottom: 1px solid #eef2f7;
      h4 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: #2c3e50;
        flex: 1;
      }
      .re-sub { font-size: 11px; color: #7f8c9a; }
    }
    :deep(.el-table) { margin-top: 0; }
  }

  .check-list {
    list-style: none;
    padding: 10px 14px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .check-item {
      display: grid;
      grid-template-columns: 18px 110px 1fr auto;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      .ci-name { color: #2c3e50; font-weight: 500; }
      .ci-desc { color: #7f8c9a; }
    }
  }

  .dedup-panel {
    .dedup-stats {
      padding: 12px 14px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      border-bottom: 1px dashed #eef2f7;
      .ds-block {
        padding: 8px;
        background: #fafcfe;
        border-radius: 6px;
        text-align: center;
        .ds-label { font-size: 11px; color: #7f8c9a; margin-bottom: 4px; }
        .ds-value { font-size: 17px; font-weight: 700; }
      }
    }
    .dedup-note {
      padding: 10px 14px;
      font-size: 11px;
      color: #5d6d7e;
      line-height: 1.55;
      display: flex;
      gap: 6px;
      strong { color: #2980B9; }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.08); }
}
</style>
