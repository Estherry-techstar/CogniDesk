"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ShieldCheck, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await res.json();

      // Store the JWT and role
      localStorage.setItem("cognidesk_token", data.access_token);
      localStorage.setItem("cognidesk_role", data.role);

      // Redirect based on role
      if (data.role === "engineer") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-slate-200 max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-blue-200">
            <Bot size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-manrope">CogniDesk Login</h1>
          <p className="text-slate-500 font-medium mt-1">Sign in to access the IT portal</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="staff@acmecorp.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors mt-6 shadow-md flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Authenticating...</> : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="font-bold mb-2 text-slate-700">Demo Credentials:</p>
          <p className="mb-1"><span className="font-semibold">Staff:</span> staff@acmecorp.com / password123</p>
          <p><span className="font-semibold">Engineer:</span> engineer@acmecorp.com / password123</p>
        </div>

        <p className="mt-6 text-xs text-slate-400 flex items-center justify-center gap-1 font-medium">
          <ShieldCheck size={14} /> Secure Enterprise Authentication (JWT)
        </p>
      </div>
    </div>
  );
}