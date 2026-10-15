
import { BaseballRules } from "./Rules.js";

export class BaseballMatch {
  constructor(scene, callbacks = {}) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.reset();
  }

  reset() {
    this.state = BaseballRules.createCount();
    this.phase = "ready";
    this.currentPitch = null;
    this.pitchStarted = 0;
    this.pitchDuration = 700;
    this.aim = { x: 0, y: 0 };
    this.callbacks.onUpdate?.(this.state);
    this.message("투구 시작 버튼을 눌러 경기를 시작해.");
  }

  message(text) {
    this.callbacks.onMessage?.(text);
  }

  setAim(x, y) {
    this.aim = { x, y };
    this.scene?.setAim(x * 0.7, 2.8 + y * 0.6);
  }

  pitch() {
    if (this.state.finished) {
      this.message("경기가 끝났어. 경기 초기화를 눌러 다시 시작해.");
      return;
    }

    if (this.phase !== "ready") {
      this.message("현재 플레이를 먼저 완료해!");
      return;
    }

    this.phase = "pitching";

    const speed = 135 + Math.floor(Math.random() * 31);
    const targetX = (Math.random() - 0.5) * 1.8;
    const targetY = 2.3 + Math.random() * 1.1;
    const strikeZone = Math.abs(targetX) < 0.7 &&
      targetY > 2.1 && targetY < 3.3;

    this.currentPitch = {
      speed,
      targetX,
      targetY,
      strikeZone,
      started: performance.now(),
      duration: Math.max(480, 1050 - (speed - 130) * 8)
    };

    this.pitchStarted = this.currentPitch.started;
    this.pitchDuration = this.currentPitch.duration;

    this.callbacks.onSpeed?.(speed);
    this.message("투수가 공을 던졌다! 타이밍을 맞춰 스윙!");
    this.callbacks.onPhase?.("PITCHING");

    this.scene?.throwBall({
      x: targetX,
      y: targetY,
      duration: this.pitchDuration,
      onComplete: () => {
        if (this.phase !== "pitching") return;

        this.phase = "ready";
        this.scene.objects.ball.visible = false;

        const result = strikeZone
          ? BaseballRules.strike(this.state)
          : BaseballRules.ball(this.state);

        this.message(result);
        this.afterPlay();
      }
    });
  }

  swing() {
    if (this.phase !== "pitching" || !this.currentPitch) {
      this.message("투구 중일 때 스윙할 수 있어!");
      return;
    }

    const now = performance.now();
    const elapsed = now - this.pitchStarted;
    const timing = elapsed / this.pitchDuration;
    const timingError = Math.abs(timing - 0.82);

    const pitch = this.currentPitch;
    const player = this.callbacks.getPlayer?.() ?? {
      contact: 70,
      power: 70,
      eye: 70
    };

    const aimError = Math.hypot(
      this.aim.x * 0.7 - pitch.targetX,
      this.aim.y * 0.6 + 2.8 - pitch.targetY
    );

    const timingQuality = Math.max(0, 1 - timingError * 3.5);
    const aimQuality = Math.max(0, 1 - aimError * 0.55);

    const contactQuality = timingQuality * 0.72 +
      aimQuality * 0.28 +
      (player.contact - 70) / 300;

    this.phase = "hit";
    this.callbacks.onPhase?.("CONTACT");
    this.callbacks.onSwing?.(timingQuality);

    if (timingQuality < 0.12) {
      this.scene.objects.ball.visible = false;
      this.message("헛스윙! 타이밍을 다시 맞춰 봐.");
      BaseballRules.strike(this.state);
      this.afterPlay();
      return;
    }

    if (contactQuality < 0.48) {
      this.scene.objects.ball.visible = false;
      this.message("파울 타구! 다시 집중해.");
      BaseballRules.foul(this.state);
      this.afterPlay();
      return;
    }

    const power = Math.max(
      15,
      player.power * (0.45 + timingQuality * 0.55) *
      (0.65 + Math.random() * 0.35)
    );

    const homeRunChance = Math.min(
      0.65,
      0.06 + power / 220 + timingQuality * 0.15
    );

    let bases = 1;

    if (power > 78 && timingQuality > 0.7 &&
        Math.random() < homeRunChance) {
      bases = 4;
    } else if (power > 70 && Math.random() < 0.3) {
      bases = 2;
    } else if (power > 85 && Math.random() < 0.12) {
      bases = 3;
    }

    const outcome = BaseballRules.hit(this.state, bases);

    this.scene?.hitBall({
      x: this.aim.x || (Math.random() - 0.5),
      y: this.aim.y,
      power,
      onComplete: () => {
        if (this.phase !== "hit") return;
        this.scene.objects.ball.visible = false;
        this.phase = "ready";
        this.message(
          `${outcome.label} ${outcome.runs ? `${outcome.runs}득점!` : ""}`
        );
        this.afterPlay();
      }
    });
  }

  afterPlay() {
    if (this.phase === "hit") return;

    this.phase = "ready";
    this.currentPitch = null;
    this.callbacks.onPhase?.("READY");
    this.callbacks.onUpdate?.(this.state);
  }

  forceNextInning() {
    if (this.phase === "pitching" || this.phase === "hit") {
      this.message("진행 중인 플레이를 먼저 완료해.");
      return;
    }

    BaseballRules.advanceInning(this.state);
    this.state.finished = false;
    this.phase = "ready";
    this.currentPitch = null;
    this.callbacks.onUpdate?.(this.state);
    this.callbacks.onPhase?.("READY");
    this.message("다음 이닝으로 이동했어.");
  }
}
