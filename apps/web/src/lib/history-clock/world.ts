/**
 * Country outlines for the History Clock map, projected on the server so the
 * browser receives ready-made SVG paths instead of the topology and d3.
 * Source: Natural Earth 1:110m via the world-atlas package (public domain).
 */
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { regions } from "./regions";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 470;

export type CountryShape = { id: string; name: string; d: string };
export type Pin = { regionId: string; x: number; y: number };

const ANTARCTICA = "010";

export function worldShapes(): { countries: CountryShape[]; pins: Pin[] } {
  const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  const collection = feature(topology, topology.objects.countries) as FeatureCollection<
    Geometry,
    { name: string }
  >;
  const land = {
    ...collection,
    features: collection.features.filter((f) => f.id !== ANTARCTICA),
  };
  const projection = geoNaturalEarth1().fitExtent(
    [
      [6, 6],
      [MAP_WIDTH - 6, MAP_HEIGHT - 6],
    ],
    land,
  );
  const path = geoPath(projection).digits(1);

  const countries = land.features
    .map((f) => ({ id: String(f.id ?? ""), name: f.properties.name, d: path(f) ?? "" }))
    .filter((c) => c.d);

  const pins = regions.flatMap((r) => {
    if (!r.pin) return [];
    const point = projection(r.pin);
    return point ? [{ regionId: r.id, x: Math.round(point[0] * 10) / 10, y: Math.round(point[1] * 10) / 10 }] : [];
  });

  return { countries, pins };
}
