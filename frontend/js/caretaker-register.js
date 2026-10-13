// ==========================================
// CARETAKER REGISTRATION
// ==========================================

const caretakerForm = document.getElementById("caretakerForm");

if (caretakerForm) {
    caretakerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const submitBtn = caretakerForm.querySelector("button[type='submit']");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Registering...`;

        const fullName = document.getElementById("caretakerName").value.trim();
        const email = document.getElementById("caretakerEmail").value.trim();
        const phone = document.getElementById("caretakerPhone").value.trim();
        const experienceYears = Number(document.getElementById("experienceYears").value) || 0;
        const skills = document.getElementById("caretakerSkills").value.trim();
        const services = document.getElementById("caretakerServices").value.trim();
        const availability = document.getElementById("caretakerAvailability").value.trim();

        const caretakerData = {
            full_name: fullName,
            email: email,
            phone: phone,
            experience_years: experienceYears,
            skills: skills,
            services: services,
            availability: availability,
            verification_status: "pending",
            is_available: true,
            profile_photo: ""
        };

        try {
            const data = await apiFetch("/caretakers/", {
                method: "POST",
                body: JSON.stringify(caretakerData)
            });

            console.log("Caretaker Registered Successfully:", data);

            // Robust storage of caretaker ID and profile
            if (data && data.id) {
                localStorage.setItem("caretakerId", data.id.toString());
                localStorage.setItem("caretakerProfile", JSON.stringify(data));
                localStorage.setItem("userRole", "caretaker");
                localStorage.setItem("isLoggedIn", "true");
                
                // Store user session too for cross-compatibility
                localStorage.setItem("currentUser", JSON.stringify({
                    id: data.id,
                    name: data.full_name,
                    email: data.email,
                    phone: data.phone,
                    role: "caretaker"
                }));
            }

            if (typeof showToast === "function") {
                showToast("Caretaker registration successful! Welcome to CareNest. 🎉", "success");
            } else {
                alert("Caretaker registration successful! 🎉");
            }

            setTimeout(() => {
                window.location.href = "caretaker-dashboard.html";
            }, 1200);

        } catch (error) {
            console.error("Registration Error:", error);
            if (typeof showToast === "function") {
                showToast(error.message || "Registration failed. Please check your information.", "error");
            } else {
                alert(error.message || "Caretaker registration failed.");
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}