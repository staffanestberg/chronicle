# Chronicle prototype

An early, local interaction prototype for scene direction, shot planning and storyboard assembly. Stage names and layout choices are proposals.

## Run

No installation or network dependencies. Requires Python 3 and a modern browser.

```sh
cd /Users/staffanestberg/Dev/chronicle
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173. Stop the server with Ctrl+C.

## Try

1. In Develop, compare Scene first and Camera first. Drag the background to orbit. Drag characters, use the position dropdown or adjust X/Z with the keyboard.
2. Select an action, edit it and save. Add/reorder actions. Walk through previews movement over the specified durations.
3. Produce turns those actions into shots. Import your own image or video to replace a blocking preview.
4. Assemble selects, reorders and times those shots. Preview sequence advances through the cut; videos start at their beginning and are muted.

Browser localStorage saves the scene plan, layout, action order and assembly settings. Export project downloads that state as JSON. JSON reimport is not implemented. Media files remain local, are held only for the current page session, and must be reimported after reload. Filenames are saved as reminders. There are no external requests or generation providers.

## Limits

One example scene, fixed reusable cast, fixed camera setups, simplified 3D projection and blocking geometry. Action movement targets are named locations, with initial positions stored on the scene. This is a storyboard prototype, not a renderer or video editor: no clip trimming, audio editing or movie export. The UI is authored in English, following the earlier concept work.

## Files

- `index.html`: accessible page structure
- `style.css`: responsive application layout
- `app.js`: scene state, canvas renderer, action editor, media import and storyboard playback

Product notes: `/Users/staffanestberg/Cortex/projects/chronicle/notes.md`.
