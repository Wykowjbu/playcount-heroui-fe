import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export type { Map, Marker, NavigationControl, LngLatBounds } from "mapbox-gl";

export function getMapbox() {
  return mapboxgl;
}
