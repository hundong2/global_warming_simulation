import * as THREE from 'three';

/** A raster union removes internal country borders from the coast highlight. */
export function coastDistances(land: Path2D, width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = 'white';
  ctx.fill(land, 'evenodd');
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const distance = new Uint16Array(width * height).fill(999);
  for (let y = 1; y < height - 1; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x,
        next = y * width + ((x + 1) % width);
      const inside = pixels[i * 4 + 3] > 127;
      if (
        inside !== pixels[next * 4 + 3] > 127 ||
        inside !== pixels[(i + width) * 4 + 3] > 127
      )
        distance[i] = 0;
    }
  for (let i = width; i < distance.length; i++)
    distance[i] = Math.min(
      distance[i],
      distance[i - width] + 1,
      i % width ? distance[i - 1] + 1 : 999,
    );
  for (let i = distance.length - width - 1; i >= 0; i--)
    distance[i] = Math.min(
      distance[i],
      distance[i + width] + 1,
      i % width < width - 1 ? distance[i + 1] + 1 : 999,
    );
  return distance;
}
export function glacierVisual() {
  const root = new THREE.Group(),
    current = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.058, 0.045);
  shape.lineTo(-0.014, 0.079);
  shape.lineTo(0.058, 0.039);
  shape.lineTo(0.044, -0.009);
  shape.lineTo(0.013, -0.09);
  shape.lineTo(-0.018, -0.101);
  shape.lineTo(-0.034, -0.035);
  shape.closePath();
  const base = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      color: '#f5c778',
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    }),
  );
  root.add(base);
  const outline = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      shape.getPoints().map((p) => new THREE.Vector3(p.x, p.y, 0.003)),
    ),
    new THREE.LineBasicMaterial({
      color: '#f9d18e',
      transparent: true,
      opacity: 0.85,
    }),
  );
  root.add(outline);
  const ice = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.014,
      bevelEnabled: true,
      bevelSize: 0.004,
      bevelThickness: 0.004,
      bevelSegments: 1,
      steps: 1,
    }),
    new THREE.MeshPhongMaterial({
      color: '#d8f5ff',
      emissive: '#417f94',
      emissiveIntensity: 0.5,
      flatShading: true,
    }),
  );
  current.add(ice);
  for (const x of [-0.025, 0, 0.023]) {
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(0.027, 0.055, 4),
      new THREE.MeshPhongMaterial({ color: '#f2fcff', flatShading: true }),
    );
    peak.rotation.x = Math.PI / 2;
    peak.position.set(x, 0.034, 0.024);
    current.add(peak);
  }
  root.add(current);
  return { root, current };
}
