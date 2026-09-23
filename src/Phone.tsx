import type { ReactNode } from 'react';
import frameUrl from './assets/frame.webp';

/**
 * Geometry measured off the frame artwork's alpha channel (978 × 2000):
 * the screen cutout is x 53…924, y 50…1948, with a ~148px corner radius and
 * the Dynamic Island painted into the frame itself.
 */
const FRAME_W = 978;
const FRAME_H = 2000;
const INSET_X = 53 / FRAME_W;
const INSET_TOP = 50 / FRAME_H;
const INSET_BOTTOM = 52 / FRAME_H;
// Well inside the frame's own cutout radius. The bezel masks the difference on
// the framed phones, and the bare slots on the ring — which have no bezel to
// hide behind — stop rounding hard enough to eat their own content.
const SCREEN_R = 88 / FRAME_W;
const BODY_R = 184 / FRAME_W;

export const PHONE_RATIO = FRAME_H / FRAME_W; // height = width × this

type PhoneProps = {
  src?: string | null;
  /** rendered width in stage px; height follows the frame artwork */
  width: number;
  alt?: string;
  children?: ReactNode;
  className?: string;
  /** false renders the screen alone — for slots that sit under one shared frame */
  frame?: boolean;
};

export const SCREEN_INSET_X = INSET_X;
export const SCREEN_INSET_TOP = INSET_TOP;
export const SCREEN_INSET_BOTTOM = INSET_BOTTOM;
export { frameUrl };

/** A screenshot wearing the real device: artwork on top, screen showing through. */
export default function Phone({ src, width, alt, children, className, frame = true }: PhoneProps) {
  return (
    <div
      className={`phone${className ? ` ${className}` : ''}`}
      style={{ width, borderRadius: width * BODY_R }}
    >
      <div
        className="phone-screen"
        style={{
          left: `${INSET_X * 100}%`,
          right: `${INSET_X * 100}%`,
          top: `${INSET_TOP * 100}%`,
          bottom: `${INSET_BOTTOM * 100}%`,
          borderRadius: width * SCREEN_R,
        }}
      >
        {src ? <img src={src} alt={alt ?? ''} draggable={false} /> : children}
      </div>
      {frame && <img className="phone-frame" src={frameUrl} alt="" draggable={false} />}
    </div>
  );
}
