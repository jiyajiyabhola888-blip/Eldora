/* ==========================================
            CARENEST MAIN SCRIPT
========================================== */

/* ============ PAGE LOADER ============ */

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    if (loader) {

        loader.style.opacity = "0";

        setTimeout(() => {

            loader.style.display = "none";

        }, 4500);

    }

});

/* ============ STICKY NAVBAR ============ */

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if (!navbar) return;

    if (window.scrollY > 50) {

        navbar.classList.add("sticky");

    } else {

        navbar.classList.remove("sticky");

    }

});

/* ============ BACK TO TOP ============ */

const topBtn = document.getElementById("topBtn");

window.addEventListener("scroll", () => {

    if (!topBtn) return;

    if (window.scrollY > 300) {

        topBtn.classList.add("show");

    } else {

        topBtn.classList.remove("show");

    }

});

if (topBtn) {

    topBtn.addEventListener("click", () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

}

/* ============ SCROLL PROGRESS ============ */

const progressBar = document.getElementById("progressBar");

window.addEventListener("scroll", () => {

    if (!progressBar) return;

    const scrollTop = document.documentElement.scrollTop;

    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    const progress = (scrollTop / scrollHeight) * 100;

    progressBar.style.width = progress + "%";

});

/* ============ SMOOTH SCROLL ============ */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {

            target.scrollIntoView({

                behavior: "smooth"

            });

        }

    });

});

/* ============ BOOK BUTTON ============ */


/* ============ ACTIVE NAV LINK ============ */

const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll(".nav-links a").forEach(link => {

    const href = link.getAttribute("href");

    if (href === currentPage) {

        link.classList.add("active");

    }

});
// ===============================
// Dynamic Navbar
// ===============================

const navButtons = document.getElementById("navButtons");

if(navButtons){

    if(localStorage.getItem("isLoggedIn") === "true"){

        navButtons.innerHTML = `

        <a href="dashboard.html" class="login-btn">
            Dashboard
        </a>

        <a href="#" id="logoutBtn" class="register-btn">
            Logout
        </a>

        `;

        document.getElementById("logoutBtn").addEventListener("click",function(e){

            e.preventDefault();

            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("rememberUser");

            window.location.href="login.html";

        });

    }

}
function selectService(service){

localStorage.setItem("selectedService",service);

}