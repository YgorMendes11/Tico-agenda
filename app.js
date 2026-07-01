// Agenda Escolar v1.1 — app.js

const SUPABASE_URL = "https://kcbjymlmltpzlczgvked.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYmp5bWxtbHRwemxjemd2a2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTE3NjYsImV4cCI6MjA5NjY2Nzc2Nn0.PGKs4_9CcuucAx7xEzZiJUBryXX1dCG3OyoahpnzjME";

// ── Supabase Auth ──────────────────────────────────────────
const sbAuth = {
  async signUp(email, senha, nome, tipo) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: senha, data: { nome, tipo } })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.msg || d.error_description || "Erro ao cadastrar");
    return d;
  },
  async signIn(email, senha) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: senha })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.msg || d.error_description || "Email ou senha incorretos");
    return d;
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
    });
  },
  async recuperarSenha(email) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.msg || d.error_description || "Erro ao enviar email");
    return d;
  }
};

// ── REST API ───────────────────────────────────────────────
const api = async (path, token, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer !== undefined ? opts.prefer : "return=representation",
    },
    ...opts,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
};

// ── Upload Storage ─────────────────────────────────────────
const uploadArquivo = async (file, bucket, token) => {
  const ext = file.name.split(".").pop();
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${nome}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Erro ao enviar arquivo");
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${nome}`;
};

// ── Helpers de data ────────────────────────────────────────
const toKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const formatarData = (d) =>
  d.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });

const formatarHora = (ts) =>
  new Date(ts).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });

// ── Constantes ─────────────────────────────────────────────
const CATEGORIAS_RELATORIO = [
  { id: "presenca",      label: "Presença",      icon: "✓",  color: "#4CAF8A" },
  { id: "alimentacao",   label: "Alimentação",   icon: "🍽",  color: "#F4A261" },
  { id: "saude",         label: "Saúde",         icon: "❤",  color: "#E76F86" },
  { id: "comportamento", label: "Comportamento", icon: "⭐",  color: "#7EC8E3" },
  { id: "higiene",       label: "Higiene",       icon: "🧼",  color: "#A8DADC" },
  { id: "medicamento",   label: "Medicamento",   icon: "💊",  color: "#9B89B4" },
  { id: "avisos",        label: "Avisos",        icon: "📢",  color: "#F9C74F" },
];

const OPCOES_RELATORIO = {
  presenca:      ["Presente", "Ausente", "Chegou tarde", "Saiu cedo"],
  saude:         ["Ótima", "Boa", "Regular", "Precisou de atenção", "Febre", "Machucado"],
  comportamento: ["Excelente", "Bom", "Regular", "Agitado", "Precisou de atenção"],
  medicamento:   ["Não necessitou", "Administrado conforme prescrição", "Recusou", "Outro"],
  avisos:        [],
};

const REFEICOES = [
  { id: "cafe_manha",   label: "Café da manhã" },
  { id: "lanche_manha", label: "Lanche da manhã" },
  { id: "almoco",       label: "Almoço" },
  { id: "lanche_tarde", label: "Lanche da tarde" },
  { id: "janta",        label: "Janta" },
];
const STATUS_ALIMENTACAO = ["Comeu tudo", "Mais da metade", "Menos da metade", "Recusou"];

const ITENS_HIGIENE = [
  { id: "fralda",    label: "Troca de fralda", icon: "🍼" },
  { id: "escovacao", label: "Escovação",        icon: "🪥" },
  { id: "banho",     label: "Banho",            icon: "🛁" },
  { id: "banheiro",  label: "Banheiro",         icon: "🚽" },
  { id: "outro",     label: "Outro",            icon: "✨" },
];

const CAMPOS_SEGURANCA = [
  { id: "data_nascimento",               label: "Data de nascimento",           tipo: "date" },
  { id: "tipo_sanguineo",                label: "Tipo sanguíneo",               tipo: "select", opcoes: ["A+","A-","B+","B-","AB+","AB-","O+","O-","Não sei"] },
  { id: "alergias",                      label: "Alergias",                     tipo: "textarea", placeholder: "Ex: Amendoim, leite..." },
  { id: "condicoes_medicas",             label: "Condições médicas",            tipo: "textarea", placeholder: "Ex: Asma, diabetes..." },
  { id: "medicamentos_uso_continuo",     label: "Medicamentos de uso contínuo", tipo: "textarea", placeholder: "Ex: Ritalina 10mg às 8h..." },
  { id: "plano_saude",                   label: "Plano de saúde",               tipo: "text",     placeholder: "Ex: Amil - 123456" },
  { id: "pediatra_nome",                 label: "Pediatra",                     tipo: "text",     placeholder: "Nome do médico" },
  { id: "pediatra_telefone",             label: "Telefone do pediatra",         tipo: "tel",      placeholder: "(00) 00000-0000" },
  { id: "contato_emergencia_nome",       label: "Contato emergência — Nome",    tipo: "text" },
  { id: "contato_emergencia_telefone",   label: "Contato emergência — Tel",     tipo: "tel",      placeholder: "(00) 00000-0000" },
  { id: "contato_emergencia_2_nome",     label: "Contato emergência 2 — Nome",  tipo: "text" },
  { id: "contato_emergencia_2_telefone", label: "Contato emergência 2 — Tel",   tipo: "tel",      placeholder: "(00) 00000-0000" },
  { id: "observacoes_seguranca",         label: "Outras observações",           tipo: "textarea", placeholder: "Informações importantes..." },
];

const MODULOS_COMUNICACAO = [
  { id: "recados",    label: "Recados",    icon: "💬", color: "#38BDF8", bg: "#E0F7FF" },
  { id: "circulares", label: "Circulares", icon: "📄", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "cardapio",   label: "Cardápio",   icon: "🍽", color: "#34D399", bg: "#D1FAE5" },
];
const MODULOS_DIARIO = [
  { id: "agenda",   label: "Agenda",   icon: "📋", color: "#4CAF8A", bg: "#DCFCE7" },
  { id: "chegando", label: "Chegando", icon: "🚗", color: "#F4A261", bg: "#FEF3E2" },
  { id: "turmas",   label: "Turmas",   icon: "🏫", color: "#A78BFA", bg: "#EDE9FE" },
];
const MODULOS_ADMIN = [
  { id: "alunos", label: "Alunos", icon: "👥", color: "#60A5FA", bg: "#DBEAFE" },
  { id: "chat",   label: "Chat",   icon: "💭", color: "#F472B6", bg: "#FCE7F3" },
];


// ── Componentes base ───────────────────────────────────────
function Input({ label, type="text", value, onChange, placeholder, onKeyDown, error }) {
  return (
    <div className="input-wrap">
      {label && <label className="input-label">{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
        className={`input ${error ? "input-error" : ""}`} />
      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}

function Btn({ onClick, children, variant="primary", disabled, style: extra }) {
  const cls = { primary:"btn btn-primary", green:"btn btn-green", ghost:"btn btn-ghost", danger:"btn btn-danger" };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      className={cls[variant] || "btn btn-primary"} style={extra}>
      {children}
    </button>
  );
}

function PageHeader({ titulo, onVoltar, children }) {
  return (
    <div className="page-header">
      <button onClick={onVoltar} className="btn-back">‹</button>
      <div style={{ fontWeight:800, fontSize:17, flex:1 }}>{titulo}</div>
      {children}
    </div>
  );
}

function ModuloCard({ modulo, badge, onClick }) {
  return (
    <button onClick={onClick} className="modulo-card">
      <div className="modulo-icon" style={{ background: modulo.bg }}>{modulo.icon}</div>
      <div className="modulo-label">{modulo.label}</div>
      {badge > 0 && <div className="modulo-badge">{badge > 9 ? "9+" : badge}</div>}
    </button>
  );
}

// ── Tela de Login ──────────────────────────────────────────
function TelaLogin({ onLogin }) {
  const [tela, setTela] = React.useState("login");
  const [email, setEmail] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [senhaConfirm, setSenhaConfirm] = React.useState("");
  const [nome, setNome] = React.useState("");
  const [tipo, setTipo] = React.useState("responsavel");
  const [erro, setErro] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sucesso, setSucesso] = React.useState("");
  const limpar = () => { setErro(""); setSucesso(""); };

  const entrar = async () => {
    if (!email || !senha) { setErro("Preencha email e senha."); return; }
    setLoading(true); setErro("");
    try {
      const session = await sbAuth.signIn(email, senha);
      const perfis = await api(`usuarios?id=eq.${session.user.id}`, session.access_token);
      const perfil = perfis[0];
      if (!perfil) throw new Error("Perfil não encontrado.");
      onLogin({ session, perfil });
    } catch(e) { setErro(e.message); } finally { setLoading(false); }
  };

  const cadastrar = async () => {
    if (!nome || !email || !senha || !senhaConfirm) { setErro("Preencha todos os campos."); return; }
    if (senha.length < 6) { setErro("Mínimo 6 caracteres."); return; }
    if (senha !== senhaConfirm) { setErro("As senhas não coincidem."); return; }
    setLoading(true); setErro("");
    try {
      await sbAuth.signUp(email, senha, nome, tipo);
      setSucesso("Cadastro realizado! Verifique seu email.");
      setTela("login");
    } catch(e) { setErro(e.message); } finally { setLoading(false); }
  };

  const recuperarSenha = async () => {
    if (!email) { setErro("Digite seu email."); return; }
    setLoading(true); setErro("");
    try {
      await sbAuth.recuperarSenha(email);
      setSucesso("Email enviado!");
      setTela("login");
    } catch(e) { setErro(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="login-bg">
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>📚</div>
          <div style={{ color:"white", fontSize:26, fontWeight:800 }}>Agenda Escolar</div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:14, marginTop:4 }}>v1.1</div>
        </div>
        <div className="login-card">
          {tela !== "recuperar" && (
            <div className="tab-bar">
              {[["login","Entrar"],["cadastro","Criar conta"]].map(([v,l]) => (
                <button key={v} onClick={() => { setTela(v); limpar(); }}
                  className={`tab-btn ${tela===v ? "tab-active" : "tab-inactive"}`}>{l}</button>
              ))}
            </div>
          )}
          {sucesso && (
            <div style={{ background:"#D1FAE5", border:"2px solid #4CAF8A", borderRadius:12, padding:"12px 14px", marginBottom:16, fontSize:13, color:"#065F46", fontWeight:600 }}>
              {sucesso}
            </div>
          )}
          {tela === "login" && (
            <div>
              <Input label="Email" type="email" value={email} onChange={e => { setEmail(e.target.value); limpar(); }} placeholder="seu@email.com" />
              <Input label="Senha" type="password" value={senha} onChange={e => { setSenha(e.target.value); limpar(); }}
                placeholder="••••••••" onKeyDown={e => e.key==="Enter" && entrar()} error={erro} />
              <Btn onClick={entrar} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Btn>
              <button onClick={() => { setTela("recuperar"); limpar(); }}
                style={{ width:"100%", background:"none", border:"none", marginTop:14, color:"#94A3B8", fontSize:13, fontWeight:600, cursor:"pointer", textDecoration:"underline" }}>
                Esqueci minha senha
              </button>
            </div>
          )}
          {tela === "cadastro" && (
            <div>
              <Input label="Nome completo" value={nome} onChange={e => { setNome(e.target.value); limpar(); }} placeholder="Seu nome" />
              <Input label="Email" type="email" value={email} onChange={e => { setEmail(e.target.value); limpar(); }} placeholder="seu@email.com" />
              <Input label="Senha" type="password" value={senha} onChange={e => { setSenha(e.target.value); limpar(); }} placeholder="Mínimo 6 caracteres" />
              <Input label="Confirmar senha" type="password" value={senhaConfirm}
                onChange={e => { setSenhaConfirm(e.target.value); limpar(); }}
                placeholder="Digite novamente"
                error={senhaConfirm && senha !== senhaConfirm ? "As senhas não coincidem." : ""} />
              <div className="input-wrap">
                <label className="input-label">Tipo de conta</label>
                <div style={{ display:"flex", gap:8 }}>
                  {[["responsavel","👨‍👩‍👧 Responsável"],["professor","👩‍🏫 Professor"],["coordenacao","🏫 Coordenação"]].map(([v,l]) => (
                    <button key={v} onClick={() => setTipo(v)}
                      style={{ flex:1, border:`2px solid ${tipo===v ? "#0EA5E9" : "#E2E8F0"}`, borderRadius:12, padding:"10px 6px", fontWeight:700, fontSize:11, cursor:"pointer", background: tipo===v ? "#E0F7FF" : "white", color: tipo===v ? "#0369A1" : "#64748B" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {erro && <div className="error-msg" style={{ marginBottom:12 }}>{erro}</div>}
              <Btn onClick={cadastrar} disabled={loading}>{loading ? "Cadastrando..." : "Criar conta"}</Btn>
            </div>
          )}
          {tela === "recuperar" && (
            <div>
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🔑</div>
                <div style={{ fontWeight:800, fontSize:16 }}>Recuperar senha</div>
              </div>
              <Input label="Email" type="email" value={email} onChange={e => { setEmail(e.target.value); limpar(); }}
                placeholder="seu@email.com" onKeyDown={e => e.key==="Enter" && recuperarSenha()} error={erro} />
              <Btn onClick={recuperarSenha} disabled={loading}>{loading ? "Enviando..." : "Enviar link"}</Btn>
              <button onClick={() => { setTela("login"); limpar(); }}
                style={{ width:"100%", background:"none", border:"none", marginTop:14, color:"#94A3B8", fontSize:13, fontWeight:600, cursor:"pointer", textDecoration:"underline" }}>
                Voltar para o login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Perfil de Segurança ────────────────────────────────────
function PerfilSeguranca({ aluno, podeEditar, onSalvar }) {
  const [editando, setEditando] = React.useState(false);
  const [form, setForm] = React.useState({});
  const [salvando, setSalvando] = React.useState(false);

  React.useEffect(() => {
    if (editando) {
      const init = {};
      CAMPOS_SEGURANCA.forEach(c => { init[c.id] = aluno[c.id] || ""; });
      setForm(init);
    }
  }, [editando, aluno]);

  const salvar = async () => {
    setSalvando(true);
    try { await onSalvar(form); setEditando(false); } finally { setSalvando(false); }
  };

  const camposPreenchidos = CAMPOS_SEGURANCA.filter(c => aluno[c.id]);

  if (!editando) return (
    <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #E2E8F0" }}>
      {camposPreenchidos.length === 0
        ? <div style={{ color:"#94A3B8", fontSize:13 }}>Nenhuma informação cadastrada.</div>
        : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {camposPreenchidos.map(c => (
              <div key={c.id} className="perfil-campo">
                <div className="perfil-campo-label">{c.label}</div>
                <div className="perfil-campo-valor">{aluno[c.id]}</div>
              </div>
            ))}
          </div>
      }
      {podeEditar && (
        <button onClick={() => setEditando(true)}
          style={{ marginTop:12, background:"#E0F7FF", border:"2px solid rgba(56,189,248,0.3)", borderRadius:10, padding:"8px 16px", color:"#0369A1", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          {camposPreenchidos.length === 0 ? "➕ Preencher" : "✏️ Editar"}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #E2E8F0" }}>
      {CAMPOS_SEGURANCA.map(c => (
        <div key={c.id} className="input-wrap">
          <label className="input-label">{c.label}</label>
          {c.tipo === "textarea"
            ? <textarea value={form[c.id]||""} onChange={e => setForm(p=>({...p,[c.id]:e.target.value}))} placeholder={c.placeholder||""} rows={2} className="textarea" />
            : c.tipo === "select"
            ? <select value={form[c.id]||""} onChange={e => setForm(p=>({...p,[c.id]:e.target.value}))} className="select">
                <option value="">Selecione...</option>
                {c.opcoes.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            : <input type={c.tipo} value={form[c.id]||""} onChange={e => setForm(p=>({...p,[c.id]:e.target.value}))} placeholder={c.placeholder||""} className="input" />
          }
        </div>
      ))}
      <div style={{ display:"flex", gap:8 }}>
        <Btn variant="ghost" onClick={() => setEditando(false)} style={{ flex:1 }}>Cancelar</Btn>
        <Btn variant="green" onClick={salvar} disabled={salvando} style={{ flex:1 }}>{salvando ? "Salvando..." : "Salvar"}</Btn>
      </div>
    </div>
  );
}

// ── Módulo: Agenda ─────────────────────────────────────────
function ModuloAgenda({ token, alunos, isProfessor }) {
  const [dataSel, setDataSel] = React.useState(new Date());
  const [alunoSel, setAlunoSel] = React.useState(alunos[0]?.id || null);
  const [relatorios, setRelatorios] = React.useState([]);
  const [carregando, setCarregando] = React.useState(false);
  const [catAberta, setCatAberta] = React.useState(null);
  const [statusMsg, setStatusMsg] = React.useState(null);

  React.useEffect(() => { if (alunos.length > 0 && !alunoSel) setAlunoSel(alunos[0].id); }, [alunos]);
  React.useEffect(() => { if (token && alunoSel) carregar(); }, [alunoSel, dataSel, token]);

  const carregar = async () => {
    setCarregando(true);
    try {
      const data = await api(`relatorios?aluno_id=eq.${alunoSel}&data=eq.${toKey(dataSel)}`, token);
      setRelatorios(data);
    } catch(e) { console.error(e); } finally { setCarregando(false); }
  };

  const ok = (msg) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(null), 2000); };
  const getDados = (id) => relatorios.find(r => r.categoria === id) || {};

  const atualizarCampo = async (categoria, campo, valor) => {
    if (!isProfessor) return;
    const ex = relatorios.find(r => r.categoria === categoria);
    if (ex) {
      setRelatorios(prev => prev.map(r => r.id===ex.id ? {...r,[campo]:valor} : r));
      await api(`relatorios?id=eq.${ex.id}`, token, { method:"PATCH", body:JSON.stringify({[campo]:valor}) });
    } else {
      const novo = await api("relatorios", token, { method:"POST", body:JSON.stringify({ aluno_id:alunoSel, data:toKey(dataSel), categoria, [campo]:valor }) });
      if (novo?.[0]) setRelatorios(prev => [...prev, novo[0]]);
    }
    ok("✓ Salvo");
  };

  const atualizarDetalhe = async (categoria, chave, valor) => {
    if (!isProfessor) return;
    const ex = relatorios.find(r => r.categoria === categoria);
    const det = { ...(ex?.detalhes||{}), [chave]:valor };
    if (ex) {
      setRelatorios(prev => prev.map(r => r.id===ex.id ? {...r,detalhes:det} : r));
      await api(`relatorios?id=eq.${ex.id}`, token, { method:"PATCH", body:JSON.stringify({detalhes:det}) });
    } else {
      const novo = await api("relatorios", token, { method:"POST", body:JSON.stringify({ aluno_id:alunoSel, data:toKey(dataSel), categoria, detalhes:det }) });
      if (novo?.[0]) setRelatorios(prev => [...prev, novo[0]]);
    }
    ok("✓ Salvo");
  };

  const mudarDia = (d) => { const n = new Date(dataSel); n.setDate(n.getDate()+d); setDataSel(n); };
  const nomeAluno = alunos.find(a => a.id === alunoSel)?.nome || "";

  return (
    <div className="page">
      <div className="header-green" style={{ paddingBottom:0 }}>
        <div className="row" style={{ marginBottom:12 }}>
          <button onClick={() => mudarDia(-1)} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, color:"white", width:34, height:34, cursor:"pointer", fontSize:18 }}>‹</button>
          <div style={{ flex:1, textAlign:"center", fontSize:13, fontWeight:700, textTransform:"capitalize", color:"white" }}>{formatarData(dataSel)}</div>
          <button onClick={() => mudarDia(1)} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, color:"white", width:34, height:34, cursor:"pointer", fontSize:18 }}>›</button>
          <button onClick={() => setDataSel(new Date())} style={{ background:"rgba(255,255,255,0.25)", border:"none", borderRadius:8, color:"white", padding:"0 12px", height:34, cursor:"pointer", fontWeight:700, fontSize:12 }}>Hoje</button>
        </div>
        {statusMsg && <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:10, padding:"5px 14px", fontSize:12, fontWeight:700, marginBottom:10, textAlign:"center", color:"white" }}>{statusMsg}</div>}
      </div>

      <div className="content">
        {alunos.length > 1 && (
          <div className="card-mb" style={{ marginTop:16 }}>
            <div className="input-label" style={{ marginBottom:8 }}>Aluno</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {alunos.map(a => (
                <button key={a.id} onClick={() => setAlunoSel(a.id)}
                  className={`chip ${alunoSel===a.id ? "chip-active" : "chip-inactive"}`}
                  style={{ background: alunoSel===a.id ? "#4CAF8A" : undefined }}>
                  {a.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {carregando && <div className="empty"><div className="empty-icon">⏳</div></div>}

        {!carregando && isProfessor && CATEGORIAS_RELATORIO.map(cat => {
          const dados = getDados(cat.id);
          const det = dados.detalhes || {};
          const aberta = catAberta === cat.id;
          const detP = Object.keys(det).filter(k => det[k] && det[k] !== 0).length;
          const temDados = dados.opcao || dados.observacao || detP > 0;
          let resumo = "";
          if (cat.id === "alimentacao" && detP > 0) resumo = REFEICOES.filter(r => det[r.id]).map(r => `${r.label}: ${det[r.id]}`).join(" · ");
          if (cat.id === "higiene" && detP > 0) resumo = ITENS_HIGIENE.filter(i => det[i.id] > 0).map(i => `${i.label}: ${det[i.id]}`).join(" · ");

          return (
            <div key={cat.id} style={{ background:"white", borderRadius:16, marginBottom:10, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", overflow:"hidden", border: temDados ? `2px solid ${cat.color}40` : "2px solid transparent" }}>
              <button onClick={() => setCatAberta(aberta ? null : cat.id)}
                style={{ width:"100%", background:"none", border:"none", padding:"14px 18px", display:"flex", alignItems:"center", cursor:"pointer", gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:12, background:`${cat.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{cat.icon}</div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontWeight:800, fontSize:14 }}>{cat.label}</div>
                  {temDados && !aberta && <div style={{ fontSize:12, color:cat.color, fontWeight:600, marginTop:2 }}>{resumo || dados.opcao || "Registrado"}</div>}
                  {!temDados && !aberta && <div style={{ fontSize:12, color:"#CBD5E0", marginTop:2 }}>Toque para registrar</div>}
                </div>
                <div style={{ color: temDados ? cat.color : "#CBD5E0", fontSize:16 }}>{temDados ? "●" : "○"}</div>
              </button>
              {aberta && (
                <div style={{ padding:"0 18px 18px", borderTop:"1px solid #F1F5F9" }}>
                  {cat.id === "alimentacao" && (
                    <div style={{ marginTop:14 }}>
                      {REFEICOES.map(ref => (
                        <div key={ref.id} style={{ marginBottom:14 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:6 }}>{ref.label}</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {STATUS_ALIMENTACAO.map(st => (
                              <button key={st} onClick={() => atualizarDetalhe(cat.id, ref.id, det[ref.id]===st ? "" : st)}
                                style={{ background: det[ref.id]===st ? cat.color : "#F1F5F9", border:"none", borderRadius:20, padding:"7px 12px", fontWeight:700, fontSize:11.5, color: det[ref.id]===st ? "white" : "#1E293B", cursor:"pointer" }}>
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {cat.id === "higiene" && (
                    <div style={{ marginTop:14 }}>
                      {ITENS_HIGIENE.map(item => {
                        const qtd = det[item.id] || 0;
                        return (
                          <div key={item.id} className="row-between" style={{ padding:"10px 0", borderBottom:"1px solid #F8FAFC" }}>
                            <div className="row"><span style={{ fontSize:18 }}>{item.icon}</span><span style={{ fontWeight:700, fontSize:13 }}>{item.label}</span></div>
                            <div className="row">
                              <button onClick={() => qtd > 0 && atualizarDetalhe(cat.id, item.id, qtd-1)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#F1F5F9", color:"#64748B", fontWeight:800, fontSize:16, cursor:qtd>0?"pointer":"default", opacity:qtd>0?1:0.4 }}>−</button>
                              <span style={{ minWidth:24, textAlign:"center", fontWeight:800, fontSize:15, color:qtd>0?cat.color:"#CBD5E0" }}>{qtd}</span>
                              <button onClick={() => atualizarDetalhe(cat.id, item.id, qtd+1)} style={{ width:30, height:30, borderRadius:8, border:"none", background:cat.color, color:"white", fontWeight:800, fontSize:16, cursor:"pointer" }}>+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {cat.id !== "alimentacao" && cat.id !== "higiene" && OPCOES_RELATORIO[cat.id]?.length > 0 && (
                    <div style={{ marginTop:14 }}>
                      <div className="input-label" style={{ marginBottom:8 }}>Status</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                        {OPCOES_RELATORIO[cat.id].map(op => (
                          <button key={op} onClick={() => atualizarCampo(cat.id, "opcao", dados.opcao===op ? "" : op)}
                            style={{ background:dados.opcao===op?cat.color:"#F1F5F9", border:"none", borderRadius:20, padding:"8px 14px", fontWeight:700, fontSize:12, color:dados.opcao===op?"white":"#1E293B", cursor:"pointer" }}>
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop:14 }}>
                    <div className="input-label" style={{ marginBottom:6 }}>{cat.id==="avisos" ? "Aviso" : "Observação"}</div>
                    <textarea value={dados.observacao||""} onChange={e => atualizarCampo(cat.id,"observacao",e.target.value)}
                      placeholder={cat.id==="avisos" ? "Escreva um aviso..." : "Adicione observações..."} rows={3} className="textarea" />
                  </div>
                  {cat.id === "medicamento" && (
                    <div style={{ marginTop:10 }}>
                      <div className="input-label" style={{ marginBottom:6 }}>Horário / Dosagem</div>
                      <input value={dados.horario||""} onChange={e => atualizarCampo(cat.id,"horario",e.target.value)} placeholder="Ex: 10h - 5ml de dipirona" className="input" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Resumo */}
        {!carregando && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontWeight:800, fontSize:17, marginBottom:14, color:"#1E293B" }}>📋 Resumo — {nomeAluno}</div>
            {CATEGORIAS_RELATORIO.map(cat => {
              const d = getDados(cat.id);
              const det = d?.detalhes || {};
              let topicos = [];
              if (cat.id === "alimentacao") topicos = REFEICOES.filter(r => det[r.id]).map(r => ({label:r.label,valor:det[r.id]}));
              else if (cat.id === "higiene") topicos = ITENS_HIGIENE.filter(i => det[i.id]>0).map(i => ({label:i.label,valor:String(det[i.id])}));
              else {
                if (d?.opcao) topicos.push({label:"Status",valor:d.opcao});
                if (d?.horario) topicos.push({label:"Horário",valor:d.horario});
              }
              const temObs = d?.observacao;
              if (topicos.length===0 && !temObs) return null;
              return (
                <div key={cat.id} className="resumo-card" style={{ borderLeft:`5px solid ${cat.color}` }}>
                  <div className="row" style={{ marginBottom:(topicos.length>0||temObs)?12:0 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${cat.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{cat.icon}</div>
                    <div style={{ fontWeight:800, fontSize:16 }}>{cat.label}</div>
                  </div>
                  {topicos.map((t,i) => {
                    const vl = String(t.valor).toLowerCase();
                    let m = "•";
                    if (cat.id==="alimentacao") m = vl==="comeu tudo"?"✅":vl==="mais da metade"?"🙂":vl==="menos da metade"?"😕":"❌";
                    else if (cat.id==="higiene") m = "🔁";
                    else if (cat.id==="presenca") m = vl==="presente"?"✅":vl==="ausente"?"❌":"⚠️";
                    else if (cat.id==="comportamento") m = vl==="excelente"?"🌟":vl==="bom"?"⭐":"⚠️";
                    else if (cat.id==="saude") m = (vl==="ótima"||vl==="boa")?"💚":vl==="regular"?"🟡":"🚨";
                    else if (cat.id==="medicamento") m = "💊";
                    else if (t.label==="Horário") m = "🕐";
                    return (
                      <div key={i} className="row" style={{ paddingLeft:4, marginBottom:6 }}>
                        <div style={{ fontSize:18, width:24, textAlign:"center", flexShrink:0 }}>{m}</div>
                        <div style={{ fontSize:15, color:"#475569" }}><span style={{ fontWeight:700, color:"#1E293B" }}>{t.label}: </span>{t.valor}</div>
                      </div>
                    );
                  })}
                  {temObs && (
                    <div className="row" style={{ paddingLeft:4, marginTop:topicos.length>0?10:0, borderTop:topicos.length>0?"1px solid #F1F5F9":"none", paddingTop:topicos.length>0?10:0, alignItems:"flex-start" }}>
                      <div style={{ fontSize:18, width:24, textAlign:"center", flexShrink:0, marginTop:1 }}>{cat.id==="avisos"?"📢":"📝"}</div>
                      <div style={{ fontSize:15, color:"#475569", lineHeight:1.5 }}><span style={{ fontWeight:700, color:"#1E293B" }}>{cat.id==="avisos"?"Aviso: ":"Obs: "}</span>{d.observacao}</div>
                    </div>
                  )}
                </div>
              );
            })}
            {relatorios.length===0 && <div className="card empty">Nenhum registro para este dia.</div>}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Módulo: Chegando ───────────────────────────────────────
function ModuloChegando({ token, alunos, isProfessor, isResponsavel }) {
  const [chegadas, setChegadas] = React.useState([]);
  const [dataSel] = React.useState(new Date());
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await api(`chegadas?data=eq.${toKey(dataSel)}&select=*,aluno:aluno_id(nome)`, token);
      setChegadas(data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const marcar = async (alunoId, campo, escolaId) => {
    const ex = chegadas.find(c => c.aluno_id === alunoId);
    const agora = new Date().toISOString();
    if (ex) {
      await api(`chegadas?id=eq.${ex.id}`, token, { method:"PATCH", body:JSON.stringify({[campo]:agora}) });
    } else {
      await api("chegadas", token, { method:"POST", body:JSON.stringify({ aluno_id:alunoId, escola_id:escolaId, data:toKey(dataSel), [campo]:agora }) });
    }
    await carregar();
  };

  const etapas = [
    { campo:"saida_casa",     label:"🏠 Saiu de casa",      quem:"responsavel", cor:"#F4A261" },
    { campo:"chegada_escola", label:"🏫 Chegou na escola",   quem:"professor",   cor:"#4CAF8A" },
    { campo:"saida_escola",   label:"🏫 Saiu da escola",     quem:"professor",   cor:"#60A5FA" },
    { campo:"chegada_casa",   label:"🏠 Chegou em casa",     quem:"responsavel", cor:"#A78BFA" },
  ];

  return (
    <div className="content" style={{ paddingTop:16 }}>
      <div style={{ fontWeight:800, fontSize:17, marginBottom:16, color:"#1E293B" }}>
        🚗 Chegando — {new Date(dataSel).toLocaleDateString("pt-BR")}
      </div>
      {loading && <div className="empty"><div className="empty-icon">⏳</div></div>}
      {alunos.map(a => {
        const chegada = chegadas.find(c => c.aluno_id === a.id) || {};
        return (
          <div key={a.id} className="card-mb">
            <div className="row" style={{ marginBottom:14 }}>
              <div className="avatar avatar-md" style={{ background:"#F4A261" }}>{a.nome[0]}</div>
              <div style={{ fontWeight:800, fontSize:15 }}>{a.nome}</div>
            </div>
            <div className="chegando-grid">
              {etapas.map(e => {
                const podeMarcar = (e.quem==="professor" && isProfessor) || (e.quem==="responsavel" && isResponsavel);
                const marcado = chegada[e.campo];
                return (
                  <div key={e.campo} className="chegando-item"
                    style={{ background:marcado?`${e.cor}15`:"#F8FAFC", borderColor:marcado?e.cor:"#E2E8F0" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:marcado?e.cor:"#94A3B8", marginBottom:4 }}>{e.label}</div>
                    {marcado
                      ? <div style={{ fontSize:13, fontWeight:700, color:e.cor }}>{formatarHora(marcado)}</div>
                      : podeMarcar
                      ? <button onClick={() => marcar(a.id, e.campo, a.escola_id)}
                          style={{ background:e.cor, border:"none", borderRadius:8, color:"white", padding:"5px 10px", cursor:"pointer", fontWeight:700, fontSize:11 }}>
                          Marcar
                        </button>
                      : <div style={{ fontSize:12, color:"#CBD5E0" }}>Aguardando...</div>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {alunos.length === 0 && <div className="empty"><div className="empty-icon">👥</div><div className="empty-text">Nenhum aluno vinculado.</div></div>}
    </div>
  );
}

// ── Módulo: Cardápio ───────────────────────────────────────
function ModuloCardapio({ token, perfil, escolaAtualId, isCoordenacao }) {
  const [cardapios, setCardapios] = React.useState([]);
  const [titulo, setTitulo] = React.useState("");
  const [dataInicio, setDataInicio] = React.useState("");
  const [dataFim, setDataFim] = React.useState("");
  const [arquivo, setArquivo] = React.useState(null);
  const [enviando, setEnviando] = React.useState(false);
  const fileRef = React.useRef(null);

  React.useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      const data = await api("cardapios?order=data_inicio.desc", token);
      setCardapios(data);
    } catch(e) { console.error(e); }
  };

  const publicar = async () => {
    if (!titulo || !dataInicio || !dataFim) return;
    setEnviando(true);
    try {
      let arquivo_url = null;
      if (arquivo) arquivo_url = await uploadArquivo(arquivo, "cardapios", token);
      await api("cardapios", token, { method:"POST", body:JSON.stringify({ titulo, data_inicio:dataInicio, data_fim:dataFim, arquivo_url, escola_id:escolaAtualId, created_by:perfil.id }) });
      setTitulo(""); setDataInicio(""); setDataFim(""); setArquivo(null);
      await carregar();
    } catch(e) { console.error(e); } finally { setEnviando(false); }
  };

  const remover = async (id) => {
    if (!window.confirm("Remover este cardápio?")) return;
    await api(`cardapios?id=eq.${id}`, token, { method:"DELETE", prefer:"" });
    await carregar();
  };

  return (
    <div className="content" style={{ paddingTop:16 }}>
      {isCoordenacao && (
        <div className="card-mb">
          <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>📤 Publicar Cardápio</div>
          <Input label="Título" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Semana de 23/06" />
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label className="input-label">De</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="input" />
            </div>
            <div style={{ flex:1 }}>
              <label className="input-label">Até</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="input" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={e => setArquivo(e.target.files[0])} style={{ display:"none" }} />
          <button onClick={() => fileRef.current?.click()} className="upload-area">
            {arquivo ? `📎 ${arquivo.name}` : "📎 Anexar imagem ou PDF"}
          </button>
          <Btn variant="green" onClick={publicar} disabled={enviando}>{enviando ? "Publicando..." : "Publicar"}</Btn>
        </div>
      )}
      <div style={{ fontWeight:800, fontSize:17, marginBottom:14, color:"#1E293B" }}>🍽 Cardápios</div>
      {cardapios.length === 0 && <div className="empty"><div className="empty-icon">🍽</div><div className="empty-text">Nenhum cardápio publicado.</div></div>}
      {cardapios.map(c => (
        <div key={c.id} className="card-mb">
          <div className="row-between" style={{ marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:800, fontSize:15 }}>{c.titulo}</div>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>
                {new Date(c.data_inicio).toLocaleDateString("pt-BR")} até {new Date(c.data_fim).toLocaleDateString("pt-BR")}
              </div>
            </div>
            {isCoordenacao && (
              <button onClick={() => remover(c.id)} className="btn btn-danger btn-small">✕</button>
            )}
          </div>
          {c.arquivo_url && <a href={c.arquivo_url} target="_blank" rel="noreferrer" className="arquivo-link">👁 Ver cardápio completo</a>}
        </div>
      ))}
    </div>
  );
}

// ── Módulo: Circulares ─────────────────────────────────────
function ModuloCirculares({ token, perfil, escolaAtualId, isCoordenacao }) {
  const [circulares, setCirculares] = React.useState([]);
  const [titulo, setTitulo] = React.useState("");
  const [descricao, setDescricao] = React.useState("");
  const [arquivo, setArquivo] = React.useState(null);
  const [enviando, setEnviando] = React.useState(false);
  const fileRef = React.useRef(null);

  React.useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      const data = await api("circulares?order=created_at.desc", token);
      setCirculares(data);
    } catch(e) { console.error(e); }
  };

  const publicar = async () => {
    if (!titulo) return;
    setEnviando(true);
    try {
      let arquivo_url = null;
      if (arquivo) arquivo_url = await uploadArquivo(arquivo, "circulares", token);
      await api("circulares", token, { method:"POST", body:JSON.stringify({ titulo, descricao, arquivo_url, escola_id:escolaAtualId, created_by:perfil.id }) });
      setTitulo(""); setDescricao(""); setArquivo(null);
      await carregar();
    } catch(e) { console.error(e); } finally { setEnviando(false); }
  };

  const confirmar = async (circ) => {
    if (circ.confirmacoes?.includes(perfil.id)) return;
    const novas = [...(circ.confirmacoes||[]), perfil.id];
    await api(`circulares?id=eq.${circ.id}`, token, { method:"PATCH", body:JSON.stringify({ confirmacoes:novas }) });
    await carregar();
  };

  const remover = async (id) => {
    if (!window.confirm("Remover esta circular?")) return;
    await api(`circulares?id=eq.${id}`, token, { method:"DELETE", prefer:"" });
    await carregar();
  };

  return (
    <div className="content" style={{ paddingTop:16 }}>
      {isCoordenacao && (
        <div className="card-mb">
          <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>📤 Nova Circular</div>
          <Input label="Título" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Reunião de pais" />
          <div className="input-wrap">
            <label className="input-label">Descrição (opcional)</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} placeholder="Detalhes..." className="textarea" />
          </div>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={e => setArquivo(e.target.files[0])} style={{ display:"none" }} />
          <button onClick={() => fileRef.current?.click()} className="upload-area">
            {arquivo ? `📎 ${arquivo.name}` : "📎 Anexar imagem ou PDF"}
          </button>
          <Btn variant="green" onClick={publicar} disabled={enviando}>{enviando ? "Publicando..." : "Publicar"}</Btn>
        </div>
      )}
      <div style={{ fontWeight:800, fontSize:17, marginBottom:14, color:"#1E293B" }}>📄 Circulares</div>
      {circulares.length === 0 && <div className="empty"><div className="empty-icon">📄</div><div className="empty-text">Nenhuma circular publicada.</div></div>}
      {circulares.map(c => {
        const confirmou = c.confirmacoes?.includes(perfil.id);
        return (
          <div key={c.id} className="card-mb" style={{ border: confirmou ? "2px solid rgba(76,175,138,0.3)" : "2px solid transparent" }}>
            <div className="row-between" style={{ marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:15 }}>{c.titulo}</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>
                  {new Date(c.created_at).toLocaleDateString("pt-BR")} · {c.confirmacoes?.length||0} confirmações
                </div>
                {c.descricao && <div style={{ fontSize:14, color:"#475569", marginTop:8 }}>{c.descricao}</div>}
              </div>
              {isCoordenacao && (
                <button onClick={() => remover(c.id)} className="btn btn-danger btn-small" style={{ marginLeft:10, flexShrink:0 }}>✕</button>
              )}
            </div>
            {c.arquivo_url && <a href={c.arquivo_url} target="_blank" rel="noreferrer" className="arquivo-link">👁 Ver documento</a>}
            {!isCoordenacao && (
              <button onClick={() => confirmar(c)} disabled={confirmou}
                style={{ width:"100%", marginTop:12, background:confirmou?"#D1FAE5":"linear-gradient(135deg,#4CAF8A,#3A9B7A)", border:"none", borderRadius:12, padding:11, cursor:confirmou?"default":"pointer", color:confirmou?"#065F46":"white", fontWeight:700, fontSize:13 }}>
                {confirmou ? "✅ Li e confirmei" : "Li e concordo"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Módulo: Recados (Chat) ─────────────────────────────────
function ModuloRecados({ token, perfil, alunos }) {
  const [mensagens, setMensagens] = React.useState([]);
  const [chatAluno, setChatAluno] = React.useState(null);
  const [novaMensagem, setNovaMensagem] = React.useState("");
  const [imagemSel, setImagemSel] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [enviando, setEnviando] = React.useState(false);
  const chatEndRef = React.useRef(null);
  const fileRef = React.useRef(null);

  React.useEffect(() => { carregar(); }, [chatAluno]);
  React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [mensagens]);

  const carregar = async () => {
    try {
      const filtro = chatAluno
        ? `mensagens?aluno_id=eq.${chatAluno}&select=*,autor:autor_id(nome,tipo)&order=created_at.asc`
        : `mensagens?aluno_id=is.null&select=*,autor:autor_id(nome,tipo)&order=created_at.asc`;
      const data = await api(filtro, token);
      setMensagens(data);
      marcarLidas(data);
    } catch(e) { console.error(e); }
  };

  const marcarLidas = async (msgs) => {
    const pendentes = msgs.filter(m => m.autor_id !== perfil.id && !(m.lida_por||[]).includes(perfil.id));
    for (const m of pendentes) {
      await api(`mensagens?id=eq.${m.id}`, token, { method:"PATCH", body:JSON.stringify({ lida_por:[...(m.lida_por||[]),perfil.id] }) }).catch(()=>{});
    }
  };

  const escolherImagem = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5*1024*1024) return;
    setImagemSel(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const enviar = async () => {
    const texto = novaMensagem.trim();
    if (!texto && !imagemSel) return;
    setEnviando(true);
    try {
      let imagem_url = null;
      if (imagemSel) imagem_url = await uploadArquivo(imagemSel, "chat-imagens", token);
      await api("mensagens", token, { method:"POST", body:JSON.stringify({ aluno_id:chatAluno||null, autor_id:perfil.id, conteudo:texto, imagem_url, lida_por:[perfil.id] }) });
      setNovaMensagem(""); setImagemSel(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      await carregar();
    } catch(e) { console.error(e); } finally { setEnviando(false); }
  };

  const formatDia = (ts) => new Date(ts).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
  const grupos = React.useMemo(() => {
    const map = {};
    mensagens.forEach(m => { const d = formatDia(m.created_at); if (!map[d]) map[d]=[]; map[d].push(m); });
    return Object.entries(map);
  }, [mensagens]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 60px)" }}>
      {/* Canais */}
      <div style={{ background:"white", borderBottom:"1px solid #E2E8F0", padding:"12px 16px" }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={() => setChatAluno(null)}
            className={`chip ${chatAluno===null?"chip-active":"chip-inactive"}`}
            style={{ background:chatAluno===null?"#38BDF8":undefined }}>
            📢 Geral
          </button>
          {alunos.map(a => (
            <button key={a.id} onClick={() => setChatAluno(a.id)}
              className={`chip ${chatAluno===a.id?"chip-active":"chip-inactive"}`}
              style={{ background:chatAluno===a.id?"#38BDF8":undefined }}>
              {a.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
        {grupos.length === 0 && <div className="empty"><div className="empty-icon">💬</div><div className="empty-text">Nenhuma mensagem.</div></div>}
        {grupos.map(([dia, msgs]) => (
          <div key={dia}>
            <div className="row" style={{ margin:"14px 0 10px" }}>
              <div style={{ flex:1, height:1, background:"#E2E8F0" }} />
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", background:"#F0F4F8", padding:"2px 10px", borderRadius:20 }}>{dia}</div>
              <div style={{ flex:1, height:1, background:"#E2E8F0" }} />
            </div>
            {msgs.map(m => {
              const isMinha = m.autor_id === perfil.id;
              const t = m.autor?.tipo;
              const cfg = t==="professor" ? {bg:"#D1FAE5",fg:"#065F46",label:"Professor"} : t==="coordenacao" ? {bg:"#FEF3C7",fg:"#92400E",label:"Coordenação"} : {bg:"#DBEAFE",fg:"#1E40AF",label:"Responsável"};
              return (
                <div key={m.id} style={{ display:"flex", justifyContent:isMinha?"flex-end":"flex-start", marginBottom:8 }}>
                  <div style={{ maxWidth:"78%" }}>
                    {!isMinha && (
                      <div className="row" style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:3 }}>
                        <span style={{ background:cfg.bg, color:cfg.fg, borderRadius:6, padding:"1px 6px", fontSize:10 }}>{cfg.label}</span>
                        {m.autor?.nome}
                      </div>
                    )}
                    <div className={isMinha?"chat-bubble-mine":"chat-bubble-other"} style={{ padding:m.imagem_url?6:undefined }}>
                      {m.imagem_url && <img src={m.imagem_url} alt="" style={{ width:"100%", maxWidth:240, borderRadius:10, display:"block", marginBottom:m.conteudo?6:0 }} onClick={() => window.open(m.imagem_url,"_blank")} />}
                      {m.conteudo && <div style={{ padding:m.imagem_url?"0 6px 4px":0 }}>{m.conteudo}</div>}
                    </div>
                    <div style={{ fontSize:10, color:"#94A3B8", marginTop:3, textAlign:isMinha?"right":"left" }}>
                      {formatarHora(m.created_at)}{isMinha && <span style={{ marginLeft:4 }}>{m.lida_por?.length>1?" ✓✓":" ✓"}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {previewUrl && (
        <div style={{ background:"white", borderTop:"1px solid #E2E8F0", padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <img src={previewUrl} alt="" style={{ width:48, height:48, borderRadius:8, objectFit:"cover" }} />
          <div style={{ flex:1, fontSize:12, color:"#64748B", fontWeight:600 }}>Imagem selecionada</div>
          <button onClick={() => { setImagemSel(null); URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
            style={{ background:"#FEE2E2", border:"none", borderRadius:8, color:"#E76F86", width:30, height:30, cursor:"pointer", fontWeight:700 }}>✕</button>
        </div>
      )}

      <div style={{ background:"white", borderTop:"1px solid #E2E8F0", padding:"12px 16px", display:"flex", gap:8, alignItems:"flex-end" }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={escolherImagem} style={{ display:"none" }} />
        <button onClick={() => fileRef.current?.click()} className="btn-icon">📎</button>
        <textarea value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)}
          onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Digite uma mensagem..." rows={1} className="textarea" style={{ resize:"none", flex:1 }} />
        <button onClick={enviar} disabled={(!novaMensagem.trim() && !imagemSel)||enviando}
          style={{ background:(novaMensagem.trim()||imagemSel)?"linear-gradient(135deg,#38BDF8,#0EA5E9)":"#E2E8F0", border:"none", borderRadius:12, width:42, height:42, color:(novaMensagem.trim()||imagemSel)?"white":"#94A3B8", cursor:(novaMensagem.trim()||imagemSel)?"pointer":"default", fontSize:18, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {enviando ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}


// ── App Principal ──────────────────────────────────────────
function App() {
  const [authData,      setAuthData]      = React.useState(null);
  const [moduloAtivo,   setModuloAtivo]   = React.useState(null);
  const [alunos,        setAlunos]        = React.useState([]);
  const [turmas,        setTurmas]        = React.useState([]);
  const [todasTurmas,   setTodasTurmas]   = React.useState([]);
  const [escolas,       setEscolas]       = React.useState([]);
  const [escolaAtualId, setEscolaAtualId] = React.useState(null);
  const [professores,   setProfessores]   = React.useState([]);
  const [convites,      setConvites]      = React.useState([]);
  const [solicitacoes,  setSolicitacoes]  = React.useState([]);
  const [naoLidasChat,  setNaoLidasChat]  = React.useState(0);
  const [naoLidasAdmin, setNaoLidasAdmin] = React.useState(0);
  const [statusMsg,     setStatusMsg]     = React.useState(null);
  const [alunoExpandido,setAlunoExpandido]= React.useState(null);
  const [turmasSel,     setTurmasSel]     = React.useState(null);
  const [novaTurmaNome, setNovaTurmaNome] = React.useState("");
  const [novaTurmaDesc, setNovaTurmaDesc] = React.useState("");
  const [erroTurma,     setErroTurma]     = React.useState("");
  const [emailConvite,  setEmailConvite]  = React.useState({});
  const [novaEscolaNome,setNovaEscolaNome]= React.useState("");
  const [erroEscola,    setErroEscola]    = React.useState("");
  const [criandoEscola, setCriandoEscola] = React.useState(false);
  const [novoNome,      setNovoNome]      = React.useState("");
  const [novoEmail,     setNovoEmail]     = React.useState("");
  const [erroAluno,     setErroAluno]     = React.useState("");
  const [novoAlunoNome, setNovoAlunoNome] = React.useState("");
  const [erroNovoAluno, setErroNovoAluno] = React.useState("");
  const [solEmailCoord, setSolEmailCoord] = React.useState("");
  const [solAlunoId,    setSolAlunoId]    = React.useState("");
  const [turmaPorSol,   setTurmaPorSol]  = React.useState({});

  const token         = authData?.session?.access_token;
  const perfil        = authData?.perfil;
  const isProfessor   = perfil?.tipo === "professor";
  const isCoordenacao = perfil?.tipo === "coordenacao";
  const isResponsavel = perfil?.tipo === "responsavel";

  const showStatus = (msg, tipo) => {
    setStatusMsg({ msg, tipo: tipo||"ok" });
    setTimeout(() => setStatusMsg(null), 2500);
  };

  // ── Carregamentos ───────────────────────────────────────
  const carregarAlunos = React.useCallback(async () => {
    if (!token) return;
    try {
      const data = await api("alunos?select=*,responsavel:responsavel_id(nome,email)&order=nome", token);
      setAlunos(data);
    } catch(e) { console.error(e); }
  }, [token]);

  const carregarEscolas = React.useCallback(async () => {
    if (!token || !isCoordenacao || !perfil) return;
    try {
      const v = await api(`escolas_coordenadores?coordenador_id=eq.${perfil.id}&select=escola:escola_id(id,nome)`, token);
      const lista = v.map(x => x.escola).filter(Boolean);
      setEscolas(lista);
      setEscolaAtualId(prev => {
        if (prev && lista.find(e => e.id === prev)) return prev;
        const salva = perfil.escola_atual_id && lista.find(e => e.id === perfil.escola_atual_id);
        if (salva) return salva.id;
        return lista[0] ? lista[0].id : null;
      });
    } catch(e) { console.error(e); }
  }, [token, isCoordenacao, perfil && perfil.id, perfil && perfil.escola_atual_id]);

  const carregarTurmas = React.useCallback(async () => {
    if (!token) return;
    try {
      const f = isCoordenacao && escolaAtualId
        ? `turmas?escola_id=eq.${escolaAtualId}&select=*&order=nome`
        : "turmas?select=*&order=nome";
      setTurmas(await api(f, token));
    } catch(e) { console.error(e); }
  }, [token, isCoordenacao, escolaAtualId]);

  const carregarTodasTurmas = React.useCallback(async () => {
    if (!token || !isCoordenacao) return;
    try { setTodasTurmas(await api("turmas?select=*,escola:escola_id(nome)&order=nome", token)); }
    catch(e) { console.error(e); }
  }, [token, isCoordenacao]);

  const carregarProfessores = React.useCallback(async () => {
    if (!token) return;
    try { setProfessores(await api("usuarios?tipo=eq.professor&order=nome&select=*,professores_turmas(turma_id)", token)); }
    catch(e) { console.error(e); }
  }, [token]);

  const carregarConvites = React.useCallback(async () => {
    if (!token) return;
    try { setConvites(await api("convites?select=*,turma:turma_id(nome)&order=created_at.desc", token)); }
    catch(e) { console.error(e); }
  }, [token]);

  const carregarSolicitacoes = React.useCallback(async () => {
    if (!token) return;
    try {
      const data = await api("solicitacoes?select=*,turma:turma_id(nome),escola:escola_id(nome),responsavel:responsavel_id(nome,email)&order=created_at.desc", token);
      setSolicitacoes(data);
      if (isCoordenacao) setNaoLidasAdmin(data.filter(s => s.status==="pendente").length);
    } catch(e) { console.error(e); }
  }, [token, isCoordenacao]);

  const contarNaoLidasChat = React.useCallback(async () => {
    if (!token || !perfil) return;
    try {
      const data = await api(`mensagens?select=id,lida_por,autor_id&autor_id=neq.${perfil.id}`, token);
      setNaoLidasChat(data.filter(m => !(m.lida_por||[]).includes(perfil.id)).length);
    } catch(e) {}
  }, [token, perfil]);

  React.useEffect(() => { if (token) { carregarAlunos(); contarNaoLidasChat(); } }, [token]);
  React.useEffect(() => { if (token && isCoordenacao) carregarEscolas(); }, [token, isCoordenacao]);
  React.useEffect(() => { if (token && isCoordenacao && escolaAtualId) { carregarTurmas(); carregarProfessores(); carregarSolicitacoes(); carregarTodasTurmas(); } }, [token, isCoordenacao, escolaAtualId]);
  React.useEffect(() => { if (token && isProfessor) carregarConvites(); }, [token, isProfessor]);
  React.useEffect(() => { if (token && isResponsavel) carregarSolicitacoes(); }, [token, isResponsavel]);

  // ── Ações ───────────────────────────────────────────────
  const sair = async () => {
    await sbAuth.signOut(token);
    setAuthData(null);
    setAlunos([]); setTurmas([]); setTodasTurmas([]); setEscolas([]);
    setEscolaAtualId(null); setProfessores([]); setConvites([]);
    setSolicitacoes([]); setNaoLidasChat(0); setNaoLidasAdmin(0);
    setModuloAtivo(null);
  };

  const trocarEscola = async (escolaId) => {
    setEscolaAtualId(escolaId);
    try {
      await api(`usuarios?id=eq.${perfil.id}`, token, { method:"PATCH", body:JSON.stringify({ escola_atual_id:escolaId }) });
      const [t1, t2] = await Promise.all([
        api(`turmas?escola_id=eq.${escolaId}&select=*&order=nome`, token),
        api("turmas?select=*,escola:escola_id(nome)&order=nome", token),
      ]);
      setTurmas(t1); setTodasTurmas(t2);
      await Promise.all([carregarSolicitacoes(), carregarAlunos()]);
    } catch(e) { console.error(e); }
  };

  const criarEscola = async () => {
    if (!novaEscolaNome.trim()) { setErroEscola("Digite o nome."); return; }
    setErroEscola("");
    try {
      const nova = await api("escolas", token, { method:"POST", body:JSON.stringify({ nome:novaEscolaNome.trim(), created_by:perfil.id }) });
      await api("escolas_coordenadores", token, { method:"POST", body:JSON.stringify({ escola_id:nova[0].id, coordenador_id:perfil.id }) });
      setNovaEscolaNome(""); setCriandoEscola(false);
      await carregarEscolas();
      await trocarEscola(nova[0].id);
      showStatus("✓ Escola criada");
    } catch(e) { setErroEscola("Erro: " + e.message.substring(0,60)); }
  };

  const removerEscola = async (id, nome) => {
    if (!window.confirm(`Apagar "${nome}"? As turmas serão removidas mas alunos permanecem.`)) return;
    try {
      await api(`escolas?id=eq.${id}`, token, { method:"DELETE", prefer:"" });
      await carregarEscolas(); await carregarAlunos();
      if (escolaAtualId === id) setEscolaAtualId(null);
      showStatus("✓ Escola removida");
    } catch(e) { showStatus("Erro", "erro"); }
  };

  const criarTurma = async () => {
    if (!novaTurmaNome.trim()) { setErroTurma("Digite o nome."); return; }
    if (!escolaAtualId) { setErroTurma("Selecione uma escola."); return; }
    setErroTurma("");
    try {
      const nova = await api("turmas", token, { method:"POST", body:JSON.stringify({ nome:novaTurmaNome.trim(), descricao:novaTurmaDesc.trim(), created_by:perfil.id, escola_id:escolaAtualId }) });
      if (nova?.[0] && !nova[0].escola_id) await api(`turmas?id=eq.${nova[0].id}`, token, { method:"PATCH", body:JSON.stringify({ escola_id:escolaAtualId }) });
      setNovaTurmaNome(""); setNovaTurmaDesc("");
      await carregarTurmas(); await carregarTodasTurmas();
      showStatus("✓ Turma criada");
    } catch(e) { setErroTurma("Erro: " + e.message.substring(0,80)); }
  };

  const removerTurma = async (id, nome) => {
    if (!window.confirm(`Apagar "${nome}"?`)) return;
    try {
      await api(`turmas?id=eq.${id}`, token, { method:"DELETE", prefer:"" });
      if (turmasSel === id) setTurmasSel(null);
      await carregarTurmas();
      showStatus("✓ Turma removida");
    } catch(e) { showStatus("Erro", "erro"); }
  };

  const enviarConvite = async (turmaId) => {
    const email = (emailConvite[turmaId]||"").trim();
    if (!email) { showStatus("Digite o email", "erro"); return; }
    try {
      const profs = await api(`usuarios?email=eq.${encodeURIComponent(email)}&tipo=eq.professor`, token);
      if (!profs.length) { showStatus("Professor não encontrado", "erro"); return; }
      const ex = await api(`convites?email=eq.${encodeURIComponent(email)}&turma_id=eq.${turmaId}&status=eq.pendente`, token);
      if (ex.length) { showStatus("Convite já enviado", "erro"); return; }
      await api("convites", token, { method:"POST", body:JSON.stringify({ turma_id:turmaId, email, created_by:perfil.id, escola_id:escolaAtualId }) });
      setEmailConvite(prev => ({ ...prev, [turmaId]:"" }));
      await carregarConvites();
      showStatus("✓ Convite enviado");
    } catch(e) { showStatus("Erro", "erro"); }
  };

  const responderConvite = async (conviteId, turmaId, aceitar) => {
    try {
      await api(`convites?id=eq.${conviteId}`, token, { method:"PATCH", body:JSON.stringify({ status:aceitar?"aceito":"recusado" }) });
      if (aceitar) {
        await api("professores_turmas", token, { method:"POST", prefer:"", body:JSON.stringify({ professor_id:perfil.id, turma_id:turmaId }) });
        await carregarConvites(); await carregarAlunos();
        showStatus("✓ Aceito! Saindo para atualizar...");
        setTimeout(async () => { await sbAuth.signOut(token); setAuthData(null); }, 2500);
      } else {
        await carregarConvites(); showStatus("Convite recusado");
      }
    } catch(e) { showStatus("Erro", "erro"); }
  };

  const criarAlunoResponsavel = async () => {
    if (!novoAlunoNome.trim()) { setErroNovoAluno("Digite o nome."); return; }
    setErroNovoAluno("");
    try {
      await api("alunos", token, { method:"POST", body:JSON.stringify({ nome:novoAlunoNome.trim(), responsavel_id:perfil.id }) });
      setNovoAlunoNome("");
      await carregarAlunos();
      showStatus("✓ Aluno cadastrado");
    } catch(e) { setErroNovoAluno("Erro."); }
  };

  const solicitarEntrada = async () => {
    if (!solEmailCoord.trim()) { showStatus("Digite o email da coordenação", "erro"); return; }
    if (!solAlunoId) { showStatus("Selecione o aluno", "erro"); return; }
    try {
      const coords = await api(`usuarios?email=eq.${encodeURIComponent(solEmailCoord.trim())}&tipo=eq.coordenacao`, token);
      if (!coords.length) { showStatus("Coordenação não encontrada", "erro"); return; }
      const coordEscolaId = coords[0].escola_atual_id;
      if (!coordEscolaId) { showStatus("Coordenação sem escola configurada", "erro"); return; }
      const ex = await api(`solicitacoes?aluno_id=eq.${solAlunoId}&status=eq.pendente`, token);
      if (ex.length) { showStatus("Solicitação já enviada", "erro"); return; }
      await api("solicitacoes", token, { method:"POST", body:JSON.stringify({ responsavel_id:perfil.id, aluno_id:solAlunoId, escola_id:coordEscolaId }) });
      setSolEmailCoord(""); setSolAlunoId("");
      await carregarSolicitacoes();
      showStatus("✓ Solicitação enviada");
    } catch(e) { showStatus("Erro: " + (e.message||"").substring(0,60), "erro"); }
  };

  const responderSolicitacao = async (sol, aprovar, turmaId) => {
    try {
      if (aprovar && !turmaId) { showStatus("Selecione uma turma", "erro"); return; }
      await api(`solicitacoes?id=eq.${sol.id}`, token, { method:"PATCH", body:JSON.stringify({ status:aprovar?"aprovado":"rejeitado", turma_id:aprovar?turmaId:null }) });
      if (aprovar && sol.aluno_id) {
        const te = todasTurmas.find(t => t.id === turmaId);
        await api(`alunos?id=eq.${sol.aluno_id}`, token, { method:"PATCH", body:JSON.stringify({ turma_id:turmaId, escola_id:te?.escola_id||sol.escola_id }) });
        await carregarAlunos();
      }
      await carregarSolicitacoes();
      showStatus(aprovar ? "✓ Aprovado" : "Rejeitado");
    } catch(e) { showStatus("Erro", "erro"); }
  };

  const vincularAlunoTurma = async (alunoId, turmaId) => {
    try {
      const te = turmaId ? todasTurmas.find(t => t.id === turmaId) : null;
      const body = turmaId ? { turma_id:turmaId, escola_id:te?.escola_id||escolaAtualId } : { turma_id:null };
      await api(`alunos?id=eq.${alunoId}`, token, { method:"PATCH", body:JSON.stringify(body) });
      await carregarAlunos();
      showStatus(turmaId ? "✓ Vinculado" : "✓ Removido");
    } catch(e) { showStatus("Erro", "erro"); }
  };

  const removerAluno = async (id, nome) => {
    if (!window.confirm(`Apagar "${nome}"? Todos os dados serão perdidos.`)) return;
    try {
      await api(`alunos?id=eq.${id}`, token, { method:"DELETE", prefer:"" });
      await carregarAlunos();
      showStatus("✓ Removido");
    } catch(e) { showStatus("Erro", "erro"); }
  };

  const salvarPerfilSeguranca = async (alunoId, dados) => {
    try {
      const at = await api(`alunos?id=eq.${alunoId}`, token, { method:"PATCH", body:JSON.stringify(dados) });
      if (at?.[0]) setAlunos(prev => prev.map(a => a.id===alunoId ? {...a,...at[0]} : a));
      showStatus("✓ Salvo");
    } catch(e) { showStatus("Erro", "erro"); throw e; }
  };

  const removerProfessorDaTurma = async (professorId, turmaId) => {
    try {
      await api(`professores_turmas?professor_id=eq.${professorId}&turma_id=eq.${turmaId}`, token, { method:"DELETE", prefer:"" });
      await carregarProfessores();
      showStatus("✓ Professor removido");
    } catch(e) { showStatus("Erro", "erro"); }
  };

  const adicionarAluno = async () => {
    if (!novoNome.trim()) { setErroAluno("Digite o nome."); return; }
    setErroAluno("");
    let responsavel_id = null;
    if (novoEmail.trim()) {
      const resp = await api(`usuarios?email=eq.${encodeURIComponent(novoEmail.trim())}&tipo=eq.responsavel`, token);
      if (!resp.length) { setErroAluno("Responsável não encontrado."); return; }
      responsavel_id = resp[0].id;
    }
    try {
      await api("alunos", token, { method:"POST", body:JSON.stringify({ nome:novoNome.trim(), responsavel_id }) });
      setNovoNome(""); setNovoEmail("");
      await carregarAlunos();
      showStatus("✓ Aluno adicionado");
    } catch(e) { showStatus("Erro", "erro"); }
  };

  const escolaAtual = escolas.find(e => e.id === escolaAtualId);
  const convitesPendentes = convites.filter(c => c.status === "pendente").length;
  const labelPerfil = isProfessor ? "👩‍🏫 Professor" : isCoordenacao ? "🏫 Coordenação" : "👨‍👩‍👧 Responsável";

  if (!authData) return <TelaLogin onLogin={setAuthData} />;

  // ── Módulos ativos ─────────────────────────────────────
  if (moduloAtivo === "agenda") return (
    <div className="page">
      <PageHeader titulo="📋 Agenda" onVoltar={() => setModuloAtivo(null)} />
      <ModuloAgenda token={token} alunos={alunos} isProfessor={isProfessor} />
    </div>
  );

  if (moduloAtivo === "chegando") return (
    <div className="page">
      <PageHeader titulo="🚗 Chegando" onVoltar={() => setModuloAtivo(null)} />
      <ModuloChegando token={token} alunos={alunos} isProfessor={isProfessor} isResponsavel={isResponsavel} />
    </div>
  );

  if (moduloAtivo === "cardapio") return (
    <div className="page">
      <PageHeader titulo="🍽 Cardápio" onVoltar={() => setModuloAtivo(null)} />
      <ModuloCardapio token={token} perfil={perfil} escolaAtualId={escolaAtualId} isCoordenacao={isCoordenacao} />
    </div>
  );

  if (moduloAtivo === "circulares") return (
    <div className="page">
      <PageHeader titulo="📄 Circulares" onVoltar={() => setModuloAtivo(null)} />
      <ModuloCirculares token={token} perfil={perfil} escolaAtualId={escolaAtualId} isCoordenacao={isCoordenacao} />
    </div>
  );

  if (moduloAtivo === "recados" || moduloAtivo === "chat") return (
    <div className="page" style={{ display:"flex", flexDirection:"column" }}>
      <PageHeader titulo="💬 Recados" onVoltar={() => { setModuloAtivo(null); contarNaoLidasChat(); }} />
      <ModuloRecados token={token} perfil={perfil} alunos={alunos} />
    </div>
  );

  // ── Tela de Turmas ─────────────────────────────────────
  if (moduloAtivo === "turmas") return (
    <div className="page">
      <PageHeader titulo="🏫 Turmas" onVoltar={() => setModuloAtivo(null)}>
        {statusMsg && <div className={`status-badge ${statusMsg.tipo==="erro"?"status-erro":"status-ok"}`} style={{ background:statusMsg.tipo==="erro"?"#FEE2E2":"#D1FAE5", color:statusMsg.tipo==="erro"?"#E76F86":"#065F46" }}>{statusMsg.msg}</div>}
      </PageHeader>
      <div className="content" style={{ paddingTop:16 }}>
        {isCoordenacao && (
          <div>
            {/* Escolas */}
            <div className="card-mb">
              <div className="row-between" style={{ marginBottom:criandoEscola||escolas.length>0?14:0 }}>
                <div style={{ fontWeight:800, fontSize:15 }}>🏫 Minhas Escolas ({escolas.length})</div>
                {!criandoEscola && <button onClick={() => setCriandoEscola(true)} style={{ background:"#E0F7FF", border:"2px solid rgba(56,189,248,0.3)", borderRadius:10, padding:"6px 14px", color:"#0369A1", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Nova</button>}
              </div>
              {criandoEscola && (
                <div>
                  <Input label="Nome da escola" value={novaEscolaNome} onChange={e => { setNovaEscolaNome(e.target.value); setErroEscola(""); }} placeholder="Ex: Colégio Pequeno Príncipe" error={erroEscola} />
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn variant="ghost" onClick={() => { setCriandoEscola(false); setNovaEscolaNome(""); }} style={{ flex:1 }}>Cancelar</Btn>
                    <Btn variant="green" onClick={criarEscola} style={{ flex:1 }}>Criar</Btn>
                  </div>
                </div>
              )}
              {escolas.map(e => (
                <div key={e.id} className="row-between" style={{ padding:"8px 0", borderBottom:"1px solid #F1F5F9" }}>
                  <button onClick={() => trocarEscola(e.id)} style={{ flex:1, textAlign:"left", background:escolaAtualId===e.id?"#E0F7FF":"transparent", border:"none", borderRadius:10, padding:"8px 12px", fontWeight:700, fontSize:13, color:escolaAtualId===e.id?"#0369A1":"#1E293B", cursor:"pointer" }}>
                    🏫 {e.nome} {escolaAtualId===e.id&&"✓"}
                  </button>
                  <button onClick={() => removerEscola(e.id, e.nome)} className="btn btn-danger btn-small">✕</button>
                </div>
              ))}
            </div>

            {/* Solicitações pendentes */}
            {solicitacoes.filter(s => s.status==="pendente").length > 0 && (
              <div className="alert-warning">
                <div style={{ fontWeight:800, fontSize:15, marginBottom:12, color:"#EA580C" }}>⏳ Solicitações pendentes</div>
                {solicitacoes.filter(s => s.status==="pendente").map(sol => {
                  const alunoSol = alunos.find(a => a.id === sol.aluno_id);
                  return (
                    <div key={sol.id} style={{ padding:"12px 0", borderBottom:"1px solid #F1F5F9" }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{alunoSol?.nome || "Aluno"}</div>
                      <div style={{ fontSize:12, color:"#94A3B8", marginTop:2, marginBottom:10 }}>Resp: {sol.responsavel?.nome} ({sol.responsavel?.email})</div>
                      <select value={turmaPorSol[sol.id]||""} onChange={e => setTurmaPorSol(prev=>({...prev,[sol.id]:e.target.value}))} className="select" style={{ marginBottom:10 }}>
                        <option value="">Escolha uma turma...</option>
                        {todasTurmas.map(t => <option key={t.id} value={t.id}>{t.escola?.nome?`${t.escola.nome} — `:""}{t.nome}</option>)}
                      </select>
                      <div style={{ display:"flex", gap:8 }}>
                        <Btn variant="green" onClick={() => responderSolicitacao(sol, true, turmaPorSol[sol.id])} style={{ flex:1, padding:"9px" }}>✅ Aprovar</Btn>
                        <Btn variant="danger" onClick={() => responderSolicitacao(sol, false)} style={{ flex:1, padding:"9px" }}>❌ Rejeitar</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nova turma */}
            <div className="card-mb">
              <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>📚 Nova Turma</div>
              <Input label="Nome" value={novaTurmaNome} onChange={e => { setNovaTurmaNome(e.target.value); setErroTurma(""); }} placeholder="Ex: Maternal B" error={erroTurma} />
              <Input label="Descrição (opcional)" value={novaTurmaDesc} onChange={e => setNovaTurmaDesc(e.target.value)} placeholder="Ex: Turma da manhã" />
              <Btn variant="green" onClick={criarTurma}>Criar Turma</Btn>
            </div>

            {/* Lista turmas */}
            {turmas.map(t => {
              const aberta = turmasSel === t.id;
              const alunosDaTurma = alunos.filter(a => a.turma_id === t.id);
              const profsDaTurma = professores.filter(p => p.professores_turmas?.some(pt => pt.turma_id === t.id));
              const convitesDaTurma = convites.filter(c => c.turma_id === t.id && c.status==="pendente");
              return (
                <div key={t.id} className="card-mb" style={{ padding:0, overflow:"hidden" }}>
                  <button onClick={() => setTurmasSel(aberta?null:t.id)}
                    style={{ width:"100%", background:"none", border:"none", padding:"16px 18px", display:"flex", alignItems:"center", cursor:"pointer", gap:12 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:"#E0F7FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🏫</div>
                    <div style={{ flex:1, textAlign:"left" }}>
                      <div style={{ fontWeight:800, fontSize:15 }}>{t.nome}</div>
                      {t.descricao && <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{t.descricao}</div>}
                      <div className="row" style={{ fontSize:12, fontWeight:600, marginTop:4, gap:12 }}>
                        <span style={{ color:"#38BDF8" }}>👥 {alunosDaTurma.length}</span>
                        <span style={{ color:profsDaTurma.length>0?"#4CAF8A":"#F4A261" }}>👩‍🏫 {profsDaTurma.length>0?`${profsDaTurma.length} prof.`:"Sem professor"}</span>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removerTurma(t.id,t.nome); }} className="btn btn-danger btn-small">✕</button>
                  </button>
                  {aberta && (
                    <div style={{ padding:"0 18px 18px", borderTop:"1px solid #F1F5F9" }}>
                      <div style={{ marginTop:14, marginBottom:14 }}>
                        <div className="input-label" style={{ marginBottom:10 }}>👩‍🏫 Professores</div>
                        {profsDaTurma.map(p => (
                          <div key={p.id} className="row" style={{ background:"#F0FFF4", borderRadius:12, padding:"10px 14px", marginBottom:8 }}>
                            <div className="avatar avatar-sm" style={{ background:"#4CAF8A" }}>{p.nome[0]}</div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700, fontSize:13 }}>{p.nome}</div>
                              <div style={{ fontSize:12, color:"#94A3B8" }}>{p.email}</div>
                            </div>
                            <button onClick={() => removerProfessorDaTurma(p.id, t.id)} className="btn btn-danger btn-small">Remover</button>
                          </div>
                        ))}
                        {convitesDaTurma.length > 0 && <div style={{ fontSize:13, color:"#F4A261", fontWeight:600, marginBottom:8 }}>⏳ Pendente: {convitesDaTurma.map(c=>c.email).join(", ")}</div>}
                        <div className="row">
                          <input value={emailConvite[t.id]||""} onChange={e => setEmailConvite(prev=>({...prev,[t.id]:e.target.value}))} placeholder="Email do professor..." className="input" style={{ flex:1 }} />
                          <button onClick={() => enviarConvite(t.id)} style={{ background:"linear-gradient(135deg,#4CAF8A,#3A9B7A)", border:"none", borderRadius:12, color:"white", padding:"0 16px", height:44, cursor:"pointer", fontWeight:700, fontSize:13, flexShrink:0 }}>Convidar</button>
                        </div>
                      </div>
                      <div style={{ borderTop:"1px solid #F1F5F9", paddingTop:14 }}>
                        <div className="input-label" style={{ marginBottom:10 }}>👥 Alunos ({alunosDaTurma.length})</div>
                        {alunosDaTurma.map(a => (
                          <div key={a.id} className="row" style={{ padding:"8px 0", borderBottom:"1px solid #F8FAFC", flexWrap:"wrap", gap:8 }}>
                            <div className="avatar avatar-sm" style={{ background:"#38BDF8" }}>{a.nome[0]}</div>
                            <div style={{ flex:1, fontSize:13, fontWeight:600, minWidth:80 }}>{a.nome}</div>
                            <select value="" onChange={e => { if(e.target.value) vincularAlunoTurma(a.id, e.target.value); }} style={{ border:"2px solid #E2E8F0", borderRadius:8, padding:"5px 8px", fontSize:11, background:"#F8FAFC", fontFamily:"inherit" }}>
                              <option value="">Mover para...</option>
                              {todasTurmas.map(tm => <option key={tm.id} value={tm.id}>{tm.escola?.nome?`${tm.escola.nome} — `:""}{tm.nome}</option>)}
                            </select>
                            <button onClick={() => vincularAlunoTurma(a.id,null)} className="btn btn-danger btn-small">Remover</button>
                          </div>
                        ))}
                        {alunosDaTurma.length===0 && <div style={{ fontSize:13, color:"#94A3B8" }}>Aguardando solicitações.</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Professor: convites */}
        {isProfessor && (
          <div>
            {convites.length === 0
              ? <div className="empty"><div className="empty-icon">📩</div><div className="empty-text">Nenhum convite recebido.</div></div>
              : convites.map(c => (
                <div key={c.id} className="card-mb" style={{ border:c.status==="pendente"?"2px solid rgba(56,189,248,0.3)":"2px solid #E2E8F0" }}>
                  <div className="row" style={{ marginBottom:c.status==="pendente"?14:0 }}>
                    <div style={{ fontSize:28 }}>🏫</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:15 }}>{c.turma?.nome}</div>
                      <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{c.status==="pendente"?"Aguardando":c.status==="aceito"?"✅ Aceito":"❌ Recusado"}</div>
                    </div>
                  </div>
                  {c.status==="pendente" && (
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn variant="green" onClick={() => responderConvite(c.id, c.turma_id, true)} style={{ flex:1, padding:"9px" }}>✅ Aceitar</Btn>
                      <Btn variant="danger" onClick={() => responderConvite(c.id, c.turma_id, false)} style={{ flex:1, padding:"9px" }}>❌ Recusar</Btn>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* Responsável: solicitar vaga */}
        {isResponsavel && (
          <div>
            <div className="card-mb">
              <div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>👶 Meus Filhos</div>
              <div style={{ fontSize:13, color:"#94A3B8", marginBottom:14 }}>Cadastre o filho e solicite a vaga.</div>
              <div className="row" style={{ marginBottom:14 }}>
                <input value={novoAlunoNome} onChange={e => { setNovoAlunoNome(e.target.value); setErroNovoAluno(""); }}
                  placeholder="Nome completo do filho(a)" className={`input ${erroNovoAluno?"input-error":""}`} style={{ flex:1 }} />
                <button onClick={criarAlunoResponsavel} style={{ background:"linear-gradient(135deg,#4CAF8A,#3A9B7A)", border:"none", borderRadius:12, color:"white", padding:"0 18px", height:46, cursor:"pointer", fontWeight:700, fontSize:16, flexShrink:0 }}>+</button>
              </div>
              {erroNovoAluno && <div className="error-msg" style={{ marginBottom:8 }}>{erroNovoAluno}</div>}
              {alunos.map(a => (
                <div key={a.id} className="row" style={{ padding:"10px 0", borderTop:"1px solid #F1F5F9" }}>
                  <div className="avatar avatar-sm" style={{ background:"#4CAF8A" }}>{a.nome[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{a.nome}</div>
                    <div style={{ fontSize:12, color:a.turma_id?"#4CAF8A":"#94A3B8" }}>{a.turma_id?"✅ Vinculado":"Sem turma"}</div>
                  </div>
                  {!a.turma_id && <button onClick={() => removerAluno(a.id, a.nome)} className="btn btn-danger btn-small">✕</button>}
                </div>
              ))}
            </div>
            <div className="card-mb">
              <div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>📋 Solicitar Vaga</div>
              {alunos.filter(a => !a.turma_id && !solicitacoes.find(s => s.aluno_id===a.id && s.status==="pendente")).length === 0
                ? <div className="alert-success">{alunos.length===0?"Cadastre um filho acima.":"✅ Todos já vinculados ou com solicitação pendente."}</div>
                : (
                  <div>
                    <div className="input-label" style={{ marginBottom:8 }}>Selecionar filho</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                      {alunos.filter(a => !a.turma_id && !solicitacoes.find(s => s.aluno_id===a.id && s.status==="pendente")).map(a => (
                        <button key={a.id} onClick={() => setSolAlunoId(a.id)}
                          className={`chip ${solAlunoId===a.id?"chip-active":"chip-inactive"}`}
                          style={{ background:solAlunoId===a.id?"#4CAF8A":undefined }}>
                          {a.nome}
                        </button>
                      ))}
                    </div>
                    <Input label="Email da coordenação" type="email" value={solEmailCoord} onChange={e => setSolEmailCoord(e.target.value)} placeholder="coordenacao@escola.com" />
                    <Btn variant="green" onClick={solicitarEntrada} disabled={!solAlunoId||!solEmailCoord.trim()}>Enviar Solicitação</Btn>
                  </div>
                )
              }
            </div>
            {solicitacoes.length > 0 && (
              <div className="card-mb">
                <div style={{ fontWeight:800, fontSize:15, marginBottom:12 }}>📬 Minhas Solicitações</div>
                {solicitacoes.map(s => {
                  const alunoSol = alunos.find(a => a.id === s.aluno_id);
                  return (
                    <div key={s.id} className="row" style={{ padding:"12px 0", borderBottom:"1px solid #F1F5F9" }}>
                      <div style={{ fontSize:24 }}>{s.status==="aprovado"?"✅":s.status==="rejeitado"?"❌":"⏳"}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>{alunoSol?.nome||"Aluno"}</div>
                        <div style={{ fontSize:12, color:"#94A3B8" }}>{s.status==="pendente"?"Aguardando":s.status==="aprovado"?"Aprovado":"Não aprovado"}</div>
                      </div>
                      <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", color:s.status==="aprovado"?"#4CAF8A":s.status==="rejeitado"?"#E76F86":"#F4A261" }}>{s.status}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Tela de Alunos ─────────────────────────────────────
  if (moduloAtivo === "alunos") return (
    <div className="page">
      <PageHeader titulo="👥 Alunos" onVoltar={() => setModuloAtivo(null)}>
        {statusMsg && <div style={{ background:statusMsg.tipo==="erro"?"#FEE2E2":"#D1FAE5", borderRadius:10, padding:"5px 12px", fontSize:12, fontWeight:700, color:statusMsg.tipo==="erro"?"#E76F86":"#065F46" }}>{statusMsg.msg}</div>}
      </PageHeader>
      <div className="content" style={{ paddingTop:16 }}>
        {isProfessor && (
          <div className="card-mb">
            <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>➕ Adicionar Aluno</div>
            <Input label="Nome do aluno" value={novoNome} onChange={e => { setNovoNome(e.target.value); setErroAluno(""); }} placeholder="Ex: Maria Clara" error={erroAluno} />
            <Input label="Email do responsável (opcional)" type="email" value={novoEmail} onChange={e => setNovoEmail(e.target.value)} placeholder="responsavel@email.com" />
            <Btn variant="green" onClick={adicionarAluno}>Adicionar</Btn>
          </div>
        )}
        {isCoordenacao && alunos.filter(a => !a.turma_id).length > 0 && (
          <div className="alert-warning">
            <div style={{ fontWeight:800, fontSize:15, marginBottom:8, color:"#EA580C" }}>⚠️ Sem turma ({alunos.filter(a=>!a.turma_id).length})</div>
            {alunos.filter(a => !a.turma_id).map(a => (
              <div key={a.id} className="row" style={{ padding:"10px 0", borderBottom:"1px solid #F1F5F9", flexWrap:"wrap", gap:8 }}>
                <div className="avatar avatar-sm" style={{ background:"#F4A261" }}>{a.nome[0]}</div>
                <div style={{ flex:1, fontSize:14, fontWeight:600, minWidth:80 }}>{a.nome}</div>
                <select value="" onChange={e => { if(e.target.value) vincularAlunoTurma(a.id,e.target.value); }} style={{ border:"2px solid #E2E8F0", borderRadius:10, padding:"6px 10px", fontSize:12, background:"#F8FAFC", fontFamily:"inherit" }}>
                  <option value="">Vincular à turma...</option>
                  {todasTurmas.map(t => <option key={t.id} value={t.id}>{t.escola?.nome?`${t.escola.nome} — `:""}{t.nome}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
        <div className="card">
          <div style={{ fontWeight:800, fontSize:15, marginBottom:12 }}>👥 Turma ({alunos.filter(a=>a.turma_id).length})</div>
          {alunos.filter(a=>a.turma_id).length===0 && <div className="empty" style={{ padding:"16px 0" }}>Nenhum aluno na turma.</div>}
          {alunos.filter(a=>a.turma_id).map(a => {
            const expandido = alunoExpandido === a.id;
            return (
              <div key={a.id} style={{ borderBottom:"1px solid #F1F5F9", padding:"12px 0" }}>
                <div className="row">
                  <div className="avatar avatar-md" style={{ background:"#38BDF8", marginRight:4 }}>{a.nome[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{a.nome}</div>
                    {a.responsavel?.nome && <div style={{ fontSize:12, color:"#94A3B8", marginTop:1 }}>Resp: {a.responsavel.nome}</div>}
                  </div>
                  <button onClick={() => setAlunoExpandido(expandido?null:a.id)} style={{ background:"#F1F5F9", border:"none", borderRadius:8, color:"#64748B", padding:"5px 10px", cursor:"pointer", fontWeight:700, fontSize:12, marginRight:6 }}>
                    {expandido?"▲":"🛟"}
                  </button>
                  {isCoordenacao && <button onClick={() => removerAluno(a.id,a.nome)} className="btn btn-danger btn-small">✕</button>}
                </div>
                {expandido && (
                  <PerfilSeguranca aluno={a} podeEditar={isResponsavel} onSalvar={(dados) => salvarPerfilSeguranca(a.id, dados)} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Dashboard ───────────────────────────────────────────
  return (
    <div className="page">
      <div className="header-blue">
        <div className="row-between" style={{ marginBottom:4 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, opacity:0.8, textTransform:"uppercase" }}>{labelPerfil}</div>
            <div style={{ fontSize:22, fontWeight:800, marginTop:2 }}>{perfil?.nome}</div>
            {escolaAtual && (
              isCoordenacao && escolas.length > 1
                ? <select value={escolaAtualId||""} onChange={e => trocarEscola(e.target.value)}
                    style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, color:"white", padding:"4px 10px", fontSize:12, fontWeight:700, cursor:"pointer", marginTop:4, fontFamily:"inherit" }}>
                    {escolas.map(e => <option key={e.id} value={e.id} style={{ color:"#1E293B" }}>🏫 {e.nome}</option>)}
                  </select>
                : <div style={{ fontSize:12, fontWeight:700, opacity:0.85, marginTop:4 }}>🏫 {escolaAtual.nome}</div>
            )}
          </div>
          <div className="row">
            {statusMsg && <div className="status-badge" style={{ background:statusMsg.tipo==="erro"?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.2)" }}>{statusMsg.msg}</div>}
            <button onClick={sair} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, color:"white", padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:700 }}>Sair</button>
          </div>
        </div>
      </div>

      <div className="content-narrow" style={{ paddingTop:20 }}>
        <div style={{ marginBottom:24 }}>
          <div className="section-title"><span>💬</span><h2>Comunicação</h2></div>
          <div className="grid-3">
            <ModuloCard modulo={MODULOS_COMUNICACAO[0]} badge={naoLidasChat} onClick={() => setModuloAtivo("recados")} />
            <ModuloCard modulo={MODULOS_COMUNICACAO[1]} onClick={() => setModuloAtivo("circulares")} />
            <ModuloCard modulo={MODULOS_COMUNICACAO[2]} onClick={() => setModuloAtivo("cardapio")} />
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <div className="section-title"><span>📋</span><h2>Diário</h2></div>
          <div className="grid-3">
            <ModuloCard modulo={MODULOS_DIARIO[0]} onClick={() => setModuloAtivo("agenda")} />
            <ModuloCard modulo={MODULOS_DIARIO[1]} onClick={() => setModuloAtivo("chegando")} />
            <ModuloCard modulo={MODULOS_DIARIO[2]} badge={(isCoordenacao?naoLidasAdmin:0)+convitesPendentes} onClick={() => setModuloAtivo("turmas")} />
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <div className="section-title"><span>⚙️</span><h2>Administração</h2></div>
          <div className="grid-2">
            <ModuloCard modulo={MODULOS_ADMIN[0]} onClick={() => setModuloAtivo("alunos")} />
            <ModuloCard modulo={MODULOS_ADMIN[1]} badge={naoLidasChat} onClick={() => setModuloAtivo("chat")} />
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
