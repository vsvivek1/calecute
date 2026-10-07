"use client";

/**
 * The 3D piece in the Bankers Gold hero: a rose-gold solitaire ring with a
 * faceted pink stone, two thin gold bangles and a few coins turning slowly
 * around it. It is the product's subject (pledged gold) rather than
 * decoration, and it echoes the app mark: a ring with a stone.
 *
 * Plain Three.js, like components/agents/HeroScene.tsx: one small scene and one
 * animation loop do not need a reconciler. Reflections come from Three's
 * built-in RoomEnvironment through PMREM, so there is no HDR file to fetch.
 *
 * Behaviour:
 *   - `prefers-reduced-motion` renders one still frame and no loop.
 *   - The loop stops when the tab is hidden or the hero scrolls out of view.
 *   - Geometry detail and pixel ratio drop on small screens.
 *   - No WebGL: renders nothing, and the CSS ring underneath stays visible.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

interface SceneHandles {
  dispose: () => void;
}

function buildScene(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  reduced: boolean,
  onReady: () => void,
): SceneHandles | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return null;
  }

  const small = host.clientWidth < 520;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.35, 10.5);

  // Warm key and a pink rim, so the metal picks up the brand colour.
  const key = new THREE.DirectionalLight("#fff1e0", 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight("#ff6f9d", 30, 20);
  rim.position.set(-4, -1.5, -2);
  scene.add(rim);

  const seg = small ? 0.6 : 1;
  const disposables: Array<{ dispose: () => void }> = [pmrem, envTexture];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  /* --------------------------------------------------------- materials */

  const roseGold = track(
    new THREE.MeshPhysicalMaterial({
      color: "#e9b09a",
      metalness: 1,
      roughness: 0.16,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
    }),
  );
  const yellowGold = track(
    new THREE.MeshPhysicalMaterial({
      color: "#f2c46d",
      metalness: 1,
      roughness: 0.18,
      clearcoat: 0.3,
      envMapIntensity: 1.6,
    }),
  );
  const stone = track(
    new THREE.MeshPhysicalMaterial({
      color: "#ffd6e4",
      metalness: 0.1,
      roughness: 0.02,
      flatShading: true,
      iridescence: 1,
      iridescenceIOR: 1.9,
      clearcoat: 1,
      envMapIntensity: 2.6,
      transparent: true,
      opacity: 0.94,
    }),
  );

  /* -------------------------------------------------------------- ring */

  const ring = new THREE.Group();
  scene.add(ring);

  const band = new THREE.Mesh(
    track(new THREE.TorusGeometry(1.25, 0.15, Math.round(40 * seg), Math.round(160 * seg))),
    roseGold,
  );
  ring.add(band);

  // Setting: a small cup that sits on top of the band.
  const head = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.34, 0.14, 0.32, Math.round(24 * seg))),
    roseGold,
  );
  head.position.y = 1.43;
  ring.add(head);

  // Four prongs.
  const prongGeometry = track(new THREE.CylinderGeometry(0.03, 0.035, 0.5, 8));
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const prong = new THREE.Mesh(prongGeometry, roseGold);
    prong.position.set(Math.cos(a) * 0.36, 1.68, Math.sin(a) * 0.36);
    prong.rotation.z = -Math.cos(a) * 0.18;
    prong.rotation.x = Math.sin(a) * 0.18;
    ring.add(prong);
  }

  // A round brilliant, roughly: a lathe profile with few segments reads as facets.
  const profile = [
    new THREE.Vector2(0, -0.42),
    new THREE.Vector2(0.5, 0.0),
    new THREE.Vector2(0.46, 0.08),
    new THREE.Vector2(0.3, 0.2),
    new THREE.Vector2(0, 0.2),
  ];
  const gem = new THREE.Mesh(track(new THREE.LatheGeometry(profile, 16)), stone);
  gem.position.y = 1.98;
  ring.add(gem);

  ring.rotation.x = 0.18;

  /* ------------------------------------------------- bangles and coins */

  const orbit = new THREE.Group();
  scene.add(orbit);

  const bangleGeometry = track(
    new THREE.TorusGeometry(2.35, 0.045, Math.round(16 * seg), Math.round(180 * seg)),
  );
  const bangleA = new THREE.Mesh(bangleGeometry, yellowGold);
  bangleA.rotation.set(1.25, 0.2, 0);
  orbit.add(bangleA);
  const bangleB = new THREE.Mesh(bangleGeometry, roseGold);
  bangleB.scale.setScalar(1.12);
  bangleB.rotation.set(1.6, -0.45, 0.3);
  orbit.add(bangleB);

  const coinGeometry = track(new THREE.CylinderGeometry(0.32, 0.32, 0.05, Math.round(40 * seg)));
  const coins = [
    { pos: [-2.4, 1.2, -0.6], phase: 0 },
    { pos: [2.5, -0.9, 0.3], phase: 1.7 },
    { pos: [-1.9, -1.6, 0.8], phase: 3.1 },
  ].map(({ pos, phase }) => {
    const coin = new THREE.Mesh(coinGeometry, yellowGold);
    coin.position.set(pos[0], pos[1], pos[2]);
    coin.rotation.x = Math.PI / 2;
    orbit.add(coin);
    return { coin, phase, baseY: pos[1] };
  });

  /* ------------------------------------------------------------ sizing */

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull back on narrower boxes so the bangles are not cropped.
    camera.position.z = w / h < 1.3 ? 12 : 10.5;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  /* ------------------------------------------------------------ motion */

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointerMove = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointer.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.ty = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  };

  function drawFrame(time: number) {
    const t = time * 0.001;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    ring.rotation.y = t * 0.45 + pointer.x * 0.5;
    ring.rotation.x = 0.18 + pointer.y * 0.2;
    ring.position.y = Math.sin(t * 0.9) * 0.08;
    gem.rotation.y = -t * 0.8;

    orbit.rotation.y = -t * 0.12 + pointer.x * 0.15;
    for (const { coin, phase, baseY } of coins) {
      coin.rotation.z = t * 0.9 + phase;
      coin.position.y = baseY + Math.sin(t * 0.8 + phase) * 0.15;
    }

    renderer.render(scene, camera);
  }

  let frame = 0;
  let visible = true;
  let running = false;

  const loop = (time: number) => {
    if (!running) return;
    drawFrame(time);
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || reduced || document.hidden || !visible) return;
    running = true;
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  const onVisibility = () => (document.hidden ? stop() : start());
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  intersection.observe(host);

  drawFrame(reduced ? 1800 : 0);
  onReady();

  if (!reduced) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    start();
  }

  return {
    dispose() {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const item of disposables) item.dispose();
      renderer.dispose();
    },
  };
}

export function JewelScene({ onReady }: { onReady: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const handles = buildScene(canvas, host, reduced, onReady);
    return () => handles?.dispose();
  }, [onReady]);

  return <canvas ref={canvasRef} className="jewel-canvas" aria-hidden="true" />;
}
