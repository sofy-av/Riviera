// Pequeñas interacciones: menú móvil y envío simulado de formulario
document.getElementById('mobileMenuBtn')?.addEventListener('click', function(){
  const nav = document.querySelector('.main-nav');
  if(!nav) return;
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
});

document.getElementById('contactForm')?.addEventListener('submit', function(e){
  e.preventDefault();
  const msg = document.getElementById('formMsg');
  msg.textContent = 'Enviando solicitud...';
  // Simular envío: en implementación real POST a backend / email service
  setTimeout(()=> {
    msg.textContent = 'Solicitud enviada. Nos pondremos en contacto pronto.';
    this.reset();
  }, 900);
});

/* =============================
   SISTEMA DE RESERVAS DINÁMICO
============================= */

// 1) AQUÍ defines las fechas ocupadas (puedes poner todas las que quieras)
// formato: YYYY-MM-DD
const bookedDates = [
  "2025-12-10",
  "2025-12-11",
  "2025-12-12",
  "2025-12-13"
];

// También puedes bloquear rangos:
const bookedRanges = [
  { start: "2025-12-01", end: "2025-12-06" },
  { start: "2026-01-01", end: "2040-01-01" }
];

function isDateBooked(date) {
  const d = new Date(date).getTime();

  // Fechas individuales
  if (bookedDates.includes(date)) return true;

  // Rango de fechas
  for (let range of bookedRanges) {
    const start = new Date(range.start).getTime();
    const end = new Date(range.end).getTime();
    if (d >= start && d <= end) return true;
  }

  return false;
}

// 2) Bloquea fechas dinamicamente en los datepicker
const checkin = document.getElementById("checkin");
const checkout = document.getElementById("checkout");

function disableBlockedDates(input) {
  input.addEventListener("input", () => {
    const selected = input.value;

    if (isDateBooked(selected)) {
      input.value = "";
      alert("Esa fecha no está disponible. Selecciona otra.");
    }

    // Evita seleccionar checkout antes de checkin
    if (input.id === "checkin") {
      checkout.min = selected;
    }
  });
}

disableBlockedDates(checkin);
disableBlockedDates(checkout);

// 3) Envío simulado del formulario
document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const msg = document.getElementById("formMsg");
  msg.textContent = "Enviando solicitud...";

  setTimeout(() => {
    msg.textContent = "Solicitud enviada. Te contactaremos pronto.";
    this.reset();
  }, 900);
});
