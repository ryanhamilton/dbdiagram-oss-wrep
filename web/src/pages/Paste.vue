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
import { useQuasar } from 'quasar'
import { useEditorStore } from '../store/editor'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
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
  // Update format while preserving other source properties
  editor.$patch((state) => {
    state.source.format = selectedFormat.value
  })
  const result = editor.updateDatabase()
  
  // Check if parsing was successful
  if (!result.success) {
    // Show error notification
    const error = result.error
    let errorMessage = 'Failed to parse the provided code. Please check your syntax.'
    
    // Try to extract detailed error information
    if (error) {
      // Handle new @dbml/core v5+ error structure with diags array
      const diag = error.diags && error.diags.length > 0 ? error.diags[0] : null
      if (diag && diag.location && diag.location.start) {
        errorMessage = `Parse error at line ${diag.location.start.line}, column ${diag.location.start.column}: ${diag.message || 'Invalid syntax'}`
      } else if (error.location && error.location.start) {
        // Fallback for old error structure (pre-v5)
        errorMessage = `Parse error at line ${error.location.start.line}, column ${error.location.start.column}: ${error.message || 'Invalid syntax'}`
      } else if (error.message) {
        errorMessage = error.message
      }
    }
    
    $q.notify({
      type: 'negative',
      message: errorMessage,
      caption: `Import ${selectedFormat.value.toUpperCase()} Failed`,
      position: 'bottom-right',
      timeout: 10000,
      multiLine: true
    })
    return
  }
  
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
