# AI Assistant Guide for dbdiagram-oss-wrep

This guide helps AI assistants understand and work effectively with the dbdiagram-oss-wrep codebase.

## Repository Overview

**dbdiagram-oss-wrep** is an open-source alternative to dbdiagram.io - a database diagram visualization tool. It allows users to:
- Write database schemas in DBML (Database Markup Language)
- Visualize database relationships with interactive diagrams
- Export diagrams to various formats (SVG, PNG, JSON, SQL, DBML)
- Import from SQL (PostgreSQL)
- Store diagrams in S3-compatible repositories

This is a fork of TruDan/dbdiagram-oss with additional features like auto-layout, S3 integration, and enhanced UI capabilities.

## Tech Stack

### Frontend (web/)
- **Vue 3** - Progressive JavaScript framework (Composition API)
- **Quasar v2** - Vue.js framework for building responsive applications
- **Pinia** - State management (Vue 3 store)
- **Custom SVG rendering** - Direct SVG manipulation for rendering database relationships
- **@dbml/core** - DBML parser and SQL exporter
- **Ace Editor** - Code editor for DBML syntax
- **AWS SDK** - S3 integration for diagram storage

### Build Tools
- **Quasar CLI** - Build and dev server
- **Webpack** - Module bundler (via @quasar/app-webpack)
- **Babel** - JavaScript transpiler
- **ESLint** - JavaScript linter

## Project Structure

```
dbdiagram-oss-wrep/
├── .github/               # GitHub configuration
│   ├── workflows/        # CI/CD workflows (build, deploy)
│   └── media/           # Images and demos
├── api/                  # API placeholder (currently empty)
├── web/                  # Main frontend application
│   ├── public/          # Static assets
│   │   ├── icons/      # Application icons
│   │   └── mode-dbml*.js # Ace Editor DBML syntax mode
│   ├── src/
│   │   ├── assets/     # Images, fonts, etc.
│   │   ├── boot/       # Quasar boot files (app initialization)
│   │   ├── components/ # Vue components
│   │   │   ├── VDbChart/ # Diagram visualization components
│   │   │   ├── DbmlEditor.vue # Code editor component
│   │   │   └── VDbExportDialog.vue # Export dialog
│   │   ├── css/        # Global styles
│   │   ├── i18n/       # Internationalization
│   │   ├── layouts/    # Page layouts
│   │   ├── pages/      # Page components
│   │   │   └── Editor/ # Main editor page
│   │   ├── router/     # Vue Router configuration
│   │   ├── store/      # Pinia stores (state management)
│   │   │   ├── chart.js   # Diagram state (tables, refs, pan/zoom)
│   │   │   ├── editor.js  # Editor state (DBML source, parsing)
│   │   │   ├── files.js   # File management state
│   │   │   └── repo.js    # S3 repository state
│   │   ├── utils/      # Utility functions
│   │   └── App.vue     # Root component
│   ├── quasar.conf.js  # Quasar configuration
│   └── package.json    # Dependencies and scripts
└── README.md           # Main documentation
```

## Key Concepts

### DBML (Database Markup Language)
DBML is a simple, readable language for defining database structures. Users write DBML code in the left editor pane, which is parsed and rendered as a visual diagram on the right.

Example:
```dbml
Table users {
  id int [pk]
  username varchar
  email varchar
}

Table posts {
  id int [pk]
  user_id int [ref: > users.id]
  title varchar
}
```

### State Management (Pinia Stores)

#### chart.js Store
Manages the visual diagram state:
- `tables` - Table positions, sizes, and metadata
- `refs` - Relationship lines between tables
- `tableGroups` - Grouped tables
- `zoom`, `pan`, `ctm` - Viewport transformation
- `tooltip`, `panel` - UI overlays

#### editor.js Store
Manages the code editor and parsing:
- `source` - DBML source code and format
- `database` - Parsed database schema from @dbml/core
- `preferences` - Theme, dark mode, split ratio
- `parserError` - Syntax error information

#### files.js Store
Manages file operations:
- `currentFile` - Active file information
- File CRUD operations
- LocalStorage integration

#### repo.js Store
Manages S3 repository integration:
- `config` - S3 bucket configuration
- Repository file list and operations
- Sync with remote storage

### Component Architecture

#### VDbChart Components
The diagram visualization is split into specialized components:

- **VDbChart.vue** - Main diagram container, handles pan/zoom, SVG rendering
- **VDbTable.vue** - Individual table rendering with fields and header
- **VDbField.vue** - Table field/column display with icons and types
- **VDbRef.vue** - Relationship line between tables with control points
- **VDbTableGroup.vue** - Visual grouping of related tables
- **VDbTooltip.vue** - Tooltip wrapper for hover information
- **VDbTableTooltip.vue** - Table-specific tooltip content
- **VDbFieldTooltip.vue** - Field-specific tooltip with notes/defaults
- **VDbPanel.vue** - Contextual panel wrapper
- **VDbRefPanel.vue** - Panel for relationship controls
- **VDbRefActions.vue** - Actions for ref control points (add/delete)
- **VDbHeadColorTip.vue** - Color picker for table headers

#### Other Key Components
- **DbmlEditor.vue** - Ace Editor wrapper with DBML syntax highlighting
- **VDbExportDialog.vue** - Export dialog with format selection
- **Toolbar.vue** - Top toolbar with file/export actions

## Common Development Tasks

### Building and Running
```bash
cd web
yarn install          # Install dependencies
yarn dev             # Start dev server (hot reload)
yarn build           # Production build
yarn lint            # Lint code
```

### Adding a New Feature
1. Identify which store(s) manage the feature's state
2. Add state/actions/getters to the appropriate store
3. Create or modify components to use the store
4. Update the editor or chart components as needed
5. Test in dev mode with `yarn dev`

### Working with DBML
- Parser: `@dbml/core` package provides `Parser` class
- Import: `import { Parser } from '@dbml/core'`
- Usage: `const database = Parser.parse(dbmlString, 'dbml')`
- Export: `database.export('postgres')` for SQL export

### Working with Diagrams
- Positions are stored in chart store (`tables` object)
- Each table has `x`, `y`, `width`, `height` properties
- Refs (relationships) connect endpoints on tables
- Pan/zoom managed by CTM (Current Transformation Matrix)

## Build and Test Commands

### CI/CD Workflow
- **Build**: Runs on all branches via `.github/workflows/build.yaml`
- Steps: Install → Lint → Build → Upload artifacts
- Deploy: GitHub Pages via `.github/workflows/gh-pages.yaml`

### Local Testing
```bash
# In web/ directory
yarn lint          # Check code style
yarn build         # Test production build
yarn dev           # Manual testing in browser
```

Note: No automated tests currently exist (`test` script is a no-op)

## Code Style and Conventions

### Vue Components
- Use Composition API (`<script setup>`)
- Pinia stores imported with `use*Store()` pattern
- Props defined with `defineProps()`
- Emits defined with `defineEmits()`

### State Management
- Use Pinia stores for all shared state
- Actions for state mutations
- Getters for derived/computed state
- Store files in `src/store/`

### Naming Conventions
- Components: PascalCase (e.g., `VDbChart.vue`)
- Stores: camelCase files (e.g., `chart.js`)
- Store names: kebab-case strings (e.g., `"chart"`)
- Utilities: camelCase (e.g., `exportUtil.js`)

## Common Pitfalls

1. **CTM Updates**: Chart transformations require updating both `ctm` and `inverseCtm` for proper coordinate mapping
2. **Reactive State**: Use `markRaw()` for large objects like JointJS models to avoid unnecessary reactivity
3. **Touch Support**: Touch events are manually converted to mouse events for diagram interaction
4. **Parser Errors**: Wrap DBML parsing in try-catch to handle syntax errors gracefully
5. **S3 Config**: S3 repository features require proper CORS and bucket configuration

## Resources

- [Quasar Documentation](https://quasar.dev/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [DBML Documentation](https://www.dbml.org/)
- [JointJS Documentation](https://resources.jointjs.com/)

## Getting Help

- Check existing issues on GitHub
- Review demo videos in `.github/media/`
- Test on live demo: https://nomadrazor.github.io/dbdiagram-oss-wrep/ (fork) or https://trudan.github.io/dbdiagram-oss/ (original)
