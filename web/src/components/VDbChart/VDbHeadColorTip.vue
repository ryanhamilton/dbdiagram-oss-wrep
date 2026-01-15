<template>
  
  <q-card-section style="padding: 8px 8px;">
    <div class="text-subtitle2">Colors</div>
    <div class="row">
      <div class="col-md-2">
        <div class="text-subtitle4">Default:</div>
      </div>
      <div class="col-md-2 offset-md-2">
        <div class="db-tooltip__colorblock db-tooltip__colorblock-default" :style="{'background': DEFAULT_COLOR, 'height':'1.4em', width: '1.4em', cursor: 'pointer'}" @click="setColor($event, null)" @touchend="setColor($event, null)"></div>
      </div>
      
    </div>
    <div class="q-pa-xs col">
     
      <div class="row" v-for="(row, rowIndex) of palette" :key="`row-${rowIndex}`" style="padding: 4px 6px;">
        <div v-for="cl of row" :key="cl" style="padding: 4px 6px;">
          <div class="db-tooltip__colorblock" :style="{'background': cl, 'height':'1.4em', width: '1.4em', cursor: 'pointer'}" @click="setColor($event, cl)" @touchend="setColor($event, cl)"></div>
        </div>
    
    </div>      
  
    </div>
  </q-card-section>
</template>

<script setup>

import {ref, onMounted, nextTick} from 'vue'

  const props = defineProps({
    table: Object,
    tableGroup: Object,
    refData: Object,
    isTableGroup: {
      type: Boolean,
      default: false
    },
    isRef: {
      type: Boolean,
      default: false
    }
  });

  const cp = ref(null);

  const emit = defineEmits([
    'click:color-block'
  ])

  const DEFAULT_COLOR = '#666';
  const palette = [['#1E69FD','#4B82B0','#121212','#24BAB1','#126E7A'],
              ['#2D6512','#79AD51','#E4A62E','#EB801B','#8F8DD8'],
              ['#990D0D','#CA4242','#DE65C3','#6724BB','#A15CF5']];
  
  const setColor = (e,color) => {
    if (props.isTableGroup && props.tableGroup) {
      emit('click:color-block',e, props.tableGroup.id, props.tableGroup.name, color, null, true, false)
    } else if (props.isRef && props.refData) {
      emit('click:color-block',e, props.refData.id, props.refData.name, color, null, false, true)
    } else if (props.table) {
      emit('click:color-block',e, props.table.id, props.table.name, color, props.table.schema.name, false, false)
    }
  };
  
  // Add native event listeners as a workaround for Vue event binding issues in dynamically rendered panels
  onMounted(async () => {
    await nextTick();
    const colorBlocks = document.querySelectorAll('.db-tooltip__colorblock');
    colorBlocks.forEach((block, index) => {
      block.addEventListener('click', (e) => {
        const color = index === 0 ? null : palette[Math.floor((index - 1) / 5)][(index - 1) % 5];
        setColor(e, color);
      });
    });
  });
  
</script>

