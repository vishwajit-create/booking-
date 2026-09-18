// Urban Hair App Core Application Logic
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signOut, 
  onAuthStateChanged,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from "./firebase-config.js";

// Global App State
let currentUser = null;
let userProfile = null;
let recaptchaVerifier = null;
let confirmationResult = null;
let unsubSalons = null;
let unsubMyBookings = null;
let unsubOwnerBookings = null;
let unsubAdminSalons = null;

// DOM Elements
const authModal = document.getElementById("auth-modal");
const bookingModal = document.getElementById("booking-modal");

// Navigation View Switching
const navButtons = document.querySelectorAll(".nav-btn");
const viewSections = document.querySelectorAll(".view-section");

function switchView(targetId) {
  viewSections.forEach(sec => sec.classList.remove("active"));
  navButtons.forEach(btn => btn.classList.remove("active"));
  
  const activeSec = document.getElementById(targetId);
  const activeBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
  
  if (activeSec) activeSec.classList.add("active");
  if (activeBtn) activeBtn.classList.add("active");
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    switchView(target);
  });
});

// Modal Helpers
function openModal(modal) {
  if (modal) modal.classList.add("active");
}
function closeModal(modal) {
  if (modal) modal.classList.remove("active");
}

document.getElementById("btn-open-auth")?.addEventListener("click", () => openModal(authModal));
document.getElementById("btn-close-auth-modal")?.addEventListener("click", () => closeModal(authModal));
document.getElementById("btn-close-booking-modal")?.addEventListener("click", () => closeModal(bookingModal));

// Auth Tab Switching
const authTabBtns = document.querySelectorAll(".auth-tab-btn");
authTabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    authTabBtns.forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".auth-panel").forEach(p => p.classList.remove("active"));
    
    btn.classList.add("active");
    const mode = btn.getAttribute("data-auth-mode");
    document.getElementById(`auth-panel-${mode}`)?.classList.add("active");
  });
});

// -------------------------------------------------------------
// 1. AUTHENTICATION (Google Sign-In & Phone OTP)
// -------------------------------------------------------------

// Get Selected Auth Role
function getSelectedAuthRole() {
  const radio = document.querySelector('input[name="auth-role"]:checked');
  return radio ? radio.value : 'customer';
}

// Ensure User Document in Firestore
async function syncUserProfile(user, fallbackRole = 'customer') {
  if (!user) return null;
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data();
  } else {
    // Determine default role (special handle for super admin)
    let role = fallbackRole;
    if (user.email === 'admin@urbanhair.app' || user.email === 'vishw_8mxgyao@gmail.com') {
      role = 'super_admin';
    }
    
    const profile = {
      uid: user.uid,
      displayName: user.displayName || user.phoneNumber || "User",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      role: role,
      createdAt: new Date().toISOString()
    };
    await setDoc(userRef, profile);
    return profile;
  }
}

// Google Sign-In Handler
document.getElementById("btn-google-login")?.addEventListener("click", async () => {
  try {
    const role = getSelectedAuthRole();
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user, role);
    closeModal(authModal);
  } catch (err) {
    console.error("Google Auth Error:", err);
    alert("Google Sign-In Failed: " + err.message);
  }
});

// Setup Recaptcha for Phone Auth
function initRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved
      }
    });
  }
}

// Phone Send OTP
document.getElementById("btn-send-otp")?.addEventListener("click", async () => {
  const phoneNum = document.getElementById("input-phone-number").value.trim();
  if (!phoneNum || phoneNum.length < 10) {
    alert("Please enter a valid phone number with country code (e.g. +91 9876543210)");
    return;
  }

  try {
    initRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    confirmationResult = await signInWithPhoneNumber(auth, phoneNum, appVerifier);
    
    document.getElementById("phone-step-1").style.display = "none";
    document.getElementById("phone-step-2").style.display = "block";
    alert("Verification OTP sent to " + phoneNum);
  } catch (err) {
    console.error("Phone Auth Error:", err);
    alert("Failed to send SMS OTP: " + err.message);
  }
});

// Phone Verify OTP
document.getElementById("btn-verify-otp")?.addEventListener("click", async () => {
  const otpCode = document.getElementById("input-otp-code").value.trim();
  if (!otpCode || otpCode.length !== 6) {
    alert("Please enter the 6-digit OTP code.");
    return;
  }

  try {
    const role = getSelectedAuthRole();
    const result = await confirmationResult.confirm(otpCode);
    await syncUserProfile(result.user, role);
    closeModal(authModal);
  } catch (err) {
    console.error("OTP Verification Error:", err);
    alert("Invalid OTP Code: " + err.message);
  }
});

// Logout
document.getElementById("btn-logout")?.addEventListener("click", () => {
  signOut(auth);
});

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    userProfile = await syncUserProfile(user);
    updateUIForAuthenticatedUser(userProfile);
  } else {
    userProfile = null;
    updateUIForGuest();
  }
});

function updateUIForAuthenticatedUser(profile) {
  document.getElementById("btn-open-auth").style.display = "none";
  const userChip = document.getElementById("user-info-chip");
  userChip.style.display = "flex";
  
  document.getElementById("user-name-display").textContent = profile.displayName || profile.phoneNumber || "User";
  document.getElementById("user-role-badge").textContent = profile.role.replace('_', ' ');

  // Show dynamic navigation links based on user role
  document.getElementById("nav-my-bookings").style.display = "inline-block";
  
  if (profile.role === 'salon_owner' || profile.role === 'super_admin') {
    document.getElementById("nav-owner-dash").style.display = "inline-block";
    loadOwnerDashboard();
  } else {
    document.getElementById("nav-owner-dash").style.display = "none";
  }

  if (profile.role === 'super_admin') {
    document.getElementById("nav-admin-dash").style.display = "inline-block";
    loadSuperAdminDashboard();
  } else {
    document.getElementById("nav-admin-dash").style.display = "none";
  }

  loadMyBookings();
}

function updateUIForGuest() {
  document.getElementById("btn-open-auth").style.display = "inline-block";
  document.getElementById("user-info-chip").style.display = "none";
  document.getElementById("nav-my-bookings").style.display = "none";
  document.getElementById("nav-owner-dash").style.display = "none";
  document.getElementById("nav-admin-dash").style.display = "none";
  switchView("view-customer");
}

// -------------------------------------------------------------
// 2. CUSTOMER VIEW: EXPLORE SALONS & BOOKING
// -------------------------------------------------------------

function listenToSalons() {
  const salonsGrid = document.getElementById("salons-grid");
  const salonsCountLabel = document.getElementById("salons-count-label");
  const searchInput = document.getElementById("input-search-salon");
  const cityFilter = document.getElementById("filter-city");

  const q = query(collection(db, "salons"), where("status", "==", "approved"));
  
  if (unsubSalons) unsubSalons();

  unsubSalons = onSnapshot(q, (snapshot) => {
    const salons = [];
    snapshot.forEach(docSnap => {
      salons.push({ id: docSnap.id, ...docSnap.data() });
    });

    salonsCountLabel.textContent = `${salons.length} Verified Salons`;

    function renderSalons() {
      const searchTerm = searchInput.value.toLowerCase();
      const selectedCity = cityFilter.value;
      const activeCat = document.querySelector(".cat-pill.active")?.getAttribute("data-cat") || 'all';

      const filtered = salons.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm) || s.city.toLowerCase().includes(searchTerm);
        const matchesCity = !selectedCity || s.city === selectedCity;
        const matchesCat = activeCat === 'all' || s.category === activeCat;
        return matchesSearch && matchesCity && matchesCat;
      });

      if (filtered.length === 0) {
        salonsGrid.innerHTML = `
          <div class="empty-state full-width">
            <p>No salons match your search criteria.</p>
          </div>
        `;
        return;
      }

      salonsGrid.innerHTML = filtered.map(salon => `
        <div class="salon-card">
          <div>
            <div class="salon-header">
              <div class="salon-title-box">
                <h3>${salon.name}</h3>
                <span class="category-tag">${salon.category}</span>
              </div>
              <span class="salon-rating">⭐ 4.8</span>
            </div>
            
            <div class="salon-info">
              <p>📍 <strong>${salon.city}</strong> - ${salon.address}</p>
              <p>📞 ${salon.phone}</p>

              <div class="services-preview">
                <div class="services-preview-title">Services & Menu:</div>
                ${(salon.services || []).slice(0, 3).map(srv => `
                  <div class="srv-item-chip">
                    <span>${srv.name}</span>
                    <strong>₹${srv.price}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <button class="btn-primary full-width btn-book-salon" data-id="${salon.id}">
            Book Appointment
          </button>
        </div>
      `).join('');

      // Attach booking button events
      document.querySelectorAll(".btn-book-salon").forEach(btn => {
        btn.addEventListener("click", () => {
          const salonId = btn.getAttribute("data-id");
          const targetSalon = salons.find(s => s.id === salonId);
          if (targetSalon) openBookingModal(targetSalon);
        });
      });
    }

    renderSalons();

    searchInput.addEventListener("input", renderSalons);
    cityFilter.addEventListener("change", renderSalons);
    document.querySelectorAll(".cat-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        renderSalons();
      });
    });
  }, (err) => {
    console.error("Error loading salons:", err);
    salonsGrid.innerHTML = `<div class="empty-state"><p>Please make sure Cloud Firestore is enabled in your Firebase console.</p></div>`;
  });
}

// Open Booking Modal
function openBookingModal(salon) {
  if (!currentUser) {
    alert("Please sign in to book an appointment!");
    openModal(authModal);
    return;
  }

  document.getElementById("modal-salon-title").textContent = `Book at ${salon.name}`;
  document.getElementById("modal-salon-subtitle").textContent = `${salon.category} • ${salon.city}`;
  document.getElementById("book-salon-id").value = salon.id;
  document.getElementById("book-owner-id").value = salon.ownerId;

  const serviceSelect = document.getElementById("book-service-select");
  serviceSelect.innerHTML = (salon.services || []).map(srv => `
    <option value="${srv.name}" data-price="${srv.price}" data-duration="${srv.duration}">
      ${srv.name} — ₹${srv.price} (${srv.duration} mins)
    </option>
  `).join('');

  function updateSummary() {
    const selectedOpt = serviceSelect.options[serviceSelect.selectedIndex];
    if (selectedOpt) {
      document.getElementById("summary-price").textContent = `₹${selectedOpt.getAttribute("data-price")}`;
      document.getElementById("summary-duration").textContent = `${selectedOpt.getAttribute("data-duration")} mins`;
    }
  }

  serviceSelect.addEventListener("change", updateSummary);
  updateSummary();

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("book-date").min = today;
  document.getElementById("book-date").value = today;

  openModal(bookingModal);
}

// Handle Appointment Submission
document.getElementById("form-book-appointment")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const salonId = document.getElementById("book-salon-id").value;
  const ownerId = document.getElementById("book-owner-id").value;
  const serviceSelect = document.getElementById("book-service-select");
  const selectedOpt = serviceSelect.options[serviceSelect.selectedIndex];
  
  const appointmentData = {
    salonId: salonId,
    ownerId: ownerId,
    customerId: currentUser.uid,
    customerName: userProfile ? userProfile.displayName : currentUser.displayName || "Customer",
    customerPhone: userProfile ? userProfile.phoneNumber : currentUser.phoneNumber || "N/A",
    serviceName: serviceSelect.value,
    price: Number(selectedOpt.getAttribute("data-price")),
    duration: Number(selectedOpt.getAttribute("data-duration")),
    date: document.getElementById("book-date").value,
    timeSlot: document.getElementById("book-time-slot").value,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "appointments"), appointmentData);
    closeModal(bookingModal);
    alert("🎉 Appointment booking request submitted! You can track approval in 'My Bookings'.");
    switchView("view-my-appointments");
  } catch (err) {
    console.error("Booking Error:", err);
    alert("Failed to submit booking: " + err.message);
  }
});

// Load Customer's Bookings
function loadMyBookings() {
  if (!currentUser) return;
  const listElem = document.getElementById("my-appointments-list");
  
  const q = query(
    collection(db, "appointments"), 
    where("customerId", "==", currentUser.uid)
  );

  if (unsubMyBookings) unsubMyBookings();

  unsubMyBookings = onSnapshot(q, (snapshot) => {
    const appts = [];
    snapshot.forEach(docSnap => appts.push({ id: docSnap.id, ...docSnap.data() }));

    if (appts.length === 0) {
      listElem.innerHTML = `<div class="empty-state"><p>You have no appointments booked yet.</p></div>`;
      return;
    }

    listElem.innerHTML = appts.map(a => `
      <div class="appt-card">
        <div>
          <h4>${a.serviceName}</h4>
          <p>📅 <strong>${a.date}</strong> at <strong>${a.timeSlot}</strong></p>
          <p>💰 ₹${a.price} • ${a.duration} mins</p>
        </div>
        <div>
          <span class="badge badge-${a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}">
            ${a.status.toUpperCase()}
          </span>
        </div>
      </div>
    `).join('');
  });
}

// -------------------------------------------------------------
// 3. SALON OWNER DASHBOARD LOGIC
// -------------------------------------------------------------

// Add dynamic service rows
document.getElementById("btn-add-service-row")?.addEventListener("click", () => {
  const container = document.getElementById("services-builder");
  const newRow = document.createElement("div");
  newRow.className = "service-row";
  newRow.innerHTML = `
    <input type="text" class="srv-name" placeholder="Service Name" required />
    <input type="number" class="srv-price" placeholder="Price (₹)" required />
    <input type="number" class="srv-duration" placeholder="Duration (mins)" required />
    <button type="button" class="btn-remove-row" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(newRow);
});

// Register Salon Form
document.getElementById("form-register-salon")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const serviceRows = document.querySelectorAll("#services-builder .service-row");
  const servicesArr = [];
  serviceRows.forEach(row => {
    const name = row.querySelector(".srv-name").value.trim();
    const price = Number(row.querySelector(".srv-price").value);
    const duration = Number(row.querySelector(".srv-duration").value);
    if (name && price) {
      servicesArr.push({ name, price, duration });
    }
  });

  const salonPayload = {
    ownerId: currentUser.uid,
    name: document.getElementById("reg-salon-name").value.trim(),
    category: document.getElementById("reg-salon-cat").value,
    city: document.getElementById("reg-salon-city").value.trim(),
    phone: document.getElementById("reg-salon-phone").value.trim(),
    address: document.getElementById("reg-salon-address").value.trim(),
    services: servicesArr,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "salons"), salonPayload);
    alert("Registration submitted! Super Admin will verify your salon soon.");
    loadOwnerDashboard();
  } catch (err) {
    console.error("Salon Registration Error:", err);
    alert("Failed to register salon: " + err.message);
  }
});

// Load Salon Owner Dashboard Data
function loadOwnerDashboard() {
  if (!currentUser) return;

  const regBox = document.getElementById("owner-registration-box");
  const activeDash = document.getElementById("owner-active-dash");

  // Fetch Owner's Salon
  const q = query(collection(db, "salons"), where("ownerId", "==", currentUser.uid));
  
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      regBox.style.display = "block";
      activeDash.style.display = "none";
    } else {
      regBox.style.display = "none";
      activeDash.style.display = "block";

      const salonDoc = snapshot.docs[0];
      const salonData = salonDoc.data();

      document.getElementById("owner-shop-name").textContent = salonData.name;
      document.getElementById("owner-shop-location").textContent = `📍 ${salonData.city} — ${salonData.address}`;
      
      const statusBadge = document.getElementById("owner-shop-status-badge");
      statusBadge.textContent = salonData.status.toUpperCase();
      statusBadge.className = `badge badge-${salonData.status === 'approved' ? 'success' : 'warning'}`;
      
      document.getElementById("owner-shop-cat-badge").textContent = salonData.category;

      // Listen to incoming appointments for this salon
      listenToOwnerAppointments(currentUser.uid);
    }
  });
}

function listenToOwnerAppointments(ownerUid) {
  const listElem = document.getElementById("owner-appointments-list");
  const countElem = document.getElementById("owner-appts-count");

  const q = query(collection(db, "appointments"), where("ownerId", "==", ownerUid));

  if (unsubOwnerBookings) unsubOwnerBookings();

  unsubOwnerBookings = onSnapshot(q, (snapshot) => {
    const appts = [];
    snapshot.forEach(docSnap => appts.push({ id: docSnap.id, ...docSnap.data() }));

    countElem.textContent = `${appts.length} Requests`;

    if (appts.length === 0) {
      listElem.innerHTML = `<div class="empty-state"><p>No incoming appointments yet.</p></div>`;
      return;
    }

    listElem.innerHTML = appts.map(a => `
      <div class="appt-card">
        <div>
          <h4>${a.serviceName} (₹${a.price})</h4>
          <p>👤 <strong>${a.customerName}</strong> (${a.customerPhone})</p>
          <p>📅 <strong>${a.date}</strong> at <strong>${a.timeSlot}</strong></p>
        </div>
        <div class="appt-actions">
          <span class="badge badge-${a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}">
            ${a.status.toUpperCase()}
          </span>
          ${a.status === 'pending' ? `
            <button class="btn-approve" onclick="window.updateApptStatus('${a.id}', 'approved')">Approve ✅</button>
            <button class="btn-reject" onclick="window.updateApptStatus('${a.id}', 'rejected')">Reject ✕</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  });
}

// Global update status function for onclick attributes
window.updateApptStatus = async function(apptId, newStatus) {
  try {
    await updateDoc(doc(db, "appointments", apptId), { status: newStatus });
    alert(`Appointment status updated to ${newStatus.toUpperCase()}`);
  } catch (err) {
    alert("Error updating status: " + err.message);
  }
};

// -------------------------------------------------------------
// 4. SUPER ADMIN DASHBOARD LOGIC
// -------------------------------------------------------------

function loadSuperAdminDashboard() {
  const pendingListElem = document.getElementById("admin-pending-salons-list");
  
  // Total stats counters
  onSnapshot(collection(db, "salons"), (snap) => {
    let pendingCount = 0;
    snap.forEach(d => { if (d.data().status === 'pending') pendingCount++; });
    document.getElementById("admin-stat-total-salons").textContent = snap.size;
    document.getElementById("admin-stat-pending-salons").textContent = pendingCount;
  });

  onSnapshot(collection(db, "appointments"), (snap) => {
    document.getElementById("admin-stat-total-appts").textContent = snap.size;
  });

  // Pending Salons Subscription
  const q = query(collection(db, "salons"), where("status", "==", "pending"));

  if (unsubAdminSalons) unsubAdminSalons();

  unsubAdminSalons = onSnapshot(q, (snapshot) => {
    const salons = [];
    snapshot.forEach(docSnap => salons.push({ id: docSnap.id, ...docSnap.data() }));

    if (salons.length === 0) {
      pendingListElem.innerHTML = `<div class="empty-state"><p>No pending salon verification requests.</p></div>`;
      return;
    }

    pendingListElem.innerHTML = salons.map(s => `
      <div class="appt-card">
        <div>
          <h3>${s.name} (${s.category})</h3>
          <p>📍 ${s.city} — ${s.address}</p>
          <p>📞 Phone: ${s.phone}</p>
        </div>
        <div class="appt-actions">
          <button class="btn-approve" onclick="window.verifySalon('${s.id}', 'approved')">Approve Salon ✅</button>
          <button class="btn-reject" onclick="window.verifySalon('${s.id}', 'rejected')">Reject ✕</button>
        </div>
      </div>
    `).join('');
  });
}

window.verifySalon = async function(salonId, newStatus) {
  try {
    await updateDoc(doc(db, "salons", salonId), { status: newStatus });
    alert(`Salon registration ${newStatus}!`);
  } catch (err) {
    alert("Error verifying salon: " + err.message);
  }
};

// Initialize listeners on boot
listenToSalons();
