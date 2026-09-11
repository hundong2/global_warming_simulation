export type GeoGeometry = {
  type: string;
  coordinates: number[][][] | number[][][][];
};
export type Geography = { features: { geometry: GeoGeometry }[] };
export type LandQuery = (latitude: number, longitude: number) => boolean;
function insideRing(x: number, y: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
export function createLandQuery(data: Geography): LandQuery {
  const polygons = data.features
    .flatMap((feature) =>
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates as number[][][]]
        : (feature.geometry.coordinates as number[][][][]),
    )
    .map((rings) => {
      const xs = rings[0].map((p) => p[0]),
        ys = rings[0].map((p) => p[1]);
      return {
        rings,
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    });
  return (lat, longitude) => {
    const lon = ((((longitude + 180) % 360) + 360) % 360) - 180;
    return polygons.some(
      (p) =>
        lon >= p.minX &&
        lon <= p.maxX &&
        lat >= p.minY &&
        lat <= p.maxY &&
        insideRing(lon, lat, p.rings[0]) &&
        !p.rings.slice(1).some((r) => insideRing(lon, lat, r)),
    );
  };
}
