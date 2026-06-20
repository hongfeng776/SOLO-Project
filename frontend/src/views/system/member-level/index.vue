<template>
  <div class="member-level-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon :size="22" color="#409EFF"><Medal /></el-icon>
          会员等级配置
        </h2>
        <span class="page-desc">管理会员等级体系、权益配置与升级规则</span>
      </div>
      <div class="header-right">
        <el-button :icon="Refresh" @click="loadAllData" :loading="refreshing" style="border-radius: 8px">
          刷新数据
        </el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog" style="border-radius: 8px">
          创建等级
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">总等级数</div>
            <div class="stat-value">{{ stats.totalLevels ?? 0 }}</div>
          </div>
          <el-icon class="stat-icon" color="#409EFF"><Trophy /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">已启用等级</div>
            <div class="stat-value" style="color: #67C23A">{{ stats.enabledCount ?? 0 }}</div>
          </div>
          <el-icon class="stat-icon" color="#67C23A"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">分值覆盖范围</div>
            <div class="stat-value" style="color: #E6A23C; font-size: 18px">
              {{ stats.scoreRange?.minScore ?? 0 }} - {{ stats.scoreRange?.maxScore ?? 0 }}
            </div>
          </div>
          <el-icon class="stat-icon" color="#E6A23C"><TrendCharts /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">待重算任务</div>
            <div class="stat-value" style="color: #F56C6C">{{ stats.pendingRecalcCount ?? 0 }}</div>
          </div>
          <el-icon class="stat-icon" color="#F56C6C"><Clock /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="queryForm" @submit.prevent>
        <el-form-item label="视图模式">
          <el-radio-group v-model="viewMode" style="border-radius: 8px">
            <el-radio-button label="card">卡片视图</el-radio-button>
            <el-radio-button label="table">表格视图</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="层级">
          <el-input-number v-model="queryForm.levelTier" :min="1" controls-position="right" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="生效状态">
          <el-select v-model="queryForm.isEnabled" placeholder="全部" clearable style="width: 140px">
            <el-option label="已启用" :value="1" />
            <el-option label="已停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="核心等级">
          <el-select v-model="queryForm.isCoreHighest" placeholder="全部" clearable style="width: 140px">
            <el-option label="核心最高级" :value="1" />
            <el-option label="普通等级" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级编码/名称">
          <el-input v-model="queryForm.keyword" placeholder="请输入关键词" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLevelList" style="border-radius: 8px">查询</el-button>
          <el-button @click="resetQuery" style="border-radius: 8px">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <transition name="fade" mode="out-in">
      <el-card v-show="viewMode === 'card'" class="level-card-wrapper" shadow="never">
        <div v-if="selectedIds.length > 0" class="batch-toolbar">
          <div class="batch-info">
            已选择 <span class="selected-count">{{ selectedIds.length }}</span> 个等级
          </div>
          <el-button
            type="success"
            size="small"
            :icon="CircleCheck"
            :loading="batchLoading"
            @click="handleBatchAction('batch_enable')"
            style="border-radius: 8px"
          >批量启用</el-button>
          <el-button
            type="warning"
            size="small"
            :icon="SwitchButton"
            :loading="batchLoading"
            @click="handleBatchAction('batch_disable')"
            style="border-radius: 8px"
          >批量停用</el-button>
          <el-button
            type="primary"
            size="small"
            :icon="Refresh"
            :loading="batchLoading"
            @click="openBatchSyncDialog"
            style="border-radius: 8px"
          >批量同步权益</el-button>
          <el-button size="small" @click="clearSelection" style="border-radius: 8px">取消选择</el-button>
        </div>

        <div v-if="levelList.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无会员等级，点击右上角创建" />
        </div>
        <div v-else class="cards-grid">
          <div
            v-for="level in levelList"
            :key="level.id"
            class="level-card-item"
            :class="{ 'is-selected': selectedIds.includes(level.id), 'is-core': level.isCoreHighest === 1 }"
            :style="{ '--card-color': level.levelColor || '#409EFF' }"
          >
            <div class="card-select" @click.stop="toggleSelect(level.id)">
              <el-checkbox :model-value="selectedIds.includes(level.id)" @change="toggleSelect(level.id)" />
            </div>
            <div v-if="level.isCoreHighest === 1" class="core-badge">
              <el-icon><Crown /></el-icon>
              核心最高级
            </div>
            <div class="card-header">
              <div class="level-code-badge">{{ level.levelCode }}</div>
              <div class="level-tier">L{{ level.levelTier }}</div>
            </div>
            <div class="card-body">
              <h3 class="level-name">{{ level.levelName }}</h3>
              <div class="score-range">
                <el-tag type="info" effect="plain" style="border-radius: 6px">
                  升级分值: {{ level.minScore }} - {{ level.maxScore }}
                </el-tag>
              </div>
              <div class="privileges-preview">
                <div class="privileges-title">
                  专属权益 ({{ level.privileges?.length || 0 }})
                </div>
                <div class="privileges-tags">
                  <el-tag
                    v-for="(p, idx) in (level.privileges || []).slice(0, 4)"
                    :key="idx"
                    size="small"
                    effect="light"
                    style="border-radius: 6px; margin-right: 4px; margin-bottom: 4px"
                  >
                    {{ p.privilegeName }}
                  </el-tag>
                  <el-tag
                    v-if="(level.privileges || []).length > 4"
                    size="small"
                    effect="plain"
                    style="border-radius: 6px"
                  >
                    +{{ level.privileges.length - 4 }} 更多
                  </el-tag>
                </div>
              </div>
              <div class="card-meta">
                <div class="meta-item">
                  <span class="meta-label">用户数</span>
                  <span class="meta-value">{{ level.userCount ?? 0 }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">状态</span>
                  <el-tag
                    :type="level.isEnabled === 1 ? 'success' : 'info'"
                    effect="dark"
                    size="small"
                    style="border-radius: 6px"
                  >{{ level.isEnabled === 1 ? '已启用' : '已停用' }}</el-tag>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <div class="create-time">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(level.createdAt) }}
              </div>
              <div class="card-actions">
                <el-button
                  link
                  type="primary"
                  :icon="View"
                  size="small"
                  @click.stop="openTraceDrawer('levelCode', level.levelCode)"
                >溯源</el-button>
                <el-button
                  v-if="level.isEnabled !== 1"
                  link
                  type="success"
                  :icon="CircleCheck"
                  size="small"
                  @click.stop="handleEnable(level)"
                >启用</el-button>
                <el-button
                  v-else-if="level.isCoreHighest !== 1"
                  link
                  type="warning"
                  :icon="SwitchButton"
                  size="small"
                  @click.stop="handleDisable(level)"
                >停用</el-button>
                <el-button
                  link
                  type="primary"
                  :icon="EditPen"
                  size="small"
                  @click.stop="openEditDialog(level)"
                >编辑</el-button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="pagination.total > 0" class="pagination-wrap">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[8, 16, 24, 40]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadLevelList"
            @current-change="loadLevelList"
          />
        </div>
      </el-card>

      <el-card v-show="viewMode === 'table'" class="level-table-wrapper" shadow="never">
        <div v-if="selectedIds.length > 0" class="batch-toolbar">
          <div class="batch-info">
            已选择 <span class="selected-count">{{ selectedIds.length }}</span> 个等级
          </div>
          <el-button type="success" size="small" :icon="CircleCheck" :loading="batchLoading" @click="handleBatchAction('batch_enable')" style="border-radius: 8px">批量启用</el-button>
          <el-button type="warning" size="small" :icon="SwitchButton" :loading="batchLoading" @click="handleBatchAction('batch_disable')" style="border-radius: 8px">批量停用</el-button>
          <el-button type="primary" size="small" :icon="Refresh" :loading="batchLoading" @click="openBatchSyncDialog" style="border-radius: 8px">批量同步权益</el-button>
          <el-button size="small" @click="clearSelection" style="border-radius: 8px">取消选择</el-button>
        </div>

        <el-table
          :data="levelList"
          v-loading="loading"
          stripe
          border
          @selection-change="handleSelectionChange"
          @header-dragend="handleHeaderDragend"
          style="width: 100%"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="levelCode" label="等级编码" width="110" fixed min-width="100">
            <template #default="{ row }">
              <el-tag size="small" effect="dark" style="background: #409EFF; border-radius: 6px">{{ row.levelCode }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="levelName" label="等级名称" min-width="130">
            <template #default="{ row }">
              <div class="cell-level-name">
                <span v-if="row.isCoreHighest === 1" class="core-icon"><el-icon color="#E6A23C"><Crown /></el-icon></span>
                {{ row.levelName }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="levelTier" label="层级" width="80" align="center">
            <template #default="{ row }">
              <el-tag type="warning" size="small" style="border-radius: 6px">L{{ row.levelTier }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="升级分值区间" min-width="160">
            <template #default="{ row }">
              <div class="score-range-cell">
                <span class="score-min">{{ row.minScore }}</span>
                <span class="score-arrow">→</span>
                <span class="score-max">{{ row.maxScore }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="权益数" width="80" align="center" prop="privileges">
            <template #default="{ row }">
              <el-tag effect="plain" type="primary" style="border-radius: 6px">{{ row.privileges?.length || 0 }}项</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="userCount" label="覆盖用户数" width="110" align="center">
            <template #default="{ row }">{{ row.userCount ?? 0 }}</template>
          </el-table-column>
          <el-table-column prop="configBatch" label="配置批次" width="180" min-width="160">
            <template #default="{ row }">
              <span class="batch-text" @click="openTraceDrawer('configBatch', row.configBatch)">
                {{ row.configBatch }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="生效状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isEnabled === 1 ? 'success' : 'info'" effect="dark" style="border-radius: 6px">
                {{ row.isEnabled === 1 ? '已启用' : '已停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160">
            <template #default="{ row }">{{ formatDate(row.createdAt, true) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" :icon="View" @click="openTraceDrawer('levelCode', row.levelCode)">溯源</el-button>
              <el-button
                v-if="row.isEnabled !== 1"
                link
                type="success"
                size="small"
                :icon="CircleCheck"
                @click="handleEnable(row)"
              >启用</el-button>
              <el-button
                v-else-if="row.isCoreHighest !== 1"
                link
                type="warning"
                size="small"
                :icon="SwitchButton"
                @click="handleDisable(row)"
              >停用</el-button>
              <el-button link type="primary" size="small" :icon="EditPen" @click="openEditDialog(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadLevelList"
            @current-change="loadLevelList"
          />
        </div>
      </el-card>
    </transition>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑会员等级' : '创建会员等级'"
      width="720px"
      :close-on-click-modal="false"
      class="level-dialog"
    >
      <div class="dialog-fade-wrap">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
          @submit.prevent
        >
          <el-alert
            v-if="conflictResult && !conflictResult.canSubmit"
            type="error"
            :closable="false"
            show-icon
            class="conflict-alert"
          >
            <template #title>配置校验未通过</template>
            <div v-for="(c, idx) in conflictResult.conflicts.slice(0, 3)" :key="idx" class="conflict-item">
              <span class="conflict-msg">{{ c.message }}</span>
              <span class="conflict-suggest">建议：{{ c.suggestion }}</span>
            </div>
          </el-alert>
          <el-alert
            v-if="isEdit && formData.isEnabled === 1 && !scoreChangedConfirmed"
            type="warning"
            :closable="false"
            show-icon
            class="warn-alert"
            title="线上生效等级，修改后将影响存量用户权益，请谨慎操作"
          />

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="等级名称" prop="levelName">
                <el-input v-model="formData.levelName" placeholder="请输入等级名称" maxlength="50" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="等级层级" prop="levelTier">
                <el-input-number v-model="formData.levelTier" :min="1" :max="99" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="起始分值" prop="minScore">
                <el-input-number v-model="formData.minScore" :min="0" :max="9999999" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束分值" prop="maxScore">
                <el-input-number v-model="formData.maxScore" :min="0" :max="9999999" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="等级图标">
                <el-input v-model="formData.levelIcon" placeholder="图标URL（可选）" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="主题色">
                <el-color-picker v-model="formData.levelColor" show-alpha style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="专属权益">
            <div class="privileges-editor">
              <div class="privileges-toolbar">
                <span class="tool-hint">勾选并配置此等级包含的权益</span>
                <el-button size="small" :icon="Plus" type="primary" link @click="addCustomPrivilege" style="border-radius: 8px">
                  添加自定义权益
                </el-button>
              </div>
              <el-table :data="formData.privileges" border size="small" class="privileges-table">
                <el-table-column label="选用" width="55" align="center">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.__selected" :value="row.__selected !== false" />
                  </template>
                </el-table-column>
                <el-table-column prop="privilegeCode" label="权益编码" width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.privilegeCode" size="small" placeholder="编码" />
                  </template>
                </el-table-column>
                <el-table-column prop="privilegeName" label="权益名称" width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.privilegeName" size="small" placeholder="名称" />
                  </template>
                </el-table-column>
                <el-table-column prop="privilegeValue" label="权益值" min-width="130">
                  <template #default="{ row }">
                    <el-input v-model="row.privilegeValue" size="small" placeholder="值" />
                  </template>
                </el-table-column>
                <el-table-column prop="privilegeDesc" label="权益说明" min-width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.privilegeDesc" size="small" placeholder="说明" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="70" align="center">
                  <template #default="{ $index }">
                    <el-button link type="danger" size="small" :icon="Delete" @click="removePrivilege($index)" />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-form-item>

          <el-form-item label="升级条件">
            <div class="condition-editor">
              <el-radio-group v-model="conditionMode">
                <el-radio-button label="score">仅按分值</el-radio-button>
                <el-radio-button label="custom">自定义条件</el-radio-button>
              </el-radio-group>
              <div v-if="conditionMode === 'custom'" class="condition-input">
                <el-input
                  v-model="conditionJson"
                  type="textarea"
                  :rows="3"
                  placeholder='以JSON格式配置额外条件，如 {"minDays": 30, "requiredTags": ["优质用户"]}'
                />
                <div v-if="conditionError" class="condition-error">{{ conditionError }}</div>
              </div>
              <div v-else class="condition-hint">
                <el-icon color="#67C23A"><InfoFilled /></el-icon>
                仅根据升级分值区间自动判断，无需额外条件
              </div>
            </div>
          </el-form-item>

          <el-form-item label="备注">
            <el-input v-model="formData.remark" type="textarea" :rows="2" maxlength="500" show-word-limit />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false" style="border-radius: 8px">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
          :disabled="conflictResult ? !conflictResult.canSubmit : false"
          style="border-radius: 8px"
        >
          {{ submitLoading ? '提交中...' : (isEdit ? '保存修改' : '创建等级') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchSyncVisible"
      title="批量同步权益配置"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="将源等级的权益配置覆盖至所有目标等级，请谨慎操作"
        style="margin-bottom: 16px"
      />
      <el-form label-width="100px">
        <el-form-item label="源等级">
          <el-select v-model="sourceLevelId" placeholder="选择权益来源的等级" style="width: 100%">
            <el-option
              v-for="lv in levelList.filter(l => selectedIds.includes(l.id))"
              :key="lv.id"
              :value="lv.id"
              :label="`${lv.levelCode} - ${lv.levelName} (权益${lv.privileges?.length || 0}项)`"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标等级">
          <el-tag
            v-for="id in (selectedIds.filter(i => i !== sourceLevelId))"
            :key="id"
            style="margin-right: 6px; margin-bottom: 4px; border-radius: 6px"
          >
            {{ getLevelLabel(id) }}
          </el-tag>
          <span v-if="selectedIds.length <= 1" style="color: #909399">请先选择多个等级</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSyncVisible = false" style="border-radius: 8px">取消</el-button>
        <el-button
          type="primary"
          :loading="batchLoading"
          :disabled="!sourceLevelId || selectedIds.length <= 1"
          @click="handleBatchAction('batch_sync_privileges')"
          style="border-radius: 8px"
        >
          确认同步
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="traceDrawerVisible"
      title="等级配置溯源"
      direction="rtl"
      size="620px"
      class="trace-drawer"
    >
      <div class="trace-toolbar">
        <el-radio-group v-model="traceForm.traceType" size="default">
          <el-radio-button value="levelCode">等级编码</el-radio-button>
          <el-radio-button value="configBatch">配置批次</el-radio-button>
          <el-radio-button value="upgradeRecord">升级记录ID</el-radio-button>
        </el-radio-group>
        <el-input
          v-model="traceForm.traceValue"
          placeholder="请输入溯源值"
          class="trace-input"
          clearable
          @keyup.enter="loadTraceData"
        >
          <template #append>
            <el-button :icon="Search" type="primary" @click="loadTraceData" style="border-radius: 0 8px 8px 0">查询</el-button>
          </template>
        </el-input>
      </div>

      <div v-if="!traceResult" class="trace-empty">
        <el-empty description="请输入溯源条件并查询" />
      </div>
      <div v-else-if="!traceResult.found" class="trace-empty">
        <el-empty description="未找到相关信息" />
      </div>
      <div v-else class="trace-content">
        <div v-if="traceResult.summary" class="trace-summary">
          <el-row :gutter="12">
            <el-col :span="8">
              <el-statistic title="配置变更次数" :value="traceResult.summary.totalChanges || 0" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="升级记录数" :value="traceResult.summary.totalUpgrades || 0" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="影响用户数" :value="traceResult.summary.affectedUsers || 0" />
            </el-col>
          </el-row>
        </div>

        <div v-if="traceResult.level" class="trace-section">
          <h4 class="section-title">
            <el-icon color="#409EFF"><Medal /></el-icon>
            等级信息
          </h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="编码">{{ traceResult.level.levelCode }}</el-descriptions-item>
            <el-descriptions-item label="名称">{{ traceResult.level.levelName }}</el-descriptions-item>
            <el-descriptions-item label="层级">L{{ traceResult.level.levelTier }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="traceResult.level.isEnabled === 1 ? 'success' : 'info'" style="border-radius: 6px">
                {{ traceResult.level.isEnabled === 1 ? '已启用' : '已停用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="分值区间">{{ traceResult.level.minScore }} - {{ traceResult.level.maxScore }}</el-descriptions-item>
            <el-descriptions-item label="权益数">{{ traceResult.level.privileges?.length || 0 }}项</el-descriptions-item>
            <el-descriptions-item label="配置批次" :span="2">{{ traceResult.level.configBatch }}</el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">{{ formatDate(traceResult.level.createdAt, true) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="traceResult.recentLogs && traceResult.recentLogs.length > 0" class="trace-section">
          <h4 class="section-title">
            <el-icon color="#722ed1"><Document /></el-icon>
            变更历史 (最近{{ traceResult.recentLogs.length }}条)
          </h4>
          <el-timeline>
            <el-timeline-item
              v-for="log in traceResult.recentLogs"
              :key="log.id"
              :timestamp="formatDate(log.createdAt, true)"
              placement="top"
            >
              <el-card shadow="never" class="log-card">
                <div class="log-header">
                  <el-tag
                    :color="getModifyTypeColor(log.modifyType)"
                    effect="dark"
                    size="small"
                    style="border-radius: 6px"
                  >{{ getModifyTypeLabel(log.modifyType) }}</el-tag>
                  <span class="log-operator">{{ log.operatorName }}</span>
                </div>
                <div v-if="log.changedFields && log.changedFields.length > 0" class="log-changes">
                  变更字段：<code>{{ log.changedFields.join(', ') }}</code>
                </div>
                <div v-if="log.needRecalc === 1" class="log-recalc">
                  用户等级重算状态：
                  <el-tag :type="getRecalcTagType(log.recalcStatus)" size="small" style="border-radius: 6px">
                    {{ getRecalcStatusLabel(log.recalcStatus) }}
                  </el-tag>
                  <span v-if="log.affectUserCount > 0">，影响用户 {{ log.affectUserCount }} 人</span>
                </div>
                <div v-if="log.remark" class="log-remark">备注：{{ log.remark }}</div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div v-if="traceResult.recentUpgrades && traceResult.recentUpgrades.length > 0" class="trace-section">
          <h4 class="section-title">
            <el-icon color="#13c2c2"><Top /></el-icon>
            升级记录 (最近{{ traceResult.recentUpgrades.length }}条)
          </h4>
          <el-table :data="traceResult.recentUpgrades" border size="small">
            <el-table-column prop="endUserNickname" label="用户" min-width="120">
              <template #default="{ row }">{{ row.endUserNickname || row.endUserUid || '#' + row.endUserId }}</template>
            </el-table-column>
            <el-table-column label="等级变化" min-width="160">
              <template #default="{ row }">
                <span class="level-from">{{ row.fromLevelCode || 'L0' }}</span>
                <el-icon class="upgrade-arrow"><ArrowRight /></el-icon>
                <span class="level-to">{{ row.toLevelCode || 'L' + row.toLevelTier }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="triggerScore" label="触发分值" width="90" align="center" />
            <el-table-column label="升级方式" width="120">
              <template #default="{ row }">
                <el-tag size="small" :color="getUpgradeTypeColor(row.upgradeType)" effect="dark" style="border-radius: 6px">
                  {{ getUpgradeTypeLabel(row.upgradeType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="configBatch" label="批次" min-width="160" />
            <el-table-column label="时间" width="150">
              <template #default="{ row }">{{ formatDate(row.createdAt, true) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import dayjs from 'dayjs'
import {
  Medal, Plus, Refresh, Crown, Calendar, View, EditPen, CircleCheck, SwitchButton,
  Trophy, TrendCharts, Clock, Delete, Search, InfoFilled, Document, Top, ArrowRight
} from '@element-plus/icons-vue'
import {
  MEMBER_LEVEL_MODIFY_TYPE, MEMBER_LEVEL_STATUS, MEMBER_LEVEL_UPGRADE_TYPE,
  MEMBER_LEVEL_RECALC_STATUS, MEMBER_LEVEL_DEFAULT_PRIVILEGES,
  getEnumLabel, getEnumItem
} from '@/constants/enums'
import type {
  MemberLevelItem, MemberLevelConflictCheckResult, MemberLevelStatsResult,
  MemberLevelPrivilege, MemberLevelTraceResult,
  PaginationResult, MemberLevelBatchActionResult
} from '@/types'
import {
  getMemberLevelListApi, getMemberLevelStatsApi,
  checkMemberLevelConflictsApi, createMemberLevelApi, updateMemberLevelApi,
  enableMemberLevelApi, disableMemberLevelApi,
  batchActionMemberLevelApi, getMemberLevelTraceApi
} from '@/api/member-level'
import _ from 'lodash-es'

const loading = ref(false)
const refreshing = ref(false)
const submitLoading = ref(false)
const batchLoading = ref(false)
const viewMode = ref<'card' | 'table'>('card')

const queryForm = reactive({
  levelTier: undefined as number | undefined,
  isEnabled: undefined as number | undefined,
  isCoreHighest: undefined as number | undefined,
  keyword: undefined as string | undefined,
})
const dateRange = ref<string[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 8,
  total: 0,
  totalPages: 0,
})

const stats = ref<MemberLevelStatsResult>({
  totalLevels: 0,
  enabledCount: 0,
  disabledCount: 0,
  scoreRange: { minScore: 0, maxScore: 0 },
  byTier: [],
  upgradeLogicCheck: {
    isValid: true,
    issues: [],
    startScoreZero: true,
    continuous: true,
  },
  todayChanges: 0,
  pendingRecalcCount: 0,
})

const levelList = ref<MemberLevelItem[]>([])
const selectedIds = ref<number[]>([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const editOriginId = ref<number | null>(null)
const scoreChangedConfirmed = ref(false)
const conflictResult = ref<MemberLevelConflictCheckResult | null>(null)
const formRef = ref<FormInstance>()

const defaultFormData = () => ({
  levelName: '',
  levelTier: 1,
  minScore: 0,
  maxScore: 1000,
  privileges: [],
  upgradeConditions: {},
  levelIcon: '',
  levelColor: '',
  remark: '',
  isEnabled: 0 as number,
  confirmed: false,
  __original: null as Partial<MemberLevelItem> | null,
})
type FormData = ReturnType<typeof defaultFormData>
const formData = reactive<FormData>(defaultFormData())

const formRules: FormRules = {
  levelName: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
  levelTier: [{ required: true, type: 'number', message: '请设置等级层级', trigger: 'change' }],
  minScore: [
    { required: true, type: 'number', message: '请设置起始分值', trigger: 'change' },
    {
      validator: (_, value, cb) => {
        if (value >= formData.maxScore) cb(new Error('起始分值必须小于结束分值'))
        else cb()
      },
      trigger: 'change'
    }
  ],
  maxScore: [{ required: true, type: 'number', message: '请设置结束分值', trigger: 'change' }],
}

const conditionMode = ref<'score' | 'custom'>('score')
const conditionJson = ref('')
const conditionError = ref('')

const batchSyncVisible = ref(false)
const sourceLevelId = ref<number | null>(null)

const traceDrawerVisible = ref(false)
const traceForm = reactive({
  traceType: 'levelCode' as 'levelCode' | 'configBatch' | 'upgradeRecord',
  traceValue: '',
})
const traceResult = ref<MemberLevelTraceResult | null>(null)

const formatDate = (date?: string | number | Date, withTime = false) => {
  if (!date) return '-'
  return dayjs(date).format(withTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD')
}

const loadLevelList = async () => {
  loading.value = true
  try {
    const params: any = {
      ...queryForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortBy: 'levelTier',
      sortOrder: 'ASC',
    }
    if (dateRange.value?.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const result: PaginationResult<MemberLevelItem> = await getMemberLevelListApi(params)
    levelList.value = result.list
    pagination.total = result.pagination.total
    pagination.totalPages = result.pagination.totalPages
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    stats.value = await getMemberLevelStatsApi()
  } catch {
    /* ignore */
  }
}

const loadAllData = () => {
  refreshing.value = true
  Promise.all([loadLevelList(), loadStats()])
    .finally(() => { refreshing.value = false })
}

const resetQuery = () => {
  Object.assign(queryForm, {
    levelTier: undefined,
    isEnabled: undefined,
    isCoreHighest: undefined,
    keyword: undefined,
  })
  dateRange.value = []
  pagination.page = 1
  loadLevelList()
}

const toggleSelect = (id: number) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const handleSelectionChange = (rows: MemberLevelItem[]) => {
  selectedIds.value = rows.map(r => r.id)
}

const clearSelection = () => {
  selectedIds.value = []
}

const handleHeaderDragend = () => {
  /* 支持拖拽列宽，无需额外处理 */
}

const openCreateDialog = () => {
  isEdit.value = false
  editOriginId.value = null
  scoreChangedConfirmed.value = false
  conflictResult.value = null
  conditionMode.value = 'score'
  conditionJson.value = ''
  conditionError.value = ''
  Object.assign(formData, defaultFormData())
  formData.privileges = MEMBER_LEVEL_DEFAULT_PRIVILEGES.map(p => ({ ...p, __selected: false as any }))
  nextTick(() => formRef.value?.clearValidate())
  dialogVisible.value = true
}

const openEditDialog = (level: MemberLevelItem) => {
  isEdit.value = true
  editOriginId.value = level.id
  scoreChangedConfirmed.value = false
  conflictResult.value = null
  Object.assign(formData, defaultFormData(), {
    levelName: level.levelName,
    levelTier: level.levelTier,
    minScore: level.minScore,
    maxScore: level.maxScore,
    privileges: mergePrivileges(level.privileges || []),
    upgradeConditions: level.upgradeConditions || {},
    levelIcon: level.levelIcon || '',
    levelColor: level.levelColor || '',
    remark: level.remark || '',
    isEnabled: level.isEnabled,
    __original: _.cloneDeep(level),
  })
  if (level.upgradeConditions && Object.keys(level.upgradeConditions).length > 0) {
    conditionMode.value = 'custom'
    conditionJson.value = JSON.stringify(level.upgradeConditions, null, 2)
  } else {
    conditionMode.value = 'score'
    conditionJson.value = ''
  }
  nextTick(() => formRef.value?.clearValidate())
  dialogVisible.value = true
}

const mergePrivileges = (existing: MemberLevelPrivilege[]) => {
  const codes = new Map(existing.map(p => [p.privilegeCode, p]))
  const merged: any[] = existing.map(p => ({ ...p, __selected: true }))
  MEMBER_LEVEL_DEFAULT_PRIVILEGES.forEach(p => {
    if (!codes.has(p.privilegeCode)) {
      merged.push({ ...p, __selected: false })
    }
  })
  return merged
}

const addCustomPrivilege = () => {
  formData.privileges.push({
    privilegeCode: `CUSTOM_${Date.now()}`,
    privilegeName: '自定义权益',
    privilegeValue: true,
    privilegeDesc: '',
    __selected: true,
  } as any)
}

const removePrivilege = (idx: number) => {
  formData.privileges.splice(idx, 1)
}

const checkConflictDebounced = _.debounce(async () => {
  if (!formData.levelName || formData.levelTier == null) return
  try {
    conflictResult.value = await checkMemberLevelConflictsApi({
      levelName: formData.levelName,
      levelTier: formData.levelTier,
      minScore: formData.minScore,
      maxScore: formData.maxScore,
      privileges: buildSelectedPrivileges(),
      excludeId: isEdit.value && editOriginId.value ? editOriginId.value : undefined,
    })
  } catch {
    conflictResult.value = null
  }
}, 400)

watch(
  () => [formData.levelName, formData.levelTier, formData.minScore, formData.maxScore, formData.privileges?.length],
  () => { if (dialogVisible.value) checkConflictDebounced() }
)

const buildSelectedPrivileges = (): MemberLevelPrivilege[] => {
  return formData.privileges
    .filter((p: any) => p.__selected !== false)
    .map(({ __selected, ...rest }: any) => rest)
}

const buildUpgradeConditions = () => {
  if (conditionMode.value === 'score') return {}
  if (!conditionJson.value.trim()) return {}
  try {
    const obj = JSON.parse(conditionJson.value)
    conditionError.value = ''
    return obj
  } catch (e: any) {
    conditionError.value = 'JSON格式错误：' + e.message
    return null
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  const conditions = buildUpgradeConditions()
  if (conditions === null) {
    ElMessage.warning('请修正升级条件的JSON格式')
    return
  }
  submitLoading.value = true
  try {
    const payload: any = {
      levelName: formData.levelName,
      levelTier: formData.levelTier,
      minScore: formData.minScore,
      maxScore: formData.maxScore,
      privileges: buildSelectedPrivileges(),
      upgradeConditions: conditions,
      levelIcon: formData.levelIcon || undefined,
      levelColor: formData.levelColor || undefined,
      remark: formData.remark || undefined,
    }

    if (isEdit.value && editOriginId.value) {
      const scoreChanged =
        formData.minScore !== (formData as any).__original?.minScore ||
        formData.maxScore !== (formData as any).__original?.maxScore
      if (scoreChanged && !scoreChangedConfirmed.value) {
        await ElMessageBox.confirm(
          '检测到升级分值已调整，提交后将自动触发存量用户等级重算，是否继续？',
          '确认修改',
          { confirmButtonText: '确认提交', cancelButtonText: '再想想', type: 'warning' }
        )
        scoreChangedConfirmed.value = true
      }
      payload.confirmed = scoreChangedConfirmed.value
      await updateMemberLevelApi(editOriginId.value, { id: editOriginId.value, ...payload })
      ElMessage.success('会员等级更新成功')
    } else {
      await createMemberLevelApi(payload)
      ElMessage.success('会员等级创建成功')
    }
    dialogVisible.value = false
    loadAllData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '提交失败')
    }
  } finally {
    submitLoading.value = false
  }
}

const handleEnable = async (row: MemberLevelItem) => {
  try {
    await ElMessageBox.confirm(`确定启用等级「${row.levelName}」吗？`, '确认启用', { type: 'info' })
    await enableMemberLevelApi(row.id)
    ElMessage.success('已启用')
    loadAllData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error((e as any)?.message || '操作失败')
  }
}

const handleDisable = async (row: MemberLevelItem) => {
  try {
    await ElMessageBox.confirm(
      `停用等级「${row.levelName}」可能影响该等级下用户权益，确定继续？`,
      '确认停用',
      { confirmButtonText: '停用', cancelButtonText: '取消', type: 'warning' }
    )
    await disableMemberLevelApi(row.id, true)
    ElMessage.success('已停用')
    loadAllData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error((e as any)?.message || '操作失败')
  }
}

const openBatchSyncDialog = () => {
  if (selectedIds.value.length <= 1) {
    ElMessage.warning('请选择至少2个等级执行同步')
    return
  }
  sourceLevelId.value = selectedIds.value[0]
  batchSyncVisible.value = true
}

const handleBatchAction = async (action: 'batch_enable' | 'batch_disable' | 'batch_sync_privileges') => {
  if (action === 'batch_sync_privileges') batchSyncVisible.value = false
  try {
    if (action === 'batch_disable') {
      await ElMessageBox.confirm(
        `将批量停用 ${selectedIds.value.length} 个等级（核心最高级自动跳过），是否继续？`,
        '确认批量停用', { type: 'warning' }
      )
    }
    batchLoading.value = true
    const result: MemberLevelBatchActionResult = await batchActionMemberLevelApi({
      action,
      ids: selectedIds.value,
      sourceLevelId: sourceLevelId.value || undefined,
      confirmed: true,
    })
    const tipMap: any = {
      batch_enable: '启用',
      batch_disable: '停用',
      batch_sync_privileges: '同步权益',
    }
    ElMessage.success(`${tipMap[action]}完成：成功${result.successCount}，失败${result.failCount}，跳过${result.skippedCount}`)
    clearSelection()
    loadAllData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '批量操作失败')
  } finally {
    batchLoading.value = false
  }
}

const getLevelLabel = (id: number) => {
  const lv = levelList.value.find(l => l.id === id)
  return lv ? `${lv.levelCode} - ${lv.levelName}` : '#' + id
}

const openTraceDrawer = (type: 'levelCode' | 'configBatch' | 'upgradeRecord', value: string) => {
  traceForm.traceType = type
  traceForm.traceValue = value
  traceResult.value = null
  traceDrawerVisible.value = true
  nextTick(loadTraceData)
}

const loadTraceData = async () => {
  if (!traceForm.traceValue) {
    ElMessage.warning('请输入溯源值')
    return
  }
  try {
    traceResult.value = await getMemberLevelTraceApi({
      traceType: traceForm.traceType,
      traceValue: traceForm.traceValue,
    })
  } catch (e: any) {
    ElMessage.error(e?.message || '查询失败')
  }
}

const getModifyTypeLabel = (t: string) => getEnumLabel(MEMBER_LEVEL_MODIFY_TYPE as any, t)
const getModifyTypeColor = (t: string) => {
  const item: any = getEnumItem(MEMBER_LEVEL_MODIFY_TYPE as any, t)
  return item?.color || '#909399'
}
const getRecalcStatusLabel = (s: number) => getEnumLabel(MEMBER_LEVEL_RECALC_STATUS as any, s)
const getRecalcTagType = (s: number) => {
  const map: any = { 0: 'info', 1: 'warning', 2: 'primary', 3: 'success', 4: 'danger' }
  return map[s] || 'info'
}
const getUpgradeTypeLabel = (t: string) => getEnumLabel(MEMBER_LEVEL_UPGRADE_TYPE as any, t)
const getUpgradeTypeColor = (t: string) => {
  const item: any = getEnumItem(MEMBER_LEVEL_UPGRADE_TYPE as any, t)
  return item?.color || '#909399'
}

onMounted(loadAllData)
</script>

<style lang="scss" scoped>
.member-level-container {
  padding: 0;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: baseline;
      gap: 12px;

      .page-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
      .page-desc { font-size: 13px; color: #909399; }
    }
  }

  .stats-row { margin-bottom: 16px; }
  .stat-card {
    border-radius: 10px;
    .stat-content { display: inline-block; }
    .stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
    .stat-value { font-size: 26px; font-weight: 700; color: #303133; line-height: 1.2; }
    .stat-icon {
      float: right;
      font-size: 44px;
      opacity: 0.35;
    }
    :deep(.el-card__body) { padding: 18px; }
  }

  .filter-card {
    border-radius: 10px;
    margin-bottom: 16px;
    :deep(.el-card__body) { padding: 14px 18px 2px; }
    :deep(.el-form-item) { margin-bottom: 14px; }
  }

  .batch-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    margin-bottom: 14px;
    background: #ecf5ff;
    border: 1px solid #d9ecff;
    border-radius: 8px;
    .batch-info { margin-right: 10px; color: #606266; font-size: 13px; }
    .selected-count { color: #409EFF; font-weight: 600; padding: 0 3px; }
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
  }

  .empty-state { padding: 60px 0; }

  /* Card View */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }
  .level-card-item {
    position: relative;
    border: 2px solid transparent;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    overflow: hidden;

    &:hover {
      transform: translateY(-4px) scale(1.015);
      box-shadow: 0 8px 24px rgba(64, 158, 255, 0.18), 0 2px 8px rgba(0, 0, 0, 0.06);
      border-color: var(--card-color);
    }
    &.is-selected {
      border-color: #409EFF;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
    }
    &.is-core {
      background: linear-gradient(135deg, #fffbe6 0%, #fff 100%);
    }

    .card-select {
      position: absolute;
      top: 10px;
      left: 12px;
      z-index: 2;
    }
    .core-badge {
      position: absolute;
      top: 10px;
      right: 12px;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      font-size: 11px;
      color: #b88230;
      background: #faecd8;
      border-radius: 10px;
      font-weight: 500;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px 12px;
      background: linear-gradient(135deg, var(--card-color, #409EFF) 0%, transparent 85%);
      border-radius: 12px 12px 0 0;

      .level-code-badge {
        font-family: 'Consolas', monospace;
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        background: rgba(255, 255, 255, 0.2);
        padding: 3px 10px;
        border-radius: 8px;
        backdrop-filter: blur(4px);
      }
      .level-tier {
        font-size: 20px;
        font-weight: 800;
        color: #fff;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
      }
    }
    .card-body { padding: 4px 18px 12px; }
    .level-name {
      margin: 0 0 10px;
      font-size: 17px;
      font-weight: 600;
      color: #303133;
    }
    .score-range { margin-bottom: 12px; }
    .privileges-preview { margin-bottom: 12px; }
    .privileges-title {
      font-size: 12px;
      color: #909399;
      margin-bottom: 6px;
    }
    .privileges-tags { min-height: 24px; }
    .card-meta {
      display: flex;
      gap: 16px;
      padding-top: 10px;
      border-top: 1px dashed #ebeef5;
      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      .meta-label { color: #909399; }
      .meta-value { color: #303133; font-weight: 600; }
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 18px;
      background: #fafbfc;
      border-top: 1px solid #f2f6fc;
      .create-time {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #909399;
      }
      .card-actions { display: flex; gap: 4px; }
    }
  }

  /* Table View */
  .cell-level-name {
    display: flex;
    align-items: center;
    gap: 6px;
    .core-icon { display: inline-flex; }
  }
  .score-range-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    .score-min, .score-max { font-weight: 600; color: #303133; }
    .score-arrow { color: #409EFF; font-weight: 700; }
  }
  .batch-text {
    font-family: Consolas, monospace;
    font-size: 12px;
    color: #409EFF;
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }

  /* Dialog */
  .level-dialog {
    :deep(.el-dialog) { border-radius: 12px; }
    .dialog-fade-wrap { transition: opacity 0.3s ease; }
  }
  .conflict-alert, .warn-alert { margin-bottom: 18px; border-radius: 8px; }
  .conflict-item {
    font-size: 12px;
    line-height: 1.6;
    .conflict-msg { display: block; color: #f56c6c; }
    .conflict-suggest { color: #67c23a; }
  }
  .privileges-editor {
    width: 100%;
    .privileges-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      .tool-hint { font-size: 12px; color: #909399; }
    }
    .privileges-table { border-radius: 8px; overflow: hidden; }
  }
  .condition-editor {
    width: 100%;
    .condition-input { margin-top: 10px; }
    .condition-error {
      color: #f56c6c;
      font-size: 12px;
      margin-top: 4px;
    }
    .condition-hint {
      margin-top: 10px;
      padding: 8px 12px;
      background: #f0f9eb;
      border-radius: 8px;
      font-size: 13px;
      color: #67c23a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  /* Drawer */
  .trace-drawer {
    :deep(.el-drawer) { border-radius: 12px 0 0 12px; }
  }
  .trace-toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid #ebeef5;
    .trace-input { flex: 1; }
  }
  .trace-empty { padding: 40px 0; }
  .trace-section { margin-bottom: 22px; }
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
  .trace-summary {
    margin-bottom: 22px;
    padding: 12px;
    background: #fafbfc;
    border-radius: 10px;
  }
  .log-card {
    border-radius: 8px;
    background: #fafbfc;
    :deep(.el-card__body) { padding: 12px 14px; }
    .log-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      .log-operator { font-size: 12px; color: #909399; }
    }
    .log-changes, .log-recalc, .log-remark {
      font-size: 12px;
      color: #606266;
      margin-top: 6px;
      code { background: #f4f4f5; padding: 1px 5px; border-radius: 4px; }
    }
  }
  .level-from { color: #909399; font-family: Consolas, monospace; }
  .upgrade-arrow { color: #409EFF; margin: 0 6px; }
  .level-to { color: #67c23a; font-weight: 600; font-family: Consolas, monospace; }
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
