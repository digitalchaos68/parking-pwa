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

  // ✅ Safe gtag wrapper (prevents "gtag is not defined")
  function trackEvent(action, category = 'Feature', label = '') {
    if (typeof gtag === 'function') {
      gtag('event', action, {
        'event_category': category,
        'event_label': label
      });
    }
  }

  // 🗺️ Initialize Leaflet map
  let leafletMap;

function updateMap(lat, lng) {
  // ✅ Safety check
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
    console.warn('updateMap called with invalid coordinates:', { lat, lng });
    return;
  }

  // ✅ Show map container
  mapDiv.style.display = 'block';

  // ✅ Create map only once
  if (!leafletMap) {
    leafletMap = L.map('map').setView([lat, lng], 18);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);
  } else {
    // ✅ Just update view if map exists
    leafletMap.setView([lat, lng], 18);
  }

  // ✅ Update or create marker
  if (leafletMap._marker) {
    leafletMap.removeLayer(leafletMap._marker);
  }
  leafletMap._marker = L.marker([lat, lng]).addTo(leafletMap);
}

  // 🔍 Reverse Geocode using Photon (OpenStreetMap)
async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
    console.warn('Invalid coordinates in reverseGeocode:', { lat, lng });
    return 'Unknown Location';
  }

  try {
    const response = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
    const data = await response.json();
    const name = data.features?.[0]?.properties?.name;
    return name || `Parking Spot at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch (err) {
    console.warn('Reverse geocode failed:', err);
    return `Parking Spot at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// 🔍 Find Nearby Places using Photon
async function searchNearbyPhoton(lat, lng) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
    console.warn('Invalid coordinates:', { lat, lng });
    return {};
  }

  // Define bounding box (~1km)
  const west = lng - 0.01;
  const south = lat - 0.01;
  const east = lng + 0.01;
  const north = lat + 0.01;

  const typeMap = [
    { 
      type: 'park', 
      term: 'park', 
      filter: (place) => 
        (place.class === 'leisure' && place.type === 'park') ||
        (place.name && place.name.toLowerCase().includes('park'))
    },
    { 
      type: 'supermarket', 
      term: 'supermarket', 
      filter: (place) => 
        (place.class === 'shop' && place.type === 'supermarket') ||
        (place.name && place.name.toLowerCase().includes('supermarket'))
    },
{ 
  type: 'shopping_mall', 
  term: 'mall', 
  filter: (place) => 
    (place.name && (
      place.name.toLowerCase().includes('mall') || 
      place.name.toLowerCase().includes('shopping centre') || 
      place.name.toLowerCase().includes('shopping center')
    )) ||
    (place.display_name && (
      place.display_name.toLowerCase().includes('mall') || 
      place.display_name.toLowerCase().includes('shopping centre') || 
      place.display_name.toLowerCase().includes('shopping center')
    )) ||
    (place.type && (
      place.type.toLowerCase().includes('mall') || 
      place.type.toLowerCase().includes('centre') || 
      place.type.toLowerCase().includes('center')
    ))
},
    { 
      type: 'restaurant', 
      term: 'restaurant', 
      filter: (place) => 
        (place.class === 'amenity' && place.type === 'restaurant') ||
        (place.name && place.name.toLowerCase().includes('restaurant'))
    },
    { 
      type: 'cafe', 
      term: 'cafe', 
      filter: (place) => 
        (place.class === 'amenity' && place.type === 'cafe') ||
        (place.name && place.name.toLowerCase().includes('cafe'))
    },
    { 
      type: 'parking', 
      term: 'car park', 
      filter: (place) => 
        (place.class === 'amenity' && place.type === 'parking') ||
        (place.name && place.name.toLowerCase().includes('parking'))
    },
    { 
      type: 'fuel', 
      term: 'fuel', 
      filter: (place) => 
        (place.class === 'amenity' && place.type === 'fuel') ||
        (place.name && place.name.toLowerCase().includes('fuel'))
    }
  ];

  const results = {};

  for (const item of typeMap) {
    const { type, term, filter } = item;
    const url = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(term)}&format=json&viewbox=${west},${south},${east},${north}&bounded=1&limit=10`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ParkHere/1.0 (https://parking-pwa-eight.vercel.app; jason@digitalchaos.com.sg)'
        }
      });
      const data = await response.json();

      results[type] = data
        .filter(filter)
        .map(place => ({
          geometry: {
            coordinates: [parseFloat(place.lon), parseFloat(place.lat)]
          },
          properties: {
            name: place.name || 'Unnamed',
            street: place.address?.road || place.address?.pedestrian || place.address?.suburb || 'Nearby'
          }
        }));
    } catch (err) {
      console.warn(`Search failed for ${type}:`, err);
      results[type] = [];
    }
  }

  // ✅ Special case: Car Parks — use direct OSM tag search
  try {
    const url = `https://nominatim.openstreetmap.org/search?amenity=parking&format=json&bounded=1&viewbox=${west},${south},${east},${north}&limit=5`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ParkHere/1.0 (https://parking-pwa-eight.vercel.app; jason@digitalchaos.com.sg)'
      }
    });
    const data = await response.json();

    results.parking = data.map(place => ({
      geometry: {
        coordinates: [parseFloat(place.lon), parseFloat(place.lat)]
      },
      properties: {
        name: place.name || 'Car Park',
        street: place.address?.road || place.address?.pedestrian || 'Nearby'
      }
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
    if (!places || places.length === 0) continue;
    const label = labels[type];
    if (!label) continue;

    html += `<h3 style="margin:15px 0 8px 0; color:#2c7be5;">${label}</h3>`;
    places.slice(0, 5).forEach(place => {
      const dist = computeDistance(spot.lat, spot.lng, place.geometry.coordinates[1], place.geometry.coordinates[0]);
      const distText = dist >= 1000 ? (dist/1000).toFixed(1) + ' km' : dist + ' m';
      const name = place.properties.name || 'Unknown';
      const address = place.properties.street || 'Nearby';

      html += `<div class="nearby-place">
        <h4>${name}</h4>
        <p>📍 ${distText} away</p>
        <p><small>${address}</small></p>
      </div>`;
    });
  }

  nearbyContainer.innerHTML = html || '<p>📭 No nearby places found.</p>';
}

  // ✅ Distance helper (haversine formula)
  function computeDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
  }

  // 🔔 Request notification permission
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  // 🌙 Theme Toggle
  let isDark = false;
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    if (themeToggle) themeToggle.textContent = '☀️ Light Mode';
    isDark = true;
  }

  if (themeToggle) {
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
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
        status.textContent = '❌ Invalid location received';
        return;
      }

      // ✅ Reverse geocode to get location name
      const locationName = await reverseGeocode(lat, lng);

      // ✅ Save spot with locationName
      const spot = {
        lat,
        lng,
        time: new Date().toISOString(),
        locationName
      };
      localStorage.setItem('parkingSpot', JSON.stringify(spot));

      // ✅ Clear nearby results (new fix!)
      nearbyContainer.innerHTML = '';
      nearbyContainer.style.display = 'none';

      // ✅ Update UI
      updateMap(lat, lng);
      findBtn.disabled = false;
      shareBtn.disabled = false;
      showQRBtn.disabled = false;
      directionsBtn.disabled = false;
      nearbyBtn.disabled = false;
      resetBtn.disabled = false;
      sendWABtn.disabled = false;

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
    trackEvent('click', 'Feature', 'Find My Car');
    const spot = JSON.parse(localStorage.getItem('parkingSpot'));
    if (!spot) {
      status.textContent = '❌ No parking spot saved.';
      return;
    }

    // ✅ Cancel any ongoing speech
    speechSynthesis.cancel();

    // ✅ Update map
    updateMap(spot.lat, spot.lng);

    // ✅ Get time parked
    const parkedTime = new Date(spot.time);
    const now = new Date();
    const diffMs = now - parkedTime;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const time = parkedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ✅ Format duration for speech
    let durationText = '';
    if (hours === 0) {
      durationText = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      durationText = `${hours} hour${hours !== 1 ? 's' : ''}`;
      if (minutes > 0) {
        durationText += ` and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }
    }

    // ✅ Check if locationName is meaningful
    const isMeaningfulLocation = spot.locationName &&
      !spot.locationName.startsWith('Parking Spot at') &&
      !spot.locationName.includes('Unknown') &&
      spot.locationName.trim().length > 0;

    // ✅ Build voice message
    let baseMessage = `You parked at ${time}`;
    if (isMeaningfulLocation) {
      baseMessage += ` near ${spot.locationName}`;
    }
    baseMessage += ` for ${durationText}.`;

    // ✅ Speak the message
    const utter = new SpeechSynthesisUtterance(baseMessage);
    utter.voice = window.getSelectedVoice ? window.getSelectedVoice() : null;
    utter.rate = 0.9;
    utter.pitch = 1;
    speechSynthesis.speak(utter);

    // ✅ Show status
    status.textContent = `🚗 Parked for ${hours ? hours + 'h ' : ''}${minutes}m.`;

    // ✅ ALWAYS calculate and announce distance (user wants to know how far their car is)
    navigator.geolocation.getCurrentPosition((pos) => {
      const R = 6371e3;
      const φ1 = pos.coords.latitude * Math.PI / 180;
      const φ2 = spot.lat * Math.PI / 180;
      const Δφ = (spot.lat - pos.coords.latitude) * Math.PI / 180;
      const Δλ = (spot.lng - pos.coords.longitude) * Math.PI / 180;
      const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      const distText = Math.round(distance);

      // ✅ Wait for first message to finish
      setTimeout(() => {
        const distUtter = new SpeechSynthesisUtterance(`Your car is ${distText} meters away.`);
        distUtter.voice = window.getSelectedVoice ? window.getSelectedVoice() : null;
        distUtter.rate = 0.8;
        speechSynthesis.speak(distUtter);
      }, 2000); // Adjust based on message length

      // ✅ Update status with distance
      status.textContent = `🚗 Your car is ${distText} meters away.`;
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

      const shareData = {
        title: 'My Parking Spot',
        text: `I parked at ${spot.locationName}`,
        url: `${window.location.origin}/?lat=${spot.lat}&lng=${spot.lng}&time=${spot.time}&photo=${encodeURIComponent(photoImg.src || '')}`
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          trackEvent('share', 'Feature', 'Web Share API');
        } catch (err) {
          console.log('Share cancelled');
        }
      } else {
        // Fallback: Copy to clipboard
        const url = shareData.url;
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

      const url = `${window.location.origin}/?lat=${spot.lat}&lng=${spot.lng}&time=${spot.time}&photo=${encodeURIComponent(photoImg.src || '')}`;
      const qrcodeDiv = document.getElementById('qrcode');
      qrcodeDiv.innerHTML = ''; // Clear previous QR
      new QRCode(qrcodeDiv, {
        text: url,
        width: 128,
        height: 128
      });
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
      trackEvent('click', 'Feature', 'Nearby Places');
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;

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

  // 🔊 Test Voice
  if (testVoiceBtn && 'speechSynthesis' in window) {
    testVoiceBtn.addEventListener('click', () => {
      const msg = new SpeechSynthesisUtterance('This is a voice test');
      const selectedVoice = voiceSelect.value;
      msg.voice = speechSynthesis.getVoices().find(v => v.name === selectedVoice);
      speechSynthesis.speak(msg);
    });

    // Populate voice select
    speechSynthesis.onvoiceschanged = () => {
      const voices = speechSynthesis.getVoices();
      voiceSelect.innerHTML = '';
      voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });
    };
    speechSynthesis.getVoices(); // Trigger voices load
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
      if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
      }
      mapDiv.style.display = 'none';
      status.textContent = '✅ Parking spot reset.';
      if (timer) timer.textContent = '';
      findBtn.disabled = true;
      shareBtn.disabled = true;
      showQRBtn.disabled = true;
      directionsBtn.disabled = true;
      nearbyBtn.disabled = true;
      resetBtn.disabled = true;
      sendWABtn.disabled = true;
      photoPreview.style.display = 'none';
      document.getElementById('qrContainer').style.display = 'none';
      nearbyContainer.style.display = 'none';
      trackEvent('click', 'Action', 'Reset Parking Spot');
    });
  }

  // —————————————————————————————
  // Shared View Logic (When URL has ?lat=...&lng=...)
  // —————————————————————————————
  const params = new URLSearchParams(window.location.search);
  if (params.has('lat') && params.has('lng')) {
    // Hide owner-only buttons
    document.querySelectorAll('.shared-hide').forEach(el => el.style.display = 'none');

    // Show map with shared location
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    updateMap(lat, lng);

    // Add Back button
    const backButton = document.createElement('button');
    backButton.textContent = '🔙 Back to My Parking';
    backButton.addEventListener('click', () => {
      console.log('Back to My Parking clicked');
      window.location.href = './';
    });
    document.querySelector('.container').appendChild(backButton);

    return; // Exit early — don't run normal app logic
  }

  // —————————————————————————————
  // Normal App Logic (Owner View)
  // —————————————————————————————
  requestNotificationPermission();
  const savedSpot = localStorage.getItem('parkingSpot');

  // ✅ Restore saved spot
  if (savedSpot) {
    const spot = JSON.parse(savedSpot);
    updateMap(spot.lat, spot.lng);
    status.textContent = `📍 Parking spot restored: ${spot.locationName}`;
    findBtn.disabled = false;
    shareBtn.disabled = false;
    showQRBtn.disabled = false;
    directionsBtn.disabled = false;
    nearbyBtn.disabled = false;
    resetBtn.disabled = false;
    sendWABtn.disabled = false;
    if (photoImg.src) {
      photoPreview.style.display = 'block';
    }
  }
});