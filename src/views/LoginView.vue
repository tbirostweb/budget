<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import AppIcon from '../components/AppIcon.vue'

const auth = useAuth()
const router = useRouter()

const email = ref('')
const code = ref('')
const loading = ref(false)
const error = ref('')

async function sendCode() {
  error.value = ''
  loading.value = true
  try {
    await auth.requestCode(email.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function confirm() {
  error.value = ''
  loading.value = true
  try {
    await auth.verify(code.value)
    router.replace('/dashboard')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function back() {
  auth.step = 'email'
  code.value = ''
  error.value = ''
}
</script>

<template>
  <div class="login">
    <div class="brand">
      <div class="brand-badge"><AppIcon name="wallet" :size="30" /></div>
      <h1>Budget</h1>
      <p class="tagline">Gère ton argent, tes objectifs et ton budget au quotidien.</p>
    </div>

    <div class="card panel">
      <template v-if="auth.step === 'email'">
        <label class="fld">
          <span>Ton email</span>
          <input v-model="email" type="email" inputmode="email" placeholder="toi@email.fr"
                 @keyup.enter="sendCode" autofocus />
        </label>
        <button class="primary" :disabled="loading || !email" @click="sendCode">
          {{ loading ? 'Envoi…' : 'Recevoir mon code' }}
        </button>
        <p class="hint">On t'envoie un code à 6 chiffres par email. Pas de mot de passe.</p>
      </template>

      <template v-else>
        <p class="sent">Code envoyé à <b>{{ auth.email }}</b></p>
        <label class="fld">
          <span>Code à 6 chiffres</span>
          <input v-model="code" inputmode="numeric" maxlength="6" placeholder="••••••"
                 class="code-input" @keyup.enter="confirm" autofocus />
        </label>
        <button class="primary" :disabled="loading || code.length < 6" @click="confirm">
          {{ loading ? 'Vérification…' : 'Se connecter' }}
        </button>
        <button class="ghost" @click="back">← Changer d'email</button>
      </template>

      <p v-if="error" class="err">{{ error }}</p>
    </div>

    <footer class="legal-links">
      <router-link to="/legal">Mentions légales</router-link>
      <span>·</span>
      <router-link to="/confidentialite">Confidentialité</router-link>
    </footer>
  </div>
</template>

<style scoped>
.login { min-height: 80vh; display: flex; flex-direction: column; justify-content: center; padding: 0 24px; }
.brand { text-align: center; margin-bottom: 28px; }
.brand-badge { width: 64px; height: 64px; border-radius: 20px; background: var(--teal); color: #04150f; display: grid; place-items: center; margin: 0 auto 14px; }
h1 { font-size: 30px; font-weight: 800; }
.tagline { color: var(--text-dim); font-size: 14px; margin-top: 8px; line-height: 1.5; }

.panel { padding: 24px; }
.fld { display: block; margin-bottom: 16px; }
.fld > span { display: block; font-size: 13px; color: var(--text-dim); margin-bottom: 6px; font-weight: 600; }
.fld input { width: 100%; padding: 14px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); font-size: 16px; }
.code-input { text-align: center; font-size: 26px; letter-spacing: 10px; font-weight: 700; }
.legal-links { text-align: center; margin-top: 24px; font-size: 13px; color: var(--text-faint); display: flex; gap: 8px; justify-content: center; }
.legal-links a { color: var(--text-dim); text-decoration: none; }
.primary { width: 100%; padding: 15px; border-radius: 14px; background: var(--teal); color: #04150f; font-weight: 800; font-size: 16px; }
.primary:disabled { opacity: 0.5; }
.ghost { width: 100%; padding: 12px; margin-top: 10px; color: var(--text-dim); font-size: 14px; }
.hint { color: var(--text-faint); font-size: 12px; margin-top: 14px; text-align: center; }
.sent { text-align: center; color: var(--text-dim); font-size: 14px; margin-bottom: 18px; }
.err { color: var(--red); font-size: 13px; margin-top: 14px; text-align: center; }
</style>
