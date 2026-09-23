// Screenshots + (optional) final video, resolved at build time so the deck
// works the same in dev, in `vite preview`, and on a static host.

const shotModules = import.meta.glob('./assets/shots/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const shotUrls: Record<string, string> = Object.fromEntries(
  Object.entries(shotModules).map(([path, url]) => [
    path.replace(/^.*\/(\d+)\.webp$/, '$1'),
    url,
  ]),
);

// Per-step video: drop src/assets/steps/<id>.mp4 (or .webm / .mov) and that
// build plays a clip instead of showing its screenshot. The id matches stepIds.
const stepVideoModules = import.meta.glob('./assets/steps/*.{mp4,webm,mov}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const stepVideoUrls: Record<string, string> = Object.fromEntries(
  Object.entries(stepVideoModules).map(([path, url]) => [
    path.replace(/^.*\/([^/]+)\.(mp4|webm|mov)$/, '$1'),
    url,
  ]),
);

// Drop the final render in as src/assets/final.mp4 (or .webm / .mov)
// and the last panel switches from placeholder to player automatically.
const finalModules = import.meta.glob('./assets/final.{mp4,webm,mov}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const finalVideoUrl: string | null =
  Object.values(finalModules)[0] ?? null;

// Optional poster frame for the final panel: src/assets/final-poster.{png,jpg,webp}
const posterModules = import.meta.glob('./assets/final-poster.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const finalPosterUrl: string | null =
  Object.values(posterModules)[0] ?? null;
