<template>
  <div class="page-container">
    <div class="page-content">
      <div class="stats-row">
        <div class="stat-card" v-for="stat in logStats" :key="stat.label">
          <div class="stat-icon" :style="{ background: stat.bgColor, color: stat.color }">
            <el-icon :size="22"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <ProTable
        ref="logTableRef"
        :columns="logColumns"
        :search-columns="logSearchColumns"
        :request="fetchLogList"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
        :show-view="true"
        :show-selection="false"
        :show-batch-delete="false"
        :actions-width="160"
        @view="openLogDetail"
      >
        <template #toolbar-left>
          <el-button type="info" plain @click="refreshTable">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
          <el-button type="success" plain @click="exportLogs">
            <el-icon><Download /></el-icon>导出日志
          </el-button>
        </template>

        <template #module="{ row }">
          <el-tag :type="(moduleColorMap[row.module] || 'info') as 'primary' | 'success' | 'warning' | 'danger' | 'info'" effect="light" size="small">
            {{ moduleNameMap[row.module] || row.module }}
          </el-tag>
        </template>

        <template #operationType="{ row }">
          <el-tag :type="(operationColorMap[row.operationType] || 'info') as 'primary' | 'success' | 'warning' | 'danger' | 'info'" effect="light" size="small">
            {{ operationNameMap[row.operationType] || row.operationType }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light" size="small">
            {{ row.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>

        <template #targetInfo="{ row }">
          <div v-if="row.targetType && row.targetId" class="target-info">
            <span class="target-type">{{ targetTypeMap[row.targetType] || row.targetType }}</span>
            <span class="target-id">#{{ row.targetId }}</span>
            <span v-if="row.targetName" class="target-name" :title="row.targetName">{{ row.targetName }}</span>
          </div>
          <span v-else>-</span>
        </template>

        <template #ipInfo="{ row }">
          <div class="ip-info">
            <div class="ip-addr">{{ row.ip || '-' }}</div>
            <div v-if="row.location" class="ip-location">
              <el-icon style="vertical-align: -2px;"><Location /></el-icon>
              {{ row.location }}
            </div>
          </div>
        </template>

        <template #userInfo="{ row }">
          <div class="user-info">
            <el-avatar :size="28" style="vertical-align: middle; margin-right: 8px;">
              {{ row.username?.charAt(0)?.toUpperCase() || 'U' }}
            </el-avatar>
            <div style="display: inline-block; vertical-align: middle;">
              <div class="username">{{ row.username || '-' }}</div>
              <div class="user-role">{{ row.roleName || '未知角色' }}</div>
            </div>
          </div>
        </template>

        <template #actions="{ row }">
          <el-button link type="primary" @click="openLogDetail(row)">详情</el-button>
          <el-button
            link
            type="info"
            v-if="row.targetType && row.targetId"
            @click="traceLog(row)"
          >溯源</el-button>
        </template>
      </ProTable>
    </div>

    <el-dialog v-model="detailVisible" title="操作日志详情" width="720px">
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="日志ID">
          <span class="mono-text">{{ currentLog.id }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ formatDateTime(currentLog.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作模块">
          <el-tag :type="(moduleColorMap[currentLog.module] || 'info') as 'primary' | 'success' | 'warning' | 'danger' | 'info'" effect="light">
            {{ moduleNameMap[currentLog.module] || currentLog.module }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="(operationColorMap[currentLog.operationType] || 'info') as 'primary' | 'success' | 'warning' | 'danger' | 'info'" effect="light">
            {{ operationNameMap[currentLog.operationType] || currentLog.operationType }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">
          {{ currentLog.description }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人">
          <div class="user-info-inline">
            <el-avatar :size="24" style="vertical-align: middle; margin-right: 6px;">
              {{ currentLog.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <span>{{ currentLog.username }}</span>
            <span style="color: #909399; margin-left: 8px;">({{ currentLog.roleName }})</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="操作人ID">
          <span class="mono-text">{{ currentLog.userId }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="操作状态">
          <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'" effect="light">
            {{ currentLog.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">
          <span v-if="currentLog.duration !== undefined">{{ currentLog.duration }} ms</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          <span class="mono-text">{{ currentLog.ip }}</span>
          <span v-if="currentLog.location" style="margin-left: 8px; color: #909399;">
            <el-icon style="vertical-align: -2px;"><Location /></el-icon>
            {{ currentLog.location }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="User-Agent">
          <span class="ua-text">{{ currentLog.userAgent }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="操作目标" :span="2" v-if="currentLog.targetType">
          <span v-if="currentLog.targetType">
            [{{ targetTypeMap[currentLog.targetType] || currentLog.targetType }}]
            #{{ currentLog.targetId }}
            <span v-if="currentLog.targetName" style="color: #909399;">
              ({{ currentLog.targetName }})
            </span>
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <el-input
            type="textarea"
            :model-value="currentLog.requestParams"
            readonly
            :rows="3"
            class="code-textarea"
          />
        </el-descriptions-item>
        <el-descriptions-item label="返回结果" :span="2">
          <el-input
            type="textarea"
            :model-value="currentLog.responseResult"
            readonly
            :rows="3"
            class="code-textarea"
          />
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2" v-if="currentLog.errorMsg">
          <div class="error-msg">{{ currentLog.errorMsg }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button v-if="currentLog?.targetType && currentLog?.targetId" type="primary" @click="traceLog(currentLog); detailVisible = false">
          <el-icon><Connection /></el-icon>追溯相关操作
        </el-button>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="traceVisible" title="操作溯源" size="60%">
      <div v-if="traceTarget" class="trace-header">
        <div class="trace-target">
          <el-icon :size="20" style="vertical-align: -3px; margin-right: 6px;"><Aim /></el-icon>
          <strong>溯源目标：</strong>
          <el-tag effect="light" style="margin: 0 6px;">
            {{ targetTypeMap[traceTarget.targetType] || traceTarget.targetType }}
          </el-tag>
          <span class="mono-text">#{{ traceTarget.targetId }}</span>
          <span v-if="traceTarget.targetName" style="color: #909399; margin-left: 8px;">
            {{ traceTarget.targetName }}
          </span>
        </div>
        <div class="trace-count">
          共找到 <strong style="color: #409eff;">{{ traceLogs.length }}</strong> 条关联记录
        </div>
      </div>

      <div class="trace-timeline">
        <el-timeline v-if="traceLogs.length">
          <el-timeline-item
            v-for="log in traceLogs"
            :key="log.id"
            :timestamp="formatDateTime(log.createdAt)"
            placement="top"
            :type="log.status === 1 ? 'primary' : 'danger'"
            :hollow="log.status !== 1"
          >
            <div class="trace-item-card">
              <div class="trace-item-header">
                <el-tag :type="(moduleColorMap[log.module] ?? 'info') as 'primary' | 'success' | 'warning' | 'danger' | 'info'" effect="light" size="small">
                  {{ moduleNameMap[log.module] || log.module }}
                </el-tag>
                <el-tag :type="(operationColorMap[log.operationType] ?? 'info') as 'primary' | 'success' | 'warning' | 'danger' | 'info'" effect="plain" size="small">
                  {{ operationNameMap[log.operationType] || log.operationType }}
                </el-tag>
                <el-tag :type="log.status === 1 ? 'success' : 'danger'" effect="dark" size="small">
                  {{ log.status === 1 ? '成功' : '失败' }}
                </el-tag>
                <span style="margin-left: auto; color: #909399; font-size: 12px;">
                  耗时: {{ log.duration || 0 }}ms
                </span>
              </div>
              <div class="trace-item-desc">{{ log.description }}</div>
              <div class="trace-item-meta">
                <span>
                  <el-icon style="vertical-align: -2px;"><User /></el-icon>
                  {{ log.username }} ({{ log.roleName }})
                </span>
                <span v-if="log.ip">
                  <el-icon style="vertical-align: -2px;"><Monitor /></el-icon>
                  {{ log.ip }}
                  <span v-if="log.location" style="color: #909399;">· {{ log.location }}</span>
                </span>
              </div>
              <el-collapse v-if="log.requestParams || log.responseResult" class="trace-item-collapse">
                <el-collapse-item name="1" title="查看详细内容">
                  <div class="trace-detail">
                    <div v-if="log.requestParams">
                      <div class="detail-label">请求参数</div>
                      <pre class="code-block">{{ log.requestParams }}</pre>
                    </div>
                    <div v-if="log.responseResult">
                      <div class="detail-label">返回结果</div>
                      <pre class="code-block">{{ log.responseResult }}</pre>
                    </div>
                    <div v-if="log.errorMsg">
                      <div class="detail-label error">错误信息</div>
                      <div class="error-block">{{ log.errorMsg }}</div>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无关联操作记录" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable from '@/components/ProTable/index.vue'
import { formatDateTime } from '@/utils/date'

interface LogItem {
  id: number
  userId: number
  username: string
  roleName: string
  module: string
  operationType: string
  description: string
  targetType: string
  targetId: number
  targetName: string
  requestParams: string
  responseResult: string
  errorMsg: string
  ip: string
  location: string
  userAgent: string
  status: number
  duration: number
  createdAt: string
}

const logTableRef = ref()

const moduleNameMap: Record<string, string> = {
  auth: '认证登录', user: '用户管理', goods: '商品管理', order: '订单管理',
  marketing: '营销管理', merchant: '商家管理', aftersale: '售后管理',
  system: '系统设置', risk: '风控管理', dashboard: '数据看板'
}

const moduleColorMap: Record<string, string> = {
  auth: 'warning', user: 'primary', goods: 'success', order: 'warning',
  marketing: 'danger', merchant: 'info', aftersale: 'warning',
  system: 'info', risk: 'danger', dashboard: 'success'
}

const operationNameMap: Record<string, string> = {
  login: '登录', logout: '登出', query: '查询', create: '新增',
  update: '修改', delete: '删除', export: '导出', import: '导入',
  approve: '审批', reject: '驳回', upload: '上传', download: '下载'
}

const operationColorMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  login: 'success', logout: 'info', query: 'info', create: 'success',
  update: 'warning', delete: 'danger', export: 'primary', import: 'primary',
  approve: 'success', reject: 'danger', upload: 'warning', download: 'primary'
}

const targetTypeMap: Record<string, string> = {
  user: '用户', order: '订单', goods: '商品', merchant: '商家',
  coupon: '优惠券', activity: '活动', aftersale: '售后单', rule: '规则'
}

const logStats = ref([
  { label: '今日操作总数', value: '1,286', icon: 'Document', bgColor: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' },
  { label: '成功操作', value: '1,256', icon: 'CircleCheck', bgColor: 'linear-gradient(135deg,#11998e,#38ef7d)', color: '#fff' },
  { label: '失败操作', value: '30', icon: 'CircleClose', bgColor: 'linear-gradient(135deg,#eb3349,#f45c43)', color: '#fff' },
  { label: '活跃管理员', value: '12', icon: 'UserFilled', bgColor: 'linear-gradient(135deg,#f7971e,#ffd200)', color: '#fff' }
])

const logSearchColumns = [
  { prop: 'username', label: '操作人', type: 'input' as const },
  { prop: 'module', label: '操作模块', type: 'select' as const, options: [
    { label: '认证登录', value: 'auth' }, { label: '用户管理', value: 'user' },
    { label: '商品管理', value: 'goods' }, { label: '订单管理', value: 'order' },
    { label: '营销管理', value: 'marketing' }, { label: '商家管理', value: 'merchant' },
    { label: '售后管理', value: 'aftersale' }, { label: '系统设置', value: 'system' },
    { label: '风控管理', value: 'risk' }
  ]},
  { prop: 'operationType', label: '操作类型', type: 'select' as const, options: [
    { label: '登录', value: 'login' }, { label: '查询', value: 'query' },
    { label: '新增', value: 'create' }, { label: '修改', value: 'update' },
    { label: '删除', value: 'delete' }, { label: '导出', value: 'export' }
  ]},
  { prop: 'status', label: '操作状态', type: 'select' as const, options: [
    { label: '成功', value: 1 }, { label: '失败', value: 0 }
  ]},
  { prop: 'ip', label: 'IP地址', type: 'input' as const },
  { prop: 'timeRange', label: '操作时间', type: 'daterange' as const }
]

const logColumns = [
  { prop: 'id', label: '日志ID', width: 90, align: 'center' },
  { prop: 'userInfo', label: '操作人', width: 160, slot: 'userInfo' },
  { prop: 'module', label: '模块', width: 100, align: 'center', slot: 'module' },
  { prop: 'operationType', label: '类型', width: 90, align: 'center', slot: 'operationType' },
  { prop: 'description', label: '操作描述', minWidth: 200, showOverflowTooltip: true },
  { prop: 'targetInfo', label: '操作目标', width: 180, slot: 'targetInfo' },
  { prop: 'status', label: '状态', width: 80, align: 'center', slot: 'status' },
  { prop: 'duration', label: '耗时', width: 90, align: 'center' },
  { prop: 'ipInfo', label: 'IP/位置', width: 200, slot: 'ipInfo' },
  { prop: 'createdAt', label: '操作时间', width: 170, type: 'datetime' as const }
]

const mockLogs = (): LogItem[] => {
  const modules = ['auth', 'user', 'goods', 'order', 'marketing', 'merchant', 'aftersale', 'system', 'risk', 'dashboard']
  const ops = ['login', 'logout', 'query', 'create', 'update', 'delete', 'export', 'approve']
  const targets = ['user', 'order', 'goods', 'merchant', 'coupon', 'activity', 'aftersale', 'rule']
  const users = [
    { id: 1, name: 'admin', role: '超级管理员' },
    { id: 2, name: 'manager01', role: '运营经理' },
    { id: 3, name: 'goods01', role: '商品管理员' },
    { id: 4, name: 'order01', role: '订单管理员' },
    { id: 5, name: 'finance01', role: '财务人员' }
  ]
  const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '南京市']
  const ips = ['192.168.1.', '10.0.0.', '172.16.0.', '203.0.113.', '198.51.100.']

  const descMap: Record<string, Record<string, string>> = {
    auth: { login: '用户登录系统', logout: '用户退出登录' },
    user: { query: '查询用户列表', create: '创建新用户', update: '更新用户信息', delete: '删除用户' },
    goods: { query: '查询商品列表', create: '创建商品', update: '更新商品信息', delete: '删除商品', approve: '审核商品' },
    order: { query: '查询订单列表', update: '修改订单状态', approve: '审批订单退款', export: '导出订单数据' },
    marketing: { query: '查询营销活动', create: '创建营销活动', update: '更新活动信息', delete: '删除活动' },
    merchant: { query: '查询商家列表', create: '创建商家', update: '更新商家信息', approve: '审核商家入驻' },
    aftersale: { query: '查询售后列表', approve: '审核售后申请', update: '更新售后状态' },
    system: { update: '修改系统配置', export: '导出系统日志' },
    risk: { query: '查询风控规则', create: '创建风控规则', update: '更新风控规则', approve: '处理风险预警' },
    dashboard: { query: '查看数据看板', export: '导出统计报表' }
  }

  const list: LogItem[] = []
  for (let i = 0; i < 50; i++) {
    const module = modules[i % modules.length]
    const op = ops[i % ops.length]
    const user = users[i % users.length]
    const target = targets[i % targets.length]
    const city = cities[i % cities.length]
    const ipPrefix = ips[i % ips.length]

    list.push({
      id: 100000 + i,
      userId: user.id,
      username: user.name,
      roleName: user.role,
      module,
      operationType: op,
      description: descMap[module]?.[op] || `${operationNameMap[op] || op}${moduleNameMap[module] || module}`,
      targetType: ['login', 'logout', 'query', 'export'].includes(op) ? '' : target,
      targetId: ['login', 'logout', 'query', 'export'].includes(op) ? 0 : 1000 + i,
      targetName: ['login', 'logout', 'query', 'export'].includes(op)
        ? ''
        : `${targetTypeMap[target] || target}-${1000 + i}`,
      requestParams: JSON.stringify({ pageNum: 1, pageSize: 10, keyword: 'test' }, null, 2),
      responseResult: JSON.stringify({ code: 200, message: 'success', data: { total: 100 } }, null, 2),
      errorMsg: i % 17 === 0 ? 'Connection timeout: failed to connect to database after 5000ms' : '',
      ip: `${ipPrefix}${(i % 254) + 1}`,
      location: city,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
      status: i % 17 === 0 ? 0 : 1,
      duration: Math.floor(Math.random() * 800) + 15,
      createdAt: `2024-06-16 ${String((i % 14) + 8).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 11) % 60).padStart(2, '0')}`
    })
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const allLogs = mockLogs()

const fetchLogList = async (params: Record<string, unknown>) => {
  await new Promise(r => setTimeout(r, 300))
  const pageNum = (params.pageNum as number) || 1
  const pageSize = (params.pageSize as number) || 10
  const start = (pageNum - 1) * pageSize
  return { list: allLogs.slice(start, start + pageSize), total: allLogs.length }
}

const refreshTable = () => {
  logTableRef.value?.fetchData()
  ElMessage.success('刷新成功')
}

const exportLogs = () => {
  ElMessage.success('日志导出任务已创建')
}

const detailVisible = ref(false)
const currentLog = ref<LogItem | null>(null)

const openLogDetail = (row: any) => {
  currentLog.value = { ...row } as LogItem
  detailVisible.value = true
}

const traceVisible = ref(false)
const traceTarget = ref<{ targetType: string; targetId: number; targetName: string } | null>(null)
const traceLogs = ref<LogItem[]>([])

const traceLog = (row: any) => {
  traceTarget.value = {
    targetType: row.targetType,
    targetId: row.targetId,
    targetName: row.targetName
  }
  traceLogs.value = allLogs.filter(
    l => l.targetType === row.targetType && l.targetId === row.targetId
  ).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  traceVisible.value = true
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-container {
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-base;
    margin-bottom: $spacing-base;

    .stat-card {
      background: #fff;
      border-radius: $radius-md;
      padding: $spacing-base;
      box-shadow: $shadow-light;
      display: flex;
      align-items: center;
      gap: $spacing-base;

      .stat-icon {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-info {
        .stat-value {
          font-size: 22px;
          font-weight: 700;
          color: $text-primary;
          line-height: 1.3;
        }

        .stat-label {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }
  }

  .user-info {
    .username {
      font-weight: 500;
      color: $text-primary;
      font-size: $font-size-sm;
    }

    .user-role {
      font-size: $font-size-xs;
      color: $text-placeholder;
    }
  }

  .target-info {
    font-size: $font-size-sm;

    .target-type {
      color: $text-secondary;
      margin-right: 4px;
    }

    .target-id {
      font-family: 'Courier New', monospace;
      color: $primary-color;
      margin-right: 4px;
    }

    .target-name {
      color: $text-secondary;
    }
  }

  .ip-info {
    font-size: $font-size-sm;

    .ip-addr {
      font-family: 'Courier New', monospace;
      color: $text-primary;
    }

    .ip-location {
      font-size: $font-size-xs;
      color: $text-placeholder;
      margin-top: 2px;
    }
  }

  .mono-text {
    font-family: 'Courier New', monospace;
  }

  .user-info-inline {
    display: flex;
    align-items: center;
  }

  .ua-text {
    font-size: 11px;
    color: $text-secondary;
    word-break: break-all;
  }

  .code-textarea {
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }

  .error-msg {
    background: #fef0f0;
    color: #f56c6c;
    padding: 10px 12px;
    border-radius: $radius-sm;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .trace-header {
    background: $bg-color;
    padding: $spacing-sm $spacing-base;
    border-radius: $radius-md;
    margin-bottom: $spacing-base;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .trace-target {
      font-size: $font-size-sm;
      color: $text-primary;
    }

    .trace-count {
      font-size: $font-size-sm;
      color: $text-secondary;
    }
  }

  .trace-timeline {
    .trace-item-card {
      background: #fff;
      border: 1px solid $border-color-lighter;
      border-radius: $radius-md;
      padding: $spacing-sm $spacing-base;

      .trace-item-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
      }

      .trace-item-desc {
        color: $text-primary;
        font-size: $font-size-sm;
        margin-bottom: 6px;
      }

      .trace-item-meta {
        display: flex;
        gap: $spacing-base;
        font-size: 12px;
        color: $text-secondary;
        margin-bottom: $spacing-sm;
      }

      .trace-item-collapse {
        border: none;
        margin-top: 0;

        :deep(.el-collapse-item__header) {
          font-size: 12px;
          color: $primary-color;
          border-bottom: none;
          height: auto;
          padding: 4px 0;
        }

        :deep(.el-collapse-item__wrap) {
          border-bottom: none;
        }
      }

      .trace-detail {
        .detail-label {
          font-size: 12px;
          color: $text-secondary;
          margin-bottom: 4px;
          font-weight: 500;

          &.error { color: #f56c6c; }
        }

        .code-block {
          background: $bg-color;
          padding: 10px;
          border-radius: $radius-sm;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          white-space: pre-wrap;
          word-break: break-all;
          margin-bottom: 8px;
          max-height: 200px;
          overflow: auto;
        }

        .error-block {
          background: #fef0f0;
          color: #f56c6c;
          padding: 10px;
          border-radius: $radius-sm;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          white-space: pre-wrap;
          word-break: break-all;
        }
      }
    }
  }
}

@media screen and (max-width: 1200px) {
  .page-container .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
