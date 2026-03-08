<template>
  <div class="login-container">
    <div class="login-left">
      <div class="overlay"></div>
      <img 
        src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2000&auto=format&fit=crop" 
        alt="智慧农业" 
        class="bg-image"
      />
      
      <div class="brand-content">
        <div class="brand-logo">
          <i class="iconfontjs icon-zhihui"></i>
        </div>
        
        <h1 class="brand-title">
          基于YOLO+AI的
          <span class="highlight">一体化智能云平台</span>
        </h1>
        
        <p class="brand-desc">
          农作物病虫害检测与环境监测的数字化底座，驱动农业智能化、科学化管理，提升产量与品质。
        </p>
        
        <div class="feature-tags">
          <div class="tag">
            <i class="iconfontjs icon-znwd"></i>
            <span>AI 智能分析</span>
          </div>
          <div class="tag">
            <i class="iconfontjs icon-bingchonghai-1haichong"></i>
            <span>病害秒级识别</span>
          </div>
          <div class="tag">
            <i class="iconfontjs icon-huanjingjiance"></i>
            <span>环境实时监测</span>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-value">99.2%</div>
            <div class="stat-label">识别准确率</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">141+</div>
            <div class="stat-label">病害种类</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">&lt;3s</div>
            <div class="stat-label">响应速度</div>
          </div>
        </div>
      </div>

      <div class="decorative-circles">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </div>

    <div class="login-right">
      <div class="corner-decoration"></div>
      
      <div class="form-wrapper animate-fade-in-up">
        <div class="mobile-logo">
          <i class="iconfontjs icon-zhihui"></i>
        </div>
        
        <div class="form-header">
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-subtitle">请输入您的账户登录管理系统</p>
        </div>

        <el-form 
          :model="ruleForm" 
          :rules="registerRules" 
          ref="ruleFormRef" 
          class="login-form"
          @keyup.enter="submitForm(ruleFormRef)"
        >
          <el-form-item prop="username">
            <label class="input-label">用户名</label>
            <el-input 
              v-model="ruleForm.username" 
              placeholder="请输入用户名" 
              class="custom-input"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="password">
            <label class="input-label">密码</label>
            <el-input 
              v-model="ruleForm.password" 
              type="password" 
              placeholder="请输入登录密码" 
              show-password 
              class="custom-input"
              prefix-icon="Lock"
              size="large"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe" class="remember-checkbox">
              记住密码
            </el-checkbox>
            <a href="#" class="forgot-link">忘记密码？</a>
          </div>

          <el-form-item class="submit-item">
            <el-button 
              type="primary" 
              class="submit-btn"
              @click="submitForm(ruleFormRef)"
              :loading="loading"
            >
              <span v-if="!loading">安全登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <span class="footer-text">还没有账号？</span>
          <router-link to="/register" class="register-link">
            立即注册申请
          </router-link>
        </div>

        <div class="tech-badge">
          <span class="badge-dot"></span>
          <span>Powered by GLM-4 & YOLO</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import Cookies from 'js-cookie';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { initFrontEndControlRoutes } from '/@/router/frontEnd';
import { initBackEndControlRoutes } from '/@/router/backEnd';
import { Session } from '/@/utils/storage';
import { formatAxis } from '/@/utils/formatTime';
import { NextLoading } from '/@/utils/loading';
import type { FormInstance, FormRules } from 'element-plus';
import request from '/@/utils/request';

const { t } = useI18n();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const route = useRoute();
const router = useRouter();
const ruleFormRef = ref<FormInstance>();
const loading = ref(false);
const rememberMe = ref(false);

const ruleForm = reactive({
  username: '',
  password: '',
});

const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在3-20个字符', trigger: 'blur' },
  ],
});

const currentTime = computed(() => {
  return formatAxis(new Date());
});

const onSignIn = async () => {
  Session.set('token', Math.random().toString(36).substr(0));
  Cookies.set('userName', ruleForm.username);
  if (!themeConfig.value.isRequestRoutes) {
    const isNoPower = await initFrontEndControlRoutes();
    signInSuccess(isNoPower);
  } else {
    const isNoPower = await initBackEndControlRoutes();
    signInSuccess(isNoPower);
  }
};

const signInSuccess = (isNoPower: boolean | undefined) => {
  if (isNoPower) {
    ElMessage.warning('抱歉，您没有登录权限');
    Session.clear();
  } else {
    let currentTimeInfo = currentTime.value;
    if (route.query?.redirect) {
      router.push({
        path: <string>route.query?.redirect,
        query: Object.keys(<string>route.query?.params).length > 0 ? JSON.parse(<string>route.query?.params) : '',
      });
    } else {
      router.push('/');
    }
    const signInText = t('message.signInText');
    ElMessage.success(`${currentTimeInfo}，${signInText}`);
    NextLoading.start();
  }
};

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate((valid) => {
    if (valid) {
      loading.value = true;
      request.post('/api/user/login', ruleForm).then((res) => {
        loading.value = false;
        if (res.code == 0) {
          Cookies.set('role', res.data.role);
          onSignIn();
        } else {
          ElMessage.error(res.msg || '登录失败，请检查账号和密码');
        }
      }).catch(() => {
        loading.value = false;
        ElMessage.error('网络请求异常，请稍候重试');
      });
    } else {
      return false;
    }
  });
};
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  font-family: var(--font-sans);
  background: var(--color-neutral-50);
}

/* 左侧品牌区域 */
.login-left {
  display: none;
  width: 50%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #059669 0%, #1e40af 100%);

  @media (min-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(5, 150, 105, 0.88) 0%, rgba(30, 64, 175, 0.88) 100%);
    z-index: 10;
  }

  .bg-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    opacity: 0.7;
  }
}

.brand-content {
  position: relative;
  z-index: 20;
  padding: 3rem;
  max-width: 560px;
  color: white;
}

.brand-logo {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  i {
    font-size: 32px;
    color: white;
  }
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;

  .highlight {
    display: block;
    color: #a7f3d0;
    margin-top: 0.5rem;
  }
}

.brand-desc {
  font-size: 1.125rem;
  line-height: 1.75;
  opacity: 0.9;
  margin-bottom: 2rem;
  max-width: 440px;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2.5rem;

  .tag {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    border-radius: 100px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 0.875rem;
    font-weight: 500;

    i {
      color: #a7f3d0;
    }
  }
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.stat-item {
  text-align: center;

  .stat-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: white;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 0.25rem;
  }
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

/* 装饰圆圈 */
.decorative-circles {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;

  .circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
  }

  .circle-1 {
    top: -5rem;
    right: -5rem;
    width: 20rem;
    height: 20rem;
    background: rgba(52, 211, 153, 0.3);
  }

  .circle-2 {
    bottom: -5rem;
    left: -5rem;
    width: 25rem;
    height: 25rem;
    background: rgba(59, 130, 246, 0.25);
  }

  .circle-3 {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30rem;
    height: 30rem;
    background: rgba(139, 92, 246, 0.1);
  }
}

/* 右侧表单区域 */
.login-right {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: white;
  position: relative;

  @media (min-width: 1024px) {
    width: 50%;
    padding: 3rem 4rem;
  }

  .corner-decoration {
    position: absolute;
    top: 0;
    right: 0;
    width: 16rem;
    height: 16rem;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
    border-radius: 0 0 0 100%;
    pointer-events: none;
  }
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 10;
}

.mobile-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: 12px;
  margin-bottom: 1.5rem;

  @media (min-width: 1024px) {
    display: none;
  }

  i {
    font-size: 24px;
    color: var(--color-primary-500);
  }
}

.form-header {
  margin-bottom: 2rem;
}

.form-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-neutral-800);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.form-subtitle {
  font-size: 0.9375rem;
  color: var(--color-neutral-500);
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-neutral-100);
}

.login-form {
  margin-top: 1.5rem;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-neutral-700);
  margin-bottom: 0.5rem;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.remember-checkbox {
  font-weight: 400;
  color: var(--color-neutral-500);
}

.forgot-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary-500);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary-600);
  }
}

.submit-item {
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
  }

  &:active {
    transform: translateY(0);
  }
}

.form-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.875rem;
}

.footer-text {
  color: var(--color-neutral-500);
}

.register-link {
  font-weight: 600;
  color: var(--color-primary-500);
  text-decoration: none;
  margin-left: 0.25rem;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary-600);
    text-decoration: underline;
  }
}

.tech-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-neutral-100);
  font-size: 0.75rem;
  color: var(--color-neutral-400);

  .badge-dot {
    width: 6px;
    height: 6px;
    background: var(--color-primary-500);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
}

/* 动画 */
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Element Plus 样式覆盖 */
:deep(.el-input__wrapper) {
  background-color: var(--color-neutral-50);
  box-shadow: 0 0 0 1px var(--color-neutral-200) inset;
  border-radius: 10px;
  padding: 0 14px;
  transition: all 0.2s ease;
  height: 48px;

  &:hover {
    box-shadow: 0 0 0 1px var(--color-neutral-300) inset;
    background-color: var(--color-neutral-100);
  }

  &.is-focus {
    box-shadow: 0 0 0 2px var(--color-primary-500) inset;
    background-color: white;
  }
}

:deep(.el-input__inner) {
  color: var(--color-neutral-800);
  font-size: 0.9375rem;

  &::placeholder {
    color: var(--color-neutral-400);
  }
}

:deep(.el-checkbox__label) {
  color: var(--color-neutral-500);
  font-size: 0.875rem;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--color-primary-500);
  border-color: var(--color-primary-500);
}
</style>
