// Main App Initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('ParkHere: App initializing...');

  // ✅ Get all DOM elements after HTML loads
  const saveBtn = document.getElementById('saveBtn');
  const findBtn = document.getElementById('findBtn');
  const shareBtn = document.getElementById('shareBtn');
  const directionsBtn = document.getElementById('directionsBtn');
  const status = document.getElementById('status');
  const mapDiv = document.getElementById('map');
  const themeToggle = document.getElementById('themeToggle');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  const photoImg = document.getElementById('photoImg');
  const timer = document.getElementById('timer');
  const showQRBtn = document.getElementById('showQRBtn');
  const testVoiceBtn = document.getElementById('testVoiceBtn');
  const qrContainer = document.getElementById('qrContainer');
  const voiceSelect = document.getElementById('voiceSelect');
  const notifyTimeSelect = document.getElementById('notifyTime');
  const whatsappNumberInput = document.getElementById('whatsappNumber');
  const sendWABtn = document.getElementById('sendWABtn');
  const supportBtn = document.getElementById('supportBtn');
  const resetBtn = document.getElementById('resetBtn');
  const nearbyBtn = document.getElementById('nearbyBtn');
  const nearbyContainer = document.getElementById('nearbyContainer');

  // ✅ Safe gtag wrapper
  function trackEvent(action, category = 'Feature', label = '') {
    if (typeof gtag === 'function') {
      gtag('event', action, {
        'event_category': category,
        'event_label': label
      });
      console.log('Analytics event tracked:', { action, category, label });
    } else {
      console.warn('gtag not loaded yet', { action, category, label });
    }
  }

  // ✅ Update the map using Google Maps Embed
  // function updateMap(lat, lng) {
  // console.log('Updating map:', { lat, lng });
  //  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyD0iSWh-ke56m_qdHt1IWPnUb7r_Q40sII&center=${lat},${lng}&zoom=18`;
  //  mapDiv.style.display = 'block';
  //  mapDiv.innerHTML = `<iframe frameborder="0" style="border:0" src="${mapUrl}" allowfullscreen></iframe>`;
  // }
// ✅ Initialize Leaflet map
let leafletMap;

function updateMap(lat, lng) {
  mapDiv.style.display = 'block';

  if (!leafletMap) {
    leafletMap = L.map('map').setView([lat, lng], 18);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);
  } else {
    leafletMap.setView([lat, lng], 18);
  }

  if (leafletMap._marker) leafletMap.removeLayer(leafletMap._marker);
  leafletMap._marker = L.marker([lat, lng]).addTo(leafletMap);
}



// ✅ Theme Toggle
let isDark = false;

// Check localStorage
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
    console.log('Dark mode:', isDark);
  });
}
  
 
  // ✅ Get URL parameters
  const params = new URLSearchParams(window.location.search);

  // 🔍 Check if this is a shared link
  if (params.has('lat') && params.has('lng')) {
    console.log('Shared view detected:', params.toString());
    document.querySelectorAll('.shared-hide').forEach(el => el.style.display = 'none');
    document.querySelector('.container h1').textContent = '📍 Friend’s Parking Spot';
    status.textContent = `Parked at ${new Date(params.get('time')).toLocaleTimeString()}`;
    updateMap(parseFloat(params.get('lat')), parseFloat(params.get('lng')));

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

  const savedSpot = localStorage.getItem('parkingSpot');

  // ✅ Restore saved spot
  if (savedSpot) {

// Add this inside the "Restore saved spot" block
if (savedSpot && !params.has('lat')) {  // Only in owner view
  const spot = JSON.parse(savedSpot);
  const googleMapsBtn = document.createElement('button');
  googleMapsBtn.textContent = '🌐 View in Google Maps';
  googleMapsBtn.onclick = () => {
    window.open(`https://www.google.com/maps?q=${spot.lat},${spot.lng}`, '_blank');
  };
  document.querySelector('.container').appendChild(googleMapsBtn);
}
    
    try {
      const spot = JSON.parse(savedSpot);
      findBtn.disabled = false;
      shareBtn.disabled = false;
      showQRBtn.disabled = false;
      testVoiceBtn.disabled = false;
      directionsBtn.disabled = false;
      sendWABtn.disabled = false;
      supportBtn.disabled = false;
      resetBtn.disabled = false;
      nearbyBtn.disabled = false;
      status.textContent = `Parking saved on ${new Date(spot.time).toLocaleTimeString()}`;
      updateMap(spot.lat, spot.lng);
      console.log('Restored saved spot:', spot);
    } catch (e) {
      console.error('Failed to parse saved spot:', e);
      localStorage.removeItem('parkingSpot');
    }
  }

  // ✅ Restore photo
  const savedPhoto = localStorage.getItem('parkingPhoto');
  if (savedPhoto) {
    photoImg.src = savedPhoto;
    photoPreview.style.display = 'block';
    console.log('Restored photo preview');
  }

  // ✅ Restore notification time
  if (notifyTimeSelect) {
    const savedNotifyTime = localStorage.getItem('notifyTime') || '7200000';
    notifyTimeSelect.value = savedNotifyTime;
  }

  // ✅ Restore WhatsApp number
  if (whatsappNumberInput) {
    const savedWANumber = localStorage.getItem('whatsappNumber');
    if (savedWANumber) {
      whatsappNumberInput.value = savedWANumber;
    }
  }

  // ✅ Start live timer
  if (savedSpot) {
    const spot = JSON.parse(savedSpot);
    setInterval(() => {
      const parkedTime = new Date(spot.time);
      const now = new Date();
      const diff = Math.floor((now - parkedTime) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      if (timer) {
        timer.textContent = `🕒 Parked: ${hours}h ${minutes}m ${seconds}s`;
      }
    }, 1000);
  }

  // —————————————————————————————
  // Voice Selection (iOS-Friendly)
  // —————————————————————————————
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

    function getSelectedVoice() {
      const savedIndex = localStorage.getItem('preferredVoice');
      if (savedIndex !== null && voices[savedIndex]) {
        return voices[savedIndex];
      }
      return null;
    }

    populateVoiceList();
    setTimeout(populateVoiceList, 500);
    setTimeout(populateVoiceList, 1000);
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    voiceSelect.addEventListener('change', () => {
      localStorage.setItem('preferredVoice', voiceSelect.value);
      console.log('Voice preference saved:', voiceSelect.value);
    });

    window.getSelectedVoice = getSelectedVoice;
  } else if (voiceSelect) {
    voiceSelect.style.display = 'none';
    document.querySelector('label[for="voiceSelect"]').style.display = 'none';
  }

  // —————————————————————————————
  // Event Listeners
  // —————————————————————————————

  if (photoInput) {
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      // ✅ Use blob URL instead of data URL
      const blobUrl = URL.createObjectURL(file);
      photoImg.src = blobUrl;
      photoPreview.style.display = 'block';

      // Store blob URL in localStorage (note: blobs are not persistent after page reload)
      localStorage.setItem('parkingPhoto', blobUrl);
      localStorage.setItem('parkingPhotoFile', file.name); // Optional: track filename
    }
  });
}

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      trackEvent('click', 'Feature', 'Save My Parking Spot');
      status.textContent = 'Getting your location...';
      console.log('Requesting geolocation...');

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!status.textContent.includes('✅')) {
          status.textContent = '❌ Timed out getting location. Please try again.';
          console.warn('Geolocation timeout');
        }
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log('Geolocation success:', position);
          const { latitude, longitude } = position.coords;
          const notifyDelay = parseInt(notifyTimeSelect.value);
          const spot = {
            lat: latitude,
            lng: longitude,
            time: new Date().toISOString()
          };
          localStorage.setItem('parkingSpot', JSON.stringify(spot));
          localStorage.setItem('notifyTime', notifyDelay);
          findBtn.disabled = false;
          shareBtn.disabled = false;
          showQRBtn.disabled = false;
          testVoiceBtn.disabled = false;
          directionsBtn.disabled = false;
          sendWABtn.disabled = false;
          supportBtn.disabled = false;
          resetBtn.disabled = false;
          nearbyBtn.disabled = false;
          status.textContent = `✅ Parking saved! (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
          updateMap(latitude, longitude);
          if (timer) timer.textContent = '🕒 Parked: 0h 0m 0s';
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('Geolocation error:', error);
          let errorMsg = 'Unknown error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Location access denied. Please enable location.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Location unavailable. Check GPS/Wi-Fi.';
              break;
            case error.TIMEOUT:
              errorMsg = 'Location request timed out. Please try again.';
              break;
            default:
              errorMsg = error.message;
          }
          status.textContent = `❌ Error: ${errorMsg}`;
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  if (findBtn) {
    findBtn.addEventListener('click', () => {
      trackEvent('click', 'Feature', 'Find My Car');
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      speechSynthesis.cancel();
      updateMap(spot.lat, spot.lng);
      const time = new Date(spot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const utter = new SpeechSynthesisUtterance(`You parked at ${time}.`);
      utter.voice = window.getSelectedVoice ? window.getSelectedVoice() : null;
      utter.rate = 0.9;
      utter.pitch = 1;
      speechSynthesis.speak(utter);
      status.textContent = 'Calculating distance...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const R = 6371e3;
          const φ1 = pos.coords.latitude * Math.PI / 180;
          const φ2 = spot.lat * Math.PI / 180;
          const Δφ = (spot.lat - pos.coords.latitude) * Math.PI / 180;
          const Δλ = (spot.lng - pos.coords.longitude) * Math.PI / 180;
          const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          const distText = distance >= 1000 ? (distance/1000).toFixed(1) + ' km' : Math.round(distance) + ' m';
          status.textContent = `🚗 Your car is ${distText} away.`;
          const distUtter = new SpeechSynthesisUtterance(`Your car is ${Math.round(distance)} meters away.`);
          distUtter.voice = window.getSelectedVoice ? window.getSelectedVoice() : null;
          distUtter.rate = 0.8;
          speechSynthesis.speak(distUtter);
        },
        (err) => {
          status.textContent = 'Unable to get your location for distance.';
          console.error('Distance calculation error:', err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      trackEvent('click', 'Feature', 'Share My Spot');
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      if (navigator.share) {
        navigator.share({
          title: 'My Parking Spot',
          text: 'Here’s where I parked 🅿️ (via ParkHere)',
          url: 'https://tinyurl.com/parkhere-app'
        }).catch(err => console.log('Share canceled:', err));
      } else {
        navigator.clipboard.writeText('https://tinyurl.com/parkhere-app').then(() => {
          alert('Link copied to clipboard! (via tinyurl)');
        }).catch(err => {
          console.error('Failed to copy:', err);
          alert('Failed to copy link. Please try again.');
        });
      }
    });
  }

  if (directionsBtn) {
    directionsBtn.addEventListener('click', () => {
      trackEvent('click', 'Feature', 'Get Directions');
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      const dest = `${spot.lat},${spot.lng}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
      window.open(url, '_blank');
    });
  }

  if (showQRBtn && qrContainer) {
    showQRBtn.addEventListener('click', () => {
      trackEvent('click', 'Feature', 'Show QR Code');
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      const baseURL = 'https://parking-pwa-eight.vercel.app';
      const params = new URLSearchParams({
        lat: spot.lat,
        lng: spot.lng,
        time: spot.time
      });
      const shareURL = `${baseURL}?${params.toString()}`;
      qrContainer.querySelector('#qrcode').innerHTML = '';
      new QRCode(qrContainer.querySelector('#qrcode'), {
        text: shareURL,
        width: 128,
        height: 128
      });
      qrContainer.style.display = 'block';
    });
  }

  if (testVoiceBtn) {
    testVoiceBtn.addEventListener('click', () => {
      trackEvent('click', 'Feature', 'Test Voice');
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance('Hello, ParkHere is ready!');
        utter.voice = window.getSelectedVoice ? window.getSelectedVoice() : null;
        utter.rate = 0.9;
        utter.pitch = 1;
        speechSynthesis.speak(utter);
      } else {
        alert('Speech not supported.');
      }
    });
  }

  if (sendWABtn && whatsappNumberInput) {
    sendWABtn.addEventListener('click', () => {
      trackEvent('click', 'Feature', 'WhatsApp reminder');
      const spot = JSON.parse(localStorage.getItem('parkingSpot'));
      if (!spot) return;
      const number = whatsappNumberInput.value.trim();
      if (!number) {
        alert('Please enter a WhatsApp number in international format (e.g., +1234567890)');
        return;
      }
      const message = encodeURIComponent(
        `🅿️ ParkHere: I parked at ${new Date().toLocaleTimeString()}.\n\nTap to see location:\nhttps://tinyurl.com/parkhere-app`
      );
      const waURL = `https://wa.me/${number}?text=${message}`;
      window.open(waURL, '_blank');
    });
  }

  if (supportBtn) {
    supportBtn.addEventListener('click', () => {
      trackEvent('click', 'Support', 'Buy Me a Coffee');
      window.open('https://buymeacoffee.com/digitalchaos', '_blank');
    });
  }

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (!confirm('Are you sure you want to reset your parking spot?')) {
      return;
    }
    trackEvent('click', 'Feature', 'Reset Parking Spot');

    // Clear data
    localStorage.removeItem('parkingSpot');
    localStorage.removeItem('parkingPhoto');

    // Reset UI
    findBtn.disabled = true;
    shareBtn.disabled = true;
    showQRBtn.disabled = true;
    testVoiceBtn.disabled = true;
    directionsBtn.disabled = true;
    sendWABtn.disabled = true;
    resetBtn.disabled = true;
    nearbyBtn.disabled = true; // Disable nearby button too

    // Hide and clear photo preview
    photoPreview.style.display = 'none';
    photoImg.src = '';

    // Hide and clear map
    mapDiv.style.display = 'none';
    mapDiv.innerHTML = '';

    // Hide and clear QR code
    qrContainer.style.display = 'none';
    qrContainer.querySelector('#qrcode').innerHTML = '';

    // ✅ Hide and clear nearby places
    nearbyContainer.style.display = 'none';
    nearbyContainer.innerHTML = '';

    // Update status
    status.textContent = 'Parking spot reset.';
    if (timer) timer.textContent = '';
  });
}



// 🔍 Nearby Places Button
if (nearbyBtn) {
  nearbyBtn.addEventListener('click', async () => {
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

// ✅ Search using Photon (OpenStreetMap)
async function searchNearbyPhoton(lat, lng) {
  const radius = 1000; // 1km
  const types = ['restaurant', 'cafe', 'supermarket', 'shopping_mall', 'park', 'parking', 'fuel'];
  const results = {};

  for (const type of types) {
    const url = `https://photon.komoot.io/api/?lat=${lat}&lon=${lng}&radius=${radius}&q=${type}&limit=5`;
    const response = await fetch(url);
    const data = await response.json();
    results[type] = data.features || [];
  }

  return results;
}

// ✅ Display results
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
    if (places.length === 0) continue;
    html += `<h3 style="margin:15px 0 8px 0; color:#2c7be5;">${labels[type]}</h3>`;
    places.slice(0, 5).forEach(place => {
      const dist = computeDistance(spot.lat, spot.lng, place.geometry.coordinates[1], place.geometry.coordinates[0]);
      const distText = dist >= 1000 ? (dist/1000).toFixed(1) + ' km' : dist + ' m';
      const name = place.properties.name || 'Unknown';
      const address = place.properties.street || place.properties.osm_id ? 'Nearby' : '';
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

// Add after updateMap()
const googleMapsBtn = document.createElement('button');
googleMapsBtn.textContent = '🌐 View in Google Maps';
googleMapsBtn.onclick = () => {
  const spot = JSON.parse(localStorage.getItem('parkingSpot'));
  window.open(`https://www.google.com/maps?q=${spot.lat},${spot.lng}`, '_blank');
};
document.querySelector('.container').appendChild(googleMapsBtn);


});
