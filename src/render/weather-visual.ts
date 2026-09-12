import * as THREE from 'three';
import type { WeatherSnapshot } from '../simulation/weather';

const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function noise(x: number, y: number) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    fx = x - ix,
    fy = y - iy;
  const u = fx * fx * (3 - 2 * fx),
    v = fy * fy * (3 - 2 * fy);
  return (
    (hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u) * (1 - v) +
    (hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u) * v
  );
}
function cloudTexture(eye: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 384;
  const ctx = canvas.getContext('2d')!,
    pixels = ctx.createImageData(384, 384);
  for (let y = 0; y < 384; y++)
    for (let x = 0; x < 384; x++) {
      const u = (x - 192) / 172,
        v = (y - 192) / 172,
        r = Math.hypot(u, v),
        a = Math.atan2(v, u);
      const n =
        0.52 * noise(u * 13 + 40, v * 13 + 20) +
        0.28 * noise(u * 32 + 20, v * 32 + 30) +
        0.2 * noise(u * 71, v * 71);
      const spiral = Math.pow(
        0.5 + 0.5 * Math.sin(3 * (a - 3.4 * Math.log(r + 0.15)) + n * 2),
        5,
      );
      const bands = spiral * Math.exp(-r * 1.6) * 0.95;
      const wall = Math.exp(-(((r - 0.16) / 0.085) ** 2)) * 0.83;
      const shield = Math.exp(-((r / 0.48) ** 2)) * 0.65;
      const outer = Math.max(0, Math.min(1, (1.08 - r + (n - 0.5) * 0.14) * 8));
      const hole = eye ? Math.min(1, Math.max(0, (r - 0.055) / 0.045)) : 1;
      const density =
        Math.min(1, (bands + wall + shield) * (0.48 + n * 0.9)) * outer * hole;
      const i = (y * 384 + x) * 4,
        light = 214 + n * 40;
      pixels.data[i] = light;
      pixels.data[i + 1] = light + 4;
      pixels.data[i + 2] = Math.min(255, light + 9);
      pixels.data[i + 3] = density * 255;
    }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
type Position = (lat: number, lon: number, radius?: number) => THREE.Vector3;
/** Displays the supplied weather snapshot. No motion or intensity is calculated from meshes. */
export class WeatherVisual {
  readonly group = new THREE.Group();
  private textures = [cloudTexture(false), cloudTexture(true)];
  private items = Array.from({ length: 12 }, () => {
    const root = new THREE.Group(),
      clouds = new THREE.Group();
    const geometry = new THREE.PlaneGeometry(1, 1, 20, 20);
    const points = geometry.attributes.position;
    for (let i = 0; i < points.count; i++)
      points.setZ(i, -0.13 * (points.getX(i) ** 2 + points.getY(i) ** 2));
    const material = new THREE.MeshBasicMaterial({
      map: this.textures[1],
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    clouds.add(new THREE.Mesh(geometry, material));
    root.add(clouds);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(66 * 3), 3),
    );
    lineGeometry.setDrawRange(0, 0);
    const trail = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: '#ffd895',
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
      }),
    );
    this.group.add(root, trail);
    return { root, clouds, material, trail };
  });
  update(snapshot: WeatherSnapshot, position: Position, shear: number) {
    this.items.forEach(({ root, trail }) => {
      root.visible = trail.visible = false;
    });
    for (const storm of snapshot.storms) {
      const item = this.items[storm.id];
      if (!item) continue;
      const { root, clouds, material, trail } = item;
      root.visible = trail.visible = true;
      root.position.copy(position(storm.lat, storm.lon, 1.017));
      root.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        root.position.clone().normalize(),
      );
      const diameter = 0.15 + storm.intensity * 0.22;
      root.scale.set(diameter, diameter * (1 - shear / 110), diameter);
      clouds.rotation.z = storm.age * 1.15 + storm.id * 2.4;
      material.map =
        this.textures[storm.intensity > 0.42 && storm.age > 3 ? 1 : 0];
      material.opacity = Math.min(1, 0.23 + storm.intensity * 1.3);
      const points = trail.geometry.attributes.position;
      storm.history.forEach((point, i) => {
        const p = position(point.lat, point.lon, 1.008);
        points.setXYZ(i, p.x, p.y, p.z);
      });
      points.needsUpdate = true;
      trail.geometry.setDrawRange(0, storm.history.length);
      trail.geometry.computeBoundingSphere();
    }
  }
  dispose() {
    this.textures.forEach((texture) => texture.dispose());
  }
}
