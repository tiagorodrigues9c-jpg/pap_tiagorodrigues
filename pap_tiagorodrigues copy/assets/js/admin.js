const config = window.SUPABASE_CONFIG;
const client = window.supabase && config?.url && config?.publishableKey ? window.supabase.createClient(config.url, config.publishableKey) : null;
const table = document.getElementById("occurrencesTable");
const demoOccurrences = [
  { code: "VN-2026-0148", category: "Iluminação pública", location: "Rua de Santa Clara", created_at: "Hoje, 09:42", status: "Em execução" },
  { code: "VN-2026-0147", category: "Buraco na via", location: "Avenida da República", created_at: "Ontem, 16:20", status: "Em análise" },
  { code: "VN-2026-0146", category: "Limpeza urbana", location: "Praça do Município", created_at: "05 Nov, 11:15", status: "Resolvida" }
];
let rows = [...demoOccurrences];
function render() {
  const filter = document.getElementById("statusFilter").value;
  table.innerHTML = rows.filter((row) => !filter || row.status === filter).map((row) => `<tr><td><b>${row.code}</b></td><td>${row.category}</td><td>${row.location}</td><td>${row.created_at}</td><td><select class="status-select ${row.status === "Resolvida" ? "done" : row.status === "Em execução" ? "info" : ""}" data-code="${row.code}"><option ${row.status === "Em análise" ? "selected" : ""}>Em análise</option><option ${row.status === "Em execução" ? "selected" : ""}>Em execução</option><option ${row.status === "Resolvida" ? "selected" : ""}>Resolvida</option></select></td><td><button class="btn btn-sm btn-light" title="Abrir"><i class="bi bi-eye"></i></button></td></tr>`).join("");
}
async function load() {
  if (client) {
    const { data: session } = await client.auth.getSession();
    if (!session.session) {
      document.querySelector(".admin-main").innerHTML = '<div class="admin-card"><h1 class="h4">Acesso reservado</h1><p class="text-muted">Inicie sessão no portal com uma conta de funcionário para aceder a esta área.</p><a class="btn btn-primary" href="index.html">Voltar ao portal</a></div>';
      return;
    }
    const { data } = await client.from("municipal_occurrences").select("code,category,location,created_at,status").order("created_at", { ascending: false }).limit(50);
    if (data?.length) rows = data.map((item) => ({ ...item, created_at: new Intl.DateTimeFormat("pt-PT").format(new Date(item.created_at)) }));
  }
  render();
}
document.getElementById("statusFilter").addEventListener("change", render);
document.getElementById("refreshButton").addEventListener("click", load);
document.querySelector("body").addEventListener("change", async (event) => {
  if (!event.target.matches("[data-code]")) return;
  const row = rows.find((item) => item.code === event.target.dataset.code);
  if (row) row.status = event.target.value;
  if (client && row) await client.from("municipal_occurrences").update({ status: row.status, updated_at: new Date().toISOString() }).eq("code", row.code);
});
document.getElementById("exportButton").addEventListener("click", () => {
  const csv = ["Código,Categoria,Local,Data,Estado", ...rows.map((row) => [row.code, row.category, row.location, row.created_at, row.status].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "ocorrencias-vila-nova.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});
load();
