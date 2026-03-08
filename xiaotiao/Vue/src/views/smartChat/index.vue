<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-left">
        <div class="glm-brand">
          <div class="glm-icon">
            <i class="iconfontjs icon-znwd"></i>
          </div>
          <div class="brand-info">
            <h1 class="brand-title">智谱 GLM 智能助研</h1>
            <p class="brand-subtitle">基于 GLM-4 · 农业科研专项智能体</p>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span class="status-text">专家在线</span>
        </div>
        <button class="clear-btn" @click="clearChat" title="清空对话">
          <i class="iconfontjs icon-shanchu"></i>
        </button>
      </div>
    </div>

    <div class="chat-messages" ref="messageContainer">
      <div
        v-for="(message, index) in aiStore.smartChat.messages"
        :key="index"
        :class="['message-wrapper', message.role]"
      >
        <div class="message-avatar" :class="message.role">
          <i v-if="message.role === 'user'" class="iconfontjs icon-yh"></i>
          <i v-else class="iconfontjs icon-znwd"></i>
        </div>
        
        <div class="message-bubble" :class="message.role">
          <div v-if="message.role === 'assistant'" class="message-sender">
            <span class="sender-name">智谱 GLM</span>
            <span class="sender-badge">农事专家</span>
          </div>
          <div v-if="message.role === 'user'" class="message-text user-text">
            {{ message.content }}
          </div>
          <div v-else class="message-text assistant-text">
            <div class="markdown-content" v-html="renderMarkdown(message.content)"></div>
          </div>
        </div>
      </div>

      <div v-if="aiStore.smartChat.loading" class="message-wrapper assistant">
        <div class="message-avatar assistant">
          <i class="iconfontjs icon-znwd"></i>
        </div>
        <div class="message-bubble assistant">
          <div class="message-sender">
            <span class="sender-name">智谱 GLM</span>
          </div>
          <div class="message-text assistant-text">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div 
      class="suggestions-section" 
      v-if="aiStore.smartChat.messages.length === 1 && !aiStore.smartChat.loading"
    >
      <div class="suggestions-header">
        <i class="iconfontjs icon-bingchonghai-1haichong"></i>
        <span>猜你想问</span>
      </div>
      <div class="suggestions-grid">
        <button
          v-for="(question, index) in suggestedQuestions"
          :key="index"
          class="suggestion-chip"
          @click="selectQuestion(question)"
        >
          {{ question }}
        </button>
      </div>
    </div>

    <div class="chat-input-area">
      <div class="input-wrapper">
        <textarea
          v-model="userInput"
          :placeholder="inputPlaceholder"
          :rows="3"
          class="chat-textarea"
          @keydown="handleKeydown"
        ></textarea>
        <div class="input-info">
          <span class="char-count">{{ userInput.length }} / 2000</span>
          <span class="shortcut-hint">Ctrl + Enter 发送</span>
        </div>
      </div>
      
      <button
        class="send-button"
        :class="{ 'send-button--active': userInput.trim() }"
        :disabled="!userInput.trim() || aiStore.smartChat.loading"
        @click="sendMessage"
      >
        <i class="iconfontjs icon-fasong"></i>
        <span>发送</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts" name="SmartChat">
import { ref, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import MarkdownIt from 'markdown-it'
import { ElMessage } from 'element-plus'
import { useAIStore } from '/@/stores/aiStore'

const aiStore = useAIStore()
const messageContainer = ref<HTMLDivElement | null>(null)
const userInput = ref('')
const apiKey = '334ca8db8ede46d9bc1f73d58aa968fc.r9gdj8k3GW8u9CR4'

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true,
  html: false,
})

const renderMarkdown = (text: string) => md.render(text || '')

const inputPlaceholder = '向智谱 GLM 提问农业相关问题...'

const suggestedQuestions = [
  '如何防治水稻纹枯病？',
  '玉米大斑病的症状与防治方法？',
  '小麦赤霉病发生规律是什么？',
  '如何科学施用农药减少残留？',
  '作物缺铁症状如何诊断？',
  '如何提高农作物的抗旱能力？',
  '温室大棚如何进行温湿度管理？',
]

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTo({
      top: messageContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

const selectQuestion = (question: string) => {
  if (aiStore.smartChat.loading) return
  userInput.value = question
  sendMessage()
}

const sendMessage = async () => {
  if (!userInput.value.trim() || aiStore.smartChat.loading) return

  const userMessage = userInput.value.trim()
  aiStore.smartChat.messages.push({ role: 'user', content: userMessage })
  userInput.value = ''
  aiStore.smartChat.loading = true

  nextTick(() => scrollToBottom())

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
    )
    aiStore.smartChat.messages.push({
      role: 'assistant',
      content: response.data.choices[0].message.content
    })
  } catch (error) {
    ElMessage.error('发送失败，请检查网络')
    console.error('[GLM API Error]:', error)
  } finally {
    aiStore.smartChat.loading = false
    nextTick(() => scrollToBottom())
  }
}

const clearChat = () => {
  aiStore.smartChat.messages = [{ role: 'assistant', content: '您好！我是智谱 GLM 农业智能助手，我可以帮您解答关于农作物病虫害、种植管理、农业技术等方面的问题。请问有什么可以帮助您的？' }]
  userInput.value = ''
  ElMessage.success('对话已清空')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    sendMessage()
  }
}

watch(() => aiStore.smartChat.messages.length, () => {
  nextTick(() => scrollToBottom())
})

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped lang="scss">
.chat-container {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  font-family: var(--font-sans);
}

/* Header */
.chat-header {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.glm-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.glm-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

  i {
    font-size: 20px;
    color: white;
  }
}

.brand-info {
  .brand-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-neutral-800);
  }

  .brand-subtitle {
    margin: 4px 0 0;
    font-size: 0.75rem;
    color: var(--color-neutral-400);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-primary-500);
}

.status-dot {
  width: 6px;
  height: 6px;
  background: var(--color-primary-500);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.8); }
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--color-neutral-100);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    font-size: 16px;
    color: var(--color-neutral-500);
  }

  &:hover {
    background: var(--color-error-light);
    
    i {
      color: var(--color-error);
    }
  }
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }
}

.message-wrapper {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  animation: messageSlide 0.3s ease-out;

  &.user {
    flex-direction: row-reverse;
  }

  &.assistant {
    animation: messageSlide 0.3s ease-out 0.1s both;
  }
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.user {
    background: linear-gradient(135deg, #10B981, #059669);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);

    i {
      font-size: 16px;
      color: white;
    }
  }

  &.assistant {
    background: linear-gradient(135deg, #3B82F6, #6366F1);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);

    i {
      font-size: 18px;
      color: white;
    }
  }
}

.message-bubble {
  max-width: 75%;
  min-width: 100px;

  &.user {
    background: linear-gradient(135deg, #10B981, #059669);
    border-radius: 16px 4px 16px 16px;
    box-shadow: 0 2px 12px rgba(16, 185, 129, 0.2);
  }

  &.assistant {
    background: white;
    border-radius: 4px 16px 16px 16px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }
}

.message-sender {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.sender-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-neutral-700);
}

.sender-badge {
  font-size: 0.65rem;
  padding: 2px 8px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1));
  color: var(--color-primary-500);
  border-radius: 100px;
  font-weight: 500;
}

.message-text {
  padding: 14px 18px;
  line-height: 1.7;
  font-size: 14px;
  word-break: break-word;

  &.user-text {
    color: white;
  }

  &.assistant-text {
    color: var(--color-neutral-700);
  }
}

.markdown-content {
  font-family: var(--font-sans);
  color: var(--color-neutral-700);

  :deep(p) {
    margin-bottom: 12px;
    line-height: 1.7;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(h3) {
    color: var(--color-primary-500);
    font-size: 15px;
    font-weight: 700;
    margin: 16px 0 10px;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      width: 3px;
      height: 14px;
      background: var(--color-primary-500);
      margin-right: 10px;
      border-radius: 4px;
    }
  }

  :deep(strong) {
    color: var(--color-neutral-900);
    font-weight: 600;
    background: rgba(16, 185, 129, 0.05);
    padding: 0 4px;
    border-radius: 4px;
  }

  :deep(ul), :deep(ol) {
    padding-left: 20px;
    margin-bottom: 12px;
  }

  :deep(li) {
    margin-bottom: 6px;
    line-height: 1.6;
  }

  :deep(ul > li::marker) {
    color: var(--color-primary-500);
  }

  :deep(blockquote) {
    border-left: 3px solid var(--color-primary-500);
    background: rgba(16, 185, 129, 0.03);
    padding: 12px 16px;
    margin: 12px 0;
    border-radius: 0 8px 8px 0;
    color: var(--color-neutral-600);
  }

  :deep(code) {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-primary-600);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.85em;
    font-family: var(--font-mono);
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 0.85em;
  }

  :deep(th) {
    background: linear-gradient(135deg, #10B981, #059669);
    color: white;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
  }

  :deep(td) {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    color: var(--color-neutral-600);
  }

  :deep(tr:nth-child(even) td) {
    background: rgba(248, 250, 252, 0.8);
  }
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 0;

  span {
    width: 8px;
    height: 8px;
    background: var(--color-secondary-500);
    border-radius: 50%;
    animation: typingBounce 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Suggestions */
.suggestions-section {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-neutral-400);

  i {
    font-size: 14px;
    color: var(--color-primary-500);
  }
}

.suggestions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-chip {
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 100px;
  font-size: 0.85rem;
  color: var(--color-primary-500);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(16, 185, 129, 0.1);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

/* Input Area */
.chat-input-area {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  position: relative;
}

.chat-textarea {
  width: 100%;
  padding: 14px 16px;
  padding-right: 120px;
  border: 1px solid var(--color-neutral-200);
  border-radius: 12px;
  background: var(--color-neutral-50);
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-neutral-800);
  resize: none;
  font-family: var(--font-sans);
  transition: all 0.2s ease;

  &::placeholder {
    color: var(--color-neutral-400);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    background: white;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
}

.input-info {
  position: absolute;
  right: 16px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--color-neutral-400);
}

.char-count {
  opacity: 0.7;
}

.shortcut-hint {
  opacity: 0.5;
}

.send-button {
  position: absolute;
  right: 16px;
  bottom: 50px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--color-neutral-200);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-neutral-400);
  cursor: not-allowed;
  transition: all 0.25s ease;

  &--active {
    background: linear-gradient(135deg, #10B981, #059669);
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  i {
    font-size: 14px;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 50px);
  }

  .chat-header {
    padding: 12px 16px;
  }

  .brand-title {
    font-size: 0.9rem;
  }

  .chat-messages {
    padding: 16px;
  }

  .chat-input-area {
    padding: 12px 16px;
  }

  .suggestions-section {
    padding: 12px 16px;
  }
}
</style>
