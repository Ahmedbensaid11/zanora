import React, { useEffect, useRef } from 'react';

const loadLeaflet = () => {
  return new Promise((resolve) => {
    if (window.L) {
      resolve(window.L);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    document.body.appendChild(script);
  });
};

export const OntarioMap = ({ cityClusterMap = {} }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const initMap = async () => {
      const L = await loadLeaflet();
      if (mapInstanceRef.current) mapInstanceRef.current.remove();

      const ontarioCenter = [51.2538, -85.3232];
      const map = L.map(mapRef.current, { center: ontarioCenter, zoom: 5, minZoom: 4, maxZoom: 8 });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap, ©CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      const cities = [
        { name: 'Thunder Bay', lat: 48.3809, lng: -89.2477 },
        { name: 'Sudbury', lat: 46.4917, lng: -80.9930 },
        { name: 'Timmins', lat: 48.4758, lng: -81.3304 },
        { name: 'Ottawa', lat: 45.4215, lng: -75.6972 },
        { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
        { name: 'Hamilton', lat: 43.2557, lng: -79.8711 },
        { name: 'London', lat: 42.9849, lng: -81.2453 },
        { name: 'Windsor', lat: 42.3149, lng: -83.0364 },
        { name: 'Kitchener', lat: 43.4516, lng: -80.4925 },
        { name: 'Mississauga', lat: 43.5890, lng: -79.6441 },
        { name: 'Barrie', lat: 44.3894, lng: -79.6903 }
      ];

      const getClusterColor = (clusterLabel) => {
        if (clusterLabel === "Low Usage") return "#4ade80";
        if (clusterLabel === "Balanced") return "#3b82f6";
        if (clusterLabel === "High Usage") return "#ef4444";
        return "#94a3b8";
      };

      cities.forEach(city => {
        const cluster = cityClusterMap[city.name];
        const color = getClusterColor(cluster);

        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([city.lat, city.lng], { icon: customIcon }).addTo(map);
        const clusterEmoji = cluster === "Low Usage" ? "🟩 Low Usage" :
                             cluster === "Balanced" ? "🟦 Balanced" :
                             cluster === "High Usage" ? "🟥 High Usage" : "⚪ No Data";
        marker.bindPopup(`<div style="background:#1e293b;color:white;padding:12px;border-radius:8px;border:1px solid ${color};">
          <div style="font-weight:600;margin-bottom:8px">${city.name}</div>
          <div style="color:${color}">${clusterEmoji}</div>
        </div>`);
      });
    };

    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [cityClusterMap]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};
