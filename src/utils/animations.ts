/**
 * Centraliza las animaciones del sitio con Anime.js v4.
 * Uso:
 *   import { animate, stagger, onScroll, createSpring } from 'animejs';
 *   o las helpers de acá.
 */
import {
  animate,
  stagger,
  utils,
  onScroll,
  createSpring,
} from 'animejs';

export { animate, stagger, onScroll, createSpring, utils };

/** Entrada escalonada de una grilla de elementos (cards, KPIs, features). */
export function animateGridIn(
  selector: string,
  container?: HTMLElement | null,
  options: { delay?: number; y?: number } = {},
) {
  const scope = container ?? document;
  const targets = scope.querySelectorAll(selector);
  if (!targets.length) return;
  utils.set(targets, { opacity: 0, y: options.y ?? 24 });
  animate(targets, {
    opacity: [0, 1],
    y: [options.y ?? 24, 0],
    duration: 550,
    ease: 'out(3)',
    delay: stagger(options.delay ?? 60, { start: 40 }),
  });
}

/** Fade + slide up genérico de un bloque (hero, headers, paneles). */
export function animateIn(
  target: string | HTMLElement | Element | null | undefined,
  options: { delay?: number; y?: number; duration?: number } = {},
) {
  if (!target) return;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  utils.set(el, { opacity: 0, y: options.y ?? 18 });
  animate(el, {
    opacity: [0, 1],
    y: [options.y ?? 18, 0],
    duration: options.duration ?? 600,
    ease: 'out(3)',
    delay: options.delay ?? 0,
  });
}

/** Contador animado de 0 al valor final, con formato opcional. */
export function animateCounter(
  el: HTMLElement,
  to: number,
  format: (v: number) => string,
  duration = 1100,
) {
  if (!el) return;
  const obj = { v: 0 };
  animate(obj, {
    v: to,
    duration,
    ease: 'out(4)',
    onUpdate: () => {
      el.textContent = format(obj.v);
    },
  });
}

/** Entrada con spring para modales y drawers. */
export function animateModalIn(el: HTMLElement | null | undefined) {
  if (!el) return;
  animate(el, {
    opacity: [0, 1],
    scale: [0.92, 1],
    y: [16, 0],
    ease: createSpring({ stiffness: 220, damping: 22 }),
    duration: 650,
  });
}

/** Pequeño "pop" al agregar al carrito / feedback puntual. */
export function animatePop(el: HTMLElement | null | undefined) {
  if (!el) return;
  animate(el, {
    scale: [1, 1.25, 1],
    duration: 420,
    ease: 'out(3)',
  });
}

/** Animación disparada cuando el elemento entra en pantalla. */
export function animateOnScrollIn(
  el: Element | null | undefined,
  options: { y?: number; delay?: number } = {},
) {
  if (!el) return;
  utils.set(el, { opacity: 0, y: options.y ?? 28 });
  animate(el, {
    opacity: [0, 1],
    y: [options.y ?? 28, 0],
    duration: 700,
    ease: 'out(3)',
    delay: options.delay ?? 0,
    autoplay: onScroll({
      target: el,
      enter: 'bottom-=120 top',
      repeat: false,
    }),
  });
}
