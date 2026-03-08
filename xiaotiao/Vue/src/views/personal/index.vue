<template>
	<div class="personal-container">
		<div class="personal-wrapper">
			<el-row :gutter="32">
				<!-- 左侧：头像与概览 -->
				<el-col :lg="8" :md="10" :sm="24">
					<el-card shadow="never" class="glass-card profile-card">
						<div class="avatar-section">
							<el-upload
								v-model="state.form.avatar"
								ref="uploadFile"
								class="avatar-uploader"
								action="http://localhost:9999/files/upload"
								:show-file-list="false"
								:on-success="handleAvatarSuccessone"
							>
								<div class="avatar-box">
									<img v-if="imageUrl" :src="imageUrl" class="avatar-img" />
									<div v-else class="avatar-placeholder">
										<el-icon><Plus /></el-icon>
									</div>
									<div class="avatar-hover-tip">更换头像</div>
								</div>
							</el-upload>
							
							<div class="user-meta mt-6">
								<h3 class="user-name">{{ state.form.name || '未设置昵称' }}</h3>
								<div class="role-badge">
									<el-icon class="mr-1"><Medal /></el-icon>
									{{ state.form.role }}
								</div>
							</div>

							<div class="user-stats mt-8">
								<div class="stat-item">
									<span class="stat-value">Active</span>
									<span class="stat-label">账户状态</span>
								</div>
								<div class="stat-divider"></div>
								<div class="stat-item">
									<span class="stat-value">{{ state.form.username }}</span>
									<span class="stat-label">系统账号</span>
								</div>
							</div>
						</div>
					</el-card>
				</el-col>

				<!-- 右侧：详细资料表目 -->
				<el-col :lg="16" :md="14" :sm="24">
					<el-card shadow="never" class="glass-card info-edit-card">
						<template #header>
							<div class="card-header">
								<span class="title">账户资料设置</span>
								<p class="subtitle">管理您的个人资料、联系方式及安全选项</p>
							</div>
						</template>
						
						<el-form 
							ref="formRef"
							:model="state.form" 
							:rules="rules"
							label-position="top"
							class="modern-form"
						>
							<el-row :gutter="24">
								<el-col :span="12">
									<el-form-item label="登录账号" prop="username">
										<el-input v-model="state.form.username" disabled class="glass-input" />
									</el-form-item>
								</el-col>
								<el-col :span="12">
									<el-form-item label="账户密码" prop="password">
										<el-input v-model="state.form.password" type="password" show-password class="glass-input" />
									</el-form-item>
								</el-col>
								<el-col :span="12">
									<el-form-item label="真实姓名" prop="name">
										<el-input v-model="state.form.name" placeholder="请输入您的真实姓名" class="glass-input" />
									</el-form-item>
								</el-col>
								<el-col :span="12">
									<el-form-item label="性别" prop="sex">
										<el-select v-model="state.form.sex" placeholder="选择性别" class="glass-select w-full">
											<el-option label="男" value="男" />
											<el-option label="女" value="女" />
										</el-select>
									</el-form-item>
								</el-col>
								<el-col :span="12">
									<el-form-item label="邮箱地址" prop="email">
										<el-input v-model="state.form.email" placeholder="example@farm.com" class="glass-input" />
									</el-form-item>
								</el-col>
								<el-col :span="12">
									<el-form-item label="联系电话" prop="tel">
										<el-input v-model="state.form.tel" placeholder="请输入手机号" class="glass-input" />
									</el-form-item>
								</el-col>
							</el-row>

							<div class="form-actions mt-8">
								<el-button type="primary" size="large" @click="submitForm" class="save-btn">
									保存更改
								</el-button>
								<el-button size="large" plain @click="getTableData">重置</el-button>
							</div>
						</el-form>
					</el-card>
				</el-col>
			</el-row>
		</div>
	</div>
</template>

<script setup lang="ts" name="personal">
import { reactive, ref, onMounted } from 'vue';
import type { UploadInstance, UploadProps, FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import request from '/@/utils/request';
import { useUserInfo } from '/@/stores/userInfo';
import { storeToRefs } from 'pinia';
import { Plus, Check, Medal } from '@element-plus/icons-vue';

const imageUrl = ref('');
const uploadFile = ref<UploadInstance>();
const formRef = ref<FormInstance>();

const rules = {
	username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
	password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 3, max: 20, message: '长度 3-20', trigger: 'blur' }],
	name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
	sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
	email: [{ required: true, message: '请输入邮箱地址', trigger: 'blur' }, { type: 'email', message: '格式不正确', trigger: 'blur' }],
};

const handleAvatarSuccessone: UploadProps['onSuccess'] = (response, uploadFile) => {
	imageUrl.value = URL.createObjectURL(uploadFile.raw!);
	state.form.avatar = response.data;
};

const state = reactive({
	form: {} as any,
});

const stores = useUserInfo();
const { userInfos } = storeToRefs(stores);

const getTableData = () => {
	request.get('/api/user/' + userInfos.value.userName).then((res) => {
		if (res.code == 0) {
			state.form = res.data;
			const roleMap = { 'admin': '系统管理员', 'common': '普通科员', 'others': '特约专家' };
			state.form.role = roleMap[state.form.role] || state.form.role;
			imageUrl.value = state.form.avatar;
		}
	});
};

const submitForm = async () => {
	if (!formRef.value) return;
	await formRef.value.validate((valid) => {
		if (valid) upData();
	});
};

const upData = () => {
	const roleReverseMap = { '系统管理员': 'admin', '普通科员': 'common', '特约专家': 'others' };
	const postData = { ...state.form, role: roleReverseMap[state.form.role] || state.form.role };
	
	request.post('/api/user/update', postData).then((res) => {
		if (res.code == 0) {
			ElMessage.success('配置同步成功！');
			getTableData();
		} else {
			ElMessage.error(res.msg);
		}
	});
};

onMounted(() => getTableData());
</script>

<style scoped lang="scss">
.personal-container {
	padding: 40px 20px;
	height: 100%;
	background: transparent;

	.personal-wrapper {
		max-width: 1280px;
		margin: 0 auto;
	}

	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(16px);
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.5);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
	}
}

.profile-card {
	padding: 40px 20px;
	text-align: center;

	.avatar-section {
		.avatar-box {
			width: 160px; height: 160px;
			margin: 0 auto;
			border-radius: 50%;
			overflow: hidden;
			position: relative;
			box-shadow: 0 8px 24px rgba(0,0,0,0.1);
			border: 4px solid #fff;
			cursor: pointer;

			.avatar-img { width: 100%; height: 100%; object-fit: cover; }
			.avatar-placeholder {
				height: 100%; display: flex; align-items: center; justify-content: center;
				background: #f1f5f9; color: #94a3b8; font-size: 40px;
			}
			.avatar-hover-tip {
				position: absolute; bottom: 0; left: 0; width: 100%;
				background: rgba(0,0,0,0.6); color: #fff; font-size: 12px;
				padding: 6px 0; opacity: 0; transition: opacity 0.3s;
			}
			&:hover .avatar-hover-tip { opacity: 1; }
		}
	}

	.user-name { font-size: 24px; color: #1e293b; margin: 0 0 8px; font-weight: 800; }
	.role-badge {
		display: inline-flex; align-items: center;
		background: rgba(16, 185, 129, 0.1); color: #10B981;
		padding: 4px 16px; border-radius: 100px; font-weight: 700; font-size: 13px;
	}

	.user-stats {
		display: flex; justify-content: center; align-items: center;
		.stat-item {
			flex: 1; display: flex; flex-direction: column;
			.stat-value { font-size: 18px; color: #1e293b; font-weight: 700; }
			.stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
		}
		.stat-divider { width: 1px; height: 30px; background: #e2e8f0; margin: 0 20px; }
	}
}

.info-edit-card {
	padding: 10px 20px 30px;

	.card-header {
		.title { font-size: 18px; font-weight: 800; color: #1e293b; }
		.subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
	}

	.modern-form {
		:deep(.el-form-item__label) {
			font-weight: 700; color: #475569; font-size: 13px; padding-bottom: 4px;
		}

		.glass-input {
			:deep(.el-input__wrapper) {
				background: rgba(255, 255, 255, 0.4);
				border-radius: 10px;
				box-shadow: 0 0 0 1px rgba(0,0,0,0.05) inset;
				height: 44px;
				transition: all 0.3s;
				&:hover, &.is-focus { box-shadow: 0 0 0 1px #10B981 inset; }
			}
		}

		.glass-select {
			:deep(.el-input__wrapper) {
				background: rgba(255, 255, 255, 0.4); border-radius: 10px; height: 44px;
				box-shadow: 0 0 0 1px rgba(0,0,0,0.05) inset !important;
			}
		}

		.save-btn {
			background: linear-gradient(135deg, #10B981, #059669) !important;
			border: none !important;
			padding: 12px 40px; font-weight: 700; border-radius: 10px;
			box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
			&:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); }
		}
	}
}

@media (max-width: 992px) {
	.profile-card { margin-bottom: 32px; }
}
</style>
