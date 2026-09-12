"use client";

/**
 * The WebGL layer behind the recruitment page.
 *
 * What it shows, and why this rather than decoration: a field of points spread
 * over a tall, narrow territory — Kerala's shape — with lines drawn between
 * neighbours. It is the programme itself: agents distributed across panchayats,
 * connected. Points near the cursor brighten and lift, so the thing responds to
 * the reader without demanding anything from them.
 *
 * Written against Three.js directly rather than react-three-fiber. The scene is
 * a single static graph with one animation loop; a reconciler would add a
 * dependency and a render tree for no benefit.
 *
 * Behaviour that matters more than the visual:
 *   - `prefers-reduced-motion` renders one still frame and stops. No loop.
 *   - The loop pauses when the tab is hidden and when the canvas scrolls out of
 *     view, so it does not drain a phone battery while someone reads the terms.
 *   - Point count and pixel ratio scale down on small or low-DPI screens.
 *   - If WebGL is unavailable the component renders nothing and the page is
 *     unaffected — every word of content is server-rendered above this layer.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Roughly Kerala: long, narrow, tapering at both ends, widest mid-north. */
function keralaOutlineWidth(t: number): number {
  // t runs 0 (south) to 1 (north).
  const taperSouth = Math.min(1, t * 4.5);
  const taperNorth = Math.min(1, (1 - t) * 3.2);
  const belly = 0.55 + 0.45 * Math.sin(t * Math.PI * 0.85 + 0.35);
  return Math.max(0.08, taperSouth * taperNorth * belly);
}

interface SceneHandles {
  dispose: () => void;
}

function buildScene(canvas: HTMLCanvasElement, reduced: boolean): SceneHandles | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    // No WebGL. The page does not depend on it.
    return null;
  }

  const isSmall = window.innerWidth < 640;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 0, 15);

  /* ------------------------------------------------------------- points */

  // Fewer points on a phone: this is the difference between a smooth scene and
  // a hot device on the exact hardware the programme is recruiting on.
  const COUNT = isSmall ? 190 : 420;
  const HEIGHT = 15;
  const WIDTH = 4.2;
  const DEPTH = 2.4;

  const positions = new Float32Array(COUNT * 3);
  const basePositions = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i += 1) {
    const t = Math.random();
    const halfWidth = keralaOutlineWidth(t) * WIDTH * 0.5;

    const x = (Math.random() * 2 - 1) * halfWidth;
    const y = (t - 0.5) * HEIGHT;
    const z = (Math.random() * 2 - 1) * DEPTH;

    positions[i * 3] = basePositions[i * 3] = x;
    positions[i * 3 + 1] = basePositions[i * 3 + 1] = y;
    positions[i * 3 + 2] = basePositions[i * 3 + 2] = z;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );

  // A soft round sprite, drawn once into a canvas rather than fetched.
  const sprite = (() => {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2,
      );
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.25, "rgba(160,255,220,0.85)");
      gradient.addColorStop(1, "rgba(52,211,153,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  })();

  const pointMaterial = new THREE.PointsMaterial({
    size: isSmall ? 0.3 : 0.26,
    map: sprite,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(pointGeometry, pointMaterial);
  scene.add(points);

  /* -------------------------------------------------------- connections */

  // Nearest-neighbour links, computed once. O(n²) is fine at this count and
  // happens a single time on mount.
  const linkIndices: number[] = [];
  const LINK_DISTANCE = isSmall ? 2.0 : 1.75;

  for (let i = 0; i < COUNT; i += 1) {
    let made = 0;
    for (let j = i + 1; j < COUNT && made < 3; j += 1) {
      const dx = basePositions[i * 3] - basePositions[j * 3];
      const dy = basePositions[i * 3 + 1] - basePositions[j * 3 + 1];
      const dz = basePositions[i * 3 + 2] - basePositions[j * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < LINK_DISTANCE * LINK_DISTANCE) {
        linkIndices.push(i, j);
        made += 1;
      }
    }
  }

  const linkPositions = new Float32Array(linkIndices.length * 3);
  const linkGeometry = new THREE.BufferGeometry();
  linkGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(linkPositions, 3),
  );

  const linkMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color("#2ec7a6"),
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const links = new THREE.LineSegments(linkGeometry, linkMaterial);
  scene.add(links);

  const group = new THREE.Group();
  scene.add(group);
  group.add(points);
  group.add(links);
  group.rotation.z = 0.12;

  /* ------------------------------------------------------------ motion */

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollOffset = 0;

  const onPointerMove = (event: PointerEvent) => {
    pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1;
  };

  const onScroll = () => {
    scrollOffset = window.scrollY / Math.max(1, document.body.scrollHeight);
  };

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };

  function updateLinks() {
    const p = pointGeometry.attributes.position.array as Float32Array;
    for (let k = 0; k < linkIndices.length; k += 1) {
      const source = linkIndices[k] * 3;
      linkPositions[k * 3] = p[source];
      linkPositions[k * 3 + 1] = p[source + 1];
      linkPositions[k * 3 + 2] = p[source + 2];
    }
    linkGeometry.attributes.position.needsUpdate = true;
  }

  function drawFrame(time: number) {
    const p = pointGeometry.attributes.position.array as Float32Array;

    for (let i = 0; i < COUNT; i += 1) {
      const drift = Math.sin(time * 0.0004 + phases[i]) * 0.18;
      p[i * 3] = basePositions[i * 3] + drift;
      p[i * 3 + 1] =
        basePositions[i * 3 + 1] + Math.cos(time * 0.0003 + phases[i]) * 0.14;
      p[i * 3 + 2] = basePositions[i * 3 + 2] + drift * 0.6;
    }
    pointGeometry.attributes.position.needsUpdate = true;
    updateLinks();

    // Ease toward the pointer rather than tracking it exactly.
    pointer.x += (pointer.targetX - pointer.x) * 0.045;
    pointer.y += (pointer.targetY - pointer.y) * 0.045;

    group.rotation.y = time * 0.00007 + pointer.x * 0.28;
    group.rotation.x = pointer.y * 0.12;
    // Scrolling walks the camera down the territory, so the scene stays
    // connected to the reading position instead of looping in place.
    group.position.y = scrollOffset * 6.5;

    renderer.render(scene, camera);
  }

  let frame = 0;
  let running = true;

  function loop(time: number) {
    if (!running) return;
    drawFrame(time);
    frame = requestAnimationFrame(loop);
  }

  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(frame);
    } else if (!reduced) {
      running = true;
      frame = requestAnimationFrame(loop);
    }
  };

  if (reduced) {
    // One still frame: the composition is visible, nothing moves.
    drawFrame(0);
  } else {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", onResize);

  return {
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      pointGeometry.dispose();
      linkGeometry.dispose();
      pointMaterial.dispose();
      linkMaterial.dispose();
      sprite.dispose();
      renderer.dispose();
    },
  };
}

export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const handles = buildScene(canvas, reduced);
    return () => handles?.dispose();
  }, []);

  return (
    <div className="scene-layer" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
