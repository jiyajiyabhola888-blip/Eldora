/**
 * CareNest My Bookings Management & Caretaker Review System
 */

document.addEventListener("DOMContentLoaded", () => {
    initMyBookings();
});

async function initMyBookings() {
    const container = document.getElementById("bookingContainer");
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: #2563eb; margin-bottom: 12px; display:block;"></i>
            <p>Loading your care bookings...</p>
        </div>
    `;

    const user = getUserSession();
    const userId = user ? (user.id || 1) : 1;

    try {
        let bookings = await apiFetch(`/bookings/user/${userId}`);
        if (!bookings || bookings.length === 0) {
            // Check all bookings as fallback
            bookings = await apiFetch("/bookings/");
        }
        renderMyBookings(bookings);
    } catch (error) {
        console.error("Failed to load user bookings:", error);
        // Local fallback
        const local = localStorage.getItem("bookingData");
        if (local) {
            renderMyBookings([JSON.parse(local)]);
        } else {
            container.innerHTML = `
                <div style="text-align:center; padding: 50px 20px; background: white; border-radius: 16px;">
                    <i class="fa-solid fa-calendar-xmark" style="font-size: 40px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
                    <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 8px;">No Bookings Found</h3>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">You haven't scheduled any care companion shifts yet.</p>
                    <a href="booking.html" class="book-btn" style="text-decoration:none; display:inline-block;">Book a Caretaker</a>
                </div>
            `;
        }
    }
}

function renderMyBookings(bookings = []) {
    const container = document.getElementById("bookingContainer");
    if (!container) return;

    if (bookings.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 50px 20px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
                <i class="fa-solid fa-calendar-xmark" style="font-size: 44px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
                <h3 style="font-size: 20px; color: #1e293b; margin-bottom: 8px;">No Bookings Yet</h3>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">Schedule your first verified care companion shift today.</p>
                <a href="booking.html" class="book-btn" style="text-decoration:none; display:inline-block; padding: 12px 24px;">Book Now</a>
            </div>
        `;
        return;
    }

    container.innerHTML = bookings.map(b => {
        let statusBg = "#dcfce7";
        let statusColor = "#15803d";
        if (b.status === "pending") {
            statusBg = "#fff7ed"; statusColor = "#ea580c";
        } else if (b.status === "completed") {
            statusBg = "#f1f5f9"; statusColor = "#475569";
        } else if (b.status === "cancelled" || b.status === "rejected") {
            statusBg = "#fee2e2"; statusColor = "#b91c1c";
        }

        const canCancel = b.status === "confirmed" || b.status === "pending";
        const isCompleted = b.status === "completed";

        return `
            <div class="booking-card" style="background: white; border-radius: 16px; padding: 25px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h3 style="font-size: 20px; color: #1e293b; margin-bottom: 4px;">${b.service}</h3>
                        <p style="color: #64748b; font-size: 13px;">
                            <strong>Booking ID:</strong> #${b.id || '101'} • <strong>Recipient:</strong> ${b.elder_name || b.name || 'Elder Family Member'}
                        </p>
                    </div>
                    <span class="status" style="background: ${statusBg}; color: ${statusColor}; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 20px; text-transform: uppercase;">
                        ${b.status}
                    </span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; background: #f8faff; padding: 15px; border-radius: 12px; font-size: 14px; color: #334155; margin-bottom: 15px;">
                    <div>📅 <strong>Date:</strong> ${b.booking_date || b.date}</div>
                    <div>⏰ <strong>Time:</strong> ${b.booking_time || b.time}</div>
                    <div>⏳ <strong>Duration:</strong> ${b.duration || '4 Hours'}</div>
                    <div>💰 <strong>Amount:</strong> ${b.price}</div>
                    <div>👩 <strong>Caretaker:</strong> ${b.caretaker_name || 'Care Specialist Assigned'}</div>
                    <div>📍 <strong>Location:</strong> ${b.address || 'Chandigarh'}</div>
                </div>

                <div class="booking-buttons" style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                    <button onclick="viewBookingDetails(${JSON.stringify(b).replace(/"/g, '&quot;')})" class="view-btn" style="padding: 9px 18px; border-radius: 8px; border: 1px solid #cbd5e1; background: white; color: #334155; font-size: 13px; font-weight: 600; cursor: pointer;">
                        <i class="fa-solid fa-eye"></i> Details
                    </button>

                    ${canCancel ? `
                        <button onclick="cancelBooking(${b.id})" class="cancel-btn" style="padding: 9px 18px; border-radius: 8px; border: 1px solid #fca5a5; background: #fee2e2; color: #b91c1c; font-size: 13px; font-weight: 600; cursor: pointer;">
                            <i class="fa-solid fa-ban"></i> Cancel Booking
                        </button>
                    ` : ""}

                    ${isCompleted ? `
                        <button onclick="openReviewModal(${b.id}, ${b.caretaker_id || 1}, '${b.caretaker_name || 'Caretaker'}')" class="review-btn" style="padding: 9px 18px; border-radius: 8px; border: none; background: #f59e0b; color: white; font-size: 13px; font-weight: 600; cursor: pointer;">
                            ⭐ Rate & Review
                        </button>
                    ` : ""}
                </div>
            </div>
        `;
    }).join("");
}

function viewBookingDetails(b) {
    alert(`📋 CareNest Booking Details\n\nBooking ID: #${b.id}\nService: ${b.service}\nElder: ${b.elder_name || b.name || 'Family Member'}\nDate: ${b.booking_date || b.date}\nTime: ${b.booking_time || b.time}\nDuration: ${b.duration || '4 Hours'}\nPrice: ${b.price}\nStatus: ${b.status}\nLocation: ${b.address || 'Standard Location'}`);
}

async function cancelBooking(bookingId) {
    if (!confirm("Are you sure you want to cancel this care booking?")) return;

    try {
        await apiFetch(`/bookings/${bookingId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: "cancelled" })
        });
        showToast("Booking cancelled successfully.", "info");
        initMyBookings();
    } catch (error) {
        showToast(error.message || "Failed to cancel booking", "error");
    }
}

// ==========================================
// RATING & REVIEW MODAL
// ==========================================
function openReviewModal(bookingId, caretakerId, caretakerName) {
    let overlay = document.getElementById("reviewModalOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "reviewModalOverlay";
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(6px);
            z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px;
        `;
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 30px; width: 100%; max-width: 480px; box-shadow: 0 25px 50px rgba(0,0,0,0.2); text-align: center;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 15px;">
                ⭐
            </div>
            <h3 style="font-size: 20px; color: #1e293b; margin-bottom: 6px;">Review Caretaker</h3>
            <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Share your experience with <strong>${caretakerName}</strong></p>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px;">Your Rating</label>
                <div id="starRatingSelect" style="display: flex; justify-content: center; gap: 10px; font-size: 28px; cursor: pointer; color: #cbd5e1;">
                    <span data-star="1">★</span>
                    <span data-star="2">★</span>
                    <span data-star="3">★</span>
                    <span data-star="4">★</span>
                    <span data-star="5" style="color: #f59e0b;">★</span>
                </div>
            </div>

            <div style="margin-bottom: 20px; text-align: left;">
                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Your Comments / Feedback</label>
                <textarea id="reviewComment" rows="3" placeholder="Punctuality, kindness, attention to care..." style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 13px; resize: none;"></textarea>
            </div>

            <div style="display: flex; gap: 12px;">
                <button id="cancelReviewBtn" style="flex: 1; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; font-weight: 600; cursor: pointer;">
                    Cancel
                </button>
                <button id="submitReviewBtn" style="flex: 1.2; padding: 12px; border-radius: 10px; border: none; background: #f59e0b; color: white; font-weight: 600; cursor: pointer;">
                    Submit Review
                </button>
            </div>
        </div>
    `;

    overlay.style.display = "flex";

    let selectedRating = 5;
    const stars = overlay.querySelectorAll("#starRatingSelect span");
    stars.forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = parseInt(star.dataset.star);
            stars.forEach(s => {
                s.style.color = parseInt(s.dataset.star) <= selectedRating ? "#f59e0b" : "#cbd5e1";
            });
        });
    });

    document.getElementById("cancelReviewBtn").addEventListener("click", () => {
        overlay.style.display = "none";
    });

    document.getElementById("submitReviewBtn").addEventListener("click", async () => {
        const comment = document.getElementById("reviewComment").value.trim();
        const user = getUserSession();
        const userId = user ? (user.id || 1) : 1;

        try {
            await apiFetch("/reviews/", {
                method: "POST",
                body: JSON.stringify({
                    booking_id: bookingId,
                    caretaker_id: caretakerId,
                    user_id: userId,
                    rating: selectedRating,
                    comment: comment || "Excellent and caring assistance!"
                })
            });

            overlay.style.display = "none";
            showToast("Thank you! Review submitted successfully. ⭐", "success");
            initMyBookings();
        } catch (error) {
            showToast(error.message || "Failed to submit review", "error");
        }
    });
}