// DOM Elements
const saveBtn = document.getElementById('saveBtn');
const findBtn = document.getElementById('findBtn');
const status = document.getElementById('status');
const mapDiv = document.getElementById('map');

const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const photoImg = document.getElementById('photoImg');

const themeToggle = document.getElementById('themeToggle');
let isDark = false;

// Update the map using Google Maps Embed
function updateMap(lat, lng) {
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyD0iSWh-ke56m_qdHt1IWPnUb7r_Q40sII&center=${lat},${lng}&zoom=18`;
  mapDiv.style.display = 'block';
  mapDiv.innerHTML = `<iframe frameborder="0" style="border:0" src="${mapUrl}" allowfullscreen></iframe>`;
}




// Request notification permission on first save
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

// Load saved theme
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  themeToggle.textContent = '☀️ Light Mode';
  isDark = true;
}

// Toggle theme
themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('darkMode', isDark);
});
// Run once on load
requestNotificationPermission();


// Check if we already have a saved spot
const savedSpot = localStorage.getItem('parkingSpot');

// Start timer if spot is saved
if (savedSpot) {
  const spot = JSON.parse(savedSpot);
  findBtn.disabled = false;
  status.textContent = `Parking saved on ${new Date(spot.time).toLocaleTimeString()}`;
  
  // Start live timer
  setInterval(() => {
    const parkedTime = new Date(spot.time);
    const now = new Date();
    const diff = Math.floor((now - parkedTime) / 1000); // seconds
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    timer.textContent = `🕒 Parked: ${hours}h ${minutes}m ${seconds}s`;
  }, 1000);
}

// Restore photo if exists
const savedPhoto = localStorage.getItem('parkingPhoto');
if (savedPhoto) {
  photoImg.src = savedPhoto;
  photoPreview.style.display = 'block';
}

// If spot is saved, schedule a 2-hour reminder
if (savedSpot) {
  const spot = JSON.parse(savedSpot);
  const parkedTime = new Date(spot.time);
  const now = new Date();
  const diffMs = now - parkedTime;
  const twoHours = 2 * 60 * 60 * 1000;

  // If less than 2 hours have passed, schedule notification
  if (diffMs < twoHours) {
    const timeUntilNotify = twoHours - diffMs;

    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('🕒 Park Reminder', {
          body: 'You’ve been parked for 2 hours!',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🅿️</text></svg>'
        });
      }
    }, timeUntilNotify);
  }
}

photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const dataUrl = event.target.result; // This is a data: URL
      photoImg.src = dataUrl;
      photoPreview.style.display = 'block';
      localStorage.setItem('parkingPhoto', dataUrl);
    };
    reader.readAsDataURL(file);
  }
});

// Run once on load
requestNotificationPermission();

// Save current location
saveBtn.addEventListener('click', () => {
  status.textContent = 'Getting your location...';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      const spot = {
        lat: latitude,
        lng: longitude,
        time: new Date().toISOString()
      };

      localStorage.setItem('parkingSpot', JSON.stringify(spot));
      findBtn.disabled = false;

      status.textContent = `✅ Parking saved! (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      updateMap(latitude, longitude);
    },
    (error) => {
      console.error("Geolocation error:", error);
      status.textContent = `❌ Error: ${error.message}`;
    },
    { timeout: 10000 }
  );
});

// Show the map and distance to car
findBtn.addEventListener('click', () => {
  const spot = JSON.parse(localStorage.getItem('parkingSpot'));
  if (!spot) return;

  updateMap(spot.lat, spot.lng);

  // 🔊 Voice reminder
  const time = new Date(spot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const utter = new SpeechSynthesisUtterance(`You parked at ${time}.`);
  utter.rate = 0.9;
  speechSynthesis.speak(utter);

  // 📍 Distance calculation
  status.textContent = 'Calculating distance...';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      // Haversine formula for distance
      const R = 6371e3; // Earth radius in meters
      const φ1 = userLat * Math.PI / 180;
      const φ2 = spot.lat * Math.PI / 180;
      const Δφ = (spot.lat - userLat) * Math.PI / 180;
      const Δλ = (spot.lng - userLng) * Math.PI / 180;

      const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) +
                Math.cos(φ1)*Math.cos(φ2)*
                Math.sin(Δλ/2)*Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const distance = R * c; // meters
      const unit = distance >= 1000 ? 'km' : 'm';
      const distText = distance >= 1000 ? (distance/1000).toFixed(1) + ' km' : Math.round(distance) + ' m';

      status.textContent = `🚗 Your car is ${distText} away.`;

      // Extra voice hint
      const distUtter = new SpeechSynthesisUtterance(`Your car is ${Math.round(distance)} meters away.`);
      distUtter.rate = 0.8;
      speechSynthesis.speak(distUtter);
    },
    (err) => {
      status.textContent = 'Unable to get your location for distance.';
    },
    { timeout: 10000 }
  );
});


const shareBtn = document.getElementById('shareBtn');

// Enable share button if spot exists
if (savedSpot) {
  shareBtn.disabled = false;
}

// Handle share button
shareBtn.addEventListener('click', () => {
  const spot = JSON.parse(localStorage.getItem('parkingSpot'));
  if (!spot) return;

  const baseURL = 'https://parking-pwa-eight.vercel.app';
  const params = new URLSearchParams({
    lat: spot.lat,
    lng: spot.lng,
    time: spot.time
    // Photo removed — keeps link short and shareable
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


// Check if this is a shared link
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('lat') && params.has('lng')) {
    // This is a shared view
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const time = params.get('time');
    const photo = params.get('photo');

    const backButton = document.createElement('button');
    backButton.textContent = '🔙 Back to My Parking';
    backButton.onclick = () => {
      window.location.href = './';
      };
    document.querySelector('.container').appendChild(backButton);

    // Update UI
    document.querySelector('.container h1').textContent = '📍 Friend’s Parking Spot';
    saveBtn.style.display = 'none';
    findBtn.style.display = 'none';
    shareBtn.style.display = 'none';
    status.textContent = `Parked at ${new Date(time).toLocaleTimeString()}`;

    // Show map
    updateMap(lat, lng);

    // Show photo if available
    if (photo) {
      photoImg.src = photo;
      photoPreview.style.display = 'block';
    }
  }
});


// Restore saved spot on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedSpot = localStorage.getItem('parkingSpot');
  if (savedSpot) {
    const spot = JSON.parse(savedSpot);
    
    // Re-enable Find My Car button
    findBtn.disabled = false;
    
    // Update status
    status.textContent = `Parking saved on ${new Date(spot.time).toLocaleTimeString()}`;
    
    // ✅ Auto-show the map
    updateMap(spot.lat, spot.lng);
  }

  // Restore photo if exists
  const savedPhoto = localStorage.getItem('parkingPhoto');
  if (savedPhoto) {
    photoImg.src = savedPhoto;
    photoPreview.style.display = 'block';
  }
});