<script setup>
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
const router = useRouter()
</script>

<template>
  <div class="screen legal">
    <button class="back" @click="router.back()"><AppIcon name="chevron-left" :size="18" /> Retour</button>
    <h1>Politique de confidentialité</h1>
    <p class="intro">Dernière mise à jour : août 2026</p>

    <section>
      <h2>Responsable du traitement</h2>
      <p>[Ton nom] — contact : <a href="mailto:[ton-email]">[ton-email]</a></p>
    </section>

    <section>
      <h2>Données collectées</h2>
      <ul>
        <li><b>Adresse email</b> : pour créer ton compte et t'envoyer le code de connexion.</li>
        <li><b>Données financières que tu saisis</b> : budgets, objectifs, dépenses, catégories — uniquement celles que tu entres toi-même.</li>
        <li><b>Données bancaires (optionnel)</b> : si tu connectes ta banque, l'agrégateur agréé nous transmet le solde et les transactions en lecture seule. <b>Tes identifiants bancaires ne transitent jamais par ce site.</b></li>
      </ul>
    </section>

    <section>
      <h2>Finalités</h2>
      <p>Authentification, sauvegarde et synchronisation de tes données entre tes appareils. Aucune revente, aucun profilage publicitaire.</p>
    </section>

    <section>
      <h2>Base légale</h2>
      <p>Ton consentement et l'exécution du service que tu demandes (article 6 du RGPD).</p>
    </section>

    <section>
      <h2>Hébergement &amp; localisation</h2>
      <p>Les données sont stockées sur un serveur OVH situé dans l'Union européenne.</p>
    </section>

    <section>
      <h2>Sous-traitants</h2>
      <ul>
        <li><b>OVH</b> — hébergement.</li>
        <li><b>Fournisseur d'email (SMTP)</b> — envoi du code de connexion.</li>
        <li><b>GoCardless Bank Account Data</b> — agrégation bancaire (uniquement si tu connectes une banque), prestataire agréé DSP2.</li>
      </ul>
    </section>

    <section>
      <h2>Durée de conservation</h2>
      <p>Tes données sont conservées tant que ton compte existe. Tu peux demander leur suppression à tout moment.</p>
    </section>

    <section>
      <h2>Cookies</h2>
      <p>Un seul cookie est utilisé : un cookie de <b>session strictement nécessaire</b> pour te garder connecté. Aucun cookie publicitaire ni traceur.</p>
    </section>

    <section>
      <h2>Tes droits</h2>
      <p>Accès, rectification, suppression, portabilité et opposition. Pour les exercer, écris à <a href="mailto:[ton-email]">[ton-email]</a>. Tu peux aussi saisir la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>).</p>
    </section>
  </div>
</template>

<style scoped>
.legal { padding-top: 20px; max-width: 640px; margin: 0 auto; }
.back { display: inline-flex; align-items: center; gap: 4px; color: var(--text-dim); font-size: 14px; margin-bottom: 18px; }
h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.intro { color: var(--text-faint); font-size: 13px; margin-bottom: 8px; }
section { margin-top: 22px; }
h2 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
p { color: var(--text-dim); font-size: 15px; line-height: 1.6; }
ul { color: var(--text-dim); font-size: 15px; line-height: 1.6; padding-left: 20px; }
li { margin-bottom: 8px; }
a, :deep(a) { color: var(--teal); }
</style>
