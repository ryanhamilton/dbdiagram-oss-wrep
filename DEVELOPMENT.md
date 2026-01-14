# Development Guide

This guide covers the development setup and workflow for dbdiagram-oss-wrep.

## Prerequisites

### Required Software
- **Node.js**: >= 18.0.0
- **npm**: >= 6.13.4
- **Yarn**: >= 1.21.1 (recommended package manager)

### Recommended Tools
- Modern code editor (VS Code, WebStorm, etc.)
- Git for version control
- Browser with Vue DevTools extension

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ryanhamilton/dbdiagram-oss-wrep.git
cd dbdiagram-oss-wrep
```

### 2. Install Dependencies
```bash
cd web
yarn install
```

This will install all required dependencies including:
- Vue 3 and Quasar framework
- Pinia for state management
- @dbml/core for DBML parsing
- Ace Editor for code editing
- JointJS for diagram rendering
- AWS SDK for S3 integration

### 3. Start Development Server
```bash
yarn dev
```

This starts the Quasar dev server with:
- Hot module replacement (HMR)
- Automatic browser refresh
- Error reporting in browser
- Source maps for debugging

The application will be available at `http://localhost:8080` (or another port if 8080 is in use).

## Development Commands

All commands should be run from the `web/` directory:

### Running the Application
```bash
yarn dev              # Start development server (hot reload)
```

### Building
```bash
yarn build            # Production build (outputs to dist/spa)
yarn build:pwa        # Build as Progressive Web App
```

### Code Quality
```bash
yarn lint             # Run ESLint to check code style
yarn lint --fix       # Auto-fix linting issues
```

### Testing
```bash
yarn test             # Currently a no-op (no tests configured)
```

### Deployment
```bash
yarn deploy           # Deploy to GitHub Pages (requires permissions)
```

## Project Structure

### Main Application Code (`web/src/`)

#### Components (`components/`)
- **DbmlEditor.vue** - Code editor component using Ace Editor
- **VDbExportDialog.vue** - Export dialog for various formats
- **VDbChart/** - Diagram visualization components
  - `VDbChart.vue` - Main chart container with pan/zoom
  - `VDbTable.vue` - Table visualization
  - `VDbField.vue` - Field/column display
  - `VDbRef.vue` - Relationship lines
  - `VDbTableGroup.vue` - Table grouping
  - Tooltip and panel components

#### State Management (`store/`)
- **chart.js** - Diagram state (tables, refs, zoom, pan)
- **editor.js** - Editor state (source code, parsed database)
- **files.js** - File management (current file, CRUD operations)
- **repo.js** - S3 repository integration

#### Pages (`pages/`)
- **Editor/Index.vue** - Main editor page with split view
- **Editor/Toolbar.vue** - Top toolbar with actions
- **Index.vue** - Landing page
- **Error404.vue** - 404 error page

#### Utilities (`utils/`)
- **exportUtil.js** - Export functionality (SVG, PNG, JSON, SQL, DBML)
- **storageUtils.js** - LocalStorage helpers
- **MathUtil.js** - Math utilities for diagram calculations

### Configuration Files

- **quasar.conf.js** - Quasar framework configuration
- **babel.config.js** - Babel transpiler config
- **.eslintrc.js** - ESLint rules
- **package.json** - Dependencies and scripts

## Development Workflow

### 1. Making Changes

#### Adding a New Component
```bash
# Create component file
touch src/components/MyNewComponent.vue

# Import and use in parent component
<script setup>
import MyNewComponent from 'components/MyNewComponent'
</script>

<template>
  <my-new-component />
</template>
```

#### Adding Store State
```javascript
// In src/store/mystore.js
import { defineStore } from 'pinia'

export const useMyStore = defineStore('mystore', {
  state: () => ({
    myData: null
  }),
  getters: {
    getMyData: (state) => state.myData
  },
  actions: {
    setMyData(data) {
      this.myData = data
    }
  }
})
```

#### Using a Store in Components
```javascript
<script setup>
import { useMyStore } from 'src/store/mystore'

const myStore = useMyStore()

// Access state
console.log(myStore.myData)

// Call actions
myStore.setMyData({ key: 'value' })
</script>
```

### 2. Testing Changes

1. **Start dev server**: `yarn dev`
2. **Open browser**: Navigate to `http://localhost:8080`
3. **Test functionality**: Interact with your changes
4. **Check console**: Look for errors in browser console
5. **Use Vue DevTools**: Inspect component state and props

### 3. Code Quality

#### Before Committing
```bash
# Check for linting errors
yarn lint

# Fix auto-fixable issues
yarn lint --fix

# Build to ensure no build errors
yarn build
```

#### ESLint Configuration
The project follows:
- Standard JavaScript style guide
- Vue-specific ESLint rules
- Import/export linting
- Promise best practices

### 4. Building for Production

```bash
# Full production build
yarn build

# Output location: dist/spa/
# Test the build locally with a static server
npx serve dist/spa
```

## Common Development Tasks

### Adding S3 Repository Support
1. Configure S3 bucket with CORS
2. Update store in `src/store/repo.js`
3. Set credentials in environment/UI
4. Test file operations (list, save, load, delete)

### Adding Export Format
1. Update `src/utils/exportUtil.js`
2. Add export logic for new format
3. Update `VDbExportDialog.vue` to include option
4. Test export with sample diagrams

### Modifying Diagram Rendering
1. Locate relevant component in `src/components/VDbChart/`
2. Update rendering logic (usually SVG generation)
3. Test with various table configurations
4. Ensure pan/zoom still works correctly

### Adding DBML Features
1. Check if @dbml/core supports the feature
2. Update parser in `src/store/editor.js`
3. Update relevant diagram components
4. Test with sample DBML code

## Debugging Tips

### Vue DevTools
- Install Vue DevTools browser extension
- Inspect component hierarchy
- View store state (Pinia)
- Monitor events and performance

### Browser DevTools
- Use Console for error messages
- Use Network tab for S3 operations
- Use Elements tab for CSS debugging
- Use Sources tab for breakpoint debugging

### Common Issues

**Issue**: Hot reload not working
- **Fix**: Restart dev server, clear browser cache

**Issue**: ESLint errors on save
- **Fix**: Run `yarn lint --fix` or configure editor to auto-fix

**Issue**: Build fails
- **Fix**: Delete `node_modules` and `yarn.lock`, run `yarn install` again

**Issue**: Diagram not rendering
- **Fix**: Check browser console for DBML parser errors

**Issue**: S3 operations failing
- **Fix**: Check CORS configuration, credentials, and bucket permissions

## CI/CD Pipeline

### GitHub Actions Workflows

#### Build Workflow (`.github/workflows/build.yaml`)
Runs on every push and PR:
1. Checkout code
2. Setup Node.js 16
3. Install dependencies
4. Run linting (continues on error)
5. Build application
6. Upload build artifacts

#### Deploy Workflow (`.github/workflows/gh-pages.yaml`)
Deploys to GitHub Pages on main branch pushes.

### Testing Locally Before Push
```bash
# Simulate CI build process
cd web
yarn install --frozen-lockfile
yarn lint
yarn build
```

## Contributing Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make changes**: Follow code style and conventions
4. **Test thoroughly**: Use dev server and build
5. **Lint your code**: `yarn lint --fix`
6. **Commit changes**: Use clear commit messages
7. **Push to fork**: `git push origin feature/my-feature`
8. **Open Pull Request**: With description of changes

## Additional Resources

- **Architecture**: See `ARCHITECTURE.md` for technical details
- **AI Guide**: See `.github/AI_GUIDE.md` for AI-specific information
- **Component Docs**: See `web/src/COMPONENTS.md` for component details
- **Quasar Docs**: https://quasar.dev/
- **Vue 3 Docs**: https://vuejs.org/
- **DBML Docs**: https://www.dbml.org/

## Getting Help

- **Issues**: Check GitHub issues for known problems
- **Discussions**: Open a discussion for questions
- **Live Demo**: Test features at https://nomadrazor.github.io/dbdiagram-oss-wrep/ (fork) or https://trudan.github.io/dbdiagram-oss/ (original)
