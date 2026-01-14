<template>
  <q-page class="flex flex-center">
    <q-card class="paste-card">
      <q-card-section>
        <div class="text-h5 q-mb-md">Paste DBML Code</div>
        <div class="text-subtitle2 text-grey-7 q-mb-md">
          Paste your DBML code below to generate a diagram
        </div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="dbmlCode"
          type="textarea"
          outlined
          placeholder="Paste your DBML code here..."
          :rows="15"
          class="dbml-textarea"
          autofocus
        />
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          color="primary"
          label="Generate Diagram"
          :disable="!dbmlCode.trim()"
          @click="generateDiagram"
          unelevated
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorStore } from '../store/editor'

const router = useRouter()
const editor = useEditorStore()
const dbmlCode = ref('')

const generateDiagram = () => {
  if (!dbmlCode.value.trim()) return
  
  // Update the editor store with the pasted DBML code
  editor.updateSourceText(dbmlCode.value)
  editor.updateDatabase()
  
  // Navigate to the editor page with a flag to auto-fit
  router.push({ 
    path: '/editor',
    query: { autofit: 'true' }
  })
}
</script>

<style scoped>
.paste-card {
  width: 100%;
  max-width: 800px;
  margin: 2rem;
}

.dbml-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
}
</style>
