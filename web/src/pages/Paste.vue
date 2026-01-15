<template>
  <q-page class="flex flex-center">
    <q-card class="paste-card">
      <q-card-section>
        <div class="text-h5 q-mb-md">Paste Database Code</div>
        <div class="text-subtitle2 text-grey-7 q-mb-md">
          Select your input format and paste your code below to generate a diagram
        </div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="selectedFormat"
          :options="formatOptions"
          label="Input Format"
          outlined
          class="q-mb-md"
          emit-value
          map-options
        />
        <q-input
          v-model="dbmlCode"
          type="textarea"
          outlined
          :placeholder="getPlaceholder()"
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEditorStore } from '../store/editor'

const router = useRouter()
const route = useRoute()
const editor = useEditorStore()
const dbmlCode = ref('')
const selectedFormat = ref('dbml')

const formatOptions = [
  { label: 'DBML', value: 'dbml' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgres' },
  { label: 'MSSQL', value: 'mssql' }
]

const validFormats = formatOptions.map(opt => opt.value)

const getPlaceholder = () => {
  const placeholders = {
    dbml: 'Paste your DBML code here...',
    mysql: 'Paste your MySQL code here...',
    postgres: 'Paste your PostgreSQL code here...',
    mssql: 'Paste your MSSQL code here...'
  }
  return placeholders[selectedFormat.value] || 'Paste your code here...'
}

const generateDiagram = () => {
  if (!dbmlCode.value.trim()) return
  
  // Update the editor store with the pasted code and format
  editor.updateSourceText(dbmlCode.value)
  // Update format separately to avoid overwriting markers
  editor.source.format = selectedFormat.value
  editor.updateDatabase()
  
  // Navigate to the editor page with a flag to auto-fit
  router.push({ 
    path: '/editor',
    query: { autofit: 'true' }
  })
}

// Check if format is specified in route query parameter
onMounted(() => {
  if (route.query.format) {
    const format = route.query.format
    if (validFormats.includes(format)) {
      selectedFormat.value = format
    }
  }
})
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
