<template>
  <div class="chat-container">
    <!-- 顶部 Header：智谱 GLM 品牌区 -->
    <div class="chat-header">
      <div class="flex items-center gap-3">
        <!-- GLM 品牌图标 -->
        <div class="glm-icon-wrap">
          <i class="iconfontjs icon-znwd text-white" style="font-size: 20px;"></i>
        </div>
        <div>
          <h3 class="chat-title">智谱 GLM 智能助研</h3>
          <p class="chat-subtitle">基于 GLM-4 · 农业科研专项智能体</p>
        </div>
      </div>
      <!-- 状态标签 -->
      <div class="status-badge">
        <span class="status-dot"></span>
        专家在线
      </div>
    </div>

    <!-- 消息区 -->
    <div class="chat-messages" ref="messageContainer">
      <div
        v-for="(message, index) in aiStore.smartChat.messages"
        :key="index"
        :class="['message', message.role === 'user' ? 'user-message' : 'assistant-message']"
      >
        <div class="message-content">
          <!-- 头像 -->
          <div :class="['avatar', message.role === 'user' ? 'user-avatar' : 'glm-avatar']">
            <i v-if="message.role === 'user'" class="iconfontjs icon-yh" style="font-size: 16px;"></i>
            <i v-else class="iconfontjs icon-znwd" style="font-size: 18px;"></i>
          </div>
          <!-- 消息气泡 -->
          <div class="bubble-wrapper">
            <!-- AI 消息来源标签 -->
            <span v-if="message.role === 'assistant'" class="message-label">智谱 GLM · 农事专家</span>
            <!-- 内容区 -->
            <div v-if="message.role === 'user'" class="text user-text">{{ message.content }}</div>
            <div v-else class="text assistant-text markdown-body" v-html="renderMarkdown(message.content)"></div>
          </div>
        </div>
      </div>

      <!-- 打字中动效 -->
      <div v-if="aiStore.smartChat.loading" class="message assistant-message">
        <div class="message-content">
          <div class="avatar glm-avatar">
            <i class="iconfontjs icon-znwd" style="font-size: 18px;"></i>
          </div>
          <div class="bubble-wrapper">
            <span class="message-label">智谱 GLM</span>
            <div class="text assistant-text">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 推荐问题快捷入口 -->
    <div class="suggested-questions" v-if="aiStore.smartChat.messages.length === 1 && !aiStore.smartChat.loading">
      <div class="suggested-title">
        <i class="iconfontjs icon-bingchonghai-1haichong" style="font-size: 14px; color: #10B981; margin-right:4px;"></i>
        猜你想问
      </div>
      <div class="suggested-list">
        <div
          v-for="(question, index) in suggestedQuestions"
          :key="index"
          class="suggested-item"
          @click="selectQuestion(question)"
        >
          {{ question }}
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="chat-input-area">
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="3"
        placeholder="向智谱 GLM 提问农业相关问题... (Ctrl+Enter 发送)"
        @keyup.ctrl.enter="sendMessage"
        class="chat-textarea"
      />
      <div class="input-actions" style="margin-top: 5px;">
        <span class="input-hint">{{ userInput.length }} 字</span>
        <el-button
          type="primary"
          :loading="aiStore.smartChat.loading"
          @click="sendMessage"
          :disabled="!userInput.trim()"
          class="send-btn"
        >
          <i class="iconfontjs icon-fasong" style="font-size: 14px; margin-right: 4px;"></i>
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="SmartChat">
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';
import MarkdownIt from 'markdown-it';
import { ElMessage } from 'element-plus';
import { useAIStore } from '/@/stores/aiStore';

const aiStore = useAIStore();
const messageContainer = ref<HTMLDivElement | null>(null);
const userInput = ref('');
const apiKey = '334ca8db8ede46d9bc1f73d58aa968fc.r9gdj8k3GW8u9CR4';

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true,
  html: false,
});

const renderMarkdown = (text: string) => md.render(text || '');

const suggestedQuestions = [
  '如何防治水稻纹枯病？',
  '玉米大斑病的症状与防治方法？',
  '小麦赤霉病发生规律是什么？',
  '如何科学施用农药减少残留？',
  '作物缺铁症状如何诊断？',
  '如何提高农作物的抗旱能力？',
];

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

const selectQuestion = (question: string) => {
  if (aiStore.smartChat.loading) return;
  userInput.value = question;
  sendMessage();
};

const sendMessage = async () => {
  if (!userInput.value.trim() || aiStore.smartChat.loading) return;

  const userMessage = userInput.value.trim();
  aiStore.smartChat.messages.push({ role: 'user', content: userMessage });
  userInput.value = '';
  aiStore.smartChat.loading = true;

  nextTick(() => scrollToBottom());

  try {
    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: 'glm-4-flash',
        messages: aiStore.smartChat.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    aiStore.smartChat.messages.push({
      role: 'assistant',
      content: response.data.choices[0].message.content
    });
  } catch (error) {
    ElMessage.error('发送失败，请检查网络');
    console.error('[GLM API Error]:', error);
  } finally {
    aiStore.smartChat.loading = false;
    nextTick(() => scrollToBottom());
  }
};

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped lang="scss">
.chat-container {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  font-family: system-ui, -apple-system, 'PingFang SC', sans-serif;
}

.chat-header {
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.glm-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.chat-title { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; }
.chat-subtitle { margin: 2px 0 0 0; font-size: 0.75rem; color: #94a3b8; }

.status-badge {
  display: flex; align-items: center; gap: 6px; padding: 4px 12px;
  background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 100px; font-size: 0.75rem; font-weight: 500; color: #10B981;
}

.status-dot {
  width: 6px; height: 6px; background: #10B981; border-radius: 50%;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.8); }
}

.chat-messages {
  flex: 1; overflow-y: auto; padding: 24px; scroll-behavior: smooth;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.12); border-radius: 8px; }
}

.message {
  margin-bottom: 20px; display: flex; opacity: 0; transform: translateY(12px);
  animation: messageAppear 0.3s ease forwards;
}

@keyframes messageAppear { to { opacity: 1; transform: translateY(0); } }

.message-content { display: flex; align-items: flex-start; max-width: 85%; gap: 10px; }
.user-message { justify-content: flex-end; .message-content { flex-direction: row-reverse; } }

.avatar {
  width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  &.user-avatar { background: linear-gradient(135deg, #10B981, #059669); color: white; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2); }
  &.glm-avatar { background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2); }
}

.bubble-wrapper { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.message-label { font-size: 0.7rem; color: #94a3b8; font-weight: 500; padding-left: 4px; }

.text {
  padding: 12px 16px; border-radius: 4px 12px 12px 12px; line-height: 1.7; font-size: 14px; word-break: break-word;
  &.user-text { background: #10B981; color: #fff; border-radius: 12px 4px 12px 12px; }
  &.assistant-text { background: #ffffff; color: #334155; border: 1px solid rgba(0, 0, 0, 0.05); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }
}

.typing-indicator {
  display: flex; align-items: center; gap: 5px; padding: 4px 0;
  span { width: 7px; height: 7px; background: #3B82F6; border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out both; }
  span:nth-child(1) { animation-delay: -0.32s; }
  span:nth-child(2) { animation-delay: -0.16s; }
}

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.5); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* 顶级 Markdown 渲染样式 */
.markdown-body {
  font-family: inherit; color: #334155;
  :deep(p) { margin-bottom: 10px; }
  :deep(h3) { 
    color: #10B981; font-size: 15px; margin: 15px 0 8px; font-weight: 700;
    display: flex; align-items: center;
    &::before { content: ''; width: 3px; height: 14px; background: #10B981; margin-right: 8px; border-radius: 4px; }
  }
  :deep(strong) { color: #0f172a; font-weight: 700; background: rgba(16, 185, 129, 0.05); padding: 0 2px; }
  :deep(ul) { padding-left: 18px; li { margin-bottom: 4px; &::marker { color: #10B981; } } }
  :deep(blockquote) { border-left: 3px solid #10B981; background: rgba(16, 185, 129, 0.03); padding: 8px 12px; margin: 12px 0; border-radius: 0 8px 8px 0; }
}

.suggested-questions { padding: 14px 24px; background: #fff; border-top: 1px solid rgba(0, 0, 0, 0.05); }
.suggested-title { font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }
.suggested-list { display: flex; flex-wrap: wrap; gap: 8px; }
.suggested-item {
  padding: 5px 12px; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 100px; font-size: 0.8rem; color: #10B981; cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba(16, 185, 129, 0.1); transform: translateY(-1px); }
}

.chat-input-area { padding: 16px 24px; background: #fff; border-top: 1px solid rgba(0, 0, 0, 0.05); }
.chat-textarea :deep(.el-textarea__inner) { border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; &:focus { border-color: #10B981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1); } }
.send-btn { background: #10B981 !important; border: none !important; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2) !important; &:hover { transform: translateY(-1px); } }
</style>