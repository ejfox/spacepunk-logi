<template>
  <main>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </main>
</template>
<script setup></script>
<style>
/* Use Monaspace Nerd Fonts for everything */
body {
  font-family: var(--font-ui);
  font-feature-settings: "liga" 1, "calt" 1;
  text-rendering: optimizeLegibility;
}

/* Override Courier New in brutalist components */
* {
  font-family: var(--font-ui) !important;
}

/* Mono font for code-like elements */
code,
pre,
.mono {
  font-family: var(--font-mono) !important;
}

/* Headers get the special Krypton treatment */
h1,
h2,
h3,
h4,
h5,
h6,
.header {
  font-family: var(--font-headers) !important;
}

/* Special elements get Xenon */
.special,
.glyph,
.icon-text {
  font-family: var(--font-special) !important;
}

/* Narrative content gets IBM Plex Sans */
.narrative,
.story,
.description,
.mission-description {
  font-family: var(--font-narrative) !important;
  font-size: 9px;
  line-height: 1.3;
  opacity: 0.85;
}

/* Even smaller narrative text */
.narrative-small,
.flavor-text,
.lore {
  font-family: var(--font-narrative) !important;
  font-size: 8px;
  line-height: 1.2;
  opacity: 0.7;
}
</style>
