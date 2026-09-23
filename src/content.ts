// ─────────────────────────────────────────────────────────────
// The story. Everything presentable lives in this file.
// Edit titles / notes here — the deck reads from it.
// ─────────────────────────────────────────────────────────────

export const deck = {
  title: 'Sixteen versions of one banner.',
  subtitle:
    'Every frame below is a real build, not a sketch. Same brief, same asset — we kept moving the placement until the home screen stopped fighting it.',
  finalLabel: 'The final cut',
  finalHint: 'Video drops here',
  footNote: '16 builds · 1 shipped',
};

export type Shot = {
  /** 01–16, matches the file in src/assets/shots — rendered */
  id: string;
  /** short name, shown beneath the headline as each build comes up — rendered */
  title: string;
  /** reference only: where the placement sits. Not on screen. */
  placement: string;
  /** reference only: what this round was testing. Notes to narrate from. */
  note: string;
};

const allShots: Shot[] = [
  {
    id: '01',
    title: 'Banner on top',
    placement: 'Above the rail',
    note: 'Start honest: full-width hero above everything. Maximum impact, but it pushes the store rail and the address below the fold.',
  },
  {
    id: '02',
    title: 'Rail first',
    placement: 'Below the rail',
    note: 'Flip the order so the store rail keeps its top slot. The banner reads as noon content instead of an ad wall.',
  },
  {
    id: '03',
    title: 'Banner as a tile',
    placement: 'Inside the rail, slot 3',
    note: 'Collapse the hero into the rail itself. It scrolls with the stores — cheap, native, easy to miss.',
  },
  {
    id: '04',
    title: 'Promoted tile',
    placement: 'Inside the rail, slot 2',
    note: 'Same idea, wider tile, moved forward. Tests how much rail width a partner can take before the stores disappear.',
  },
  {
    id: '05',
    title: 'Full bleed red',
    placement: 'Top, into the status bar',
    note: 'Brand colour runs all the way into the status bar. The strongest takeover we tried — and the loudest.',
  },
  {
    id: '06',
    title: 'The control',
    placement: 'No placement',
    note: 'The baseline everything gets measured against. This is the home screen without us in it.',
  },
  {
    id: '07',
    title: 'Red tile, first',
    placement: 'Head of the rail',
    note: 'A square Cornetto tile in the rail’s first position — the same shape as a store, borrowing its authority.',
  },
  {
    id: '08',
    title: 'Condensed strip',
    placement: 'Edge-to-edge strip',
    note: 'Cut the height until only the message survives: “Back in stock.” Half the pixels, most of the meaning.',
  },
  {
    id: '09',
    title: 'Notch hugger',
    placement: 'Wrapped around the island',
    note: 'The banner curves around the Dynamic Island with a pull-down chevron. Playful, and it uses dead space.',
  },
  {
    id: '10',
    title: 'Floating prompt',
    placement: 'Bottom-right, over content',
    note: 'Persistent MINUTES button that expands into a card with price. Reachable by thumb, follows you down the page.',
  },
  {
    id: '11',
    title: 'Offer card',
    placement: 'Below the rail, with price',
    note: 'Lead with the product and the 40% off, not the logo. The banner starts behaving like merchandising.',
  },
  {
    id: '12',
    title: 'Bleeding tile',
    placement: 'Rail, cropped at the edge',
    note: 'Let the tile run off the left edge so the rail reads as scrollable at a glance.',
  },
  {
    id: '13',
    title: 'Peek state',
    placement: 'Sliver behind the rail',
    note: 'What the takeover collapses into on scroll — a red sliver that keeps the brand present without holding the screen.',
  },
  {
    id: '14',
    title: 'L-shaped takeover',
    placement: 'Left column, wrapping the rail',
    note: 'Break the grid: a vertical card owns the left while the rail and address reflow around it.',
  },
  {
    id: '15',
    title: 'Spotlight',
    placement: 'Over a blurred home',
    note: 'The interruption version. Everything behind blurs, one CTA stays sharp. Effective, expensive in goodwill.',
  },
  {
    id: '16',
    title: 'Rail as a grid',
    placement: 'Two-row grid, banner inline',
    note: 'Re-lay the whole rail as a grid so the banner is a first-class cell, not a guest in someone else’s row.',
  },
];

/**
 * The builds the deck walks through. Change these ids to change the cut —
 * everything else (the caption, the track, the settle) follows.
 */
export const stepIds = ['01', '02', '04', '05', '07'];

export const shots: Shot[] = stepIds.map((id) => {
  const found = allShots.find((s) => s.id === id);
  if (!found) throw new Error(`content.ts: no shot with id ${id}`);
  return found;
});
