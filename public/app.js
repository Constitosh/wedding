const envelope = document.getElementById("envelope");
const openLabel = document.getElementById("open-label");
const slider = document.getElementById("slider");
const slides = Array.from(document.querySelectorAll(".slide"));
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const stepBadge = document.getElementById("step-badge");

let idx = 0;
function updateStepBadge() {
  const totalSlides = slides.length;
  stepBadge.textContent = `Seite ${Math.min(idx+1, totalSlides)} von ${totalSlides}`;
}
function showSlide(i) {
  slides.forEach((s, n) => s.classList.toggle("active", n === i));
  updateStepBadge();
  prevBtn.disabled = i === 0;
  nextBtn.textContent = i === slides.length - 1 ? "Zum Formular" : "Weiter →";
}
envelope?.addEventListener("click", () => {
  if (envelope.classList.contains("opened")) return;
  envelope.classList.add("opened");
  openLabel?.classList.add("hidden");
  setTimeout(() => {
    slider.classList.remove("hidden");
    showSlide(0);
    document.querySelector(".envelope-wrap")?.classList.add("hidden");
  }, 900); // Animation zuerst zeigen!
});



prevBtn?.addEventListener("click", () => {
  if (idx > 0) { idx--; showSlide(idx); }
});
nextBtn?.addEventListener("click", () => {
  if (idx < slides.length - 1) {
    idx++; showSlide(idx);
  } else {
    // zum Formular springen
    document.getElementById("rsvp-form-card").classList.remove("hidden");
    slider.classList.add("hidden");
    document.getElementById("name").focus();
  }
});

// Formular
const form = document.getElementById("rsvp-form");
const statusBox = document.getElementById("status");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusBox.textContent = "Sende...";
  const data = {
    name: form.name.value.trim(),
    guests: form.guests.value.trim(),
    kidsCount: form.kidsCount.value ? Number(form.kidsCount.value) : null,
    attendance: form.attendance.value,
    notes: form.notes.value.trim()
  };
  try {
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || "Fehler");
    statusBox.textContent = "Danke! Deine Antwort wurde gespeichert. 💌";
    form.reset();
  } catch (err) {
    statusBox.textContent = "Leider gab es ein Problem. Bitte versuche es später erneut.";
    console.error(err);
  }
});

(() => {
  const envelope = document.getElementById("envelope");
  const slider = document.getElementById("slider");
  const wrap = document.querySelector(".envelope-wrap");

  if (!envelope || !slider || !wrap) return;

  const TOTAL_ANIM_MS = 2700; // muss >= Summe der CSS-Animationen sein

  envelope.addEventListener("click", () => {
    // Schon geöffnet/öffnend? -> ignorieren
    if (envelope.classList.contains("opening") || envelope.classList.contains("opened")) return;

    // Animation starten
    envelope.classList.add("opening");

    // Nach Ablauf: zum Slider wechseln
    window.setTimeout(() => {
      envelope.classList.remove("opening");
      envelope.classList.add("opened");
      // Envelope ausblenden, Slider zeigen
      wrap.classList.add("hidden");
      slider.classList.remove("hidden");

      // Falls du showSlide(0) hast:
      if (typeof showSlide === "function") {
        try { showSlide(0); } catch {}
      }
    }, TOTAL_ANIM_MS);
  });
})();

