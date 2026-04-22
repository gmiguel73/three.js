# Spaceship Builder

A Sims 4-style spaceship building game built with three.js, integrated into the three.js editor framework.

## Features

### Core Building Mechanics
- **Snap-to-grid placement** on a 20×40 grid (cells are 1×1 units)
- **Multi-floor support** - Add floors above or below, switch between levels
- **7 configurable module types**, all with dynamic scaling:
  - 🚀 **Cockpit** - Command module, windows increase with width
  - 🔥 **Engine** - Propulsion, cooling fins scale with size
  - ✈️ **Wing** - Aerodynamic surface, panel lines increase with width
  - 📦 **Cargo Bay** - Hollow storage, door panels scale with width
  - ⛽ **Fuel Tank** - Cylindrical tank, reinforcement bands scale with height
  - 🔗 **Connector** - Universal 6-way joint
  - 🏠 **Habitation** - Crew quarters, portholes scale with all dimensions

### Editing Features
- **Place, move, rotate, delete** modules
- **Dynamic scaling** - Changing size rebuilds geometry (e.g., more windows on larger cockpits)
- **Color picker** - Customize each module's color
- **Copy/paste** - Duplicate modules with Ctrl+D
- **Undo/redo** - Full history support (Ctrl+Z, Ctrl+Y)
- **Multi-floor management** - Build across multiple levels

### Persistence
- **localStorage autosave** - Never lose work (auto-saves every second)
- **Manual save/load** - Save to browser storage
- **JSON export/import** - Share ships, create test data

### Controls
- **Mouse**: Orbit camera, click to place/select
- **1-7 keys**: Quick-select parts
- **Delete**: Remove selected module
- **Esc**: Cancel placement/deselect

## Running

1. Start server: `npm run dev` or `python3 -m http.server 8080`
2. Navigate to: http://localhost:8080/editor/spaceship/
3. Select a part from left sidebar
4. Click on grid to place
5. Use right panel to adjust properties

## Testing

### Unit Tests

Spaceship unit tests live in `Spaceship/test/unit/spaceship.tests.js` and have
their own runner script — kept separate from the parent three.js QUnit suite
so the demo's tests don't pollute the library's:

```bash
npm run test-unit-spaceship
```

If you want CI to gate on Spaceship regressions, chain it into the top-level
`test` script in `package.json` (currently runs lint + core + addons only).

### E2E Tests

The E2E spec lives at `Spaceship/test/e2e/spaceship-builder.test.js` and is
driven by a self-contained runner at `Spaceship/test/e2e/run.js`. The runner
spins up the repo's static server on a free port, launches headless Chrome
via puppeteer, and runs the suite against it.

```bash
npm run test-e2e-spaceship
```

To watch the browser visibly (debugging the suite):

```bash
VISIBLE=1 npm run test-e2e-spaceship
```

The suite covers: page load, default-floor creation, part selection,
placement, properties panel, dynamic scaling, color, **undo/redo (Ctrl+Z /
Ctrl+Y)**, multi-floor, manual save, duplicate (Ctrl+D), delete, and grid
toggle.

## File Structure

```
Spaceship/
├── index.html
├── css/main.css
├── js/
│   ├── main.js
│   ├── GridSystem.js
│   ├── Controls.js
│   ├── Storage.js
│   ├── commands/   (Add / Remove / Modify command pattern for undo/redo)
│   ├── modules/    (11 module types + registry)
│   └── ui/         (PartInventory, PropertiesPanel, FloorManager)
└── test/
    ├── unit/spaceship.tests.js
    └── e2e/spaceship-builder.test.js
```