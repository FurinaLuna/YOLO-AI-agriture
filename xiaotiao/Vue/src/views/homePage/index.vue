<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElCard, ElButton, ElTag, ElSkeleton, ElSkeletonItem } from 'element-plus'
import 'element-plus/dist/index.css'

const router = useRouter()

const isLoading = ref(true)

const statistics = ref({
  users: 42,
  greenhouse: 9,
  diseases: 141,
  yield: 1232
})

const animatedStats = ref({
  users: 0,
  greenhouse: 0,
  diseases: 0,
  yield: 0
})

let diseaseDistChart: echarts.ECharts
let plantingStatsChart: echarts.ECharts

const today = ref({
  date: '',
  weekday: ''
})

const weatherInfo = ref({
  temperature: '24°C',
  weather: '晴转多云',
  humidity: '65%',
  wind: '东北风 2级',
  notice: '当前气象条件适宜农事活动，建议进行作物追肥。'
})

const cropTypes = ref([
  { name: '1号温室', crop: '玉米', status: '生长良好', plantCount: 350, diseaseCount: 0, trend: 'up' },
  { name: '2号温室', crop: '水稻', status: '生长良好', plantCount: 400, diseaseCount: 2, trend: 'stable' },
  { name: '3号温室', crop: '小麦', status: '异常预警', plantCount: 350, diseaseCount: 18, trend: 'down' },
  { name: '4号温室', crop: '马铃薯', status: '生长良好', plantCount: 250, diseaseCount: 1, trend: 'up' },
  { name: '5号温室', crop: '棉花', status: '生长良好', plantCount: 300, diseaseCount: 3, trend: 'stable' },
  { name: '6号温室', crop: '苹果', status: '需要关注', plantCount: 128, diseaseCount: 14, trend: 'down' }
])

const agricultureLinks = ref([
  { name: '中国农村网', url: 'https://www.crnews.net/', icon: 'icon-nongye', desc: '政策资讯' },
  { name: '中国农业网', url: 'https://www.zgny.com/', icon: 'icon-keji', desc: '行业动态' },
  { name: '国家农业数据中心', url: 'https://www.agridata.cn/', icon: 'icon-qixiang', desc: '数据服务' },
  { name: '农业科技报', url: 'https://www.nkb.com.cn/', icon: 'icon-zhihui', desc: '科技前沿' }
])

const quickActions = computed(() => [
  { 
    name: 'GLM 助手', 
    path: '/smartChat', 
    icon: 'icon-znwd', 
    color: 'secondary',
    desc: 'AI智能问答'
  },
  { 
    name: '图片检测', 
    path: '/imgPredict', 
    icon: 'icon-tpjc', 
    color: 'primary',
    desc: '病害识别'
  },
  { 
    name: '视频监控', 
    path: '/videoPredict', 
    icon: 'icon-spjc', 
    color: 'accent',
    desc: '实时监测'
  },
  { 
    name: '病害百科', 
    path: '/infoDisease', 
    icon: 'icon-bingchonghai-1haichong', 
    color: 'neutral',
    desc: '知识库'
  }
])

const animateNumber = (target: keyof typeof animatedStats, end: number, duration = 1500) => {
  const start = 0
  const startTime = performance.now()
  
  const update = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    
    animatedStats.value[target] = Math.floor(start + (end - start) * easeOut)
    
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  
  requestAnimationFrame(update)
}

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

const initCharts = () => {
  const pieDom = document.getElementById('diseasePieChart')
  if (pieDom) {
    diseaseDistChart = echarts.init(pieDom)
    diseaseDistChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { 
        trigger: 'item', 
        padding: [12, 16],
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 13 },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);'
      },
      legend: { 
        bottom: '0%', 
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 16,
        textStyle: { color: '#64748b', fontSize: 12 }
      },
      color: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'],
      series: [{
        name: '病害种类',
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { 
          borderRadius: 8, 
          borderColor: '#fff', 
          borderWidth: 3 
        },
        label: { show: false },
        emphasis: { 
          label: { 
            show: true, 
            fontSize: 14, 
            fontWeight: '600',
            color: '#1e293b'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.15)'
          }
        },
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
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { 
          type: 'cross',
          crossStyle: { color: '#94a3b8' }
        },
        padding: [12, 16],
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 13 }
      },
      grid: { 
        left: '3%', 
        right: '4%', 
        bottom: '12%', 
        top: '12%', 
        containLabel: true 
      },
      xAxis: { 
        type: 'category', 
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: { 
        type: 'value', 
        name: '产量(吨)',
        nameTextStyle: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [{
        name: '预估产量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#10B981' },
        itemStyle: { color: '#10B981', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16,185,129,0.25)' },
            { offset: 1, color: 'rgba(16,185,129,0.02)' }
          ])
        },
        data: [180, 220, 310, 420, 530, 580, 650, 720, 750, 820, 890, 950]
      }]
    })
  }
}

const handleResize = () => {
  diseaseDistChart?.resize()
  plantingStatsChart?.resize()
}

const navigateTo = (path: string) => {
  router.push(path)
}

const getStatusType = (status: string) => {
  if (status === '异常预警') return 'danger'
  if (status === '需要关注') return 'warning'
  return 'success'
}

const getTrendIcon = (trend: string) => {
  if (trend === 'up') return '↑'
  if (trend === 'down') return '↓'
  return '→'
}

onMounted(() => {
  fetchWeatherData()
  
  setTimeout(() => {
    isLoading.value = false
    nextTick(() => {
      initCharts()
      window.addEventListener('resize', handleResize)
      
      animateNumber('users', statistics.value.users)
      animateNumber('greenhouse', statistics.value.greenhouse)
      animateNumber('diseases', statistics.value.diseases)
      animateNumber('yield', statistics.value.yield)
    })
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  diseaseDistChart?.dispose()
  plantingStatsChart?.dispose()
})
</script>

<template>
  <div class="dashboard">
    <div class="metrics-grid animate-fade-in-down">
      <div class="metric-card" v-for="(stat, key) in statistics" :key="key">
        <div class="metric-icon" :class="`metric-icon--${key}`">
          <i :class="[
            'iconfontjs',
            key === 'users' ? 'icon-yh' : 
            key === 'greenhouse' ? 'icon-znws' : 
            key === 'diseases' ? 'icon-bingchonghai-1haichong' : 'icon-cc'
          ]"></i>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ animatedStats[key as keyof typeof animatedStats] }}</div>
          <div class="metric-label">
            {{ key === 'users' ? '活跃用户' : 
               key === 'greenhouse' ? '受控温室' : 
               key === 'diseases' ? '病害记录' : '年度产量(t)' }}
          </div>
        </div>
        <div class="metric-trend" v-if="key !== 'diseases'">
          <span class="trend-up">+12%</span>
        </div>
      </div>
    </div>

    <div class="main-grid">
      <div class="left-column animate-fade-in-left">
        <el-card class="glass-card notice-card">
          <template #header>
            <div class="card-header">
              <span class="status-dot"></span>
              <h4 class="card-title">平台公告</h4>
            </div>
          </template>
          <div class="notice-content">
            <p>
              尊敬的农研专家：本平台已深度集成 <strong class="highlight">智谱 GLM-4 智能助研</strong> 引擎，
              支持实时病害图像识别与农事策略生成。请通过"图片检测"或"智能助手"模块开启您的智慧农研之旅。
            </p>
          </div>
        </el-card>

        <el-card class="glass-card weather-card">
          <template #header>
            <div class="card-header">
              <i class="iconfontjs icon-qixiang weather-icon"></i>
              <h4 class="card-title">产区气象</h4>
            </div>
          </template>
          <div class="weather-content">
            <div class="weather-main">
              <span class="temperature">{{ weatherInfo.temperature }}</span>
              <div class="weather-status">
                <div class="weather-text">{{ weatherInfo.weather }}</div>
                <div class="weather-date">{{ today.weekday }} · {{ today.date }}</div>
              </div>
            </div>
            <div class="weather-details">
              <div class="detail-item">
                <span class="detail-label">湿度</span>
                <span class="detail-value">{{ weatherInfo.humidity }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">风力</span>
                <span class="detail-value">{{ weatherInfo.wind }}</span>
              </div>
            </div>
            <div class="weather-notice">
              <i class="iconfontjs icon-znwd"></i>
              <span>{{ weatherInfo.notice }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <div class="right-column animate-fade-in-right">
        <el-card class="glass-card actions-card">
          <template #header>
            <div class="card-header">
              <h4 class="card-title">快捷入口</h4>
              <el-button link type="primary" size="small" class="more-btn">更多</el-button>
            </div>
          </template>
          <div class="actions-grid">
            <div 
              v-for="action in quickActions" 
              :key="action.path"
              class="action-item"
              @click="navigateTo(action.path)"
            >
              <div class="action-icon" :class="`action-icon--${action.color}`">
                <i :class="['iconfontjs', action.icon]"></i>
              </div>
              <div class="action-info">
                <span class="action-name">{{ action.name }}</span>
                <span class="action-desc">{{ action.desc }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="glass-card links-card">
          <div class="links-list">
            <a 
              v-for="link in agricultureLinks" 
              :key="link.name" 
              :href="link.url" 
              target="_blank" 
              class="link-item"
            >
              <div class="link-info">
                <i :class="['iconfontjs', link.icon]"></i>
                <div class="link-text">
                  <span class="link-name">{{ link.name }}</span>
                  <span class="link-desc">{{ link.desc }}</span>
                </div>
              </div>
              <i class="iconfontjs icon-tpjl link-arrow"></i>
            </a>
          </div>
        </el-card>
      </div>
    </div>

    <div class="charts-grid animate-fade-in-up">
      <el-card class="glass-card chart-card chart-card--pie">
        <template #header>
          <div class="card-header">
            <h4 class="card-title">病害分布统计</h4>
            <span class="card-subtitle">本月数据</span>
          </div>
        </template>
        <div id="diseasePieChart" class="chart-container"></div>
      </el-card>
      
      <el-card class="glass-card chart-card chart-card--line">
        <template #header>
          <div class="card-header">
            <h4 class="card-title">年度产量趋势</h4>
            <span class="card-subtitle">2025年预估</span>
          </div>
        </template>
        <div id="yieldLineChart" class="chart-container"></div>
      </el-card>
    </div>

    <div class="greenhouse-section animate-fade-in-up">
      <div class="section-header">
        <div class="section-indicator"></div>
        <h3 class="section-title">温室作物实时监测</h3>
        <el-button link type="primary" size="small" @click="navigateTo('/infoGreenhouse')">
          查看全部 →
        </el-button>
      </div>
      
      <div class="greenhouse-grid">
        <div 
          v-for="gh in cropTypes" 
          :key="gh.name" 
          class="greenhouse-card"
          :class="{ 'greenhouse-card--alert': gh.status === '异常预警' }"
        >
          <div class="gh-header">
            <span class="gh-name">{{ gh.name }}</span>
            <el-tag :type="getStatusType(gh.status)" size="small" effect="dark" class="gh-status">
              {{ gh.status }}
            </el-tag>
          </div>
          <div class="gh-body">
            <div class="gh-row">
              <span class="gh-label">作物种类</span>
              <strong class="gh-value">{{ gh.crop }}</strong>
            </div>
            <div class="gh-row">
              <span class="gh-label">植株总量</span>
              <span class="gh-value">{{ gh.plantCount }}</span>
            </div>
            <div class="gh-row" :class="{ 'gh-row--error': gh.diseaseCount > 10 }">
              <span class="gh-label">病害发现</span>
              <span class="gh-value">
                {{ gh.diseaseCount }}
                <span v-if="gh.diseaseCount > 10" class="trend-badge trend-badge--danger">
                  {{ getTrendIcon(gh.trend) }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
  min-height: 100%;
  background: var(--gradient-mesh);
}

/* 动画 */
.animate-fade-in-down {
  animation: fadeInDown 0.5s ease-out;
}

.animate-fade-in-left {
  animation: fadeInLeft 0.5s ease-out 0.1s both;
}

.animate-fade-in-right {
  animation: fadeInRight 0.5s ease-out 0.1s both;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out 0.2s both;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 指标卡片 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
    background: rgba(255, 255, 255, 0.95);
  }
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i { font-size: 24px; color: white; }

  &--users { background: linear-gradient(135deg, #10B981, #059669); }
  &--greenhouse { background: linear-gradient(135deg, #3B82F6, #2563EB); }
  &--diseases { background: linear-gradient(135deg, #F59E0B, #D97706); }
  &--yield { background: linear-gradient(135deg, #8B5CF6, #7C3AED); }
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-neutral-800);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: 13px;
  color: var(--color-neutral-500);
  font-weight: 500;
  margin-top: 4px;
}

.metric-trend {
  position: absolute;
  top: 16px;
  right: 16px;
  
  .trend-up {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-success);
    background: rgba(34, 197, 94, 0.1);
    padding: 2px 8px;
    border-radius: 100px;
  }
}

/* 主网格布局 */
.main-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 玻璃卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(12px);
  border-radius: 16px !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  box-shadow: var(--shadow-card) !important;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--shadow-card-hover) !important;
  }

  :deep(.el-card__header) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    padding: 16px 20px;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-neutral-800);
}

.card-subtitle {
  font-size: 12px;
  color: var(--color-neutral-400);
  margin-left: auto;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: var(--color-primary-500);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

/* 公告卡片 */
.notice-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-neutral-600);

  .highlight {
    color: var(--color-primary-500);
    font-weight: 600;
  }
}

/* 天气卡片 */
.weather-icon {
  font-size: 18px;
  color: var(--color-secondary-500);
}

.weather-content {
  .weather-main {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 20px;
  }

  .temperature {
    font-size: 48px;
    font-weight: 800;
    color: var(--color-primary-500);
    line-height: 1;
  }

  .weather-status {
    .weather-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-neutral-800);
    }
    .weather-date {
      font-size: 12px;
      color: var(--color-neutral-400);
      margin-top: 2px;
    }
  }

  .weather-details {
    display: flex;
    gap: 24px;
    padding: 14px 16px;
    background: rgba(16, 185, 129, 0.05);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    font-size: 12px;
    color: var(--color-neutral-400);
  }

  .detail-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-neutral-700);
  }

  .weather-notice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: var(--color-neutral-500);
    background: var(--color-neutral-50);
    padding: 12px;
    border-radius: 10px;

    i {
      color: var(--color-primary-500);
      margin-top: 2px;
    }
  }
}

/* 快捷入口 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-100);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: white;
    border-color: var(--color-primary-200);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  }
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i { font-size: 20px; color: white; }

  &--primary { background: linear-gradient(135deg, #10B981, #059669); }
  &--secondary { background: linear-gradient(135deg, #3B82F6, #2563EB); }
  &--accent { background: linear-gradient(135deg, #F59E0B, #D97706); }
  &--neutral { background: linear-gradient(135deg, #64748b, #475569); }
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-neutral-800);
}

.action-desc {
  font-size: 12px;
  color: var(--color-neutral-400);
}

/* 链接列表 */
.links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--color-neutral-50);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(16, 185, 129, 0.05);
    
    .link-name { color: var(--color-primary-500); }
    .link-arrow { opacity: 1; transform: translateX(4px); }
  }
}

.link-info {
  display: flex;
  align-items: center;
  gap: 12px;

  i { font-size: 18px; color: var(--color-primary-400); }
}

.link-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.link-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-neutral-700);
  transition: color 0.2s;
}

.link-desc {
  font-size: 11px;
  color: var(--color-neutral-400);
}

.link-arrow {
  font-size: 12px;
  color: var(--color-neutral-400);
  opacity: 0.5;
  transition: all 0.2s;
}

/* 图表区域 */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 32px;
}

.chart-card {
  .chart-container {
    width: 100%;
    height: 300px;
  }
}

/* 温室监测区域 */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-indicator {
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, var(--color-primary-500), var(--color-primary-400));
  border-radius: 2px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-neutral-800);
  letter-spacing: -0.01em;
}

.greenhouse-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.greenhouse-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
  box-shadow: var(--shadow-card);

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
  }

  &--alert {
    border-color: rgba(239, 68, 68, 0.2);
    background: rgba(254, 242, 242, 0.5);
  }
}

.gh-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.gh-name {
  font-weight: 700;
  color: var(--color-neutral-800);
  font-size: 15px;
}

.gh-status {
  font-size: 11px;
}

.gh-body {
  .gh-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--color-neutral-500);
    margin-bottom: 10px;

    &:last-child { margin-bottom: 0; }

    &--error {
      color: var(--color-error);
      font-weight: 600;
    }
  }

  .gh-label {
    color: var(--color-neutral-400);
  }

  .gh-value {
    color: var(--color-neutral-700);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.trend-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 100px;
  
  &--danger {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
  }
}

/* 响应式 */
@media (max-width: 1400px) {
  .greenhouse-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 1200px) {
  .main-grid { grid-template-columns: 1fr; }
  .charts-grid { grid-template-columns: 1fr; }
}

@media (max-width: 1024px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .greenhouse-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .dashboard { padding: 16px; }
  .metrics-grid { grid-template-columns: 1fr; }
  .actions-grid { grid-template-columns: 1fr; }
}
</style>
