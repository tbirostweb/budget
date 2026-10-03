import { defineStore } from 'pinia'
import { api } from '../services/api'
import { useFinance } from './finance'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    ready: false,   // session vérifiée au démarrage
    step: 'email',  // 'email' | 'code'
    email: ''
  }),

  getters: {
    isAuthed: (s) => !!s.user
  },

  actions: {
    async checkSession() {
      try {
        const { user } = await api.me()
        this.user = user
        await useFinance().loadFromServer()
      } catch {
        this.user = null
      } finally {
        this.ready = true
      }
    },

    async requestCode(email) {
      await api.requestCode(email)
      this.email = email
      this.step = 'code'
    },

    async verify(code) {
      const { user } = await api.verify(this.email, code)
      this.user = user
      this.step = 'email'
      await useFinance().loadFromServer()
    },

    async logout() {
      await api.logout().catch(() => {})
      this.user = null
      this.step = 'email'
      this.email = ''
    }
  }
})
