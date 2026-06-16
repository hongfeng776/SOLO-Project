<template>
  <div class="ccb-system-org">
    <CcbPageHeader
      title="机构管理"
      description="管理银行组织架构与部门信息"
      icon="OfficeBuilding"
    >
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增机构</el-button>
      </template>
    </CcbPageHeader>

    <el-row :gutter="16">
      <el-col :span="6">
        <el-card class="ccb-org-tree-card">
          <template #header>
            <div class="ccb-org-tree-header">
              <span>机构树</span>
              <el-input
                v-model="treeFilterText"
                placeholder="搜索机构"
                size="small"
                clearable
                style="width: 160px;"
              />
            </div>
          </template>
          <el-tree
            ref="orgTreeRef"
            :data="orgTree"
            :props="treeProps"
            node-key="id"
            :filter-node-method="filterNode"
            :expand-on-click-node="false"
            highlight-current
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <span class="ccb-org-tree-node">
                <el-icon style="color: #004098; margin-right: 6px;">
                  <component :is="data.level === 1 ? 'GoldMedal' : data.level === 2 ? 'OfficeBuilding' : 'House'" />
                </el-icon>
                <span>{{ node.label }}</span>
                <el-tag size="small" effect="plain" style="margin-left: 6px;">
                  {{ data.orgCode }}
                </el-tag>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <el-col :span="18">
        <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
          <el-form-item label="机构编码" prop="orgCode">
            <el-input v-model="searchForm.orgCode" placeholder="请输入机构编码" clearable />
          </el-form-item>
          <el-form-item label="机构名称" prop="orgName">
            <el-input v-model="searchForm.orgName" placeholder="请输入机构名称" clearable />
          </el-form-item>
          <el-form-item label="机构类型" prop="orgType">
            <el-select v-model="searchForm.orgType" placeholder="请选择类型" clearable>
              <el-option label="总行" :value="1" />
              <el-option label="一级分行" :value="2" />
              <el-option label="二级分行" :value="3" />
              <el-option label="支行" :value="4" />
              <el-option label="网点" :value="5" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="正常" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
        </CcbSearchForm>

        <div class="ccb-table-toolbar">
          <div class="ccb-table-toolbar-left">
            <el-button type="danger" :icon="Delete" :disabled="selectedRows.length === 0" @click="handleBatchDelete">批量删除</el-button>
          </div>
          <div class="ccb-table-toolbar-right">
            <el-text type="info" size="small">当前机构：{{ currentOrg?.orgName || '全部' }}</el-text>
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
          <el-table-column prop="orgCode" label="机构编码" width="130" />
          <el-table-column prop="orgName" label="机构名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="orgType" label="机构类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getOrgTypeTagType(row.orgType)" effect="light" size="small">
                {{ getOrgTypeLabel(row.orgType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="级次" width="70" align="center" />
          <el-table-column prop="parentOrgName" label="上级机构" width="160" />
          <el-table-column prop="leader" label="负责人" width="100" />
          <el-table-column prop="phone" label="联系电话" width="130">
            <template #default="{ row }">
              {{ maskPhone(row.phone) }}
            </template>
          </el-table-column>
          <el-table-column prop="userCount" label="用户数" width="80" align="center" />
          <el-table-column prop="sort" label="排序" width="70" align="center" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
                {{ row.status === 1 ? '正常' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleAddChild(row)">添加子机构</el-button>
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleDisable(row)">停用</el-button>
              <el-button v-else type="success" link size="small" @click="handleEnable(row)">启用</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </CcbTable>
      </el-col>
    </el-row>

    <el-dialog
      v-model="formDialogVisible"
      :title="formMode === 'add' ? '新增机构' : formMode === 'addChild' ? '新增子机构' : '编辑机构'"
      width="600px"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form
        ref="orgFormRef"
        :model="orgForm"
        :rules="orgFormRules"
        label-width="100px"
      >
        <el-form-item v-if="formMode === 'edit'" label="上级机构" prop="parentId">
          <el-tree-select
            v-model="orgForm.parentId"
            :data="orgTree"
            :props="treeProps"
            node-key="id"
            check-strictly
            :render-after-expand="false"
            placeholder="请选择上级机构"
            style="width: 100%"
            check-on-click-node
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="机构编码" prop="orgCode">
              <el-input
                v-model="orgForm.orgCode"
                placeholder="请输入机构编码"
                :disabled="formMode === 'edit'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机构名称" prop="orgName">
              <el-input v-model="orgForm.orgName" placeholder="请输入机构名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="机构类型" prop="orgType">
              <el-select v-model="orgForm.orgType" placeholder="请选择机构类型" style="width: 100%">
                <el-option label="总行" :value="1" />
                <el-option label="一级分行" :value="2" />
                <el-option label="二级分行" :value="3" />
                <el-option label="支行" :value="4" />
                <el-option label="网点" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="级次" prop="level">
              <el-input-number
                v-model="orgForm.level"
                :min="1"
                :max="10"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-input v-model="orgForm.leader" placeholder="请输入负责人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="orgForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="地址" prop="address">
              <el-input v-model="orgForm.address" placeholder="请输入机构地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number
                v-model="orgForm.sort"
                :min="0"
                :max="999"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="机构说明" prop="description">
          <el-input
            v-model="orgForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入机构说明"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="orgForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Plus, Delete, GoldMedal, OfficeBuilding, House } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, TreeInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { maskPhone } from '@utils'

interface Org {
  id: number
  parentId: number
  orgCode: string
  orgName: string
  orgType: number
  level: number
  parentOrgName: string
  leader: string
  phone: string
  address: string
  userCount: number
  sort: number
  status: number
  description: string
  createdAt: string
  updatedAt: string
  children?: Org[]
}

const loading = ref<boolean>(false)
const tableData = ref<Org[]>([])
const total = ref<number>(0)
const selectedRows = ref<Org[]>([])
const currentOrg = ref<Org | null>(null)

const formDialogVisible = ref<boolean>(false)
const formMode = ref<'add' | 'addChild' | 'edit'>('add')
const formLoading = ref<boolean>(false)
const orgFormRef = ref<FormInstance>()
const orgTreeRef = ref<TreeInstance>()

const treeFilterText = ref<string>('')

const searchForm = reactive({
  orgCode: '',
  orgName: '',
  orgType: null as number | null,
  status: null as number | null
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const orgForm = reactive({
  id: 0,
  parentId: 0,
  orgCode: '',
  orgName: '',
  orgType: 4,
  level: 3,
  leader: '',
  phone: '',
  address: '',
  sort: 100,
  status: 1,
  description: ''
})

const orgFormRules: FormRules = {
  orgCode: [
    { required: true, message: '请输入机构编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9]+$/, message: '仅支持大写字母和数字', trigger: 'blur' }
  ],
  orgName: [
    { required: true, message: '请输入机构名称', trigger: 'blur' },
    { min: 2, max: 64, message: '名称长度在 2 到 64 个字符', trigger: 'blur' }
  ],
  orgType: [
    { required: true, message: '请选择机构类型', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请输入级次', trigger: 'blur' }
  ]
}

const treeProps = {
  children: 'children',
  label: 'orgName'
}

const getOrgTypeLabel = (type: number): string => {
  const labels: Record<number, string> = {
    1: '总行',
    2: '一级分行',
    3: '二级分行',
    4: '支行',
    5: '网点'
  }
  return labels[type] || '未知'
}

const getOrgTypeTagType = (type: number): string => {
  const types: Record<number, string> = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'success',
    5: 'info'
  }
  return types[type] || 'info'
}

const flattenOrgs = (orgs: Org[], result: Org[] = []): Org[] => {
  orgs.forEach((org) => {
    result.push({ ...org, children: undefined })
    if (org.children && org.children.length > 0) {
      flattenOrgs(org.children, result)
    }
  })
  return result
}

const mockOrgs: Org[] = [
  {
    id: 1, parentId: 0, orgCode: 'CCB_HEAD', orgName: '中国建设银行总行', orgType: 1, level: 1,
    parentOrgName: '-', leader: '张行长', phone: '13800000001', address: '北京市西城区金融大街25号',
    userCount: 350, sort: 1, status: 1, description: '总行机构，管理全行运营',
    createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-15 10:30:00',
    children: [
      {
        id: 2, parentId: 1, orgCode: 'CCB_BJ', orgName: '北京分行', orgType: 2, level: 2,
        parentOrgName: '中国建设银行总行', leader: '李行长', phone: '13800000002',
        address: '北京市东城区建国门内大街18号', userCount: 280, sort: 1, status: 1,
        description: '北京一级分行', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-15 10:30:00',
        children: [
          { id: 201, parentId: 2, orgCode: 'CCB_BJ_DC', orgName: '北京东城区支行', orgType: 4, level: 3,
            parentOrgName: '北京分行', leader: '王经理', phone: '13800000201',
            address: '北京市东城区王府井大街88号', userCount: 65, sort: 1, status: 1,
            description: '东城区核心支行', createdAt: '2024-01-02 09:00:00', updatedAt: '2024-01-15 10:30:00',
            children: [
              { id: 20101, parentId: 201, orgCode: 'CCB_BJ_DC_WFJ', orgName: '王府井网点', orgType: 5, level: 4,
                parentOrgName: '北京东城区支行', leader: '赵主任', phone: '13800001101',
                address: '北京市东城区王府井大街255号', userCount: 18, sort: 1, status: 1,
                description: '王府井核心网点', createdAt: '2024-01-03 09:00:00', updatedAt: '2024-01-15 10:30:00' },
              { id: 20102, parentId: 201, orgCode: 'CCB_BJ_DC_GM', orgName: '国贸网点', orgType: 5, level: 4,
                parentOrgName: '北京东城区支行', leader: '刘主任', phone: '13800001102',
                address: '北京市朝阳区建国门外大街1号', userCount: 15, sort: 2, status: 1,
                description: 'CBD国贸商圈网点', createdAt: '2024-01-03 09:00:00', updatedAt: '2024-01-15 10:30:00' }
            ]
          },
          { id: 202, parentId: 2, orgCode: 'CCB_BJ_XC', orgName: '北京西城区支行', orgType: 4, level: 3,
            parentOrgName: '北京分行', leader: '孙经理', phone: '13800000202',
            address: '北京市西城区西单北大街120号', userCount: 72, sort: 2, status: 1,
            description: '西城区金融街支行', createdAt: '2024-01-02 09:00:00', updatedAt: '2024-01-15 10:30:00',
            children: [
              { id: 20201, parentId: 202, orgCode: 'CCB_BJ_XC_JR', orgName: '金融街网点', orgType: 5, level: 4,
                parentOrgName: '北京西城区支行', leader: '周主任', phone: '13800001103',
                address: '北京市西城区金融街7号', userCount: 22, sort: 1, status: 1,
                description: '金融街核心网点', createdAt: '2024-01-03 09:00:00', updatedAt: '2024-01-15 10:30:00' }
            ]
          }
        ]
      },
      {
        id: 3, parentId: 1, orgCode: 'CCB_SH', orgName: '上海分行', orgType: 2, level: 2,
        parentOrgName: '中国建设银行总行', leader: '陈行长', phone: '13800000003',
        address: '上海市浦东新区陆家嘴环路900号', userCount: 320, sort: 2, status: 1,
        description: '上海一级分行', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-15 10:30:00',
        children: [
          { id: 301, parentId: 3, orgCode: 'CCB_SH_PD', orgName: '上海浦东支行', orgType: 4, level: 3,
            parentOrgName: '上海分行', leader: '朱经理', phone: '13800000301',
            address: '上海市浦东新区陆家嘴东路166号', userCount: 88, sort: 1, status: 1,
            description: '浦东陆家嘴支行', createdAt: '2024-01-02 09:00:00', updatedAt: '2024-01-15 10:30:00',
            children: [
              { id: 30101, parentId: 301, orgCode: 'CCB_SH_PD_LJZ', orgName: '陆家嘴网点', orgType: 5, level: 4,
                parentOrgName: '上海浦东支行', leader: '吴主任', phone: '13800001201',
                address: '上海市浦东新区世纪大道100号', userCount: 25, sort: 1, status: 1,
                description: '陆家嘴金融区网点', createdAt: '2024-01-03 09:00:00', updatedAt: '2024-01-15 10:30:00' }
            ]
          },
          { id: 302, parentId: 3, orgCode: 'CCB_SH_HP', orgName: '上海黄浦支行', orgType: 4, level: 3,
            parentOrgName: '上海分行', leader: '马经理', phone: '13800000302',
            address: '上海市黄浦区中山东一路23号', userCount: 68, sort: 2, status: 1,
            description: '外滩核心支行', createdAt: '2024-01-02 09:00:00', updatedAt: '2024-01-15 10:30:00' }
        ]
      },
      {
        id: 4, parentId: 1, orgCode: 'CCB_SZ', orgName: '深圳分行', orgType: 2, level: 2,
        parentOrgName: '中国建设银行总行', leader: '王行长', phone: '13800000004',
        address: '深圳市福田区益田路6009号新世界中心', userCount: 290, sort: 3, status: 1,
        description: '深圳计划单列市分行', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-15 10:30:00',
        children: [
          { id: 401, parentId: 4, orgCode: 'CCB_SZ_FT', orgName: '深圳福田支行', orgType: 4, level: 3,
            parentOrgName: '深圳分行', leader: '胡经理', phone: '13800000401',
            address: '深圳市福田区深南大道6011号', userCount: 76, sort: 1, status: 1,
            description: '福田中心区支行', createdAt: '2024-01-02 09:00:00', updatedAt: '2024-01-15 10:30:00' },
          { id: 402, parentId: 4, orgCode: 'CCB_SZ_NS', orgName: '深圳南山支行', orgType: 4, level: 3,
            parentOrgName: '深圳分行', leader: '郭经理', phone: '13800000402',
            address: '深圳市南山区科技园南区高新南一道', userCount: 62, sort: 2, status: 0,
            description: '南山科技园支行（临时维护中）', createdAt: '2024-01-02 09:00:00', updatedAt: '2024-01-15 10:30:00' }
        ]
      },
      {
        id: 5, parentId: 1, orgCode: 'CCB_GZ', orgName: '广州分行', orgType: 2, level: 2,
        parentOrgName: '中国建设银行总行', leader: '黄行长', phone: '13800000005',
        address: '广州市越秀区东风中路509号建银大厦', userCount: 260, sort: 4, status: 1,
        description: '广东分行营业部（广州）', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-15 10:30:00',
        children: [
          { id: 501, parentId: 5, orgCode: 'CCB_GZ_YX', orgName: '广州越秀支行', orgType: 4, level: 3,
            parentOrgName: '广州分行', leader: '何经理', phone: '13800000501',
            address: '广州市越秀区北京路2号', userCount: 58, sort: 1, status: 1,
            description: '越秀老城区支行', createdAt: '2024-01-02 09:00:00', updatedAt: '2024-01-15 10:30:00' },
          { id: 502, parentId: 5, orgCode: 'CCB_GZ_TH', orgName: '广州天河支行', orgType: 4, level: 3,
            parentOrgName: '广州分行', leader: '高经理', phone: '13800000502',
            address: '广州市天河区珠江新城花城大道85号', userCount: 66, sort: 2, status: 1,
            description: '珠江新城CBD支行', createdAt: '2024-01-02 09:00:00', updatedAt: '2024-01-15 10:30:00' }
        ]
      },
      {
        id: 6, parentId: 1, orgCode: 'CCB_HZ', orgName: '杭州分行', orgType: 2, level: 2,
        parentOrgName: '中国建设银行总行', leader: '赵行长', phone: '13800000006',
        address: '杭州市西湖区延安路88号建行大厦', userCount: 220, sort: 5, status: 1,
        description: '浙江分行营业部（杭州）', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-15 10:30:00',
        children: [
          { id: 601, parentId: 6, orgCode: 'CCB_HZ_XH', orgName: '杭州西湖支行', orgType: 4, level: 3,
            parentOrgName: '杭州分行', leader: '林经理', phone: '13800000601',
            address: '杭州市西湖区文三路478号', userCount: 52, sort: 1, status: 1,
            description: '西湖区文教支行', createdAt: '2024-01-02 09:00:00', updatedAt: '2024-01-15 10:30:00' }
        ]
      }
    ]
  }
]

const allOrgs = computed(() => flattenOrgs(mockOrgs))

const filteredOrgs = computed(() => {
  let result = [...allOrgs.value]
  if (currentOrg.value) {
    const ids = new Set<number>()
    const collect = (orgs: Org[]) => {
      orgs.forEach(o => {
        if (o.id === currentOrg.value!.id || ids.has(o.parentId)) {
          ids.add(o.id)
          if (o.children) collect(o.children)
        }
      })
    }
    collect(mockOrgs)
    result = result.filter(o => ids.has(o.id))
  }
  if (searchForm.orgCode) {
    result = result.filter(o => o.orgCode.toLowerCase().includes(searchForm.orgCode.toLowerCase()))
  }
  if (searchForm.orgName) {
    result = result.filter(o => o.orgName.includes(searchForm.orgName))
  }
  if (searchForm.orgType !== null) {
    result = result.filter(o => o.orgType === searchForm.orgType)
  }
  if (searchForm.status !== null) {
    result = result.filter(o => o.status === searchForm.status)
  }
  return result
})

const orgTree = computed(() => mockOrgs)

const filterNode = (value: string, data: Org): boolean => {
  if (!value) return true
  return data.orgName.includes(value) || data.orgCode.toLowerCase().includes(value.toLowerCase())
}

watch(treeFilterText, (val) => {
  orgTreeRef.value?.filter(val)
})

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    tableData.value = filteredOrgs.value.slice(start, start + pageParams.pageSize)
    total.value = filteredOrgs.value.length
    loading.value = false
  }, 400)
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.orgCode = ''
  searchForm.orgName = ''
  searchForm.orgType = null
  searchForm.status = null
  handleSearch()
}

const handlePageChange = () => fetchData()

const handleNodeClick = (data: Org) => {
  currentOrg.value = data
  pageParams.page = 1
  fetchData()
}

const handleClearNode = () => {
  currentOrg.value = null
  fetchData()
}

const resetOrgForm = () => {
  orgForm.id = 0
  orgForm.parentId = currentOrg.value?.id || 0
  orgForm.orgCode = ''
  orgForm.orgName = ''
  orgForm.orgType = currentOrg.value ? Math.min(currentOrg.value.orgType + 1, 5) : 4
  orgForm.level = currentOrg.value ? currentOrg.value.level + 1 : 3
  orgForm.leader = ''
  orgForm.phone = ''
  orgForm.address = ''
  orgForm.sort = 100
  orgForm.status = 1
  orgForm.description = ''
  orgFormRef.value?.resetFields()
}

const handleAdd = () => {
  formMode.value = 'add'
  resetOrgForm()
  orgForm.parentId = 0
  orgForm.orgType = 2
  orgForm.level = 2
  formDialogVisible.value = true
}

const handleAddChild = () => {
  if (!currentOrg.value) {
    ElMessage.warning('请先在左侧选择上级机构')
    return
  }
  formMode.value = 'addChild'
  resetOrgForm()
  formDialogVisible.value = true
}

const handleEdit = (row: Org) => {
  formMode.value = 'edit'
  orgForm.id = row.id
  orgForm.parentId = row.parentId
  orgForm.orgCode = row.orgCode
  orgForm.orgName = row.orgName
  orgForm.orgType = row.orgType
  orgForm.level = row.level
  orgForm.leader = row.leader
  orgForm.phone = row.phone
  orgForm.address = row.address
  orgForm.sort = row.sort
  orgForm.status = row.status
  orgForm.description = row.description
  formDialogVisible.value = true
}

const handleEnable = (row: Org) => {
  ElMessageBox.confirm(`确认启用机构【${row.orgName}】吗？`, '确认提示', {
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      row.status = 1
      ElMessage.success('启用成功')
      loading.value = false
      fetchData()
    }, 400)
  }).catch(() => {})
}

const handleDisable = (row: Org) => {
  ElMessageBox.confirm(`确认停用机构【${row.orgName}】吗？停用后该机构下用户将无法登录。`, '确认提示', {
    type: 'warning'
  }).then(() => {
    loading.value = true
    setTimeout(() => {
      row.status = 0
      ElMessage.success('停用成功')
      loading.value = false
      fetchData()
    }, 400)
  }).catch(() => {})
}

const handleDelete = (row: Org) => {
  ElMessageBox.confirm(
    `确认删除机构【${row.orgName}】吗？此操作不可恢复，且若存在下级机构将一并删除。`,
    '删除确认',
    { type: 'error' }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      ElMessage.success('删除成功')
      loading.value = false
      fetchData()
    }, 400)
  }).catch(() => {})
}

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的机构')
    return
  }
  ElMessageBox.confirm(
    `确认删除选中的 ${selectedRows.value.length} 个机构吗？此操作不可恢复。`,
    '批量删除确认',
    { type: 'error' }
  ).then(() => {
    loading.value = true
    setTimeout(() => {
      selectedRows.value = []
      ElMessage.success('批量删除成功')
      loading.value = false
      fetchData()
    }, 400)
  }).catch(() => {})
}

const handleDialogClosed = () => {
  orgFormRef.value?.resetFields()
}

const handleSubmit = () => {
  orgFormRef.value?.validate((valid) => {
    if (!valid) return
    formLoading.value = true
    setTimeout(() => {
      formLoading.value = false
      formDialogVisible.value = false
      ElMessage.success(formMode.value === 'edit' ? '修改成功' : '新增成功')
      fetchData()
    }, 600)
  })
}

const getTreeIcon = (row: Org) => {
  if (row.orgType === 1) return GoldMedal
  if (row.orgType <= 3) return OfficeBuilding
  return House
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-org-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

.ccb-org-tree-card {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
  }
}

.ccb-org-tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .ccb-org-tree-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  .ccb-org-clear-btn {
    font-size: 12px;
    color: #004098;
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }
}

.ccb-org-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  .org-icon { color: #004098; }
  .org-status-disabled { color: #9ca3af; text-decoration: line-through; }
}

.ccb-org-table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-tree) {
  flex: 1;
  overflow: auto;
  background: transparent;
}
</style>