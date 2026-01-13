<template>
  
    <q-card-section style="padding: 8px 8px;">
      <div class="text-subtitle2">Ref actions</div>
      <div class="row">
            <q-list dense class="db-tooltip_panel__list">
                <q-item clickable v-ripple @click.passive="act($event,'RESET')">
                    <q-item-section avatar>
                        <q-icon color="primary" name="refresh" />
                    </q-item-section>

                    <q-item-section>Reset waypoints</q-item-section>
                </q-item>
                <q-item clickable v-ripple @click.passive="act($event,'ADD')">
                    <q-item-section avatar>
                        <q-icon color="primary" name="add" />
                    </q-item-section>

                    <q-item-section>Add waypoint</q-item-section>
                </q-item>
                <q-item clickable v-ripple @click.passive="act($event,'DEL')">
                    <q-item-section avatar>
                        <q-icon color="primary" name="delete" />
                    </q-item-section>

                    <q-item-section>Remove waypoint</q-item-section>
                </q-item>
                <q-separator class="q-my-xs" />
                <q-item>
                    <q-item-section avatar>
                        <q-icon color="primary" name="palette" />
                    </q-item-section>
                    <q-item-section>
                      <div class="text-caption">Line Color</div>
                      <q-input 
                        v-model="color" 
                        :rules="['anyColor']"
                        dense
                        filled
                        class="q-mt-xs"
                      >
                        <template v-slot:append>
                          <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-color v-model="color" @change="updateColor" />
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </q-item-section>
                </q-item>
            </q-list>
      </div>      
    </q-card-section>
  </template>
  
  <script setup>
      import { ref, watch } from 'vue'
      import { useChartStore } from '../../store/chart'
      
    const props = defineProps({
      data: Object,
      wpid: Number, 
      click:Object
    });

    const store = useChartStore()
    const color = ref(store.getRefColor(props.data.id) || '#1976d2')
  
    function act(e,option) {
        console.log(e,option,props)
        emit('click:ref-cp',e,option,props.click,props.wpid,props.data.id)
    }

    function updateColor() {
      store.updateRefColor(props.data.id, color.value)
    }

    const emit = defineEmits([
      'click:ref-cp'
    ])
     
  </script>
  
  