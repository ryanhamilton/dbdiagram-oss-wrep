# Component Documentation

This document provides detailed information about the Vue components in the application.

## Component Organization

Components are organized into three main categories:

1. **Editor Components** - Code editing and toolbar
2. **Diagram Components** - Visual database diagram rendering
3. **Dialog Components** - Modal dialogs and overlays

## Editor Components

### DbmlEditor.vue
**Location**: `src/components/DbmlEditor.vue`

**Purpose**: Wrapper around Ace Editor for editing DBML code

**Key Features**:
- DBML syntax highlighting (custom mode)
- Auto-completion
- Error marker display
- Theme support (dracula, monokai, etc.)
- Line numbers
- Code folding

**Props**:
- `modelValue` (String): Source code content

**Emits**:
- `update:modelValue`: When code changes

**Store Dependencies**:
- `useEditorStore()`: For preferences (theme, dark mode)

**Usage**:
```vue
<dbml-editor 
  v-model:source="sourceText"
/>
```

**Technical Details**:
- Uses `vue3-ace-editor` wrapper
- Custom DBML mode in `public/mode-dbml.js`
- Debounced updates to prevent excessive parsing

---

### Toolbar.vue
**Location**: `src/pages/Editor/Toolbar.vue`

**Purpose**: Top toolbar with file and export actions

**Key Features**:
- File operations (New, Open, Save)
- Repository sync (S3 integration)
- Export menu (SVG, PNG, JSON, SQL, DBML)
- Settings access

**Props**: None

**Emits**:
- Various action events

**Store Dependencies**:
- `useFilesStore()`: File operations
- `useRepoStore()`: Repository sync
- `useEditorStore()`: Export source

**Actions**:
- New file: Creates empty diagram
- Open: Shows file picker
- Save: Saves to LocalStorage or S3
- Export: Opens export dialog
- Sync: Syncs with S3 repository

---

## Diagram Components

### VDbChart.vue
**Location**: `src/components/VDbChart/VDbChart.vue`

**Purpose**: Main diagram container with pan/zoom and SVG rendering

**Key Features**:
- Pan and zoom controls
- Grid rendering
- SVG viewport management
- Coordinate transformation (CTM)
- Mouse/touch event handling
- Tooltip and panel management

**Props**:
- `schema` (Object): Database schema from @dbml/core

**Store Dependencies**:
- `useChartStore()`: All diagram state
- `useEditorStore()`: For schema updates

**Key Methods**:
- `updateCtm()`: Updates transformation matrix
- `screenToWorld(x, y)`: Converts screen to diagram coordinates
- `worldToScreen(x, y)`: Converts diagram to screen coordinates
- `handleWheel()`: Zoom on mouse wheel
- `handlePan()`: Pan on drag

**Technical Details**:
- Uses SVG viewBox for zooming
- CTM stored as array [a, b, c, d, e, f]
- Inverse CTM calculated for coordinate mapping
- Touch events converted to mouse events

---

### VDbTable.vue
**Location**: `src/components/VDbChart/VDbTable.vue`

**Purpose**: Renders a single database table

**Key Features**:
- Table header with custom color
- Field list with icons
- Drag to reposition
- Resize (future)
- Hover effects
- Tooltip on hover

**Props**:
- `table` (Object): Table data from chart store
  - `id`, `name`, `x`, `y`, `width`, `height`
  - `fields`: Array of field objects
  - `color`: Header color (optional)

**Emits**:
- `update:position`: When table moved
- `show-tooltip`: On mouse enter
- `hide-tooltip`: On mouse leave

**Store Dependencies**:
- `useChartStore()`: To update position

**Structure**:
```
<g class="db-table">
  <rect class="table-header" fill="color"/>
  <text class="table-name">Name</text>
  <VDbField v-for="field" :field="field"/>
</g>
```

**Styling**:
- Default header color: #2196F3 (blue)
- Custom colors: Via table.color property
- Border: 2px solid with shadow
- Font: System font, 14px

---

### VDbField.vue
**Location**: `src/components/VDbChart/VDbField.vue`

**Purpose**: Renders a single field/column within a table

**Key Features**:
- Field name and type display
- Icons for constraints (PK, FK, NOT NULL)
- Enum tag display
- Hover tooltip with details
- Click to highlight

**Props**:
- `field` (Object): Field data
  - `name`, `type`, `pk`, `unique`, `not_null`
  - `note`, `default`, `enum`

**Emits**:
- `show-tooltip`: On mouse enter
- `hide-tooltip`: On mouse leave

**Icons**:
- 🔑 Primary Key (PK)
- 🔗 Foreign Key (FK)
- ⚠️ Not Null
- 📋 Enum type

**Structure**:
```
<g class="db-field">
  <circle class="field-icon" (if PK/FK)/>
  <text class="field-name">name</text>
  <text class="field-type">type</text>
  <text class="field-tag" (if enum)>ENUM</text>
</g>
```

---

### VDbRef.vue
**Location**: `src/components/VDbChart/VDbRef.vue`

**Purpose**: Renders relationship lines between tables

**Key Features**:
- Curved paths with control points
- Cardinality labels (1, *)
- Draggable control points
- Endpoint snapping to fields
- Hover highlight
- Context menu (add/delete points)

**Props**:
- `ref` (Object): Relationship data
  - `id`, `endpoints`, `type`
  - `controlPoints`: Array of {x, y}

**Emits**:
- `update:controlPoints`: When points moved
- `show-panel`: On right-click

**Relationship Types**:
- One-to-one: `1 — 1`
- One-to-many: `1 —< *`
- Many-to-one: `* >— 1`
- Many-to-many: `* >—< *`

**Technical Details**:
- SVG path with cubic bezier curves
- Control points stored in chart store
- Endpoints calculated from table/field positions
- Path recalculated on table move

**Structure**:
```
<g class="db-ref">
  <path class="ref-line" d="M...C..."/>
  <circle class="control-point" v-for="point"/>
  <text class="cardinality-label">1</text>
  <text class="cardinality-label">*</text>
</g>
```

---

### VDbTableGroup.vue
**Location**: `src/components/VDbChart/VDbTableGroup.vue`

**Purpose**: Visual grouping of related tables

**Key Features**:
- Rounded rectangle around tables
- Group label
- Custom color
- Drag to reposition group
- Auto-resize to fit tables

**Props**:
- `group` (Object): Group data
  - `id`, `name`, `tables`, `color`

**Emits**:
- `update:position`: When group moved

**Store Dependencies**:
- `useChartStore()`: To get table positions

**Technical Details**:
- Calculates bounding box of all tables in group
- Adds padding around tables
- Background color with transparency

---

## Tooltip Components

### VDbTooltip.vue
**Location**: `src/components/VDbChart/VDbTooltip.vue`

**Purpose**: Generic tooltip wrapper component

**Key Features**:
- Positioned absolutely
- Dynamic content via slots
- Auto-hide on mouse leave
- Z-index management

**Props**:
- `show` (Boolean): Visibility
- `x`, `y` (Number): Position
- `component` (Component): Content component
- `binds` (Object): Props for content component

**Usage**:
```vue
<v-db-tooltip
  :show="tooltip.show"
  :x="tooltip.x"
  :y="tooltip.y"
  :component="tooltip.component"
  :binds="tooltip.binds"
/>
```

---

### VDbTableTooltip.vue
**Location**: `src/components/VDbChart/VDbTableTooltip.vue`

**Purpose**: Tooltip content for table hover

**Props**:
- `table` (Object): Table data

**Displays**:
- Table name
- Field count
- Index information
- Notes (if any)

**Styling**:
- White background
- Drop shadow
- Rounded corners
- Max width: 300px

---

### VDbFieldTooltip.vue
**Location**: `src/components/VDbChart/VDbFieldTooltip.vue`

**Purpose**: Tooltip content for field hover

**Props**:
- `field` (Object): Field data

**Displays**:
- Field name and type
- Constraints (PK, FK, UNIQUE, NOT NULL)
- Default value
- Enum values (if enum type)
- Notes/comments

**Technical Details**:
- Formats enum values as comma-separated list
- Shows "No default" if no default value
- Wraps long notes

---

## Panel Components

### VDbPanel.vue
**Location**: `src/components/VDbChart/VDbPanel.vue`

**Purpose**: Generic panel wrapper for contextual actions

**Key Features**:
- Similar to tooltip but for interactive content
- Click outside to close
- Keyboard navigation (ESC to close)

**Props**:
- `show` (Boolean): Visibility
- `x`, `y` (Number): Position
- `component` (Component): Panel content
- `binds` (Object): Props for content

---

### VDbRefPanel.vue
**Location**: `src/components/VDbChart/VDbRefPanel.vue`

**Purpose**: Panel for relationship control point actions

**Props**:
- `ref` (Object): Relationship data
- `pointIndex` (Number): Which control point

**Actions**:
- Add control point
- Delete control point
- Reset control points

**Store Dependencies**:
- `useChartStore()`: To update ref

---

### VDbRefActions.vue
**Location**: `src/components/VDbChart/VDbRefActions.vue`

**Purpose**: Action buttons for ref control points

**Key Features**:
- Add point: Inserts new control point
- Delete point: Removes control point
- Reset: Removes all control points (straight line)

**Props**:
- `ref` (Object): Relationship data

**Emits**:
- `action`: Action type and data

---

### VDbHeadColorTip.vue
**Location**: `src/components/VDbChart/VDbHeadColorTip.vue`

**Purpose**: Color picker for table header colors

**Key Features**:
- Predefined color palette
- Custom color input
- Preview
- Apply/Cancel buttons

**Props**:
- `table` (Object): Table to colorize

**Store Dependencies**:
- `useChartStore()`: To update table color

**Color Palette**:
- Material Design colors
- 12 preset options
- Custom hex input

---

## Dialog Components

### VDbExportDialog.vue
**Location**: `src/components/VDbExportDialog.vue`

**Purpose**: Dialog for exporting diagrams in various formats

**Key Features**:
- Format selection (SVG, PNG, JSON, SQL, DBML)
- PNG resolution setting
- SQL dialect selection (PostgreSQL, MySQL, MSSQL)
- Preview (for some formats)
- Download button

**Props**:
- `show` (Boolean): Dialog visibility

**Emits**:
- `hide`: Close dialog
- `export`: Export with selected options

**Store Dependencies**:
- `useEditorStore()`: For source and schema
- `useChartStore()`: For diagram state

**Export Options**:

**SVG Export**:
- Vector format
- Preserves all styling
- Smallest file size

**PNG Export**:
- Raster format
- Resolution selector (1x, 2x, 3x, 4x)
- Larger file size

**JSON Export**:
- Complete diagram state
- Can be re-imported
- Includes positions and colors

**SQL Export**:
- Dialect: PostgreSQL, MySQL, MSSQL
- CREATE TABLE statements
- Foreign key constraints
- Indexes

**DBML Export**:
- Original DBML source
- Preserves all syntax

**Technical Details**:
- Uses `exportUtil.js` for export logic
- Creates download link programmatically
- Filename includes timestamp

---

## Component Communication Patterns

### Parent-Child Props
```vue
<!-- Parent -->
<template>
  <child-component :data="myData" />
</template>

<!-- Child -->
<script setup>
const props = defineProps({
  data: Object
})
</script>
```

### Child-Parent Events
```vue
<!-- Child -->
<script setup>
const emit = defineEmits(['update:value'])
emit('update:value', newValue)
</script>

<!-- Parent -->
<template>
  <child-component @update:value="handleUpdate" />
</template>
```

### Store-Based Communication
```vue
<script setup>
import { useChartStore } from 'src/store/chart'

const chartStore = useChartStore()

// Read state
const tables = chartStore.tables

// Call actions
chartStore.updateTable(id, data)
</script>
```

### Event Bus (Not Currently Used)
Consider using for global events if needed in future.

---

## Component Best Practices

### Performance
1. Use `markRaw()` for large, non-reactive objects (e.g., JointJS)
2. Debounce expensive operations (parsing, rendering)
3. Use `v-show` instead of `v-if` for frequently toggled elements
4. Lazy load heavy components

### Reactivity
1. Avoid mutating props directly
2. Use computed properties for derived state
3. Don't store derived state in data()
4. Use stores for shared state

### Styling
1. Use scoped styles in components
2. Follow existing naming conventions
3. Use CSS variables for themes
4. Avoid inline styles (use classes)

### Testing
1. Props should be typed and validated
2. Emits should be documented
3. Components should be pure (testable)
4. Avoid side effects in setup()

---

## Component Lifecycle

### Setup Phase
1. Props received from parent
2. Store instances created
3. Refs and reactive state initialized
4. Computed properties defined
5. Watchers registered

### Mount Phase
1. Component mounted to DOM
2. `onMounted()` hooks run
3. Event listeners attached
4. Initial render complete

### Update Phase
1. Reactive dependencies change
2. Component re-renders
3. Watchers trigger
4. Lifecycle hooks run

### Unmount Phase
1. `onBeforeUnmount()` hooks run
2. Event listeners removed
3. Component removed from DOM
4. `onUnmounted()` hooks run

---

## Adding New Components

### Step 1: Create Component File
```bash
# Create file in appropriate directory
touch src/components/MyNewComponent.vue
```

### Step 2: Define Component Structure
```vue
<template>
  <div class="my-component">
    <!-- Template -->
  </div>
</template>

<script setup>
// Imports
import { ref } from 'vue'

// Props
const props = defineProps({
  data: Object
})

// Emits
const emit = defineEmits(['action'])

// Local state
const localState = ref(null)

// Methods
function doSomething() {
  emit('action', localState.value)
}
</script>

<style scoped>
.my-component {
  /* Styles */
}
</style>
```

### Step 3: Register and Use
```vue
<script setup>
import MyNewComponent from 'components/MyNewComponent'
</script>

<template>
  <my-new-component 
    :data="myData"
    @action="handleAction"
  />
</template>
```

### Step 4: Test
1. View in dev server
2. Check props and events
3. Test reactivity
4. Verify styling

---

## Component Debugging

### Vue DevTools
1. Install browser extension
2. Inspect component hierarchy
3. View props and state
4. Monitor events

### Console Logging
```javascript
// In component
console.log('Props:', props)
console.log('Store:', chartStore.$state)
```

### Breakpoint Debugging
1. Open browser DevTools
2. Navigate to Sources tab
3. Set breakpoints in component code
4. Trigger component action

### Common Issues
- **Component not updating**: Check reactive dependencies
- **Props not received**: Verify prop names and parent data
- **Events not firing**: Check emit names and parent listeners
- **Styles not applied**: Check scoped vs. global styles
