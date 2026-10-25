"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Clock, User, RefreshCw, AlertCircle, Bot, ShieldCheck, LogOut } from "lucide-react";

type Ticket = {
  id: number;
  user_email: string;
  issue_description: string;
  ai_summary: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  assigned_engineer: string;
  created_at: string;
};

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [authStatus, setAuthStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");
  
  const router = useRouter();

  // 1. Security Check
  useEffect(() => {
    const token = localStorage.getItem("cognidesk_token");
    const role = localStorage.getItem("cognidesk_role");
    
    if (!token || role !== "engineer") {
      setAuthStatus("unauthorized");
      router.push("/login");
    } else {
      setAuthStatus("authorized");
    }
  }, [router]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("cognidesk_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/tickets", {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data);
      setError("");
    } catch (err) {
      setError("Could not connect to the ticketing system.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "authorized") {
      fetchTickets();
    }
  }, [authStatus]);

  const updateTicket = async (id: number, newStatus: string, engineer?: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/tickets/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus, assigned_engineer: engineer }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchTickets();
    } catch (err) {
      alert("Failed to update ticket status.");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("cognidesk_token");
    localStorage.removeItem("cognidesk_role");
    router.push("/login");
  };

  const filteredTickets = filter === "ALL" ? tickets : tickets.filter(t => t.status === filter);

  // Show a loading screen while checking auth
  if (authStatus === "loading") {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-500">Verifying access...</div>;
  }

  // Render Dashboard
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="max-w-7xl mx-auto p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 border-b-2 border-slate-300 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Bot className="text-blue-600" size={36} /> Engineer Dashboard
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-2">Manage and resolve AI-escalated IT tickets</p>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchTickets} className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 text-sm font-bold text-slate-700 transition-all">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh Data
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl shadow-sm hover:bg-red-100 text-sm font-bold transition-all">
              <LogOut size={18} /> Sign Out
            </button>
            <Link href="/" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 text-sm font-bold transition-all">
              <ArrowLeft size={18} /> Back to Chat
            </Link>
          </div>
        </header>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
          {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                filter === status 
                  ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-5 rounded-xl mb-6 flex items-center gap-3 border-2 border-red-300 font-bold">
            <AlertCircle size={24} /> {error}
          </div>
        )}

        {/* Ticket Grid */}
        {loading && tickets.length === 0 ? (
          <div className="text-center py-20 text-slate-600 font-bold text-lg animate-pulse">Loading secure tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-300 text-slate-500">
            <ShieldCheck size={56} className="mx-auto text-slate-300 mb-4" />
            <p className="text-xl font-bold text-slate-700">No active tickets found.</p>
            <p className="text-sm font-medium mt-1">The AI is resolving issues perfectly!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-2xl shadow-md border-2 border-slate-200 p-6 flex flex-col hover:shadow-xl transition-all duration-200">
                
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-extrabold text-slate-400 tracking-widest">TICKET #{ticket.id}</span>
                  <span className={`px-3 py-1 text-xs font-extrabold rounded-lg tracking-wide border ${
                    ticket.status === 'OPEN' ? 'bg-red-50 text-red-700 border-red-200' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 border-2 border-blue-200 flex items-center justify-center font-extrabold text-sm">
                    {ticket.user_email.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{ticket.user_email}</p>
                    <p className="text-xs font-semibold text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 mb-5 flex-grow">
                  <p className="text-xs font-extrabold text-blue-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <Clock size={14} /> AI Summary
                  </p>
                  <p className="text-sm text-slate-800 leading-relaxed font-semibold">{ticket.ai_summary}</p>
                </div>

                <p className="text-xs text-slate-600 mb-4 font-medium italic border-l-4 border-slate-300 pl-3">
                  "{ticket.issue_description}"
                </p>

                <div className="mt-auto pt-5 border-t-2 border-slate-100">
                  <div className="text-xs mb-4 flex justify-between items-center">
                    <span className="font-bold text-slate-500 uppercase tracking-widest">Assigned</span>
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{ticket.assigned_engineer || "Unassigned"}</span>
                  </div>
                  
                  {ticket.status === 'OPEN' && (
                    <button onClick={() => updateTicket(ticket.id, 'IN_PROGRESS', 'Engineer (You)')}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 text-sm font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm">
                      <User size={18} /> Assign to Me
                    </button>
                  )}
                  
                  {ticket.status === 'IN_PROGRESS' && (
                    <button onClick={() => updateTicket(ticket.id, 'RESOLVED', ticket.assigned_engineer)}
                      className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 text-sm font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm">
                      <CheckCircle size={18} /> Mark Resolved
                    </button>
                  )}

                  {ticket.status === 'RESOLVED' && (
                    <div className="w-full bg-emerald-50 text-emerald-700 border-2 border-emerald-200 py-3 rounded-xl text-sm font-extrabold text-center flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Issue Resolved
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}