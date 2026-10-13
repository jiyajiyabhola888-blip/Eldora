/**
 * CareNest Caretaker Dashboard Logic
 * Full API Integration for Profile, Availability, Verification, and Bookings
 */

let currentCaretaker = null;

document.addEventListener("DOMContentLoaded", () => {
    initCaretakerDashboard();
});

async function initCaretakerDashboard() {
    let caretakerId = getCaretakerId();

    // Check if ID is missing
    if (!caretakerId) {
        // Check if cached profile exists
        const cachedProfile = getCaretakerProfile();
        if (cachedProfile && cachedProfile.id) {
            caretakerId = cachedProfile.id.toString();
            setCaretakerId(caretakerId);
        } else {
            showMissingCaretakerState();
            return;
        }
    }

    await loadCaretakerProfile(caretakerId);
    await loadCaretakerBookings(caretakerId);
    setupEventListeners();
}

function showMissingCaretakerState() {
    const welcome = document.querySelector(".welcome");
    if (welcome) {
        welcome.innerHTML = `
            <div style="background: #fff; padding: 30px; border-radius: 16px; border-left: 6px solid #2563eb; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-top: 20px;">
                <h2 style="font-size: 22px; color: #1e293b; margin-bottom: 8px;">Caretaker Portal Access</h2>
                <p style="color: #64748b; font-size: 15px; margin-bottom: 20px;">
                    No active caretaker session was detected. You can register as a professional caretaker or login to view your dashboard.
                </p>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <a href="caretaker-register.html" class="edit-profile-btn" style="text-decoration:none; display:inline-flex; align-items:center; gap:8px;">
                        <i class="fa-solid fa-user-plus"></i> Register as Caretaker
                    </a>
                    <a href="login.html" class="edit-profile-btn" style="background:#e2e8f0; color:#334155; text-decoration:none; display:inline-flex; align-items:center; gap:8px;">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> Login
                    </a>
                </div>
            </div>
        `;
    }
}

async function loadCaretakerProfile(caretakerId) {
    try {
        const profile = await apiFetch(`/caretakers/${caretakerId}`);
        currentCaretaker = profile;
        setCaretakerProfile(profile);
        renderProfile(profile);
    } catch (error) {
        console.warn("Backend fetch failed, checking local cache:", error);
        const cached = getCaretakerProfile();
        if (cached) {
            currentCaretaker = cached;
            renderProfile(cached);
            showToast("Showing cached caretaker profile. Server connection offline.", "warning");
        } else {
            showMissingCaretakerState();
        }
    }
}

function renderProfile(profile) {
    if (!profile) return;

    // Welcome & Name
    const welcomeName = document.getElementById("welcomeName");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profilePhone = document.getElementById("profilePhone");
    const profileExperience = document.getElementById("profileExperience");
    const profileSkills = document.getElementById("profileSkills");
    const profileServices = document.getElementById("profileServices");
    const profileAvailability = document.getElementById("profileAvailability");
    const verificationStatus = document.getElementById("verificationStatus");
    const availabilityToggle = document.getElementById("availabilityToggle");
    const availabilityText = document.getElementById("availabilityText");
    const statusDesc = document.getElementById("statusDescription");
    const statusIcon = document.querySelector(".status-icon");

    if (welcomeName) welcomeName.textContent = profile.full_name || "Caretaker";
    if (profileName) profileName.textContent = profile.full_name || "Caretaker";
    if (profileEmail) profileEmail.textContent = profile.email || "—";
    if (profilePhone) profilePhone.textContent = profile.phone || "—";
    if (profileExperience) profileExperience.textContent = `${profile.experience_years || 0} Years`;
    if (profileSkills) profileSkills.textContent = profile.skills || "General Care";
    if (profileServices) profileServices.textContent = profile.services || "Home Care";
    if (profileAvailability) profileAvailability.textContent = profile.availability || "Full-time";

    // Verification Status
    const vStatus = (profile.verification_status || "pending").toLowerCase();
    if (verificationStatus) {
        verificationStatus.textContent = vStatus.charAt(0).toUpperCase() + vStatus.slice(1);
        verificationStatus.className = "";
        
        if (vStatus === "verified") {
            verificationStatus.className = "verified-badge";
            verificationStatus.style.cssText = "background: #dcfce7; color: #15803d; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;";
            if (statusDesc) statusDesc.textContent = "Your profile has been verified. You can receive and fulfill bookings.";
            if (statusIcon) {
                statusIcon.style.background = "#dcfce7";
                statusIcon.style.color = "#16a34a";
                statusIcon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
            }
        } else if (vStatus === "rejected") {
            verificationStatus.className = "rejected-badge";
            verificationStatus.style.cssText = "background: #fee2e2; color: #b91c1c; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;";
            if (statusDesc) statusDesc.textContent = "Your profile verification was rejected. Please review and update your credentials.";
            if (statusIcon) {
                statusIcon.style.background = "#fee2e2";
                statusIcon.style.color = "#dc2626";
                statusIcon.innerHTML = `<i class="fa-solid fa-circle-xmark"></i>`;
            }
        } else {
            verificationStatus.className = "pending-badge";
            verificationStatus.style.cssText = "background: #fff7ed; color: #ea580c; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;";
            if (statusDesc) statusDesc.textContent = "Your caretaker profile is currently under review by our admin team.";
            if (statusIcon) {
                statusIcon.style.background = "#fff7ed";
                statusIcon.style.color = "#f97316";
                statusIcon.innerHTML = `<i class="fa-solid fa-shield-halved"></i>`;
            }
        }
    }

    // Availability Toggle
    if (availabilityToggle) {
        availabilityToggle.checked = Boolean(profile.is_available);
    }
    if (availabilityText) {
        availabilityText.textContent = profile.is_available ? "Available for bookings" : "Currently unavailable";
    }

    // Rating
    const ratingEl = document.getElementById("statRating");
    if (ratingEl) {
        ratingEl.textContent = profile.rating ? `⭐ ${profile.rating}` : "⭐ 5.0";
    }
}

async function loadCaretakerBookings(caretakerId) {
    try {
        const bookings = await apiFetch(`/bookings/caretaker/${caretakerId}`);
        renderBookings(bookings);
    } catch (error) {
        console.error("Failed to load caretaker bookings:", error);
    }
}

function renderBookings(bookings = []) {
    const bookingListContainer = document.getElementById("caretakerBookingsList");
    const totalBookingsEl = document.getElementById("statTotalBookings");
    const upcomingVisitsEl = document.getElementById("statUpcomingVisits");
    const earningsEl = document.getElementById("statTotalEarnings");

    const totalCount = bookings.length;
    const upcomingList = bookings.filter(b => b.status === "confirmed" || b.status === "pending");
    const completedList = bookings.filter(b => b.status === "completed");

    if (totalBookingsEl) totalBookingsEl.textContent = totalCount;
    if (upcomingVisitsEl) upcomingVisitsEl.textContent = upcomingList.length;

    // Calculate approximate earnings: 85% of total price
    let totalEarnings = 0;
    completedList.forEach(b => {
        const num = parseInt((b.price || "499").replace(/\D/g, "")) || 499;
        totalEarnings += Math.round(num * 0.85);
    });
    if (earningsEl) earningsEl.textContent = `₹${totalEarnings.toLocaleString()}`;

    if (!bookingListContainer) return;

    if (bookings.length === 0) {
        bookingListContainer.innerHTML = `
            <div class="no-bookings" style="text-align: center; padding: 35px 15px; color: #888;">
                <i class="fa-solid fa-calendar-xmark" style="font-size: 40px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
                <h4 style="font-size: 16px; color: #475569; margin-bottom: 4px;">No Bookings Assigned Yet</h4>
                <p style="font-size: 13px; color: #94a3b8;">When elders or families book your services, they will appear right here.</p>
            </div>
        `;
        return;
    }

    bookingListContainer.innerHTML = bookings.map(b => {
        let statusBg = "#e0f2fe";
        let statusColor = "#0369a1";
        if (b.status === "confirmed") {
            statusBg = "#dcfce7"; statusColor = "#15803d";
        } else if (b.status === "completed") {
            statusBg = "#f1f5f9"; statusColor = "#475569";
        } else if (b.status === "cancelled" || b.status === "rejected") {
            statusBg = "#fee2e2"; statusColor = "#b91c1c";
        }

        const actionButtons = [];
        if (b.status === "pending") {
            actionButtons.push(`<button onclick="updateBookingStatus(${b.id}, 'confirmed')" class="btn-action accept" style="padding: 6px 14px; border:none; border-radius:8px; background:#22c55e; color:white; font-size:12px; font-weight:600; cursor:pointer;"><i class="fa-solid fa-check"></i> Accept</button>`);
            actionButtons.push(`<button onclick="updateBookingStatus(${b.id}, 'rejected')" class="btn-action reject" style="padding: 6px 14px; border:none; border-radius:8px; background:#ef4444; color:white; font-size:12px; font-weight:600; cursor:pointer;"><i class="fa-solid fa-xmark"></i> Decline</button>`);
        } else if (b.status === "confirmed") {
            actionButtons.push(`<button onclick="updateBookingStatus(${b.id}, 'completed')" class="btn-action complete" style="padding: 6px 14px; border:none; border-radius:8px; background:#2563eb; color:white; font-size:12px; font-weight:600; cursor:pointer;"><i class="fa-solid fa-circle-check"></i> Mark Completed</button>`);
            actionButtons.push(`<button onclick="updateBookingStatus(${b.id}, 'cancelled')" class="btn-action cancel" style="padding: 6px 14px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; color:#64748b; font-size:12px; font-weight:600; cursor:pointer;">Cancel</button>`);
        }

        return `
            <div class="booking-item" style="background: #f8faff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <h4 style="font-size: 16px; color: #1e293b; margin-bottom: 3px;">
                            ${b.service}
                        </h4>
                        <span style="font-size: 13px; color: #64748b;">
                            <i class="fa-solid fa-user"></i> ${b.elder_name || b.user_name || "Family Member"}
                            ${b.user_phone ? ` • 📞 ${b.user_phone}` : ""}
                        </span>
                    </div>
                    <span style="background: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">
                        ${b.status}
                    </span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; font-size: 13px; color: #475569; margin-bottom: 12px; background: white; padding: 10px 12px; border-radius: 10px;">
                    <div>📅 <strong>Date:</strong> ${b.booking_date}</div>
                    <div>⏰ <strong>Time:</strong> ${b.booking_time}</div>
                    <div>⏳ <strong>Duration:</strong> ${b.duration}</div>
                    <div>💰 <strong>Fee:</strong> ${b.price}</div>
                </div>

                ${b.address ? `<p style="font-size: 12px; color: #64748b; margin-bottom: 10px;">📍 <strong>Location:</strong> ${b.address}</p>` : ""}
                ${b.special_instructions ? `<p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">📝 <strong>Instructions:</strong> ${b.special_instructions}</p>` : ""}

                ${actionButtons.length > 0 ? `
                    <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid #edf2f7; padding-top: 10px;">
                        ${actionButtons.join("")}
                    </div>
                ` : ""}
            </div>
        `;
    }).join("");
}

async function updateBookingStatus(bookingId, newStatus) {
    try {
        await apiFetch(`/bookings/${bookingId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus })
        });
        showToast(`Booking marked as ${newStatus}!`, "success");
        const caretakerId = getCaretakerId();
        if (caretakerId) {
            await loadCaretakerBookings(caretakerId);
        }
    } catch (error) {
        showToast(error.message || "Failed to update booking status", "error");
    }
}

function setupEventListeners() {
    // Edit Profile Button
    const editBtn = document.getElementById("editProfileBtn");
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            window.location.href = "caretaker-edit-profile.html";
        });
    }

    // Availability Toggle
    const toggle = document.getElementById("availabilityToggle");
    const availText = document.getElementById("availabilityText");

    if (toggle) {
        toggle.addEventListener("change", async function () {
            const caretakerId = getCaretakerId();
            if (!caretakerId) {
                showToast("Caretaker ID missing. Please login again.", "error");
                this.checked = !this.checked;
                return;
            }

            const isAvailable = this.checked;
            try {
                const updated = await apiFetch(`/caretakers/${caretakerId}/availability?is_available=${isAvailable}`, {
                    method: "PUT"
                });

                setCaretakerProfile(updated);
                if (availText) {
                    availText.textContent = updated.is_available ? "Available for bookings" : "Currently unavailable";
                }
                showToast(updated.is_available ? "You are now available for bookings ✅" : "Availability set to offline ⏸️", "info");
            } catch (error) {
                showToast("Could not update availability on server.", "error");
                this.checked = !isAvailable;
            }
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            logout();
        });
    }
}
