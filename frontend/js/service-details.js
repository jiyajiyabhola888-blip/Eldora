const service = localStorage.getItem("selectedService");

const title = document.getElementById("serviceTitle");
const price = document.getElementById("servicePrice");

const prices = {

"Home Care":"Starting ₹499",

"Hospital Care":"Starting ₹699",

"Nursing Care":"Starting ₹899",

"Medicine Reminder":"Starting ₹299",

"Walking Support":"Starting ₹399",

"Meal Assistance":"Starting ₹349",

"Travel Companion":"Starting ₹799",

"Emergency Care":"Starting ₹999"

};

if(service){

title.textContent = service;

price.textContent = prices[service];

}