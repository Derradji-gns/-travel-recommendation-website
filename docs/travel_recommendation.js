// ============================================================
// Wandergram — travel_recommendation.js
// Handles: Task 6 (fetch data), Task 7 (keyword matching),
// Task 8 (render recommendations), Task 9 (clear button),
// Task 10 (optional local time per destination)
// ============================================================

let travelData = null; // holds the parsed JSON once fetched

const resultsGrid = document.getElementById("results-grid");
const resultsStatus = document.getElementById("results-status");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resetBtn = document.getElementById("reset-btn");

// ============================================================
// Single-file page navigation
// Home / About / Contact all live in this one HTML file as
// <section data-page="..."> blocks. Nav links swap which one
// is visible instead of loading a new page.
// ============================================================

const pageSections = document.querySelectorAll(".page-section");
const navLinks = document.querySelectorAll("[data-nav]");
const searchBar = document.querySelector("[data-home-only]");

function showPage(pageName) {
  pageSections.forEach((section) => {
    section.hidden = section.dataset.page !== pageName;
  });

  // The search bar in the navbar is only relevant on the Home page
  if (searchBar) {
    searchBar.style.display = pageName === "home" ? "" : "none";
  }

  navLinks.forEach((link) => {
    const isActive = link.dataset.nav === pageName;
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function pageFromHash() {
  const hash = window.location.hash.replace("#", "");
  return ["home", "about", "contact"].includes(hash) ? hash : "home";
}

window.addEventListener("hashchange", () => showPage(pageFromHash()));
document.addEventListener("DOMContentLoaded", () => showPage(pageFromHash()));

// ---------- Contact form (client-side only, no backend) ----------
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("form-status").textContent =
      "Thanks — your message has been sent. We'll reply soon.";
    e.target.reset();
  });
}

// ---------- Task 6: Fetch data from the JSON file ----------
function loadTravelData() {
  return fetch("travel_recommendation_api.json")
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // confirms the fetch worked, per assignment instructions
      travelData = data;
    })
    .catch((error) => {
      console.error("Could not load travel_recommendation_api.json:", error);
      resultsStatus.textContent =
        "Sorry, recommendations could not be loaded right now.";
    });
}

// Kick off the fetch as soon as the page loads, so data is ready
// by the time the user clicks Search.
document.addEventListener("DOMContentLoaded", loadTravelData);

// ---------- Task 7: Keyword search handling ----------
if (searchForm) {
  searchForm.addEventListener("submit", function (event) {
    event.preventDefault(); // don't reload the page
    const keyword = searchInput.value.trim().toLowerCase();
    handleSearch(keyword);
  });
}

function handleSearch(keyword) {
  if (!travelData) {
    resultsStatus.textContent = "Still loading recommendations, try again in a second.";
    return;
  }

  if (!keyword) {
    resultsStatus.textContent = "Type a keyword — try 'beach', 'temple', or a country name.";
    return;
  }

  // Normalize simple plural/singular variants: "beach" / "beaches"
  const isBeach = keyword.includes("beach");
  const isTemple = keyword.includes("temple");

  let matches = [];
  let label = "";

  if (isBeach) {
    matches = travelData.beaches;
    label = "beaches";
  } else if (isTemple) {
    matches = travelData.temples;
    label = "temples";
  } else {
    // Otherwise, try to match a country name (e.g. "australia", "Japan")
    const country = travelData.countries.find((c) =>
      c.name.toLowerCase().includes(keyword)
    );
    if (country) {
      matches = country.cities;
      label = country.name;
    }
  }

  // ---------- Task 8: Render the recommendations ----------
  renderResults(matches, keyword, label);
}

function renderResults(matches, keyword, label) {
  resultsGrid.innerHTML = "";

  if (!matches || matches.length === 0) {
    resultsStatus.textContent = `No recommendations found for "${keyword}". Try 'beach', 'temple', or a country name.`;
    return;
  }

  resultsStatus.textContent = `Showing ${matches.length} result${matches.length > 1 ? "s" : ""} for "${label}"`;

  matches.forEach((place) => {
    resultsGrid.appendChild(buildPostcard(place));
  });
}

function buildPostcard(place) {
  const card = document.createElement("article");
  card.className = "postcard";

  const photo = document.createElement("div");
  photo.className = "postcard-photo";

  const img = document.createElement("img");
  img.src = place.imageUrl;
  img.alt = place.name;
  img.loading = "lazy";
  photo.appendChild(img);

  const stamp = document.createElement("span");
  stamp.className = "postcard-stamp";
  stamp.textContent = "Visit";
  photo.appendChild(stamp);

  const body = document.createElement("div");
  body.className = "postcard-body";

  const title = document.createElement("h3");
  title.textContent = place.name;
  body.appendChild(title);

  // ---------- Task 10 (optional): local time at destination ----------
  if (place.timeZone) {
    const time = document.createElement("div");
    time.className = "postcard-time";
    time.textContent = `Local time: ${getLocalTime(place.timeZone)}`;
    body.appendChild(time);
  }

  const hr = document.createElement("hr");
  hr.className = "postcard-divider";
  body.appendChild(hr);

  const desc = document.createElement("p");
  desc.className = "postcard-desc";
  desc.textContent = place.description;
  body.appendChild(desc);

  card.appendChild(photo);
  card.appendChild(body);
  return card;
}

// Returns the current time in a given IANA time zone, e.g. "Asia/Tokyo"
function getLocalTime(timeZone) {
  const options = {
    timeZone: timeZone,
    hour12: true,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  return new Date().toLocaleTimeString("en-US", options);
}

// ---------- Task 9: Clear / reset button ----------
if (resetBtn) {
  resetBtn.addEventListener("click", clearResults);
}

function clearResults() {
  searchInput.value = "";
  resultsGrid.innerHTML = "";
  resultsStatus.textContent = "Search \"beach\", \"temple\", or a country name to get started";
}