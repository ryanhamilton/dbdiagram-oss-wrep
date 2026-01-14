# Database Diagram Generator

Open Source Database Diagram Generator.
Enables generating diagram from DBML, MySQL, PostgreSQL, MSSQL.

## Live Demo

Demo https://www.timestored.com/database-diagram/


![Database Diagram Demo GIF](/database-diagram.gif)


## Changes

### January 2026

+ 1. Add TableHeader color and TableGroup color support.
+ 2. Add Grid Toggle
+ 3. Add Diagram Detail levels
+ 4. Add Relationship animation toggle.
+ 5. Add PNG download button that creates named file automatically. FIx PNG zoom.
+ 6. Improve Auto-Layout mechanism
+ 7. Upgrade @dbml/core from 2.3.1 to 5.4.0
+ 8. Add Note support.

#### Actual docker version: 2.4.2

+ 1. Crappy auto-layout algorithm
+ 2. Remote S3 repository
+ 3. Repaired bug correct redrawing after changing the file
+ 4. Repaired bug droping "text" field in localStorage when selecting another clean file
+ 5. Docker image (single folder in S3 repo):  docker pull nomadshub/dbdiagrams-oss-wrep:2.3.7
+ 6. Docker image (multiple folders in S3 repo):  docker pull nomadshub/dbdiagrams-oss-wrep:2.4.0

### Sep.23 update
+ 6. Notifications for repository actions
+ 7. Added relation labels (1 or *) (minor positioning issues)
+ 7. Custom header colors (done)
+ 8. Export to SVG, PNG, Json
+ 9. Several new bugs (decision is in progress)
+ 10. Next cool update for header and relation labels will be later...
 
### Oct.23 update
+ 11. Added field tooltion with note, enum description and default
+ 12. Redesign table tooltip, added indexes
+ 13. Added not null and enum tag on diagram

### Feb.24 update
+ 14. Shifts of header color bug repaired
+ 15. Added touch screen support (hover table header = hold touch) (without gestures)
+ 16. Added PNG resolution change in export form (default is better quality)
+ 17. Added import json files
+ 18. Added actions for refs control points (add, reset, delete)
+ 19. Added diagram fit function
+ 20. Fix key icon positioning
+ 21. Show key icon for columns in composite PK
+ 22. Fix table header color reshuffle when changing the code
+ 23. Fix table positioning when changeing table ordering in code

## Publish v2.4.0

### Mar.24 update
+ 24. Added multiple folders support for S3 repo
+ 25. Added export to DBML, SQL (Postgres, MSSQL, MySQL)
+ 26. Added import from SQL (Postgres)


## Documentation

Comprehensive documentation is available to help developers and AI assistants work with this codebase:

- **[Development Guide](DEVELOPMENT.md)** - Setup, building, testing, and contributing
- **[Architecture Documentation](ARCHITECTURE.md)** - Technical architecture, data flow, and design patterns
- **[Component Documentation](web/src/COMPONENTS.md)** - Detailed component reference and usage
- **[AI Assistant Guide](.github/AI_GUIDE.md)** - Guide for AI tools working with this codebase

## Quick Start

```bash
# Navigate to web directory
cd web

# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions.


## License

[MIT](https://choosealicense.com/licenses/mit/)


## Related

[quasar](https://quasar.dev/) - Awesome VueJS framework

[jointjs](https://github.com/clientIO/joint) - Charting Library used for diagrams

[dbml.org](https://www.dbml.org/home/) - DBML Parser/importer/exporter

[dbdiagram.io](https://dbdiagram.io/home) - Original DBDiagram tool



