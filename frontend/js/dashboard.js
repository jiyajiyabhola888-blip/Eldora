/**
 * CareNest User / Elder Dashboard Logic
 * Integrates live bookings, stats, user profile, and notifications
 */

document.addEventListener("DOMContentLoaded", () => {
    initUserDashboard();
});

async function initUserDashboard() {
    const user = getUserSession();
    
    // Update user greeting
    const welcomeHeading = document.querySelector(".dashboard h1");
    if (welcomeHeading && user) {
        welcomeHeading.innerHTML = `Welcome back, ${user.name || user.full_name || 'Family Member'} 👋`;
    }

    const userId = user ? (user.id || 1) : 1;
    await loadUserDashboardData(userId);
}

async function loadUserDashboardData(userId) {
    try {
        const bookings = await apiFetch(`/bookings/user/${userId}`);
        renderDashboardStats(bookings);
        renderRecentBooking(bookings);
    } catch (error) {
        console.warn("Falling back to all bookings or local cache:", error);
        try {
            const allBookings = await apiFetch("/bookings/");
            renderDashboardStats(allBookings);
            renderRecentBooking(allBookings);
        } catch (e) {
            console.error("Failed to load dashboard bookings:", e);
        }
    }
}

function renderDashboardStats(bookings = []) {
    const totalEl = document.getElementById("totalBookings");
    const activeEl = document.getElementById("activeBookings");
    const completedEl = document.getElementById("completedBookings");

    const total = bookings.length;
    const active = bookings.filter(b => b.status === "confirmed" || b.status === "pending").length;
    const completed = bookings.filter(b => b.status === "completed").length;

    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (completedEl) completedEl.textContent = completed;
}

function renderRecentBooking(bookings = []) {
    const recentBookingBox = document.querySelector(".recent-booking");
    if (!recentBookingBox) return;

    if (!bookings || bookings.length === 0) {
        recentBookingBox.innerHTML = `
            <h2>Recent Booking</h2>
            <div style="background: white; padding: 25px; border-radius: 14px; text-align: center; color: #64748b;">
                <i class="fa-solid fa-calendar-plus" style="font-size: 32px; color: #cbd5e1; margin-bottom: 10px; display: block;"></i>
                <p style="font-size: 14px; margin-bottom: 15px;">No active bookings found.</p>
                <a href="booking.html" class="book-btn" style="text-decoration:none; display:inline-block; padding: 8px 18px; font-size: 13px;">
                    Book a Care Companion
                </a>
            </div>
        `;
        return;
    }

    const latest = bookings[0];
    const isConfirmed = latest.status === "confirmed";
    const statusColor = isConfirmed ? "#15803d" : latest.status === "completed" ? "#475569" : "#ea580c";
    const statusBg = isConfirmed ? "#dcfce7" : latest.status === "completed" ? "#f1f5f9" : "#fff7ed";

    recentBookingBox.innerHTML = `
        <h2>Recent Booking</h2>
        <div class="booking-info" style="background: white; padding: 22px; border-radius: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
            <p><strong>🩺 Service:</strong> <span id="dashService">${latest.service}</span></p>
            <p><strong>👩 Caretaker:</strong> <span>${latest.caretaker_name || 'Care Specialist Assigned'}</span></p>
            <p><strong>📅 Date & Time:</strong> <span id="dashDate">${latest.booking_date} at ${latest.booking_time}</span></p>
            <p><strong>⏳ Duration:</strong> <span>${latest.duration}</span></p>
            <p><strong>💰 Total Fee:</strong> <span id="dashPrice">${latest.price}</span></p>
            <p><strong>Status:</strong>
                <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 12px; border-radius: 15px; font-weight: 700; font-size: 12px; text-transform: uppercase;">
                    ${latest.status}
                </span>
            </p>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <a href="my-bookings.html" style="font-size: 13px; color: #2563eb; font-weight: 600; text-decoration: none;">
                    View All Bookings & Details &rarr;
                </a>
            </div>
        </div>
    `;
}