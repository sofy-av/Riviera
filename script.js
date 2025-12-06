

/* ============================================================
   CONFIGURACIÓN
============================================================ */
const HOST_PHONE = "50671628976";
const FULL_HOUSE = 150000;
const FULL_HOUSE_PROMO = 127000;

const PARTIAL = {
  2: 65000,
  3: 75000,
  5: 105000,
  6: 125000
};

const get = (id) => document.getElementById(id);

/* ============================================================
   VALIDACIÓN DE FECHAS (FORMULARIO)
============================================================ */
(function setMinDates() {
  const today = new Date().toISOString().split("T")[0];
  if (get("checkin")) get("checkin").min = today;
  if (get("checkout")) get("checkout").min = today;
})();

function validateDates() {
  const checkin = get("checkin");
  const checkout = get("checkout");
  const error = get("dateError");

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
  const digits = phone.value.replace(/\D/g, "");
  if (digits.length < 8) {
    phone.classList.add("invalid-field");
    return false;
  }
  phone.classList.remove("invalid-field");
  return true;
}

/* ============================================================
   ENVÍO A WHATSAPP
============================================================ */
get("contactForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  if (!validateDates()) return alert("Corrige las fechas.");
  if (!validatePhone()) return alert("Teléfono inválido.");

  const name = get("name").value.trim();
  const email = get("email").value.trim();
  const phone = get("phone").value.trim();
  const people = get("people").value.trim();
  const checkin = get("checkin").value;
  const checkout = get("checkout").value;
  const message = get("message").value.trim();

  const text = `Hola, estoy interesado en reservar Riviera.
Nombre: ${name}
Email: ${email}
Teléfono: ${phone}
Personas: ${people}
Entrada: ${checkin}
Salida: ${checkout}
Mensaje adicional: ${message || "N/A"}`;

  window.open(`https://wa.me/${HOST_PHONE}?text=${encodeURIComponent(text)}`, "_blank");
});

/* ============================================================
   UTILIDADES CALCULADORA
============================================================ */
function getNights(inDate, outDate) {
  return Math.ceil((outDate - inDate) / 86400000);
}

function isHighSeason(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return (m === 12 && d >= 22) || (m === 1 && d <= 4);
}
/* ============================================================
   CALCULADORA DE TARIFAS
============================================================ */
get("priceCalcForm")?.addEventListener("submit", function (e) {
    e.preventDefault();

    const error = get("calcError");
    error.textContent = "";

    const checkinEl = get("calcCheckin");
    const checkoutEl = get("calcCheckout");
    const peopleEl = get("calcPeople");

    const checkin = new Date(checkinEl.value);
    const checkout = new Date(checkoutEl.value);
    const people = parseInt(peopleEl.value);

    if (checkout <= checkin) {
        error.textContent = "La fecha de salida debe ser después de la fecha de entrada.";
        return;
    }

    const nights = getNights(checkin, checkout);

    // Detectar temporada alta
    let highSeason = false;
    let temp = new Date(checkin);

    while (temp < checkout) {
        if (isHighSeason(temp)) {
            highSeason = true;
        }
        temp.setDate(temp.getDate() + 1);
    }

    // ======== CALCULAR TARIFA BASE ========
    let rate = FULL_HOUSE;

    if (highSeason) {
        if (nights < 2) {
            error.textContent = "Durante temporada alta se requieren mínimo 2 noches.";
            return;
        }
        rate = FULL_HOUSE;
    } else {
        if (people < 8) {
            rate = PARTIAL[people] || FULL_HOUSE;
        } else if (nights >= 4) {
            rate = FULL_HOUSE_PROMO;
        } else {
            rate = FULL_HOUSE;
        }
    }

    // ======== PERSONAS EXTRA ========
    const extraPeople = Math.max(0, people - 8);
    let extraRate = 0;

    if (people >= 9 && people <= 12) {
        extraRate = 10000;
    } else if (people >= 13 && people <= 18) {
        extraRate = 8000;
    } else if (people > 18) {
        error.textContent = "El máximo permitido es 18 personas.";
        return;
    }

    const extraTotal = extraPeople * extraRate * nights;

    // ======== TOTAL ========
    const total = nights * rate + extraTotal;

    // ======== MOSTRAR RESULTADO ========
    get("calcResult").classList.remove("hidden");

    get("rNights").textContent = nights;

    if (rate === FULL_HOUSE_PROMO) {
        get("rRate").innerHTML =
            `₡${rate.toLocaleString()} <span class="tag-discount">(aplicando promo -15%)</span>`;
    } else {
        get("rRate").textContent = `₡${rate.toLocaleString()}`;
    }

    if (extraPeople > 0) {
        get("rExtra").innerHTML = `
            ₡${extraTotal.toLocaleString()}
            <br>
            <small>
                ${extraPeople} personas extra × ₡${extraRate.toLocaleString()} × ${nights} noches
            </small>
        `;
    } else {
        get("rExtra").textContent = "₡0";
    }

    get("rTotal").textContent = `₡${total.toLocaleString()}`;

    // Guardar autocompletado
    localStorage.setItem("calcPeople", people);
    localStorage.setItem("calcCheckin", checkinEl.value);
    localStorage.setItem("calcCheckout", checkoutEl.value);
});


/* ============================================================
   ADVERTENCIA +9 PERSONAS
============================================================ */
get("calcPeople")?.addEventListener("input", function () {
  const warn = get("extraWarning");
  if (parseInt(this.value) >= 9) {
    warn.classList.remove("hidden");
  } else {
    warn.classList.add("hidden");
  }
});

/* ============================================================
   AUTOCOMPLETAR FORMULARIO
============================================================ */
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("calcPeople")) get("people").value = localStorage.getItem("calcPeople");
  if (localStorage.getItem("calcCheckin")) get("checkin").value = localStorage.getItem("calcCheckin");
  if (localStorage.getItem("calcCheckout")) get("checkout").value = localStorage.getItem("calcCheckout");
});
