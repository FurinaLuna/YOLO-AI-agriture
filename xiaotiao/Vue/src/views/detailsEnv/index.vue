<template>
  <div class="details-env-container">
    <el-row :gutter="24" class="h-full">
      <!-- 左侧：环境监控指标 -->
      <el-col :lg="14" :md="12" :sm="24">
        <el-card shadow="never" class="glass-card env-monitor-card">
          <template #header>
            <div class="card-header">
              <div class="title-group">
                <el-icon class="mr-2 text-emerald-500"><Monitor /></el-icon>
                <span class="text-lg font-bold">数字孪生 · 环境实时监控</span>
              </div>
              <el-select v-model="selectedGreenhouse" placeholder="切换温室" class="greenhouse-select">
                <el-option v-for="(gh, idx) in greenhouses" :key="idx" :label="gh" :value="gh" />
              </el-select>
            </div>
          </template>

          <div class="metrics-grid mt-4">
            <!-- 传感器数据 -->
            <div v-for="(item, index) in allEnvData" :key="index" class="metric-card">
              <div class="metric-icon-box" :class="item.type">
                <i :class="`iconfontjs ${item.icon}`"></i>
              </div>
              <div class="metric-info">
                <span class="label">{{ item.label }}</span>
                <span class="value">{{ item.value }}</span>
              </div>
            </div>
            
            <!-- 设备控制 -->
            <div v-for="(item, index) in thirdRow" :key="'ctrl-'+index" class="metric-card control-card">
              <div class="metric-icon-box btn-box" :class="{ 'is-active': item.status }">
                <i :class="`iconfontjs ${item.icon}`"></i>
              </div>
              <div class="metric-info">
                <span class="label">{{ item.label }}</span>
                <el-switch v-model="item.status" active-color="#10B981" />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：智谱 GLM 专家建议 -->
      <el-col :lg="10" :md="12" :sm="24">
        <el-card shadow="never" class="glass-card ai-analysis-card">
          <div class="ai-header mb-6">
            <div class="ai-brand">
              <span class="ai-dot animate-pulse"></span>
              <span class="brand-text">智谱 GLM · 农事专家系统</span>
            </div>
            <el-button 
              type="primary" 
              @click="getSuggestions" 
              :loading="aiStore.detailsEnv.loading" 
              :disabled="aiStore.detailsEnv.loading"
              class="ai-btn"
            >
              {{ aiStore.detailsEnv.loading ? '模型计算中...' : '获取实时分析' }}
            </el-button>
          </div>

          <div class="ai-body scrollbar-hide">
            <div v-if="aiStore.detailsEnv.suggestion" class="markdown-body suggestion-text" v-html="renderMarkdown(aiStore.detailsEnv.suggestion)"></div>
            <div v-else-if="aiStore.detailsEnv.loading" class="ai-loading-placeholder">
              <div class="loading-animation"><span></span><span></span><span></span></div>
              <p>专家系统正在针对当前环境数据进行建模分析...</p>
            </div>
            <div v-else class="empty-ai">
              <el-icon class="text-4xl opacity-20"><ChatDotRound /></el-icon>
              <p class="mt-4 opacity-50">点击上方按钮，获取 AI 深度农事建议</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { Monitor, ChatDotRound } from '@element-plus/icons-vue';
import MarkdownIt from 'markdown-it';
import { useAIStore } from '/@/stores/aiStore';

const aiStore = useAIStore();

const md = new MarkdownIt({ breaks: true, linkify: true });
const renderMarkdown = (text) => md.render(text || '');

const greenhouses = ref(['1号温室', '2号温室', '3号温室', '4号温室', '5号温室', '6号温室', '7号温室', '8号温室', '9号温室']);
const selectedGreenhouse = ref(greenhouses.value[0]);

const firstRow = ref([
  { icon: 'icon-daqiwendu', label: '室内温度', value: '25.5°C', type: 'temp' },
  { icon: 'icon-kongqishidu_kongqishidu', label: '空气湿度', value: '62.3%', type: 'humidity' },
  { icon: 'icon-turangshidu', label: '土壤湿度', value: '64.7%', type: 'soil' },
]);

const secondRow = ref([
  { icon: 'icon-eryanghuatan', label: '二氧化碳', value: '434ppm', type: 'co2' },
  { icon: 'icon-turangPH', label: 'PH值', value: '6.5', type: 'ph' },
  { icon: 'icon-guangzhaoqiangdu', label: '光照强度', value: '893lux', type: 'light' },
]);

const thirdRow = ref([
  { icon: 'icon-shuibeng', label: '灌溉泵', status: false },
  { icon: 'icon-a-buguangdengzidong', label: '补光系统', status: true },
  { icon: 'icon-fengshan', label: '排风扇', status: false },
]);

const allEnvData = computed(() => [...firstRow.value, ...secondRow.value]);

const suggestions = ref('');
const loading = ref(false);
const apiKey = import.meta.env.VITE_GLM_API_KEY || '';

async function getSuggestions() {
  aiStore.detailsEnv.loading = true;
  aiStore.detailsEnv.suggestion = '';
  try {
    const cropInfo = selectedGreenhouse.value === '1号温室' ? '当前种植作物是玉米。' : '当前种植作物信息未提供。';
    const response = await axios.post('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: '你是一位资深农业专家。请根据提供的温室环境数据，提供专业的 Markdown 格式建议。包括当前状况评价、潜在风险提示及后续操作建议。' },
        { role: 'user', content: `${cropInfo}\n环境数据：\n${allEnvData.value.map(i => `${i.label}: ${i.value}`).join('\n')}` }
      ],
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    aiStore.detailsEnv.suggestion = response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error:', error);
    ElMessage.error('AI 通讯中断，请检查网络');
  } finally {
    aiStore.detailsEnv.loading = false;
  }
}
</script>

<style scoped lang="scss">
.details-env-container {
  padding: 24px;
  height: 100%;
}

.glass-card {
  height: 100%;
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(16px);
  border-radius: 20px !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05) !important;

  :deep(.el-card__header) {
    border-bottom: 1px solid rgba(0,0,0,0.05);
    padding: 20px 24px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title-group { display: flex; align-items: center; }
  .greenhouse-select { width: 140px; }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.05);
  }

  .metric-icon-box {
    width: 56px; height: 56px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
    
    &.temp { background: #fee2e2; color: #ef4444; }
    &.humidity { background: #e0f2fe; color: #0ea5e9; }
    &.soil { background: #fef3c7; color: #d97706; }
    &.co2 { background: #f1f5f9; color: #475569; }
    &.ph { background: #f3e8ff; color: #9333ea; }
    &.light { background: #fffbeb; color: #f59e0b; }
    
    &.btn-box {
      background: #f1f5f9; color: #94a3b8;
      &.is-active { background: #dcfce7; color: #10b981; }
    }
  }

  .metric-info {
    text-align: center;
    .label { display: block; font-size: 13px; color: #64748b; margin-bottom: 4px; }
    .value { font-size: 18px; color: #1e293b; font-weight: 800; }
  }
}

.ai-analysis-card {
  display: flex;
  flex-direction: column;

  .ai-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
  }

  .ai-brand {
    display: flex; align-items: center; gap: 10px;
    .ai-dot { width: 10px; height: 10px; background: #10B981; border-radius: 50%; }
    .brand-text { font-weight: 800; color: #1e293b; font-size: 15px; }
  }

  .ai-btn {
    background: linear-gradient(135deg, #10B981, #059669) !important;
    border: none !important;
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 700;
  }

  .ai-body {
    flex: 1;
    background: rgba(248, 250, 252, 0.5);
    border-radius: 16px;
    padding: 24px;
    min-height: 480px;
    overflow-y: auto;
  }
}

.ai-loading-placeholder {
  height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; color: #94a3b8; font-size: 13px;
  .loading-animation {
    display: flex; gap: 8px; margin-bottom: 20px;
    span {
      width: 10px; height: 10px; background: #10B981; border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
      &:nth-child(1) { animation-delay: -0.32s; }
      &:nth-child(2) { animation-delay: -0.16s; }
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

.empty-ai {
  height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #94a3b8;
}

.suggestion-text {
  font-size: 14px; line-height: 1.8; color: #334155;
  
  :deep(.markdown-body) {
    p { margin-bottom: 12px; }
    h3 { 
       color: #10B981; 
       margin: 20px 0 10px; 
       font-size: 16px; 
       font-weight: 700;
       display: flex;
       align-items: center;
       &::before { content: ''; width: 4px; height: 16px; background: #10B981; margin-right: 8px; border-radius: 2px; }
    }
    ul, ol { padding-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 8px; }
    strong { color: #0f172a; font-weight: 700; }
    
    code {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    blockquote {
      border-left: 4px solid #10B981;
      background: rgba(16, 185, 129, 0.05);
      padding: 10px 16px;
      margin: 16px 0;
      border-radius: 0 8px 8px 0;
      color: #475569;
      font-style: italic;
    }
  }
}
</style>