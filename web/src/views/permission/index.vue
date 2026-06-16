<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="账号">
          <el-input v-model="queryParams.keyword" placeholder="请输入账号/昵称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 150px">
            <el-option v-for="item in STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" style="margin-top: 20px">
      <el-empty description="权限管理页面开发中" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Search, RefreshRight } from '@element-plus/icons-vue'
import { STATUS_OPTIONS } from '@/constants'

const queryParams = reactive({
  keyword: '',
  status: '',
})

function handleSearch() {}
function handleReset() {
  queryParams.keyword = ''
  queryParams.status = ''
}
</script>
