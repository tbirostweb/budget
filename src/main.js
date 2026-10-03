import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useFinance } from './stores/finance'
import { useAuth } from './stores/auth'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const fin = useFinance()
const auth = useAuth()

// À chaque changement : cache local (offline) + sync serveur si connecté
fin.$subscribe((_mutation, state) => {
  localStorage.setItem('finance-state-v2', JSON.stringify(state))
  if (auth.isAuthed) fin.scheduleSave()
})

app.mount('#app')
