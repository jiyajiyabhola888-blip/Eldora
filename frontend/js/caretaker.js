/**
 * CareNest Caretaker Discovery & AI Recommendation Engine
 */

let allCaretakers = [];

document.addEventListener("DOMContentLoaded", () => {
    initCaretakerList();
    setupSearchAndFilters();
    setupAIMatcher();
});

async function initCaretakerList() {
    const grid = document.getElementById("caretakerGrid") || document.querySelector(".caretaker-grid");
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 50px 20px;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 32px; color: #2563eb; margin-bottom: 12px; display:block;"></i>
            <p style="color: #64748b; font-size: 15px;">Finding trusted caretakers near you...</p>
        </div>
    `;

    try {
        const caretakers = await apiFetch("/caretakers/");
        allCaretakers = caretakers;
        renderCaretakers(caretakers);
    } catch (error) {
        console.error("Failed to fetch caretakers from backend:", error);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 40px 20px; background: white; border-radius: 16px; border: 1px dashed #cbd5e1;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 36px; color: #f59e0b; margin-bottom: 12px; display:block;"></i>
                <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 6px;">Could Not Load Caretakers</h3>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 15px;">Please check if FastAPI backend is running on port 8000.</p>
                <button onclick="initCaretakerList()" style="padding: 10px 20px; border-radius: 10px; border: none; background: #2563eb; color: white; font-weight: 600; cursor: pointer;">
                    <i class="fa-solid fa-rotate-right"></i> Retry
                </button>
            </div>
        `;
    }
}

function renderCaretakers(caretakers = []) {
    const grid = document.getElementById("caretakerGrid") || document.querySelector(".caretaker-grid");
    if (!grid) return;

    if (caretakers.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 50px 20px; background: white; border-radius: 16px;">
                <i class="fa-solid fa-user-slash" style="font-size: 40px; color: #cbd5e1; margin-bottom: 12px; display:block;"></i>
                <h3 style="font-size: 18px; color: #1e293b; margin-bottom: 6px;">No Caretakers Found</h3>
                <p style="color: #64748b; font-size: 14px;">Try modifying your search query or service filter.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = caretakers.map(c => {
        const isVerified = c.verification_status === "verified";
        const isAvailable = Boolean(c.is_available);
        const rating = c.rating ? c.rating.toFixed(1) : "4.9";
        const serviceTag = c.services ? c.services.split(",")[0].trim() : "Home Care";

        let badgeHtml = isVerified 
            ? `<span class="verified" style="background:#dcfce7; color:#15803d; border: 1px solid #bbf7d0;"><i class="fa-solid fa-circle-check"></i> Verified</span>`
            : `<span class="verified" style="background:#fff7ed; color:#ea580c; border: 1px solid #fed7aa;"><i class="fa-solid fa-shield-halved"></i> Verification Pending</span>`;

        let availBadge = isAvailable
            ? `<span style="font-size:11px; background:#e0f2fe; color:#0369a1; padding: 3px 8px; border-radius: 12px; font-weight: 600;"><i class="fa-solid fa-circle" style="font-size: 7px; color:#0284c7;"></i> Available</span>`
            : `<span style="font-size:11px; background:#f1f5f9; color:#64748b; padding: 3px 8px; border-radius: 12px; font-weight: 600;">Currently Offline</span>`;

        return `
            <div class="caretaker-card" data-service="${(c.services || '').toLowerCase()}" data-name="${c.full_name.toLowerCase()}" style="position: relative; transition: transform 0.2s, box-shadow 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    ${badgeHtml}
                    ${availBadge}
                </div>

                <div class="avatar" style="width: 75px; height: 75px; margin: 0 auto 15px; border-radius: 50%; background: #e0e7ff; color: #3730a3; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                    <i class="fa-solid fa-user-nurse"></i>
                </div>

                <h3 style="font-size: 19px; color: #1e293b; margin-bottom: 4px;">${c.full_name}</h3>
                <p class="role" style="color: #2563eb; font-size: 13px; font-weight: 600; margin-bottom: 12px;">
                    ${serviceTag} Specialist
                </p>

                <div class="info" style="font-size: 13px; line-height: 1.8; color: #475569; margin-bottom: 18px; text-align: left; background: #f8faff; padding: 12px 14px; border-radius: 12px;">
                    <div>⭐ <strong>${rating}</strong> Rating (${c.reviews_count || 5}+ reviews)</div>
                    <div>🩺 <strong>${c.experience_years || 0} Years</strong> Experience</div>
                    <div>🛠 <strong>Skills:</strong> ${c.skills || 'Elder Care, Hygiene, First Aid'}</div>
                    <div>🕒 <strong>Hours:</strong> ${c.availability || 'Flexible Shifts (Min 4h)'}</div>
                </div>

                <a href="booking.html?caretaker_id=${c.id}&service=${encodeURIComponent(serviceTag)}" 
                   class="book-btn" 
                   style="display: block; text-decoration: none; text-align: center; width: 100%;">
                    Book Caretaker
                </a>
            </div>
        `;
    }).join("");
}

function setupSearchAndFilters() {
    const searchInput = document.getElementById("searchInput");
    const serviceFilter = document.getElementById("serviceFilter");

    function applyFilter() {
        const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
        const service = (serviceFilter ? serviceFilter.value : "all").toLowerCase().trim();

        const filtered = allCaretakers.filter(c => {
            const name = (c.full_name || "").toLowerCase();
            const skills = (c.skills || "").toLowerCase();
            const services = (c.services || "").toLowerCase();

            const matchesQuery = !query || name.includes(query) || skills.includes(query) || services.includes(query);
            const matchesService = service === "all" || services.includes(service);

            return matchesQuery && matchesService;
        });

        renderCaretakers(filtered);
    }

    if (searchInput) searchInput.addEventListener("input", applyFilter);
    if (serviceFilter) serviceFilter.addEventListener("change", applyFilter);
}

// ==========================================
// AI CARETAKER MATCHER MODAL
// ==========================================
function setupAIMatcher() {
    const triggerBtn = document.getElementById("openAIMatcherBtn");
    if (!triggerBtn) return;

    triggerBtn.addEventListener("click", () => {
        let modal = document.getElementById("aiMatcherModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "aiMatcherModal";
            modal.style.cssText = `
                position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px);
                z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px;
            `;

            modal.innerHTML = `
                <div style="background: white; border-radius: 20px; padding: 30px; width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                <i class="fa-solid fa-wand-magic-sparkles"></i>
                            </div>
                            <div>
                                <h3 style="font-size: 20px; color: #1e293b; margin: 0;">AI Care Companion Matcher</h3>
                                <p style="font-size: 13px; color: #64748b; margin: 0;">Get customized caretaker recommendations powered by compatibility algorithms</p>
                            </div>
                        </div>
                        <button id="closeAIModal" style="background: none; border: none; font-size: 22px; color: #94a3b8; cursor: pointer;">&times;</button>
                    </div>

                    <form id="aiMatcherForm">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Primary Care Service Needed</label>
                            <select id="aiServiceNeeded" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-family: inherit;">
                                <option value="Home Care">Home Care (Daily living, hygiene, companionship)</option>
                                <option value="Hospital Care">Hospital Care (Bedside support, night shifts)</option>
                                <option value="Travel Companion">Travel Companion (Airport & journey assistance)</option>
                                <option value="Medical Support">Medical Support (Injections, vitals & dressing)</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Elder Medical Conditions (Select all that apply)</label>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; font-size: 13px; color: #475569;">
                                <label><input type="checkbox" name="aiCond" value="Diabetes"> Diabetes</label>
                                <label><input type="checkbox" name="aiCond" value="Dementia"> Dementia</label>
                                <label><input type="checkbox" name="aiCond" value="Alzheimer"> Alzheimer's</label>
                                <label><input type="checkbox" name="aiCond" value="Parkinson"> Parkinson's</label>
                                <label><input type="checkbox" name="aiCond" value="Stroke"> Stroke Recovery</label>
                                <label><input type="checkbox" name="aiCond" value="Wheelchair"> Mobility Support</label>
                                <label><input type="checkbox" name="aiCond" value="Bedridden"> Bedridden Care</label>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div>
                                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Preferred Language</label>
                                <select id="aiLanguage" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-family: inherit;">
                                    <option value="Hindi">Hindi</option>
                                    <option value="English">English</option>
                                    <option value="Punjabi">Punjabi</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Minimum Experience</label>
                                <select id="aiMinExp" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-family: inherit;">
                                    <option value="0">Any Experience</option>
                                    <option value="2">2+ Years</option>
                                    <option value="4">4+ Years</option>
                                    <option value="6">6+ Years</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" id="runAIMatchBtn" style="width: 100%; padding: 13px; border-radius: 10px; border: none; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; font-weight: 600; font-family: inherit; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fa-solid fa-brain"></i> Generate AI Compatibility Recommendations
                        </button>
                    </form>

                    <div id="aiResultsContainer" style="margin-top: 25px; display: none;"></div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById("closeAIModal").addEventListener("click", () => {
                modal.style.display = "none";
            });

            document.getElementById("aiMatcherForm").addEventListener("submit", runAIMatching);
        }

        modal.style.display = "flex";
    });
}

async function runAIMatching(e) {
    e.preventDefault();
    const btn = document.getElementById("runAIMatchBtn");
    const container = document.getElementById("aiResultsContainer");
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Calculating Compatibility Matrix...`;

    const serviceNeeded = document.getElementById("aiServiceNeeded").value;
    const selectedConds = Array.from(document.querySelectorAll('input[name="aiCond"]:checked')).map(cb => cb.value);
    const preferredLang = document.getElementById("aiLanguage").value;
    const minExp = parseInt(document.getElementById("aiMinExp").value) || 0;

    const payload = {
        service_needed: serviceNeeded,
        medical_conditions: selectedConds,
        min_experience_years: minExp,
        preferred_language: preferredLang
    };

    try {
        const res = await apiFetch("/ai/recommend-caretakers", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        container.style.display = "block";
        container.innerHTML = `
            <div style="background: #f8faff; border-radius: 14px; padding: 18px; border: 1px solid #e0e7ff; margin-bottom: 20px;">
                <h4 style="font-size: 15px; color: #1e293b; margin-bottom: 6px;"><i class="fa-solid fa-chart-line" style="color:#2563eb;"></i> AI Compatibility Analysis</h4>
                <p style="font-size: 13px; color: #475569; line-height: 1.5;">${res.summary_analysis}</p>
            </div>

            <h4 style="font-size: 16px; color: #1e293b; margin-bottom: 12px;">Top Matched Caregivers:</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${res.recommendations.slice(0, 3).map(rec => `
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <strong style="font-size: 16px; color: #1e293b;">${rec.full_name}</strong>
                                <span style="background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">
                                    ${rec.match_score}% Match
                                </span>
                            </div>
                            <p style="font-size: 12px; color: #64748b; margin-bottom: 6px;">${rec.experience_years} Years Experience • ${rec.services || 'Home Care'}</p>
                            <div style="font-size: 12px; color: #15803d;">
                                ${rec.match_reasons.slice(0, 2).map(r => `<div>${r}</div>`).join("")}
                            </div>
                        </div>
                        <a href="booking.html?caretaker_id=${rec.caretaker_id}&service=${encodeURIComponent(serviceNeeded)}" 
                           style="padding: 10px 18px; border-radius: 10px; background: #2563eb; color: white; font-size: 13px; font-weight: 600; text-decoration: none; white-space: nowrap;">
                            Book Now
                        </a>
                    </div>
                `).join("")}
            </div>
        `;
    } catch (error) {
        showToast(error.message || "Failed to generate AI recommendations", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}