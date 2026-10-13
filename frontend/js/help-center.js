const search = document.getElementById("searchHelp");

const cards = document.querySelectorAll(".help-card");

search.addEventListener("keyup", () => {

const value = search.value.toLowerCase();

cards.forEach(card=>{

const text = card.innerText.toLowerCase();

card.style.display = text.includes(value) ? "block" : "none";

});

});