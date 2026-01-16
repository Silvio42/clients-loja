const API = "/api/clients";

const form = document.getElementById("clientForm");
const tbody = document.getElementById("clientsTbody");
const statusEl = document.getElementById("status");

const qInput = document.getElementById("q");
const btnSearch = document.getElementById("btnSearch");

document.getElementById("backHome")?.addEventListener("click", () => window.go?.("home"));

const onlyDigits = (s) => (s || "").toString().replace(/\D/g, "");
const maskCPF = (cpf) => {
  const d = onlyDigits(cpf);
  if (!d) return "";
  if (d.length < 6) return "••••••";
  return `${d.slice(0,5)}•••••${d.slice(-2)}`;
};

const fmtDateTime = (iso) => {
  try { return new Date(String(iso).replace(' ', 'T')).toLocaleString("pt-BR"); }
  catch { return iso || ""; }
};

const fmtDate = (yyyymmdd) => {
  if (!yyyymmdd) return "";
  const d = yyyymmdd.toString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return `${d.slice(8,10)}/${d.slice(5,7)}/${d.slice(0,4)}`;
  return d;
};

function setStatus(msg) {
  statusEl.textContent = msg || "";
  if (msg) setTimeout(() => (statusEl.textContent = ""), 2600);
}

function showEmpty(msg) {
  tbody.innerHTML = `<tr><td colspan="7" class="small">${msg}</td></tr>`;
}

async function doSearch() {
  const q = qInput.value.trim();
  if (!q) return showEmpty("Digite algo para pesquisar (nome, CPF ou telefone).");

  showEmpty("Pesquisando...");
  try {
    const res = await fetch(`${API}?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    renderClients(Array.isArray(data) ? data : []);
  } catch {
    showEmpty("Erro ao buscar. Verifique o servidor.");
  }
}

function renderClients(list) {
  if (!list.length) return showEmpty("Nenhum resultado encontrado.");

  tbody.innerHTML = "";
  list.forEach((c) => {
    const tr = document.createElement("tr");

    const cpfRaw = onlyDigits(c.cpf);
    const cpfMasked = maskCPF(c.cpf);

    tr.innerHTML = `
      <td>${escapeHtml(c.name || "")}</td>
      <td>
        <span data-cpf="${cpfRaw}" data-mode="masked">${cpfMasked || ""}</span>
        ${cpfRaw ? `<button class="iconBtn" type="button" title="Mostrar/ocultar CPF">👁</button>` : ""}
      </td>
      <td>${escapeHtml(c.phone || "")}</td>
      <td>${escapeHtml(fmtDate(c.dataNascimento || ""))}</td>
      <td>${escapeHtml(c.notes || "")}</td>
      <td>${escapeHtml(fmtDateTime(c.created_at || ""))}</td>
      <td>
        <div class="actions">
          <button class="iconBtn danger" type="button" data-del="${c.id}">Remover</button>
        </div>
      </td>
    `;

    const eye = tr.querySelector("button.iconBtn:not(.danger)");
    if (eye) {
      eye.addEventListener("click", () => {
        const span = tr.querySelector("span[data-cpf]");
        const mode = span.getAttribute("data-mode");
        if (mode === "masked") {
          span.textContent = formatCPF(span.getAttribute("data-cpf"));
          span.setAttribute("data-mode", "raw");
        } else {
          span.textContent = maskCPF(span.getAttribute("data-cpf"));
          span.setAttribute("data-mode", "masked");
        }
      });
    }

    tr.querySelector("[data-del]").addEventListener("click", async () => {
      try {
        const res = await fetch(`${API}/${c.id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 204) throw new Error();
        setStatus("Cliente removido.");
        await doSearch();
      } catch {
        setStatus("Erro ao remover.");
      }
    });

    tbody.appendChild(tr);
  });
}

btnSearch.addEventListener("click", doSearch);
qInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); doSearch(); }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: form.name.value.trim(),
    cpf: onlyDigits(form.cpf.value),
    phone: form.phone.value.trim(),
    notes: form.notes.value.trim(),
    dataNascimento: form.birth.value || null, // <-- agora bate com o banco
  };

  if (!payload.name) return setStatus("Nome é obrigatório.");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await safeJson(res);
      return setStatus(err?.error || "Erro ao salvar.");
    }

    form.reset();
    setStatus("Cliente salvo ✅");
  } catch {
    setStatus("Falha de conexão com o servidor.");
  }
});

function escapeHtml(s) {
  return (s ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCPF(d) {
  const s = onlyDigits(d);
  if (s.length !== 11) return s;
  return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6,9)}-${s.slice(9)}`;
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

showEmpty("Pesquise para ver resultados.");
