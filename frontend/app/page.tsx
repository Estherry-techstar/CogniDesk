"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowUpRight, Bot, BookOpen, CheckCircle2, Clock3,
  FileText, Headphones, Home, Menu, MessageCircle, Plus, Search,
  Send, Settings, ShieldCheck, Sparkles, Ticket, UserRound, Wifi, X, KeyRound, Mail, LogOut
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

const suggestions = [
  { title: "Reset my password", description: "Account access and sign-in", icon: KeyRound },
  { title: "Fix my VPN connection", description: "Network and remote access", icon: Wifi },
  { title: "Outlook is not syncing", description: "Email and Microsoft 365", icon: Mail },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketMessage, setTicketMessage] = useState("");
  
  const [ticket, setTicket] = useState({
    title: "",
    description: "",
    category: "Account & access",
    priority: "medium",
    email: "staff@acmecorp.com"
  });

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("cognidesk_token");
    const role = localStorage.getItem("cognidesk_role");
    if (!token || role !== "staff") {
      router.push("/login");
    }
  }, [router]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("cognidesk_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  async function sendMessage(text = input) {
    const question = text.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: question }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ question: question }),
      });
      
      if (!response.ok) throw new Error("Backend failed to respond");
      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setError("Unable to connect to CogniDesk. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  function openTicket() {
    const lastQuestion = [...messages].reverse().find((m) => m.role === "user");
    setTicket((prev) => ({
      ...prev,
      title: lastQuestion?.content || "New Issue",
      description: messages.map(m => `${m.role}: ${m.content}`).join("\n\n"),
    }));
    setTicketMessage("");
    setTicketOpen(true);
  }

  async function submitTicket(event: React.FormEvent) {
    event.preventDefault();
    setTicketLoading(true);
    setTicketMessage("");
    try {
      const response = await fetch("http://localhost:8000/api/v1/tickets", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_email: ticket.email,
          issue_description: `${ticket.title}\n\n${ticket.description}`
        }),
      });
      
      if (!response.ok) throw new Error("Ticket creation failed");
      setTicketMessage("Ticket created successfully. An engineer will be with you shortly.");
    } catch (err) {
      setTicketMessage("Ticket submission failed. Please try again.");
    } finally {
      setTicketLoading(false);
    }
  }

  function newChat() {
    setMessages([]);
    setInput("");
    setError("");
  }

  const handleSignOut = () => {
    localStorage.removeItem("cognidesk_token");
    localStorage.removeItem("cognidesk_role");
    router.push("/login");
  };

  return (
    <div className="app-shell">
      {mobileMenu && <button className="mobile-overlay" onClick={() => setMobileMenu(false)} />}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Bot size={27} /></div>
          <div><h2>CogniDesk</h2><p>IT Help Desk Assistant</p></div>
          <button className="mobile-close" onClick={() => setMobileMenu(false)}><X size={19} /></button>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="nav-links">
          <button className="nav-link active"><Home size={18} /> Home</button>
          <button className="nav-link" onClick={newChat}><MessageCircle size={18} /> New Chat</button>
          <button className="nav-link"><BookOpen size={18} /> Knowledge Base</button>
          <button className="nav-link" onClick={openTicket}><Ticket size={18} /> My Tickets</button>
          <a href="/dashboard" className="nav-link" style={{ textDecoration: 'none' }}>
            <UserRound size={18} /> Engineers Dashboard
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="online-dot" />
            <div><strong>AI assistant ready</strong><small>RAG · Human-in-the-Loop</small></div>
            <Activity size={16} />
          </div>
          <button className="nav-link"><Settings size={18} /> Settings</button>
          <button className="nav-link" onClick={handleSignOut} style={{ color: '#f87171' }}>
            <LogOut size={18} /> Sign Out
          </button>
          <div className="sidebar-tagline">
            <Sparkles size={19} />
            <div><strong>Smarter support.</strong><small>Faster solutions.</small></div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)}><Menu size={21} /></button>
          <div className="search-bar">
            <Search size={17} />
            <input aria-label="Search help" placeholder="Search IT help and policies..." />
          </div>
          <div className="user-profile">
            <div className="avatar">EN</div>
            <div className="profile-info"><strong>IT Support User</strong><small>CogniDesk workspace</small></div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome">
            <div className="welcome-icon"><Bot size={35} /></div>
            <div className="welcome-text">
              <span className="eyebrow">YOUR AI IT ASSISTANT</span>
              <h1>{messages.length ? "Let's solve this together." : "Hi there, how can I help?"}</h1>
              <p>Ask me about IT support, troubleshooting, or company policies. I'll search your internal knowledge base and provide cited answers.</p>
            </div>
            <div className="trust-badge"><ShieldCheck size={16} /> Grounded answers</div>
          </section>

          <section className="feature-strip">
            <span><BookOpen size={15} /> Internal IT documents</span>
            <span><Sparkles size={15} /> AI-powered answers</span>
            <span><ShieldCheck size={15} /> Cited sources</span>
            <span><Headphones size={15} /> Human escalation</span>
          </section>

          <div className="dashboard-grid">
            <section className="chat-panel">
              <div className="panel-header">
                <div><h3>IT Support Assistant</h3><p>Answers based on your internal knowledge base</p></div>
                <button className="secondary-button" onClick={newChat}><Plus size={15} /> New chat</button>
              </div>

              <div className="conversation">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Sparkles size={25} /></div>
                    <h2>What can I help you with?</h2>
                    <p>Describe your issue in your own words. I'll look for a relevant answer in your organisation's IT documents.</p>
                    <div className="suggestion-grid">
                      {suggestions.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button key={item.title} className="suggestion-card" onClick={() => sendMessage(item.title)}>
                            <Icon size={19} />
                            <span><strong>{item.title}</strong><small>{item.description}</small></span>
                            <ArrowUpRight size={15} />
                          </button>
                        );
                      })}
                    </div>
                    <div className="privacy-note"><ShieldCheck size={15} /> Always verify important actions against your IT team's guidance.</div>
                  </div>
                ) : (
                  <div className="message-list">
                    {messages.map((message) => (
                      <div key={message.id} className={`message-row ${message.role}`}>
                        {message.role === "assistant" && <div className="message-avatar"><Bot size={18} /></div>}
                        <div className="message-content">
                          <div className="message-author">{message.role === "assistant" ? "CogniDesk AI" : "You"}</div>
                          <div className="message-bubble">
                            {message.content}
                            {message.role === "assistant" && !!message.sources?.length && (
                              <div className="sources">
                                <strong><FileText size={14} /> Sources</strong>
                                {message.sources.map((source, index) => (
                                  <div key={index} className="source-item">
                                    <FileText size={15} />
                                    <span>{source}<small>Internal IT document</small></span>
                                    <ArrowUpRight size={14} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {loading && <div className="loading-message"><span className="spinner" /> Searching your knowledge base...</div>}
                  </div>
                )}
              </div>

              {error && <div className="error-message">{error}<button onClick={() => setError("")}><X size={15} /></button></div>}

              <div className="escalation-banner">
                <div className="escalation-icon"><Headphones size={19} /></div>
                <div><strong>Still stuck?</strong><p>Send the issue and conversation context to your IT support team.</p></div>
                <button onClick={openTicket}>Create ticket <ArrowUpRight size={14} /></button>
              </div>

              <form className="message-composer" onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe your IT issue..." disabled={loading} />
                <button type="submit" disabled={loading || !input.trim()}><Send size={17} /></button>
              </form>
              <p className="disclaimer">CogniDesk can make mistakes. Verify important actions with your IT team.</p>
            </section>

            <aside className="right-column">
              <section className="side-panel">
                <div className="side-heading"><BookOpen size={19} /><h3>Knowledge base</h3></div>
                <p className="side-description">Explore common IT support topics.</p>
                {["Password & account access", "Microsoft 365 troubleshooting", "VPN & network access"].map((title) => (
                  <button key={title} className="knowledge-item" onClick={() => void sendMessage(`Help me with ${title.toLowerCase()}`)}>
                    <FileText size={18} /><span>{title}</span><ArrowUpRight size={14} />
                  </button>
                ))}
                <div className="side-divider" />
                <div className="support-card">
                  <div className="support-card-heading"><Headphones size={20} /><strong>Need a human?</strong></div>
                  <p>Escalate unresolved issues to an engineer.</p>
                  <button onClick={openTicket}><Ticket size={16} /> Create support ticket</button>
                </div>
              </section>

              <section className="side-panel">
                <div className="side-heading"><Clock3 size={19} /><h3>Current session</h3></div>
                <div className="session-stat"><MessageCircle size={17} /><span>Messages sent</span><strong>{messages.filter((m) => m.role === "user").length}</strong></div>
                <div className="session-stat"><CheckCircle2 size={17} /><span>AI responses</span><strong>{messages.filter((m) => m.role === "assistant").length}</strong></div>
              </section>

              <div className="security-note">
                <ShieldCheck size={18} />
                <span><strong>Secure support</strong><small>Add authentication and server-side access controls before production deployment.</small></span>
              </div>
            </aside>
          </div>
          <footer className="footer"><span>© 2026 CogniDesk</span><span>AI support workspace</span></footer>
        </div>
      </main>

      {ticketOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setTicketOpen(false); }}>
          <section className="ticket-modal">
            <div className="modal-heading">
              <div className="modal-icon"><Ticket size={21} /></div>
              <div><h2>Create support ticket</h2><p>Give your IT engineer the details needed to investigate the issue.</p></div>
              <button className="modal-close" onClick={() => setTicketOpen(false)}><X size={18} /></button>
            </div>
            {ticketMessage && <div className="ticket-notice">{ticketMessage}</div>}
            <form className="ticket-form" onSubmit={submitTicket}>
              <label>Email Address
                <input required type="email" value={ticket.email} onChange={(e) => setTicket({ ...ticket, email: e.target.value })} placeholder="staff@acmecorp.com" />
              </label>
              <label>Issue title
                <input required value={ticket.title} onChange={(e) => setTicket({ ...ticket, title: e.target.value })} placeholder="Unable to connect to VPN" />
              </label>
              <label>Description
                <textarea required rows={5} value={ticket.description} onChange={(e) => setTicket({ ...ticket, description: e.target.value })} placeholder="Describe the issue..." />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setTicketOpen(false)}>Cancel</button>
                <button type="submit" className="submit-ticket" disabled={ticketLoading}>{ticketLoading ? "Submitting..." : "Submit ticket"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}