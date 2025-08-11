// Main App Initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('ParkHere: App initializing...');

  // ✅ Get all DOM elements after HTML loads
  const saveBtn = document.getElementById('saveBtn');
  const findBtn = document.getElementById('findBtn');
  const shareBtn = document.getElementById('shareBtn');
  const showQRBtn = document.getElementById('showQRBtn');
  const directionsBtn = document.getElementById('directionsBtn');
  const nearbyBtn = document.getElementById('nearbyBtn');
  const status = document.getElementById('status');
  const mapDiv = document.getElementById('map');
  const themeToggle = document.getElementById('themeToggle');
  const resetBtn = document.getElementById('resetBtn');
  const supportBtn = document.getElementById('supportBtn');
  const timer = document.getElementById('timer');
  const photoInput = document.getElementById('photoInput');
  const photoImg = document.getElementById('photoImg');
  const photoPreview = document.getElementById('photoPreview');
  const voiceSelect = document.getElementById('voiceSelect');
  const testVoiceBtn = document.getElementById('testVoiceBtn');
  const whatsappNumber = document.getElementById('whatsappNumber');
  const sendWABtn = document.getElementById('sendWABtn');
  const nearbyContainer = document.getElementById('nearbyContainer');

  // ✅ Safe gtag wrapper
  function trackEvent(action, category = 'Feature', label = '') {
    if (typeof gtag === 'function') {
      gtag('event', action, { 'event_category': category, 'event_label': label });
    }
  }

  // 🗺️ Initialize Leaflet map
  let leafletMap;

  function updateMap(lat, lng) {
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coordinates in updateMap:', { lat, lng });
      return;
    }
    mapDiv.style.display = 'block';
    if (!leafletMap) {
      leafletMap = L.map('map').setView([lat, lng], 18);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap);
    } else {
      leafletMap.setView([lat, lng], 18);
    }
    if (leafletMap._marker) leafletMap.removeLayer(leafletMap._marker);
    leafletMap._marker = L.marker([lat, lng]).addTo(leafletMap);
  }

  // 🔍 Reverse Geocode
  async function reverseGeocode(lat, lng) {
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
      return 'Unknown Location';
    }
    try {
      const response = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.features?.[0]?.properties?.name || `Parking Spot at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch (err) {
      console.warn('Reverse geocode failed:', err);
      return `Parking Spot at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  // ✅ Distance helper
  function computeDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  }

  // 🔍 Find Nearby Places
  async function searchNearbyPhoton(lat, lng) {
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return {};

    const delta = 0.03;
    const west = lng - delta;
    const south = lat - delta;
    const east = lng + delta;
    const north = lat + delta;

    const typeMap = [
      { type: 'park', term: 'park', filter: (p) => (p.class === 'leisure' && p.type === 'park') || (p.name && p.name.toLowerCase().includes('park')) },
      { type: 'supermarket', term: 'supermarket', filter: (p) => (p.class === 'shop' && p.type === 'supermarket') || (p.name && p.name.toLowerCase().includes('supermarket')) },
      { 
        type: 'shopping_mall', 
        term: 'mall', 
        filter: (p) => 
          (p.name && (p.name.toLowerCase().includes('mall') || p.name.toLowerCase().includes('shopping centre') || p.name.toLowerCase().includes('shopping center'))) ||
          (p.display_name && (p.display_name.toLowerCase().includes('mall') || p.display_name.toLowerCase().includes('shopping centre') || p.display_name.toLowerCase().includes('shopping center')))
      },
      { type: 'restaurant', term: 'restaurant', filter: (p) => (p.class === 'amenity' && p.type === 'restaurant') || (p.name && p.name.toLowerCase().includes('restaurant')) },
      { type: 'cafe', term: 'cafe', filter: (p) => (p.class === 'amenity' && p.type === 'cafe') || (p.name && p.name.toLowerCase().includes('cafe')) },
      { type: 'fuel', term: 'fuel', filter: (p) => (p.class === 'amenity' && p.type === 'fuel') || (p.name && p.name.toLowerCase().includes('fuel')) }
    ];

    const results = {};

    for (const item of typeMap) {
      const { type, term, filter } = item;
      const url = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(term)}&format=json&viewbox=${west},${south},${east},${north}&bounded=1&limit=10`;
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'ParkHere/1.0 (https://parking-pwa-eight.vercel.app; jason@digitalchaos.com.sg)' }
        });
        const data = await response.json();
        results[type] = data
          .filter(filter)
          .map(place => ({
            geometry: { coordinates: [parseFloat(place.lon), parseFloat(place.lat)] },
            raw: place,
            properties: { name: place.name || 'Unnamed' }
          }));
      } catch (err) {
        console.warn(`Search failed for ${type}:`, err);
        results[type] = [];
      }
    }

    // ✅ Car Parks
    try {
      const url = `https://nominatim.openstreetmap.org/search?amenity=parking&format=json&viewbox=${west},${south},${east},${north}&bounded=1&limit=5`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'ParkHere/1.0 (https://parking-pwa-eight.vercel.app; jason@digitalchaos.com.sg)' }
      });
      const data = await response.json();
      results.parking = data.map(place => ({
        geometry: { coordinates: [parseFloat(place.lon), parseFloat(place.lat)] },
        raw: place,
        properties: { name: place.name || 'Car Park' }
      }));
    } catch (err) {
      console.warn('Search failed for parking:', err);
      results.parking = [];
    }

    return results;
  }

  // ✅ Display Nearby Results
  function displayNearbyResults(results, spot) {
    let html = '';
    const labels = {
      restaurant: '🍽️ Restaurants',
      cafe: '☕ Cafes',
      supermarket: '🛒 Supermarkets',
      shopping_mall: '🛍️ Shopping Malls',
      park: '🌳 Parks',
      parking: '🅿️ Carparks',
      fuel: '⛽ Gas Stations'
    };

    for (const [type, places] of Object.entries(results)) {
      if (!places.length) continue;
      const label = labels[type];
      if (!label) continue;
      html += `<h3 style="margin:15px 0 8px 0; color:#2c7be5;">${label}</h3>`;
      places.slice(0, 5).forEach(place => {
        const dist = computeDistance(spot.lat, spot.lng, place.geometry.coordinates[1], place.geometry.coordinates[0]);
        const distText = dist >= 1000 ? (dist/1000).toFixed(1) + ' km' : dist + ' m';
        const name = place.properties.name;
        const address = getPlaceAddress(place.raw) || 'Nearby';
        const [lng, lat] = place.geometry.coordinates;
        const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        html += `<div class="nearby-place">
          <h4><a href="${mapUrl}" target="_blank" style="color:inherit;text-decoration:none;">${name}</a></h4>
          <p>📍 ${distText} away</p>
          <p><small>${address}</small></p>
        </div>`;
      });
    }
    nearbyContainer.innerHTML = html || '<p>📭 No nearby places found.</p>';
  }

  function getPlaceAddress(place) {
    if (!place || !place.display_name) return 'Nearby';
    const parts = place.display_name.split(',');
    return parts
      .map(p => p.trim())
      .filter(p => p && !['Singapore', 'SG', 'Central', 'Ang Mo Kio'].includes(p) && !/^\d{6}$/.test(p) && !/^\d+$/.test(p) && !p.includes('.'))
      .slice(-2)
      .join(', ') || 'Nearby';
  }

  // 🔔 Request notification permission
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  // 🌙 Theme Toggle
  let isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) document.body.classList.add('dark');
  if (themeToggle) {
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    themeToggle.addEventListener('click', () => {
      isDark = !isDark;
      document.body.classList.toggle('dark', isDark);
      themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
      localStorage.setItem('darkMode', isDark);
      trackEvent('toggle', 'UI', isDark ? 'Dark Mode' : 'Light Mode');
    });
  }

  // 📷 Photo Upload
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoImg.src = e.target.result;
          photoPreview.style.display = 'block';
          trackEvent('upload', 'Photo', 'Parking Spot Photo');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 📍 Save My Parking Spot
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      status.textContent = '📍 Getting your location...';
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
          status.textContent = '❌ Invalid location';
          return;
        }
        const locationName = await reverseGeocode(lat, lng);
        const spot = { lat, lng, time: new Date().toISOString(), locationName, photo: photoImg.src || '' };
        localStorage.setItem('parkingSpot', JSON.stringify(spot));
        nearbyContainer.innerHTML = '';
        nearbyContainer.style.display = 'none';
        updateMap(lat, lng);
        [findBtn, shareBtn, showQRBtn, directionsBtn, nearbyBtn, resetBtn, sendWABtn].forEach(btn => btn.disabled = false);
        status.textContent = `✅ Parking saved: ${locationName}`;
        if (timer) timer.textContent = '';
        trackEvent('click', 'Action', 'Save Parking Spot');
      }, (err) => {
        status.textContent = `❌ Error: ${err.message}`;
      }, { enableHighAccuracy: true });
    });
  }

  // 🧭 Find My Car
  if (findBtn) {
    findBtn.addEventListener('click', () => {
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) {
        status.textContent = '❌ No parking spot saved.';
        return;
      }
      trackEvent('click', 'Feature', 'Find My Car');
      speechSynthesis.cancel();
      updateMap(spot.lat, spot.lng);
      const parkedTime = new Date(spot.time);
      const now = new Date();
      const diffMs = now - parkedTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const time = parkedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let durationText = hours === 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
      const isMeaningfulLocation = spot.locationName && !spot.locationName.startsWith('Parking Spot at') && !spot.locationName.includes('Unknown');
      const baseMessage = `You parked at ${time}${isMeaningfulLocation ? ` near ${spot.locationName}` : ''} for ${durationText}.`;
      const utter = new SpeechSynthesisUtterance(baseMessage);
      utter.voice = window.getSelectedVoice ? window.getSelectedVoice() : null;
      utter.rate = 0.9;
      utter.pitch = 1;
      speechSynthesis.speak(utter);
      status.textContent = `🚗 Parked for ${hours ? hours + 'h ' : ''}${minutes}m.`;
      navigator.geolocation.getCurrentPosition((pos) => {
        const distance = computeDistance(pos.coords.latitude, pos.coords.longitude, spot.lat, spot.lng);
        setTimeout(() => {
          const distUtter = new SpeechSynthesisUtterance(`Your car is ${distance} meters away.`);
          distUtter.voice = window.getSelectedVoice ? window.getSelectedVoice() : null;
          distUtter.rate = 0.8;
          speechSynthesis.speak(distUtter);
        }, 2000);
        status.textContent = `🚗 Your car is ${distance} meters away.`;
      }, (err) => {
        console.warn('Failed to get current location for distance:', err);
        status.textContent = '📍 Unable to get your location for distance.';
      }, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  // 📤 Share My Spot
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      const url = `${window.location.origin}/?lat=${spot.lat}&lng=${spot.lng}&time=${spot.time}&photo=${encodeURIComponent(spot.photo || '')}`;
      const shareData = { title: 'My Parking Spot', text: `I parked at ${spot.locationName}`, url };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          trackEvent('share', 'Feature', 'Web Share API');
        } catch (err) {
          console.log('Share cancelled:', err);
          navigator.clipboard.writeText(url).then(() => {
            status.textContent = '🔗 Link copied to clipboard!';
            trackEvent('click', 'Feature', 'Copy Share Link');
          });
        }
      } else {
        navigator.clipboard.writeText(url).then(() => {
          status.textContent = '🔗 Link copied to clipboard!';
          trackEvent('click', 'Feature', 'Copy Share Link');
        });
      }
    });
  }

  // 🔲 Show QR Code
  if (showQRBtn && typeof QRCode !== 'undefined') {
    showQRBtn.addEventListener('click', () => {
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      const url = `${window.location.origin}/?lat=${spot.lat}&lng=${spot.lng}&time=${spot.time}&photo=${encodeURIComponent(spot.photo || '')}`;
      const qrcodeDiv = document.getElementById('qrcode');
      qrcodeDiv.innerHTML = '';
      new QRCode(qrcodeDiv, { text: url, width: 128, height: 128 });
      document.getElementById('qrContainer').style.display = 'block';
      trackEvent('click', 'Feature', 'Show QR Code');
    });
  }

  // 🗺️ Get Directions
  if (directionsBtn) {
    directionsBtn.addEventListener('click', () => {
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
      window.open(url, '_blank');
      trackEvent('click', 'Feature', 'Get Directions');
    });
  }

  // 🔍 Nearby Places Button
  if (nearbyBtn) {
    nearbyBtn.addEventListener('click', async () => {
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      trackEvent('click', 'Feature', 'Nearby Places');
      nearbyContainer.innerHTML = '<p>🔍 Searching for nearby places...</p>';
      nearbyContainer.style.display = 'block';
      try {
        const results = await searchNearbyPhoton(spot.lat, spot.lng);
        displayNearbyResults(results, spot);
      } catch (err) {
        console.error('Nearby search failed:', err);
        nearbyContainer.innerHTML = `<p>❌ Failed: ${err.message}</p>`;
      }
    });
  }

  // 💬 Save Reminder in WhatsApp
  if (sendWABtn) {
    sendWABtn.addEventListener('click', () => {
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot || !whatsappNumber.value) return;
      const url = `${window.location.origin}/?lat=${spot.lat}&lng=${spot.lng}&time=${spot.time}`;
      const text = encodeURIComponent(`I parked at ${spot.locationName}. Here's the location: ${url}`);
      const waUrl = `https://wa.me/${whatsappNumber.value}?text=${text}`;
      window.open(waUrl, '_blank');
      trackEvent('click', 'Feature', 'Send to WhatsApp');
    });
  }

  // ☕ Support This App
  if (supportBtn) {
    supportBtn.addEventListener('click', () => {
      window.open('https://buymeacoffee.com/digitalchaos', '_blank');
      trackEvent('click', 'CTA', 'Support App');
    });
  }

  // 🗑️ Reset Parking Spot
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('parkingSpot');
      if (leafletMap) { leafletMap.remove(); leafletMap = null; }
      mapDiv.style.display = 'none';
      [findBtn, shareBtn, showQRBtn, directionsBtn, nearbyBtn, resetBtn, sendWABtn].forEach(btn => btn.disabled = true);
      status.textContent = '✅ Parking spot reset.';
      if (timer) timer.textContent = '';
      photoPreview.style.display = 'none';
      document.getElementById('qrContainer').style.display = 'none';
      nearbyContainer.style.display = 'none';
      trackEvent('click', 'Action', 'Reset Parking Spot');
    });
  }

  // —————————————————————————————
  // Shared View Logic
  // —————————————————————————————
  const params = new URLSearchParams(window.location.search);
  if (params.has('lat') && params.has('lng')) {
    document.querySelectorAll('.shared-hide').forEach(el => el.style.display = 'none');
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    updateMap(lat, lng);
    const backButton = document.createElement('button');
    backButton.textContent = '🔙 Back to My Parking';
    backButton.addEventListener('click', () => {
      console.log('Back to My Parking clicked');
      window.location.href = './';
    });
    document.querySelector('.container').appendChild(backButton);
    return;
  }

  // —————————————————————————————
  // Normal App Logic (Owner View)
  // —————————————————————————————
  requestNotificationPermission();
  const savedSpot = localStorage.getItem('parkingSpot');
  if (savedSpot) {
    const spot = JSON.parse(savedSpot);
    updateMap(spot.lat, spot.lng);
    status.textContent = `📍 Parking spot restored: ${spot.locationName}`;
    [findBtn, shareBtn, showQRBtn, directionsBtn, nearbyBtn, resetBtn, sendWABtn].forEach(btn => btn.disabled = false);
    if (spot.photo) {
      photoImg.src = spot.photo;
      photoPreview.style.display = 'block';
    }
  }
});