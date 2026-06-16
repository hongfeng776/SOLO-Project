<template>
  <div class="page-container">
    <div class="page-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="个人信息" name="profile">
          <el-form :model="profileForm" label-width="100px" style="max-width: 500px;">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profileForm.phone" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <el-form :model="passwordForm" label-width="100px" style="max-width: 500px;">
            <el-form-item label="原密码">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary">确认修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="系统配置" name="config">
          <el-form label-width="120px" style="max-width: 600px;">
            <el-form-item label="订单自动取消时间">
              <el-input-number v-model="configForm.orderAutoCancelTime" :min="5" :max="120" />
              <span style="margin-left: 8px;">分钟</span>
            </el-form-item>
            <el-form-item label="自动确认收货时间">
              <el-input-number v-model="configForm.autoConfirmDays" :min="1" :max="30" />
              <span style="margin-left: 8px;">天</span>
            </el-form-item>
            <el-form-item label="售后申请期限">
              <el-input-number v-model="configForm.afterSaleDays" :min="1" :max="90" />
              <span style="margin-left: 8px;">天</span>
            </el-form-item>
            <el-form-item label="默认配送运费">
              <el-input-number v-model="configForm.defaultFreight" :min="0" :precision="2" />
              <span style="margin-left: 8px;">元</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const activeTab = ref('profile')

const profileForm = reactive({
  username: 'admin',
  nickname: '超级管理员',
  email: 'admin@example.com',
  phone: '13800138000'
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const configForm = reactive({
  orderAutoCancelTime: 30,
  autoConfirmDays: 7,
  afterSaleDays: 15,
  defaultFreight: 10
})
</script>
