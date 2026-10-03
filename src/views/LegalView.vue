<script setup>
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
const router = useRouter()
</script>

<template>
  <div class="screen legal">
    <button class="back" @click="router.back()"><AppIcon name="chevron-left" :size="18" /> Retour</button>
    <h1>Mentions légales</h1>

    <section>
      <h2>Éditeur du site</h2>
      <p>
        Ce site est édité par <b>[Ton nom]</b>, particulier.<br />
        Contact : <a href="mailto:[ton-email]">[ton-email]</a>
      </p>
    </section>

    <section>
      <h2>Directeur de la publication</h2>
      <p>[Ton nom]</p>
    </section>

    <section>
      <h2>Hébergement</h2>
      <p>
        OVH SAS — 2 rue Kellermann, 59100 Roubaix, France.<br />
        Téléphone : 09 72 10 10 07 — <a href="https://www.ovhcloud.com" target="_blank" rel="noopener">ovhcloud.com</a>
      </p>
    </section>

    <section>
      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble de ce site (structure, code, contenus) est la propriété de son éditeur,
        sauf mentions contraires. Toute reproduction non autorisée est interdite.
      </p>
    </section>

    <section>
      <h2>Données personnelles</h2>
      <p>
        Le traitement de tes données est décrit dans la
        <router-link to="/confidentialite">politique de confidentialité</router-link>.
      </p>
    </section>
  </div>
</template>

<style scoped>
.legal { padding-top: 20px; max-width: 640px; margin: 0 auto; }
.back { display: inline-flex; align-items: center; gap: 4px; color: var(--text-dim); font-size: 14px; margin-bottom: 18px; }
h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
section { margin-top: 22px; }
h2 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
p { color: var(--text-dim); font-size: 15px; line-height: 1.6; }
a, :deep(a) { color: var(--teal); }
</style>
