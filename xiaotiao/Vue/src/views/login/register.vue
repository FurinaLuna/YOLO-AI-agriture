<template>
	<div class="min-h-screen w-full flex bg-slate-50 font-sans">
		<!-- Left Section: Branding & Imagery -->
		<div class="hidden lg:flex lg:w-1/2 relative bg-emerald-600 overflow-hidden items-center justify-center">
			<!-- Overlay gradient -->
			<div class="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-blue-900/90 z-10 mix-blend-multiply"></div>
			<!-- Background Image using Unsplash agriculture -->
			<img src="https://images.unsplash.com/photo-1592982537447-6f296d9a1386?q=80&w=2000&auto=format&fit=crop" 
				 alt="Smart Agriculture Tech" 
				 class="absolute inset-0 w-full h-full object-cover z-0 opacity-80" />
			
			<div class="relative z-20 p-12 text-white flex flex-col justify-center max-w-2xl">
				<div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-xl border border-white/30">
					<i class="iconfontjs icon-zhihui text-3xl text-white"></i>
				</div>
				<h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">
					加入我们，共建<br/>
					<span class="text-emerald-300">智慧农业新生态</span>
				</h1>
				<p class="text-lg md:text-xl text-emerald-50 max-w-lg mb-12 opacity-90 leading-relaxed">
					注册成为平台用户，即刻体验基于 YOLO 的精准病害识别与全天候环境监测服务。
				</p>
				
				<div class="flex items-center space-x-6 text-sm font-medium">
					<div class="flex items-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
						<i class="iconfontjs icon-cc mr-2 text-emerald-300"></i> 提升作物产量
					</div>
					<div class="flex items-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
						<i class="iconfontjs icon-qixiang mr-2 text-emerald-300"></i> 实时气象感知
					</div>
				</div>
			</div>
			
			<!-- Decorative Circles -->
			<div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl z-0"></div>
			<div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl z-0"></div>
		</div>

		<!-- Right Section: Registration Form -->
		<div class="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
			<!-- Subtle corner decoration for the right side -->
			<div class="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-[100px] opacity-50 pointer-events-none"></div>

			<div class="w-full max-w-md relative z-10 animate__animated animate__fadeInUp animate__faster">
				<div class="lg:hidden w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
					<i class="iconfontjs icon-zhihui text-2xl text-emerald-600"></i>
				</div>
				
				<h2 class="text-3xl font-bold text-gray-800 mb-2 tracking-tight">创建您的账户</h2>
				<p class="text-gray-500 mb-8 border-b border-gray-100 pb-6">开启您的智慧农业管理之旅</p>

				<el-form :model="ruleForm" :rules="registerRules" ref="ruleFormRef" class="space-y-5" @keyup.enter="submitForm(ruleFormRef)">
					<el-form-item prop="username" class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
						<el-input 
							v-model="ruleForm.username" 
							placeholder="请输入您希望注册的用户名" 
							class="h-12 text-md w-full" 
							prefix-icon="User"
						/>
					</el-form-item>

					<el-form-item prop="password" class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
						<el-input 
							v-model="ruleForm.password" 
							type="password" 
							placeholder="请设置登录密码" 
							show-password 
							class="h-12 text-md w-full"
							prefix-icon="Lock"
						/>
					</el-form-item>
					
					<el-form-item prop="confirm" class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
						<el-input 
							v-model="ruleForm.confirm" 
							type="password" 
							placeholder="请再次输入密码以确认" 
							show-password 
							class="h-12 text-md w-full"
							prefix-icon="Lock"
						/>
					</el-form-item>

					<el-form-item class="mt-8 mb-4">
						<el-button 
							type="primary" 
							class="w-full h-12 text-base font-medium rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all duration-300" 
							@click="submitForm(ruleFormRef)"
							:loading="loading">
							同意协议并注册
						</el-button>
					</el-form-item>
				</el-form>

				<div class="mt-8 text-center text-sm text-gray-500">
					已有账号？
					<router-link to="/login" class="font-medium text-emerald-600 hover:text-emerald-500 hover:underline transition-colors">直接登录</router-link>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import request from '/@/utils/request';

const router = useRouter();
const ruleFormRef = ref<FormInstance>();
const loading = ref(false);

const ruleForm = reactive({
	username: '',
	password: '',
	confirm: '',
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
	confirm: [
		{ required: true, message: '请确认密码', trigger: 'blur' },
		{
			validator: (rule, value, callback) => {
				if (value !== ruleForm.password) {
					callback(new Error('两次密码不一致!'));
				} else {
					callback();
				}
			},
			trigger: 'blur',
		},
	],
});

const submitForm = (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	formEl.validate((valid) => {
		if (valid) {
			loading.value = true;
			request.post('/api/user/register', ruleForm).then((res) => {
				loading.value = false;
				if (res.code == 0) {
					ElMessage.success('注册成功！正在前往登录页面...');
					setTimeout(() => {
						router.push('/login');
					}, 1000);
				} else {
					ElMessage.error(res.msg || '用户名已存在！');
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
