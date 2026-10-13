window.addEventListener("load", () => {
    console.log("Loader JS Loaded");

    const loader = document.getElementById("loader");

    setTimeout(() => {
        if (loader) {
            loader.style.display = "none";
        }
    }, 2000);
});