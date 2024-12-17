document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("predictionForm");
  const resultDiv = document.getElementById("result");
  const predictionText = document.getElementById("prediction-text");

  // CBD coordinates (Marina Bay)
  const CBD_COORDS = {
    latitude: 1.2789,
    longitude: 103.8536,
  };

  // Store MRT and Mall coordinates
  const stationCoords = {};
  const mallCoords = {};

  // Function to calculate distance between two points using Haversine formula
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  // Function to update all distances
  function updateDistances() {
    const lat = parseFloat(document.getElementById("latitude").value);
    const lon = parseFloat(document.getElementById("longitude").value);
    const selectedMrt = document.getElementById("nearest_mrt_station").value;
    const selectedMall = document.getElementById("nearest_mall").value;

    if (lat && lon) {
      // Update CBD distance
      const cbdDistance = calculateDistance(
        lat,
        lon,
        CBD_COORDS.latitude,
        CBD_COORDS.longitude
      );
      document.getElementById("min_dist_to_cbd").value = cbdDistance.toFixed(4);

      // Calculate and update all distances regardless of which selector changed
      // Update MRT distance
      if (selectedMrt && stationCoords[selectedMrt]) {
        const mrtDistance = calculateDistance(
          lat,
          lon,
          stationCoords[selectedMrt].latitude,
          stationCoords[selectedMrt].longitude
        );
        document.getElementById("nearest_mrt_distance_km").value =
          mrtDistance.toFixed(4);
      } else {
        document.getElementById("nearest_mrt_distance_km").value = "";
      }

      // Update Mall distance
      if (selectedMall && mallCoords[selectedMall]) {
        const mallDistance = calculateDistance(
          lat,
          lon,
          mallCoords[selectedMall].latitude,
          mallCoords[selectedMall].longitude
        );
        document.getElementById("nearest_mall_distance_km").value =
          mallDistance.toFixed(4);
      } else {
        document.getElementById("nearest_mall_distance_km").value = "";
      }
    }
  }

  // Load form options and coordinates
  try {
    const response = await fetch("/static/js/form_options.json");
    const options = await response.json();

    // Load coordinates data
    const coordsResponse = await fetch("/static/js/coordinates.json");
    const coordsData = await coordsResponse.json();
    Object.assign(stationCoords, coordsData.mrt_stations);
    Object.assign(mallCoords, coordsData.malls);

    // Populate select fields with options
    if (options.town) {
      const townSelect = document.getElementById("town");
      townSelect.innerHTML =
        '<option value="">Select Town</option>' +
        options.town
          .map(
            (town) =>
              `<option value="${town}">${
                town.charAt(0).toUpperCase() + town.slice(1)
              }</option>`
          )
          .join("");
    }

    if (options.flat_type) {
      const flatTypeSelect = document.getElementById("flat_type");
      flatTypeSelect.innerHTML =
        '<option value="">Select Flat Type</option>' +
        options.flat_type
          .map((type) => `<option value="${type}">${type}</option>`)
          .join("");
    }

    if (options.storey_range) {
      const storeySelect = document.getElementById("storey_range");
      storeySelect.innerHTML =
        '<option value="">Select Storey Range</option>' +
        options.storey_range
          .map((range) => `<option value="${range}">${range}</option>`)
          .join("");
    }

    if (options.flat_model) {
      const modelSelect = document.getElementById("flat_model");
      modelSelect.innerHTML =
        '<option value="">Select Flat Model</option>' +
        options.flat_model
          .map((model) => `<option value="${model}">${model}</option>`)
          .join("");
    }

    // Add MRT station options
    if (options.nearest_mrt_station) {
      const mrtSelect = document.getElementById("nearest_mrt_station");
      mrtSelect.innerHTML =
        '<option value="">Select Nearest MRT Station</option>' +
        options.nearest_mrt_station
          .map((station) => `<option value="${station}">${station}</option>`)
          .join("");

      // Add event listener for MRT selection
      mrtSelect.addEventListener("change", function () {
        const lat = parseFloat(document.getElementById("latitude").value);
        const lon = parseFloat(document.getElementById("longitude").value);

        if (lat && lon && this.value) {
          const coords = stationCoords[this.value];
          const distance = calculateDistance(
            lat,
            lon,
            coords.latitude,
            coords.longitude
          );
          document.getElementById("nearest_mrt_distance_km").value =
            distance.toFixed(4);
        } else {
          document.getElementById("nearest_mrt_distance_km").value = "";
        }

        // Find nearest mall if MRT is selected and mall isn't
        if (this.value && !document.getElementById("nearest_mall").value) {
          findNearestMall();
        }
      });
    }

    // Add mall options
    if (options.nearest_mall) {
      const mallSelect = document.getElementById("nearest_mall");
      mallSelect.innerHTML =
        '<option value="">Select Nearest Mall</option>' +
        options.nearest_mall
          .map((mall) => `<option value="${mall}">${mall}</option>`)
          .join("");

      // Add event listener for mall selection
      mallSelect.addEventListener("change", function () {
        const lat = parseFloat(document.getElementById("latitude").value);
        const lon = parseFloat(document.getElementById("longitude").value);

        if (lat && lon && this.value) {
          const coords = mallCoords[this.value];
          const distance = calculateDistance(
            lat,
            lon,
            coords.latitude,
            coords.longitude
          );
          console.log(distance);
          document.getElementById("nearest_mall_distance_km").value =
            distance.toFixed(4);
        } else {
          document.getElementById("nearest_mall_distance_km").value = "";
        }

        // Find nearest MRT if mall is selected and MRT isn't
        if (
          this.value &&
          !document.getElementById("nearest_mrt_station").value
        ) {
          findNearestMRT();
        }
      });
    }

    // Function to find nearest mall based on current coordinates
    function findNearestMall() {
      const lat = parseFloat(document.getElementById("latitude").value);
      const lon = parseFloat(document.getElementById("longitude").value);

      if (!lat || !lon) return;

      let nearestMall = null;
      let shortestDistance = Infinity;

      for (const [mall, coords] of Object.entries(mallCoords)) {
        const distance = calculateDistance(
          lat,
          lon,
          coords.latitude,
          coords.longitude
        );
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestMall = mall;
        }
      }

      if (nearestMall) {
        const mallSelect = document.getElementById("nearest_mall");
        mallSelect.value = nearestMall;
        updateDistances();
      }
    }

    // Function to find nearest MRT based on current coordinates
    function findNearestMRT() {
      const lat = parseFloat(document.getElementById("latitude").value);
      const lon = parseFloat(document.getElementById("longitude").value);

      if (!lat || !lon) return;

      let nearestStation = null;
      let shortestDistance = Infinity;

      for (const [station, coords] of Object.entries(stationCoords)) {
        const distance = calculateDistance(
          lat,
          lon,
          coords.latitude,
          coords.longitude
        );
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestStation = station;
        }
      }

      if (nearestStation) {
        const mrtSelect = document.getElementById("nearest_mrt_station");
        mrtSelect.value = nearestStation;
        updateDistances();
      }
    }

    // Add street name options
    if (options.street_name) {
      const streetSelect = document.getElementById("street_name");
      streetSelect.innerHTML =
        '<option value="">Select Street Name</option>' +
        options.street_name
          .map((street) => `<option value="${street}">${street}</option>`)
          .join("");
    }
  } catch (error) {
    console.error("Error loading form options:", error);
  }

  // Handle address geocoding
  const streetNameSelect = document.getElementById("street_name");
  const blockNoInput = document.getElementById("block_no");
  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");

  function geocodeAddress() {
    const streetName = streetNameSelect.value;
    const blockNo = blockNoInput.value;

    if (!streetName || !blockNo) return;

    // Format the address for OneMap API
    const address = `${blockNo} ${streetName}`;

    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === this.DONE) {
        try {
          const data = JSON.parse(this.responseText);
          if (data.found > 0) {
            const result = data.results[0];
            latitudeInput.value = result.LATITUDE;
            longitudeInput.value = result.LONGITUDE;
            // Update distances after getting coordinates
            updateDistances();
          } else {
            latitudeInput.value = "";
            longitudeInput.value = "";
            alert(
              "Address not found. Please check the street name and block number."
            );
          }
        } catch (error) {
          console.error("Error parsing response:", error);
          alert("Error getting coordinates. Please try again.");
        }
      }
    });

    const apiUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
      address
    )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    xhr.open("GET", apiUrl);
    xhr.send();
  }

  streetNameSelect.addEventListener("change", geocodeAddress);
  blockNoInput.addEventListener("blur", geocodeAddress);

  // Calculate remaining years when either date changes
  const leaseCommenceDateInput = document.getElementById("lease_commence_date");
  const contractDateInput = document.getElementById("contract_date");
  const remainingYearInput = document.getElementById("remaining_year");

  function calculateRemainingYears() {
    const leaseDate = leaseCommenceDateInput.value;
    const contractDate = contractDateInput.value;

    if (!leaseDate || !contractDate) return;

    const leaseCommenceDate = new Date(leaseDate);
    const contractDateTime = new Date(contractDate);
    const leaseYears = 99; // HDB lease is typically 99 years

    // Calculate the difference between contract date and lease commencement date
    const yearsDiff =
      contractDateTime.getFullYear() - leaseCommenceDate.getFullYear();
    const monthsDiff =
      contractDateTime.getMonth() - leaseCommenceDate.getMonth();
    const daysDiff = contractDateTime.getDate() - leaseCommenceDate.getDate();

    // Calculate exact years difference considering months and days
    const exactYearsDiff = yearsDiff + monthsDiff / 12 + daysDiff / 365.25;
    const remainingYears = Math.max(0, leaseYears - exactYearsDiff);

    remainingYearInput.value = Math.floor(remainingYears);
  }

  leaseCommenceDateInput.addEventListener("change", calculateRemainingYears);
  contractDateInput.addEventListener("change", calculateRemainingYears);

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Collect form data
    const formData = {
      town: document.getElementById("town").value,
      flat_type: document.getElementById("flat_type").value,
      storey_range: document.getElementById("storey_range").value,
      floor_area_sqm: document.getElementById("floor_area_sqm").value,
      flat_model: document.getElementById("flat_model").value,
      lease_commence_date: document.getElementById("lease_commence_date").value,
      contract_date: document.getElementById("contract_date").value,
      latitude: document.getElementById("latitude").value,
      longitude: document.getElementById("longitude").value,
      street_name: document.getElementById("street_name").value,
      nearest_mrt_station: document.getElementById("nearest_mrt_station").value,
      nearest_mrt_distance_km: document.getElementById(
        "nearest_mrt_distance_km"
      ).value,
      nearest_mall: document.getElementById("nearest_mall").value,
      nearest_mall_distance_km: document.getElementById(
        "nearest_mall_distance_km"
      ).value,
      min_dist_to_cbd: document.getElementById("min_dist_to_cbd").value,
      remaining_year: document.getElementById("remaining_year").value,
    };

    try {
      // Send data to backend
      const response = await fetch("/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Show result
        resultDiv.classList.remove("hidden");
        predictionText.textContent = data.prediction;
      } else {
        throw new Error(data.error || "Prediction failed");
      }
    } catch (error) {
      resultDiv.classList.remove("hidden");
      predictionText.textContent = `Error: ${error.message}`;
      predictionText.classList.add("text-red-600");
    }
  });
});
