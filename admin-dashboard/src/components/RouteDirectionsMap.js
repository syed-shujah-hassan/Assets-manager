import React from 'react';
import { buildGoogleDirectionsEmbedUrl, buildGoogleDirectionsUrl } from '../utils/mapsDirections';

const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

export default function RouteDirectionsMap({
  origin,
  destination,
  originLabel = 'Start',
  destinationLabel = 'Emergency',
  loading = false,
}) {
  if (!destination?.lat || !destination?.lng) {
    return <p className="detail-map-missing">Emergency location coordinates are missing.</p>;
  }

  if (loading) {
    return <p className="detail-map-hint">Loading route start point…</p>;
  }

  if (!origin?.lat || !origin?.lng) {
    return (
      <>
        <p className="detail-map-missing">
          Allow browser location (or assign a responder with GPS) to show the full driving route.
        </p>
        <p className="detail-coords">
          Emergency: {destination.lat}, {destination.lng}
        </p>
      </>
    );
  }

  if (!GOOGLE_KEY) {
    return (
      <p className="detail-map-missing">
        Add REACT_APP_GOOGLE_MAPS_API_KEY in admin-dashboard/.env to show the route map.
      </p>
    );
  }

  const embedUrl = buildGoogleDirectionsEmbedUrl(GOOGLE_KEY, origin, destination);
  const openUrl = buildGoogleDirectionsUrl(origin, destination);

  return (
    <>
      <p className="detail-map-hint">
        <strong>{originLabel}</strong> → <strong>{destinationLabel}</strong> (full road route, like inDrive)
      </p>
      <p className="detail-coords">
        From: {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)} → To: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
      </p>
      <div className="request-map-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.open(openUrl, '_blank', 'noopener,noreferrer')}>
          Open full route in Google Maps
        </button>
      </div>
      <iframe
        title="Driving route map"
        className="request-map-embed request-map-embed-route"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        src={embedUrl}
      />
    </>
  );
}
