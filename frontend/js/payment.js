const paymentForm = document.getElementById("paymentForm");

const successPopup = document.getElementById("paymentSuccess");

const goDashboard = document.getElementById("goDashboard");

paymentForm.addEventListener("submit", function(e){

e.preventDefault();

successPopup.classList.add("active");

});

goDashboard.addEventListener("click", ()=>{

window.location.href="dashboard.html";

});