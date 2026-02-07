# Roadmap Planner 2026 (MVP)

Outcome-first roadmap planner for CPM/PM/leadership teams. Works offline-first with LocalStorage and supports export/import of the full roadmap state.

## Local development

```bash
npm install
npm run dev
```

## Export / import

- **Export:** Click **Export** to download the full AppState JSON.
- **Import:** Click **Import** and choose a JSON file. The app validates minimum shape (pillars + initiatives), rehydrates quarter themes, and maps initiatives with unknown pillars to the **Unassigned** pillar.

## Print / PDF

Use **Print** in the header to trigger `window.print()`. Print styles hide controls and optimize the view for A4.

## Reset to demo

Use **Reset** to restore the demo/sample state.
