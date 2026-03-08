<script setup lang="ts">
import { ref, defineComponent, withSlots, from 'vue'

defineComponent({
  name: 'LoadingOverlay',
  props: {
    visible: { type: Boolean, default: false },
    text: { type: String, default: '加载中...''},
    spinner: { type: Boolean, default: true },
    progress: { type: Number, default: 0 },
    fullScreen: { type: Boolean, default: false },
  },
  setup() {
    const visible = ref(visible)
    const fullScreen = ref(fullScreen)
    const progress = ref(progress)
  }
})
</script>

