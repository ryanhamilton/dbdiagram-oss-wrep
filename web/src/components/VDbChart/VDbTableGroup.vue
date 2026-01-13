<template>
  <svg
    ref="root"
    :id="`tablegroup-${id}`"
    :class="{
      'db-tablegroup':true,
      'db-tablegroup__highlight': highlight,
      'db-tablegroup__dragging': dragging
    }"
    :x="state.x"
    :y="state.y"
    :width="state.width"
    :height="state.height"
    @mouseenter.passive="onMouseEnter"
    @mouseleave.passive="onMouseLeave">

    <rect class="db-tablegroup__background"
          :width="state.width"
          :height="state.height"
          :fill="groupColor ? hexToRgba(groupColor, 0.1) : undefined"
          :stroke="groupColor || undefined"
    />
    <g class="db-tablegroup-header"
       @mousedown.passive="startDrag"
       v-touch-hold="showTooltip"
       v-on:touchend="hideTooltip"
       @mouseenter.passive="showTooltip"
       @mouseleave.passive="hideTooltip"
    >
      <rect
        height="30"
        :width="state.width"
        :fill="groupColor || undefined"
      />
      <text class="db-tablegroup-header__name"
            y="16"
      >
        {{ name }}
      </text>
      <title>{{ name }}</title>
      <g class="db-tablegroup-header__color-icon" v-show="palette_icon" @click.passive="onHeaderClick" @touchend.passive="onHeaderClick">
        <rect class="db-tablegroup-header__icon-bg" :fill="groupColor || 'var(--table-group-color)'" :x="state.width-25" y="0" height="30" width="20" />
        <svg class="db-tablegroup-header__icon" xmlns="http://www.w3.org/2000/svg" :x="state.width-25" y="5" height="20" viewBox="0 -960 960 960" width="20">
          <path  d="m247-904 57-56 343 343q23 23 23 57t-23 57L457-313q-23 23-57 23t-57-23L153-503q-23-23-23-57t23-57l190-191-96-96Zm153 153L209-560h382L400-751Zm360 471q-33 0-56.5-23.5T680-360q0-21 12.5-45t27.5-45q9-12 19-25t21-25q11 12 21 25t19 25q15 21 27.5 45t12.5 45q0 33-23.5 56.5T760-280ZM80 0v-160h800V0H80Z"/>
        </svg>
      </g>
      <line x1="0" y1="30" y2="30"
            :x2="state.width"
            class="db-tablegroup-header__separator"
      />
    </g>

  </svg>
</template>

<script setup>
  import { useChartStore } from '../../store/chart'
  import { useEditorStore } from '../../store/editor'
  import { computed, ref, watch, onMounted } from 'vue'
  import { snap } from '../../utils/MathUtil'
  import VDbHeadColorTip from './VDbHeadColorTip.vue'

  const props = defineProps({
    name: String,
    tables: Array,
    schema: Object,
    dbState: Object,
    id: Number,
    color: {
      type: String,
      default: () => ('')
    },
    containerRef: Object
  })

  const emit = defineEmits([
    'click:header'
  ])

  const store = useChartStore()
  const editor = useEditorStore()

  const state = computed(() => store.getTableGroup(props.id))
  const customGroupColor = computed(() => store.getTableGroupColor(props.id))
  const groupColor = computed(() => props.color || customGroupColor.value || '')
  
  const root = ref(null)
  const affectedTables = ref([])
  const highlight = ref(false)
  const palette_icon = ref(false)
  const dragging = ref(false)
  const dragOffset = { x: null, y: null }
  const gridSize = store.subGridSize
  const gridSnap = store.grid.snap

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    if (!hex) return undefined
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return undefined
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`
  }

  const updateSize = () => {
    const tableStates = props.tables.map(t => store.getTable(t.id));
    const minX = tableStates.reduce((prev, curr) => !prev ? curr.x : Math.min(prev, curr.x), 0);
    const maxX = tableStates.reduce((prev, curr) => !prev ? curr.x + curr.width : Math.max(prev, curr.x + curr.width), 0);
    const minY = tableStates.reduce((prev, curr) => !prev ? curr.y : Math.min(prev, curr.y), 0);
    const maxY = tableStates.reduce((prev, curr) => !prev ? curr.y + curr.height : Math.max(prev, curr.y + curr.height), 0);

    state.value.x = minX - 20;
    state.value.y = minY - 20 - 35;
    state.value.width = Math.abs(maxX-minX) + 40;
    state.value.height = Math.abs(maxY-minY) + 40 + 35;
  }

  watch(() => props.tables, value => {
    affectedTables.value = props.tables.map(t => store.getTable(t.id))
    updateSize()
  }, {
    deep: true
  })

  onMounted(() => {
    affectedTables.value = props.tables.map(t => store.getTable(t.id))
    updateSize()
  })

  watch(affectedTables, () => {
    updateSize()
  }, {
    deep: true
  })

  const onMouseEnter = (e) => {
    highlight.value = true
  }
  const onMouseLeave = (e) => {
    highlight.value = false
    dragging.value = false
  }

  const showTooltip = () => {
    palette_icon.value = true
  }

  const hideTooltip = () => {
    palette_icon.value = false
  }

  const showColorPanel = () => {
    const tooltipPosition = {
      x: state.value.x + state.value.width,
      y: state.value.y,
    }
    
    store.showPanel(tooltipPosition, VDbHeadColorTip, {
      tableGroup: props,
      isTableGroup: true
    })
  }

  const onHeaderClick = (e) => {
    showColorPanel()
    console.log('show panel', `table group color >${props.color}<`)
    emit('click:header', e, { id: props.id, name: props.name })
  }

  const drag = ({
    offsetX,
    offsetY
  }) => {
    const p = store.inverseCtm.transformPoint({
      x: offsetX,
      y: offsetY
    })
    const newX = snap(p.x - dragOffset.x, gridSnap)
    const newY = snap(p.y - dragOffset.y, gridSnap)

    const dX = newX - state.value.x;
    const dY = newY - state.value.y;

    for(const table of affectedTables.value) {
      table.x = table.x + dX;
      table.y = table.y + dY;
    }
  }
  const drop = (e) => {
    dragging.value = false
    highlight.value = false

    dragOffset.x = null
    dragOffset.y = null
    props.containerRef.removeEventListener('mousemove', drag, { passive: true })
    props.containerRef.removeEventListener('mouseup', drop, { passive: true })
    props.containerRef.removeEventListener('mouseleave', onMouseLeave, { passive: true })
  }
  const startDrag = ({
    offsetX,
    offsetY
  }) => {
    dragging.value = true

    const p = store.inverseCtm.transformPoint({
      x: offsetX,
      y: offsetY
    })
    dragOffset.x = p.x - state.value.x
    dragOffset.y = p.y - state.value.y

    props.containerRef.addEventListener('mousemove', drag, { passive: true })
    props.containerRef.addEventListener('mouseup', drop, { passive: true })
    props.containerRef.addEventListener('mouseleave', onMouseLeave, { passive: true })
  }
</script>
