<template>
  <div class="settings-page">
    <div class="page-header">
      <h2 class="page-title">系统设置</h2>
    </div>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <el-tab-pane label="基本设置" name="basic">
        <div class="card-wrapper">
          <el-form :model="basicForm" label-width="120px" style="max-width: 600px">
            <el-form-item label="站点名称">
              <el-input v-model="basicForm.siteName" />
            </el-form-item>
            <el-form-item label="站点描述">
              <el-input v-model="basicForm.siteDesc" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="站点Logo">
              <el-upload
                action="#"
                :show-file-list="false"
                :auto-upload="false"
              >
                <el-button type="primary">上传Logo</el-button>
              </el-upload>
            </el-form-item>
            <el-form-item label="联系邮箱">
              <el-input v-model="basicForm.contactEmail" />
            </el-form-item>
            <el-form-item label="备案号">
              <el-input v-model="basicForm.icp" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveBasic">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="上传设置" name="upload">
        <div class="card-wrapper">
          <el-form :model="uploadForm" label-width="120px" style="max-width: 600px">
            <el-form-item label="图片最大大小">
              <el-input-number v-model="uploadForm.imageMaxSize" :min="1" :max="100" />
              <span style="margin-left: 8px">MB</span>
            </el-form-item>
            <el-form-item label="视频最大大小">
              <el-input-number v-model="uploadForm.videoMaxSize" :min="10" :max="2000" />
              <span style="margin-left: 8px">MB</span>
            </el-form-item>
            <el-form-item label="允许的图片格式">
              <el-checkbox-group v-model="uploadForm.imageTypes">
                <el-checkbox label="jpg">JPG</el-checkbox>
                <el-checkbox label="png">PNG</el-checkbox>
                <el-checkbox label="gif">GIF</el-checkbox>
                <el-checkbox label="webp">WebP</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="允许的视频格式">
              <el-checkbox-group v-model="uploadForm.videoTypes">
                <el-checkbox label="mp4">MP4</el-checkbox>
                <el-checkbox label="avi">AVI</el-checkbox>
                <el-checkbox label="mov">MOV</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveUpload">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="审核设置" name="audit">
        <div class="card-wrapper">
          <el-form :model="auditForm" label-width="120px" style="max-width: 600px">
            <el-form-item label="审核层级">
              <el-radio-group v-model="auditForm.auditLevel">
                <el-radio :value="1">一级审核</el-radio>
                <el-radio :value="2">二级审核</el-radio>
                <el-radio :value="3">三级审核</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="是否需要审核">
              <el-switch v-model="auditForm.requireAudit" />
            </el-form-item>
            <el-form-item label="自动审核">
              <el-switch v-model="auditForm.autoAudit" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveAudit">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('basic')

const basicForm = reactive({
  siteName: '影创智修',
  siteDesc: '专业的影像内容运营平台',
  siteLogo: '',
  contactEmail: 'admin@yingchuang.com',
  icp: '京ICP备12345678号'
})

const uploadForm = reactive({
  imageMaxSize: 10,
  videoMaxSize: 500,
  imageTypes: ['jpg', 'png', 'gif', 'webp'],
  videoTypes: ['mp4', 'avi', 'mov']
})

const auditForm = reactive({
  auditLevel: 1,
  requireAudit: true,
  autoAudit: false
})

const handleSaveBasic = () => {
  ElMessage.success('基本设置保存成功')
}

const handleSaveUpload = () => {
  ElMessage.success('上传设置保存成功')
}

const handleSaveAudit = () => {
  ElMessage.success('审核设置保存成功')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.settings-page {
  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .settings-tabs {
    :deep(.el-tabs__content) {
      padding: 0;
    }
  }
}
</style>
