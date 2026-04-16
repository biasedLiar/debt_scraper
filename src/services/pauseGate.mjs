/**
 * Pause gate for stepping through Puppeteer automation.
 *
 * Manual pause mode:
 *   togglePause() — pause/resume from the UI button.
 *   checkPause()  — blocks when isPaused is true.
 *
 * Step mode:
 *   setStepMode(true) — every checkPause() call auto-blocks.
 *   step()            — releases exactly one blocked checkpoint.
 *   setStepMode(false) — disables step mode and releases any held checkpoint.
 *
 * resetPause() — call in finally blocks to clean up after a session.
 */

let resolvePause = null;
export let isPaused = false;
export let stepMode = false;

export function setStepMode(enabled) {
  stepMode = enabled;
  if (!enabled && resolvePause) {
    // Leaving step mode while blocked — release
    resolvePause();
    resolvePause = null;
    isPaused = false;
  }
}

export function togglePause() {
  isPaused = !isPaused;
  if (!isPaused && resolvePause) {
    resolvePause();
    resolvePause = null;
  }
}

/** Release exactly one blocked checkpoint (used in step mode). */
export function step() {
  if (resolvePause) {
    resolvePause();
    resolvePause = null;
    isPaused = false;
  }
}

export function resetPause() {
  isPaused = false;
  if (resolvePause) {
    resolvePause();
    resolvePause = null;
  }
}

export async function checkPause() {
  if (isPaused || stepMode) {
    await new Promise((r) => { resolvePause = r; });
  }
}
