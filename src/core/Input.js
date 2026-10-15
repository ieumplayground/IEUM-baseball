
export class GameInput {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;

    this.onKeyDown = event => {
      if (event.code === "Space") {
        event.preventDefault();
        this.callbacks.onSwing?.();
      }

      if (event.code === "Enter") {
        this.callbacks.onPitch?.();
      }

      if (event.code === "ArrowLeft") {
        this.callbacks.onAim?.(-1, 0);
      }

      if (event.code === "ArrowRight") {
        this.callbacks.onAim?.(1, 0);
      }

      if (event.code === "ArrowUp") {
        this.callbacks.onAim?.(0, 1);
      }

      if (event.code === "ArrowDown") {
        this.callbacks.onAim?.(0, -1);
      }
    };

    window.addEventListener("keydown", this.onKeyDown);
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
  }
}
