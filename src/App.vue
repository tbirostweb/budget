<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from './stores/auth'
import TopBar from './components/TopBar.vue'
import BottomNav from './components/BottomNav.vue'
import AddSheet from './components/AddSheet.vue'

const route = useRoute()
const auth = useAuth()
const showChrome = computed(() => auth.isAuthed && route.name !== 'login')
</script>

<template>
  <div class="app-shell">
    <TopBar v-if="showChrome" />
    <router-view v-slot="{ Component }">
      <component :is="Component" :key="route.path" class="route-view" />
    </router-view>
    <template v-if="showChrome">
      <BottomNav />
      <AddSheet />
    </template>
  </div>
</template>
