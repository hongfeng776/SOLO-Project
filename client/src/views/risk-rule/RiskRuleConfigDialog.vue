<template>
  <FinDialog
    :model-value="visible"
    :title="editData ? '编辑风控规则' : '新增风控规则'"
    width="880px"
    :loading="saving"
    :close-on-click-modal="false"
    :hide-footer="true"
    @update:visible="handleUpdateVisible"
    @confirm="handleSubmit"
  >
    <div class="config-dialog-body">
      <div class="dialog-loading-mask" v-if="loading">
        <el-icon class="loading-icon" :size="40"><Loading /></el-icon>
        <div class="loading-text">正在加载配置...</div>
      </div>

      <div class="wizard-container" v-show="!loading">
        <el-steps :active="currentStep" finish-status="success" align-center class="config-steps">
          <el-step v-for="(title, idx) in stepTitles" :key="idx" :title="title" />
        </el-steps>

        <div class="step-content-wrapper">
          <transition name="fade-slide" mode="out-in">
            <div :key="currentStep" class="step-content">
              <template v-if="currentStep === 1">
                <div class="step-title">请选择风控规则类型</div>
                <div class="step-desc">不同规则类型管控不同维度的交易风险，请根据业务需求选择</div>
                <div class="rule-type-grid">
                  <div
                    v-for="item in ruleTypeOptions"
                    :key="item.value"
                    class="rule-type-card"
                    :class="{ active: formData.ruleType === item.value }"
                    @click="selectRuleType(item.value)"
                  >
                    <div class="type-icon" :style="{ color: item.color }">
                      <el-icon :size="32"><component :is="item.icon" /></el-icon>
                    </div>
                    <div class="type-name">{{ item.label }}</div>
                    <div class="type-desc">{{ item.desc }}</div>
                    <div class="type-check" v-if="formData.ruleType === item.value">
                      <el-icon :size="20"><CircleCheckFilled /></el-icon>
                    </div>
                  </div>
                </div>
                <el-alert
                  v-if="stepErrors.length > 0"
                  type="error"
                  :closable="false"
                  show-icon
                  class="step-alert"
                >
                  <template #title>
                    <div v-for="(err, idx) in stepErrors" :key="idx">{{ err }}</div>
                  </template>
                </el-alert>
              </template>

              <template v-else-if="currentStep === 2">
                <div class="step-title">配置适用客户等级</div>
                <div class="step-desc">选择此规则适用的客户群体，不同客户等级可配置差异化参数</div>

                <div class="level-select-area">
                  <div
                    v-for="item in customerLevelOptions"
                    :key="item.value"
                    class="level-select-card"
                    :class="{
                      active: formData.customerLevels.includes(item.value),
                      disabled: !item.optional,
                    }"
                    @click="toggleLevel(item)"
                  >
                    <div class="level-checkbox">
                      <el-checkbox :model-value="formData.customerLevels.includes(item.value)" />
                    </div>
                    <div class="level-badge" :style="{ borderColor: item.color, color: item.color }">
                      <el-icon><Star /></el-icon>
                    </div>
                    <div class="level-info">
                      <div class="level-name">{{ item.label }}</div>
                      <div class="level-desc">{{ item.desc }}</div>
                    </div>
                    <div class="level-mark" v-if="!item.optional">必选</div>
                  </div>
                </div>

                <div class="scope-config">
                  <el-checkbox v-model="formData.isGlobal">
                    <span class="config-label">设为全局规则</span>
                    <span class="config-desc">（全局规则对所有客户生效，不受客户等级限制）</span>
                  </el-checkbox>

                  <div class="scope-sectors" v-if="!formData.isGlobal">
                    <div class="config-label">适用板块（可选，不选则适用于所有板块）</div>
                    <el-checkbox-group v-model="formData.scopeSectors" class="sector-group">
                      <el-checkbox
                        v-for="sector in marketSectors"
                        :key="sector"
                        :label="sector"
                        border
                      >
                        {{ sector }}
                      </el-checkbox>
                    </el-checkbox-group>
                  </div>
                </div>

                <el-alert
                  v-if="stepErrors.length > 0"
                  type="error"
                  :closable="false"
                  show-icon
                  class="step-alert"
                >
                  <template #title>
                    <div v-for="(err, idx) in stepErrors" :key="idx">{{ err }}</div>
                  </template>
                </el-alert>
              </template>

              <template v-else-if="currentStep === 3">
                <div class="step-title">设置{{ getRuleTypeLabel(formData.ruleType) }}参数</div>
                <div class="step-desc">为每个选中的客户等级配置差异化参数，数值超限将实时拦截</div>

                <div class="params-basic-config">
                  <el-form :model="formData" label-width="120px" class="basic-form">
                    <el-form-item label="规则名称" required>
                      <el-input
                        v-model="formData.ruleName"
                        placeholder="请输入规则名称"
                        maxlength="50"
                        show-word-limit
                        @blur="validateRuleName"
                      />
                    </el-form-item>
                    <el-form-item label="规则描述">
                      <el-input
                        v-model="formData.description"
                        type="textarea"
                        :rows="2"
                        placeholder="请输入规则描述（选填）"
                        maxlength="200"
                      />
                    </el-form-item>
                    <el-form-item label="优先级">
                      <el-input-number
                        v-model="formData.priority"
                        :min="1"
                        :max="100"
                        controls-position="right"
                        style="width: 160px"
                      />
                      <span class="form-tip">数值越大优先级越高，冲突时高优先级规则优先</span>
                    </el-form-item>
                  </el-form>
                </div>

                <div class="params-level-tabs">
                  <el-tabs v-model="activeLevelTab" type="card" class="level-tabs">
                    <el-tab-pane
                      v-for="level in activeLevels"
                      :key="level"
                      :label="getLevelLabel(level)"
                      :name="level"
                    />
                  </el-tabs>

                  <div class="level-params-form">
                    <el-form :model="currentLevelParams" label-width="180px">
                      <template v-if="formData.ruleType === RiskRuleType.TRADE_LIMIT">
                        <el-form-item label="单笔最小交易金额">
                          <el-input-number
                            v-model="currentLevelParams.minTradeAmount"
                            :min="0"
                            :precision="2"
                            :step="100"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">元</span>
                        </el-form-item>
                        <el-form-item label="单笔最大交易金额" required>
                          <el-input-number
                            v-model="currentLevelParams.maxTradeAmount"
                            :min="0"
                            :precision="2"
                            :step="1000"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">元</span>
                        </el-form-item>
                        <el-form-item label="日累计交易限额" required>
                          <el-input-number
                            v-model="currentLevelParams.dailyTradeLimit"
                            :min="0"
                            :precision="2"
                            :step="10000"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">元</span>
                        </el-form-item>
                      </template>

                      <template v-else-if="formData.ruleType === RiskRuleType.POSITION_LIMIT">
                        <el-form-item label="最大持仓金额">
                          <el-input-number
                            v-model="currentLevelParams.maxPositionAmount"
                            :min="0"
                            :precision="2"
                            :step="10000"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">元</span>
                        </el-form-item>
                        <el-form-item label="最大持仓比例" required>
                          <el-input-number
                            v-model="currentLevelParams.maxPositionRatio"
                            :min="0"
                            :max="100"
                            :precision="2"
                            :step="5"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">%</span>
                          <span class="form-tip">占总资产的比例</span>
                        </el-form-item>
                        <el-form-item label="单只股票持仓上限" required>
                          <el-input-number
                            v-model="currentLevelParams.singleStockPositionLimit"
                            :min="0"
                            :max="100"
                            :precision="2"
                            :step="5"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">%</span>
                          <span class="form-tip">占总市值的比例</span>
                        </el-form-item>
                      </template>

                      <template v-else-if="formData.ruleType === RiskRuleType.VOLATILITY_RISK">
                        <el-form-item label="日最大波动率" required>
                          <el-input-number
                            v-model="currentLevelParams.maxDailyVolatility"
                            :min="0"
                            :max="100"
                            :precision="2"
                            :step="1"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">%</span>
                        </el-form-item>
                        <el-form-item label="单次最大波动" required>
                          <el-input-number
                            v-model="currentLevelParams.maxSingleVolatility"
                            :min="0"
                            :max="100"
                            :precision="2"
                            :step="1"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">%</span>
                        </el-form-item>
                        <el-form-item label="熔断阈值" required>
                          <el-input-number
                            v-model="currentLevelParams.circuitBreakerThreshold"
                            :min="0"
                            :max="100"
                            :precision="2"
                            :step="1"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">%</span>
                          <span class="form-tip">触发熔断机制的临界波动幅度</span>
                        </el-form-item>
                      </template>

                      <template v-else-if="formData.ruleType === RiskRuleType.FREQUENCY_RISK">
                        <el-form-item label="单日最大交易笔数" required>
                          <el-input-number
                            v-model="currentLevelParams.maxDailyTrades"
                            :min="0"
                            :step="10"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">笔</span>
                        </el-form-item>
                        <el-form-item label="每分钟交易笔数上限" required>
                          <el-input-number
                            v-model="currentLevelParams.maxTradesPerMinute"
                            :min="0"
                            :step="1"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">笔</span>
                        </el-form-item>
                        <el-form-item label="同票单日最大交易笔数">
                          <el-input-number
                            v-model="currentLevelParams.maxSameStockTrades"
                            :min="0"
                            :step="1"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">笔</span>
                        </el-form-item>
                        <el-form-item label="交易冷却期">
                          <el-input-number
                            v-model="currentLevelParams.coolDownPeriod"
                            :min="0"
                            :step="5"
                            controls-position="right"
                            style="width: 220px"
                            @change="validateParams"
                          />
                          <span class="form-unit">秒</span>
                          <span class="form-tip">两笔交易之间的最小时间间隔</span>
                        </el-form-item>
                      </template>
                    </el-form>
                  </div>
                </div>

                <div v-if="validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0)" class="validation-results">
                  <el-alert
                    v-for="(err, idx) in validationResult.errors"
                    :key="'err' + idx"
                    type="error"
                    :closable="false"
                    show-icon
                    class="validation-alert"
                  >
                    <template #title>
                      <strong>[{{ err.field }}]</strong> {{ err.message }}
                      <span v-if="err.suggestion" class="suggestion">（建议：{{ err.suggestion }}）</span>
                    </template>
                  </el-alert>
                  <el-alert
                    v-for="(warn, idx) in validationResult.warnings"
                    :key="'warn' + idx"
                    type="warning"
                    :closable="false"
                    show-icon
                    class="validation-alert"
                  >
                    <template #title>
                      <strong>[{{ warn.field }}]</strong> {{ warn.message }}
                      <span v-if="warn.suggestion" class="suggestion">（建议：{{ warn.suggestion }}）</span>
                    </template>
                  </el-alert>
                </div>

                <el-alert
                  v-if="stepErrors.length > 0"
                  type="error"
                  :closable="false"
                  show-icon
                  class="step-alert"
                >
                  <template #title>
                    <div v-for="(err, idx) in stepErrors" :key="idx">{{ err }}</div>
                  </template>
                </el-alert>
              </template>

              <template v-else-if="currentStep === 4">
                <div class="step-title">配置生效时段</div>
                <div class="step-desc">设置规则的生效模式和有效时间范围</div>

                <el-form :model="formData" label-width="140px">
                  <el-form-item label="生效模式" required>
                    <el-radio-group v-model="formData.effectMode" @change="handleEffectModeChange">
                      <el-radio :value="EffectMode.IMMEDIATE">
                        <span class="mode-title">即时生效</span>
                        <div class="mode-desc">规则保存后立即启用并同步所有客户风控管控</div>
                      </el-radio>
                      <el-radio :value="EffectMode.SCHEDULED">
                        <span class="mode-title">定时生效</span>
                        <div class="mode-desc">规则保存后进入待生效状态，到指定时间自动启用</div>
                      </el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <el-form-item
                    v-if="formData.effectMode === EffectMode.SCHEDULED"
                    label="定时生效时间"
                    required
                  >
                    <el-date-picker
                      v-model="formData.scheduledTime"
                      type="datetime"
                      placeholder="选择生效时间"
                      :disabled-date="disabledPastDate"
                      style="width: 280px"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="YYYY-MM-DD HH:mm:ss"
                    />
                  </el-form-item>

                  <el-form-item label="生效开始时间" required>
                    <el-date-picker
                      v-model="formData.effectiveStart"
                      type="date"
                      placeholder="选择开始日期"
                      style="width: 220px"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                    />
                    <span class="form-tip">不填默认为今日</span>
                  </el-form-item>

                  <el-form-item label="生效结束时间">
                    <el-date-picker
                      v-model="formData.effectiveEnd"
                      type="date"
                      placeholder="选择结束日期（不选则长期有效）"
                      :disabled-date="disabledEndDate"
                      style="width: 280px"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                    />
                  </el-form-item>

                  <el-form-item label="备注">
                    <el-input
                      v-model="formData.remark"
                      type="textarea"
                      :rows="2"
                      placeholder="请输入备注信息（选填）"
                      maxlength="200"
                    />
                  </el-form-item>
                </el-form>

                <div v-if="periodCheckResult && !periodCheckResult.valid" class="validation-results">
                  <el-alert type="error" :closable="false" show-icon>
                    <template #title>{{ periodCheckResult.message }}</template>
                  </el-alert>
                </div>

                <el-alert
                  v-if="stepErrors.length > 0"
                  type="error"
                  :closable="false"
                  show-icon
                  class="step-alert"
                >
                  <template #title>
                    <div v-for="(err, idx) in stepErrors" :key="idx">{{ err }}</div>
                  </template>
                </el-alert>
              </template>

              <template v-else-if="currentStep === 5">
                <div class="step-title">确认提交</div>
                <div class="step-desc">请仔细核对以下配置信息，确认无误后提交</div>

                <div class="summary-cards">
                  <div class="summary-card">
                    <div class="summary-card-title">
                      <el-icon><InfoFilled /></el-icon>
                      基本信息
                    </div>
                    <el-descriptions :column="1" size="small" border>
                      <el-descriptions-item label="规则名称">{{ formData.ruleName || '-' }}</el-descriptions-item>
                      <el-descriptions-item label="规则类型">
                        <el-tag :color="getRuleTypeColor(formData.ruleType) + '20'" effect="light" :style="{ color: getRuleTypeColor(formData.ruleType) }">
                          {{ getRuleTypeLabel(formData.ruleType) }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="规则描述">{{ formData.description || '暂无' }}</el-descriptions-item>
                      <el-descriptions-item label="优先级">{{ formData.priority }}</el-descriptions-item>
                      <el-descriptions-item label="全局规则">{{ formData.isGlobal ? '是' : '否' }}</el-descriptions-item>
                    </el-descriptions>
                  </div>

                  <div class="summary-card">
                    <div class="summary-card-title">
                      <el-icon><User /></el-icon>
                      适用范围
                    </div>
                    <el-descriptions :column="1" size="small" border>
                      <el-descriptions-item label="适用客户等级">
                        <div class="level-tags">
                          <el-tag
                            v-for="level in formData.customerLevels"
                            :key="level"
                            size="small"
                            effect="plain"
                            :style="{ borderColor: getLevelColor(level), color: getLevelColor(level) }"
                            class="mr-4"
                          >
                            {{ getLevelLabel(level) }}
                          </el-tag>
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="适用板块">
                        <template v-if="formData.scopeSectors?.length">
                          <el-tag v-for="s in formData.scopeSectors" :key="s" size="small" class="mr-4">{{ s }}</el-tag>
                        </template>
                        <span v-else>全部板块</span>
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>

                  <div class="summary-card">
                    <div class="summary-card-title">
                      <el-icon><Clock /></el-icon>
                      生效配置
                    </div>
                    <el-descriptions :column="1" size="small" border>
                      <el-descriptions-item label="生效模式">
                        <el-tag size="small" type="info" effect="plain">{{ getEffectModeLabel(formData.effectMode) }}</el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item v-if="formData.effectMode === EffectMode.SCHEDULED" label="定时生效时间">
                        {{ formData.scheduledTime }}
                      </el-descriptions-item>
                      <el-descriptions-item label="有效期限">
                        {{ formData.effectiveStart }} ~ {{ formData.effectiveEnd || '长期有效' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="备注">{{ formData.remark || '暂无' }}</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </div>

                <div class="summary-params">
                  <div class="summary-card-title">
                    <el-icon><Setting /></el-icon>
                    分级参数配置
                  </div>
                  <el-table :data="formData.levelParams" border size="small">
                    <el-table-column label="客户等级" prop="customerLevel" width="120">
                      <template #default="{ row }">
                        <el-tag
                          effect="plain"
                          :style="{ borderColor: getLevelColor(row.customerLevel), color: getLevelColor(row.customerLevel) }"
                        >
                          {{ getLevelLabel(row.customerLevel) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <template v-if="formData.ruleType === RiskRuleType.TRADE_LIMIT">
                      <el-table-column label="单笔最小(元)" prop="minTradeAmount" />
                      <el-table-column label="单笔最大(元)" prop="maxTradeAmount" />
                      <el-table-column label="日限额(元)" prop="dailyTradeLimit" />
                    </template>
                    <template v-else-if="formData.ruleType === RiskRuleType.POSITION_LIMIT">
                      <el-table-column label="持仓金额(元)" prop="maxPositionAmount" />
                      <el-table-column label="持仓比例(%)" prop="maxPositionRatio" />
                      <el-table-column label="单票上限(%)" prop="singleStockPositionLimit" />
                    </template>
                    <template v-else-if="formData.ruleType === RiskRuleType.VOLATILITY_RISK">
                      <el-table-column label="日波动(%)" prop="maxDailyVolatility" />
                      <el-table-column label="单波动(%)" prop="maxSingleVolatility" />
                      <el-table-column label="熔断阈值(%)" prop="circuitBreakerThreshold" />
                    </template>
                    <template v-else-if="formData.ruleType === RiskRuleType.FREQUENCY_RISK">
                      <el-table-column label="日笔数" prop="maxDailyTrades" />
                      <el-table-column label="分钟笔数" prop="maxTradesPerMinute" />
                      <el-table-column label="同票笔数" prop="maxSameStockTrades" />
                      <el-table-column label="冷却期(秒)" prop="coolDownPeriod" />
                    </template>
                  </el-table>
                </div>

                <div v-if="compatibilityCheck && compatibilityCheck.conflicts.length > 0" class="compatibility-section">
                  <div class="summary-card-title warning-title">
                    <el-icon><WarningFilled /></el-icon>
                    兼容性检查
                  </div>
                  <el-alert
                    v-for="(conflict, idx) in compatibilityCheck.conflicts"
                    :key="idx"
                    :type="conflict.level === 'high' ? 'error' : conflict.level === 'medium' ? 'warning' : 'info'"
                    :closable="false"
                    show-icon
                    class="conflict-alert"
                  >
                    <template #title>
                      <strong>[{{ getConflictTypeLabel(conflict.conflictType) }}]</strong>
                      {{ conflict.message }}
                      <span v-if="conflict.relatedRuleName" class="related-rule">（相关规则：{{ conflict.relatedRuleName }}）</span>
                    </template>
                  </el-alert>
                  <div v-if="compatibilityCheck.suggestions.length > 0" class="suggestions-box">
                    <div class="suggestions-title">优化建议：</div>
                    <ul>
                      <li v-for="(s, idx) in compatibilityCheck.suggestions" :key="idx">{{ s }}</li>
                    </ul>
                  </div>
                </div>
              </template>
            </div>
          </transition>
        </div>

        <div class="step-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button
            v-if="currentStep > 1"
            @click="prevStep"
            :disabled="saving"
          >
            上一步
          </el-button>
          <el-button
            v-if="currentStep < 5"
            type="primary"
            @click="nextStep"
            :loading="stepValidating"
          >
            下一步
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="saving"
            @click="handleSubmit"
          >
            {{ editData ? '保存修改' : '确认提交' }}
          </el-button>
        </div>
      </div>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Loading,
  CircleCheckFilled,
  Star,
  InfoFilled,
  User,
  Clock,
  Setting,
  WarningFilled,
  Money,
  Goods,
  TrendCharts,
  Timer,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import {
  RISK_RULE_TYPE_LABELS,
  RISK_RULE_TYPE_COLORS,
  EFFECT_MODE_LABELS,
  CUSTOMER_LEVEL_LABELS,
  CUSTOMER_LEVEL_COLORS,
  MARKET_SECTOR_LIST,
} from '@/constants/dictionaries'
import {
  RiskRuleType,
  RiskRuleStatus,
  EffectMode,
  CustomerLevel,
} from '@/enums'
import * as riskRuleApi from '@/api/riskRule'
import type {
  IRiskRule,
  IRiskRuleCreateData,
  IRiskRuleLevelParams,
  IRiskRuleValidationResult,
  IRiskRuleCompatibilityCheck,
} from '@/types/api'

interface IProps {
  visible: boolean
  editData?: IRiskRule | null
}

const props = withDefaults(defineProps<IProps>(), {
  editData: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const { hasPerm, hasRole } = usePermission()

const loading = ref(false)
const saving = ref(false)
const stepValidating = ref(false)
const currentStep = ref(1)
const stepTitles = ['选择规则类型', '配置客户等级', '设置规则参数', '配置生效时段', '确认提交']

const activeLevelTab = ref('')
const stepErrors = ref<string[]>([])
const validationResult = ref<IRiskRuleValidationResult | null>(null)
const compatibilityCheck = ref<IRiskRuleCompatibilityCheck | null>(null)
const periodCheckResult = ref<{ valid: boolean; message?: string } | null>(null)

const formData = reactive<IRiskRuleCreateData & { id?: number; version?: number; isGlobal: boolean; scopeSectors: string[] }>({
  ruleName: '',
  ruleType: '' as RiskRuleType,
  description: '',
  effectMode: EffectMode.IMMEDIATE,
  customerLevels: [],
  levelParams: [],
  effectiveStart: formatDate(new Date()),
  effectiveEnd: '',
  scheduledTime: '',
  priority: 50,
  isGlobal: false,
  scopeSectors: [],
  remark: '',
})

const ruleTypeOptions = [
  {
    value: RiskRuleType.TRADE_LIMIT,
    label: '交易限额',
    color: '#409EFF',
    icon: Money,
    desc: '控制单笔/日累计交易金额，防范异常大额交易',
  },
  {
    value: RiskRuleType.POSITION_LIMIT,
    label: '持仓限额',
    color: '#67C23A',
    icon: Goods,
    desc: '控制总持仓比例和单票持仓上限，分散持仓风险',
  },
  {
    value: RiskRuleType.VOLATILITY_RISK,
    label: '波动风控',
    color: '#E6A23C',
    icon: TrendCharts,
    desc: '监控市场波动幅度，超过阈值触发熔断机制',
  },
  {
    value: RiskRuleType.FREQUENCY_RISK,
    label: '频次风控',
    color: '#F56C6C',
    icon: Timer,
    desc: '控制交易频率，防止高频交易和程序化交易风险',
  },
]

const customerLevelOptions = [
  { value: CustomerLevel.NORMAL, label: '普通客户', color: '#909399', desc: '基础风控策略', optional: true },
  { value: CustomerLevel.SILVER, label: '白银客户', color: '#C0C4CC', desc: '适度放宽交易限制', optional: true },
  { value: CustomerLevel.GOLD, label: '黄金客户', color: '#E6A23C', desc: '较高交易额度与频次', optional: true },
  { value: CustomerLevel.PLATINUM, label: '铂金客户', color: '#409EFF', desc: '优质客户专属配置', optional: true },
  { value: CustomerLevel.DIAMOND, label: '钻石客户', color: '#9B59B6', desc: '顶级客户，灵活风控', optional: true },
]

const marketSectors = MARKET_SECTOR_LIST

const activeLevels = computed(() => formData.customerLevels)

const currentLevelParams = computed<IRiskRuleLevelParams>({
  get() {
    const found = formData.levelParams.find((p) => p.customerLevel === activeLevelTab.value)
    return found || ({} as IRiskRuleLevelParams)
  },
  set(val) {
    const idx = formData.levelParams.findIndex((p) => p.customerLevel === activeLevelTab.value)
    if (idx > -1) {
      formData.levelParams[idx] = val
    }
  },
})

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateTime(date: Date): string {
  return formatDate(date) + ' ' + date.toTimeString().slice(0, 8)
}

function disabledPastDate(time: Date) {
  return time.getTime() < Date.now() - 86400000
}

function disabledEndDate(time: Date) {
  if (!formData.effectiveStart) return false
  return time.getTime() < new Date(formData.effectiveStart).getTime()
}

function getRuleTypeLabel(type: string): string {
  return RISK_RULE_TYPE_LABELS[type as RiskRuleType] || type || '-'
}

function getRuleTypeColor(type: string): string {
  return RISK_RULE_TYPE_COLORS[type as RiskRuleType] || '#909399'
}

function getLevelLabel(level: string): string {
  return CUSTOMER_LEVEL_LABELS[level as CustomerLevel] || level || '-'
}

function getLevelColor(level: string): string {
  return CUSTOMER_LEVEL_COLORS[level as CustomerLevel] || '#909399'
}

function getEffectModeLabel(mode: string): string {
  return EFFECT_MODE_LABELS[mode as EffectMode] || mode || '-'
}

function getConflictTypeLabel(type: string): string {
  const map: Record<string, string> = {
    overlap: '范围重叠',
    logic: '逻辑冲突',
    range: '数值超限',
    redundant: '规则冗余',
  }
  return map[type] || type
}

function selectRuleType(type: RiskRuleType) {
  formData.ruleType = type
  stepErrors.value = []
}

function toggleLevel(item: any) {
  if (!item.optional) return
  const idx = formData.customerLevels.indexOf(item.value)
  if (idx > -1) {
    formData.customerLevels.splice(idx, 1)
    const pIdx = formData.levelParams.findIndex((p) => p.customerLevel === item.value)
    if (pIdx > -1) formData.levelParams.splice(pIdx, 1)
  } else {
    formData.customerLevels.push(item.value)
    initLevelParams(item.value)
  }
  if (formData.customerLevels.length > 0 && !activeLevelTab.value) {
    activeLevelTab.value = formData.customerLevels[0]
  }
}

function initLevelParams(level: CustomerLevel) {
  const defaults: Record<RiskRuleType, Partial<IRiskRuleLevelParams>> = {
    [RiskRuleType.TRADE_LIMIT]: {
      minTradeAmount: 0,
      maxTradeAmount: 100000,
      dailyTradeLimit: 1000000,
    },
    [RiskRuleType.POSITION_LIMIT]: {
      maxPositionAmount: 10000000,
      maxPositionRatio: 80,
      singleStockPositionLimit: 30,
    },
    [RiskRuleType.VOLATILITY_RISK]: {
      maxDailyVolatility: 10,
      maxSingleVolatility: 5,
      circuitBreakerThreshold: 8,
    },
    [RiskRuleType.FREQUENCY_RISK]: {
      maxDailyTrades: 100,
      maxTradesPerMinute: 10,
      maxSameStockTrades: 20,
      coolDownPeriod: 5,
    },
  }

  const levelMultipliers: Record<CustomerLevel, number> = {
    [CustomerLevel.NORMAL]: 0.6,
    [CustomerLevel.SILVER]: 0.8,
    [CustomerLevel.GOLD]: 1,
    [CustomerLevel.PLATINUM]: 1.5,
    [CustomerLevel.DIAMOND]: 2,
  }

  const base = defaults[formData.ruleType] || {}
  const multiplier = levelMultipliers[level] || 1
  const params: IRiskRuleLevelParams = { customerLevel: level }

  Object.keys(base).forEach((key) => {
    const v = (base as any)[key]
    if (typeof v === 'number') {
      ;(params as any)[key] = Math.round(v * multiplier)
    }
  })

  formData.levelParams.push(params)
}

function handleEffectModeChange() {
  if (formData.effectMode === EffectMode.IMMEDIATE) {
    formData.scheduledTime = ''
  } else {
    const tomorrow = new Date(Date.now() + 86400000)
    tomorrow.setHours(9, 30, 0, 0)
    formData.scheduledTime = formatDateTime(tomorrow)
  }
}

async function validateRuleName() {
  if (!formData.ruleName || formData.ruleName.trim().length < 2) {
    stepErrors.value = ['规则名称至少需要2个字符']
  }
}

async function validateParams() {
  const data: Partial<IRiskRuleCreateData> = {
    ruleType: formData.ruleType,
    customerLevels: formData.customerLevels,
    levelParams: formData.levelParams,
  }
  try {
    const res = await riskRuleApi.validateRiskRuleParams(data)
    if (res.code === 0) {
      validationResult.value = res.data
    }
  } catch (e) {
    // 忽略验证接口错误，前端继续校验
  }
}

async function validateStep1(): Promise<boolean> {
  stepErrors.value = []
  if (!formData.ruleType) {
    stepErrors.value.push('请选择风控规则类型')
    return false
  }
  return true
}

async function validateStep2(): Promise<boolean> {
  stepErrors.value = []
  if (!formData.isGlobal && formData.customerLevels.length === 0) {
    stepErrors.value.push('请至少选择一个适用客户等级，或设为全局规则')
    return false
  }
  return true
}

async function validateStep3(): Promise<boolean> {
  stepErrors.value = []
  const errors: string[] = []

  if (!formData.ruleName || formData.ruleName.trim().length < 2) {
    errors.push('规则名称至少需要2个字符')
  }

  if (formData.levelParams.length !== formData.customerLevels.length) {
    errors.push('请为每个选中的客户等级配置参数')
  }

  formData.levelParams.forEach((p) => {
    if (formData.ruleType === RiskRuleType.TRADE_LIMIT) {
      if (!p.maxTradeAmount || p.maxTradeAmount <= 0) errors.push(`${getLevelLabel(p.customerLevel)}: 请设置单笔最大交易金额`)
      if (!p.dailyTradeLimit || p.dailyTradeLimit <= 0) errors.push(`${getLevelLabel(p.customerLevel)}: 请设置日累计交易限额`)
      if (p.minTradeAmount != null && p.maxTradeAmount != null && p.minTradeAmount > p.maxTradeAmount) {
        errors.push(`${getLevelLabel(p.customerLevel)}: 单笔最小金额不能大于最大金额`)
      }
    } else if (formData.ruleType === RiskRuleType.POSITION_LIMIT) {
      if (!p.maxPositionRatio || p.maxPositionRatio <= 0 || p.maxPositionRatio > 100)
        errors.push(`${getLevelLabel(p.customerLevel)}: 最大持仓比例应在0-100之间`)
      if (!p.singleStockPositionLimit || p.singleStockPositionLimit <= 0 || p.singleStockPositionLimit > 100)
        errors.push(`${getLevelLabel(p.customerLevel)}: 单票持仓上限应在0-100之间`)
    } else if (formData.ruleType === RiskRuleType.VOLATILITY_RISK) {
      if (!p.maxDailyVolatility || p.maxDailyVolatility <= 0) errors.push(`${getLevelLabel(p.customerLevel)}: 请设置日最大波动率`)
      if (!p.maxSingleVolatility || p.maxSingleVolatility <= 0) errors.push(`${getLevelLabel(p.customerLevel)}: 请设置单次最大波动`)
      if (!p.circuitBreakerThreshold || p.circuitBreakerThreshold <= 0) errors.push(`${getLevelLabel(p.customerLevel)}: 请设置熔断阈值`)
    } else if (formData.ruleType === RiskRuleType.FREQUENCY_RISK) {
      if (!p.maxDailyTrades || p.maxDailyTrades <= 0) errors.push(`${getLevelLabel(p.customerLevel)}: 请设置单日最大交易笔数`)
      if (!p.maxTradesPerMinute || p.maxTradesPerMinute <= 0) errors.push(`${getLevelLabel(p.customerLevel)}: 请设置每分钟交易笔数上限`)
    }
  })

  stepErrors.value = errors
  return errors.length === 0
}

async function validateStep4(): Promise<boolean> {
  stepErrors.value = []
  const errors: string[] = []

  if (!formData.effectiveStart) {
    errors.push('请设置生效开始时间')
  }

  if (formData.effectMode === EffectMode.SCHEDULED && !formData.scheduledTime) {
    errors.push('请设置定时生效时间')
  }

  if (formData.effectiveEnd && formData.effectiveStart) {
    if (new Date(formData.effectiveEnd).getTime() < new Date(formData.effectiveStart).getTime()) {
      errors.push('生效结束时间不能早于开始时间')
    }
  }

  try {
    const res = await riskRuleApi.checkEffectivePeriod({
      effectiveStart: formData.effectiveStart,
      effectiveEnd: formData.effectiveEnd,
      ruleType: formData.ruleType,
      customerLevels: formData.customerLevels,
    })
    if (res.code === 0) {
      periodCheckResult.value = res.data
      if (!res.data.valid) {
        errors.push(res.data.message || '生效时段校验失败')
      }
    }
  } catch (e) {
    // 忽略
  }

  stepErrors.value = errors
  return errors.length === 0
}

async function runCompatibilityCheck() {
  try {
    const res = await riskRuleApi.checkRiskRuleCompatibility({
      ...formData,
      excludeId: props.editData?.id,
    })
    if (res.code === 0) {
      compatibilityCheck.value = res.data
    }
  } catch (e) {
    // 忽略
  }
}

async function nextStep() {
  const validators = [validateStep1, validateStep2, validateStep3, validateStep4]
  const currentValidator = validators[currentStep.value - 1]

  if (currentValidator) {
    stepValidating.value = true
    const valid = await currentValidator()
    stepValidating.value = false
    if (!valid) return
  }

  if (currentStep.value === 4) {
    await runCompatibilityCheck()
  }

  if (currentStep.value < 5) {
    currentStep.value++
  }
}

function prevStep() {
  stepErrors.value = []
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

async function handleSubmit() {
  if (!hasPerm(props.editData ? 'riskRule:manage' : 'riskRule:create')) {
    ElMessage.warning('您没有操作权限')
    return
  }

  stepErrors.value = []
  const valid = await validateStep4()
  if (!valid) {
    currentStep.value = 4
    return
  }

  if (compatibilityCheck.value && compatibilityCheck.value.conflicts.some((c) => c.level === 'high')) {
    try {
      const { ElMessageBox } = await import('element-plus')
      await ElMessageBox.confirm(
        '检测到存在高优先级的规则冲突，是否仍要继续提交？',
        '冲突确认',
        { type: 'warning', confirmButtonText: '继续提交', cancelButtonText: '返回修改' },
      )
    } catch (e) {
      return
    }
  }

  saving.value = true
  try {
    const submitData = {
      ruleName: formData.ruleName,
      ruleType: formData.ruleType,
      description: formData.description,
      effectMode: formData.effectMode,
      customerLevels: formData.isGlobal ? Object.values(CustomerLevel) : formData.customerLevels,
      levelParams: formData.levelParams,
      effectiveStart: formData.effectiveStart,
      effectiveEnd: formData.effectiveEnd,
      scheduledTime: formData.scheduledTime,
      priority: formData.priority,
      isGlobal: formData.isGlobal,
      scopeSectors: formData.scopeSectors,
      remark: formData.remark,
      version: formData.version,
    }

    let res
    if (props.editData) {
      res = await riskRuleApi.updateRiskRule(props.editData.id, submitData)
    } else {
      res = await riskRuleApi.createRiskRule(submitData)
    }

    if (res.code === 0) {
      const action = props.editData ? '更新' : '创建'
      const syncRes = await riskRuleApi.syncCustomerRiskControls([res.data.id])
      let msg = `${action}成功`
      if (syncRes.code === 0) {
        msg += `，已同步更新 ${syncRes.data.syncedCustomerCount} 位客户的风控管控逻辑`
      }
      ElMessage.success(msg)
      emit('success')
      handleUpdateVisible(false)
    } else {
      ElMessage.error(res.message)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  handleUpdateVisible(false)
}

function handleUpdateVisible(val: boolean) {
  emit('update:visible', val)
  if (!val) {
    resetForm()
  }
}

function resetForm() {
  currentStep.value = 1
  stepErrors.value = []
  validationResult.value = null
  compatibilityCheck.value = null
  periodCheckResult.value = null
  activeLevelTab.value = ''
  Object.assign(formData, {
    ruleName: '',
    ruleType: '' as RiskRuleType,
    description: '',
    effectMode: EffectMode.IMMEDIATE,
    customerLevels: [],
    levelParams: [],
    effectiveStart: formatDate(new Date()),
    effectiveEnd: '',
    scheduledTime: '',
    priority: 50,
    isGlobal: false,
    scopeSectors: [],
    remark: '',
    id: undefined,
    version: undefined,
  })
}

function loadEditData() {
  if (!props.editData) return
  loading.value = true
  nextTick(() => {
    Object.assign(formData, {
      id: props.editData!.id,
      version: props.editData!.version,
      ruleName: props.editData!.ruleName,
      ruleType: props.editData!.ruleType,
      description: props.editData!.description || '',
      effectMode: props.editData!.effectMode,
      customerLevels: [...props.editData!.customerLevels],
      levelParams: JSON.parse(JSON.stringify(props.editData!.levelParams)),
      effectiveStart: props.editData!.effectiveStart,
      effectiveEnd: props.editData!.effectiveEnd || '',
      scheduledTime: props.editData!.scheduledTime || '',
      priority: props.editData!.priority,
      isGlobal: props.editData!.isGlobal || false,
      scopeSectors: [...(props.editData!.scopeSectors || [])],
      remark: props.editData!.remark || '',
    })
    if (formData.customerLevels.length > 0) {
      activeLevelTab.value = formData.customerLevels[0]
    }
    loading.value = false
  })
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.editData) {
        loadEditData()
      } else {
        resetForm()
      }
    }
  },
  { immediate: true },
)

watch(
  () => formData.customerLevels,
  (levels) => {
    if (levels.length > 0 && !levels.includes(activeLevelTab.value)) {
      activeLevelTab.value = levels[0]
    }
  },
)
</script>

<style lang="scss" scoped>
.config-dialog-body {
  position: relative;
  min-height: 500px;
}

.dialog-loading-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-icon {
  color: #409eff;
  animation: rotate 1s linear infinite;
  margin-bottom: 12px;
}

.loading-text {
  color: #606266;
  font-size: 14px;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.wizard-container {
  padding: 8px 0;
}

.config-steps {
  margin-bottom: 32px;
}

.step-content-wrapper {
  min-height: 420px;
  padding: 0 8px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.35s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 6px;
}

.step-desc {
  font-size: 13px;
  color: #8492a6;
  margin-bottom: 24px;
}

.rule-type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.rule-type-card {
  position: relative;
  padding: 20px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    border-color: #c0c4cc;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &.active {
    border-color: #409eff;
    background: linear-gradient(180deg, rgba(64, 158, 255, 0.04) 0%, #fff 100%);
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  }
}

.type-icon {
  margin-bottom: 12px;
}

.type-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 6px;
}

.type-desc {
  font-size: 12px;
  color: #8492a6;
  line-height: 1.5;
}

.type-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #409eff;
}

.level-select-area {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.level-select-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(.disabled) {
    border-color: #c0c4cc;
  }

  &.active {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.04);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.level-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
}

.level-badge {
  width: 44px;
  height: 44px;
  border: 2px solid;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0 10px;
}

.level-info {
  text-align: center;
}

.level-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 2px;
}

.level-desc {
  font-size: 11px;
  color: #8492a6;
}

.level-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 6px;
  background: #409eff;
  color: #fff;
  font-size: 10px;
  border-radius: 3px;
}

.scope-config {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.config-label {
  font-size: 14px;
  font-weight: 500;
  color: #1f2d3d;
}

.config-desc {
  font-size: 12px;
  color: #8492a6;
}

.scope-sectors {
  margin-top: 16px;
}

.sector-group {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.params-basic-config {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 20px;
}

.basic-form {
  max-width: 600px;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #8492a6;
}

.form-unit {
  margin-left: 8px;
  color: #606266;
}

.level-tabs {
  margin-bottom: 20px;
}

.level-params-form {
  max-width: 640px;
}

.validation-results {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.validation-alert .suggestion {
  margin-left: 8px;
  color: #8492a6;
}

.step-alert {
  margin-top: 20px;
}

.mode-title {
  font-weight: 500;
  color: #1f2d3d;
}

.mode-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #8492a6;
  padding-left: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.summary-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #f5f7fa;
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  border-bottom: 1px solid #e4e7ed;

  &.warning-title {
    background: #fdf6ec;
    color: #e6a23c;
  }
}

.summary-params {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 20px;

  > .summary-card-title {
    margin-bottom: 0;
  }
}

.level-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mr-4 {
  margin-right: 6px;
}

.compatibility-section {
  border: 1px solid #f5dab1;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 20px;

  .summary-card-title {
    border-bottom: 1px solid #f5dab1;
  }
}

.conflict-alert {
  margin: 12px 16px;
}

.conflict-alert .related-rule {
  margin-left: 8px;
  color: #8492a6;
}

.suggestions-box {
  margin: 12px 16px 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.suggestions-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 8px;
}

.suggestions-box ul {
  margin: 0;
  padding-left: 20px;

  li {
    font-size: 13px;
    color: #4a5568;
    line-height: 1.8;
  }
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 24px;
  margin-top: 24px;
  border-top: 1px solid #e4e7ed;
}
</style>
