import { useEffect, useState } from "react";
import { loginLocal, setupComplete, setupStatus, type SessionUser } from "./lib/db";
import { Desk } from "./pages/Desk";

type Screen = "loading" | "setup" | "login" | "home";

export function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setupStatus()
      .then((s) => {
        setScreen(s.configured ? "login" : "setup");
      })
      .catch((e: unknown) => setError(String(e)));
  }, []);

  if (screen === "loading") return <main className="app"><p>Abrindo CRM Gráfica…</p>{error && <p className="error">{error}</p>}</main>;
  if (screen === "setup") return <Setup onDone={() => setScreen("login")} />;
  if (screen === "login" || !user) {
    return (
      <Login
        onOk={async (u) => {
          setUser(u);
          setScreen("home");
        }}
      />
    );
  }
  return <Desk user={user} onLogout={() => setScreen("login")} />;
}

function Setup({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    company_name: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    openrouter_key: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await setupComplete(form);
      onDone();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app login">
      <form className="card" onSubmit={submit}>
        <h1>Primeira execução</h1>
        <p>Dados ficam neste computador. Internet só entra em WhatsApp e IA.</p>
        <label>Empresa<input required value={form.company_name} onChange={(e) => set("company_name", e.target.value)} /></label>
        <label>Seu nome<input required value={form.admin_name} onChange={(e) => set("admin_name", e.target.value)} /></label>
        <label>E-mail<input required type="email" value={form.admin_email} onChange={(e) => set("admin_email", e.target.value)} /></label>
        <label>Senha (mín. 8)<input required type="password" minLength={8} value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} /></label>
        <label>Chave OpenRouter (opcional)<input value={form.openrouter_key} onChange={(e) => set("openrouter_key", e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? "Salvando…" : "Criar gráfica"}</button>
      </form>
    </main>
  );
}

function Login({ onOk }: { onOk: (u: SessionUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      onOk(await loginLocal(email, password));
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <main className="app login">
      <form className="card" onSubmit={submit}>
        <h1>Entrar</h1>
        <label>E-mail<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Senha<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button>Entrar</button>
      </form>
    </main>
  );
}
