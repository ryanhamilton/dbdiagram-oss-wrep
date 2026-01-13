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
          <q-btn-dropdown
            class="q-mr-xs q-px-md"
            color="secondary"
            dense
            label="Auto-Layout"
          >
            <q-list>
              <q-item clickable v-close-popup @click="applyAutoLayout('left-to-right')">
                <q-item-section>
                  <q-item-label>Left-to-Right</q-item-label>
                  <q-item-label caption>Arrange tables from left to right based on their relationship direction. Ideal for diagrams with long relationship lineage like ETL pipelines.</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="applyAutoLayout('snowflake')">
                <q-item-section>
                  <q-item-label>Snowflake</q-item-label>
                  <q-item-label caption>Arrange tables in a snowflake shape, with the most connected tables in the center. Ideal for densely connected diagrams like data warehouses.</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="applyAutoLayout('compact')">
                <q-item-section>
                  <q-item-label>Compact Rectangle</q-item-label>
                  <q-item-label caption>Arrange tables in a compact rectangle layout. Ideal for diagrams with few relationships and tables.</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            class="q-mx-xs q-px-md"
            color="secondary"
            dense
            @click="applyScaleToFit">
            fit
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

  const applyAutoLayout = (algorithm = 'left-to-right') => {
    if (algorithm === 'left-to-right') {
      applyLeftToRightLayout();
    } else if (algorithm === 'snowflake') {
      applySnowflakeLayout();
    } else if (algorithm === 'compact') {
      applyCompactLayout();
    }
  }

  const applyLeftToRightLayout = () => {
    const tbls = chart.getTables;
    const refs = chart.getRefs();
    const elements = Object.keys(tbls);
    
    if (elements.length === 0) return;

    // Build a graph of relationships
    const graph = {};
    const inDegree = {};
    
    // Initialize graph nodes
    elements.forEach(id => {
      graph[id] = [];
      inDegree[id] = 0;
    });

    // Build adjacency list based on relationships
    Object.values(refs).forEach(ref => {
      if (ref.endpoints && ref.endpoints.length >= 2) {
        const fromTable = String(ref.endpoints[0]?.tableid);
        const toTable = String(ref.endpoints[1]?.tableid);
        if (fromTable && toTable && graph[fromTable] && graph[toTable]) {
          graph[fromTable].push(toTable);
          inDegree[toTable]++;
        }
      }
    });

    // Topological sort to determine left-to-right order
    const layers = [];
    const visited = new Set();
    const remaining = new Set(elements);

    while (remaining.size > 0) {
      const currentLayer = [];
      // Find all nodes with no incoming edges from unvisited nodes
      for (const id of remaining) {
        const hasUnvisitedPredecessor = Object.keys(graph).some(pred => 
          !visited.has(pred) && graph[pred].includes(id)
        );
        if (!hasUnvisitedPredecessor) {
          currentLayer.push(id);
        }
      }
      
      // If no nodes found, just take remaining nodes (cycle case)
      if (currentLayer.length === 0) {
        currentLayer.push(...Array.from(remaining));
      }
      
      currentLayer.forEach(id => {
        visited.add(id);
        remaining.delete(id);
      });
      
      layers.push(currentLayer);
    }

    // Position tables in layers
    const HORIZONTAL_SPACING = 400;
    const VERTICAL_SPACING = 150;
    const START_X = 0;
    const START_Y = 0;

    layers.forEach((layer, layerIndex) => {
      layer.forEach((tableId, indexInLayer) => {
        const table = tbls[tableId];
        const x = START_X + layerIndex * HORIZONTAL_SPACING;
        const y = START_Y + indexInLayer * VERTICAL_SPACING;
        chart.updateTable(parseInt(tableId), {
          x,
          y,
          width: table.width,
          height: table.height
        });
      });
    });
  }

  const applySnowflakeLayout = () => {
    const tbls = chart.getTables;
    const refs = chart.getRefs();
    const elements = Object.keys(tbls);
    
    if (elements.length === 0) return;

    // Count connections for each table
    const connectionCount = {};
    elements.forEach(id => {
      connectionCount[id] = 0;
    });

    Object.values(refs).forEach(ref => {
      if (ref.endpoints && ref.endpoints.length >= 2) {
        const fromTable = ref.endpoints[0]?.tableid;
        const toTable = ref.endpoints[1]?.tableid;
        if (fromTable && connectionCount[fromTable] !== undefined) {
          connectionCount[fromTable]++;
        }
        if (toTable && connectionCount[toTable] !== undefined) {
          connectionCount[toTable]++;
        }
      }
    });

    // Sort tables by connection count (create a copy to avoid mutation)
    const sortedTables = [...elements].sort((a, b) => 
      connectionCount[b] - connectionCount[a]
    );

    // Position tables in concentric circles
    const CENTER_X = 0;
    const CENTER_Y = 0;
    const RADIUS_INCREMENT = 300;
    const MIN_RADIUS = 200;

    // Place most connected table(s) in center
    const maxConnections = connectionCount[sortedTables[0]];
    const centerTables = sortedTables.filter(id => 
      connectionCount[id] === maxConnections
    );
    
    // Position center tables
    centerTables.forEach((tableId, index) => {
      const angle = (2 * Math.PI * index) / Math.max(centerTables.length, 1);
      const radius = centerTables.length > 1 ? MIN_RADIUS / 2 : 0;
      const table = tbls[tableId];
      chart.updateTable(parseInt(tableId), {
        x: CENTER_X + radius * Math.cos(angle),
        y: CENTER_Y + radius * Math.sin(angle),
        width: table.width,
        height: table.height
      });
    });

    // Position remaining tables in rings
    const remainingTables = sortedTables.slice(centerTables.length);
    const tablesPerRing = 6;
    
    remainingTables.forEach((tableId, index) => {
      const ringNumber = Math.floor(index / tablesPerRing) + 1;
      const positionInRing = index % tablesPerRing;
      const tablesInCurrentRing = Math.min(tablesPerRing, remainingTables.length - (ringNumber - 1) * tablesPerRing);
      
      const angle = (2 * Math.PI * positionInRing) / tablesInCurrentRing;
      const radius = MIN_RADIUS + ringNumber * RADIUS_INCREMENT;
      const table = tbls[tableId];
      
      chart.updateTable(parseInt(tableId), {
        x: CENTER_X + radius * Math.cos(angle),
        y: CENTER_Y + radius * Math.sin(angle),
        width: table.width,
        height: table.height
      });
    });
  }

  const applyCompactLayout = () => {
    const tbls = chart.getTables;
    const elements = Object.keys(tbls);
    
    if (elements.length === 0) return;

    // Calculate grid dimensions
    const tableCount = elements.length;
    const columns = Math.ceil(Math.sqrt(tableCount));
    const HORIZONTAL_SPACING = 300;
    const VERTICAL_SPACING = 200;
    const START_X = 0;
    const START_Y = 0;

    // Position tables in a grid
    elements.forEach((tableId, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const table = tbls[tableId];
      
      const x = START_X + col * HORIZONTAL_SPACING;
      const y = START_Y + row * VERTICAL_SPACING;
      
      chart.updateTable(parseInt(tableId), {
        x,
        y,
        width: table.width,
        height: table.height
      });
    });
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
