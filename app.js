// DOM Elements
const saveBtn = document.getElementById('saveBtn');
const findBtn = document.getElementById('findBtn');
const status = document.getElementById('status');
const mapDiv = document.getElementById('map');

// Check if we already have a saved spot
const savedSpot = localStorage.getItem('parkingSpot');

if (savedSpot) {
  const spot = JSON.parse(savedSpot);
  findBtn.disabled = false;
  status.textContent = `Parking saved on ${new Date(spot.time).toLocaleTimeString()}`;
}

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

// Show the map to find the car
findBtn.addEventListener('click', () => {
  const spot = JSON.parse(localStorage.getItem('parkingSpot'));
  if (spot) {
    updateMap(spot.lat, spot.lng);
  }
});

// Update the map using Google Maps Embed
function updateMap(lat, lng) {
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyD0iSWh-ke56m_qdHt1IWPnUb7r_Q40sII&center=${lat},${lng}&zoom=18`;
  mapDiv.style.display = 'block';
  mapDiv.innerHTML = `<iframe frameborder="0" style="border:0" src="${mapUrl}" allowfullscreen></iframe>`;
}