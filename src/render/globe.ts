import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Geography } from '../simulation/geography';
import type { WeatherSnapshot } from '../simulation/weather';
import { WeatherVisual } from './weather-visual';
import { coastDistances, glacierVisual } from './surface-visual';
import {
  evaluate,
  oceanTemperature,
  ensoAnomaly,
  type Settings,
} from '../simulation/climate';

const WIDTH = 1024;
const HEIGHT = 512;
export function location(lat: number, lon: number, radius = 1) {
  const a = (lat * Math.PI) / 180;
  const b = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(a) * Math.cos(b),
    radius * Math.sin(a),
    -radius * Math.cos(a) * Math.sin(b),
  );
}
const palette = [
  new THREE.Color('#233e80'),
  new THREE.Color('#327da2'),
  new THREE.Color('#63baa6'),
  new THREE.Color('#d7ca80'),
  new THREE.Color('#e49657'),
  new THREE.Color('#c65445'),
];
function oceanColor(temp: number) {
  const t = Math.max(0, Math.min(4.999, ((temp + 3) / 38) * 5));
  return palette[Math.floor(t)]
    .clone()
    .lerp(palette[Math.min(5, Math.floor(t) + 1)], t % 1);
}
function anomalyColor(anomaly: number) {
  return new THREE.Color('#193e50').lerp(
    new THREE.Color(anomaly >= 0 ? '#ef956b' : '#6ebee6'),
    Math.min(1, Math.abs(anomaly) / 2),
  );
}
export class Globe {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(37, 1, 0.1, 40);
  private controls: OrbitControls;
  private canvas = document.createElement('canvas');
  private context: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private land = new Path2D();
  private ice: ReturnType<typeof glacierVisual>[] = [];
  private weather = new WeatherVisual();
  private coast: Uint16Array;
  private observer: ResizeObserver;
  private request = 0;
  private last = 0;
  private dirty = true;
  private active = true;
  private rotating = false;
  private lost = false;
  private disposed = false;
  private frames = 0;
  private current: Settings;
  private onVisibility = () => {
    this.last = 0;
    this.schedule();
  };
  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
    this.onError(
      '3D 연결이 중단되었습니다. 다시 시작하거나 수치와 설명으로 계속 탐색하세요.',
    );
  };
  private onRestored = () => {
    this.lost = false;
    this.dirty = true;
    this.onReady();
    this.schedule();
  };

  constructor(
    private host: HTMLElement,
    data: Geography,
    initial: Settings,
    private onError: (message: string) => void,
    private onReady: () => void,
  ) {
    this.current = initial;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute(
      'aria-label',
      '마우스 드래그 또는 방향키로 회전하는 기후 지구본',
    );
    this.renderer.domElement.tabIndex = 0;
    host.append(this.renderer.domElement);
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.context = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = Math.min(
      this.renderer.capabilities.getMaxAnisotropy(),
      4,
    );
    for (const feature of data.features) {
      const polygons =
        feature.geometry.type === 'Polygon'
          ? [feature.geometry.coordinates as number[][][]]
          : (feature.geometry.coordinates as number[][][][]);
      for (const polygon of polygons) {
        for (const ring of polygon) {
          ring.forEach(([lon, lat], i) => {
            const x = ((lon + 180) / 360) * WIDTH;
            const y = ((90 - lat) / 180) * HEIGHT;
            if (i === 0) this.land.moveTo(x, y);
            else this.land.lineTo(x, y);
          });
          this.land.closePath();
        }
      }
    }
    this.coast = coastDistances(this.land, WIDTH, HEIGHT);
    this.scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1, 96, 64),
        new THREE.MeshPhongMaterial({
          map: this.texture,
          shininess: 13,
          specular: '#40615c',
        }),
      ),
    );
    this.scene.add(new THREE.HemisphereLight('#d7f0f6', '#263546', 2.5));
    const light = new THREE.DirectionalLight('#fff2d7', 2.3);
    light.position.set(-3, 5, -4);
    this.scene.add(light);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.024, 64, 40),
      new THREE.MeshBasicMaterial({
        color: '#79cbbf',
        transparent: true,
        opacity: 0.065,
        side: THREE.BackSide,
      }),
    );
    this.scene.add(halo);
    const grid: number[] = [];
    for (let lat = -60; lat <= 60; lat += 30)
      for (let lon = -180; lon < 180; lon += 3)
        grid.push(
          ...location(lat, lon, 1.003).toArray(),
          ...location(lat, lon + 3, 1.003).toArray(),
        );
    for (let lon = -180; lon < 180; lon += 30)
      for (let lat = -90; lat < 90; lat += 3)
        grid.push(
          ...location(lat, lon, 1.003).toArray(),
          ...location(lat + 3, lon, 1.003).toArray(),
        );
    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(grid, 3),
    );
    this.scene.add(
      new THREE.LineSegments(
        gridGeometry,
        new THREE.LineBasicMaterial({
          color: '#d7f5ee',
          transparent: true,
          opacity: 0.11,
        }),
      ),
    );
    for (const [lat, lon] of [
      [61, -146],
      [47, 9],
      [32, 79],
      [28, 88],
      [-47, -73],
      [-43, 170],
      [69, 19],
      [64, -19],
    ]) {
      const glacier = glacierVisual();
      glacier.root.position.copy(location(lat, lon, 1.008));
      glacier.root.lookAt(glacier.root.position.clone().multiplyScalar(2));
      this.ice.push(glacier);
      this.scene.add(glacier.root);
    }
    this.scene.add(this.weather.group);
    this.camera.position.copy(location(22, 125, 3.7));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = false;
    this.controls.minDistance = 2.35;
    this.controls.maxDistance = 5;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.65;
    this.controls.addEventListener('change', () => {
      this.dirty = true;
      this.schedule();
    });
    this.renderer.domElement.addEventListener('keydown', (e) => {
      if (
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-'].includes(
          e.key,
        )
      )
        return;
      e.preventDefault();
      const spherical = new THREE.Spherical().setFromVector3(
        this.camera.position,
      );
      if (e.key === 'ArrowLeft') spherical.theta -= 0.12;
      if (e.key === 'ArrowRight') spherical.theta += 0.12;
      if (e.key === 'ArrowUp')
        spherical.phi = Math.max(0.15, spherical.phi - 0.12);
      if (e.key === 'ArrowDown')
        spherical.phi = Math.min(Math.PI - 0.15, spherical.phi + 0.12);
      if (e.key === '+')
        spherical.radius = Math.max(2.35, spherical.radius - 0.2);
      if (e.key === '-') spherical.radius = Math.min(5, spherical.radius + 0.2);
      this.camera.position.setFromSpherical(spherical);
      this.controls.update();
      this.dirty = true;
      this.schedule();
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onLost);
    this.renderer.domElement.addEventListener(
      'webglcontextrestored',
      this.onRestored,
    );
    document.addEventListener('visibilitychange', this.onVisibility);
    this.update(initial);
    this.resize();
  }
  private resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.dirty = true;
    this.schedule();
  }
  update(settings: Settings) {
    this.current = settings;
    const m = evaluate(settings),
      ctx = this.context;
    for (let y = 0; y < HEIGHT; y += 4)
      for (let x = 0; x < WIDTH; x += 4) {
        const lat = 90 - (y / HEIGHT) * 180,
          lon = (x / WIDTH) * 360 - 180;
        ctx.fillStyle =
          settings.layer === 'temperature' && settings.enso !== 'neutral'
            ? `#${anomalyColor(ensoAnomaly(lat, lon, settings.enso)).getHexString()}`
            : settings.layer === 'cyclone'
              ? `#${oceanColor(
                  oceanTemperature(lat, lon, m.warming, settings.enso),
                )
                  .lerp(new THREE.Color('#092e46'), 0.62)
                  .getHexString()}`
              : settings.layer === 'temperature'
                ? `#${oceanColor(oceanTemperature(lat, lon, m.warming, settings.enso)).getHexString()}`
                : '#174355';
        ctx.fillRect(x, y, 4, 4);
      }
    ctx.save();
    ctx.clip(this.land, 'evenodd');
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#dce9e5');
    gradient.addColorStop(0.13, '#95a591');
    gradient.addColorStop(0.32, '#738670');
    gradient.addColorStop(0.5, '#587560');
    gradient.addColorStop(0.7, '#8b9472');
    gradient.addColorStop(0.86, '#b7c8bd');
    gradient.addColorStop(1, '#e4f0f2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const tile = document.createElement('canvas');
    tile.width = 6;
    tile.height = 6;
    const dots = tile.getContext('2d')!;
    dots.fillStyle = '#a5c2aa';
    dots.fillRect(0, 0, 1, 1);
    dots.fillRect(3, 3, 1, 1);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat')!;
    ctx.globalAlpha = 0.19;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
    ctx.strokeStyle = '#c4d2b1';
    ctx.lineWidth = 0.45;
    ctx.globalAlpha = 0.3;
    ctx.stroke(this.land);
    ctx.globalAlpha = 1;
    if (settings.layer === 'sea') {
      const pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT),
        band = 1.3 + m.sea[1] * 5;
      for (let i = 0; i < this.coast.length; i++) {
        const alpha = Math.max(0, 1 - this.coast[i] / band) * 0.85;
        if (!alpha) continue;
        for (let c = 0; c < 3; c++)
          pixels.data[i * 4 + c] =
            pixels.data[i * 4 + c] * (1 - alpha) + [110, 227, 244][c] * alpha;
      }
      ctx.putImageData(pixels, 0, 0);
    }
    this.texture.needsUpdate = true;
    this.ice.forEach(({ root, current }) => {
      root.visible = settings.layer === 'ice';
      current.scale.setScalar(Math.cbrt(1 - m.glacierLoss / 100));
      current.position.y = (1 - Math.cbrt(1 - m.glacierLoss / 100)) * 0.065;
    });
    this.weather.group.visible = settings.layer === 'cyclone';
    this.dirty = true;
    this.schedule();
  }
  updateWeather(snapshot: WeatherSnapshot) {
    this.weather.update(snapshot, location, this.current.shear);
    this.host.dataset.weatherDay = snapshot.day.toFixed(2);
    this.host.dataset.stormCount = String(snapshot.storms.length);
    this.host.dataset.stormPositions = JSON.stringify(
      snapshot.storms.map(({ id, lat, lon }) => [id, lat, lon]),
    );
    if (this.current.layer === 'cyclone') {
      this.dirty = true;
      this.schedule();
    }
  }
  private schedule() {
    if (
      this.request ||
      this.disposed ||
      this.lost ||
      !this.active ||
      document.hidden
    )
      return;
    this.request = requestAnimationFrame(this.frame);
  }
  private frame = (now: number) => {
    this.request = 0;
    if (this.disposed || this.lost || !this.active || document.hidden) {
      this.last = 0;
      return;
    }
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now;
    const moving = this.rotating;
    try {
      if (this.rotating) {
        this.camera.position.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          dt * 0.045,
        );
        this.controls.update();
      }
      if (this.dirty || moving) {
        this.renderer.render(this.scene, this.camera);
        this.frames++;
        this.host.dataset.frames = String(this.frames);
        this.dirty = false;
      }
      if (moving) this.schedule();
      else this.last = 0;
    } catch {
      this.lost = true;
      this.onError('3D 화면을 그리지 못했습니다. 다시 시작해 주세요.');
    }
  };
  setMotion(rotate: boolean) {
    this.rotating = rotate;
    this.last = 0;
    this.schedule();
  }
  setActive(active: boolean) {
    this.active = active;
    this.last = 0;
    if (active) {
      this.dirty = true;
      this.schedule();
    }
  }
  focus(region: 'asia' | 'pacific' | 'arctic') {
    const [lat, lon] =
      region === 'pacific'
        ? [8, -145]
        : region === 'arctic'
          ? [70, 20]
          : [22, 125];
    this.camera.position.copy(location(lat, lon, 3.7));
    this.controls.update();
    this.dirty = true;
    this.schedule();
  }
  zoom(delta: number) {
    this.camera.position.setLength(
      Math.max(2.35, Math.min(5, this.camera.position.length() + delta)),
    );
    this.controls.update();
    this.dirty = true;
    this.schedule();
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.request);
    this.observer.disconnect();
    this.controls.dispose();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.renderer.domElement.removeEventListener(
      'webglcontextlost',
      this.onLost,
    );
    this.renderer.domElement.removeEventListener(
      'webglcontextrestored',
      this.onRestored,
    );
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.texture.dispose();
    this.weather.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

export async function loadGeography() {
  const response = await fetch(
    `${import.meta.env.BASE_URL}data/countries.geojson`,
  );
  if (!response.ok) throw new Error('지구 지리 자료를 불러오지 못했습니다.');
  return (await response.json()) as Geography;
}
