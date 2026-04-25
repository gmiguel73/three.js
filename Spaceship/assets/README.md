# Module assets

This is the asset root for the Spaceship Builder. Each subdirectory matches a
module type (e.g. `cockpit/`, `engine/`) and follows the layout described in
`Spaceship/feature specs/ModuleAssetsUsage.md`:

```
<moduleType>/
  manifest.json
  <part>/
    <variant>.glb
```

The shipped `cockpit/manifest.json` is a working template that documents the
manifest schema. To activate asset usage for the Cockpit module:

1. Author the listed `.glb` files under `cockpit/hull/` and `cockpit/canopy/`.
2. Add a `static assets` declaration to `Spaceship/js/modules/Cockpit.js`:
  ```js
   static assets = {
       parts: {
           hull:   { slot: 'body' },
           canopy: { slot: 'top'  }
       }
   };
  ```
3. Optionally tag any procedural meshes inside `buildProcedural()` with
  `mesh.userData.placeholder = true` so they are removed once the asset
   parts arrive.

Modules with no `static assets` block remain pure procedural; this directory
can sit empty without affecting them.