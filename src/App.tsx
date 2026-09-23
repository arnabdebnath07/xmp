import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { deck, shots } from './content';
import { finalPosterUrl, finalVideoUrl, shotUrls, stepVideoUrls } from './assets';
import Phone, { frameUrl } from './Phone';

/** The slide is authored at a fixed 16:9 size and scaled to whatever screen it lands on. */
const STAGE_W = 1600;
const STAGE_H = 900;

/**
 * The unboxed hero carousel's geometry, ported straight over: radius is 2.6x the
 * slot width, camera distance is 6x the radius, so the slot facing the camera is
 * magnified by P / (P - R) = 1.2. SLIDE_W is chosen so that magnified front slot
 * renders at ~292px here.
 */
const SLIDE_W = 272;
const RADIUS_TO_WIDTH = 2.6;
const PERSPECTIVE_TO_RADIUS = 6;
const CYL_R = SLIDE_W * RADIUS_TO_WIDTH;
const PERSPECTIVE = CYL_R * PERSPECTIVE_TO_RADIUS;
const FRONT_MAG = PERSPECTIVE_TO_RADIUS / (PERSPECTIVE_TO_RADIUS - 1);
/** what the front slot actually measures once perspective has magnified it */
const PHONE_W = SLIDE_W * FRONT_MAG;
/** the video takes over from the lit phone and pushes in past it */
const HERO_W = 372;
/**
 * The push-in happens ONCE, on the things already on screen: when the field
 * clears, the front slot and the bezel over it both grow by this. The hero then
 * mounts at exactly that size and cross-fades in, so the swap has no motion of
 * its own to give itself away.
 */
const GROW = HERO_W / PHONE_W;
/** their ring puts 14 slots on the circle; we borrow the step, not the count */
const CYL_STEP = 360 / 14;

/**
 * Their falloff tables. The scale is an extra uniform shrink on top of what the
 * perspective already does. The second one is their brightness curve, which dims
 * toward a black stage; ours is white, so the same numbers are applied as opacity
 * — blending toward the background the same way, where dimming would only turn
 * the neighbours grey. Interpolated for our continuous angle.
 */
const SCALE_STOPS: [number, number][] = [
  [0, 1],
  [30, 0.96],
  [60, 0.89],
  [90, 0.86],
];
const RECEDE_STOPS: [number, number][] = [
  [0, 1],
  [30, 0.85],
  [60, 0.7],
  [90, 0.6],
];
/** every visible slot stays solid; the fade is only the exit ramp */
const FADE_START_DEG = 60;
const FADE_END_DEG = 71;
/** pushed off their table: the neighbours blur from the first step out, so the
 *  eye has nowhere to go but the middle */
const BLUR_STOPS: [number, number][] = [
  [0, 0],
  [CYL_STEP, 2.8],
  [CYL_STEP * 2, 7],
  [FADE_END_DEG, 15],
];

function atAngle(stops: [number, number][], deg: number) {
  if (deg <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [x0, y0] = stops[i - 1];
    const [x1, y1] = stops[i];
    if (deg <= x1) return y0 + ((y1 - y0) * (deg - x0)) / (x1 - x0);
  }
  return stops[stops.length - 1][1];
}

/** the run is hand-driven: this much wheel travel moves one build */
const WHEEL_STEP = 80;
const WHEEL_LOCK = 130;  // ms of quiet between steps, so momentum doesn't overshoot
const SETTLE_MS = 620;   // the field clears and the one that shipped is left standing
const CLEAR_STAGGER = 55; // nearest neighbours leave first, the far ones follow

type Phase = 'run' | 'settle' | 'final';

/**
 * Where a build sits on the cylinder: its angle carries it round and away, and
 * the tables above do the rest.
 */
function place(offset: number) {
  const angle = offset * CYL_STEP;
  const deg = Math.abs(angle);
  const fade =
    deg <= FADE_START_DEG
      ? 1
      : deg >= FADE_END_DEG
        ? 0
        : 1 - (deg - FADE_START_DEG) / (FADE_END_DEG - FADE_START_DEG);
  return {
    angle,
    scale: atAngle(SCALE_STOPS, deg),
    blur: atAngle(BLUR_STOPS, deg),
    opacity: atAngle(RECEDE_STOPS, deg) * fade,
  };
}

export default function App() {
  const [scale, setScale] = useState(1);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<Phase>('run');
  const [ready, setReady] = useState(false);
  const timers = useRef<number[]>([]);
  const wheel = useRef(0);
  const lockUntil = useRef(0);
  const lastWheelAt = useRef(0);
  // two notches can land before React re-renders, so the POSITION a step reads
  // has to be the live one, not the one captured when this render was built.
  // The phase deliberately gets no such ref: it only moves on settle, and a ref
  // for it can fall out of step with the real phase — which strands the deck
  // with the arrows doing nothing while F still works.
  const clips = useRef(new Map<string, HTMLVideoElement | null>());
  const at = useRef(0);
  at.current = cursor;

  const total = shots.length;
  const last = total - 1;
  const done = phase !== 'run';

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  // ── scale the slide to fit ───────────────────────────────
  useLayoutEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 90);
    return () => clearTimeout(t);
  }, []);

  // ── the track collapses onto the one that shipped ────────
  const settle = useCallback(() => {
    clearTimers();
    at.current = last;
    setCursor(last);
    setPhase('settle');
    after(SETTLE_MS, () => setPhase('final'));
  }, [last]);

  useEffect(() => clearTimers, []);

  const restart = useCallback(() => {
    clearTimers();
    at.current = 0;
    setPhase('run');
    setCursor(0);
  }, []);

  const goto = useCallback(
    (next: number) => {
      if (done) return;
      const c = Math.max(0, Math.min(last, next));
      at.current = c;
      setCursor(c);
    },
    [done, last],
  );

  /** one notch forward or back — the only way through the deck */
  const step = useCallback(
    (dir: number) => {
      if (phase === 'settle') return;
      if (phase === 'final') {
        // scrolling back out of the video drops you on the build it came from
        if (dir < 0) {
          clearTimers();
          at.current = last;
          setPhase('run');
          setCursor(last);
        }
        return;
      }
      if (dir > 0) {
        if (at.current >= last) settle();
        else {
          at.current += 1;
          setCursor(at.current);
        }
      } else {
        at.current = Math.max(0, at.current - 1);
        setCursor(at.current);
      }
    },
    [phase, last, settle],
  );

  // ── the wheel drives it ──────────────────────────────────
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const now = performance.now();
      if (now < lockUntil.current) return;
      // only a continuous gesture accumulates — stray isolated deltas would
      // otherwise stack up over a long idle and step the deck on their own
      if (now - lastWheelAt.current > 160) wheel.current = 0;
      lastWheelAt.current = now;
      // a trackpad swiped sideways should read the same as a scroll down
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      wheel.current += d;
      if (Math.abs(wheel.current) < WHEEL_STEP) return;
      const dir = Math.sign(wheel.current);
      wheel.current = 0;
      lockUntil.current = now + WHEEL_LOCK;
      step(dir);
    },
    [step],
  );

  // ── keys ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        step(-1);
      } else if (k === 'f') {
        if (!done) settle();
      } else if (k === 'r') {
        restart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, step, settle, restart]);

  // the lit build plays from the top; everything else sits paused
  useEffect(() => {
    const id = shots[cursor]?.id;
    const lit = clips.current.get(id);
    clips.current.forEach((v, key) => {
      if (v && key !== id) v.pause();
    });
    if (!lit || done) return;
    // play() rejects if the clip isn't buffered yet, and nothing would retry —
    // so on a cold load the first build would sit on a frozen frame
    const go = () => {
      lit.currentTime = 0;
      void lit.play().catch(() => {});
    };
    go();
    lit.addEventListener('canplay', go, { once: true });
    return () => lit.removeEventListener('canplay', go);
  }, [cursor, done]);

  const finalScreen = finalVideoUrl ? (
    <video src={finalVideoUrl} poster={finalPosterUrl ?? undefined} autoPlay muted loop playsInline />
  ) : (
    <span className="slot">
      <span className="slot-mark" />
      <span className="slot-label">{deck.finalHint}</span>
      <span className="slot-path mono">src/assets/final.mp4</span>
    </span>
  );

  return (
    <div className={`viewport${done ? ' is-done' : ''}`} onWheel={onWheel}>
      <div
        className={`stage${done ? ' is-done' : ''}`}
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div
          className={`track${ready ? ' is-ready' : ''}${done ? ' is-settling' : ''}`}
          style={{ perspective: `${PERSPECTIVE}px` }}
        >
          <div className="cylinder">
          {shots.map((s, i) => {
            // the track wraps, so there is always something either side of the lit one
            let o = i - cursor;
            if (o > total / 2) o -= total;
            if (o < -total / 2) o += total;
            const p = place(o);
            // on the way out the field sweeps further round the cylinder, nearest
            // first, and the one that shipped is left standing exactly where it was
            const leaving = done && i !== cursor;
            const angle = leaving ? p.angle * 1.5 : p.angle;
            const grown = done && i === cursor;
            const opacity = leaving ? 0 : p.opacity;
            return (
              <button
                key={s.id}
                className={`slide${i === cursor ? ' is-lit' : ''}`}
                style={{
                  transform:
                    `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${CYL_R}px) ` +
                    `scale(${leaving ? p.scale * 0.88 : grown ? GROW : p.scale})`,
                  opacity,
                  filter: `blur(${p.blur}px)`,
                  zIndex: 40 - Math.abs(o),
                  transitionDelay: leaving ? `${(Math.abs(o) - 1) * CLEAR_STAGGER}ms` : undefined,
                  pointerEvents: p.opacity < 0.2 || done ? 'none' : 'auto',
                }}
                onClick={() => goto(i)}
                title={`${s.id} — ${s.title}`}
              >
                {stepVideoUrls[s.id] ? (
                  <Phone width={SLIDE_W} src={null} frame={false}>
                    <video
                      ref={(el) => {
                        clips.current.set(s.id, el);
                      }}
                      src={stepVideoUrls[s.id]}
                      muted
                      loop
                      playsInline
                      preload="auto"
                    />
                  </Phone>
                ) : (
                  <Phone
                    src={shotUrls[s.id]}
                    width={SLIDE_W}
                    frame={false}
                    alt={`Iteration ${s.id} — ${s.title}`}
                  />
                )}
              </button>
            );
          })}
          </div>
        </div>

        {/* One bezel, over the front of the ring — the slots are bare screens. It
            stays through the finish, growing with the slot under it, so the hero's
            own frame lands on top of an identical one instead of a bare gap. */}
        <img
          className="device-frame"
          src={frameUrl}
          alt=""
          draggable={false}
          style={{
            width: PHONE_W,
            transform: `translate(-50%, -50%) scale(${done ? GROW : 1})`,
          }}
        />

        {phase !== 'final' && (
          <div className={`caption${done ? ' is-out' : ''}`} key={cursor}>
            Iteration {cursor + 1}
          </div>
        )}

        {/* ── the one that shipped ───────────────────────── */}
        {phase === 'final' && (
          <>
            <div className="hero">
              <Phone width={HERO_W} className="phone-hero" src={null}>
                {finalScreen}
              </Phone>
            </div>
            <div className="closing">
              <div className="closing-label">{deck.finalLabel}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
