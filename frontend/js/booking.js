/**
 * CareNest Booking Logic
 * Validates Minimum 4h rule, loads selected caretaker, calculates prices, and submits to FastAPI
 */

let selectedCaretakerId = null;
let selectedCaretakerObj = null;

const servicePrices = {
    "Home Care": 499,
    "Hospital Care": 699,
    "Travel Companion": 799,
    "Event Companion": 799,
    "Emergency Care": 999,
    "Nursing Care": 899,
    "Walking Support": 399,
    "Meal Assistance": 399,
    "Medicine Reminder": 349,
    "Medical Support": 799,
    "Daily Assistance": 499
};

document.addEventListener("DOMContentLoaded", () => {
    initBookingPage();
    setupFormListeners();
});

async function initBookingPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const paramCaretakerId = urlParams.get("caretaker_id");
    const paramService = urlParams.get("service") || localStorage.getItem("selectedService");

    // Set default date to today or tomorrow
    const dateInput = document.getElementById("bookingDate");
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split("T")[0];
        dateInput.min = today.toISOString().split("T")[0];
    }

    // Pre-fill user profile if logged in
    const userSession = getUserSession();
    if (userSession) {
        const nameInput = document.getElementById("bookingFullName");
        const emailInput = document.getElementById("bookingEmail");
        const phoneInput = document.getElementById("bookingPhone");
        if (nameInput && !nameInput.value) nameInput.value = userSession.name || userSession.full_name || "";
        if (emailInput && !emailInput.value) emailInput.value = userSession.email || "";
        if (phoneInput && !phoneInput.value) phoneInput.value = userSession.phone || "";
    }

    // Set Service if passed
    const serviceSelect = document.getElementById("service");
    if (serviceSelect && paramService) {
        for (let i = 0; i < serviceSelect.options.length; i++) {
            if (serviceSelect.options[i].text.toLowerCase().includes(paramService.toLowerCase())) {
                serviceSelect.selectedIndex = i;
                break;
            }
        }
    }

    // Load Caretaker selection
    if (paramCaretakerId) {
        selectedCaretakerId = parseInt(paramCaretakerId);
        await loadCaretakerSummary(selectedCaretakerId);
    } else {
        await loadAvailableCaretakersDropdown();
    }

    updatePriceSummary();
}

async function loadCaretakerSummary(caretakerId) {
    const caretakerContainer = document.querySelector(".selected-caretaker");
    const caretakerSummaryTitle = document.getElementById("summaryCaretakerName");

    try {
        const c = await apiFetch(`/caretakers/${caretakerId}`);
        selectedCaretakerObj = c;

        if (caretakerContainer) {
            caretakerContainer.innerHTML = `
                <div style="width: 55px; height: 55px; border-radius: 50%; background: #e0e7ff; color: #3730a3; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                    <i class="fa-solid fa-user-nurse"></i>
                </div>
                <div>
                    <h3 style="font-size: 16px; margin-bottom: 2px;">${c.full_name}</h3>
                    <p style="font-size: 12px; color: #64748b; margin-bottom: 2px;">⭐ ${c.rating || '4.9'} | ${c.services || 'Professional Caretaker'}</p>
                    <span style="font-size: 11px; color: ${c.verification_status === 'verified' ? '#15803d' : '#ea580c'}; font-weight: 600;">
                        ${c.verification_status === 'verified' ? '✔ Verified Care Companion' : '⚠️ Verification Pending'}
                    </span>
                </div>
            `;
        }

        if (caretakerSummaryTitle) {
            caretakerSummaryTitle.textContent = c.full_name;
        }

    } catch (e) {
        console.error("Failed to load caretaker summary:", e);
    }
}

async function loadAvailableCaretakersDropdown() {
    const caretakerContainer = document.querySelector(".selected-caretaker");
    try {
        const caretakers = await apiFetch("/caretakers/?verification_status=verified&is_available=true");
        if (caretakers && caretakers.length > 0) {
            selectedCaretakerObj = caretakers[0];
            selectedCaretakerId = caretakers[0].id;
            
            if (caretakerContainer) {
                caretakerContainer.innerHTML = `
                    <div style="width: 100%;">
                        <label style="display:block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 5px;">Assigned Verified Caretaker</label>
                        <select id="caretakerPicker" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 13px;">
                            ${caretakers.map(c => `
                                <option value="${c.id}" ${c.id === selectedCaretakerId ? 'selected' : ''}>
                                    ${c.full_name} (⭐ ${c.rating || '4.9'} • ${c.experience_years}y exp)
                                </option>
                            `).join("")}
                        </select>
                    </div>
                `;

                document.getElementById("caretakerPicker").addEventListener("change", (e) => {
                    selectedCaretakerId = parseInt(e.target.value);
                    selectedCaretakerObj = caretakers.find(c => c.id === selectedCaretakerId);
                    updatePriceSummary();
                });
            }
        }
    } catch (e) {
        console.log("Could not load dynamic caretaker picker");
    }
}

function updatePriceSummary() {
    const serviceSelect = document.getElementById("service");
    const durationTypeSelect = document.getElementById("durationType");
    const durationValueInput = document.getElementById("durationValue");

    const selectedServiceEl = document.getElementById("selectedService");
    const selectedDurationEl = document.getElementById("selectedDuration");
    const summaryCaretakerEl = document.getElementById("summaryCaretakerName");
    const gstEl = document.getElementById("summaryGst");
    const platformFeeEl = document.getElementById("summaryPlatformFee");
    const totalPriceEl = document.getElementById("totalPrice");

    const serviceName = serviceSelect ? serviceSelect.value : "Home Care";
    const durationType = durationTypeSelect ? durationTypeSelect.value : "Hours";
    let durationVal = durationValueInput ? (parseInt(durationValueInput.value) || 4) : 4;

    // Minimum 4 Hours enforce on input
    if (durationType === "Hours" && durationVal < 4) {
        durationVal = 4;
        if (durationValueInput && durationValueInput.value) {
            durationValueInput.value = 4;
        }
    }

    const durationDisplay = `${durationVal} ${durationType}`;
    if (selectedServiceEl) selectedServiceEl.textContent = serviceName || "Home Care";
    if (selectedDurationEl) selectedDurationEl.textContent = durationDisplay;
    if (summaryCaretakerEl) summaryCaretakerEl.textContent = selectedCaretakerObj ? selectedCaretakerObj.full_name : "Best Match Assigned";

    // Pricing calculation
    const baseUnitRate = servicePrices[serviceName] || 499;
    let baseTotal = baseUnitRate;

    if (durationType === "Hours") {
        baseTotal = Math.round(baseUnitRate * (durationVal / 4.0));
    } else if (durationType === "Days") {
        baseTotal = baseUnitRate * 3 * durationVal;
    } else if (durationType === "Months") {
        baseTotal = baseUnitRate * 25 * 3 * durationVal;
    } else if (durationType === "Years") {
        baseTotal = baseUnitRate * 300 * 3 * durationVal;
    }

    const gst = Math.round(baseTotal * 0.18);
    const platformFee = 30;
    const grandTotal = baseTotal + gst + platformFee;

    if (gstEl) gstEl.textContent = `₹${gst}`;
    if (platformFeeEl) platformFeeEl.textContent = `₹${platformFee}`;
    if (totalPriceEl) totalPriceEl.textContent = `₹${grandTotal.toLocaleString()}`;
}

function setupFormListeners() {
    const serviceSelect = document.getElementById("service");
    const durationTypeSelect = document.getElementById("durationType");
    const durationValueInput = document.getElementById("durationValue");

    if (serviceSelect) serviceSelect.addEventListener("change", updatePriceSummary);
    if (durationTypeSelect) {
        durationTypeSelect.addEventListener("change", () => {
            if (durationValueInput) {
                if (durationTypeSelect.value === "Hours") {
                    durationValueInput.min = "4";
                    durationValueInput.placeholder = "Hours (Min 4)";
                    if (parseInt(durationValueInput.value) < 4) durationValueInput.value = 4;
                } else {
                    durationValueInput.min = "1";
                    durationValueInput.placeholder = "Duration";
                }
            }
            updatePriceSummary();
        });
    }
    if (durationValueInput) durationValueInput.addEventListener("input", updatePriceSummary);

    // Form submission
    const form = document.getElementById("bookingForm");
    if (form) {
        form.addEventListener("submit", handleBookingSubmit);
    }

    const closePopupBtn = document.getElementById("closePopup");
    if (closePopupBtn) {
        closePopupBtn.addEventListener("click", () => {
            const popup = document.getElementById("successPopup");
            if (popup) popup.classList.remove("active");
            window.location.href = "my-bookings.html";
        });
    }
}

async function handleBookingSubmit(e) {
    e.preventDefault();

    const submitBtn = document.querySelector("#bookingForm button[type='submit']");
    const originalText = submitBtn.innerHTML;

    const service = document.getElementById("service").value;
    const bookingDate = document.getElementById("bookingDate").value;
    const bookingTime = document.getElementById("bookingTime").value;
    const durationType = document.getElementById("durationType").value || "Hours";
    const durationVal = parseInt(document.getElementById("durationValue").value) || 4;

    // RULE 1: Minimum 4 Hours validation
    if (durationType === "Hours" && durationVal < 4) {
        showToast("Minimum caretaker duty duration is 4 hours. Please enter 4 or more.", "error");
        alert("⚠️ Minimum Caretaker Duty Duration is 4 Hours.\nPlease adjust your booking duration to 4 hours or more.");
        return;
    }

    const durationStr = `${durationVal} ${durationType}`;
    const totalPriceStr = document.getElementById("totalPrice").textContent;

    // Elder & User Details
    const elderName = document.getElementById("elderName").value.trim();
    const elderAge = parseInt(document.getElementById("elderAge").value) || 70;
    const elderGender = document.getElementById("elderGender").value || "Senior";
    const houseNo = document.getElementById("elderHouse").value.trim();
    const street = document.getElementById("elderStreet").value.trim();
    const city = document.getElementById("elderCity").value.trim();
    const fullAddress = `${houseNo}, ${street}, ${city}`;

    const specialInstructions = document.getElementById("specialInstructions") ? document.getElementById("specialInstructions").value.trim() : "";

    // Gather Medical conditions
    const checkedConditions = Array.from(document.querySelectorAll('.medical-grid input[type="checkbox"]:checked')).map(c => c.parentElement.textContent.trim());

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting Booking...`;

    let userSession = getUserSession();
    const userId = userSession ? (userSession.id || 1) : 1;

    try {
        // Step 1: Save or register elder details in backend
        let elderId = null;
        try {
            const elderRes = await apiFetch("/elders/", {
                method: "POST",
                body: JSON.stringify({
                    name: elderName,
                    age: elderAge,
                    gender: elderGender,
                    phone: document.getElementById("bookingPhone").value.trim() || "0000000000",
                    medical_conditions: checkedConditions.join(", ") || "None",
                    care_requirements: service
                })
            });
            elderId = elderRes.id;
        } catch (elderErr) {
            console.warn("Elder creation warning:", elderErr);
        }

        // Step 2: Create Booking
        const bookingPayload = {
            user_id: userId,
            elder_id: elderId,
            caretaker_id: selectedCaretakerId,
            service: service,
            duration: durationStr,
            booking_date: bookingDate,
            booking_time: bookingTime,
            address: fullAddress,
            special_instructions: specialInstructions,
            price: totalPriceStr,
            status: "confirmed"
        };

        const bookingRes = await apiFetch("/bookings/", {
            method: "POST",
            body: JSON.stringify(bookingPayload)
        });

        console.log("Booking created successfully:", bookingRes);

        // Store latest booking in localStorage
        localStorage.setItem("bookingData", JSON.stringify({
            id: bookingRes.id,
            name: elderName,
            service: service,
            date: bookingDate,
            time: bookingTime,
            price: totalPriceStr,
            status: bookingRes.status,
            caretaker_name: bookingRes.caretaker_name || (selectedCaretakerObj ? selectedCaretakerObj.full_name : "Assigned Caretaker")
        }));

        // Show Success Popup
        const popup = document.getElementById("successPopup");
        if (popup) {
            const popupMsg = popup.querySelector("p");
            if (popupMsg) {
                popupMsg.innerHTML = `
                    Your booking <strong>#${bookingRes.id}</strong> for <strong>${service}</strong> on <strong>${bookingDate}</strong> has been confirmed! 🎉
                `;
            }
            popup.classList.add("active");
        } else {
            alert(`🎉 Booking Successful!\n\nBooking ID: #${bookingRes.id}\nService: ${service}\nDate: ${bookingDate}\nDuration: ${durationStr}\nTotal: ${totalPriceStr}`);
            window.location.href = "my-bookings.html";
        }

    } catch (error) {
        console.error("Booking Error:", error);
        showToast(error.message || "Failed to complete booking. Please try again.", "error");
        alert(error.message || "Booking creation failed.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}