// DOM Elements

  const mapDiv = document.getElementById('map');


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

// Main App Initialization
document.addEventListener('DOMContentLoaded', () => {
    // ✅ Get all elements after HTML loads
  const saveBtn = document.getElementById('saveBtn');
  const findBtn = document.getElementById('findBtn');
  const shareBtn = document.getElementById('shareBtn');
  const status = document.getElementById('status');
  const mapDiv = document.getElementById('map');
  const themeToggle = document.getElementById('themeToggle');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  const photoImg = document.getElementById('photoImg');
  const timer = document.getElementById('timer');
  const showQRBtn = document.getElementById('showQRBtn');      // ✅
  const testVoiceBtn = document.getElementById('testVoiceBtn'); // ✅
  const qrContainer = document.getElementById('qrContainer');   // ✅
  const voiceSelect = document.getElementById('voiceSelect');
  const notifyTimeSelect = document.getElementById('notifyTime');

  // Get URL parameters
  const params = new URLSearchParams(window.location.search);

  // Check if this is a shared link
  if (params.has('lat') && params.has('lng')) {
    // Hide all elements with class 'shared-hide'
    document.querySelectorAll('.shared-hide').forEach(el => el.style.display = 'none');

    // Update UI for shared view
    document.querySelector('.container h1').textContent = '📍 Friend’s Parking Spot';
    status.textContent = `Parked at ${new Date(params.get('time')).toLocaleTimeString()}`;
    updateMap(parseFloat(params.get('lat')), parseFloat(params.get('lng')));

    // Add Back button
    const backButton = document.createElement('button');
    backButton.textContent = '🔙 Back to My Parking';
    backButton.onclick = () => window.location.href = './';
    document.querySelector('.container').appendChild(backButton);
    return; // Exit early — don't run normal app logic
  }

  // Normal App Logic (Owner View)
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

  if (notifyTimeSelect) {
    const savedNotifyTime = localStorage.getItem('notifyTime') || '7200000';
    notifyTimeSelect.value = savedNotifyTime;
  }

  // Voice Selection (iOS-Friendly)
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
    if (speechSynthesis.onvoiceschanged === null) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    voiceSelect.addEventListener('change', () => {
      localStorage.setItem('preferredVoice', voiceSelect.value);
    });

    window.getSelectedVoice = getSelectedVoice;
  } else if (voiceSelect) {
    voiceSelect.style.display = 'none';
    document.querySelector('label[for="voiceSelect"]').style.display = 'none';
  }

  // Event Listeners
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
          localStorage.setItem('notifyTime', notifyDelay);
          findBtn.disabled = false;
          shareBtn.disabled = false;
          showQRBtn.disabled = false;
          testVoiceBtn.disabled = false;
          status.textContent = `✅ Parking saved! (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
          updateMap(latitude, longitude);
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

  if (findBtn) {
    findBtn.addEventListener('click', () => {
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

  
  // Generate QR Code
if (showQRBtn && qrContainer) {
  showQRBtn.addEventListener('click', () => {
    const spot = JSON.parse(localStorage.getItem('parkingSpot'));
    if (!spot) {
      console.error('No parking spot saved');
      return;
    }

    const baseURL = 'https://parking-pwa-eight.vercel.app';
    const params = new URLSearchParams({
      lat: spot.lat,
      lng: spot.lng,
      time: spot.time
    });
    const shareURL = `${baseURL}?${params.toString()}`;

    // Clear previous QR code
    qrContainer.querySelector('#qrcode').innerHTML = '';

    // Generate new QR code
    new QRCode(qrContainer.querySelector('#qrcode'), {
      text: shareURL,
      width: 128,
      height: 128
    });

    // Show container
    qrContainer.style.display = 'block';

console.log('QR Button clicked');
console.log('Spot:', localStorage.getItem('parkingSpot'));
console.log('QR Container:', qrContainer);


  });
}

  if (testVoiceBtn) {
    testVoiceBtn.addEventListener('click', () => {
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance('Hello, ParkHere is ready!');
        utter.voice = window.getSelectedVoice ? window.getSelectedVoice() : null;
        utter.rate = 0.9;
        utter.pitch = 1;
        speechSynthesis.speak(utter);
      } else {
        alert('Speech not supported on this device.');
      }
    });
  }
});