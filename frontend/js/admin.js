/**
 * CareNest Admin Panel Logic
 * Manages caretaker verification, platform analytics, booking overview, and emergency SOS alerts
 */

document.addEventListener("DOMContentLoaded", () => {
    initAdminDashboard();
});

async function initAdminDashboard() {
    await loadAdminStats();
    await loadCaretakersAdmin();
    await loadBookingsAdmin();
    await loadSOSAdmin();
}

async function loadAdminStats() {
    try {
        const stats = await apiFetch("/admin/stats");
        
        document.getElementById("adminTotalUsers").textContent = stats.users ? stats.users.total : 0;
        document.getElementById("adminTotalCaretakers").textContent = stats.caretakers ? stats.caretakers.total : 0;
        document.getElementById("adminPendingCaretakers").textContent = stats.caretakers ? stats.caretakers.pending : 0;
        document.getElementById("adminVerifiedCaretakers").textContent = stats.caretakers ? stats.caretakers.verified : 0;
        document.getElementById("adminTotalBookings").textContent = stats.bookings ? stats.bookings.total : 0;
        document.getElementById("adminCompletedBookings").textContent = stats.bookings ? stats.bookings.completed : 0;
        document.getElementById("adminActiveSOS").textContent = stats.sos ? stats.sos.active : 0;
    } catch (error) {
        console.error("Failed to load admin stats:", error);
    }
}

async function loadCaretakersAdmin() {
    const tbody = document.getElementById("caretakerAdminTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Loading caretakers...</td></tr>`;

    try {
        const caretakers = await apiFetch("/caretakers/");
        if (caretakers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No caretakers registered yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = caretakers.map(c => {
            const status = (c.verification_status || "pending").toLowerCase();
            let statusBadge = `<span style="background:#fff7ed; color:#ea580c; font-weight:700; font-size:12px; padding:4px 10px; border-radius:12px; text-transform:uppercase;">Pending</span>`;
            if (status === "verified") {
                statusBadge = `<span style="background:#dcfce7; color:#15803d; font-weight:700; font-size:12px; padding:4px 10px; border-radius:12px; text-transform:uppercase;">Verified</span>`;
            } else if (status === "rejected") {
                statusBadge = `<span style="background:#fee2e2; color:#b91c1c; font-weight:700; font-size:12px; padding:4px 10px; border-radius:12px; text-transform:uppercase;">Rejected</span>`;
            }

            return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 14px 16px; font-weight: 600; color: #1e293b;">#${c.id}</td>
                    <td style="padding: 14px 16px;">
                        <div style="font-weight: 600; color: #1e293b;">${c.full_name}</div>
                        <div style="font-size: 12px; color: #64748b;">${c.email} • 📞 ${c.phone}</div>
                    </td>
                    <td style="padding: 14px 16px; color: #334155;">${c.experience_years} Years</td>
                    <td style="padding: 14px 16px; color: #334155; font-size: 13px;">${c.services || 'Home Care'}</td>
                    <td style="padding: 14px 16px;">${statusBadge}</td>
                    <td style="padding: 14px 16px;">
                        <span style="font-size: 12px; color: ${c.is_available ? '#15803d' : '#94a3b8'}; font-weight: 600;">
                            ${c.is_available ? '✔ Online' : '⏸ Offline'}
                        </span>
                    </td>
                    <td style="padding: 14px 16px; text-align: right;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            ${status !== "verified" ? `
                                <button onclick="setVerification(${c.id}, 'verified')" style="padding: 6px 12px; border-radius: 8px; border: none; background: #22c55e; color: white; font-size: 12px; font-weight: 600; cursor: pointer;">
                                    <i class="fa-solid fa-check"></i> Verify
                                </button>
                            ` : ""}
                            ${status !== "rejected" ? `
                                <button onclick="setVerification(${c.id}, 'rejected')" style="padding: 6px 12px; border-radius: 8px; border: none; background: #ef4444; color: white; font-size: 12px; font-weight: 600; cursor: pointer;">
                                    <i class="fa-solid fa-ban"></i> Reject
                                </button>
                            ` : ""}
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#ef4444;">Failed to load caretakers list.</td></tr>`;
    }
}

async function setVerification(caretakerId, newStatus) {
    try {
        await apiFetch(`/caretakers/${caretakerId}/verification`, {
            method: "PUT",
            body: JSON.stringify({ verification_status: newStatus })
        });
        showToast(`Caretaker #${caretakerId} marked as ${newStatus}!`, "success");
        await loadAdminStats();
        await loadCaretakersAdmin();
    } catch (error) {
        showToast(error.message || "Failed to update verification status", "error");
    }
}

async function loadBookingsAdmin() {
    const tbody = document.getElementById("bookingAdminTableBody");
    if (!tbody) return;

    try {
        const bookings = await apiFetch("/bookings/");
        if (bookings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">No bookings created yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = bookings.slice(0, 10).map(b => {
            let statusBg = "#dcfce7"; let statusColor = "#15803d";
            if (b.status === "pending") { statusBg = "#fff7ed"; statusColor = "#ea580c"; }
            else if (b.status === "cancelled" || b.status === "rejected") { statusBg = "#fee2e2"; statusColor = "#b91c1c"; }

            return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 16px; font-weight: 600;">#${b.id}</td>
                    <td style="padding: 12px 16px; font-weight: 600; color: #1e293b;">${b.service}</td>
                    <td style="padding: 12px 16px; color: #475569;">${b.elder_name || b.user_name || 'Elder'}</td>
                    <td style="padding: 12px 16px; color: #475569;">${b.booking_date} (${b.duration})</td>
                    <td style="padding: 12px 16px; font-weight: 600;">${b.price}</td>
                    <td style="padding: 12px 16px;">
                        <span style="background: ${statusBg}; color: ${statusColor}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;">
                            ${b.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        console.error("Failed to load admin bookings:", error);
    }
}

async function loadSOSAdmin() {
    const container = document.getElementById("adminSOSContainer");
    if (!container) return;

    try {
        const alerts = await apiFetch("/sos/");
        if (alerts.length === 0) {
            container.innerHTML = `<p style="color: #64748b; font-size: 14px; text-align: center; padding: 20px;">No emergency alerts active. System normal ✅</p>`;
            return;
        }

        container.innerHTML = alerts.map(a => `
            <div style="background: ${a.status === 'active' ? '#fee2e2' : '#f8fafc'}; border-left: 4px solid ${a.status === 'active' ? '#dc2626' : '#94a3b8'}; padding: 14px 18px; border-radius: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="color: #1e293b; font-size: 15px; margin-bottom: 3px;">
                        🚨 ${a.emergency_type}
                    </h4>
                    <p style="font-size: 13px; color: #475569; margin-bottom: 2px;">
                        <strong>Caller:</strong> ${a.caller_name} (${a.caller_phone}) • 📍 ${a.location}
                    </p>
                    <span style="font-size: 12px; color: #64748b;">Triggered at: ${new Date(a.created_at).toLocaleString()}</span>
                </div>
                <div>
                    ${a.status === 'active' ? `
                        <button onclick="resolveSOSAlert(${a.id})" style="padding: 8px 16px; border-radius: 8px; border: none; background: #dc2626; color: white; font-weight: 600; cursor: pointer; font-size: 13px;">
                            Mark Resolved
                        </button>
                    ` : `
                        <span style="color: #15803d; font-size: 13px; font-weight: 600;">✔ Resolved</span>
                    `}
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Failed to load SOS alerts:", error);
    }
}

async function resolveSOSAlert(sosId) {
    try {
        await apiFetch(`/sos/${sosId}/resolve`, { method: "PUT" });
        showToast(`SOS alert #${sosId} marked resolved`, "success");
        await loadAdminStats();
        await loadSOSAdmin();
    } catch (e) {
        showToast("Failed to resolve SOS alert", "error");
    }
}
