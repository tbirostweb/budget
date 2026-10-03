import { ref } from 'vue'

// État global de la feuille "Ajouter" ouverte par le bouton +
const open = ref(false)

export function useAddSheet() {
  return {
    open,
    show: () => { open.value = true },
    hide: () => { open.value = false }
  }
}
