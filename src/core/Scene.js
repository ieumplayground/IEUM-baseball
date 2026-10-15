
import * as THREE from "three";

export class BaseballScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#86b8dc");
    this.scene.fog = new THREE.Fog("#86b8dc", 65, 145);

    this.camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      300
    );
    this.camera.position.set(0, 12, 27);
    this.camera.lookAt(0, 2, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "low-power"
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.objects = {};
    this.animations = [];
    this.buildLighting();
    this.buildStadium();
    this.buildPlayers();
    this.buildBall();
    this.buildAimMarker();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    this.animate();
  }

  material(color, extra = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      ...extra
    });
  }

  mesh(geometry, material, parent = this.scene) {
    const object = new THREE.Mesh(geometry, material);
    parent.add(object);
    return object;
  }

  buildLighting() {
    this.scene.add(new THREE.HemisphereLight("#e7f3ff", "#425a35", 2.1));

    const sun = new THREE.DirectionalLight("#fff4dc", 2.5);
    sun.position.set(-15, 30, 12);
    this.scene.add(sun);
  }

  buildStadium() {
    const grass = this.material("#3d963e");
    const darkGrass = this.material("#348436");
    const dirt = this.material("#b98455");
    const white = this.material("#f7f5e9");
    const concrete = this.material("#65758b");
    const blue = this.material("#263d66");

    const ground = this.mesh(
      new THREE.PlaneGeometry(120, 120),
      grass
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;

    for (let i = 0; i < 10; i++) {
      const stripe = this.mesh(
        new THREE.PlaneGeometry(120, 4),
        darkGrass
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, -0.065, -45 + i * 10);
    }

    const outfield = this.mesh(
      new THREE.CircleGeometry(27, 64, 0, Math.PI),
      darkGrass
    );
    outfield.rotation.x = -Math.PI / 2;
    outfield.position.set(0, 0.015, -4);

    const infield = this.mesh(
      new THREE.CircleGeometry(13, 4, Math.PI / 4, Math.PI * 2),
      dirt
    );
    infield.rotation.x = -Math.PI / 2;
    infield.scale.set(1, 1.1, 1);
    infield.position.set(0, 0.03, 4);

    const diamond = this.mesh(
      new THREE.PlaneGeometry(18, 18),
      dirt
    );
    diamond.rotation.x = -Math.PI / 2;
    diamond.rotation.z = Math.PI / 4;
    diamond.position.set(0, 0.035, 4);

    const bases = [
      [0, 0.16, 10],
      [-6, 0.16, 4],
      [0, 0.16, -2],
      [6, 0.16, 4]
    ];

    bases.forEach(([x, y, z]) => {
      const base = this.mesh(
        new THREE.BoxGeometry(0.8, 0.18, 0.8),
        white
      );
      base.position.set(x, y, z);
      base.rotation.y = Math.PI / 4;
    });

    const mound = this.mesh(
      new THREE.CylinderGeometry(2.2, 2.7, 0.28, 32),
      dirt
    );
    mound.position.set(0, 0.1, -3);

    const plate = this.mesh(
      new THREE.BoxGeometry(1.1, 0.12, 0.8),
      white
    );
    plate.position.set(0, 0.12, 12);

    // Outfield wall
    for (let i = 0; i < 18; i++) {
      const angle = Math.PI * (0.08 + i * 0.84 / 17);
      const radius = 34;
      const wall = this.mesh(
        new THREE.BoxGeometry(4.4, 2.4, 0.5),
        blue
      );
      wall.position.set(
        Math.sin(angle) * radius,
        1.2,
        -Math.cos(angle) * radius + 4
      );
      wall.rotation.y = angle;
    }

    // Stands
    for (let row = 0; row < 5; row++) {
      const stand = this.mesh(
        new THREE.BoxGeometry(70 + row * 3, 1.1, 2.5),
        row % 2 ? concrete : blue
      );
      stand.position.set(0, 3 + row * 0.65, -20 - row * 2.3);
    }

    this.buildLines(white);
  }

  buildLines(material) {
    const line = (x1, z1, x2, z2) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, 0.08, z1),
        new THREE.Vector3(x2, 0.08, z2)
      ]);
      this.scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: material.color
      })));
    };

    line(0, 12, -27, -15);
    line(0, 12, 27, -15);
  }

  buildPlayers() {
    const skin = this.material("#d8a37e");
    const uniformHome = this.material("#edf3ff");
    const uniformAway = this.material("#df606e");
    const pants = this.material("#d8e1ed");
    const cap = this.material("#253a67");
    const batMaterial = this.material("#b67b42");
    const glove = this.material("#553b2b");

    const makePlayer = (name, x, z, teamMaterial, role) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      this.scene.add(group);

      const body = this.mesh(
        new THREE.CapsuleGeometry(0.48, 1.05, 4, 8),
        teamMaterial,
        group
      );
      body.position.y = 1.35;

      const head = this.mesh(
        new THREE.SphereGeometry(0.36, 12, 10),
        skin,
        group
      );
      head.position.y = 2.35;

      const hat = this.mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.14, 12),
        cap,
        group
      );
      hat.position.y = 2.62;

      const legGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.85, 8);

      for (const side of [-1, 1]) {
        const leg = this.mesh(legGeometry, pants, group);
        leg.position.set(side * 0.2, 0.45, 0);

        const arm = this.mesh(
          new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8),
          teamMaterial,
          group
        );
        arm.position.set(side * 0.55, 1.45, 0);
        arm.rotation.z = side * -0.35;
      }

      if (role === "batter") {
        const bat = this.mesh(
          new THREE.CylinderGeometry(0.045, 0.09, 1.5, 8),
          batMaterial,
          group
        );
        bat.position.set(0.68, 1.6, 0);
        bat.rotation.z = -0.65;
        this.objects.bat = bat;
      }

      if (role === "catcher") {
        const mitt = this.mesh(
          new THREE.SphereGeometry(0.28, 10, 8),
          glove,
          group
        );
        mitt.position.set(-0.58, 1.15, -0.2);
      }

      this.objects[name] = group;
      return group;
    };

    makePlayer("pitcher", 0, -3, uniformAway, "pitcher");
    makePlayer("batter", -1.35, 11, uniformHome, "batter");
    makePlayer("catcher", 0, 14, uniformAway, "catcher");

    const fielders = [
      [-12, -2], [12, -2], [-18, -12], [18, -12],
      [-8, -20], [8, -20], [-3, -23], [3, -23]
    ];

    fielders.forEach(([x, z], i) => {
      makePlayer("fielder" + i, x, z, uniformHome, "fielder");
    });

    this.objects.batter.rotation.y = -0.2;
    this.objects.pitcher.rotation.y = Math.PI;
  }

  buildBall() {
    this.objects.ball = this.mesh(
      new THREE.SphereGeometry(0.18, 16, 12),
      this.material("#ffffff", { roughness: 0.5 })
    );
    this.objects.ball.position.set(0, -5, 0);
    this.objects.ball.visible = false;

    this.objects.aim = this.mesh(
      new THREE.RingGeometry(0.55, 0.7, 32),
      new THREE.MeshBasicMaterial({
        color: "#5fd9ff",
        side: THREE.DoubleSide
      })
    );
    this.objects.aim.rotation.x = -Math.PI / 2;
    this.objects.aim.position.set(0, 0.12, 12);
  }

  buildAimMarker() {
    this.objects.aimMarker = this.mesh(
      new THREE.RingGeometry(0.22, 0.32, 24),
      new THREE.MeshBasicMaterial({
        color: "#ffcb69",
        side: THREE.DoubleSide
      })
    );
    this.objects.aimMarker.position.set(0, 3, 12);
    this.objects.aimMarker.visible = false;
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setAim(x, y) {
    this.objects.aimMarker.position.set(x, y, 12);
    this.objects.aimMarker.visible = true;
  }

  animateBall(position, duration, onComplete) {
    const ball = this.objects.ball;
    const start = ball.position.clone();
    const end = new THREE.Vector3(position.x, position.y, position.z);
    const started = performance.now();

    ball.visible = true;

    const update = (now) => {
      const t = Math.min((now - started) / duration, 1);
      const eased = t * t * (3 - 2 * t);
      ball.position.lerpVectors(start, end, eased);

      if (t < 1) {
        requestAnimationFrame(update);
      } else {
        onComplete?.();
      }
    };

    requestAnimationFrame(update);
  }

  throwBall({ x = 0, y = 3, duration = 700, onComplete } = {}) {
    this.objects.ball.position.set(0, 2.8, -3);
    this.animateBall({ x, y, z: 10.5 }, duration, onComplete);
  }

  hitBall({ x, y, power, onComplete } = {}) {
    const ball = this.objects.ball;
    const start = ball.position.clone();
    const end = new THREE.Vector3(
      x * 20,
      2 + power * 0.1,
      -25 - power * 0.35
    );
    const started = performance.now();
    const duration = 1100 + power * 7;

    const update = (now) => {
      const t = Math.min((now - started) / duration, 1);
      ball.position.x = THREE.MathUtils.lerp(start.x, end.x, t);
      ball.position.z = THREE.MathUtils.lerp(start.z, end.z, t);
      ball.position.y = THREE.MathUtils.lerp(start.y, end.y, t) +
        Math.sin(t * Math.PI) * power * 0.1;

      if (t < 1) requestAnimationFrame(update);
      else onComplete?.();
    };

    requestAnimationFrame(update);
  }

  setStatus(text) {
    const element = document.getElementById("pitch-indicator");
    if (element) {
      element.querySelector("strong").textContent = text;
    }
  }

  animate() {
    this.frame = requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    if (this.objects.pitcher) {
      this.objects.pitcher.rotation.y =
        Math.PI + Math.sin(time * 0.6) * 0.025;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
    this.container.replaceChildren();
  }
}
