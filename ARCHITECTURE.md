# Architecture Documentation

This document describes the technical architecture of dbdiagram-oss-wrep.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│                    (Vue 3 + Quasar)                          │
├───────────────────┬─────────────────────────────────────────┤
│   Code Editor     │         Diagram Canvas                   │
│   (Ace Editor)    │         (SVG + JointJS)                 │
│   - DBML Syntax   │         - Tables & Fields               │
│   - Auto-complete │         - Relationships                 │
│   - Error marks   │         - Pan/Zoom                      │
└───────────────────┴─────────────────────────────────────────┘
            │                           │
            ▼                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  State Management (Pinia)                     │
├────────────────┬──────────────┬─────────────┬────────────────┤
│  editor.js     │  chart.js    │  files.js   │   repo.js      │
│  - Source code │  - Tables    │  - Files    │   - S3 config  │
│  - Parsed DB   │  - Refs      │  - Current  │   - Remote ops │
│  - Errors      │  - Viewport  │  - Storage  │                │
└────────────────┴──────────────┴─────────────┴────────────────┘
            │                           │
            ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│   @dbml/core         │    │   Storage Layer                   │
│   - DBML Parser      │    ├───────────────┬──────────────────┤
│   - SQL Export       │    │ LocalStorage  │  S3 Repository   │
│   - Schema Model     │    │ - Diagrams    │  - Remote files  │
└──────────────────────┘    │ - Settings    │  - Multi-folder  │
                             └───────────────┴──────────────────┘
```

## Frontend Architecture

### Technology Stack

#### Core Framework
- **Vue 3** (v3.2.31)
  - Composition API for component logic
  - Reactive state management
  - Virtual DOM rendering
  - Single File Components (.vue)

#### UI Framework
- **Quasar v2** (v2.6.2)
  - Material Design components
  - Responsive layout system
  - Build optimization
  - SPA/PWA support

#### State Management
- **Pinia** (v2.0.11)
  - Vue 3 official store
  - TypeScript support
  - DevTools integration
  - Modular stores

#### Diagram Library
- **JointJS** (via @clientIO/joint)
  - SVG-based diagrams
  - Interactive elements
  - Connection routing
  - Graph algorithms

#### Code Editor
- **Ace Editor** (v1.4.14)
  - Syntax highlighting (custom DBML mode)
  - Code completion
  - Error markers
  - Multiple themes

#### DBML Processing
- **@dbml/core** (v5.4.0)
  - DBML parsing
  - SQL export (PostgreSQL, MySQL, MSSQL)
  - SQL import (PostgreSQL)
  - Schema validation

### Component Architecture

#### Component Hierarchy

```
App.vue (Root)
└── MainLayout.vue
    ├── Toolbar.vue
    │   ├── File Actions (New, Open, Save)
    │   ├── Repository Actions (S3 sync)
    │   └── Export Actions (SVG, PNG, SQL, etc.)
    └── Editor/Index.vue (Split View)
        ├── DbmlEditor.vue (Left Pane)
        │   └── Ace Editor (DBML syntax)
        └── DbmlGraph.vue (Right Pane)
            └── VDbChart.vue (Diagram Container)
                ├── VDbTable.vue (for each table)
                │   ├── Table Header (with color)
                │   └── VDbField.vue (for each field)
                │       └── Icons (PK, FK, NOT NULL, etc.)
                ├── VDbRef.vue (for each relationship)
                │   └── Control Points (draggable)
                ├── VDbTableGroup.vue (for groups)
                ├── VDbTooltip.vue (overlay)
                │   ├── VDbTableTooltip.vue
                │   └── VDbFieldTooltip.vue
                └── VDbPanel.vue (overlay)
                    ├── VDbRefPanel.vue
                    └── VDbHeadColorTip.vue
```

#### Component Responsibilities

**Presentation Components**
- Render UI elements
- Emit events to parents
- Minimal business logic
- Reusable across contexts

**Container Components**
- Connect to Pinia stores
- Handle business logic
- Coordinate child components
- Manage local state

**Layout Components**
- Define page structure
- Handle routing
- Global UI elements

### State Management

#### Store Architecture

```javascript
// Store pattern (Pinia)
defineStore('storeName', {
  state: () => ({ /* reactive state */ }),
  getters: { /* computed properties */ },
  actions: { /* state mutations and async operations */ }
})
```

#### Store Details

##### chart.js - Diagram State
**State:**
- `tables`: Object mapping table IDs to table data
  - `id`, `name`, `x`, `y`, `width`, `height`
  - `fields`: Array of field objects
- `refs`: Object mapping ref IDs to relationship data
  - `endpoints`: Start and end table/field
  - `type`: Relationship type (one-to-one, one-to-many, etc.)
  - `controlPoints`: Array of draggable points
- `tableGroups`: Object mapping group IDs to group data
- `zoom`: Current zoom level (number)
- `pan`: Current pan position `{ x, y }`
- `ctm`: Current Transformation Matrix (for SVG)
- `inverseCtm`: Inverse CTM (for coordinate mapping)
- `tooltip`: Tooltip state `{ show, x, y, component, binds }`
- `panel`: Panel state (similar to tooltip)

**Actions:**
- `updateTable(id, data)`: Update table position/data
- `updateRef(id, data)`: Update relationship
- `setZoom(level)`: Set zoom level
- `setPan(x, y)`: Set pan position
- `showTooltip(data)`: Display tooltip
- `hideTooltip()`: Hide tooltip

##### editor.js - Editor State
**State:**
- `source`: DBML source code
  - `format`: 'dbml' | 'sql'
  - `text`: String content
  - `markers`: Selection and error positions
- `database`: Parsed database schema from @dbml/core
  - `schemas[0].tables`: Array of table objects
  - `schemas[0].refs`: Array of relationship objects
- `preferences`: User preferences
  - `dark`: Boolean (dark mode)
  - `theme`: String (editor theme)
  - `split`: Number (split ratio percentage)
- `parserError`: Current parsing error (if any)

**Actions:**
- `updateSource(text)`: Update source code and parse
- `parse()`: Parse DBML using @dbml/core
- `exportToSQL(dialect)`: Export to SQL format
- `importFromSQL(sql)`: Import SQL schema

**Getters:**
- `findField(fieldId)`: Find field by ID
- `findTable(tableId)`: Find table by ID

##### files.js - File Management
**State:**
- `currentFile`: Current file metadata
  - `id`, `name`, `content`, `lastModified`
- `fileList`: Array of available files
- `isDirty`: Boolean (unsaved changes)

**Actions:**
- `newFile()`: Create new file
- `openFile(id)`: Load file from storage
- `saveFile()`: Save current file
- `deleteFile(id)`: Delete file
- `loadFromStorage()`: Load file list from LocalStorage
- `saveToStorage()`: Save file to LocalStorage

##### repo.js - S3 Repository
**State:**
- `config`: S3 configuration
  - `accessKeyId`, `secretAccessKey`
  - `region`, `bucket`, `folder`
- `connected`: Boolean connection status
- `files`: Array of remote files
- `loading`: Boolean loading state

**Actions:**
- `configure(config)`: Set S3 credentials
- `connect()`: Test connection
- `listFiles()`: List remote files
- `uploadFile(name, content)`: Upload to S3
- `downloadFile(key)`: Download from S3
- `deleteFile(key)`: Delete from S3

### Data Flow

#### DBML Parsing Flow
```
User types in editor
    ↓
DbmlEditor emits 'update:source'
    ↓
Editor store updates source.text
    ↓
Debounced parse() action triggered
    ↓
@dbml/core Parser.parse(dbmlText)
    ↓
Success: Update database state → Chart store updates
Error: Update parserError state → Show error marker
    ↓
VDbChart reactively renders updated database
```

#### Diagram Interaction Flow
```
User drags table
    ↓
VDbTable emits position update
    ↓
Chart store updates table coordinates
    ↓
Refs connected to table recalculate
    ↓
VDbRef components re-render
```

#### File Save Flow
```
User clicks Save
    ↓
Files store saveFile() action
    ↓
Get source from editor store
    ↓
Save to LocalStorage (local) or S3 (remote)
    ↓
Update file metadata
    ↓
Set isDirty = false
```

## Key Algorithms

### Auto-Layout Algorithm
Located in chart store, arranges tables automatically:
1. Calculate table dimensions based on field count
2. Group related tables (by foreign keys)
3. Use force-directed layout algorithm
4. Apply grid snapping for alignment
5. Update table positions in store

### Relationship Routing
Located in VDbRef.vue:
1. Calculate start and end points on tables
2. Determine relationship type (arrows, cardinality)
3. Calculate control points for curved lines
4. Handle collision avoidance (future enhancement)
5. Render SVG path with proper styling

### Coordinate Transformation
Located in chart store:
1. Maintain Current Transformation Matrix (CTM)
2. Apply zoom: Scale CTM by zoom factor
3. Apply pan: Translate CTM by pan offset
4. Calculate inverse CTM for screen-to-world mapping
5. Convert mouse coordinates to diagram coordinates

### Export Algorithms

#### SVG Export (exportUtil.js)
1. Clone diagram SVG element
2. Remove interactive elements (tooltips, panels)
3. Apply inline styles (computed styles → style attributes)
4. Serialize to string
5. Create Blob and download link

#### PNG Export (exportUtil.js)
1. Generate SVG as above
2. Create off-screen canvas
3. Draw SVG to canvas via Image element
4. Scale by resolution multiplier
5. Convert canvas to PNG blob
6. Download

#### SQL Export (via @dbml/core)
1. Use database object from editor store
2. Call `database.export(dialect)`
3. Dialect: 'postgres', 'mysql', or 'mssql'
4. Returns formatted SQL string
5. Download as .sql file

## Build and Deployment

### Build Process

#### Development Build (`yarn dev`)
```
1. Quasar CLI reads quasar.conf.js
2. Webpack dev server starts
3. Hot Module Replacement (HMR) enabled
4. Source maps generated
5. Dev server on http://localhost:8080
```

#### Production Build (`yarn build`)
```
1. Quasar CLI reads quasar.conf.js (production mode)
2. Webpack bundles JavaScript
   - Minification
   - Tree shaking
   - Code splitting
3. PostCSS processes CSS
   - Autoprefixer
   - Minification
4. Assets copied to dist/spa/
5. Output optimized for deployment
```

### Webpack Configuration

Configured via `quasar.conf.js`:
- **Entry**: `src/index.template.html`
- **Output**: `dist/spa/`
- **Chunks**: Vendor (dependencies), App (application code)
- **Assets**: Public folder → dist
- **Optimizations**: 
  - Production: Minify, tree shake
  - Development: Source maps, HMR

### Deployment Targets

#### GitHub Pages (SPA)
- Build with `yarn build`
- Deploy `dist/spa/` to gh-pages branch
- Served as static site
- Routing via hash mode

#### Docker (see web/Dockerfile)
- Multi-stage build
- Node image for building
- Nginx image for serving
- S3 support via environment variables

#### PWA (Progressive Web App)
- Build with `yarn build:pwa`
- Service worker for offline support
- App manifest for install prompt
- Cache strategies for assets

## Performance Considerations

### Rendering Optimization
- **markRaw()**: Used for JointJS models to prevent Vue reactivity overhead
- **Virtual scrolling**: Not currently implemented (future enhancement)
- **Lazy loading**: Components loaded on demand
- **Debounced parsing**: DBML parsing throttled to reduce CPU usage

### Memory Management
- **Store cleanup**: Old diagram state cleared on file switch
- **Event listeners**: Properly removed on component unmount
- **SVG optimization**: Minimize DOM nodes in diagram

### Bundle Optimization
- **Code splitting**: Vendor chunks separated
- **Tree shaking**: Unused code eliminated
- **Lazy routes**: Pages loaded on navigation
- **Asset optimization**: Images/icons optimized

## Security Considerations

### S3 Integration
- Credentials stored in browser memory only (not persisted by default)
- CORS required on S3 bucket for browser access
- Signed requests via AWS SDK
- No server-side proxy (direct browser-to-S3)

### XSS Prevention
- Vue 3 automatic escaping in templates
- No `v-html` with user content
- Ace Editor sandboxed

### Data Privacy
- All data stored locally (LocalStorage) or user's S3
- No analytics or tracking
- No external API calls (except S3)

## Testing Strategy

### Current State
- No automated tests currently implemented
- Manual testing via dev server
- Build verification in CI/CD

### Recommended Testing (Future)
- **Unit Tests**: Vitest or Jest for stores and utilities
- **Component Tests**: Vue Test Utils for component logic
- **E2E Tests**: Playwright or Cypress for user workflows
- **Visual Regression**: Capture diagram screenshots

## Browser Compatibility

Configured in `package.json` browserslist:
- Chrome: Last 10 versions
- Firefox: Last 10 versions
- Edge: Last 4 versions
- Safari: Last 7 versions
- Mobile: Last 8 versions (Android, iOS)

### Known Limitations
- Touch support: Manual event conversion (touchstart → mousedown)
- SVG export: May vary slightly across browsers
- LocalStorage: 5-10MB limit (browser-dependent)

## Future Architecture Improvements

### Planned Enhancements
1. **Backend API**: RESTful API for server-side storage
2. **Real-time collaboration**: WebSocket-based multi-user editing
3. **Plugin system**: Extensible architecture for custom features
4. **Advanced routing**: Smart edge routing algorithm
5. **Undo/redo**: Command pattern for state history
6. **Testing**: Comprehensive test suite
7. **TypeScript migration**: Gradual migration from JavaScript

### Scalability Considerations
- Large diagrams (100+ tables): Consider canvas rendering instead of SVG
- Complex relationships: Optimize ref calculation and rendering
- File management: Implement pagination for file lists
- S3 operations: Add request queuing and retry logic
