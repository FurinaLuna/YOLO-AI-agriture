<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElCard, ElButton, ElTag } from 'element-plus'
import 'element-plus/dist/index.css'

// 统计数据
const statistics = ref({
  users: 42,
  greenhouse: 9,
  diseases: 141,
  yield: 1232
})

// 图表实例
let diseaseDistChart: echarts.ECharts
let plantingStatsChart: echarts.ECharts

// 今日日期
const today = ref({
  date: '',
  weekday: ''
})

// 天气信息
const weatherInfo = ref({
  temperature: '24°C',
  weather: '晴转多云',
  humidity: '65%',
  wind: '东北风 2级',
  notice: '当前气象条件适宜农事活动，建议进行作物追肥。'
})

// 作物状态数据
const cropTypes = ref([
  { name: '1号温室', crop: '玉米', status: '生长良好', plantCount: 350, diseaseCount: 0 },
  { name: '2号温室', crop: '水稻', status: '生长良好', plantCount: 400, diseaseCount: 2 },
  { name: '3号温室', crop: '小麦', status: '异常预警', plantCount: 350, diseaseCount: 18 },
  { name: '4号温室', crop: '马铃薯', status: '生长良好', plantCount: 250, diseaseCount: 1 },
  { name: '5号温室', crop: '棉花', status: '生长良好', plantCount: 300, diseaseCount: 3 },
  { name: '6号温室', crop: '苹果', status: '需要关注', plantCount: 128, diseaseCount: 14 }
])

// 农业链接
const agricultureLinks = ref([
  { name: '中国农村网', url: 'https://www.crnews.net/', icon: 'icon-nongye' },
  { name: '中国农业网', url: 'https://www.zgny.com/', icon: 'icon-keji' },
  { name: '国家农业数据中心', url: 'https://www.agridata.cn/', icon: 'icon-qixiang' },
  { name: '农业科技报', url: 'https://www.nkb.com.cn/', icon: 'icon-zhihui' }
])

// 获取实时天气数据 (模拟原有逻辑)
const fetchWeatherData = async () => {
  const date = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  today.value.date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  today.value.weekday = weekdays[date.getDay()]
  
  try {
    const response = await fetch('http://localhost:9999/weather/now?location=101240101')
    const data = await response.json()
    if (data.code === '200' && data.now) {
      weatherInfo.value = {
        temperature: data.now.temp + '°C',
        weather: data.now.text,
        humidity: data.now.humidity + '%',
        wind: `${data.now.windDir} ${data.now.windScale}级`,
        notice: data.now.text.includes('雨') ? '今日有雨，请注意温室排涝。' : '天气晴好，适宜大田作业。'
      }
    }
  } catch (err) {
    console.warn('Weather API connection failed, using fallback data.')
  }
}

// 初始化 ECharts 图表（升级配色与交互）
const initCharts = () => {
  const pieDom = document.getElementById('diseasePieChart')
  if (pieDom) {
    diseaseDistChart = echarts.init(pieDom)
    diseaseDistChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', padding: 10, borderRadius: 8 },
      legend: { bottom: '5%', icon: 'circle', textStyle: { color: '#64748b' } },
      color: ['#10B981', '#3B82F6', '#6366F1', '#F59E0B', '#EF4444'],
      series: [{
        name: '病害种类',
        type: 'pie',
        radius: ['55%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 4 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: [
          { value: 45, name: '水稻稻瘟病' },
          { value: 30, name: '玉米锈病' },
          { value: 25, name: '小麦白粉病' },
          { value: 18, name: '番茄早疫病' },
          { value: 23, name: '马铃薯晚疫病' }
        ]
      }]
    })
  }

  const lineDom = document.getElementById('yieldLineChart')
  if (lineDom) {
    plantingStatsChart = echarts.init(lineDom)
    plantingStatsChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      grid: { left: '4%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: ['1月', '3月', '5月', '7月', '9月', '11月'],
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: { 
        type: 'value', 
        name: '预估产量/吨',
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#94a3b8' }
      },
      series: [{
        name: '预估产量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#10B981' },
        itemStyle: { color: '#10B981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16,185,129,0.2)' },
            { offset: 1, color: 'rgba(16,185,129,0.01)' }
          ])
        },
        data: [220, 310, 420, 580, 750, 890]
      }]
    })
  }
}

const handleResize = () => {
  diseaseDistChart?.resize()
  plantingStatsChart?.resize()
}

onMounted(() => {
  fetchWeatherData()
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  diseaseDistChart?.dispose()
  plantingStatsChart?.dispose()
})
</script>

<template>
  <div class="home-view">
    
    <!-- 1. 顶部数据概览卡片 (SaaS Metrics) -->
    <div class="metrics-row animate__animated animate__fadeInDown">
      <div class="metric-card">
        <div class="ico-bg b-em">
          <i class="iconfontjs icon-yh"></i>
        </div>
        <div class="m-content">
          <div class="v">{{ statistics.users }}</div>
          <div class="l">活跃用户</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="ico-bg b-bl">
          <i class="iconfontjs icon-znws"></i>
        </div>
        <div class="m-content">
          <div class="v">{{ statistics.greenhouse }}</div>
          <div class="l">受控温室</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="ico-bg b-or">
          <i class="iconfontjs icon-bingchonghai-1haichong"></i>
        </div>
        <div class="m-content">
          <div class="v">{{ statistics.diseases }}</div>
          <div class="l">病害记录</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="ico-bg b-pu">
          <i class="iconfontjs icon-cc"></i>
        </div>
        <div class="m-content">
          <div class="v">{{ statistics.yield }}</div>
          <div class="l">年度产量(t)</div>
        </div>
      </div>
    </div>

    <div class="main-grid">
      <!-- 2. 系统公告 & 天气 (左侧/中侧) -->
      <div class="left-col animate__animated animate__fadeInLeft">
        <el-card class="glass-card mb-4 notice-container">
          <template #header>
            <div class="c-header">
              <span class="dot-green"></span>
              <h4>平台核心公告</h4>
            </div>
          </template>
          <div class="n-body">
            尊敬的农研专家：本平台已深度集成 <strong>智谱 GLM-4 智能助研</strong> 引擎，支持实时病害图像识别与农事策略生成。请通过“图片检测”或“智能助手”模块开启您的智慧农研之旅。
          </div>
        </el-card>

        <el-card class="glass-card weather-container">
          <template #header>
            <div class="c-header">
              <i class="iconfontjs icon-qixiang text-blue-500 mr-2"></i>
              <h4>产区实时气象</h4>
            </div>
          </template>
          <div class="w-body">
            <div class="w-main">
              <span class="temp">{{ weatherInfo.temperature }}</span>
              <div class="w-status">
                <div class="txt">{{ weatherInfo.weather }}</div>
                <div class="day">{{ today.weekday }} · {{ today.date }}</div>
              </div>
            </div>
            <div class="w-grid">
              <div class="wi"><span>湿度:</span> {{ weatherInfo.humidity }}</div>
              <div class="wi"><span>风力:</span> {{ weatherInfo.wind }}</div>
            </div>
            <div class="w-notice">
              <i class="iconfontjs icon-znwd mr-1"></i> {{ weatherInfo.notice }}
            </div>
          </div>
        </el-card>
      </div>

      <!-- 3. 常用应用 (右侧缩略) -->
      <div class="right-col animate__animated animate__fadeInRight">
        <el-card class="glass-card app-card">
          <template #header>
            <div class="c-header">
              <h4>快捷农技入口</h4>
              <el-button link type="primary" size="small">更多</el-button>
            </div>
          </template>
          <div class="app-grid">
            <div class="ai" @click="$router.push('/smartChat')">
              <div class="ai-box b-bl"><i class="iconfontjs icon-znwd"></i></div>
              <span>GLM 助手</span>
            </div>
            <div class="ai" @click="$router.push('/imgPredict')">
              <div class="ai-box b-em"><i class="iconfontjs icon-tpjc"></i></div>
              <span>图片检测</span>
            </div>
            <div class="ai" @click="$router.push('/videoPredict')">
              <div class="ai-box b-or"><i class="iconfontjs icon-spjc"></i></div>
              <span>视频监控</span>
            </div>
            <div class="ai" @click="$router.push('/infoDisease')">
              <div class="ai-box b-pu"><i class="iconfontjs icon-bingchonghai-1haichong"></i></div>
              <span>病害百科</span>
            </div>
          </div>
        </el-card>

        <!-- 农业外链 -->
         <el-card class="glass-card mt-4 links-container">
          <div class="links-list">
            <a v-for="link in agricultureLinks" :key="link.name" :href="link.url" target="_blank" class="l-item">
              {{ link.name }} <i class="iconfontjs icon-tpjl"></i>
            </a>
          </div>
         </el-card>
      </div>
    </div>

    <!-- 4. 数据图表行 -->
    <div class="charts-row animate__animated animate__fadeInUp">
      <el-card class="glass-card p-chart">
        <template #header>
          <div class="c-header"><h4>重点病害分布统计</h4></div>
        </template>
        <div id="diseasePieChart" class="chart-box"></div>
      </el-card>
      <el-card class="glass-card l-chart">
        <template #header>
          <div class="c-header"><h4>年度预估产量趋势 (2025)</h4></div>
        </template>
        <div id="yieldLineChart" class="chart-box"></div>
      </el-card>
    </div>

    <!-- 5. 温室作物状态 -->
    <div class="greenhouse-section animate__animated animate__fadeInUp animate__delay-1s">
      <div class="section-title">
        <span class="v-line"></span>
        <h3>温室作物实时监测</h3>
      </div>
      <div class="gh-grid">
        <div v-for="gh in cropTypes" :key="gh.name" class="gh-card">
          <div class="gh-head">
            <span class="name">{{ gh.name }}</span>
            <el-tag :type="gh.status === '异常预警' ? 'danger' : gh.status === '需要关注' ? 'warning' : 'success'" size="small" effect="dark">
              {{ gh.status }}
            </el-tag>
          </div>
          <div class="gh-body">
            <div class="row"><span>作物种类:</span> <strong>{{ gh.crop }}</strong></div>
            <div class="row"><span>植株总量:</span> {{ gh.plantCount }}</div>
            <div class="row" :class="{'err': gh.diseaseCount > 10}">
              <span>病害发现:</span> {{ gh.diseaseCount }}
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped lang="scss">
.home-view {
  padding: 24px;
  background: transparent;
  min-height: 100%;
}

/* 1. Metrics */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 24px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.85);
  }

  .ico-bg {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    i { font-size: 24px; color: #fff; }
  }
  .b-em { background: linear-gradient(135deg, #10B981, #059669); }
  .b-bl { background: linear-gradient(135deg, #3B82F6, #2563EB); }
  .b-or { background: linear-gradient(135deg, #F59E0B, #D97706); }
  .b-pu { background: linear-gradient(135deg, #8B5CF6, #7C3AED); }

  .m-content {
    .v { font-size: 26px; font-weight: 800; color: #1e293b; line-height: 1; margin-bottom: 4px; }
    .l { font-size: 13px; color: #64748b; font-weight: 500; }
  }
}

/* 2. Layout Grid */
.main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px);
  border-radius: 16px !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03) !important;

  :deep(.el-card__header) {
    border-bottom: 1px solid rgba(0,0,0,0.05);
    padding: 16px 20px;
  }
}

.c-header {
  display: flex;
  align-items: center;
  gap: 8px;
  h4 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
}

.dot-green { width: 8px; height: 8px; background: #10B981; border-radius: 50%; }

/* Notice */
.n-body { font-size: 14px; line-height: 1.8; color: #475569; padding: 4px 0; }

/* Weather */
.w-body {
  .w-main {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 20px;
    .temp { font-size: 42px; font-weight: 800; color: #10B981; line-height: 1; }
    .w-status {
      .txt { font-size: 16px; font-weight: 700; color: #1e293b; }
      .day { font-size: 12px; color: #94a3b8; }
    }
  }
  .w-grid {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(16,185,129,0.05);
    border-radius: 12px;
    .wi { font-size: 13px; color: #475569; span { color: #94a3b8; margin-right: 4px; } }
  }
  .w-notice { font-size: 12px; color: #64748b; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.02); }
}

/* App Entry */
.app-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  .ai {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    padding: 16px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover { background: #fff; border-color: #10B981; transform: translateY(-3px); box-shadow: 0 4px 10px rgba(16,185,129,0.1); }
    
    .ai-box {
      width: 44px; height: 44px; border-radius: 10px; margin-bottom: 8px;
      display: flex; align-items: center; justify-content: center;
      i { font-size: 20px; color: #fff; }
    }
    span { font-size: 13px; font-weight: 600; color: #475569; }
  }
}

/* Links */
.links-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  .l-item {
    font-size: 13px; color: #64748b; text-decoration: none;
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; border-radius: 8px; background: #f8fafc;
    transition: color 0.2s;
    &:hover { color: #10B981; background: rgba(16,185,129,0.05); }
    i { font-size: 12px; opacity: 0.5; }
  }
}

/* 4. Charts */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 32px;
  .chart-box { width: 100%; height: 320px; }
}

/* 5. Greenhouse */
.section-title {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
  .v-line { width: 4px; height: 20px; background: #10B981; border-radius: 2px; }
  h3 { margin: 0; font-size: 18px; font-weight: 800; color: #1e293b; letter-spacing: -0.01em; }
}

.gh-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.gh-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  &:hover { background: rgba(255, 255, 255, 0.9); transform: translateY(-4px); }

  .gh-head {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    .name { font-weight: 700; color: #1e293b; font-size: 15px; }
  }
  .gh-body {
    .row {
      font-size: 13px; color: #64748b; margin-bottom: 8px;
      display: flex; justify-content: space-between;
      span { color: #94a3b8; }
      strong { color: #1e293b; }
      &.err { color: #ef4444; font-weight: 700; }
    }
  }
}

@media (max-width: 1400px) {
  .gh-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 1024px) {
  .metrics-row { grid-template-columns: repeat(2, 1fr); }
  .main-grid { grid-template-columns: 1fr; }
  .charts-row { grid-template-columns: 1fr; }
  .gh-grid { grid-template-columns: 1fr; }
}
</style>
