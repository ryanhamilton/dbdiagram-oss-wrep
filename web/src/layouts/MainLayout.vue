<template>
  <q-layout view="hHh lpr lfr">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-toolbar-title shrink>
          <q-img 
            src="~assets/company-logo.svg" 
            style="width: 145px; height: 22px;"
            alt="DB Diagram OSS"
          />
        </q-toolbar-title>
        <router-view name="toolbar"/>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script>

  import { defineComponent, ref } from 'vue'

  export default defineComponent({
    name: 'MainLayout',

    components: {},

    setup () {
      const leftDrawerOpen = ref(false)

      return {
        leftDrawerOpen,
        toggleLeftDrawer () {
          leftDrawerOpen.value = !leftDrawerOpen.value
        }
      }
    }
  })
</script>
