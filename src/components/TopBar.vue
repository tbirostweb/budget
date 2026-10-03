<script setup>
import { useFinance } from '../stores/finance'
import { useTheme } from '../composables/useTheme'
import { moneyPrecise } from '../utils/format'
import AppIcon from './AppIcon.vue'
import { useRouter } from 'vue-router'

const fin = useFinance()
const { theme, toggle } = useTheme()
const router = useRouter()
</script>

<template>
  <header class="topbar">
    <button class="icon-btn" @click="router.push('/settings')"><AppIcon name="menu" :size="20" /></button>
    <button class="networth" @click="router.push('/dashboard')">
      <div class="nw-amount">{{ moneyPrecise(fin.netWorth) }}</div>
      <div class="nw-sub">Solde courant</div>
    </button>
    <button class="icon-btn" @click="router.push('/stats')"><AppIcon name="stats" :size="20" /></button>
    <button class="icon-btn" @click="toggle">
      <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="20" />
    </button>
  </header>
</template>

<style scoped>
.topbar { display: flex; align-items: center; gap: 10px; padding: 16px 20px 10px; }
.icon-btn {
  width: 44px; height: 44px; border-radius: 50%; background: var(--surface-2);
  display: grid; place-items: center; color: var(--text); flex-shrink: 0;
}
.networth { flex: 1; text-align: center; background: var(--surface-2); border-radius: 999px; padding: 8px 16px; }
.nw-amount { font-size: 19px; font-weight: 800; }
.nw-sub { font-size: 11px; color: var(--text-dim); }
</style>
