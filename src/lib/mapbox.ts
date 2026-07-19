export type MapInstance = {
  addControl: (control: unknown) => void;
  fitBounds?: (bounds: unknown, options?: Record<string, unknown>) => void;
  flyTo: (options: { center: [number, number]; zoom: number }) => void;
  on: (event: "load" | "error", listener: () => void) => void;
  off: (event: "load" | "error", listener: () => void) => void;
  remove: () => void;
};

export type MarkerInstance = {
  setLngLat: (coords: [number, number]) => MarkerInstance;
  addTo: (map: MapInstance) => MarkerInstance;
  remove?: () => void;
};

export type Mapbox = {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => MapInstance;
  Marker: new (element?: HTMLElement) => MarkerInstance;
  NavigationControl: new () => unknown;
  LngLatBounds?: new () => { extend: (coords: [number, number]) => unknown };
};

declare global {
  interface Window { mapboxgl?: Mapbox }
}

const SCRIPT_URL = "https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.js";
const STYLESHEET_URL = "https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.css";
let pending: Promise<Mapbox> | null = null;
let scriptPending: Promise<Mapbox> | null = null;
let stylesheetPending: Promise<void> | null = null;

function loadScript(): Promise<Mapbox> {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (scriptPending) return scriptPending;
  scriptPending = new Promise<Mapbox>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    const script = existing ?? document.createElement("script");
    const loaded = () => {
      script.removeEventListener("error", failed);
      if (window.mapboxgl) resolve(window.mapboxgl);
      else failed();
    };
    const failed = () => {
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
      scriptPending = null;
      script.remove();
      reject(new Error("Không tải được thư viện Mapbox. Hãy kiểm tra kết nối rồi thử lại."));
    };
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!existing) {
      script.src = SCRIPT_URL;
      script.async = true;
      document.head.append(script);
    } else if (["complete", "loaded"].includes((script as HTMLScriptElement & { readyState?: string }).readyState ?? "")) {
      failed();
    }
  });
  return scriptPending;
}

function loadStylesheet(): Promise<void> {
  if (stylesheetPending) return stylesheetPending;
  const existing = document.querySelector<HTMLLinkElement>(`link[href="${STYLESHEET_URL}"]`);
  if (existing?.dataset.mapboxLoaded === "true" || existing?.sheet) return Promise.resolve();

  stylesheetPending = new Promise<void>((resolve, reject) => {
    const stylesheet = existing ?? document.createElement("link");
    const loaded = () => {
      stylesheet.removeEventListener("error", failed);
      stylesheet.dataset.mapboxLoaded = "true";
      resolve();
    };
    const failed = () => {
      stylesheet.removeEventListener("load", loaded);
      stylesheet.removeEventListener("error", failed);
      stylesheetPending = null;
      stylesheet.remove();
      reject(new Error("Không tải được kiểu hiển thị Mapbox. Hãy kiểm tra kết nối rồi thử lại."));
    };
    stylesheet.addEventListener("load", loaded, { once: true });
    stylesheet.addEventListener("error", failed, { once: true });
    if (!existing) {
      stylesheet.rel = "stylesheet";
      stylesheet.href = STYLESHEET_URL;
      document.head.append(stylesheet);
    }
  });
  return stylesheetPending;
}

export function loadMapbox(): Promise<Mapbox> {
  if (pending) return pending;
  pending = Promise.allSettled([loadStylesheet(), loadScript()])
    .then(([stylesheet, script]) => {
      if (stylesheet.status === "rejected" || script.status === "rejected") {
        throw new Error("Không tải được Mapbox. Hãy kiểm tra kết nối rồi thử lại.");
      }
      return script.value;
    })
    .catch((error) => {
      pending = null;
      throw error;
    });

  return pending;
}
