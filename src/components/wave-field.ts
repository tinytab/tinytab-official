/**
 * The backdrop's particle wave field: a plane of points rippling along a few sine waves, seen from slightly above
 * and fading into the distance. The waves are computed in the vertex shader, so a frame costs the CPU only a uniform
 * update. Loaded on demand by `site-background.tsx`; Three.js stays out of the main bundle.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vHeight;
  varying float vDistance;

  void main() {
    vec3 p = position;
    // Slow, low swells: the field should read as texture, not as motion that pulls the eye off the content.
    p.y = sin(p.x * 0.24 + uTime * 0.22) * 0.6
        + cos(p.z * 0.26 + uTime * 0.16) * 0.42
        + sin((p.x + p.z) * 0.13 + uTime * 0.11) * 0.35;
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = uSize * uPixelRatio * (10.0 / -view.z);
    vHeight = p.y;
    vDistance = -view.z;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform float uOpacity;
  uniform float uFar;
  varying float vHeight;
  varying float vDistance;

  void main() {
    // Round, soft-edged points.
    float edge = 1.0 - smoothstep(0.35, 0.5, length(gl_PointCoord - 0.5));
    if (edge <= 0.0) discard;
    float crest = clamp(vHeight * 0.4 + 0.5, 0.0, 1.0);
    // Fade out well before the horizon, where distant points crowd into moire, and soften the nearest, largest points.
    float fade = (1.0 - smoothstep(uFar * 0.2, uFar * 0.7, vDistance)) * (0.4 + 0.6 * smoothstep(4.0, 14.0, vDistance));
    gl_FragColor = vec4(mix(uLow, uHigh, crest), edge * fade * uOpacity * (0.5 + 0.5 * crest));
  }
`;

/** Colours and strength per theme: a faint glow on dark, quieter still on light. Kept low so text stays in front. */
const THEMES = {
  dark: { low: '#4f46e5', high: '#a5b4fc', opacity: 0.6, blending: AdditiveBlending },
  light: { low: '#818cf8', high: '#6d28d9', opacity: 0.35, blending: NormalBlending },
} as const;

export interface WaveField {
  setTheme(theme: keyof typeof THEMES): void;
  /** Pointer position in -1…1 on both axes, for a slight parallax. */
  setPointer(x: number, y: number): void;
  dispose(): void;
}

const FAR = 46;

/**
 * Starts rendering into `canvas`; returns null where WebGL is unavailable. With `animate` false a single still frame
 * is drawn (for `prefers-reduced-motion`).
 */
export function createWaveField(
  canvas: HTMLCanvasElement,
  options: { animate: boolean; dense: boolean; theme: keyof typeof THEMES }
): WaveField | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);

  // A grid of points on the ground plane, wider than the view so its edges never show.
  const columns = options.dense ? 220 : 110;
  const rows = options.dense ? 120 : 70;
  const positions = new Float32Array(columns * rows * 3);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const i = (row * columns + column) * 3;
      positions[i] = (column / (columns - 1) - 0.5) * 80;
      positions[i + 2] = -(row / (rows - 1)) * FAR + 4;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  const time = { value: 0 };
  const low = { value: new Color() };
  const high = { value: new Color() };
  const opacity = { value: 1 };
  const material = new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: time,
      uSize: { value: options.dense ? 2.6 : 3 },
      uPixelRatio: { value: pixelRatio },
      uLow: low,
      uHigh: high,
      uOpacity: opacity,
      uFar: { value: FAR },
    },
  });

  const scene = new Scene();
  scene.add(new Points(geometry, material));
  const camera = new PerspectiveCamera(55, 1, 0.1, 100);
  const target = { x: 0, y: 0 };
  const look = { x: 0, y: 0 };

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  let frame = 0;
  const started = performance.now();
  const render = () => {
    time.value = (performance.now() - started) / 1000;
    // Ease towards the pointer, so the parallax drifts rather than jumps.
    look.x += (target.x - look.x) * 0.04;
    look.y += (target.y - look.y) * 0.04;
    // High enough that the line of sight never grazes a slope, where a column's points stack into moire.
    camera.position.set(look.x * 2, 5.5 + look.y * 0.8, 9);
    camera.lookAt(0, -1, -14);
    renderer.render(scene, camera);
  };
  const loop = () => {
    render();
    frame = requestAnimationFrame(loop);
  };
  // Browsers already throttle requestAnimationFrame in hidden tabs; stopping outright saves the rest.
  const visibility = () => {
    cancelAnimationFrame(frame);
    if (!document.hidden && options.animate) {
      loop();
    }
  };
  document.addEventListener('visibilitychange', visibility);

  const field: WaveField = {
    setTheme(theme) {
      const colors = THEMES[theme];
      low.value.set(colors.low);
      high.value.set(colors.high);
      opacity.value = colors.opacity;
      material.blending = colors.blending;
      material.needsUpdate = true;
      if (!options.animate) {
        render();
      }
    },
    setPointer(x, y) {
      target.x = x;
      target.y = y;
    },
    dispose() {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };

  field.setTheme(options.theme);
  if (options.animate) {
    loop();
  }
  return field;
}
