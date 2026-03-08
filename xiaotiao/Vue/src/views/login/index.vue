<template>
	<div class="min-h-screen w-full flex bg-slate-50 font-sans">
		<!-- Left Section: Branding & Imagery -->
		<div class="hidden lg:flex lg:w-1/2 relative bg-emerald-600 overflow-hidden items-center justify-center">
			<!-- Overlay gradient -->
			<div class="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-blue-900/90 z-10 mix-blend-multiply"></div>
			<!-- Background Image using Unsplash agriculture -->
			<img src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2000&auto=format&fit=crop" 
				 alt="Smart Agriculture" 
				 class="absolute inset-0 w-full h-full object-cover z-0 opacity-80" />
			
			<div class="relative z-20 p-12 text-white flex flex-col justify-center max-w-2xl">
				<div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-xl border border-white/30">
					<i class="iconfontjs icon-zhihui text-3xl text-white"></i>
				</div>
				<h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">
					基于YOLO+AI的<br/>
					<span class="text-emerald-300">一体化智能云平台</span>
				</h1>
				<p class="text-lg md:text-xl text-emerald-50 max-w-lg mb-12 opacity-90 leading-relaxed">
					农作物病虫害检测与环境监测的数字化底座，驱动农业智能化、科学化管理，提升产量与品质。
				</p>
				
				<div class="flex items-center space-x-6 text-sm font-medium">
					<div class="flex items-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
						<i class="iconfontjs icon-znwd mr-2 text-emerald-300"></i> AI 智能分析
					</div>
					<div class="flex items-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
						<i class="iconfontjs icon-bingchonghai-1haichong mr-2 text-emerald-300"></i> 病害秒级识别
					</div>
				</div>
			</div>
			
			<!-- Decorative Circles -->
			<div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl z-0"></div>
			<div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl z-0"></div>
		</div>

		<!-- Right Section: Login Form -->
		<div class="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
			<!-- Subtle corner decoration for the right side -->
			<div class="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-[100px] opacity-50 pointer-events-none"></div>

			<div class="w-full max-w-md relative z-10 animate__animated animate__fadeInUp animate__faster">
				<div class="lg:hidden w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
					<i class="iconfontjs icon-zhihui text-2xl text-emerald-600"></i>
				</div>
				
				<h2 class="text-3xl font-bold text-gray-800 mb-2 tracking-tight">欢迎回来</h2>
				<p class="text-gray-500 mb-8 border-b border-gray-100 pb-6">请输入您的账户进行登录管理系统</p>

				<el-form :model="ruleForm" :rules="registerRules" ref="ruleFormRef" class="space-y-6" @keyup.enter="submitForm(ruleFormRef)">
					<el-form-item prop="username" class="mb-5">
						<label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
						<el-input 
							v-model="ruleForm.username" 
							placeholder="请输入用户名" 
							class="h-12 text-md w-full" 
							prefix-icon="User"
						/>
					</el-form-item>

					<el-form-item prop="password" class="mb-5">
						<label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
						<el-input 
							v-model="ruleForm.password" 
							type="password" 
							placeholder="请输入登录密码" 
							show-password 
							class="h-12 text-md w-full"
							prefix-icon="Lock"
						/>
					</el-form-item>

					<div class="flex items-center justify-between mb-2">
						<el-checkbox v-model="rememberMe" class="text-gray-500 font-normal">记住密码</el-checkbox>
						<a href="#" class="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors">忘记密码？</a>
					</div>

					<el-form-item class="mt-8 mb-4">
						<el-button 
							type="primary" 
							class="w-full h-12 text-base font-medium rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all duration-300" 
							@click="submitForm(ruleFormRef)"
							:loading="loading">
							安全登录
						</el-button>
					</el-form-item>
				</el-form>

				<div class="mt-8 text-center text-sm text-gray-500">
					还没有账号？
					<router-link to="/register" class="font-medium text-emerald-600 hover:text-emerald-500 hover:underline transition-colors">立即注册申请</router-link>
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

<style scoped>
/* Reset Element Plus Input slightly to match Tailwind feel without breaking internal structure */
:deep(.el-input__wrapper) {
	background-color: #f8fafc;
	box-shadow: 0 0 0 1px #e2e8f0 inset !important;
	border-radius: 0.5rem;
	transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
	box-shadow: 0 0 0 1px #cbd5e1 inset !important;
	background-color: #f1f5f9;
}

:deep(.el-input__wrapper.is-focus) {
	box-shadow: 0 0 0 2px #10b981 inset !important;
	background-color: #ffffff;
}

:deep(.el-input__inner) {
	color: #1e293b;
}

:deep(.el-input__inner::placeholder) {
	color: #94a3b8;
}

/* Customized primary button to use Emerald color via Element UI deep classes */
:deep(.el-button--primary) {
	background-color: #10b981;
	border-color: #10b981;
}

:deep(.el-button--primary:hover),
:deep(.el-button--primary:focus) {
	background-color: #059669;
	border-color: #059669;
}
</style>
