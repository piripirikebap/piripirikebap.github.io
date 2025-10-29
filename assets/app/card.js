var confirmElement = document.querySelector(".confirm");
var time = document.getElementById("time");

var date = new Date();

var updateText = document.querySelector(".bottom_update_value");

// Ustawienie daty ostatniej aktualizacji
if (localStorage.getItem("update") == null){
    localStorage.setItem("update", "24.12.2024")
}
if(updateText) updateText.innerHTML = localStorage.getItem("update");

var update = document.querySelector(".update");
if(update) update.addEventListener('click', () => {
    var newDate = date.toLocaleDateString("pl-PL", typeof options !== "undefined" ? options : {});
    localStorage.setItem("update", newDate);
    if(updateText) updateText.innerHTML = newDate;
    scroll(0, 0);
});

setClock();
function setClock(){
    date = new Date();
    // zabezpieczenia na wypadek, gdyby optionsTime/options nie były zdefiniowane globalnie
    var timeStr = (typeof optionsTime !== "undefined") ? date.toLocaleTimeString("pl-PL", optionsTime) : date.toLocaleTimeString("pl-PL");
    var dateStr = (typeof options !== "undefined") ? date.toLocaleDateString("pl-PL", options) : date.toLocaleDateString("pl-PL");
    if(time) time.innerHTML = "Czas: " + timeStr + " " + dateStr;
    // delay może być zdefiniowane gdzie indziej w Twoim projekcie; jeśli nie, użyj setTimeout fallback
    if (typeof delay === "function") {
        delay(1000).then(() => { setClock(); });
    } else {
        setTimeout(setClock, 1000);
    }
}

var unfold = document.querySelector(".info_holder");
if(unfold) unfold.addEventListener('click', () => {
    unfold.classList.toggle("unfolded");
});

// Parsowanie query string (bez bibliotek)
function getQueryParams() {
    const params = {};
    const q = window.location.search || "";
    if (!q) return params;
    q.substring(1).split("&").forEach(pair => {
        if(!pair) return;
        const idx = pair.indexOf("=");
        let key, value;
        if (idx === -1) {
            key = decodeURIComponent(pair);
            value = "";
        } else {
            key = decodeURIComponent(pair.substring(0, idx));
            value = decodeURIComponent(pair.substring(idx + 1).replace(/\+/g, " "));
        }
        if (key) params[key] = value;
    });
    return params;
}

// Generuje syntetyczny, poprawny PESEL na podstawie daty (dd.mm.yyyy lub dd-mm-yyyy lub yyyy-mm-dd) i płci ('m'/'k' lub 'male'/'female')
function generatePeselFromBirthday(birthdayStr, sex) {
    if (!birthdayStr) return "";
    // normalizuj separatory
    let parts;
    if (birthdayStr.includes(".")) parts = birthdayStr.split(".");
    else if (birthdayStr.includes("-")) parts = birthdayStr.split("-");
    else if (birthdayStr.includes("/")) parts = birthdayStr.split("/");
    else {
        // spróbuj yyyyMMdd
        if (birthdayStr.length === 8) parts = [birthdayStr.substring(6,8), birthdayStr.substring(4,6), birthdayStr.substring(0,4)];
        else return "";
    }

    // oczekujemy [dd, mm, yyyy] lub [yyyy, mm, dd]
    let dd, mm, yyyy;
    if (parts[0].length === 4) { // yyyy-mm-dd
        yyyy = parseInt(parts[0], 10);
        mm = parseInt(parts[1], 10);
        dd = parseInt(parts[2], 10);
    } else {
        dd = parseInt(parts[0], 10);
        mm = parseInt(parts[1], 10);
        yyyy = parseInt(parts[2], 10);
    }
    if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return "";

    // PESEL: YY MM DD, ale miesiąc modyfikowany według stulecia:
    // 1900-1999 => +0, 2000-2099 => +20, 1800-1899 => +80, 2100-2199 => +40, 2200-2299 => +60
    let month = mm;
    if (yyyy >= 2000 && yyyy <= 2099) month = mm + 20;
    else if (yyyy >= 1800 && yyyy <= 1899) month = mm + 80;
    else if (yyyy >= 2100 && yyyy <= 2199) month = mm + 40;
    else if (yyyy >= 2200 && yyyy <= 2299) month = mm + 60;
    // dla 1900-1999 month stays mm

    const yy = String(yyyy).slice(-2).padStart(2, "0");
    const mmStr = String(month).padStart(2, "0");
    const ddStr = String(dd).padStart(2, "0");

    // generujemy 5-cyfrowy numer serii (00000 - 99999), ale trzeba zadbać o parzystość ostatniej cyfry (sex)
    // ostatnia cyfra (10. cyfra) parity: odd male, even female
    // ustawmy losowo, ale z odpowiednią parzystością
    const randBase = Math.floor(Math.random()*10000); // 0-9999 -> 4 digits
    // wybierz czwarty bezpieczny numer tak, żeby mieć 5 cyfr: np. pad + random
    let serialFirst4 = String(randBase).padStart(4, "0");
    // teraz ostatnia cyfra:
    let lastDigit;
    if (!sex) {
        lastDigit = Math.floor(Math.random()*10);
    } else {
        const s = (typeof sex === "string") ? sex.toLowerCase() : "";
        if (s === "m" || s === "male" || s === "man") {
            // chcemy nieparzystą
            lastDigit = Math.floor(Math.random()*5)*2 + 1; // 1,3,5,7,9
        } else {
            // kobieta -> parzysta
            lastDigit = Math.floor(Math.random()*5)*2; // 0,2,4,6,8
        }
    }
    const serial = serialFirst4 + String(lastDigit); // 5 cyfr

    const first10 = (yy + mmStr + ddStr + serial).split("").map(c => parseInt(c,10));

    // Wagi do sumy kontrolnej: [1,3,7,9,1,3,7,9,1,3]
    const weights = [1,3,7,9,1,3,7,9,1,3];
    let sum = 0;
    for (let i=0;i<10;i++){
        sum += (first10[i] * weights[i]);
    }
    const control = (10 - (sum % 10)) % 10;

    const pesel = yy + mmStr + ddStr + serial + String(control);
    return pesel;
}

// Funkcja ustawiająca dane na stronie, z obsługą pesel fallback/generacji
function loadReadyDataFromURL(){
    const query = getQueryParams();

    const safe = key => (typeof query[key] !== "undefined" && query[key] !== null) ? query[key] : "";

    // Płeć: akceptujemy "m"/"k" lub pełne słowa, lub różne kapitalizacje
    let sexParam = safe("sex");
    // zunifikuj: jeśli ktoś poda "Mężczyzna" lub "male" -> zamień na 'm'
    if (sexParam) {
        const s = sexParam.toString().toLowerCase();
        if (s.startsWith("m")) sexParam = "m";
        else if (s.startsWith("k") || s.startsWith("f")) sexParam = "k";
    }

    let textSex = "";
    if(sexParam === "m") textSex = "Mężczyzna";
    else if(sexParam === "k") textSex = "Kobieta";
    else if (safe("sex") !== "") textSex = safe("sex"); // fallback do oryginalnej wartości

    // Dane podstawowe
    setData("name", safe("name") ? safe("name").toString().toUpperCase() : "");
    setData("surname", safe("surname") ? safe("surname").toString().toUpperCase() : "");
    setData("nationality", safe("nationality") ? safe("nationality").toString().toUpperCase() : "");
    setData("fathersName", safe("fathersName") ? safe("fathersName").toString().toUpperCase() : "");
    setData("mothersName", safe("mothersName") ? safe("mothersName").toString().toUpperCase() : "");
    setData("birthday", safe("birthday") ? safe("birthday") : "");
    setData("familyName", safe("familyName") ? safe("familyName").toString().toUpperCase() : "");
    setData("sex", textSex ? textSex.toUpperCase() : "");
    setData("fathersFamilyName", safe("fathersFamilyName") ? safe("fathersFamilyName").toString().toUpperCase() : "");
    setData("mothersFamilyName", safe("mothersFamilyName") ? safe("mothersFamilyName").toString().toUpperCase() : "");
    setData("birthPlace", safe("birthPlace") ? safe("birthPlace").toString().toUpperCase() : "");
    setData("countryOfBirth", safe("countryOfBirth") ? safe("countryOfBirth").toString().toUpperCase() : "");

    // adres - akceptujemy address1/address2 lub adress/adress1 (różne nazwy)
    const addr1 = safe("address1") || safe("adress1") || safe("address") || safe("adress");
    const addr2 = safe("address2") || safe("adress2") || safe("zip") || "";
    const city = safe("city") || "";
    const addressCombined = (addr1 || addr2 || city) ? ("ul. " + (addr1 || "") + (addr2 ? "<br>" + addr2 : "") + (city ? " " + city : "")) : "";
    setData("adress", addressCombined ? addressCombined.toString().toUpperCase() : "");

    // PESEL: priority -> URL param 'pesel' -> localStorage 'pesel' -> generate from birthday+sex -> empty
    let pesel = safe("pesel");
    if (!pesel && localStorage.getItem && localStorage.getItem("pesel")) {
        pesel = localStorage.getItem("pesel");
    }
    if (!pesel) {
        // spróbuj wygenerować z birthday i sex
        const birthdayParam = safe("birthday") || safe("birthdate") || safe("birth_date") || "";
        const sexForGen = sexParam || (safe("sex") ? safe("sex") : "");
        const gen = generatePeselFromBirthday(birthdayParam, sexForGen);
        if (gen) pesel = gen;
    }
    setData("pesel", pesel || "");

    // daty dokumentu
    // pozwalamy na różne nazwy parametrów: givenDate, given_date, issueDate, issued
    const given = safe("givenDate") || safe("given_date") || safe("issueDate") || safe("issued");
    const expiry = safe("expiryDate") || safe("expiry_date") || safe("expireDate") || safe("validTo");
    setData("givenDate", given || "");
    setData("expiryDate", expiry || "");

    if(safe("image")) setImage(safe("image"));

    // Home date
    if(!safe("homeDate")){
        var homeDay = getRandom ? getRandom(1, 25) : Math.floor(Math.random()*25)+1;
        var homeMonth = getRandom ? getRandom(0, 12) : Math.floor(Math.random()*12);
        var homeYear = getRandom ? getRandom(2012, 2019) : (2012 + Math.floor(Math.random()*8));
        var homeDate = new Date();
        homeDate.setDate(homeDay);
        homeDate.setMonth(homeMonth);
        homeDate.setFullYear(homeYear)
        var homeDateStr = (typeof options !== "undefined") ? homeDate.toLocaleDateString("pl-PL", options) : homeDate.toLocaleDateString("pl-PL");
        setData("home_date", homeDateStr);
    } else {
        setData("home_date", safe("homeDate"));
    }
}

// Funkcja ustawiająca obraz
function setImage(image){
    const el = document.querySelector(".id_own_image");
    if (!el) return;
    // bezpośrednie przypisanie tła
    el.style.backgroundImage = `url(${image})`;
}

// Funkcja ustawiająca tekst w elemencie
function setData(id, value){
    const el = document.getElementById(id);
    if(el) el.innerHTML = value !== undefined && value !== null ? value : "";
}

// Uruchomienie przy starcie
loadReadyDataFromURL();
