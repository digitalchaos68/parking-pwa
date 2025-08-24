
  // ✅ Safe gtag wrapper
  function trackEvent(action, category = 'Feature', label = '') {
    if (typeof gtag === 'function') {
      gtag('event', action, { 'event_category': category, 'event_label': label });
    }
  }
  
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
  const qrContainer = document.getElementById('qrContainer'); // ✅ Added



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
    { 
      type: 'shopping_mall', 
      term: 'mall', 
      filter: (place) => {
        const name = place.name?.toLowerCase() || '';
        const displayName = place.display_name?.toLowerCase() || '';
        return name.includes('mall') || 
               name.includes('shopping centre') || 
               name.includes('shopping center') ||
               displayName.includes('mall') || 
               displayName.includes('shopping centre') || 
               displayName.includes('shopping center');
      }
    },
    { type: 'park', term: 'park', filter: (p) => (p.class === 'leisure' && p.type === 'park') || (p.name && p.name.toLowerCase().includes('park')) },
    { type: 'supermarket', term: 'supermarket', filter: (p) => (p.class === 'shop' && p.type === 'supermarket') || (p.name && p.name.toLowerCase().includes('supermarket')) },
    { type: 'restaurant', term: 'restaurant', filter: (p) => (p.class === 'amenity' && p.type === 'restaurant') || (p.name && p.name.toLowerCase().includes('restaurant')) },
    { type: 'cafe', term: 'cafe', filter: (p) => (p.class === 'amenity' && p.type === 'cafe') || (p.name && p.name.toLowerCase().includes('cafe')) },
    { type: 'fuel', term: 'fuel', filter: (p) => (p.class === 'amenity' && p.type === 'fuel') || (p.name && p.name.toLowerCase().includes('fuel')) }
  ];

  const results = {};

  // ✅ Search for all types except parking
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

  // ✅ Special case: Car Parks — use direct OSM tag search
  try {
    const url = `https://nominatim.openstreetmap.org/search?amenity=parking&format=json&viewbox=${west},${south},${east},${north}&bounded=1&limit=5`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ParkHere/1.0 (https://parking-pwa-eight.vercel.app; jason@digitalchaos.com.sg)' }
    });
    const data = await response.json();

    results.parking = data.map(place => ({
      geometry: {
        coordinates: [parseFloat(place.lon), parseFloat(place.lat)]
      },
      raw: place,
      properties: {
        name: place.name || 'Car Park'
      }
    }));
  } catch (err) {
    console.warn('Search failed for parking:', err);
    results.parking = [];
  }

  // ✅ Special case: Shopping Malls — use q=mall
  try {
    const url = `https://nominatim.openstreetmap.org/search.php?q=mall&format=json&viewbox=${west},${south},${east},${north}&bounded=1&limit=10`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ParkHere/1.0 (https://parking-pwa-eight.vercel.app; jason@digitalchaos.com.sg)' }
    });
    const data = await response.json();

    results.shopping_mall = data.map(place => ({
      geometry: {
        coordinates: [parseFloat(place.lon), parseFloat(place.lat)]
      },
      raw: place,
      properties: {
        name: place.name || 'Unnamed'
      }
    }));

    console.log('✅ Final mall results:', results.shopping_mall);
  } catch (err) {
    console.warn('Search failed for shopping_mall:', err);
    results.shopping_mall = [];
  }

  return results;
}
  


// ✅ Display Nearby Results - Show 6 Nearest Per Type
function displayNearbyResults(results, spot) {

    // ✅ LOG 5: Results received by display function
    console.log('📥 Results received by displayNearbyResults:', results);

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

      // ✅ LOG 6: Processing this type
      console.log(`📊 Processing ${type}:`, places);

    // ✅ Sort places by distance (nearest first)
    const sortedPlaces = places
      .map(place => {
        const dist = computeDistance(
          spot.lat,
          spot.lng,
          place.geometry.coordinates[1],
          place.geometry.coordinates[0]
        );
        return { ...place, distance: dist };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6); // ✅ Take only the 6 nearest

    html += `<h3 style="margin:15px 0 8px 0; color:#2c7be5;">${label}</h3>`;
    sortedPlaces.forEach(place => {
      const distText = place.distance >= 1000 
        ? (place.distance / 1000).toFixed(1) + ' km' 
        : place.distance + ' m';
      const name = place.properties.name;
      const address = getPlaceAddress(place.raw) || 'Nearby';
      const [lng, lat] = place.geometry.coordinates;
      const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      html += `<div class="nearby-place">
        <h4>
          <a href="${mapUrl}" target="_blank">${name}</a>
        </h4>
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

function hideAds() {
  const adContainer = document.getElementById('ad-container');
  if (adContainer) {
    adContainer.classList.add('ad-hidden');
  }
}
// ✅ Load Ads with full policy compliance
let adLoaded = false; // Prevents duplicate pushes


// ✅ Load Ads with full policy compliance
let adLoaded = false; // Prevents duplicate pushes

function loadAds() {
  console.log('ParkHere Ads: Attempting to load ads...');
  const adContainer = document.getElementById('ad-container');
  
  if (!adContainer) {
    console.warn('ParkHere Ads: Ad container not found in DOM');
    return;
  }

  // Check if meaningful content is present
  const hasContent = Boolean(
    document.querySelector('#map') || 
    document.querySelector('.nearby-place') || 
    document.querySelector('#photoPreview') || 
    document.querySelector('#voiceSelect') ||
    JSON.parse(localStorage.getItem('parkingSpot'))
  );

  if (!hasContent) {
    console.warn('ParkHere Ads: No meaningful content detected; ads not loaded.');
    adContainer.classList.add('ad-hidden');
    return;
  }

  console.log('ParkHere Ads: Meaningful content detected, preparing to load ad...');
  adContainer.classList.remove('ad-hidden');

  // Only push once
  if (adLoaded) {
    console.log('ParkHere Ads: Ad already loaded, skipping push');
    return;
  }

  // Wait for AdSense script to load
  if (!window.adsbygoogle) {
    console.warn('ParkHere Ads: adsbygoogle not loaded yet, retrying...');
    setTimeout(loadAds, 500);
    return;
  }

  // Delay to ensure DOM is fully rendered
  setTimeout(() => {
    try {
      console.log('ParkHere Ads: Executing adsbygoogle.push()');
      if (adContainer && !adContainer.classList.contains('ad-hidden')) {
        (adsbygoogle = window.adsbygoogle || []).push({});
        adLoaded = true;
        console.log('ParkHere Ads: Ad request sent successfully');
      }
    } catch (err) {
      console.error('ParkHere Ads: AdSense push failed:', err);
      adLoaded = false; // Reset so it can retry later
    }
  }, 300);
}


// ✅ Reset ad state on navigation or reload
function resetAds() {
  adLoaded = false;
  const adContainer = document.getElementById('ad-container');
  if (adContainer) {
    adContainer.classList.add('ad-hidden');
    console.log('Ad hidden successfully');
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

  // 📸 Photo Upload
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const dataUrl = event.target.result;
          photoImg.src = dataUrl;
          photoPreview.style.display = 'block';
          localStorage.setItem('parkingPhoto', dataUrl);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ✅ Save My Parking Spot
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

        // ✅ Save spot
        const spot = {
          lat,
          lng,
          time: new Date().toISOString(),
          locationName
        };
        localStorage.setItem('parkingSpot', JSON.stringify(spot));

        // ✅ Save photo separately (as Data URL)
        if (photoImg.src) {
          localStorage.setItem('parkingPhoto', photoImg.src);
        }

        // ✅ Clear nearby results
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

      // ✅ ✅ ✅ CRITICAL FIX: Load ads immediately after saving
      loadAds();

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
      const url = `${window.location.origin}/?lat=${spot.lat}&lng=${spot.lng}&time=${spot.time}`;
      const shareData = { 
        title: 'My Parking Spot', 
        text: `I parked at ${spot.locationName}`, 
        url 
      };
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
  if (showQRBtn && typeof QRCode !== 'undefined' && qrContainer) {
    showQRBtn.addEventListener('click', () => {
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      const url = `${window.location.origin}/?lat=${spot.lat}&lng=${spot.lng}&time=${spot.time}`;
      const qrcodeDiv = document.getElementById('qrcode');
      qrcodeDiv.innerHTML = ''; // Clear previous QR
      new QRCode(qrcodeDiv, {
        text: url,
        width: 128,
        height: 128
      });
      qrContainer.style.display = 'block';
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
        
        // ✅ LOG 7: Results before display
        console.log('🎯 Final results before display:', results);

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
      const photo = localStorage.getItem('parkingPhoto') || '';
      const url = `${window.location.origin}/?lat=${spot.lat}&lng=${spot.lng}&time=${spot.time}&photo=${encodeURIComponent(photo)}`;
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
      localStorage.removeItem('parkingPhoto');
      if (leafletMap) { leafletMap.remove(); leafletMap = null; }
      mapDiv.style.display = 'none';
      [findBtn, shareBtn, showQRBtn, directionsBtn, nearbyBtn, resetBtn, sendWABtn].forEach(btn => btn.disabled = true);
      status.textContent = '✅ Parking spot reset.';
      if (timer) timer.textContent = '';
      photoPreview.style.display = 'none';
      document.getElementById('qrContainer').style.display = 'none';
      nearbyContainer.style.display = 'none';
      trackEvent('click', 'Action', 'Reset Parking Spot');

    // ✅ Hide ads and allow reload
  resetAds();
    // ✅ ✅ ✅ CRITICAL FIX: Load ads immediately after reset (if you want to show ads on empty state)
    // Note: Usually you don't load ads here, but if you have a "featured" ad, you might.
    // For now, we skip loadAds() here.

    });
  }

  // Hide tips if previously dismissed
if (localStorage.getItem('parkingTipsDismissed') === 'true') {
  const tips = document.getElementById('parking-tips');
  if (tips) tips.style.display = 'none';
}

// Toggle visibility of content and placeholder
const toggleParkingTips = () => {
  const content = document.getElementById('parking-tips-content');
  const placeholder = document.getElementById('parking-tips-placeholder');
  const isMinimized = content.style.display === 'none';

  content.style.display = isMinimized ? 'block' : 'none';
  placeholder.style.display = isMinimized ? 'none' : 'block';
  localStorage.setItem('parkingTipsMinimized', !isMinimized);
};

// Attach to button
// document.querySelector('#parking-tips button').addEventListener('click', toggleParkingTips);

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
    findBtn.disabled = false;
    shareBtn.disabled = false;
    showQRBtn.disabled = false;
    directionsBtn.disabled = false;
    nearbyBtn.disabled = false;
    resetBtn.disabled = false;
    sendWABtn.disabled = false;

    // ✅ Restore photo
    const savedPhoto = localStorage.getItem('parkingPhoto');
    if (savedPhoto) {
      photoImg.src = savedPhoto;
      photoPreview.style.display = 'block';
    }


  // ✅ ✅ ✅ CRITICAL FIX: Load ads immediately after restoring saved spot
  loadAds();
    } else {
  // Hide ads or prevent loading
  hideAds();
  }

  // 🔊 Voice Selection (Robust, iOS-Compatible)
  if ('speechSynthesis' in window && voiceSelect) {
    let voices = [];

    function populateVoiceList() {
      voices = speechSynthesis.getVoices();
      voiceSelect.innerHTML = '';
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'System Voice';
      voiceSelect.appendChild(defaultOption);

      voices.forEach((voice, i) => {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });

      const savedIndex = localStorage.getItem('preferredVoice');
      if (savedIndex !== null && voices[savedIndex]) {
        voiceSelect.value = savedIndex;
      }
    }

    // ✅ Test Voice Button
    if (testVoiceBtn) {
      testVoiceBtn.addEventListener('click', () => {
        const msg = new SpeechSynthesisUtterance('This is a voice test');
        const selectedVoice = window.getSelectedVoice();
        if (selectedVoice) msg.voice = selectedVoice;
        msg.rate = 0.9;
        msg.pitch = 1;
        speechSynthesis.speak(msg);
      });
    }

    // ✅ Populate voices
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    // ✅ Fallback: iOS and slow browsers
    setTimeout(populateVoiceList, 500);
    setTimeout(populateVoiceList, 1000);
    setTimeout(populateVoiceList, 2000);

    // ✅ Save selection
    voiceSelect.addEventListener('change', () => {
      localStorage.setItem('preferredVoice', voiceSelect.value);
    });

    // ✅ Expose for other functions
    window.getSelectedVoice = function() {
      const savedIndex = voiceSelect.value;
      if (savedIndex === '' || savedIndex === null) return null;
      return voices[savedIndex] || null;
    };
  } else if (voiceSelect) {
    // Hide voice controls if not supported
    voiceSelect.style.display = 'none';
    const label = document.querySelector('label[for="voiceSelect"]');
    if (label) label.style.display = 'none';
    if (testVoiceBtn) testVoiceBtn.style.display = 'none';
  }
});

// Random Parking Tip
const parkingTips = [
  "Did you know? In many cities, you must park within 12 inches of the curb.",
  "Always check for 'No Parking' signs with specific hours — they can be easy to miss.",
  "Using a dashcam? Point it toward your parking spot for extra security.",
  "In cold climates, clear all snow from your car — including the roof — before driving.",
  "Never park over a storm drain — it’s often a violation and can cause flooding.",
  "When parking on a hill, turn your wheels: left when facing downhill, right when uphill.",
  "Use your car’s sun visor to mark your parking spot if you’re in a large lot.",
  "Avoid parking under trees — sap, bird droppings, or falling branches can damage your car.",
  "Always lock your car and hide valuables from view to deter theft.",
  "Check for fire hydrants — parking too close can result in a fine or towing.",
  "In busy areas, note nearby landmarks or building numbers to help find your car.",
  "If parking in a garage, take a photo of the floor level and zone letter/number.",
  "Use your phone’s camera to take a panoramic shot of your surroundings when parking.",
  "Some cities require you to turn headlights off when parked — check local rules.",
  "Be cautious of parking near construction zones — scaffolding or equipment may block your exit.",
  "In narrow streets, leave enough space for other cars to open doors safely.",
  "If parking overnight, choose a well-lit area to increase safety.",
  "Double-check that your parking brake is engaged, especially on slopes.",
  "Avoid parking in areas with low-hanging branches — they can scratch your roof or windows.",
  "In residential zones, be mindful of resident-only parking restrictions.",
  "Keep an emergency kit in your car — especially useful if you’re parked far from help.",
  "Use a parking app or PWA like ParkHere to save your exact location with a photo.",
  "If parking at an airport, compare long-term vs. short-term rates — sometimes shuttles are cheaper.",
  "In multi-level parking, use a reminder app to note your level and section.",
  "Be aware of street cleaning schedules — parking during cleaning hours can lead to fines.",
  "When parking in a lot, try to park close to a corner or wall — it reduces the chance of dings.",
  "If parking in the rain, leave a window slightly open to prevent fogging (if safe).",
  "In high-theft areas, consider using a steering wheel lock for added security.",
  "Always check for towing warnings — some private lots tow without notice.",
  "Use your car’s built-in navigation to 'save location' if your phone battery is low."
];

// Display a random parking tip
if (document.getElementById('parking-tip')) {
  const randomIndex = Math.floor(Math.random() * parkingTips.length);
  document.getElementById('parking-tip').textContent = parkingTips[randomIndex];
}


// ✅ Toggle Info Panel
const infoToggle = document.getElementById('infoToggle');
const infoPanel = document.getElementById('infoPanel');

if (infoToggle && infoPanel) {
  // Set initial state: hidden
  infoPanel.style.display = 'none';
  infoToggle.textContent = 'ℹ️ Info & Tips';

  infoToggle.addEventListener('click', () => {
    const isHidden = infoPanel.style.display === 'none';
    infoPanel.style.display = isHidden ? 'block' : 'none';
    infoToggle.textContent = isHidden ? '❌ Hide Info & Tips' : 'ℹ️ Info & Tips';
    trackEvent('click', 'UI', isHidden ? 'Expand Info Panel' : 'Collapse Info Panel');
  });
}

// ✅ Open Learn Page
const learnBtn = document.getElementById('learnBtn');
if (learnBtn) {
  learnBtn.addEventListener('click', () => {
    // Navigate within the same tab
    window.location.href = 'https://parking-pwa-eight.vercel.app/learn.html';
    trackEvent('click', 'Navigation', 'Open Learn Page');
  });
}