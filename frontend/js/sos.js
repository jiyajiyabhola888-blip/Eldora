/**
 * CareNest Emergency SOS Module
 * Prominent emergency trigger with instant backend alerting and location support
 */

function initEmergencySOS() {
    // Check if floating SOS button already exists
    if (document.getElementById("floating-sos-btn")) return;

    // Create Floating SOS Button
    const sosBtn = document.createElement("button");
    sosBtn.id = "floating-sos-btn";
    sosBtn.innerHTML = `<i class="fa-solid fa-truck-medical"></i> <span>EMERGENCY SOS</span>`;
    sosBtn.style.cssText = `
        position: fixed;
        bottom: 25px;
        left: 25px;
        z-index: 9999;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border: 3px solid rgba(255,255,255,0.4);
        border-radius: 50px;
        padding: 12px 22px;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.45);
        animation: pulseSOS 2s infinite;
        transition: transform 0.2s, box-shadow 0.2s;
    `;

    // Add pulse keyframes if not present
    if (!document.getElementById("sos-keyframes")) {
        const style = document.createElement("style");
        style.id = "sos-keyframes";
        style.innerHTML = `
            @keyframes pulseSOS {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
                70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
            .sos-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(6px);
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .sos-modal-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .sos-modal-card {
                background: white;
                border-radius: 20px;
                padding: 35px 30px;
                width: 90%;
                max-width: 480px;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            .sos-modal-overlay.active .sos-modal-card {
                transform: scale(1);
            }
        `;
        document.head.appendChild(style);
    }

    sosBtn.addEventListener("mouseenter", () => {
        sosBtn.style.transform = "scale(1.05)";
    });
    sosBtn.addEventListener("mouseleave", () => {
        sosBtn.style.transform = "scale(1)";
    });

    sosBtn.addEventListener("click", openSOSModal);
    document.body.appendChild(sosBtn);
}

function openSOSModal() {
    let overlay = document.getElementById("sosModalOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "sosModalOverlay";
        overlay.className = "sos-modal-overlay";
        overlay.innerHTML = `
            <div class="sos-modal-card">
                <div style="width: 70px; height: 70px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 10px;">Trigger Emergency SOS</h2>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 25px; line-height: 1.5;">
                    This will immediately broadcast an urgent medical / emergency assistance alert to the CareNest team and notify emergency contacts.
                </p>
                <div style="margin-bottom: 20px; text-align: left;">
                    <label style="font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Emergency Type</label>
                    <select id="sosEmergencyType" style="width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 14px; outline: none;">
                        <option value="Critical Medical Emergency">Critical Medical Emergency</option>
                        <option value="Fall / Injury Support">Fall / Injury Support</option>
                        <option value="Immediate Caretaker Dispatch">Immediate Caretaker Dispatch</option>
                        <option value="Urgent Medication / Support">Urgent Medication / Support</option>
                        <option value="Other Emergency">Other Emergency</option>
                    </select>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button id="sosCancelBtn" style="flex: 1; padding: 13px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f1f5f9; color: #475569; font-weight: 600; font-family: inherit; cursor: pointer;">
                        Cancel
                    </button>
                    <button id="sosConfirmBtn" style="flex: 1.2; padding: 13px; border-radius: 10px; border: none; background: #dc2626; color: white; font-weight: 600; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fa-solid fa-bell"></i> Send Alert
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById("sosCancelBtn").addEventListener("click", () => {
            overlay.classList.remove("active");
        });

        document.getElementById("sosConfirmBtn").addEventListener("click", submitSOSAlert);
    }

    overlay.classList.add("active");
}

async function submitSOSAlert() {
    const confirmBtn = document.getElementById("sosConfirmBtn");
    const emergencyType = document.getElementById("sosEmergencyType").value;
    const overlay = document.getElementById("sosModalOverlay");

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Dispatching...`;

    let userSession = getUserSession();
    let locationStr = "Sector 17, Chandigarh (Default Location)";

    // Try HTML5 Geolocation
    if (navigator.geolocation) {
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
            });
            locationStr = `GPS: Lat ${pos.coords.latitude.toFixed(4)}, Long ${pos.coords.longitude.toFixed(4)}`;
        } catch (e) {
            console.log("Geolocation fallback to standard location string");
        }
    }

    const payload = {
        user_id: userSession ? userSession.id : 1,
        caller_name: userSession ? (userSession.name || userSession.full_name) : "CareNest Family / Elder",
        caller_phone: userSession ? userSession.phone : "Emergency Line",
        location: locationStr,
        emergency_type: emergencyType
    };

    try {
        const res = await apiFetch("/sos/", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        overlay.classList.remove("active");
        showToast("SOS Alert created successfully! Emergency team has been notified. 🚨", "error");
        
        // Show confirmation alert
        alert(`🚨 SOS Emergency Alert Dispatched!\n\nAlert ID: #${res.id}\nType: ${res.emergency_type}\nLocation: ${res.location}\n\nCareNest Emergency Team and contacts have been alerted.`);
    } catch (err) {
        showToast("Failed to dispatch SOS alert. Please call emergency services directly: +91 9876543210", "error");
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<i class="fa-solid fa-bell"></i> Send Alert`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initEmergencySOS();
});
