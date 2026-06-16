<template>
  <div class="ccb-system-log">
    <CcbPageHeader
      title="操作日志"
      description="记录系统用户登录、操作、异常行为日志"
      icon="Document"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="日志类型" prop="logType">
        <el-select v-model="searchForm.logType" placeholder="请选择日志类型" clearable>
          <el-option label="登录日志" :value="1" />
          <el-option label="操作日志" :value="2" />
          <el-option label="异常日志" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作模块" prop="module">
        <el-select v-model="searchForm.module" placeholder="请选择操作模块" clearable>
          <el-option label="用户管理" value="用户管理" />
          <el-option label="角色管理" value="角色管理" />
          <el-option label="权限管理" value="权限管理" />
          <el-option label="机构管理" value="机构管理" />
          <el-option label="产品管理" value="产品管理" />
          <el-option label="渠道管理" value="渠道管理" />
          <el-option label="审核管理" value="审核管理" />
          <el-option label="系统设置" value="系统设置" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作人" prop="operatorName">
        <el-input v-model="searchForm.operatorName" placeholder="请输入操作人姓名/账号" clearable />
      </el-form-item>
      <el-form-item label="所属机构" prop="orgName">
        <el-input v-model="searchForm.orgName" placeholder="请输入所属机构" clearable />
      </el-form-item>
      <el-form-item label="IP地址" prop="ipAddress">
        <el-input v-model="searchForm.ipAddress" placeholder="请输入IP地址" clearable />
      </el-form-item>
      <el-form-item label="操作结果" prop="result">
        <el-select v-model="searchForm.result" placeholder="请选择操作结果" clearable>
          <el-option label="操作成功" :value="1" />
          <el-option label="操作失败" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作时间" prop="operateTimeRange">
        <el-date-picker
          v-model="searchForm.operateTimeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Download" @click="handleExport">导出日志</el-button>
        <el-button type="danger" :icon="Delete" @click="handleClean">清理过期日志</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-tag type="success" effect="dark">成功：{{ successCount }} 条</el-tag>
        <el-tag type="danger" effect="dark">失败：{{ failCount }} 条</el-tag>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="logId" label="日志ID" width="180" />
      <el-table-column label="日志类型" width="90">
        <template #default="{ row }">
          <el-tag :type="getLogTypeTag(row.logType)" effect="light" size="small">
            {{ getLogTypeLabel(row.logType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="操作模块" width="110" />
      <el-table-column prop="operation" label="操作描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="operatorName" label="操作人" width="100" />
      <el-table-column prop="orgName" label="所属机构" width="150" show-overflow-tooltip />
      <el-table-column prop="ipAddress" label="IP地址" width="130" />
      <el-table-column prop="browser" label="浏览器" width="120" show-overflow-tooltip />
      <el-table-column label="操作结果" width="90">
        <template #default="{ row }">
          <el-tag :type="row.result === 1 ? 'success' : 'danger'" effect="light" size="small">
            {{ row.result === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operateTime" label="操作时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.operateTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="detailDialogVisible"
      title="日志详情"
      width="720px"
      destroy-on-close
    >
      <div v-if="currentLog" class="ccb-log-detail">
        <el-descriptions :column="2" border size="default">
          <el-descriptions-item label="日志ID">{{ currentLog.logId }}</el-descriptions-item>
          <el-descriptions-item label="日志类型">
            <el-tag :type="getLogTypeTag(currentLog.logType)" effect="light">
              {{ getLogTypeLabel(currentLog.logType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作模块">{{ currentLog.module }}</el-descriptions-item>
          <el-descriptions-item label="操作描述">{{ currentLog.operation }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentLog.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="所属机构">{{ currentLog.orgName }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ipAddress }}</el-descriptions-item>
          <el-descriptions-item label="MAC地址">{{ currentLog.macAddress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="浏览器">{{ currentLog.browser }}</el-descriptions-item>
          <el-descriptions-item label="操作系统">{{ currentLog.os || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作结果">
            <el-tag :type="currentLog.result === 1 ? 'success' : 'danger'" effect="light">
              {{ currentLog.result === 1 ? '操作成功' : '操作失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="响应时长">
            {{ currentLog.responseMs }} ms
          </el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">
            {{ formatDateTime(currentLog.operateTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="请求URL" :span="2" v-if="currentLog.requestUrl">
            <code class="ccb-code">{{ currentLog.requestUrl }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="请求方式" v-if="currentLog.requestMethod">
            {{ currentLog.requestMethod }}
          </el-descriptions-item>
          <el-descriptions-item label="请求参数" :span="2" v-if="currentLog.requestParams">
            <pre class="ccb-pre">{{ JSON.stringify(JSON.parse(currentLog.requestParams), null, 2) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="响应结果" :span="2" v-if="currentLog.responseResult">
            <pre class="ccb-pre">{{ JSON.stringify(JSON.parse(currentLog.responseResult), null, 2) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="异常信息" :span="2" v-if="currentLog.exceptionStack">
            <pre class="ccb-pre ccb-error">{{ currentLog.exceptionStack }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Download, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@utils'

interface SystemLog {
  id: number
  logId: string
  logType: number
  module: string
  operation: string
  operatorId: number
  operatorName: string
  operatorAccount: string
  orgId: number
  orgName: string
  ipAddress: string
  macAddress: string
  browser: string
  os: string
  userAgent: string
  result: number
  responseMs: number
  operateTime: string
  requestUrl: string
  requestMethod: string
  requestParams: string
  responseResult: string
  exceptionStack: string
}

const loading = ref<boolean>(false)
const tableData = ref<SystemLog[]>([])
const total = ref<number>(0)
const selectedRows = ref<SystemLog[]>([])

const detailDialogVisible = ref<boolean>(false)
const currentLog = ref<SystemLog | null>(null)

const searchForm = reactive({
  logType: null as number | null,
  module: '',
  operatorName: '',
  orgName: '',
  ipAddress: '',
  result: null as number | null,
  operateTimeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const getLogTypeLabel = (type: number): string => {
  const labels: Record<number, string> = {
    1: '登录',
    2: '操作',
    3: '异常'
  }
  return labels[type] || '未知'
}

const getLogTypeTag = (type: number): string => {
  const types: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'danger'
  }
  return types[type] || 'info'
}

const modules = ['用户管理', '角色管理', '权限管理', '机构管理', '产品管理', '渠道管理', '审核管理', '系统设置']
const operationsMap: Record<string, string[]> = {
  '用户管理': ['新增用户', '修改用户', '删除用户', '重置密码', '分配角色', '启用用户', '停用用户'],
  '角色管理': ['新增角色', '修改角色', '删除角色', '分配权限', '启用角色', '停用角色'],
  '权限管理': ['新增权限', '修改权限', '删除权限', '刷新权限缓存'],
  '机构管理': ['新增机构', '修改机构', '删除机构', '启用机构', '停用机构'],
  '产品管理': ['新增产品', '修改产品', '删除产品', '上架产品', '下架产品', '调整收益率'],
  '渠道管理': ['新增渠道', '修改渠道', '删除渠道', '启用渠道', '停用渠道', '重置渠道密钥'],
  '审核管理': ['审核通过', '审核驳回', '退回修改', '转审处理', '配置审核规则'],
  '系统设置': ['修改系统参数', '导出数据', '清理缓存', '备份数据库']
}
const orgs = [
  '中国建设银行总行', '北京分行', '上海分行', '深圳分行', '广州分行', '杭州分行',
  '北京东城区支行', '北京西城区支行', '上海浦东支行', '上海黄浦支行',
  '深圳福田支行', '深圳南山支行', '广州越秀支行', '广州天河支行'
]
const browsers = ['Chrome 120.0', 'Chrome 119.0', 'Edge 120.0', 'Firefox 121.0', 'Safari 17.2', 'IE 11.0']
const operators = [
  'admin', '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九',
  '吴审核', '郑运营', '王风控', '李产品', '陈渠道'
]

const mockLogs = (): SystemLog[] => {
  const list: SystemLog[] = []
  const pad = (n: number) => String(n).padStart(2, '0')
  for (let i = 1; i <= 32; i++) {
    const logType = i % 8 === 0 ? 3 : (i % 5 === 0 ? 1 : 2)
    const module = logType === 1 ? '用户管理' : modules[i % modules.length]
    const moduleOps = operationsMap[module] || ['查看列表']
    const operation = logType === 1
      ? (i % 3 === 0 ? '用户退出' : '用户登录')
      : moduleOps[i % moduleOps.length]
    const result = logType === 3 ? 0 : (i % 12 === 3 ? 0 : 1)
    const dt = new Date(2024, 0, 15, 18 - Math.floor(i / 3), (i * 7) % 60, (i * 13) % 60)
    const dtStr = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
    const ip = `10.${10 + (i % 5)}.${i % 255}.${(i * 3) % 255}`
    const paramsObj: Record<string, unknown> = {
      page: i % 10 + 1,
      pageSize: 10,
      id: 10000 + i,
      name: operators[i % operators.length]
    }
    if (logType === 2 && operation.includes('新增')) {
      Object.assign(paramsObj, { createTime: dtStr, operator: operators[i % operators.length] })
    }
    const responseObj = result === 1
      ? { code: '000000', message: '处理成功', data: { affectedRows: 1, id: 10000 + i } }
      : { code: '999999', message: logType === 3 ? '系统内部错误：NullPointerException' : '操作失败：权限不足' }

    list.push({
      id: i,
      logId: `LOG${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}${String(100000 + i).padStart(8, '0')}`,
      logType,
      module,
      operation,
      operatorId: (i % 20) + 1,
      operatorName: operators[i % operators.length],
      operatorAccount: operators[i % operators.length].toLowerCase() + '@ccb.com',
      orgId: (i % orgs.length) + 1,
      orgName: orgs[i % orgs.length],
      ipAddress: ip,
      macAddress: ['00-1A-2B-3C-4D-5E', '00-1B-2C-3D-4E-5F', '00-1C-2D-3E-4F-50'][i % 3],
      browser: browsers[i % browsers.length],
      os: ['Windows 11', 'Windows 10', 'macOS 14.2', 'CentOS 7.9', 'Ubuntu 22.04'][i % 5],
      userAgent: browsers[i % browsers.length] + ' (Windows NT 10.0; Win64; x64)',
      result,
      responseMs: result === 1 ? 50 + (i % 200) : 3000 + (i % 5000),
      operateTime: dtStr,
      requestUrl: logType === 1
        ? '/api/auth/login'
        : `/api/${module.replace(/管理$/, '').toLowerCase()}/${operation.includes('新增') ? 'create' : operation.includes('修改') ? 'update' : operation.includes('删除') ? 'delete' : 'list'}`,
      requestMethod: logType === 1 ? 'POST' : (operation.includes('查询') || operation.includes('查看') ? 'GET' : ['GET', 'POST', 'PUT', 'DELETE'][i % 4]),
      requestParams: JSON.stringify(paramsObj),
      responseResult: JSON.stringify(responseObj),
      exceptionStack: logType === 3
        ? `java.lang.NullPointerException: Cannot invoke "String.length()" because "name" is null
\tat com.ccb.system.service.UserServiceImpl.createUser(UserServiceImpl.java:188)
\tat com.ccb.system.controller.UserController.create(UserController.java:72)
\tat sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
\tat org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:897)
\tat javax.servlet.http.HttpServlet.service(HttpServlet.java:750)`
        : ''
    })
  }
  return list
}

const allLogs = ref<SystemLog[]>(mockLogs())

const filteredLogs = computed(() => {
  let result = [...allLogs.value]
  if (searchForm.logType !== null) {
    result = result.filter(l => l.logType === searchForm.logType)
  }
  if (searchForm.module) {
    result = result.filter(l => l.module === searchForm.module)
  }
  if (searchForm.operatorName) {
    const kw = searchForm.operatorName.toLowerCase()
    result = result.filter(l =>
      l.operatorName.includes(searchForm.operatorName) ||
      l.operatorAccount.toLowerCase().includes(kw)
    )
  }
  if (searchForm.orgName) {
    result = result.filter(l => l.orgName.includes(searchForm.orgName))
  }
  if (searchForm.ipAddress) {
    result = result.filter(l => l.ipAddress.includes(searchForm.ipAddress))
  }
  if (searchForm.result !== null) {
    result = result.filter(l => l.result === searchForm.result)
  }
  return result
})

const successCount = computed(() => filteredLogs.value.filter(l => l.result === 1).length)
const failCount = computed(() => filteredLogs.value.filter(l => l.result === 0).length)

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    tableData.value = filteredLogs.value.slice(start, start + pageParams.pageSize)
    total.value = filteredLogs.value.length
    loading.value = false
  }, 400)
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.logType = null
  searchForm.module = ''
  searchForm.operatorName = ''
  searchForm.orgName = ''
  searchForm.ipAddress = ''
  searchForm.result = null
  searchForm.operateTimeRange = []
  handleSearch()
}

const handlePageChange = () => fetchData()

const handleSelectionChange = (val: unknown[]) => {
  selectedRows.value = val as SystemLog[]
}

const handleView = (row: SystemLog) => {
  currentLog.value = row
  detailDialogVisible.value = true
}

const handleExport = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`导出成功，共 ${filteredLogs.value.length} 条日志数据`)
  }, 800)
}

const handleClean = () => {
  ElMessageBox.confirm(
    '确认清理90天前的过期日志吗？此操作不可恢复，建议先导出备份。',
    '清理确认',
    { type: 'warning' }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      ElMessage.success('过期日志清理成功')
      allLogs.value = allLogs.value.slice(0, 28)
      fetchData()
    }, 600)
  }).catch(() => {})
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-system-log {
  :deep(.ccb-pre) {
    margin: 0;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.6;
    max-height: 240px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    color: #1f2937;
  }

  :deep(.ccb-error) {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  :deep(.ccb-code) {
    padding: 2px 6px;
    background: #f1f5f9;
    border-radius: 3px;
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    color: #004098;
  }

  :deep(.el-descriptions__label) {
    width: 120px;
    background: #f8fafc;
  }
}
</style>
