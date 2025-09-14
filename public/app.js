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
  // Doppelklick verhindern
  if (envelope.classList.contains("opened")) return;

  // Animation starten
  envelope.classList.add("opened");
  openLabel?.classList.add("hidden"); // optional, s. CSS-Fallback unten

  // Warten bis Animation fertig ist (~0.8–0.9s), dann Slider zeigen
  // (Dauer passt zu den CSS-Transitions/Keyframes)
  setTimeout(() => {
    slider.classList.remove("hidden");
    showSlide(0);
    // jetzt erst das Kuvert ausblenden
    document.querySelector(".envelope-wrap")?.classList.add("hidden");
  }, 900);
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
