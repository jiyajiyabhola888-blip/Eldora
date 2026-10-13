/**
 * CareNest Authentication Module
 * Handles User Registration, Login, Role Routing, and Password utilities
 */

// ================= SHOW / HIDE PASSWORD =================
document.querySelectorAll(".togglePassword, .toggle-password").forEach(icon => {
    icon.addEventListener("click", function () {
        const targetId = this.dataset.target || (this.id === "toggleRegPassword" ? "registerPassword" : "confirmPassword");
        const input = document.getElementById(targetId);
        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            this.classList.replace("fa-eye", "fa-eye-slash");
        } else {
            input.type = "password";
            this.classList.replace("fa-eye-slash", "fa-eye");
        }
    });
});

// ================= GOOGLE LOGIN =================
const googleBtn = document.querySelector(".google-btn");
if (googleBtn) {
    googleBtn.addEventListener("click", function () {
        if (typeof showToast === "function") {
            showToast("Google Login Coming Soon in v2.0 🚀", "info");
        } else {
            alert("Google Login Coming Soon 🚀");
        }
    });
}

// ================= RESET PASSWORD VALIDATION =================
const resetForm = document.querySelector("form.reset-form") || document.querySelector("form");
if (window.location.pathname.includes("reset-password") && resetForm) {
    resetForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const pass = document.getElementById("newPassword") ? document.getElementById("newPassword").value : "";
        const confirm = document.getElementById("confirmPassword") ? document.getElementById("confirmPassword").value : "";

        if (pass.length < 6) {
            showToast("Password must be at least 6 characters.", "error");
            return;
        }

        if (pass !== confirm) {
            showToast("Passwords do not match.", "error");
            return;
        }

        showToast("Password Updated Successfully! 🎉", "success");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    });
}

// ================= REGISTRATION =================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const submitBtn = registerForm.querySelector("button.login-btn") || registerForm.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.innerHTML : "Create Account";

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const phone = document.getElementById("registerPhone").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword") ? document.getElementById("confirmPassword").value : password;

        const roleSelect = registerForm.querySelector("select");
        const selectedRole = roleSelect ? roleSelect.value.toLowerCase() : "family";

        if (password.length < 6) {
            showToast("Password must be at least 6 characters.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        // If user selects Caretaker from registration, route them to Caretaker Register profile
        if (selectedRole === "caretaker") {
            localStorage.setItem("tempCaretakerSignup", JSON.stringify({ name, email, phone }));
            showToast("Redirecting to complete your Caretaker profile...", "info");
            setTimeout(() => {
                window.location.href = "caretaker-register.html";
            }, 800);
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;
        }

        try {
            const data = await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone,
                    password: password,
                    role: selectedRole || "family"
                })
            });

            setUserSession({
                id: data.user_id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role
            });

            showToast("Registration Successful! Welcome to CareNest 🎉", "success");
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);

        } catch (error) {
            console.error("Register Error:", error);
            // Fallback for offline local storage
            const localUser = { name, email, phone, password, role: selectedRole };
            localStorage.setItem("carenestUser", JSON.stringify(localUser));
            setUserSession(localUser);

            showToast("Registration saved! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    });
}

// ================= LOGIN =================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const submitBtn = loginForm.querySelector("button.login-btn") || loginForm.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.innerHTML : "Login";

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        const rememberCheck = loginForm.querySelector("input[type='checkbox']");

        if (rememberCheck && rememberCheck.checked) {
            localStorage.setItem("rememberUser", "true");
        } else {
            localStorage.removeItem("rememberUser");
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Logging in...`;
        }

        try {
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            setUserSession({
                id: data.user_id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role
            });

            showToast("Login Successful! Welcome back ✅", "success");

            setTimeout(() => {
                if (data.role === "admin" || email.includes("admin")) {
                    window.location.href = "admin.html";
                } else if (data.role === "caretaker" || getCaretakerId()) {
                    window.location.href = "caretaker-dashboard.html";
                } else {
                    window.location.href = "dashboard.html";
                }
            }, 1000);

        } catch (error) {
            console.error("Login API Error:", error);

            // Fallback check: localStorage user or caretaker
            const localUser = getUserSession();
            const caretakerProfile = getCaretakerProfile();

            if (localUser && localUser.email === email && (!localUser.password || localUser.password === password)) {
                setUserSession(localUser);
                showToast("Login Successful ✅", "success");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1000);
            } else if (caretakerProfile && caretakerProfile.email === email) {
                setCaretakerProfile(caretakerProfile);
                showToast("Caretaker Login Successful ✅", "success");
                setTimeout(() => {
                    window.location.href = "caretaker-dashboard.html";
                }, 1000);
            } else {
                showToast(error.message || "Invalid Email or Password!", "error");
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    });
}
