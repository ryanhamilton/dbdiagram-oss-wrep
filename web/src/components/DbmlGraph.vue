<template>
  <div class="dbml-graph-wrapper">
    <v-db-chart v-if="schema && chart.loaded"
                v-bind="schema"
                :startpan="startPan"
                @click="locateInEditor"
                @dblclick:table-group="locateInEditor"
                @dblclick:table="locateInEditor"
                @dblclick:field="locateInEditor"
                @dblclick:ref="locateInEditor"
     />

    <div class="dbml-structure-wrapper" v-if="false">
      <q-card class="shadow-6">
        <v-db-structure v-if="editor.database.schemas"
                        :database="editor.database"
        />
      </q-card>
    </div>

    <div class="dbml-toolbar-wrapper">
      <q-card class="shadow-6">
        <q-toolbar class="rounded-borders">
          <q-btn
            class="q-mr-xs"
            color="secondary"
            dense
            @click="applyAutoLayout"
            title="Auto-Layout"
          >
            <q-icon name="account_tree" />
          </q-btn>
          <q-btn
            class="q-mx-xs"
            color="secondary"
            dense
            @click="applyScaleToFit"
            title="Fit to Screen"
          >
            <q-icon name="fit_screen" />
          </q-btn>
          <q-btn
            class="q-mx-xs q-px-md"
            color="secondary"
            dense
            @click="toggleGridVisibility"
            :title="chart.grid.visible ? 'Hide Grid' : 'Show Grid'"
          >
            <q-icon :name="chart.grid.visible ? 'grid_on' : 'grid_off'" />
          </q-btn>
          <q-btn-dropdown
            class="q-mx-xs q-px-md"
            color="secondary"
            dense
            :label="detailLevelLabel"
          >
            <q-list>
              <q-item clickable v-close-popup @click="setDetailLevel('all_fields')">
                <q-item-section>
                  <q-item-label>All Fields</q-item-label>
                  <q-item-label caption>Show table names and all columns</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setDetailLevel('keys_only')">
                <q-item-section>
                  <q-item-label>Keys Only</q-item-label>
                  <q-item-label caption>Show table names with primary keys and foreign keys</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setDetailLevel('table_names')">
                <q-item-section>
                  <q-item-label>Table Names</q-item-label>
                  <q-item-label caption>Only show the table names</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-space/>

          <q-slider
            class="q-mx-sm"
            style="width: 25%; min-width: 100px; max-width: 200px;"
            v-model="scale"
            :min="minScale"
            :max="maxScale"
          />
          <div
            class="q-mx-sm non-selectable"
            style="width: 2.5rem; flex: 0 0 auto;">{{ Math.round(scale) }} %
          </div>

        </q-toolbar>
      </q-card>
    </div>
  </div>
</template>

<script setup>
  import { useEditorStore } from '../store/editor'
  import { computed, onMounted, ref, watch } from 'vue'
  import VDbChart from './VDbChart/VDbChart'
  import { useChartStore } from '../store/chart'
  import VDbStructure from './VDbStructure'
import { store } from 'quasar/wrappers'

  const props = defineProps({
    schema: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits([
    'update:positions',
  ])
  const editor = useEditorStore()
  const chart = useChartStore()
  const startPan = ref({
    pan: {
      x:0,
      y:0
    },
    diagram:{
      width:0,
      height:0
    }
  })

  const locateInEditor = (e, thing) => {
    console.log("locateInEditor", e, thing);
    if (thing) {
      const token = thing.token
      editor.updateSelectionMarker(token.start, token.end)
    }
    console.log
    chart.hideTooltip();
    if ((Date.now() - chart.panel.datetime) > 500) chart.hidePanel();
    if ((Date.now() - chart.panel.datetime) > 500) chart.hideRefPanel();
  }

  const scale = computed({
    get () {
      return (chart.zoom || 1) * 100.0
    },
    set (value) {
      chart.updateZoom(value / 100.0)
    }
  })

  const minScale = ref(10)
  const maxScale = ref(200)

  const applyAutoLayout = () => {
    const tbls = chart.getTables;
    const elements = Object.keys(tbls);
    const layout = [];
    
    // Build layout array
    for (let el of elements){
      layout.push(Object.values(tbls[el]));
    }
    
    // Arrange in a compact grid layout
    const numTables = layout.length;
    const cols = Math.ceil(Math.sqrt(numTables));
    const spacing = 50; // Spacing between tables
    
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0;
    let col = 0;
    
    // Position tables in a grid
    for (let index = 0; index < layout.length; index++){
      const table = layout[index];
      const width = table[2];
      const height = table[3];
      
      // Update position
      table[0] = currentX;
      table[1] = currentY;
      
      chart.updateTable(index + 1, {
        x: table[0], 
        y: table[1], 
        width: table[2], 
        height: table[3]
      });
      
      // Track row height
      rowHeight = Math.max(rowHeight, height);
      
      col++;
      
      // Move to next column or wrap to next row
      if (col >= cols) {
        currentX = 0;
        currentY += rowHeight + spacing;
        rowHeight = 0;
        col = 0;
      } else {
        currentX += width + spacing;
      }
    }
    
    // After layout, center the view on the diagram
    applyScaleToFit();
  }


  const getObjectPoints = (object) =>{
    return [
      [object[0],object[1]],
      [object[0]+object[2],object[1]],
      [object[0]+object[2],object[1]+object[3]],
      [object[0],object[1]+object[3]]];
  }

  const checkCrossPoints = (sp, dp) => {
      let cross_vector = [false,false,false,false];
      let cross_vector_state = [false,false,false,false];
      for (let i = 0; i < sp.length; i++) {
        cross_vector_state = [false,false,false,false];
        for (let j = 0; j < dp.length; j++) {
          if (j == 0){
              if(dp[j][0] <= sp[i][0] && dp[j][1] <= sp[i][1]){
                cross_vector_state[0] = true;
              } else {
                cross_vector_state[0] = false;
              }
          }
          if (j == 1){
              if(dp[j][0] >= sp[i][0] && dp[j][1] <= sp[i][1]){
                cross_vector_state[1] = true;
              }else {
                cross_vector_state[1] = false;
              }
          }
          if (j == 2){
              if(dp[j][0] >= sp[i][0] && dp[j][1] >= sp[i][1]){
                cross_vector_state[2] = true;
              } else {
                cross_vector_state[2] = false;
              }
          }
          if (j == 3){
              if(dp[j][0] <= sp[i][0] && dp[j][1] >= sp[i][1] ){
                cross_vector_state[3] = true;
              } else {
                cross_vector_state[3] = false;
              }
          }
        }
        
        cross_vector[i] = cross_vector_state[0] && cross_vector_state[1] && cross_vector_state[2] && cross_vector_state[3];
      }
      return cross_vector;
  }

  function getBounds(bounds, objects,isRef = false){
    for (let item in objects){
        if (objects[item].x < bounds.l) {
           bounds.l = objects[item].x
        }
        if (objects[item].y < bounds.t) {
          bounds.t = objects[item].y
        }
        if (!isRef){
          if (objects[item].x+objects[item].width > bounds.r) {
          bounds.r = objects[item].x+objects[item].width 
          }
          if (objects[item].y+objects[item].height > bounds.b) {
            bounds.b = objects[item].y+objects[item].height 
          }
        }
       
    }
    return bounds;
}

  const applyScaleToFit = () => {
    let bounds = getBounds({l:0, r:0, t:0, b:0},chart.getTables);
    let zoom = chart.getZoom;
    startPan.value = {
      pan: {
        x: zoom*((bounds.r+bounds.l)/2),
        y: zoom*((bounds.t+bounds.b)/2)
      },
      diagram:{
        width:0,
        height:0
      }
    }
    startPan.value = {
      pan:{
        x:startPan.value.pan.x,
        y:startPan.value.pan.y
      },
      diagram:{
        width:Math.abs(bounds.r)+Math.abs(bounds.l),
        height:Math.abs(bounds.t)+Math.abs(bounds.b)
      }
    
    }
    chart.updatePan(startPan.value)
    // do nothing
  }

  const detailLevelLabel = computed(() => {
    const level = chart.getDetailLevel;
    if (level === 'table_names') return 'Table Names';
    if (level === 'keys_only') return 'Keys Only';
    return 'All Fields';
  })

  const setDetailLevel = (level) => {
    chart.setDetailLevel(level);
  }

  const toggleGridVisibility = () => {
    chart.toggleGridVisibility();
  }

</script>

<style scoped lang="scss">
  .dbml-graph, .db-chart {
    height: 100% !important;
    width: 100% !important;
  }

  .dbml-graph-wrapper {
    height: 100% !important;
    width: 100% !important;
    position: relative;
  }

  .dbml-toolbar-wrapper {
    width: 600px;
    align-self: center;
    position: absolute;
    bottom: 1rem;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }

  .dbml-structure-wrapper {
    width: 400px;
    max-height: 300px;
    height: 300px;
    align-self: start;
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    margin-right: auto;

    > .q-card {
      max-height: 300px;
      overflow: auto;
    }
  }
</style>
