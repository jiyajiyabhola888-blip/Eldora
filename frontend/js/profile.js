/**
 * CareNest User Profile Management
 */

document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
    setupProfileSave();
});

function loadUserProfile() {
    const user = getUserSession();
    if (user) {
        if (document.getElementById("name")) document.getElementById("name").value = user.name || user.full_name || "";
        if (document.getElementById("email")) document.getElementById("email").value = user.email || "";
        if (document.getElementById("phone")) document.getElementById("phone").value = user.phone || "";
        if (document.getElementById("address")) document.getElementById("address").value = user.address || "";
    }
}

function setupProfileSave() {
    const saveBtn = document.getElementById("saveProfile");
    if (!saveBtn) return;

    saveBtn.addEventListener("click", () => {
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const address = document.getElementById("address").value.trim();

        const user = getUserSession() || {};
        const updated = {
            ...user,
            name,
            full_name: name,
            email,
            phone,
            address
        };

        setUserSession(updated);
        showToast("Profile information updated successfully! ✅", "success");
    });
}