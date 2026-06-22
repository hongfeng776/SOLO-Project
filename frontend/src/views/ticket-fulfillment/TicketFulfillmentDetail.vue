<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="v => emit('update:modelValue', v)"
    title="履约详情"
    width="960px"
    class="fulfillment-detail-dialog"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <template v-if="data">
      <div class="detail-header">
        <div class="left">
          <el-tag size="large" class="status-tag" :class="getStatusTag(data.fulfillStatus)" effect="dark">
            <el-icon><component :is="getStatusIcon(data.fulfillStatus)" /></el-icon>
            {{ getStatusLabel(data.fulfillStatus) }}
          </el-tag>
          <span style="font-size: 16px; font-weight: 600;">
            {{ data.scenicSpot?.name || '-' }} · {{ data.ticketType?.name || '-' }}
          </span>
          <el-tag v-if="data.isAbnormal" type="danger" size="small" effect="plain" style="margin-left: 8px;">
            <el-icon><WarningFilled /></el-icon> {{ getAbnormalLabel(data.abnormalType) }}
          </el-tag>
        </div>
        <div class="right">
          <el-icon><Timer /></el-icon>
          履约编号: FFL-{{ data.id }} · 更新: {{ formatTime(data.updatedAt) }}
        </div>
      </div>

      <el-tabs type="border-card">
        <el-tab-pane label="基本信息" name="base">
          <el-descriptions :column="3" border stripe size="default">
            <el-descriptions-item label="票务编码" :span="2">
              <span style="font-family: 'Courier New', monospace; font-weight: 600; color: #1890ff; letter-spacing: 1px;">
                {{ data.ticketCode }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="票种数量">
              {{ data.ticketCount || 1 }} 张 · ¥{{ data.originalPrice || 0 }}
              <el-tag v-if="data.actualPrice !== data.originalPrice" size="small" type="warning" style="margin-left: 6px;">
                实付 ¥{{ data.actualPrice || 0 }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="关联订单">{{ data.orderId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="所属景点">{{ data.scenicSpot?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="票种品类">{{ data.ticketType?.name || '-' }} ({{ data.ticketCategory || '-' }})</el-descriptions-item>
            <el-descriptions-item label="场次日期">{{ data.sessionDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="场次时段">
              <span v-if="data.sessionStartTime">{{ data.sessionStartTime }} - {{ data.sessionEndTime }}</span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="有效期间">
              {{ formatDate(data.validFrom) }} 至 {{ formatDate(data.validTo) }}
            </el-descriptions-item>
            <el-descriptions-item label="库存场次" v-if="data.inventoryId">
              <el-tag type="primary" size="small">#{{ data.inventoryId }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="section-title"><el-icon><User /></el-icon> 用户信息</div>
          <el-descriptions :column="3" border stripe>
            <el-descriptions-item label="用户名称">{{ data.userName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户手机">{{ data.userPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">
              <span v-if="data.userIdCard">{{ maskIdCard(data.userIdCard) }}</span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="预约备注" :span="3">{{ data.reservationRemark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="核销信息" name="verify">
          <el-descriptions v-if="data.fulfillStatus === 'verified'" :column="3" border stripe>
            <el-descriptions-item label="核销时间">
              <span style="color: #52c41a; font-weight: 600;">{{ formatTime(data.verifiedAt) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="操作人">{{ data.verifiedByName || data.verifiedBy || '-' }}</el-descriptions-item>
            <el-descriptions-item label="核销渠道">{{ data.verifyChannel || '线下' }}</el-descriptions-item>
            <el-descriptions-item label="核销闸口">{{ data.verifyGateway || '-' }}</el-descriptions-item>
            <el-descriptions-item label="设备编号">{{ data.verifyDevice || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地理位置">{{ data.verifyLocation || '-' }}</el-descriptions-item>
            <el-descriptions-item label="校验结果">
              <el-tag type="success" effect="dark"><el-icon><CircleCheckFilled /></el-icon> 通过</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="入园次数">{{ data.entryCount || 0 }} 次</el-descriptions-item>
            <el-descriptions-item label="核销备注" :span="3">{{ data.verifyMessage || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-alert v-else title="该票尚未完成核销" type="info" :closable="false" show-icon />

          <div class="section-title"><el-icon><Histogram /></el-icon> 使用记录</div>
          <el-table :data="usageRecords" size="small" class="zebra-table" border>
            <el-table-column prop="index" label="序号" width="60" align="center" />
            <el-table-column prop="stage" label="阶段" width="120">
              <template #default="{ row }">
                <el-tag :type="stageTagType(row.stage)" size="small" effect="plain">{{ row.stageLabel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="opTime" label="时间" width="170" />
            <el-table-column prop="operator" label="操作人" width="110" />
            <el-table-column prop="location" label="位置/设备" min-width="180" />
            <el-table-column prop="entryCount" label="入园" width="70" align="center" />
            <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="异常记录" name="abnormal">
          <template v-if="data.isAbnormal">
            <el-alert :title="'异常类型：' + getAbnormalLabel(data.abnormalType)" type="error" :closable="false" show-icon>
              <template #default>
                <div style="line-height: 1.8;">
                  <div><strong>异常原因：</strong>{{ data.abnormalReason || '-' }}</div>
                  <div><strong>发现时间：</strong>{{ formatTime(data.abnormalTime) }}</div>
                  <div><strong>处理状态：</strong>
                    <el-tag :type="data.abnormalHandled ? 'success' : 'warning'" size="small" effect="plain">
                      {{ data.abnormalHandled ? '已处理' : '待处理' }}
                    </el-tag>
                  </div>
                  <div v-if="data.abnormalHandled"><strong>处理时间：</strong>{{ formatTime(data.abnormalHandledAt) }}</div>
                  <div v-if="data.abnormalHandled"><strong>处理人：</strong>{{ data.abnormalHandledBy || '-' }}</div>
                  <div v-if="data.abnormalHandled"><strong>处理备注：</strong>{{ data.handleRemark || '-' }}</div>
                </div>
              </template>
            </el-alert>
          </template>
          <el-alert v-else title="该票无异常记录" type="success" :closable="false" show-icon />

          <div class="section-title"><el-icon><CircleCheck /></el-icon> 数据一致性校验（点击触发）</div>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <div v-for="d in integrityDims" :key="d.key" class="dim-card"
              :class="integrityChecked ? (d.passed ? 'pass' : 'fail') : 'idle'"
              @click="triggerIntegrity"
              style="cursor: pointer;"
            >
              <el-icon style="font-size: 24px;"><component :is="d.icon" /></el-icon>
              <div style="margin-top: 6px; font-weight: 600;">{{ d.label }}</div>
              <div style="font-size: 12px; color: #8c8c8c; margin-top: 2px;">
                {{ integrityChecked ? (d.passed ? '一致' : '异常') : '点击校验' }}
              </div>
              <div v-if="integrityChecked && d.issue" style="font-size: 12px; color: #ff4d4f; margin-top: 6px;">
                {{ d.issue }}
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="履约时间线" name="timeline">
          <div class="timeline-list">
            <div v-for="(t, idx) in timelineItems" :key="idx" class="tl-item" :class="t.type">
              <div class="tl-time"><el-icon><Timer /></el-icon> {{ t.time }}</div>
              <div class="tl-content">
                <div class="tl-op" :class="t.type">
                  <el-icon><component :is="t.icon" /></el-icon>
                  {{ t.title }}
                </div>
                <div style="line-height: 1.6; color: #595959;">{{ t.desc }}</div>
                <div v-if="t.by" style="font-size: 12px; color: #8c8c8c; margin-top: 6px;">
                  操作人：{{ t.by }} · 来源：{{ t.channel }}
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button type="primary" @click="emit('success')">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  User, Histogram, WarningFilled, CircleCheckFilled, CircleCloseFilled,
  RefreshLeft, Timer, Clock, CircleCheck, ShoppingCart, Money, Location,
  Setting, Document
} from '@element-plus/icons-vue'
import { checkFulfillmentIntegrity } from '@/api/ticketFulfillment'
import { FulfillStatusEnum, FulfillAbnormalTypeEnum } from '@/utils/enums'

const props = defineProps({
  visible: Boolean,
  data: Object
})
const emit = defineEmits(['update:modelValue', 'success'])

const integrityChecked = ref(false)
const integrityDims = reactive([
  { key: 'order', label: '订单状态', icon: ShoppingCart, passed: false, issue: '' },
  { key: 'inventory', label: '库存联动', icon: Document, passed: false, issue: '' },
  { key: 'spot', label: '景点台账', icon: Location, passed: false, issue: '' },
  { key: 'time', label: '时间合规', icon: Clock, passed: false, issue: '' },
  { key: 'user', label: '用户校验', icon: User, passed: false, issue: '' }
])

const getStatusLabel = (s) => FulfillStatusEnum[s]?.label || s
const getStatusTag = (s) => FulfillStatusEnum[s]?.tagClass || ''
const getStatusIcon = (s) => {
  const m = { pending: Clock, verified: CircleCheckFilled, expired: CircleCloseFilled, refund: RefreshLeft, abnormal: WarningFilled }
  return m[s] || Setting
}
const getAbnormalLabel = (t) => FulfillAbnormalTypeEnum[t]?.label || '异常'

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
const formatDate = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`
}
const maskIdCard = (s) => {
  if (!s || s.length < 12) return s
  return s.slice(0, 6) + '********' + s.slice(-4)
}
const stageTagType = (s) => {
  const m = { created: '', reserved: 'info', paid: 'success', verified: 'success', expired: 'info', refund: 'warning', abnormal: 'danger' }
  return m[s] || 'info'
}

const usageRecords = computed(() => {
  const arr = []
  const d = props.data
  if (!d) return arr
  let idx = 0
  if (d.createdAt) arr.push({
    index: ++idx, stage: 'created', stageLabel: '下单创建', opTime: formatTime(d.createdAt),
    operator: d.userName || '-', location: '-', entryCount: '-', remark: '订单创建完成'
  })
  if (d.orderId) arr.push({
    index: ++idx, stage: 'reserved', stageLabel: '预约完成', opTime: formatTime(d.createdAt),
    operator: d.userName || '-', location: '-', entryCount: '-', remark: '场次预约成功，库存预占'
  })
  if (d.fulfillStatus === 'verified' && d.verifiedAt) arr.push({
    index: ++idx, stage: 'verified', stageLabel: '核销完成', opTime: formatTime(d.verifiedAt),
    operator: d.verifiedByName || '-', location: (d.verifyGateway || '-') + ' / ' + (d.verifyDevice || '-'),
    entryCount: d.entryCount || 1, remark: d.verifyMessage || '核销成功'
  })
  if (d.fulfillStatus === 'expired') arr.push({
    index: ++idx, stage: 'expired', stageLabel: '过期作废', opTime: formatTime(d.expiredAt),
    operator: '系统', location: '-', entryCount: '-', remark: '超过有效期限自动作废'
  })
  if (d.fulfillStatus === 'refund') arr.push({
    index: ++idx, stage: 'refund', stageLabel: '退票完成', opTime: formatTime(d.refundedAt || d.updatedAt),
    operator: d.userName || '-', location: '-', entryCount: '-', remark: '退款 ¥' + (d.refundAmount || 0)
  })
  if (d.isAbnormal) arr.push({
    index: ++idx, stage: 'abnormal', stageLabel: '异常标记', opTime: formatTime(d.abnormalTime || d.updatedAt),
    operator: '系统', location: '-', entryCount: '-', remark: d.abnormalReason || '异常操作拦截'
  })
  return arr
})

const timelineItems = computed(() => {
  const d = props.data
  if (!d) return []
  const items = []
  if (d.createdAt) items.push({
    type: '', icon: ShoppingCart, time: formatTime(d.createdAt),
    title: '票务创建', desc: `票种「${d.ticketType?.name || '-'}」×${d.ticketCount || 1}，金额 ¥${d.actualPrice || 0}`,
    by: d.userName || '用户', channel: '小程序/APP'
  })
  items.push({
    type: '', icon: Money, time: formatTime(d.createdAt),
    title: '订单支付完成', desc: `订单号 ${d.orderId || '-'}，预约场次 ${d.sessionDate || '-'} ${d.sessionStartTime || ''}`,
    by: d.userName || '用户', channel: '微信/支付宝'
  })
  if (d.fulfillStatus === 'verified') items.push({
    type: 'success', icon: CircleCheckFilled, time: formatTime(d.verifiedAt),
    title: '核销成功', desc: `景点「${d.scenicSpot?.name || '-'}」入园，闸口 ${d.verifyGateway || '-'}`,
    by: d.verifiedByName || '操作员', channel: '线下闸口/人工'
  })
  if (d.fulfillStatus === 'expired') items.push({
    type: 'fail', icon: CircleCloseFilled, time: formatTime(d.expiredAt || d.updatedAt),
    title: '过期作废', desc: '超过使用时效，系统自动标记',
    by: '系统', channel: '定时任务'
  })
  if (d.fulfillStatus === 'refund') items.push({
    type: 'warn', icon: RefreshLeft, time: formatTime(d.refundedAt || d.updatedAt),
    title: '退票退款', desc: `退款 ¥${d.refundAmount || 0}，库存释放`,
    by: d.userName || '用户', channel: '小程序/客服'
  })
  if (d.isAbnormal) items.push({
    type: 'fail', icon: WarningFilled, time: formatTime(d.abnormalTime || d.updatedAt),
    title: '异常拦截：' + getAbnormalLabel(d.abnormalType), desc: d.abnormalReason || '-',
    by: '系统/稽核', channel: '履约校验链'
  })
  return items
})

const triggerIntegrity = async () => {
  if (!props.data?.id) return
  try {
    const r = await checkFulfillmentIntegrity(props.data.id)
    const rd = r.data || {}
    const issues = rd.issues || []
    integrityDims.forEach(dim => {
      dim.passed = true
      dim.issue = ''
      const issue = issues.find(i => i.dim === dim.key)
      if (issue) { dim.passed = false; dim.issue = issue.issue }
    })
    integrityChecked.value = true
  } catch (e) {
    integrityDims.forEach(dim => { dim.passed = false; dim.issue = '校验请求失败' })
    integrityChecked.value = true
  }
}

const onOpen = () => {
  integrityChecked.value = false
  integrityDims.forEach(dim => { dim.passed = false; dim.issue = '' })
}
</script>
