/* =========================================
            LOGIN PAGE
========================================= */

const password = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");

/* =============================
   SHOW / HIDE PASSWORD
============================= */

togglePassword.addEventListener("click", () => {

    if (password.type === "password") {

        password.type = "text";

        togglePassword.classList.remove("fa-eye");

        togglePassword.classList.add("fa-eye-slash");

    } else {

        password.type = "password";

        togglePassword.classList.remove("fa-eye-slash");

        togglePassword.classList.add("fa-eye");

    }

});

/* =============================
   LOGIN FORM
============================= */

const form = document.querySelector("form");

form.addEventListener("submit", (e) => {

    e.preventDefault();

    alert("Login will be connected with backend in Phase 2.");

});