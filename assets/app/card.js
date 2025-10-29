var confirmElement = document.querySelector(".confirm");
var time = document.getElementById("time");

var date = new Date();

var updateText = document.querySelector(".bottom_update_value");

// Ustawienie daty ostatniej aktualizacji – nadal można użyć localStorage tylko dla update
if (localStorage.getItem("update") == null){
    localStorage.setItem("update", "24.12.2024")
}
updateText.innerHTML = localStorage.getItem("update");

var update = document.querySelector(".update");
update.addEventListener('click', () => {
    var newDate = date.toLocaleDateString("pl-PL", options);
    localStorage.setItem("update", newDate);
    updateText.innerHTML = newDate;
    scroll(0, 0);
});

setClock();
function setClock(){
    date = new Date();
    time.innerHTML = "Czas: " + date.toLocaleTimeString("pl-PL", optionsTime) + " " + date.toLocaleDateString("pl-PL", options);    
    delay(1000).then(() => {
        setClock();
    })
}

var unfold = document.querySelector(".info_holder");
unfold.addEventListener('click', () => {
    unfold.classList.toggle("unfolded");
});

// Funkcja pobierająca dane z URL
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split("&").forEach(pair => {
        const [key, value] = pair.split("=");
        if (key) params[key] = decodeURIComponent(value.replace(/\+/g, " "));
    });
    return params;
}

// Funkcja ustawiająca dane na stronie
function loadReadyDataFromURL(){
    const query = getQueryParams();

    // Kod zabezpieczający – jeśli brak jakiegoś parametru, wpisujemy pusty string
    const safe = key => query[key] ? query[key] : "";

    // Ustawienie płci
    let textSex = "";
    if(safe("sex") === "m") textSex = "Mężczyzna";
    else if(safe("sex") === "k") textSex = "Kobieta";

    setData("name", safe("name").toUpperCase());
    setData("surname", safe("surname").toUpperCase());
    setData("nationality", safe("nationality").toUpperCase());
    setData("fathersName", safe("fathersName").toUpperCase());
    setData("mothersName", safe("mothersName").toUpperCase());
    setData("birthday", safe("birthday"));
    setData("familyName", safe("familyName").toUpperCase());
    setData("sex", textSex.toUpperCase());
    setData("fathersFamilyName", safe("fathersFamilyName").toUpperCase());
    setData("mothersFamilyName", safe("mothersFamilyName").toUpperCase());
    setData("birthPlace", safe("birthPlace").toUpperCase());
    setData("countryOfBirth", safe("countryOfBirth").toUpperCase());
    setData("adress", ("ul. " + safe("address1") + "<br>" + safe("address2") + " " + safe("city")).toUpperCase());
    setData("pesel", safe("pesel"));
    setData("givenDate", safe("givenDate"));
    setData("expiryDate", safe("expiryDate"));

    if(safe("image")) setImage(safe("image"));

    // Home date – jeśli nie podano w URL, generujemy losowo
    if(!safe("homeDate")){
        var homeDay = getRandom(1, 25);
        var homeMonth = getRandom(0, 12);
        var homeYear = getRandom(2012, 2019);
        var homeDate = new Date();
        homeDate.setDate(homeDay);
        homeDate.setMonth(homeMonth);
        homeDate.setFullYear(homeYear)
        setData("home_date", homeDate.toLocaleDateString("pl-PL", options));
    } else {
        setData("home_date", safe("homeDate"));
    }
}

function setImage(image){
    document.querySelector(".id_own_image").style.backgroundImage = `url(${image})`;
}

function setData(id, value){
    const el = document.getElementById(id);
    if(el) el.innerHTML = value;
}

// Uruchomienie przy starcie
loadReadyDataFromURL();
