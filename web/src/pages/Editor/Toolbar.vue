<template>
  <div class="q-py-sm flex">
    <q-btn-dropdown split dense
                    no-caps
                    class="dbml-fileselector bg-secondary"
                    align="left"
                    @click="() => renameFile()"
                    anchor="bottom right" self="top right">

      <template #label>
        <span class="block q-mx-sm">
          {{ currentFile }}
        </span>
      </template>

      <q-list dense>
        <q-item v-for="file of fileItems" :key="file"
                clickable
                @click="() => loadFile(file)"
        >
          <q-item-section class="q-py-xs">
            <q-item-label>{{ file }}</q-item-label>
          </q-item-section>
          <q-item-section thumbnail>
            <q-btn
              icon="delete"
              size="sm"
              flat
              dense
              round
              @click.stop="() => confirmDeleteFile(file)"
            />
          </q-item-section>
        </q-item>
        <q-separator/>
        <q-item clickable
                dense
                @click="newFile"
        >
          <q-item-section>
            <q-item-label class="text-italic">Create New File</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <q-btn
      padding="sm"
      size="md"
      class="bg-secondary q-mx-xs"
      @click="saveFile"
    >
      <q-icon
        size="xs"
        name="save"/>
    </q-btn>

    <q-btn
      padding="sm"
      size="md"
      class="bg-secondary q-mx-xs"
      @click="instantPngDownload"
      aria-label="Download PNG"
    >
      <q-icon
        size="xs"
        name="image"/>
    </q-btn>

    <q-btn-dropdown
      padding="xs sm"
      size="md"
      color="secondary"
      class="q-mx-xs"
      
    >
      <template #label>
        <q-icon
          class="q-mr-sm"
          size="xs"
          name="file_download"/>
        Export
      </template>

      <q-list dense>
        <q-item v-for="exportOption of exportOptions"
                :key="exportOption.id"
                clickable
                @click="showExportDialog(exportOption.id,exportOption.ext)"
                dense
        >
          <q-item-section avatar>
            <q-icon :name="exportOption.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ exportOption.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <q-btn-dropdown
      padding="xs sm"
      size="md"
      color="secondary"
      class="q-mx-xs"
    >
      <template #label>
        <q-icon
          class="q-mr-sm"
          size="xs"
          name="file_upload"/>
        Import
      </template>
      <q-list dense>
        <q-item v-for="importOption of importOptions"
                :key="importOption.id"
                clickable
                @click="importFile(importOption.id,importOption.ext)"
                dense
        >
          <q-item-section avatar>
            <q-icon :name="importOption.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ importOption.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>

  <q-space/>

  <q-btn
    padding="sm"
    size="md"
    class="bg-secondary q-mx-xs"
    aria-label="Toggle relationship animation"
    @click.capture="relationshipAnimation = !relationshipAnimation">
    <q-icon
      class="q-mr-xs"
      size="xs"
      name="bolt"/>
    <q-toggle
      ref="animation_toggle"
      class="q-ml-sm no-pointer-events"
      size="sm"
      dense
      color="primary"
      :model-value="relationshipAnimation"
      :dark="dark">
    </q-toggle>
  </q-btn>
  <q-btn
    padding="sm"
    size="md"
    class="bg-secondary q-mx-xs"
    @click.capture="dark = !dark">
    <q-icon
      class="q-mr-xs"
      size="xs"
      name="dark_mode"/>
    <q-toggle
      ref="dark_toggle"
      class="q-ml-sm no-pointer-events"
      size="sm"
      dense
      color="primary"
      :model-value="dark"
      :dark="dark">
    </q-toggle>
  </q-btn>
  <q-btn
    padding="sm"
    size="md"
    class="bg-secondary q-mx-xs"
    style="touch-action: auto;"
    @click="showPreferencesDialog"
    
  >
    <q-icon
      size="xs"
      name="settings"
    />
  </q-btn>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useEditorStore } from 'src/store/editor'
  import { useQuasar } from 'quasar'
  import PreferencesDialog from '../../components/PreferencesDialog'
  import VDbExportDialog from '../../components/VDbExportDialog.vue'
  import { useFilesStore } from '../../store/files'
  import VDbImportDialog from '../../components/VDbImportDialog.vue'
  import { savePng } from '../../utils/exportUtil'

  const editor = useEditorStore()
  const files = useFilesStore()
  const $q = useQuasar()

  // Default PNG resolution for instant downloads
  const DEFAULT_PNG_RESOLUTION = 300

  const exportOptions = ref([
    {
      id: 'json',
      label: 'Json',
      ext:"json",
      icon: "code"
    },
    {
      id: 'svg',
      label: 'SVG',
      ext:"svg",
      icon: "image"
    },
    {
      id: 'png',
      label: 'PNG',
      ext:"png",
      icon: "image"
    },
    {
      id: 'dbml',
      label: 'DBML',
      ext:"dbml",
      icon: "description"
    },
    {
      id: 'pg',
      label: 'PostgreSQL',
      ext:"sql",
      icon: "storage"
    },
    {
      id: 'mssql',
      label: 'MSSQL',
      ext:"sql",
      icon: "storage"
    },
    {
      id: 'mysql',
      label: 'MySQL',
      ext:"sql",
      icon: "storage"
    }
  ])

  const importOptions = ref([
    {
      id: 'json',
      label: 'Json',
      ext:'json',
      icon: "code"
    },
    {
      id: 'dbml',
      label: 'DBML',
      ext: 'txt',
      icon: "description"
    },
    {
      id: 'postgres',
      label: 'PostgreSQL',
      ext:'sql',
      icon: "storage"
    },
    {
      id: 'mysql',
      label: 'MySQL',
      ext: 'sql',
      icon: "storage"
    },
    {
      id: 'mssql',
      label: 'MSSQL',
      ext: 'sql',
      icon: "storage"
    }
  ])

  const dark = computed({
    get: () => editor.getDark,
    set: (src) => editor.updateDark(src)
  })

  const relationshipAnimation = computed({
    get: () => editor.getRelationshipAnimation,
    set: (src) => editor.updateRelationshipAnimation(src)
  })

  const currentFile = computed({
    get: () => files.getCurrentFile,
    set: (file) => files.loadFile(file)
  })

  const fileItems = computed(() => files.getFiles)

  const deleteFile = (file) => files.deleteFile(file)
  const newFile = () => files.newFile()
  const saveFile = () => files.saveFile()
  const loadFile = (file) => files.loadFile(file)

  const confirmDeleteFile = (file) => {
    $q.dialog({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete the file '${file}'?`,
      cancel: true,
      persistent: true
    }).onOk(() => {
      console.log('delete confirmed', file)
      deleteFile(file)
    })
  }

  const renameFile = (file) => {
    if (file === undefined) {
      file = files.currentFile
    }
    $q.dialog({
      title: 'Rename file',
      message: 'Enter a new file name below.',
      prompt: {
        model: file,
        type: 'text'
      },
      cancel: true,
      persistent: false
    }).onOk(newFile => {
      console.log('rename to ', newFile)
      files.renameFile(newFile)
    })
  }

  const showPreferencesDialog = () => {
    $q.dialog({
      component: PreferencesDialog
    })
  }

  const showExportDialog = (id,ext) => {
    var cfn = files.getCurrentFile.split('/');
    var fn = cfn[cfn.length-1].split('.')[0] +'.'+ ext;
  console.log(cfn,id,ext);
    $q.dialog({
      component: VDbExportDialog,
      componentProps: {
        id:id,
        file_name: fn
      },
    })
  }

  const importFile = (id,ext) => {
      console.log(id)

      $q.dialog({
      component: VDbImportDialog,
      componentProps: {
        id:id,
        ext:ext
      },
    })

  }
  
  const generateTimestamp = () => {
    const now = new Date()
    return now.getFullYear().toString() + 
      (now.getMonth() + 1).toString().padStart(2, '0') + 
      now.getDate().toString().padStart(2, '0') + '-' +
      now.getHours().toString().padStart(2, '0') + 
      now.getMinutes().toString().padStart(2, '0') + 
      now.getSeconds().toString().padStart(2, '0')
  }

  const instantPngDownload = () => {
    const timestamp = generateTimestamp()
    const fileName = `db-diagram-${timestamp}.png`
    const resolution = ref(DEFAULT_PNG_RESOLUTION)
    
    savePng(fileName, resolution)
    
    $q.notify({
      caption: "Export",
      message: `PNG file ${fileName} successfully exported`,
      color: 'green',
      icon: 'task',
      position: 'bottom-right'
    })
  }
  
  
</script>

<style scoped>
  .dbml-fileselector {
    min-width: 15rem;
  }
</style>
