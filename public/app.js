const app = document.getElementById("app");
const crumb = document.getElementById("crumb");

async function loadView(name) {
  const html = await fetch(`/views/${name}.html`).then(r => r.text());
  app.innerHTML = html;

  // carrega o JS específico da tela
  await importScript(`/js/${name}.js`);

  // atualiza “breadcrumb”
  crumb.textContent = name === "home" ? "Início" : "Cadastro de clientes";
}

function importScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

document.getElementById("goHome").addEventListener("click", () => loadView("home"));
window.addEventListener("popstate", () => {
  const v = location.hash.replace("#/", "") || "home";
  loadView(v);
});

function go(view) {
  history.pushState({}, "", `#/${view}`);
  loadView(view);
}

// expõe para as views chamarem
window.go = go;

// inicia na home
go((location.hash.replace("#/", "") || "home"));
