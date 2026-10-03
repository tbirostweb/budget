<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAddSheet } from '../composables/useAddSheet'
import AppIcon from './AppIcon.vue'

const router = useRouter()
const route = useRoute()
const addSheet = useAddSheet()

const items = [
  { name: 'calendar', icon: 'calendar' },
  { name: 'budget', icon: 'pie' },
  { name: 'add', icon: 'plus', center: true },
  { name: 'goals', icon: 'target' },
  { name: 'debt', icon: 'card' }
]

function go(item) {
  if (item.center) return addSheet.show()
  router.push('/' + item.name)
}
</script>

<template>
  <nav class="bottomnav">
    <button
      v-for="item in items" :key="item.name"
      class="nav-item"
      :class="{ center: item.center, active: route.name === item.name }"
      @click="go(item)"
    >
      <AppIcon :name="item.icon" :size="item.center ? 28 : 22" :stroke-width="item.center ? 2.4 : 2" />
    </button>
  </nav>
</template>

<style scoped>
.bottomnav {
  position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
  width: min(440px, calc(100% - 40px));
  display: flex; align-items: center; justify-content: space-around;
  background: color-mix(in srgb, var(--surface-2) 92%, transparent);
  backdrop-filter: blur(16px); border: 1px solid var(--border);
  border-radius: 999px; padding: 10px 16px; z-index: 50; box-shadow: var(--shadow);
}
.nav-item { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; color: var(--text-dim); }
.nav-item.active { color: var(--text); }
.nav-item.center {
  background: var(--teal); color: #04150f; width: 56px; height: 56px;
  box-shadow: 0 6px 20px rgba(20, 200, 160, 0.4);
}
</style>
