/* ============================================================
   CONFIGURACIÓN (TARIFAS ACTUALIZADAS)
============================================================ */
const HOST_PHONE = "50671628976";

/* FULL HOUSE */
const FULL_HOUSE = 120000;
const FULL_HOUSE_PROMO = 110000; // promo 3 o más noches

/* PART HOUSE */
const PARTIAL = {
    2: 60000,
    3: 75000,
    5: 95000,
    6: 110000
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
   CALCULADORA — LÓGICA CORRECTA
============================================================ */
get("priceCalcForm")?.addEventListener("submit", function (e) {
    e.preventDefault();

    const error = get("calcError");
    error.textContent = "";

    const checkinValue = get("calcCheckin").value;
    const checkoutValue = get("calcCheckout").value;
    const people = parseInt(get("calcPeople").value, 10);

    if (!checkinValue || !checkoutValue || !people) {
        error.textContent = "Completa todos los campos.";
        return;
    }

    const checkin = new Date(checkinValue);
    const checkout = new Date(checkoutValue);

    if (checkout <= checkin) {
        error.textContent = "La fecha de salida debe ser después de la fecha de entrada.";
        return;
    }

    const nights = getNights(checkin, checkout);

    const MAX_PEOPLE = 15;
    const EXTRA_RATE = 8000;

    if (people > MAX_PEOPLE) {
        error.textContent = "El máximo permitido es 15 personas.";
        return;
    }

    let rate = 0;
    let extraPeople = 0;

    /* ===============================
       ORDEN CORRECTO DE DECISIONES
    =============================== */

    // 1️⃣ PART HOUSE (< 7 personas)
    if (people < 7) {
        rate = PARTIAL[people] || FULL_HOUSE;
        extraPeople = 0; // nunca hay extras aquí
    }

    // 2️⃣ FULL HOUSE exacto (7 u 8 personas)
    else if (people === 7 || people === 8) {
        rate = nights >= 3 ? FULL_HOUSE_PROMO : FULL_HOUSE;
        extraPeople = 0;
    }

    // 3️⃣ FULL HOUSE + EXTRAS (> 8 personas)
    else {
        rate = nights >= 3 ? FULL_HOUSE_PROMO : FULL_HOUSE;
        extraPeople = people - 8;
    }

    const extraTotal = extraPeople * EXTRA_RATE * nights;
    const total = nights * rate + extraTotal;

    /* ===============================
       MOSTRAR RESULTADO
    =============================== */
    get("calcResult").classList.remove("hidden");
    get("rNights").textContent = nights;
    get("rRate").textContent = `₡${rate.toLocaleString()}`;
    get("rExtra").textContent = `₡${extraTotal.toLocaleString()}`;
    get("rTotal").textContent = `₡${total.toLocaleString()}`;

    // Persistencia
    localStorage.setItem("calcPeople", people);
    localStorage.setItem("calcCheckin", checkinValue);
    localStorage.setItem("calcCheckout", checkoutValue);
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
        timeZone: "local",
        selectable: true,
        selectMirror: true,
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

        // 👇 live selection
        selecting(info) {
            selectedRange = [];

            const cur = new Date(info.start);
            cur.setHours(0, 0, 0, 0);
            const end = new Date(info.end);
            end.setHours(0, 0, 0, 0);

            while (cur < end) {
                selectedRange.push(toLocalDateString(cur));
                cur.setDate(cur.getDate() + 1);
            }
            calendar.rerenderDates();
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
            const checkoutDate = new Date(info.end);
checkoutDate.setDate(checkoutDate.getDate() - 1);

if (get("calcCheckin")) get("calcCheckin").value = checkinStr;
if (get("calcCheckout")) get("calcCheckout").value = toLocalDateString(checkoutDate);
if (get("checkin")) get("checkin").value = checkinStr;
if (get("checkout")) get("checkout").value = toLocalDateString(checkoutDate);

        }
    });

    calendar.render();
});

/* ============================================================
   Botón Hamburguesa Mobile
============================================================ */

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mainNav = document.getElementById("mainNav");

if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");
        mobileMenuBtn.textContent = isOpen ? "✖" : "☰";
        document.body.classList.toggle("menu-open", isOpen);
    });

    // Cerrar al tocar un link
    mainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    // Cerrar al tocar fuera
    document.addEventListener("click", (e) => {
        if (mainNav.classList.contains("open") && !mainNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            closeMenu();
        }
    });
}

function closeMenu() {
    mainNav.classList.remove("open");
    mobileMenuBtn.textContent = "☰";
    document.body.classList.remove("menu-open");
}
