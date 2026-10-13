const password = document.getElementById("password");

const confirmPassword = document.getElementById("confirmPassword");

const togglePassword = document.getElementById("togglePassword");

const strengthBar = document.getElementById("strengthBar");

/* SHOW PASSWORD */

togglePassword.addEventListener("click",()=>{

if(password.type==="password"){

password.type="text";

confirmPassword.type="text";

togglePassword.classList.replace("fa-eye","fa-eye-slash");

}

else{

password.type="password";

confirmPassword.type="password";

togglePassword.classList.replace("fa-eye-slash","fa-eye");

}

});

/* PASSWORD STRENGTH */

password.addEventListener("input",()=>{

let value=password.value.length;

let width=0;

if(value>=1) width=25;
if(value>=4) width=50;
if(value>=8) width=75;
if(value>=12) width=100;

strengthBar.style.width=width+"%";

});

/* REGISTER */

document.getElementById("registerForm")

.addEventListener("submit",(e)=>{

e.preventDefault();

if(password.value!==confirmPassword.value){

alert("Passwords do not match!");

return;

}

alert("Registration will be connected with backend in Phase 2.");

});