const country = document.getElementById("country");
const state = document.getElementById("state");
const city = document.getElementById("city");

const data = {

India:{
"Haryana":["Yamunanagar","Jagadhri","Ambala","Kurukshetra","Karnal"],
"Punjab":["Ludhiana","Amritsar","Patiala","Jalandhar"],
"Delhi":["New Delhi","Dwarka","Rohini","Pitampura"]
},

USA:{
"California":["Los Angeles","San Francisco","San Diego"],
"Texas":["Houston","Dallas","Austin"],
"Florida":["Miami","Orlando","Tampa"]
},

Canada:{
"Ontario":["Toronto","Ottawa","Mississauga"],
"Alberta":["Calgary","Edmonton"]
},

UK:{
"England":["London","Manchester","Liverpool"],
"Scotland":["Edinburgh","Glasgow"]
},

Australia:{
"New South Wales":["Sydney","Newcastle"],
"Victoria":["Melbourne","Geelong"]
}

};

// Countries

for(let c in data){

country.innerHTML += `<option value="${c}">${c}</option>`;

}

// States

country.addEventListener("change",()=>{

state.innerHTML='<option>Select State</option>';

city.innerHTML='<option>Select City</option>';

for(let s in data[country.value]){

state.innerHTML += `<option value="${s}">${s}</option>`;

}

});

// Cities

state.addEventListener("change",()=>{

city.innerHTML='<option>Select City</option>';

data[country.value][state.value].forEach(c=>{

city.innerHTML += `<option>${c}</option>`;

});

});

// Current Location

document.getElementById("currentLocation").addEventListener("click",()=>{

alert("GPS Location feature will be connected in next update.");

});

// Continue

document.getElementById("locationForm").addEventListener("submit",(e)=>{

e.preventDefault();

const location={

country:country.value,

state:state.value,

city:city.value,

postal:document.getElementById("postalCode").value,

address:document.getElementById("address").value

};

localStorage.setItem("location",JSON.stringify(location));

alert("Location Saved Successfully ✅");

window.location.href="services.html";

});