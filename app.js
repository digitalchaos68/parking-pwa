// DOM Elements
const saveBtn = document.getElementById('saveBtn');
const findBtn = document.getElementById('findBtn');
const shareBtn = document.getElementById('shareBtn');
const showQRBtn = document.getElementById('showQRBtn');
const testVoiceBtn = document.getElementById('testVoiceBtn');
const qrContainer = document.getElementById('qrContainer');
const status = document.getElementById('status');
const mapDiv = document.getElementById('map');
const themeToggle = document.getElementById('themeToggle');


const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const photoImg = document.getElementById('photoImg');

const timer = document.getElementById('timer'); // Make sure you have <div id="timer"></div> in HTML

// Update the map using Google Maps Embed
function updateMap(lat, lng) {
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyD0iSWh-ke56m_qdHt1IWPnUb7r_Q40sII&center=${lat},${lng}&zoom=18`;
  mapDiv.style.display = 'block';
  mapDiv.innerHTML = `<iframe frameborder="0" style="border:0" src="${mapUrl}" allowfullscreen></iframe>`;
}

// Request notification permission
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

// Theme Toggle
let isDark = false;
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  themeToggle.textContent = '☀️ Light Mode';
  isDark = true;
}

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('darkMode', isDark);
});

// On Load

// Main App Initialization
document.addEventListener('DOMContentLoaded', () => {

const voiceSelect = document.getElementById('voiceSelect');
let voices = [];

// Load voices
function loadVoices() {
  voices = speechSynthesis.getVoices();
  const defaultVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];

  voiceSelect.innerHTML = '';
  voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voices.indexOf(voice);
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });

  if (defaultVoice) voiceSelect.value = voices.indexOf(defaultVoice);
}

// On voice change
voiceSelect.addEventListener('change', () => {
  localStorage.setItem('preferredVoice', voiceSelect.value);
});

// Get selected voice
function getSelectedVoice() {
  const savedIndex = localStorage.getItem('preferredVoice');
  return voices[savedIndex] || null;
}

// Initialize
if ('speechSynthesis' in window) {
  loadVoices();
  // Safari needs this hack
  setTimeout(loadVoices, 500);
  speechSynthesis.onvoiceschanged = loadVoices;
}


  const params = new URLSearchParams(window.location.search);

  // Check if this is a shared link (has lat/lng)
  if (params.has('lat') && params.has('lng')) {
    // Hide all elements with class 'shared-hide'
    document.querySelectorAll('.shared-hide').forEach(el => {
      el.style.display = 'none';
    });

    // Update UI for shared view
    document.querySelector('.container h1').textContent = '📍 Friend’s Parking Spot';
    status.textContent = `Parked at ${new Date(params.get('time')).toLocaleTimeString()}`;

    // Show map
    updateMap(parseFloat(params.get('lat')), parseFloat(params.get('lng')));

    // Add Back button
    const backButton = document.createElement('button');
    backButton.textContent = '🔙 Back to My Parking';
    backButton.onclick = () => {
      window.location.href = './';
    };
    document.querySelector('.container').appendChild(backButton);

    return; // Exit early — don't run normal app logic
  }

  // —————————————————————————————
  // Normal App Logic (Owner View)
  // —————————————————————————————

  requestNotificationPermission();

  const savedSpot = localStorage.getItem('parkingSpot');

  // Restore saved spot
if (savedSpot) {
  const spot = JSON.parse(savedSpot);
  findBtn.disabled = false;
  shareBtn.disabled = false;
  showQRBtn.disabled = false;
  testVoiceBtn.disabled = false;
  status.textContent = `Parking saved on ${new Date(spot.time).toLocaleTimeString()}`;
  updateMap(spot.lat, spot.lng);

  // Start live timer
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

  // Schedule notification
  const notifyDelay = parseInt(localStorage.getItem('notifyTime') || '7200000');
  const parkedTime = new Date(spot.time);
  const now = new Date();
  const diffMs = now - parkedTime;

  if (diffMs < notifyDelay) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('🕒 Park Reminder', {
          body: 'You’ve been parked for a while!',
          icon: 'image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🅿️</text></svg>'
        });
      }
    }, notifyDelay - diffMs);
  }
}

  // Restore photo
  const savedPhoto = localStorage.getItem('parkingPhoto');
  if (savedPhoto) {
    photoImg.src = savedPhoto;
    photoPreview.style.display = 'block';
  }

  // Restore notification time dropdown
  const notifyTimeSelect = document.getElementById('notifyTime');
  if (notifyTimeSelect) {
    const savedNotifyTime = localStorage.getItem('notifyTime') || '7200000';
    notifyTimeSelect.value = savedNotifyTime;
  }
});
// Photo Upload
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

// Save Location
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    status.textContent = 'Getting your location...';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const notifyDelay = parseInt(document.getElementById('notifyTime').value);

        const spot = {
          lat: latitude,
          lng: longitude,
          time: new Date().toISOString()
        };

        localStorage.setItem('parkingSpot', JSON.stringify(spot));
        localStorage.setItem('notifyTime', notifyDelay); // Save user's choice

        findBtn.disabled = false;
        status.textContent = `✅ Parking saved! (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
        updateMap(latitude, longitude);

        // Reset timer
        if (timer) timer.textContent = '🕒 Parked: 0h 0m 0s';
      },
      (error) => {
        console.error("Geolocation error:", error);
        status.textContent = `❌ Error: ${error.message}`;
      },
      { timeout: 10000 }
    );
  });
}

// Find My Car
if (findBtn) {
  findBtn.addEventListener('click', () => {
    const spot = JSON.parse(localStorage.getItem('parkingSpot'));
    if (!spot) return;

    // Cancel any previous speech
    speechSynthesis.cancel();

    // Update map immediately
    updateMap(spot.lat, spot.lng);

    // ✅ Speak parking time (within user gesture)
    const time = new Date(spot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const utter = new SpeechSynthesisUtterance(`You parked at ${time}.`);
    utter.voice = getSelectedVoice();
    utter.rate = 0.9;
    utter.pitch = 1;
    speechSynthesis.speak(utter);
    // Get distance
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

        // ✅ Speak distance
        const distUtter = new SpeechSynthesisUtterance(`Your car is ${Math.round(distance)} meters away.`);
        distUtter.rate = 0.8;
        speechSynthesis.speak(distUtter);
      },
      (err) => {
        status.textContent = 'Unable to get your location for distance.';
        console.error("Distance error:", err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Share My Spot
if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    const spot = JSON.parse(localStorage.getItem('parkingSpot'));
    if (!spot) return;

    const baseURL = 'https://parking-pwa-eight.vercel.app';
    const params = new URLSearchParams({
      lat: spot.lat,
      lng: spot.lng,
      time: spot.time
    });

    const shareURL = `${baseURL}?${params.toString()}`;

    if (navigator.share) {
      navigator.share({
        title: 'My Parking Spot',
        text: 'Here’s where I parked 🅿️',
        url: shareURL
      }).catch(err => console.log('Share canceled', err));
    } else {
      navigator.clipboard.writeText(shareURL).then(() => {
        alert('Parking link copied to clipboard!\nShare it with your friends.');
      });
    }
  });
}


// Enable QR button if spot exists
if (savedSpot) {
  showQRBtn.disabled = false;
}

// Generate QR Code
showQRBtn.addEventListener('click', () => {
  const spot = JSON.parse(localStorage.getItem('parkingSpot'));
  if (!spot) return;

  const baseURL = 'https://parking-pwa-eight.vercel.app';
  const params = new URLSearchParams({
    lat: spot.lat,
    lng: spot.lng,
    time: spot.time
  });
  const shareURL = `${baseURL}?${params.toString()}`;

  // Clear previous QR
  qrContainer.querySelector('#qrcode').innerHTML = '';
  
  // Generate new QR
  new QRCode(qrContainer.querySelector('#qrcode'), {
    text: shareURL,
    width: 128,
    height: 128
  });

  qrContainer.style.display = 'block';
});


const testVoiceBtn = document.getElementById('testVoiceBtn');

testVoiceBtn.addEventListener('click', () => {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance('Hello, ParkHere is ready!');
    utter.voice = getSelectedVoice();
    utter.rate = 0.9;
    utter.pitch = 1;
    speechSynthesis.speak(utter);
  } else {
    alert('Speech not supported on this device.');
  }
});