<template>
  <q-layout view="hHh lpr lfr">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-toolbar-title shrink>
          <a href="https://www.timestored.com" target="_blank">
            <q-img  src="~assets/logoq.png"  style="width: 145px; height: 22px;" alt="DB Diagram OSS"  />
          </a>
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
