// Urban Hair App Core Application Logic (Production-Ready)
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
let currentOwnerSalon = null;
let recaptchaVerifier = null;
let confirmationResult = null;
let unsubSalons = null;
let unsubMyBookings = null;
let unsubOwnerBookings = null;
let unsubAdminSalons = null;

// DOM Elements
const authModal = document.getElementById("auth-modal");
const bookingModal = document.getElementById("booking-modal");
const serviceModal = document.getElementById("service-manager-modal");

// -------------------------------------------------------------
// 0. TOAST NOTIFICATION SYSTEM
// -------------------------------------------------------------
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const iconMap = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️"
  };

  toast.innerHTML = `<span>${iconMap[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

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
document.getElementById("btn-close-service-modal")?.addEventListener("click", () => closeModal(serviceModal));

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

function getSelectedAuthRole() {
  const radio = document.querySelector('input[name="auth-role"]:checked');
  return radio ? radio.value : 'customer';
}

async function syncUserProfile(user, fallbackRole = 'customer') {
  if (!user) return null;
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data();
  } else {
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
    showToast("Signed in successfully with Google!", "success");
  } catch (err) {
    console.error("Google Auth Error:", err);
    showToast("Google Sign-In Failed: " + err.message, "error");
  }
});

// Setup Recaptcha for Phone Auth
function initRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
  }
}

// Phone Send OTP
document.getElementById("btn-send-otp")?.addEventListener("click", async () => {
  const phoneNum = document.getElementById("input-phone-number").value.trim();
  if (!phoneNum || phoneNum.length < 10) {
    showToast("Please enter a valid phone number with country code (e.g. +91 9876543210)", "warning");
    return;
  }

  try {
    initRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    confirmationResult = await signInWithPhoneNumber(auth, phoneNum, appVerifier);
    
    document.getElementById("phone-step-1").style.display = "none";
    document.getElementById("phone-step-2").style.display = "block";
    showToast("Verification OTP sent to " + phoneNum, "info");
  } catch (err) {
    console.error("Phone Auth Error:", err);
    showToast("Failed to send SMS OTP: " + err.message, "error");
  }
});

// Phone Verify OTP
document.getElementById("btn-verify-otp")?.addEventListener("click", async () => {
  const otpCode = document.getElementById("input-otp-code").value.trim();
  if (!otpCode || otpCode.length !== 6) {
    showToast("Please enter the 6-digit OTP code.", "warning");
    return;
  }

  try {
    const role = getSelectedAuthRole();
    const result = await confirmationResult.confirm(otpCode);
    await syncUserProfile(result.user, role);
    closeModal(authModal);
    showToast("Phone authentication successful!", "success");
  } catch (err) {
    console.error("OTP Verification Error:", err);
    showToast("Invalid OTP Code: " + err.message, "error");
  }
});

// Logout
document.getElementById("btn-logout")?.addEventListener("click", () => {
  signOut(auth);
  showToast("Signed out successfully.", "info");
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
              <p>🟢 ${salon.isOpen === false ? '<span style="color:#ef4444">Currently Closed</span>' : '<span style="color:#10b981">Open for Bookings</span>'}</p>

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

          <button class="btn-primary full-width btn-book-salon" data-id="${salon.id}" ${salon.isOpen === false ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
            ${salon.isOpen === false ? 'Shop Closed' : 'Book Appointment'}
          </button>
        </div>
      `).join('');

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
    salonsGrid.innerHTML = `<div class="empty-state"><p>Cloud Firestore data offline.</p></div>`;
  });
}

// Open Booking Modal
function openBookingModal(salon) {
  if (!currentUser) {
    showToast("Please sign in to book an appointment!", "warning");
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
  const dateVal = document.getElementById("book-date").value;
  const slotVal = document.getElementById("book-time-slot").value;

  const appointmentData = {
    salonId: salonId,
    ownerId: ownerId,
    customerId: currentUser.uid,
    customerName: userProfile ? userProfile.displayName : currentUser.displayName || "Customer",
    customerPhone: userProfile ? userProfile.phoneNumber : currentUser.phoneNumber || "N/A",
    serviceName: serviceSelect.value,
    price: Number(selectedOpt.getAttribute("data-price")),
    duration: Number(selectedOpt.getAttribute("data-duration")),
    date: dateVal,
    timeSlot: slotVal,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "appointments"), appointmentData);
    closeModal(bookingModal);
    showToast("🎉 Booking request submitted! Track approval in 'My Bookings'.", "success");
    switchView("view-my-appointments");
  } catch (err) {
    console.error("Booking Error:", err);
    showToast("Failed to submit booking: " + err.message, "error");
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
        <div class="appt-actions">
          <span class="badge badge-${a.status === 'approved' ? 'success' : a.status === 'rejected' || a.status === 'cancelled' ? 'danger' : a.status === 'completed' ? 'info' : 'warning'}">
            ${a.status.toUpperCase()}
          </span>
          ${a.status === 'pending' ? `
            <button class="btn-reject" onclick="window.cancelMyBooking('${a.id}')">Cancel ✕</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  });
}

window.cancelMyBooking = async function(apptId) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;
  try {
    await updateDoc(doc(db, "appointments", apptId), { status: 'cancelled' });
    showToast("Booking cancelled successfully.", "info");
  } catch (err) {
    showToast("Error cancelling booking: " + err.message, "error");
  }
};

// -------------------------------------------------------------
// 3. SALON OWNER DASHBOARD LOGIC
// -------------------------------------------------------------

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
    isOpen: true,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "salons"), salonPayload);
    showToast("Registration submitted! Super Admin will verify your salon soon.", "success");
    loadOwnerDashboard();
  } catch (err) {
    console.error("Salon Registration Error:", err);
    showToast("Failed to register salon: " + err.message, "error");
  }
});

// Load Salon Owner Dashboard Data
function loadOwnerDashboard() {
  if (!currentUser) return;

  const regBox = document.getElementById("owner-registration-box");
  const activeDash = document.getElementById("owner-active-dash");

  const q = query(collection(db, "salons"), where("ownerId", "==", currentUser.uid));
  
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      regBox.style.display = "block";
      activeDash.style.display = "none";
    } else {
      regBox.style.display = "none";
      activeDash.style.display = "block";

      const salonDoc = snapshot.docs[0];
      currentOwnerSalon = { id: salonDoc.id, ...salonDoc.data() };

      document.getElementById("owner-shop-name").textContent = currentOwnerSalon.name;
      document.getElementById("owner-shop-location").textContent = `📍 ${currentOwnerSalon.city} — ${currentOwnerSalon.address}`;
      
      const statusBadge = document.getElementById("owner-shop-status-badge");
      statusBadge.textContent = currentOwnerSalon.status.toUpperCase();
      statusBadge.className = `badge badge-${currentOwnerSalon.status === 'approved' ? 'success' : 'warning'}`;
      
      document.getElementById("owner-shop-cat-badge").textContent = currentOwnerSalon.category;

      const toggleOpen = document.getElementById("toggle-shop-open");
      toggleOpen.checked = currentOwnerSalon.isOpen !== false;

      listenToOwnerAppointments(currentUser.uid);
    }
  });
}

// Toggle Shop Open/Closed
document.getElementById("toggle-shop-open")?.addEventListener("change", async (e) => {
  if (!currentOwnerSalon) return;
  const isOpenNew = e.target.checked;
  try {
    await updateDoc(doc(db, "salons", currentOwnerSalon.id), { isOpen: isOpenNew });
    showToast(isOpenNew ? "Shop is now Open for bookings!" : "Shop is now Closed.", "info");
  } catch (err) {
    showToast("Error updating shop status: " + err.message, "error");
  }
});

// Manage Services Modal
document.getElementById("btn-open-service-manager")?.addEventListener("click", () => {
  if (!currentOwnerSalon) return;
  renderServiceManager();
  openModal(serviceModal);
});

function renderServiceManager() {
  const container = document.getElementById("services-manager-list");
  const services = currentOwnerSalon.services || [];

  if (services.length === 0) {
    container.innerHTML = `<p class="empty-state">No services added yet.</p>`;
    return;
  }

  container.innerHTML = services.map((srv, idx) => `
    <div class="service-item-row">
      <div>
        <strong>${srv.name}</strong> — ₹${srv.price} (${srv.duration} mins)
      </div>
      <button class="btn-remove-row" onclick="window.deleteServiceItem(${idx})">✕</button>
    </div>
  `).join('');
}

window.deleteServiceItem = async function(idx) {
  if (!currentOwnerSalon) return;
  const updatedServices = [...(currentOwnerSalon.services || [])];
  updatedServices.splice(idx, 1);

  try {
    await updateDoc(doc(db, "salons", currentOwnerSalon.id), { services: updatedServices });
    currentOwnerSalon.services = updatedServices;
    renderServiceManager();
    showToast("Service deleted.", "info");
  } catch (err) {
    showToast("Error deleting service: " + err.message, "error");
  }
};

document.getElementById("btn-save-new-service")?.addEventListener("click", async () => {
  if (!currentOwnerSalon) return;
  const name = document.getElementById("new-service-name").value.trim();
  const price = Number(document.getElementById("new-service-price").value);
  const duration = Number(document.getElementById("new-service-duration").value);

  if (!name || !price) {
    showToast("Please enter valid service name and price.", "warning");
    return;
  }

  const updatedServices = [...(currentOwnerSalon.services || []), { name, price, duration: duration || 30 }];

  try {
    await updateDoc(doc(db, "salons", currentOwnerSalon.id), { services: updatedServices });
    currentOwnerSalon.services = updatedServices;
    
    document.getElementById("new-service-name").value = "";
    document.getElementById("new-service-price").value = "";
    document.getElementById("new-service-duration").value = "";

    renderServiceManager();
    showToast("New service added successfully!", "success");
  } catch (err) {
    showToast("Error adding service: " + err.message, "error");
  }
});

function listenToOwnerAppointments(ownerUid) {
  const listElem = document.getElementById("owner-appointments-list");
  const countElem = document.getElementById("owner-appts-count");
  const revElem = document.getElementById("owner-stat-revenue");
  const compElem = document.getElementById("owner-stat-completed");

  const q = query(collection(db, "appointments"), where("ownerId", "==", ownerUid));

  if (unsubOwnerBookings) unsubOwnerBookings();

  unsubOwnerBookings = onSnapshot(q, (snapshot) => {
    const appts = [];
    let totalRevenue = 0;
    let completedCount = 0;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      appts.push({ id: docSnap.id, ...data });
      if (data.status === 'completed' || data.status === 'approved') {
        totalRevenue += (data.price || 0);
      }
      if (data.status === 'completed') {
        completedCount++;
      }
    });

    countElem.textContent = `${appts.length} Requests`;
    revElem.textContent = `₹${totalRevenue}`;
    compElem.textContent = `${completedCount}`;

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
          <span class="badge badge-${a.status === 'approved' ? 'success' : a.status === 'rejected' || a.status === 'cancelled' ? 'danger' : a.status === 'completed' ? 'info' : 'warning'}">
            ${a.status.toUpperCase()}
          </span>
          ${a.status === 'pending' ? `
            <button class="btn-approve" onclick="window.updateApptStatus('${a.id}', 'approved')">Approve ✅</button>
            <button class="btn-reject" onclick="window.updateApptStatus('${a.id}', 'rejected')">Reject ✕</button>
          ` : ''}
          ${a.status === 'approved' ? `
            <button class="btn-complete" onclick="window.updateApptStatus('${a.id}', 'completed')">Mark Completed 🏁</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  });
}

window.updateApptStatus = async function(apptId, newStatus) {
  try {
    await updateDoc(doc(db, "appointments", apptId), { status: newStatus });
    showToast(`Appointment marked as ${newStatus.toUpperCase()}`, "success");
  } catch (err) {
    showToast("Error updating status: " + err.message, "error");
  }
};

// -------------------------------------------------------------
// 4. SUPER ADMIN DASHBOARD LOGIC
// -------------------------------------------------------------

function loadSuperAdminDashboard() {
  const adminSalonsList = document.getElementById("admin-salons-list");
  
  onSnapshot(collection(db, "salons"), (snap) => {
    let pendingCount = 0;
    snap.forEach(d => { if (d.data().status === 'pending') pendingCount++; });
    document.getElementById("admin-stat-total-salons").textContent = snap.size;
    document.getElementById("admin-stat-pending-salons").textContent = pendingCount;
  });

  onSnapshot(collection(db, "appointments"), (snap) => {
    document.getElementById("admin-stat-total-appts").textContent = snap.size;
  });

  if (unsubAdminSalons) unsubAdminSalons();

  unsubAdminSalons = onSnapshot(collection(db, "salons"), (snapshot) => {
    const salons = [];
    snapshot.forEach(docSnap => salons.push({ id: docSnap.id, ...docSnap.data() }));

    function renderAdminSalons() {
      const activeFilter = document.querySelector(".admin-tab-btn.active")?.getAttribute("data-status-filter") || 'all';
      const filtered = salons.filter(s => activeFilter === 'all' || s.status === activeFilter);

      if (filtered.length === 0) {
        adminSalonsList.innerHTML = `<div class="empty-state"><p>No salons match filter "${activeFilter}".</p></div>`;
        return;
      }

      adminSalonsList.innerHTML = filtered.map(s => `
        <div class="appt-card" style="margin-bottom:12px">
          <div>
            <h3>${s.name} <span class="badge badge-${s.status === 'approved' ? 'success' : s.status === 'rejected' ? 'danger' : 'warning'}">${s.status.toUpperCase()}</span></h3>
            <p>📍 ${s.city} — ${s.address}</p>
            <p>📞 Phone: ${s.phone}</p>
          </div>
          <div class="appt-actions">
            ${s.status !== 'approved' ? `<button class="btn-approve" onclick="window.verifySalon('${s.id}', 'approved')">Approve ✅</button>` : ''}
            ${s.status !== 'rejected' ? `<button class="btn-reject" onclick="window.verifySalon('${s.id}', 'rejected')">Reject ✕</button>` : ''}
          </div>
        </div>
      `).join('');
    }

    renderAdminSalons();

    document.querySelectorAll(".admin-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderAdminSalons();
      });
    });
  });
}

window.verifySalon = async function(salonId, newStatus) {
  try {
    await updateDoc(doc(db, "salons", salonId), { status: newStatus });
    showToast(`Salon registration ${newStatus.toUpperCase()}!`, "success");
  } catch (err) {
    showToast("Error verifying salon: " + err.message, "error");
  }
};

// -------------------------------------------------------------
// 5. PWA SERVICE WORKER REGISTRATION
// -------------------------------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(err => console.log("SW Reg Error:", err));
  });
}

// Initialize boot listeners
listenToSalons();
