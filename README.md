# MINUTES × Cornetto — 16 iterations

One white slide that runs itself. Sixteen real builds of the same banner fill the
screen as a wall of phones; a red playhead steps through them one by one; then
all sixteen fly to the centre, stack into a single device, and that device plays
the final video.

## Run it

```
npm install
npm run dev      # http://localhost:5310
```

The slide is authored at a fixed 1600×900 and scales to fit whatever screen it
lands on, so it never scrolls — present it full-screen on any laptop or
projector.

## The run

| beat | what happens | timing |
| --- | --- | --- |
| sweep | the lit build steps 01 → 16, everything else dimmed | `STEP_MS` 550ms each |
| hold | a beat on the last build | `HOLD_MS` 450ms |
| fly | all 16 cards fly to the centre and fan | `FLY_MS` 700ms, 40ms apart |
| snap | the fan closes into one device | `SNAP_MS` 480ms |
| final | the crisp hero device fades in and plays | — |

About 11 seconds end to end. Every constant is at the top of
[`src/App.tsx`](src/App.tsx).

The fly is measured, not hard-coded: each tile's stage-local offset is read at
merge time and turned into a `translate(...) scale(...)`, so the cards land
exactly where the hero device renders — the swap from stack to hero is invisible
and the final frame is full resolution, not an upscaled thumbnail.

## Present it

| key | does |
| --- | --- |
| `space` | play / pause (restarts once merged) |
| `←` `→` | step a build (pauses); `→` on the last one starts the merge |
| `F` | merge to the final cut now |
| `R` | restart — the cards fly back out and the run begins again |
| click a phone | jump to that build and pause |

## Drop the final video in

Save the render as `src/assets/final.mp4` (`.webm` / `.mov` also work). The hero
device switches from the dashed placeholder to an autoplaying, looping,
muted video on its own — no code change. Optional poster frame:
`src/assets/final-poster.jpg`.

## The device frame

`src/assets/frame.webp` is the iPhone artwork, and the screenshot shows through
its transparent cutout — the frame paints on top, so its bezel masks the
screenshot's corners and the Dynamic Island lands over the status bar.

The geometry in [`src/Phone.tsx`](src/Phone.tsx) was measured off that file's
alpha channel (cutout x 53…924, y 50…1948 of 978 × 2000). Swap the artwork and
those five constants — `INSET_X`, `INSET_TOP`, `INSET_BOTTOM`, `SCREEN_R`,
`BODY_R` — have to be re-measured with it; everything else (tile size, hero size,
the merge) follows from `PHONE_RATIO`.

## Edit the story

All presentable copy lives in [`src/content.ts`](src/content.ts) — the headline,
and for each build its title, placement and note. The screenshots are
`src/assets/shots/01–16.webp`; the number is the only link between a file and its
entry, and the wall reads them in that order.

## Ship it

```
npm run deploy   # → https://minutes-iterations.vercel.app
npm run bundle   # → sixteen-versions-of-one-banner.html, one self-contained file
npm run build    # → dist/, fully static, relative paths
```

`bundle` inlines every screenshot and the video as data URIs, so the single file
runs offline from a double-click — no server, nothing to upload.
