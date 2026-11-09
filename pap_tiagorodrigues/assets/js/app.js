const reportForm = document.getElementById("reportForm");
const feedback = document.getElementById("reportFeedback");
const trackingForm = document.getElementById("trackingForm");
const trackingResult = document.getElementById("trackingResult");
const occurrenceKey = "vilaNovaDigital.ocorrencias";
const supabaseConfig = window.SUPABASE_CONFIG;
const supabaseClient = window.supabase && supabaseConfig?.url && supabaseConfig?.publishableKey
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey)
  : null;
let currentUser = null;
let reportCoordinates = { latitude: null, longitude: null };
let reportMap;
let reportMarker;

function occurrences() {
  try { return JSON.parse(localStorage.getItem(occurrenceKey) || "[]"); }
  catch { return []; }
}

reportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = reportForm.querySelector("button[type=submit]");
  submitButton.disabled = true;
  const code = `VN-2026-${String(149 + occurrences().length).padStart(4, "0")}`;
  const item = {
    code,
    type: document.getElementById("reportType").value,
    location: document.getElementById("reportLocation").value.trim(),
    description: document.getElementById("reportDescription").value.trim(),
    status: "Em análise",
    date: new Intl.DateTimeFormat("pt-PT").format(new Date()),
    latitude: reportCoordinates.latitude,
    longitude: reportCoordinates.longitude
  };
  let photoPath = null;
  const photo = document.getElementById("reportPhoto").files[0];
  if (supabaseClient && currentUser && photo) {
    photoPath = `${currentUser.id}/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabaseClient.storage.from("municipal-occurrence-photos").upload(photoPath, photo, { contentType: photo.type, upsert: false });
    if (uploadError) {
      feedback.className = "alert alert-danger";
      feedback.textContent = `Não foi possível carregar a fotografia: ${uploadError.message}`;
      submitButton.disabled = false;
      return;
    }
  }
  if (supabaseClient && currentUser) {
    const { data: savedOccurrence, error } = await supabaseClient.from("municipal_occurrences").insert({
      reporter_id: currentUser.id,
      category: item.type,
      description: item.description,
      location: item.location,
      latitude: item.latitude,
      longitude: item.longitude,
      photo_path: photoPath
    }).select("code").single();
    if (error) {
      feedback.className = "alert alert-danger";
      feedback.textContent = `Não foi possível guardar a ocorrência no servidor: ${error.message}`;
      submitButton.disabled = false;
      return;
    }
    item.code = savedOccurrence.code;
  } else {
    localStorage.setItem(occurrenceKey, JSON.stringify([...occurrences(), item]));
  }
  feedback.className = "alert alert-success";
  feedback.innerHTML = `<i class="bi bi-check-circle me-2"></i>Pedido enviado com sucesso. Código: <strong>${code}</strong>.`;
  reportForm.reset();
  submitButton.disabled = true;
});

trackingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = document.getElementById("trackingCode").value.trim().toUpperCase();
  const saved = occurrences().find((item) => item.code === code);
  const item = saved || (code === "VN-2026-0148" ? {
    code, type: "Iluminação pública", location: "Rua de Santa Clara",
    status: "Em execução", date: "04/11/2026"
  } : null);
  trackingResult.className = `tracking-result ${item ? "" : "not-found"}`;
  trackingResult.innerHTML = item
    ? `<strong><i class="bi bi-check-circle me-1"></i>${item.code}</strong> · ${item.type} em ${item.location}<br><small>Estado atual: <b>${item.status}</b> · Submetida em ${item.date}</small>`
    : '<i class="bi bi-exclamation-circle me-2"></i>Não encontrámos este código. Confirme os dados e tente novamente.';
});

document.querySelectorAll(".assistant-options button").forEach((option) => {
  option.addEventListener("click", () => {
    document.querySelector(".bot-message").innerHTML = `Boa escolha! Vou procurar apoios relacionados com <strong>${option.textContent}</strong>.<br><small class="text-muted">Clique em “Começar diagnóstico” para continuar.</small>`;
    document.querySelectorAll(".assistant-options button").forEach((button) => button.classList.remove("active"));
    option.classList.add("active");
  });
});

document.getElementById("eligibilityButton").addEventListener("click", () => {
  const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById("siteToast"));
  document.querySelector("#siteToast span").textContent = "Diagnóstico iniciado. Esta funcionalidade será ligada à base de dados na próxima etapa.";
  toast.show();
});

document.getElementById("loginButton").addEventListener("click", async () => {
  const feedbackBox = document.getElementById("loginFeedback");
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) {
    feedbackBox.className = "alert alert-danger";
    feedbackBox.textContent = "Preencha o email e a palavra-passe.";
    return;
  }
  if (!supabaseClient) {
    feedbackBox.className = "alert alert-warning";
    feedbackBox.textContent = "Supabase não está configurado. A demonstração continua disponível sem autenticação.";
    return;
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    feedbackBox.className = "alert alert-danger";
    feedbackBox.textContent = error.message;
    return;
  }
  currentUser = data.user;
  feedbackBox.className = "alert alert-success";
  feedbackBox.textContent = "Sessão iniciada. Já pode utilizar os serviços reservados.";
});

document.getElementById("reportPhoto").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) document.getElementById("photoLabel").textContent = `${file.name} selecionada`;
});

function initializeReportMap() {
  if (reportMap || !window.L) return;
  reportMap = L.map("reportMap").setView([41.1496, -8.6109], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(reportMap);
  reportMap.on("click", (event) => {
    reportCoordinates = { latitude: event.latlng.lat, longitude: event.latlng.lng };
    if (reportMarker) reportMarker.setLatLng(event.latlng);
    else reportMarker = L.marker(event.latlng).addTo(reportMap);
  });
}

document.getElementById("reportModal").addEventListener("shown.bs.modal", () => {
  initializeReportMap();
  setTimeout(() => reportMap?.invalidateSize(), 100);
});

document.getElementById("locateButton").addEventListener("click", () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    reportCoordinates = { latitude: coords.latitude, longitude: coords.longitude };
    reportMap?.setView([coords.latitude, coords.longitude], 16);
    if (reportMarker) reportMarker.setLatLng([coords.latitude, coords.longitude]);
    else reportMarker = L.marker([coords.latitude, coords.longitude]).addTo(reportMap);
  }, () => {
    feedback.className = "alert alert-warning";
    feedback.textContent = "Não foi possível obter a sua localização. Pode selecionar o ponto no mapa.";
  });
});

document.getElementById("requestForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const feedbackBox = document.getElementById("requestFeedback");
  const serviceType = event.target.querySelector("select").value;
  const notes = event.target.querySelector("textarea").value.trim();
  if (supabaseClient && currentUser) {
    const { data, error } = await supabaseClient.from("municipal_requests").insert({ requester_id: currentUser.id, service_type: serviceType, notes }).select("code").single();
    if (error) {
      feedbackBox.className = "alert alert-danger";
      feedbackBox.textContent = `Não foi possível criar o requerimento: ${error.message}`;
      return;
    }
    feedbackBox.className = "alert alert-success";
    feedbackBox.innerHTML = `<i class="bi bi-check-circle me-2"></i>Requerimento criado. Código: <strong>${data.code}</strong>.`;
    event.target.reset();
    return;
  }
  feedbackBox.className = "alert alert-success";
  feedbackBox.innerHTML = '<i class="bi bi-check-circle me-2"></i>Requerimento criado com sucesso. Código: <strong>REQ-2026-0317</strong>.';
  event.target.reset();
});

document.querySelectorAll(".support-choice-grid button").forEach((choice) => {
  choice.addEventListener("click", () => {
    const result = document.getElementById("supportResult");
    document.getElementById("supportQuestion").classList.add("d-none");
    document.querySelectorAll(".step-indicator span")[0].classList.remove("active");
    document.querySelectorAll(".step-indicator span")[1].classList.add("active");
    result.className = "support-result";
    result.innerHTML = `<span class="result-icon"><i class="bi bi-stars"></i></span><h3>Encontrámos apoios para ${choice.dataset.choice.toLowerCase()}.</h3><p>Com base na sua seleção, identificámos 3 programas municipais que podem ser adequados ao seu perfil.</p><button class="btn btn-primary" type="button" data-bs-dismiss="modal">Ver recomendações <i class="bi bi-arrow-right ms-1"></i></button>`;
  });
});

document.getElementById("reportModal").addEventListener("hidden.bs.modal", () => {
  feedback.className = "alert d-none";
  reportForm.querySelector("button[type=submit]").disabled = false;
});

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data }) => {
    currentUser = data.session?.user || null;
  });
}

document.getElementById("globalSearch").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const query = event.target.value.trim().toLowerCase();
  if (query.length < 3) return;
  const target = query.includes("apoio") || query.includes("subsídio") ? "#apoios"
    : query.includes("orçamento") || query.includes("dinheiro") ? "#transparencia"
      : query.includes("ocorrência") || query.includes("rua") ? "#ocorrencias" : "#servicos";
  window.location.hash = target;
});

const searchResults = document.getElementById("searchResults");
document.getElementById("globalSearch").addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  if (query.length < 2) {
    searchResults.classList.add("d-none");
    return;
  }
  const entries = [
    ["Ocorrências urbanas", "Comunicar um problema na via pública", "#ocorrencias", "bi-cone-striped"],
    ["Apoios municipais", "Encontrar programas de apoio", "#apoios", "bi-stars"],
    ["Transparência", "Consultar o orçamento de 2026", "#transparencia", "bi-bar-chart-line"],
    ["Requerimentos", "Pedir certidões e licenças", "#requerimentos", "bi-file-earmark-check"]
  ].filter(([title, description]) => `${title} ${description}`.toLowerCase().includes(query));
  searchResults.innerHTML = entries.length
    ? entries.map(([title, description, href, icon]) => `<a href="${href}"><i class="bi ${icon}"></i><span><b>${title}</b><small>${description}</small></span><i class="bi bi-arrow-up-right"></i></a>`).join("")
    : '<div class="search-empty">Não encontrámos resultados. Tente “apoio”, “licença” ou “ocorrência”.</div>';
  searchResults.classList.remove("d-none");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-box-wrap")) searchResults.classList.add("d-none");
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });

  const contrastToggle = document.getElementById("contrastToggle");
  const fontToggle = document.getElementById("fontToggle");
  const preferencesKey = "vilaNovaDigital.preferences";
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem(preferencesKey) || "{}"); } catch { preferences = {}; }
  if (preferences.dark) document.body.classList.add("dark-mode");
  if (preferences.largeText) document.body.classList.add("large-text");
  function savePreferences() { localStorage.setItem(preferencesKey, JSON.stringify(preferences)); }
  contrastToggle.addEventListener("click", () => {
    preferences.dark = document.body.classList.toggle("dark-mode");
    contrastToggle.innerHTML = preferences.dark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    savePreferences();
  });
  fontToggle.addEventListener("click", () => {
    preferences.largeText = document.body.classList.toggle("large-text");
    fontToggle.innerHTML = preferences.largeText ? "A<sup>−</sup>" : "A<sup>+</sup>";
    savePreferences();
  });
  if (preferences.dark) contrastToggle.innerHTML = '<i class="bi bi-sun"></i>';
  if (preferences.largeText) fontToggle.innerHTML = "A<sup>−</sup>";

  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) target.setAttribute("tabindex", "-1");
      target?.focus({ preventScroll: true });
    });
  });
});
