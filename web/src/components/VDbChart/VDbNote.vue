<template>
  <g
    ref="root"
    :class="{
      'db-note':true,
      'db-note__dragging': dragging
    }"
    @mouseenter.passive="onMouseEnter"
    @mouseleave.passive="onMouseLeave"
  >
    <rect 
      class="db-note__background"
      :x="state.x"
      :y="state.y"
      :width="state.width"
      :height="state.height"
      @mousedown="startDrag"
    />
    <text 
      class="db-note__title"
      :x="state.x + 10"
      :y="state.y + 20"
    >
      {{ name }}
    </text>
    <foreignObject
      :x="state.x + 10"
      :y="state.y + 35"
      :width="state.width - 20"
      :height="state.height - 45"
    >
      <div xmlns="http://www.w3.org/1999/xhtml" class="db-note__content">
        {{ content }}
      </div>
    </foreignObject>
  </g>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useChartStore } from '../../store/chart'
  import { snap } from '../../utils/MathUtil'

  const props = defineProps({
    id: String,
    name: String,
    content: String,
    containerRef: Object
  })

  const root = ref(null)
  const store = useChartStore()
  const dragging = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })

  const state = computed(() => store.getNote(props.id))

  const onMouseEnter = () => {
    // Can add hover effects if needed
  }

  const onMouseLeave = () => {
    // Can remove hover effects if needed
  }

  const startDrag = (e) => {
    dragging.value = true
    const svg = props.containerRef
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    
    dragOffset.value = {
      x: svgP.x - state.value.x,
      y: svgP.y - state.value.y
    }

    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  const onDrag = (e) => {
    if (!dragging.value) return
    
    const svg = props.containerRef
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    
    const newX = snap(svgP.x - dragOffset.value.x, store.grid.snap)
    const newY = snap(svgP.y - dragOffset.value.y, store.grid.snap)
    
    store.updateNote(props.id, {
      x: newX,
      y: newY
    })
  }

  const stopDrag = () => {
    dragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  onMounted(() => {
    // Ensure note state is initialized
    store.getNote(props.id)
  })
</script>

<style lang="scss" scoped>
  .db-note {
    cursor: move;
    
    &__background {
      fill: #ffd700; /* Yellow color for sticky note */
      stroke: #daa520;
      stroke-width: 2;
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
    }
    
    &__dragging .db-note__background {
      fill: #ffed4e;
      opacity: 0.8;
    }
    
    &__title {
      font-size: 14px;
      font-weight: bold;
      fill: #333;
      pointer-events: none;
    }
    
    &__content {
      font-size: 12px;
      color: #333;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-y: auto;
      pointer-events: none;
      font-family: monospace;
      line-height: 1.4;
    }
  }
</style>
