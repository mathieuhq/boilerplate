import {
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { animate, type AnimationPlaybackControls } from "motion/react";

type DragDismissSide = "left" | "right";

type DragState = {
  pointerId: number;
  originX: number;
  originY: number;
  startOffset: number;
  tracking: boolean;
  samples: { time: number; offset: number }[];
};

const DRAG_THRESHOLD = 10;
const VELOCITY_WINDOW = 100;

function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

function releaseVelocity(samples: DragState["samples"]) {
  const last = samples.at(-1);
  const first = samples.find(
    (sample) => last && last.time - sample.time <= VELOCITY_WINDOW,
  );

  if (!first || !last || last.time === first.time) return 0;

  return ((last.offset - first.offset) / (last.time - first.time)) * 1000;
}

export function useDragDismiss<
  TContent extends HTMLElement,
  TOverlay extends HTMLElement,
>(side: DragDismissSide, onDismiss: () => void) {
  const contentRef = useRef<TContent>(null);
  const overlayRef = useRef<TOverlay>(null);
  const dragRef = useRef<DragState | null>(null);
  const offsetRef = useRef(0);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const suppressClickRef = useRef(false);
  const direction = side === "right" ? 1 : -1;

  const apply = useCallback(
    (offset: number) => {
      const content = contentRef.current;

      if (!content) return;

      const size = content.offsetWidth || 1;
      const translate = offset >= 0 ? offset : rubberband(offset, size);

      offsetRef.current = offset;
      content.style.transform = `translate3d(${translate * direction}px, 0, 0)`;

      if (overlayRef.current)
        overlayRef.current.style.opacity = String(
          1 - Math.min(Math.max(offset / size, 0), 1),
        );
    },
    [direction],
  );

  const reset = useCallback(() => {
    offsetRef.current = 0;
    contentRef.current?.style.removeProperty("transform");
    overlayRef.current?.style.removeProperty("opacity");
  }, []);

  const presentationOffset = useCallback(() => {
    const content = contentRef.current;

    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;

      return offsetRef.current;
    }

    if (!content) return 0;

    const matrix = new DOMMatrix(getComputedStyle(content).transform);
    const opacity = overlayRef.current
      ? getComputedStyle(overlayRef.current).opacity
      : null;

    content.getAnimations().forEach((animation) => animation.cancel());
    overlayRef.current?.getAnimations().forEach((animation) => {
      animation.cancel();
    });

    if (overlayRef.current && opacity)
      overlayRef.current.style.opacity = opacity;

    return matrix.m41 * direction;
  }, [direction]);

  const release = useCallback(
    (velocity: number) => {
      const content = contentRef.current;

      if (!content) return;

      const size = content.offsetWidth;
      const offset = offsetRef.current;
      const shouldDismiss = offset + project(velocity) > size / 2;

      controlsRef.current = animate(offset, shouldDismiss ? size : 0, {
        type: "spring",
        bounce: shouldDismiss ? 0 : 0.2,
        visualDuration: 0.3,
        velocity,
        onUpdate: apply,
        onComplete: () => {
          controlsRef.current = null;

          if (shouldDismiss) {
            content.dataset.dismissed = "";

            if (overlayRef.current) overlayRef.current.dataset.dismissed = "";

            onDismiss();
          } else {
            reset();
          }
        },
      });
    },
    [apply, onDismiss, reset],
  );

  useEffect(() => () => controlsRef.current?.stop(), []);

  const onPointerDown = useCallback((event: PointerEvent<TContent>) => {
    suppressClickRef.current = false;

    if (event.pointerType === "mouse" || !event.isPrimary) return;

    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startOffset: 0,
      tracking: false,
      samples: [],
    };
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<TContent>) => {
      const drag = dragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - drag.originX;
      const deltaY = event.clientY - drag.originY;

      if (!drag.tracking) {
        if (
          Math.abs(deltaY) > DRAG_THRESHOLD &&
          Math.abs(deltaY) > Math.abs(deltaX)
        ) {
          dragRef.current = null;

          return;
        }

        if (Math.abs(deltaX) < DRAG_THRESHOLD) return;

        drag.tracking = true;
        drag.originX = event.clientX;
        drag.startOffset = presentationOffset();
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      const offset =
        drag.startOffset + (event.clientX - drag.originX) * direction;

      apply(offset);
      drag.samples.push({ time: event.timeStamp, offset });

      if (drag.samples.length > 20) drag.samples.shift();
    },
    [apply, direction, presentationOffset],
  );

  const onPointerEnd = useCallback(
    (event: PointerEvent<TContent>) => {
      const drag = dragRef.current;

      if (!drag || drag.pointerId !== event.pointerId) return;

      dragRef.current = null;

      if (!drag.tracking) return;

      suppressClickRef.current = true;
      release(
        event.type === "pointercancel" ? 0 : releaseVelocity(drag.samples),
      );
    },
    [release],
  );

  const onClickCapture = useCallback((event: MouseEvent<TContent>) => {
    if (!suppressClickRef.current) return;

    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    contentRef,
    overlayRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onClickCapture,
    },
  };
}
