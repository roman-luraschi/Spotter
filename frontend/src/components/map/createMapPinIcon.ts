import { divIcon, type DivIcon } from 'leaflet'

export function createMapPinIcon(color: string, letter: string): DivIcon {
  return divIcon({
    className: 'map-pin-icon',
    html: `
      <div class="map-pin" style="--pin-color: ${color}">
        <span class="map-pin-label">${letter}</span>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -38],
  })
}
