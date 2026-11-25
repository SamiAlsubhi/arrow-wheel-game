import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { R, RW, T, DEPTH, CAMERA, VIEW, PANEL_TOP, BOARD, PLATES, TARGET_R, BADGE_R, BADGE_T } from '../game/constants.js';
import { wheelOutline, arrowOutline, plateOutline, P } from '../game/geometry.js';
import { cam } from '../game/camera.js';

const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// printed board + its LED light: lit.r = how much the light tints it, lit.g = how much it glows
const LIT_FRAG = /* glsl */ `
  uniform sampler2D uMap, uLit; uniform vec3 uColor; uniform float uGlow; varying vec2 vUv;
  void main() {
    vec4 u = texture2D(uMap, vUv); if (u.a < 0.02) discard;
    vec2 l = texture2D(uLit, vUv).rg;
    vec3 tint = mix(vec3(1.0), uColor * 1.15 + 0.22, l.r);
    gl_FragColor = vec4(min(u.rgb * tint + l.g * uColor * uGlow, 1.0), u.a);
  }`;

// wheel print, mapped by position so it covers the whole disc to the cut edges
const WHEEL_VERT = /* glsl */ `uniform float uRW; varying vec2 vUv; void main() { vUv = position.xy / (2.0 * uRW) + 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const WHEEL_FRAG = /* glsl */ `uniform sampler2D uMap; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(uMap, vUv).rgb, 1.0); }`;

// fixed backlit panel behind the wheel
const BACKLIGHT_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uChase, uAngle, uR; uniform vec2 uSize; varying vec2 vUv;
  vec3 hsv2rgb(float h) { return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  void main() {
    vec2 p = (vUv - 0.5) * uSize; float e = length(p) / uR;
    if (e > 1.1) discard;
    vec3 c = uChase > 0.5 ? hsv2rgb(fract(atan(-p.y, p.x) / 6.2831853 + uAngle)) : uColor;
    c *= mix(1.06, 0.84, smoothstep(0.55, 1.0, e));
    if (uChase < 0.5) c += vec3(0.10) * (1.0 - smoothstep(0.0, 0.9, e));
    gl_FragColor = vec4(min(c, 1.0), 1.0);
  }`;

const v3 = c => new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255);
const col = c => new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
const isGreen = c => c[1] > 200 && c[0] < 130 && c[2] < 120;
function tex(canvas, gl, srgb = false) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = gl.capabilities.getMaxAnisotropy();
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
const extrude = pts => {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: T, bevelEnabled: false, curveSegments: 1 });
  g.computeVertexNormals();
  return g;
};
// clear acrylic: transparent, glossy, reflects the room so it shifts with the camera
const acrylic = () => new THREE.MeshPhysicalMaterial({
  color: '#ffffff', transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02,
  envMapIntensity: 1.6, emissive: new THREE.Color('#000000'), depthWrite: false, side: THREE.DoubleSide,
});

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => { env.dispose(); pm.dispose(); };
  }, [gl, scene]);
  return null;
}

export default function Machine({ parts, game }) {
  const { gl } = useThree();
  const wheelRef = useRef(), arrowRef = useRef();

  const m = useMemo(() => {
    const glowMat = L => new THREE.MeshBasicMaterial({ map: tex(L.c, gl, true), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const lit = p => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: LIT_FRAG, transparent: true,
      uniforms: { uMap: { value: tex(p.tex.c, gl) }, uLit: { value: tex(p.lit.c, gl) }, uColor: { value: new THREE.Vector3() }, uGlow: { value: 1 } } });
    return {
      face: lit(parts.face), board: lit(parts.board),
      wheelCap: new THREE.ShaderMaterial({ vertexShader: WHEEL_VERT, fragmentShader: WHEEL_FRAG, uniforms: { uMap: { value: tex(parts.wheel.c, gl) }, uRW: { value: RW } } }),
      wheelEdge: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      plateCap: acrylic(), plateEdge: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      arrowCap: acrylic(), arrowEdge: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      sticker: new THREE.MeshBasicMaterial({ map: tex(parts.sticker.c, gl, true), transparent: true, alphaTest: 0.02, toneMapped: false }),
      glowArrow: glowMat(parts.arrowGlow), glowL: glowMat(parts.plateGlowL), glowR: glowMat(parts.plateGlowR),
      badgeFaces: parts.badges.map(L => new THREE.MeshBasicMaterial({ map: tex(L.c, gl, true), toneMapped: false })),
      badgeSide: new THREE.MeshStandardMaterial({ color: '#e6e9f2', roughness: 0.35, metalness: 0 }),
      bolt: new THREE.MeshStandardMaterial({ color: '#d7dbe6', metalness: 0.85, roughness: 0.25 }),
      backlight: new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: BACKLIGHT_FRAG,
        uniforms: { uColor: { value: new THREE.Vector3() }, uChase: { value: 0 }, uAngle: { value: 0 }, uR: { value: R }, uSize: { value: new THREE.Vector2(2 * (R + 14), 2 * (R + 14)) } } }),
    };
  }, [parts, gl]);

  const geo = useMemo(() => ({
    wheel: extrude(wheelOutline()), arrow: extrude(arrowOutline()),
    plateL: extrude(plateOutline(-1)), plateR: extrude(plateOutline(1)),
  }), []);

  useFrame((_, delta) => {
    if (!window.__manual) game.update(Math.min(delta, 0.05));
    const { st } = game, { ring, channel } = game.lights();
    const ringC = ring.chase ? [150, 110, 255] : ring.color;
    m.face.uniforms.uColor.value.copy(v3(ringC)); m.face.uniforms.uGlow.value = 0.8;
    m.board.uniforms.uColor.value.copy(v3(channel)); m.board.uniforms.uGlow.value = isGreen(channel) ? 1 : 1.3;
    const b = m.backlight.uniforms;
    b.uChase.value = ring.chase ? 1 : 0; b.uAngle.value = (st.now * (ring.speed || 0)) % 1;
    if (!ring.chase) b.uColor.value.copy(v3(ring.color));
    // acrylic edges carry the LED light: the wheel's edges catch the backlight, the arrow and plates the channel LEDs
    const chan = col(channel), rc = col(ringC);
    m.wheelEdge.color.copy(rc).lerp(new THREE.Color('#ffffff'), 0.35);
    m.plateEdge.color.copy(chan).lerp(new THREE.Color('#ffffff'), 0.15);
    m.arrowEdge.color.copy(chan).lerp(new THREE.Color('#ffffff'), 0.25);
    m.plateCap.emissive.copy(chan).multiplyScalar(0.10);
    m.arrowCap.emissive.copy(chan).multiplyScalar(0.22);
    m.glowArrow.color.copy(chan).lerp(new THREE.Color('#ffffff'), 0.3);
    m.glowL.color.copy(chan).lerp(new THREE.Color('#ffffff'), 0.2); m.glowR.color.copy(m.glowL.color);
    wheelRef.current.rotation.z = (-st.phi * Math.PI) / 180;
    arrowRef.current.position.y = st.arrow;
  });

  const s = parts.sticker, p = PANEL_TOP, bd = BOARD;
  const bolts = [[-328, -322], [328, -322], [-328, -782], [328, -782], [-94, -336], [94, -336], [-94, -786], [94, -786]];
  return (
    <group>
      <Environment />
      <ambientLight intensity={0.6} />
      <mesh position={[0, 0, DEPTH.backlight]} material={m.backlight} renderOrder={0}>
        <planeGeometry args={[2 * (R + 14), 2 * (R + 14)]} />
      </mesh>
      <mesh position={[(bd.x0 + bd.x1) / 2, (bd.y0 + bd.y1) / 2, DEPTH.board]} material={m.board} renderOrder={0}>
        <planeGeometry args={[bd.x1 - bd.x0, bd.y0 - bd.y1]} />
      </mesh>
      {/* acrylic wheel */}
      <group ref={wheelRef} position={[0, 0, DEPTH.acrylic]}>
        <mesh geometry={geo.wheel} material={[m.wheelCap, m.wheelEdge]} renderOrder={1} />
        {/* raised target badges on the wheel's face (not cut by the slots) */}
        {m.badgeFaces.map((mat, k) => {
          const [x, y] = P(90 + 45 * k, TARGET_R);
          return (
            <group key={k} position={[x, y, T]} rotation={[0, 0, Math.atan2(-y, -x) - Math.PI / 2]}>
              <mesh position={[0, 0, BADGE_T]} material={mat} renderOrder={2}><circleGeometry args={[BADGE_R, 64]} /></mesh>
              <mesh position={[0, 0, BADGE_T / 2]} rotation={[Math.PI / 2, 0, 0]} material={m.badgeSide} renderOrder={2}><cylinderGeometry args={[BADGE_R, BADGE_R, BADGE_T, 64, 1, true]} /></mesh>
            </group>
          );
        })}
      </group>
      {/* acrylic arrow with its sticker inside */}
      <group ref={arrowRef}>
        <mesh position={[s.cx, s.cy, DEPTH.acrylic + T / 2]} material={m.sticker} renderOrder={2}>
          <planeGeometry args={[s.w, s.h]} />
        </mesh>
        <mesh geometry={geo.arrow} material={[m.arrowCap, m.arrowEdge]} position={[0, 0, DEPTH.acrylic]} renderOrder={4} />
        <mesh position={[parts.arrowGlow.cx, parts.arrowGlow.cy, DEPTH.acrylic + T + 0.2]} material={m.glowArrow} renderOrder={6}>
          <planeGeometry args={[parts.arrowGlow.w, parts.arrowGlow.h]} />
        </mesh>
      </group>
      {/* clear side plates and their bolts */}
      <mesh geometry={geo.plateL} material={[m.plateCap, m.plateEdge]} position={[0, 0, DEPTH.acrylic]} renderOrder={4} />
      <mesh geometry={geo.plateR} material={[m.plateCap, m.plateEdge]} position={[0, 0, DEPTH.acrylic]} renderOrder={4} />
      {[[parts.plateGlowL, m.glowL], [parts.plateGlowR, m.glowR]].map(([L, mat], i) => (
        <mesh key={i} position={[L.cx, L.cy, DEPTH.acrylic + T + 0.2]} material={mat} renderOrder={6}>
          <planeGeometry args={[L.w, L.h]} />
        </mesh>
      ))}
      {bolts.map(([x, y]) => (
        <mesh key={`${x},${y}`} position={[x, y, DEPTH.acrylic + T + 1.5]} rotation={[Math.PI / 2, 0, 0]} material={m.bolt} renderOrder={5}>
          <cylinderGeometry args={[6, 6, 3, 20]} />
        </mesh>
      ))}
      {/* printed cabinet face in front, with the window */}
      <mesh position={[(p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2, DEPTH.face]} material={m.face} renderOrder={3}>
        <planeGeometry args={[p.x1 - p.x0, p.y0 - p.y1]} />
      </mesh>
    </group>
  );
}

// Orbits the camera a little around the game panel and keeps the whole panel framed.
export function CameraRig() {
  const { camera, size } = useThree();
  useFrame((_, delta) => {
    const k = window.__manual ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 7);
    cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k;
    const yaw = (cam.x * CAMERA.maxYaw * Math.PI) / 180, pitch = (cam.y * CAMERA.maxPitch * Math.PI) / 180;
    const t = Math.tan((CAMERA.fov * Math.PI) / 360), aspect = size.width / size.height;
    const d = Math.max((VIEW.h * 0.5 * 1.06) / t, (VIEW.w * 0.5 * 1.1) / (t * aspect));
    camera.position.set(VIEW.cx + d * Math.sin(yaw) * Math.cos(pitch), VIEW.cy + d * Math.sin(pitch), d * Math.cos(yaw) * Math.cos(pitch));
    camera.near = d * 0.3; camera.far = d * 3; camera.fov = CAMERA.fov;
    camera.lookAt(VIEW.cx, VIEW.cy, 0);
    camera.updateProjectionMatrix();
  });
  return null;
}
