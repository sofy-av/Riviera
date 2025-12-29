/* ============================================================
   CONFIGURACIÓN (TARIFAS ACTUALIZADAS)
============================================================ */
const HOST_PHONE = "50671628976";

/* FULL HOUSE */
const FULL_HOUSE = 120000;
const FULL_HOUSE_PROMO = 102000; // promo +3 noches

/* PART HOUSE */
const PARTIAL = {
    2: 52000,
    3: 60000,
    5: 84000,
    6: 100000,
};

const get = (id) => document.getElementById(id);

/* ============================================================
   HELPERS DE FECHA LOCAL
============================================================ */
function toLocalDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getNights(inDate, outDate) {
    return Math.ceil((outDate - inDate) / 86400000);
}

/* ============================================================
   VALIDACIÓN FECHAS FORMULARIO
============================================================ */
(function setMinDates() {
    const today = toLocalDateString(new Date());
    if (get("checkin")) get("checkin").min = today;
    if (get("checkout")) get("checkout").min = today;
})();

function validateDates() {
    const checkin = get("checkin");
    const checkout = get("checkout");
    const error = get("dateError");

    if (!checkin || !checkout) return true;
    if (!checkin.value || !checkout.value) {
        error.textContent = "";
        return true;
    }

    if (new Date(checkout.value) <= new Date(checkin.value)) {
        error.textContent = "La fecha de salida debe ser después de la fecha de entrada.";
        return false;
    }

    error.textContent = "";
    return true;
}

get("checkin")?.addEventListener("change", validateDates);
get("checkout")?.addEventListener("change", validateDates);

/* ============================================================
   VALIDACIÓN TELÉFONO
============================================================ */
function validatePhone() {
    const phone = get("phone");
    if (!phone) return true;

    const digits = phone.value.replace(/\D/g, "");
    if (digits.length < 8) {
        phone.classList.add("invalid-field");
        return false;
    }
    phone.classList.remove("invalid-field");
    return true;
}

/* ============================================================
   ENVÍO WHATSAPP
============================================================ */
get("contactForm")?.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!validateDates()) return alert("Corrige las fechas.");
    if (!validatePhone()) return alert("Teléfono inválido.");

    const text = `Hola, estoy interesado en reservar Riviera.
Nombre: ${get("name").value}
Email: ${get("email").value}
Teléfono: ${get("phone").value}
Personas: ${get("people").value}
Entrada: ${get("checkin").value}
Salida: ${get("checkout").value}
Mensaje adicional: ${get("message").value || "N/A"}`;

    window.open(`https://wa.me/${HOST_PHONE}?text=${encodeURIComponent(text)}`, "_blank");
});

/* ============================================================
   CALCULADORA
============================================================ */
get("priceCalcForm")?.addEventListener("submit", function (e) {
    e.preventDefault();

    const error = get("calcError");
    error.textContent = "";

    const checkin = new Date(get("calcCheckin").value);
    const checkout = new Date(get("calcCheckout").value);
    const people = parseInt(get("calcPeople").value);

    if (checkout <= checkin) {
        error.textContent = "La fecha de salida debe ser después de la fecha de entrada.";
        return;
    }

    const nights = getNights(checkin, checkout);

    let highSeason = false;
    let temp = new Date(checkin);
    while (temp < checkout) {
        if (isHighSeason(temp)) highSeason = true;
        temp.setDate(temp.getDate() + 1);
    }

    let rate = FULL_HOUSE;

    if (highSeason) {
        if (nights < 2) {
            error.textContent = "Durante temporada alta se requieren mínimo 2 noches.";
            return;
        }
        rate = nights >= 3 ? FULL_HOUSE_PROMO : FULL_HOUSE;
    } else {
        if (people < 8) rate = PARTIAL[people] || FULL_HOUSE;
        else if (nights >= 3) rate = FULL_HOUSE_PROMO;
    }

    const MAX_PEOPLE = 15;
    const EXTRA_RATE = 5000;

    const extraPeople = Math.max(0, people - 8);

    if (people > MAX_PEOPLE) {
        error.textContent = "El máximo permitido es 15 personas.";
        return;
    }

    const extraTotal = extraPeople * EXTRA_RATE * nights;

    get("calcResult").classList.remove("hidden");
    get("rNights").textContent = nights;
    get("rRate").textContent = `₡${rate.toLocaleString()}`;
    get("rExtra").textContent = `₡${(extraPeople * extraRate * nights).toLocaleString()}`;
    get("rTotal").textContent = `₡${total.toLocaleString()}`;

    localStorage.setItem("calcPeople", people);
    localStorage.setItem("calcCheckin", get("calcCheckin").value);
    localStorage.setItem("calcCheckout", get("calcCheckout").value);
});

/* ============================================================
   AUTOCOMPLETAR FORMULARIO
============================================================ */
window.addEventListener("DOMContentLoaded", () => {
    if (get("people")) get("people").value = localStorage.getItem("calcPeople") || "";
    if (get("checkin")) get("checkin").value = localStorage.getItem("calcCheckin") || "";
    if (get("checkout")) get("checkout").value = localStorage.getItem("calcCheckout") || "";
});

/* ============================================================
   CALENDARIO
============================================================ */
window.blockedDates = new Set();

document.addEventListener("DOMContentLoaded", async () => {
    const calendarEl = get("calendar");
    if (!calendarEl) return;

    const API_KEY = "AIzaSyDVH6TwvHjZrVrVMPqFSHQzVflEzJemH-k";
    const CALENDAR_ID = "rivieraplayasamara@gmail.com";
    const TIMEZONE = "America/Costa_Rica";

    const now = new Date().toISOString();
    const future = new Date();
    future.setMonth(future.getMonth() + 6);

    const url =
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
        `?key=${API_KEY}&timeMin=${now}&timeMax=${future.toISOString()}`;

    const res = await fetch(url);
    const data = await res.json();

    data.items.forEach((ev) => {
        const start = new Date(ev.start.date || ev.start.dateTime);
        const end = new Date(ev.end.date || ev.end.dateTime);

        const cur = new Date(start);
        cur.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(0, 0, 0, 0);

        while (cur < endDate) {
            window.blockedDates.add(toLocalDateString(cur));
            cur.setDate(cur.getDate() + 1);
        }
    });

    let selectedRange = [];

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        duration: { months: 2 },
        locale: "es",
        firstDay: 1,
        timeZone: TIMEZONE,
        selectable: true,
        selectOverlap: false,
        height: "auto",

        validRange() {
            const min = new Date();
            min.setDate(min.getDate() + 2);
            return { start: min };
        },

        selectAllow(info) {
            const cur = new Date(info.start);
            cur.setHours(0, 0, 0, 0);
            const end = new Date(info.end);
            end.setHours(0, 0, 0, 0);

            let nights = 0;
            while (cur < end) {
                if (window.blockedDates.has(toLocalDateString(cur))) return false;
                nights++;
                cur.setDate(cur.getDate() + 1);
            }
            return nights >= 2 && nights <= 14;
        },

        dayCellClassNames(arg) {
            const d = toLocalDateString(arg.date);
            const classes = [];
            if (window.blockedDates.has(d)) classes.push("fc-day-occupied");
            if (selectedRange.includes(d)) classes.push("fc-day-selected");
            return classes;
        },

        select(info) {
            selectedRange = [];
            const cur = new Date(info.start);
            cur.setHours(0, 0, 0, 0);
            const end = new Date(info.end);
            end.setHours(0, 0, 0, 0);

            while (cur < end) {
                selectedRange.push(toLocalDateString(cur));
                cur.setDate(cur.getDate() + 1);
            }

            const checkinStr = info.startStr;
            const checkoutStr = toLocalDateString(new Date(info.end));

            if (get("calcCheckin")) get("calcCheckin").value = checkinStr;
            if (get("calcCheckout")) get("calcCheckout").value = checkoutStr;
            if (get("checkin")) get("checkin").value = checkinStr;
            if (get("checkout")) get("checkout").value = checkoutStr;
        }
    });

    calendar.render();
});

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mainNav = document.getElementById("mainNav");

mobileMenuBtn.addEventListener("click", () => {
    mainNav.classList.toggle("open");
});
