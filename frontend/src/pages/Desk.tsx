import { useEffect, useState } from "react";
import { sqliteExecute, sqliteQuery, type SessionUser } from "../lib/db";

type Tab = "painel" | "clientes" | "catalogo" | "orcamento" | "producao" | "estoque" | "caixa" | "funil";

const COLUMNS = [
  ["arte", "Arte"],
  ["aprovacao", "Aprovação"],
  ["impressao", "Impressão"],
  ["acabamento", "Acabamento"],
  ["instalacao", "Instalação"],
  ["entregue", "Entregue"],
] as const;

const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Desk({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("painel");
  const org = user.organization_id;

  return (
    <div className="shell">
      <nav>
        <strong>CRM Gráfica</strong>
        <small>{user.name}</small>
        {([
          ["painel", "Painel"],
          ["clientes", "Clientes"],
          ["catalogo", "Catálogo"],
          ["orcamento", "Orçamento"],
          ["producao", "Produção"],
          ["estoque", "Estoque"],
          ["caixa", "Caixa"],
          ["funil", "Funil"],
        ] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
        <button className="ghost" onClick={onLogout}>Sair</button>
      </nav>
      <main>
        {tab === "painel" && <Painel org={org} />}
        {tab === "clientes" && <Clientes org={org} />}
        {tab === "catalogo" && <Catalogo org={org} />}
        {tab === "orcamento" && <Orcamento org={org} />}
        {tab === "producao" && <Producao org={org} />}
        {tab === "estoque" && <Estoque org={org} />}
        {tab === "caixa" && <Caixa org={org} />}
        {tab === "funil" && <Funil org={org} />}
      </main>
    </div>
  );
}

function Painel({ org }: { org: string }) {
  const [open, setOpen] = useState(0);
  const [late, setLate] = useState(0);
  const [recv, setRecv] = useState(0);
  useEffect(() => {
    sqliteQuery<{ n: number }>("SELECT COUNT(*) AS n FROM service_orders WHERE organization_id = ?1 AND status != 'entregue'", [org])
      .then(r => setOpen(Number(r[0]?.n ?? 0)));
    sqliteQuery<{ n: number }>("SELECT COUNT(*) AS n FROM service_orders WHERE organization_id = ?1 AND status != 'entregue' AND due_at IS NOT NULL AND due_at < date('now')", [org])
      .then(r => setLate(Number(r[0]?.n ?? 0)));
    sqliteQuery<{ n: number }>("SELECT COALESCE(SUM(amount_cents),0) AS n FROM ledger_entries WHERE organization_id = ?1 AND kind = 'receber' AND paid_at IS NULL", [org])
      .then(r => setRecv(Number(r[0]?.n ?? 0)));
  }, [org]);
  return (
    <section className="grid3">
      <div className="metric"><span>OS em aberto</span><strong>{open}</strong></div>
      <div className="metric"><span>Atrasadas</span><strong>{late}</strong></div>
      <div className="metric"><span>A receber</span><strong>{money(recv)}</strong></div>
    </section>
  );
}

function Clientes({ org }: { org: string }) {
  const [rows, setRows] = useState<Array<{ id: string; name: string; phone: string | null; document: string | null }>>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  async function load() {
    setRows(await sqliteQuery("SELECT id, name, phone, document FROM clients WHERE organization_id = ?1 ORDER BY name LIMIT 200", [org]));
  }
  useEffect(() => { void load(); }, [org]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    await sqliteExecute("INSERT INTO clients (id, organization_id, name, phone, document) VALUES (?1,?2,?3,?4,?5)",
      [crypto.randomUUID(), org, name.trim(), phone.trim() || null, document.trim() || null]);
    setName(""); setPhone(""); setDocument(""); await load();
  }
  return (
    <>
      <form className="card row" onSubmit={add}>
        <label>Nome<input required value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Telefone<input value={phone} onChange={e => setPhone(e.target.value)} /></label>
        <label>CPF/CNPJ<input value={document} onChange={e => setDocument(e.target.value)} /></label>
        <button>Salvar</button>
      </form>
      <section className="card"><table><thead><tr><th>Nome</th><th>Telefone</th><th>Documento</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.phone ?? "—"}</td><td>{r.document ?? "—"}</td></tr>)}</tbody>
      </table></section>
    </>
  );
}

function Catalogo({ org }: { org: string }) {
  const [rows, setRows] = useState<Array<{ id: string; name: string; category: string; price_cents: number }>>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("grafica");
  const [price, setPrice] = useState("");
  async function load() {
    setRows(await sqliteQuery("SELECT id, name, category, price_cents FROM catalog_items WHERE organization_id = ?1 AND active = 1 ORDER BY name", [org]));
  }
  useEffect(() => { void load(); }, [org]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(price.replace(",", ".")) * 100);
    await sqliteExecute("INSERT INTO catalog_items (id, organization_id, name, category, price_cents) VALUES (?1,?2,?3,?4,?5)",
      [crypto.randomUUID(), org, name.trim(), category, Number.isFinite(cents) ? cents : 0]);
    setName(""); setPrice(""); await load();
  }
  return (
    <>
      <form className="card row" onSubmit={add}>
        <label>Serviço<input required value={name} onChange={e => setName(e.target.value)} placeholder="Banner, adesivo, ACM…" /></label>
        <label>Categoria<select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="grafica">Gráfica</option>
          <option value="comunicacao_visual">Comunicação visual</option>
          <option value="acabamento">Acabamento</option>
          <option value="instalacao">Instalação</option>
          <option value="arte">Arte</option>
        </select></label>
        <label>Preço R$<input required value={price} onChange={e => setPrice(e.target.value)} /></label>
        <button>Salvar</button>
      </form>
      <section className="card"><table><thead><tr><th>Serviço</th><th>Categoria</th><th>Preço</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.category}</td><td>{money(r.price_cents)}</td></tr>)}</tbody>
      </table></section>
    </>
  );
}

function Orcamento({ org }: { org: string }) {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    sqliteQuery<{ id: string; name: string }>("SELECT id, name FROM clients WHERE organization_id = ?1 ORDER BY name", [org])
      .then((rows) => setClients(rows));
  }, [org]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const [next] = await sqliteQuery<{ n: number }>("SELECT COALESCE(MAX(number),0)+1 AS n FROM service_orders WHERE organization_id = ?1", [org]);
    const number = Number(next?.n ?? 1);
    const orderId = crypto.randomUUID();
    const cents = Math.round(Number(price.replace(",", ".")) * 100);
    const q = Number(qty.replace(",", ".")) || 1;
    await sqliteExecute("INSERT INTO service_orders (id, organization_id, client_id, number, title, status) VALUES (?1,?2,?3,?4,?5,'arte')",
      [orderId, org, clientId || null, number, title.trim()]);
    await sqliteExecute("INSERT INTO service_order_items (id, order_id, description, width_cm, height_cm, quantity, unit_price_cents) VALUES (?1,?2,?3,?4,?5,?6,?7)",
      [crypto.randomUUID(), orderId, desc.trim() || title.trim(), Number(w) || null, Number(h) || null, q, Number.isFinite(cents) ? cents : 0]);
    const total = Math.round((Number.isFinite(cents) ? cents : 0) * q);
    await sqliteExecute("INSERT INTO ledger_entries (id, organization_id, order_id, client_id, kind, description, amount_cents) VALUES (?1,?2,?3,?4,'receber',?5,?6)",
      [crypto.randomUUID(), org, orderId, clientId || null, `OS ${number} — ${title.trim()}`, total]);
    setMsg(`OS ${number} criada. Total ${money(total)}.`);
    setTitle(""); setDesc(""); setPrice("");
  }
  return (
    <form className="card" onSubmit={add}>
      <h2>Orçamento de balcão</h2>
      <p>Vira OS na coluna Arte e lança a receber.</p>
      <label>Cliente<select value={clientId} onChange={e => setClientId(e.target.value)}>
        <option value="">Sem cliente</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
      <label>Título da OS<input required value={title} onChange={e => setTitle(e.target.value)} /></label>
      <div className="row">
        <label>Item<input value={desc} onChange={e => setDesc(e.target.value)} /></label>
        <label>L cm<input value={w} onChange={e => setW(e.target.value)} /></label>
        <label>A cm<input value={h} onChange={e => setH(e.target.value)} /></label>
        <label>Qtd<input value={qty} onChange={e => setQty(e.target.value)} /></label>
        <label>Preço R$<input required value={price} onChange={e => setPrice(e.target.value)} /></label>
      </div>
      {msg && <p>{msg}</p>}
      <button>Gerar OS</button>
    </form>
  );
}

function Producao({ org }: { org: string }) {
  const [rows, setRows] = useState<Array<{ id: string; number: number; title: string; status: string; client: string | null }>>([]);
  async function load() {
    setRows(await sqliteQuery(`SELECT o.id, o.number, o.title, o.status, c.name AS client FROM service_orders o LEFT JOIN clients c ON c.id = o.client_id WHERE o.organization_id = ?1 ORDER BY o.number DESC LIMIT 200`, [org]));
  }
  useEffect(() => { void load(); }, [org]);
  async function move(id: string, status: string) {
    await sqliteExecute("UPDATE service_orders SET status = ?1, updated_at = datetime('now') WHERE id = ?2 AND organization_id = ?3", [status, id, org]);
    await load();
  }
  return (
    <div className="kanban">
      {COLUMNS.map(([status, label]) => (
        <div className="col" key={status}>
          <h3>{label}</h3>
          {rows.filter(r => r.status === status).map(r => (
            <article className="job" key={r.id}>
              <div><strong>OS {r.number}</strong></div>
              <div>{r.title}</div>
              <small>{r.client ?? "Balcão"}</small>
              <select value={status} onChange={e => void move(r.id, e.target.value)}>
                {COLUMNS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

function Estoque({ org }: { org: string }) {
  const [rows, setRows] = useState<Array<{ id: string; material: string; quantity: number; min_quantity: number; is_offcut: number }>>([]);
  const [material, setMaterial] = useState("");
  const [qty, setQty] = useState("");
  async function load() {
    setRows(await sqliteQuery("SELECT id, material, quantity, min_quantity, is_offcut FROM stock_lots WHERE organization_id = ?1 ORDER BY material", [org]));
  }
  useEffect(() => { void load(); }, [org]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    await sqliteExecute("INSERT INTO stock_lots (id, organization_id, material, quantity) VALUES (?1,?2,?3,?4)",
      [crypto.randomUUID(), org, material.trim(), Number(qty.replace(",", ".")) || 0]);
    setMaterial(""); setQty(""); await load();
  }
  return (
    <>
      <form className="card row" onSubmit={add}>
        <label>Material<input required value={material} onChange={e => setMaterial(e.target.value)} placeholder="Lona, vinil, chapa…" /></label>
        <label>Quantidade<input required value={qty} onChange={e => setQty(e.target.value)} /></label>
        <button>Entrada</button>
      </form>
      <section className="card"><table><thead><tr><th>Material</th><th>Qtd</th><th>Mínimo</th><th>Status</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.id}><td>{r.material}</td><td>{r.quantity}</td><td>{r.min_quantity}</td><td>{r.quantity <= r.min_quantity ? "Baixo" : "Ok"}</td></tr>)}</tbody>
      </table></section>
    </>
  );
}

function Caixa({ org }: { org: string }) {
  const [rows, setRows] = useState<Array<{ id: string; description: string; amount_cents: number; kind: string; paid_at: string | null }>>([]);
  async function load() {
    setRows(await sqliteQuery("SELECT id, description, amount_cents, kind, paid_at FROM ledger_entries WHERE organization_id = ?1 ORDER BY created_at DESC LIMIT 100", [org]));
  }
  useEffect(() => { void load(); }, [org]);
  async function pay(id: string) {
    await sqliteExecute("UPDATE ledger_entries SET paid_at = datetime('now') WHERE id = ?1 AND organization_id = ?2", [id, org]);
    await load();
  }
  return (
    <section className="card">
      <h2>Contas</h2>
      <table><thead><tr><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Status</th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id}>
            <td>{r.description}</td>
            <td>{r.kind === "receber" ? "A receber" : "A pagar"}</td>
            <td>{money(r.amount_cents)}</td>
            <td>{r.paid_at ? <span>✓ Pago</span> : <button className="sm" onClick={() => void pay(r.id)}>Baixar</button>}</td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}

function Funil({ org }: { org: string }) {
  const [rows, setRows] = useState<Array<{ id: string; title: string; stage: string }>>([]);
  const [title, setTitle] = useState("");
  async function load() {
    setRows(await sqliteQuery("SELECT id, title, stage FROM crm_deals WHERE organization_id = ?1 ORDER BY created_at DESC LIMIT 100", [org]));
  }
  useEffect(() => { void load(); }, [org]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    await sqliteExecute("INSERT INTO crm_deals (id, organization_id, title, stage) VALUES (?1,?2,?3,'lead')", [crypto.randomUUID(), org, title.trim()]);
    setTitle(""); await load();
  }
  async function stage(id: string, value: string) {
    await sqliteExecute("UPDATE crm_deals SET stage = ?1, updated_at = datetime('now') WHERE id = ?2 AND organization_id = ?3", [value, id, org]);
    await load();
  }
  return (
    <>
      <form className="card row" onSubmit={add}>
        <label>Negócio<input required value={title} onChange={e => setTitle(e.target.value)} /></label>
        <button>Criar lead</button>
      </form>
      <section className="card"><table><thead><tr><th>Negócio</th><th>Etapa</th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id}>
            <td>{r.title}</td>
            <td><select value={r.stage} onChange={e => void stage(r.id, e.target.value)}>
              {[
                ["lead", "Lead"], ["orcamento", "Orçamento"], ["negociacao", "Negociação"], ["fechado", "Fechado"], ["perdido", "Perdido"]
              ].map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select></td>
          </tr>
        ))}</tbody>
      </table></section>
    </>
  );
}
