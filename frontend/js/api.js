/**
 * CareNest Central API & Utility Configuration
 * API Base URL and shared frontend helper functions
 */

const API_BASE_URL = "http://127.0.0.1:8000";

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = "success") {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `carenest-toast ${type}`;
    
    let icon = "fa-circle-check";
    let bg = "#10b981";
    if (type === "error") {
        icon = "fa-circle-exclamation";
        bg = "#ef4444";
    } else if (type === "warning") {
        icon = "fa-triangle-exclamation";
        bg = "#f59e0b";
    } else if (type === "info") {
        icon = "fa-circle-info";
        bg = "#2563eb";
    }

    toast.style.cssText = `
        background: white;
        color: #1e293b;
        border-left: 5px solid ${bg};
        padding: 14px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.12);
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 280px;
        max-width: 420px;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
    `;

    toast.innerHTML = `
        <i class="fa-solid ${icon}" style="color: ${bg}; font-size: 18px;"></i>
        <div style="flex: 1;">${message}</div>
    `;

    toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 20);

    // Animate out & remove
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(15px)";
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3500);
}

// ==========================================
// CENTRAL API FETCH WRAPPER
// ==========================================
async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(url, config);
        let data = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const errorMsg = (data && data.detail) ? data.detail : (data && data.message) ? data.message : `Request failed with status ${response.status}`;
            throw new Error(errorMsg);
        }

        return data;
    } catch (error) {
        console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
        if (error.name === "TypeError" && error.message.includes("fetch")) {
            showToast("Could not connect to CareNest server. Please ensure FastAPI is running (http://127.0.0.1:8000).", "error");
            throw new Error("Could not connect to CareNest server. Please ensure FastAPI is running on port 8000.");
        }
        throw error;
    }
}

// ==========================================
// AUTH & SESSION HELPERS
// ==========================================
function getUserSession() {
    try {
        const userStr = localStorage.getItem("currentUser") || localStorage.getItem("carenestUser");
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
}

function setUserSession(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("carenestUser", JSON.stringify(user));
    localStorage.setItem("isLoggedIn", "true");
    if (user.id) localStorage.setItem("userId", user.id);
    if (user.role) localStorage.setItem("userRole", user.role);
}

function getCaretakerId() {
    return localStorage.getItem("caretakerId");
}

function setCaretakerId(id) {
    if (id) {
        localStorage.setItem("caretakerId", id.toString());
    }
}

function getCaretakerProfile() {
    try {
        const p = localStorage.getItem("caretakerProfile");
        return p ? JSON.parse(p) : null;
    } catch (e) {
        return null;
    }
}

function setCaretakerProfile(profile) {
    if (profile) {
        localStorage.setItem("caretakerProfile", JSON.stringify(profile));
        if (profile.id) {
            localStorage.setItem("caretakerId", profile.id.toString());
        }
    }
}

function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("rememberUser");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("caretakerId");
    localStorage.removeItem("caretakerProfile");
    localStorage.removeItem("bookingData");
    showToast("Logged out successfully", "info");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 500);
}

// ==========================================
// DYNAMIC NAVBAR & COMMON UI
// ==========================================
function initNavbar() {
    const navButtons = document.getElementById("navButtons");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const caretakerId = localStorage.getItem("caretakerId");
    const userRole = localStorage.getItem("userRole");

    if (navButtons) {
        if (isLoggedIn || caretakerId) {
            let dashboardUrl = "dashboard.html";
            let dashboardLabel = "Dashboard";

            if (userRole === "admin") {
                dashboardUrl = "admin.html";
                dashboardLabel = "Admin Panel";
            } else if (caretakerId) {
                dashboardUrl = "caretaker-dashboard.html";
                dashboardLabel = "Caretaker Portal";
            }

            navButtons.innerHTML = `
                <a href="${dashboardUrl}" class="login-btn" style="display:flex;align-items:center;gap:6px;">
                    <i class="fa-solid fa-user-circle"></i> ${dashboardLabel}
                </a>
                <button onclick="logout()" class="register-btn" style="border:none;cursor:pointer;font-family:inherit;">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            `;
        }
    }

    // Add Admin link in nav-links if available
    const navLinks = document.querySelector(".nav-links");
    if (navLinks && !document.getElementById("navAdminLink")) {
        const adminLi = document.createElement("li");
        adminLi.id = "navAdminLink";
        adminLi.innerHTML = `<a href="admin.html" style="color:#2563eb;font-weight:600;"><i class="fa-solid fa-shield-halved"></i> Admin</a>`;
        navLinks.appendChild(adminLi);
    }
}

// Auto init navbar on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
});
