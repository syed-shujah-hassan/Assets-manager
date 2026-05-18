export type MapPoint = { lat: number; lng: number };

/** Opens Google Maps app/site with full driving route. */
export function buildGoogleDirectionsUrl(origin: MapPoint, destination: MapPoint) {
  const o = `${origin.lat},${origin.lng}`;
  const d = `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&travelmode=driving`;
}

/** Embedded map with the same driving route (needs Maps Embed API enabled on the key). */
export function buildGoogleDirectionsEmbedUrl(apiKey: string, origin: MapPoint, destination: MapPoint) {
  const key = encodeURIComponent(apiKey);
  return `https://www.google.com/maps/embed/v1/directions?key=${key}&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving`;
}
