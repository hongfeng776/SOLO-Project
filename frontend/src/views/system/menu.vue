<template>
  <div class="system-menu">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单列表</span>
          <el-button type="primary" size="small">
            <el-icon><Plus /></el-icon>
            新增菜单
          </el-button>
        </div>
      </template>
      <el-table :data="tableData" border row-key="id" default-expand-all>
        <el-table-column prop="name" label="菜单名称" width="200" />
        <el-table-column prop="path" label="路由地址" width="200" />
        <el-table-column prop="component" label="组件路径" width="250" />
        <el-table-column prop="icon" label="图标" width="100" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small">新增子菜单</el-button>
            <el-button type="primary" link size="small">编辑</el-button>
            <el-button type="danger" link size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tableData = ref([
  {
    id: 1,
    name: '工作台',
    path: '/dashboard',
    component: 'dashboard/index',
    icon: 'DataBoard',
    sort: 1,
    status: 1,
    children: []
  },
  {
    id: 2,
    name: '订单管理',
    path: '/order',
    component: 'Layout',
    icon: 'List',
    sort: 2,
    status: 1,
    children: [
      { id: 21, name: '订单列表', path: 'list', component: 'order/index', icon: 'Document', sort: 1, status: 1 },
      { id: 22, name: '订单调度', path: 'dispatch', component: 'order/dispatch', icon: 'Connection', sort: 2, status: 1 }
    ]
  },
  {
    id: 3,
    name: '司机管理',
    path: '/driver',
    component: 'Layout',
    icon: 'User',
    sort: 3,
    status: 1,
    children: [
      { id: 31, name: '司机列表', path: 'list', component: 'driver/index', icon: 'User', sort: 1, status: 1 },
      { id: 32, name: '资质审核', path: 'audit', component: 'driver/audit', icon: 'CircleCheck', sort: 2, status: 1 }
    ]
  }
])
</script>

<style lang="scss" scoped>
.system-menu {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
