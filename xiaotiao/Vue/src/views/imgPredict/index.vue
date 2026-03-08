<template>
	<div class="system-predict-container layout-padding">
		<div class="system-predict-padding layout-padding-auto layout-padding-view">
			<div class="header">
				<div class="weight">
					<el-select v-model="kind" placeholder="请选择作物种类" size="large" style="width: 160px" @change="getData">
						<el-option v-for="item in state.kind_items" :key="item.value" :label="item.label"
							:value="item.value" />
					</el-select>
				</div>
				<div class="weight">
					<el-select v-model="weight" placeholder="请选择模型" size="large" style="margin-left: 10px;width: 160px" @change="onWeightChange">
						<el-option v-for="item in state.weight_items" :key="item.value" :label="item.label"
							:value="item.value" />
					</el-select>
				</div>
				<div class="conf" style="margin-left: 10px;display: flex; flex-direction: row; align-items: center;">
					<span style="font-size: 13px; color: #64748b; margin-right: 12px; white-space: nowrap;">置信度阈值</span>
					<el-slider v-model="conf" :format-tooltip="formatTooltip" style="width: 150px;" />
				</div>
				<div class="button-section" style="margin-left: auto">
					<el-button 
						type="primary" 
						@click="upData" 
						class="predict-button" 
						:loading="aiStore.imgPredict.loading"
						:disabled="aiStore.imgPredict.loading"
					>🔍 {{ aiStore.imgPredict.loading ? '分析中...' : '开始识别' }}</el-button>
				</div>
			</div>

			<!-- 新增：核心指标摘要栏 (移至顶部) -->
			<div class="metrics-summary" v-if="aiStore.imgPredict.predictionResult.label">
				<div class="metric-item">
					<i class="iconfontjs icon-znwd"></i>
					<span class="m-label">识别概率：</span>
					<span class="m-value">{{ formatConfidenceArray(aiStore.imgPredict.predictionResult.confidence as any)[0] }}</span>
				</div>
				<div class="metric-divider"></div>
				<div class="metric-item">
					<i class="iconfontjs icon-huanjingjiance"></i>
					<span class="m-label">分析耗时：</span>
					<span class="m-value">{{ formatTime(aiStore.imgPredict.predictionResult.allTime) }}</span>
				</div>
				<div class="metric-item secondary" v-if="formatLabelArray(aiStore.imgPredict.predictionResult.label).length > 1">
					<el-tag type="info" size="small" effect="plain">+ 更多结果在下方</el-tag>
				</div>
			</div>

			<!-- 图片显示区域 -->
			<el-row :gutter="15" class="image-display">
				<!-- 原图展示 -->
				<el-col :span="8">
					<el-card shadow="hover" class="card">
						<div class="image-title">原图片</div>
						<el-upload v-model="state.img" ref="uploadFile" class="avatar-uploader"
							action="http://localhost:9999/files/upload" :show-file-list="false"
							:on-success="handleAvatarSuccessone"
							:disabled="aiStore.imgPredict.loading"
						>
							<el-image v-if="aiStore.imgPredict.imageUrl" :src="aiStore.imgPredict.imageUrl" class="preview-image" fit="contain" />
							<div v-else class="uploader-content"> 
								<el-icon class="upload-icon"><Plus /></el-icon>
								<div class="upload-text">点击或拖拽上传</div>
							</div>
						</el-upload>
					</el-card>
				</el-col>

				<!-- 预测结果图 -->
				<el-col :span="8">
					<el-card shadow="hover" class="card">
						<div class="image-title">预测结果图</div>
						<el-image v-if="aiStore.imgPredict.predictedImageUrl" :src="aiStore.imgPredict.predictedImageUrl" class="preview-image"
							fit="contain" />
						<div v-else class="placeholder">
							<el-icon><Picture /></el-icon>
							<span>等待识别...</span>
						</div>
					</el-card>
				</el-col>

				<!-- 智谱 GLM 建议 -->
				<el-col :span="8">
					<el-card shadow="hover" class="card ai-suggestion-card">
						<div class="image-title ai-card-header">
							<div class="ai-badge">
								<span class="ai-dot"></span>
								<span>专家诊断建议</span>
							</div>
						</div>
						<div class="suggestion-content" v-if="aiStore.imgPredict.aiSuggestion">
							<div class="suggestion-markdown markdown-body" v-html="renderMarkdown(aiStore.imgPredict.aiSuggestion)"></div>
						</div>
						<div class="suggestion-content" v-else-if="aiStore.imgPredict.suggestionLoading">
							<div class="ai-loading">
								<div class="ai-loading-dots"><span></span><span></span><span></span></div>
								<p>智谱 GLM 正在思考...</p>
							</div>
						</div>
						<div v-else class="placeholder">
							<el-icon><ChatLineRound /></el-icon>
							<span>智能建议生成区</span>
						</div>
					</el-card>
				</el-col>
			</el-row>
		</div>
	</div>
</template>


<script setup lang="ts" name="imgPredict">
import { reactive, ref, onMounted } from 'vue';
import type { UploadInstance, UploadProps } from 'element-plus';
import { ElMessage } from 'element-plus';
import request from '/@/utils/request';
import MarkdownIt from 'markdown-it';

// 初始化 Markdown 渲染器，用于 AI 建议内容
const md = new MarkdownIt({ breaks: true, linkify: true, typographer: true });
const renderMarkdown = (text: string) => md.render(text || '');
import { Plus, ChatLineRound, Picture } from '@element-plus/icons-vue';
import { useUserInfo } from '/@/stores/userInfo';
import { storeToRefs } from 'pinia';
import { formatDate } from '/@/utils/formatTime';
import axios from 'axios';
import { useAIStore } from '/@/stores/aiStore';

const aiStore = useAIStore();
const imageUrl = ref('');
const conf = ref(50);
const weight = ref('');
const kind = ref('');
const uploadFile = ref<UploadInstance>();
const stores = useUserInfo();
const { userInfos } = storeToRefs(stores);
// 新增响应式变量
const predictedImageUrl = ref('');
const state = reactive({
	weight_items: [] as any,
	kind_items: [
		{
			value: 'corn',
			label: '玉米',
		},
		{
			value: 'rice',
			label: '水稻',
		},
		{
			value: 'wheat',
			label: '小麦',
		},
		{
			value: 'potato',
			label: '马铃薯',
		},
    {
      value: 'tomato',
      label: '番茄',
    },
    {
      value: 'cotton',
      label: '棉花',
    },
    {
      value: 'apple',
      label: '苹果',
    },
    {
      value: 'grape',
      label: '葡萄',
    },
    {
      value: 'strawberry',
      label: '草莓',
    },
	],
	img: '',
	form: {
		username: '',
		inputImg: null as any,
		weight: '',
		conf: null as any,
		kind: '',
		startTime: ''
	},
});

const formatTooltip = (val: number) => {
	return val / 100
}

const handleAvatarSuccessone: UploadProps['onSuccess'] = (response, uploadFile) => {
	const url = URL.createObjectURL(uploadFile.raw!);
	aiStore.imgPredict.imageUrl = url;
	state.img = response.data;
};

// 模型选择变化时的回调
const onWeightChange = (val: string) => {
	if (!val) return;
	// 根据模型文件名自动匹配种类
	const matchedKind = state.kind_items.find(item => val.toLowerCase().includes(item.value.toLowerCase()));
	if (matchedKind) {
		kind.value = matchedKind.value;
	}
};

const getData = () => {
	// 如果已经选了模型且种类匹配，就不清空了，增强体验
	if (!weight.value || !weight.value.includes(kind.value)) {
		weight.value = ''; 
	}
	request.get('/api/flask/file_names').then((res) => {
		if (res.code == 0) {
			res.data = JSON.parse(res.data);
			// 如果没有选种类，显示所有模型；如果选了种类，执行过滤
			if (kind.value) {
				state.weight_items = res.data.weight_items.filter(item => item.value.includes(kind.value));
			} else {
				state.weight_items = res.data.weight_items;
			}
		} else {
			ElMessage.error(res.msg || '获取模型列表失败');
		}
	});
};

onMounted(() => {
	getData(); // 页面加载时获取一次所有模型
});


const upData = () => {
	if (!kind.value) {
		ElMessage.warning('请选择作物种类');
		return;
	}
	if (!weight.value) {
		ElMessage.warning('请选择模型');
		return;
	}
	if (conf.value === null || isNaN(Number(conf.value)) || Number(conf.value) === 0) {
		ElMessage.warning('请设置有效的置信度阈值（需大于0）');
		return;
	}
	if (!state.img) {
		ElMessage.warning('请上传图片');
		return;
	}
	state.form.weight = weight.value;
	state.form.conf = (conf.value / 100);

	state.form.username = userInfos.value.userName;
	state.form.inputImg = state.img;
	state.form.kind = kind.value;
	state.form.startTime = formatDate(new Date(), 'YYYY-mm-dd HH:MM:SS');
	
	aiStore.imgPredict.loading = true;
	aiStore.imgPredict.aiSuggestion = ''; // 重置建议
	
	request.post('/api/flask/predict', state.form).then((res) => {
		aiStore.imgPredict.loading = false;
		ElMessage.closeAll();
		if (res.code != 0) {
			aiStore.imgPredict.predictionResult.label = '';
			aiStore.imgPredict.predictionResult.confidence = '';
			aiStore.imgPredict.predictionResult.allTime = '';
			aiStore.imgPredict.predictedImageUrl = '';
			aiStore.imgPredict.aiSuggestion = '';
			ElMessage.warning(res.msg || '未发现识别结果，请尝试调低置信度');
			return;
		}

		try {
			res.data = JSON.parse(res.data);
			if (typeof res.data.label === 'string') res.data.label = JSON.parse(res.data.label);
			
			if (Array.isArray(res.data.label) && res.data.label.length > 0) {
				aiStore.imgPredict.predictionResult.label = res.data.label.map(item => item.replace(/\\u([\dA-Fa-f]{4})/g, (_, code) =>
					String.fromCharCode(parseInt(code, 16))
				));
				aiStore.imgPredict.predictionResult.confidence = res.data.confidence;
				aiStore.imgPredict.predictionResult.allTime = res.data.allTime;
				if (res.data.outImg) aiStore.imgPredict.predictedImageUrl = res.data.outImg;
				
				ElMessage.success('预测成功！');
				getAISuggestion();
			} else {
				// 兜底逻辑：如果返回 code 0 但结果依然为空
				aiStore.imgPredict.predictionResult.label = '';
				ElMessage.warning('检测结果低于当前阈值，请尝试调低滑动条');
			}
		} catch (error) {
			console.error('解析错误:', error);
			ElMessage.error('结果解析失败');
		} finally {
			aiStore.imgPredict.loading = false;
		}
	}).catch(() => {
		aiStore.imgPredict.loading = false;
	});
};
// 获取AI建议
const getAISuggestion = async () => {
	// 如果没有识别结果，直接安静地退出，不要弹窗报“请先预测”这种气人的话
	if (!aiStore.imgPredict.predictionResult.label || aiStore.imgPredict.predictionResult.label.length === 0) return;
	
	aiStore.imgPredict.suggestionLoading = true;
	try {
		const apiKey = '334ca8db8ede46d9bc1f73d58aa968fc.r9gdj8k3GW8u9CR4';
		
		const prompt = `作为一个专业的农作物病害专家，请对以下情况进行详细分析：

1. 基本信息：
- 作物类型：${state.kind_items.find(item => item.value === kind.value)?.label || kind.value}
- 检测到的病害：${aiStore.imgPredict.predictionResult.label}
- 检测置信度：${aiStore.imgPredict.predictionResult.confidence}

2. 请提供以下方面的专业分析：
(1) 病害危害程度：
1.当前病害的严重程度评估
2.对作物生长的影响
3.可能造成的产量损失

(2) 防治建议：
1.立即可采取的防治措施
2.推荐使用的农药或生物防治方法
3.施药注意事项和防护措施

(3) 预防措施：
1.日常管理建议
2.环境控制要点
3.预防性保护措施

请用专业但易懂的语言回答，并尽可能提供具体的操作建议。`;

		const response = await axios.post('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
			model: 'glm-4-flash',
			messages: [{
				role: 'user',
				content: prompt
			}],
			stream: false
		}, {
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			}
		});

		aiStore.imgPredict.aiSuggestion = response.data.choices[0].message.content;
		ElMessage.success('分析完成');
	} catch (error) {
		console.error('获取AI建议出错:', error);
		ElMessage.error('获取建议失败，请检查网络连接或API密钥是否正确');
	} finally {
		aiStore.imgPredict.suggestionLoading = false;
	}
};

// 格式化函数
const formatLabelArray = (label: any) => {
	if (Array.isArray(label)) {
		return label.map(item => item.replace(/[\[\]"]/g, '').trim());
	} else if (typeof label === 'string') {
		return [label.replace(/[\[\]"]/g, '').trim()];
	}
	return ['未知'];
};

const formatConfidenceArray = (confidence: string) => {
	if (!confidence) return ['0%'];
	try {
		let confidences = confidence;
		if (typeof confidence === 'string') {
			confidences = JSON.parse(confidence);
		}
		if (Array.isArray(confidences)) {
			return confidences.map(conf => {
				const confValue = parseFloat(String(conf).replace(/[\[\]"%]/g, ''));
				return confValue.toFixed(2) + '%';
			});
		} else {
			const confValue = parseFloat(String(confidence).replace(/[\[\]"%]/g, ''));
			return [confValue.toFixed(2) + '%'];
		}
	} catch (error) {
		console.error('解析置信度出错:', error);
		return ['0%'];
	}
};

const formatTime = (time: string) => {
	if (!time) return '0秒';
	return parseFloat(time).toFixed(3) + '秒';
};

onMounted(() => {
	getData();
});
</script>

<style scoped lang="scss">
/* ========================
   容器与基础布局
======================== */
.system-predict-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	background: transparent; /* 让全局 Mesh Gradient 透出来 */

	.system-predict-padding {
		padding: 15px;
		padding-bottom: 0;
		padding-top: 0;
		min-height: calc(100% - 60px);
	}
}

/* 工具栏头部 */
.header {
	width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 15px;
	margin-bottom: 1px;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(12px);
	padding: 12px 16px;
	border-radius: 12px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.6);
}

/* 核心指标摘要栏 */
.metrics-summary {
	margin-top: 15px;
	background: rgba(16, 185, 129, 0.05);
	border: 1px solid rgba(16, 185, 129, 0.15);
	border-radius: 12px;
	padding: 12px 24px;
	display: flex;
	align-items: center;
	gap: 30px;
	backdrop-filter: blur(8px);
	animation: slideDown 0.4s ease-out;

	.metric-item {
		display: flex;
		align-items: center;
		gap: 8px;
		
		i { font-size: 18px; color: #10B981; }
		.m-label { font-size: 13px; color: #64748b; font-weight: 500; }
		.m-value { font-size: 16px; color: #10B981; font-weight: 700; font-family: 'PingFang SC'; }
		
		&.secondary { margin-left: auto; }
	}

	.metric-divider {
		width: 1px;
		height: 20px;
		background: rgba(16, 185, 129, 0.2);
	}
}

@keyframes slideDown {
	from { opacity: 0; transform: translateY(-10px); }
	to { opacity: 1; transform: translateY(0); }
}

/* 图片展示区 */
.image-display {
	margin-top: 15px;

	.card {
		height: 100%;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.5);
		transition: all 0.25s ease;

		&:hover {
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
			transform: translateY(-1px);
		}

		.image-title {
			font-size: 14px;
			font-weight: 600;
			color: #1e293b;
			margin-bottom: 15px;
			padding-bottom: 10px;
			border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		}

		/* 上传区域 */
		.avatar-uploader {
			width: 100%;
			height: 358px;
			border: 2px dashed rgba(16, 185, 129, 0.3);
			border-radius: 10px;
			cursor: pointer;
			position: relative;
			overflow: hidden;
			transition: all 0.2s ease;
			display: flex;
			justify-content: center;
			align-items: center;

			&:hover {
				border-color: #10B981;
				background: rgba(16, 185, 129, 0.03);
			}
		}

		.preview-image {
			width: 100%;
			height: 358px;
			object-fit: contain;
		}

		/* 上传引导内容 */
		.uploader-content {
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			gap: 10px;
		}

		.upload-icon { font-size: 32px; color: #10B981; }
		.upload-text { color: #94a3b8; font-size: 14px; }

		/* 空状态占位符 */
		.placeholder {
			height: 358px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 12px;
			color: #94a3b8;
			font-size: 13px;

			.el-icon { font-size: 32px; }
		}

		/* AI 建议内容区 */
		.suggestion-content {
			height: 358px;
			overflow-y: auto;

			&::-webkit-scrollbar { width: 5px; }
			&::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 8px; }
		}
	}
}

/* ========================
   GLM AI 建议卡片专用样式
======================== */
.ai-suggestion-card {
	/* 卡片头部：GLM 品牌 + 状态标签 */
	.ai-card-header {
		display: flex !important;
		align-items: center;
		justify-content: space-between;
		flex-direction: row !important;
	}

	/* GLM 品牌徽章 */
	.ai-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		font-weight: 700;
		color: #1e293b;
		background: linear-gradient(90deg, rgba(16,185,129,0.1), rgba(59,130,246,0.05));
		padding: 3px 10px;
		border-radius: 100px;
		border: 1px solid rgba(16,185,129,0.2);
	}

	.ai-dot {
		width: 7px;
		height: 7px;
		background: #10B981;
		border-radius: 50%;
		animation: pulse-dot 2s infinite;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.6; transform: scale(0.75); }
	}

	/* AI 分析中加载态 */
	.ai-loading {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
	}

	.ai-loading-dots {
		display: flex;
		gap: 6px;

		span {
			width: 8px;
			height: 8px;
			background: #3B82F6;
			border-radius: 50%;
			animation: typingBounce 1.4s infinite ease-in-out both;

			&:nth-child(1) { animation-delay: -0.32s; }
			&:nth-child(2) { animation-delay: -0.16s; }
		}
	}

	@keyframes typingBounce {
		0%, 80%, 100% { transform: scale(0.5); opacity: 0.4; }
		40% { transform: scale(1); opacity: 1; }
	}

	.ai-loading-text {
		font-size: 13px;
		color: #64748b;
		margin: 0;
	}

	/* Markdown 渲染内容区 */
	.suggestion-markdown {
		font-size: 13px;
		line-height: 1.75;
		padding: 8px 4px;
		color: #334155;

		:deep(p) { margin-bottom: 8px; }
		:deep(p:last-child) { margin-bottom: 0; }

		:deep(h1), :deep(h2), :deep(h3) {
			font-weight: 700;
			color: #1e293b;
			margin: 12px 0 6px;
		}
		:deep(h1) { font-size: 1em; border-bottom: 2px solid rgba(16,185,129,0.3); padding-bottom: 3px; }
		:deep(h2) { font-size: 0.95em; }
		:deep(h3) { font-size: 0.9em; color: #10B981; }

		:deep(ul), :deep(ol) { padding-left: 18px; margin-bottom: 8px; }
		:deep(li) { margin-bottom: 4px; }
		:deep(ul > li::marker) { color: #10B981; }

		:deep(strong) {
			font-weight: 700;
			color: #0f172a;
		}

		:deep(code) {
			background: rgba(16,185,129,0.1);
			color: #059669;
			padding: 1px 5px;
			border-radius: 4px;
			font-size: 0.85em;
			font-family: ui-monospace, Menlo, Consolas, monospace;
		}

		:deep(blockquote) {
			border-left: 3px solid #10B981;
			background: rgba(16,185,129,0.05);
			padding: 8px 12px;
			margin: 8px 0;
			border-radius: 0 6px 6px 0;
			color: #475569;
		}

		:deep(table) {
			width: 100%;
			border-collapse: collapse;
			margin: 8px 0;
			font-size: 0.85em;
		}
		:deep(th) {
			background: linear-gradient(135deg, #10B981, #059669);
			color: white;
			padding: 7px 10px;
			text-align: left;
			font-weight: 600;
		}
		:deep(td) {
			padding: 6px 10px;
			border-bottom: 1px solid rgba(0,0,0,0.04);
			color: #475569;
		}
		:deep(tr:nth-child(even) td) { background: rgba(248,250,252,0.8); }
	}
}

/* ========================
   底部结果栏
======================== */
.result-section {
	margin-top: 10px;
	padding: 0;

	:deep(.el-card) {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		margin: 0;

		.el-card__body { padding: 0; }
	}

	.bottom {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 16px 24px;
		border-radius: 12px;
		min-height: 115px;
		max-height: 200px;
		overflow-y: auto;

		.result-column {
			flex: 1;
			padding: 0 16px;
			border-right: 1px solid rgba(0,0,0,0.06);

			&:last-child { border-right: none; }

			.result-title {
				font-size: 12px;
				color: #94a3b8;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.04em;
				margin-bottom: 10px;
			}

			.result-item {
				margin: 6px 0;

				.result-value {
					color: #10B981;
					font-weight: 600;
					font-size: 14px;
				}
			}
		}

		&.placeholder {
			color: #94a3b8;
			justify-content: center;
			align-items: center;

			.el-icon { margin-right: 8px; font-size: 16px; }
		}
	}
}

/* ========================
   预测按钮（翠绿品牌色）
======================== */
.predict-button {
	background: linear-gradient(135deg, #10B981, #059669) !important;
	border: none !important;
	border-radius: 8px !important;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35) !important;
	font-weight: 600;
	transition: all 0.2s ease !important;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45) !important;
	}
}

</style>