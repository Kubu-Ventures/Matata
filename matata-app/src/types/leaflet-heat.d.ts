// leaflet.heat has no official type definitions and no @types package.
// This augments the 'leaflet' module with the minimal shape this app uses
// (`L.heatLayer(...)`), so the rest of the codebase gets type-checking
// without pulling in an untyped `require`.
import 'leaflet';

declare module 'leaflet' {
  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatLayerOptions
  ): Layer;
}
