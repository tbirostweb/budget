<script setup>
import AppIcon from './AppIcon.vue'

const props = defineProps({
  open: Boolean,
  title: String
})
const emit = defineEmits(['close'])
</script>

<template>
  <teleport to="body">
    <transition name="sheet-fade">
      <div v-if="open" class="backdrop" @click="emit('close')"></div>
    </transition>
    <transition name="sheet-slide">
      <div v-if="open" class="sheet">
        <div class="sheet-head">
          <div class="grabber"></div>
          <div class="sheet-title-row">
            <h3>{{ title }}</h3>
            <button class="close" @click="emit('close')"><AppIcon name="x" :size="22" /></button>
          </div>
        </div>
        <div class="sheet-body">
          <slot />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.backdrop {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55);
  z-index: 100; backdrop-filter: blur(2px);
}
.sheet {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: min(480px, 100%); max-height: 90vh; overflow-y: auto;
  background: var(--surface); border-radius: 26px 26px 0 0;
  border: 1px solid var(--border); z-index: 101;
  padding: 10px 20px calc(28px + env(safe-area-inset-bottom));
}
.grabber { width: 40px; height: 4px; border-radius: 4px; background: var(--surface-3); margin: 4px auto 12px; }
.sheet-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
h3 { font-size: 20px; font-weight: 800; }
.close { width: 36px; height: 36px; border-radius: 50%; background: var(--surface-2); display: grid; place-items: center; color: var(--text-dim); }
</style>
