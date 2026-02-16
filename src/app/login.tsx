"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { db } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        if (!supabase) {
          setError("Error de configuración: Supabase no está inicializado.");
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        const user = data.user;

        if (user && db) {
          const userDocRef = doc(db, "users", user.id);
          const userDoc = await getDoc(userDocRef);

          const displayName = user.user_metadata?.name || name || "Usuario";
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            displayName || user.email || "Usuario",
          )}&background=111827&color=ffffff&size=128`;

          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: user.id,
              email: user.email,
              displayName,
              photoURL: avatarUrl,
              role: "user",
              status: "active",
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
          } else {
            await setDoc(
              userDocRef,
              {
                lastLogin: serverTimestamp(),
                photoURL: userDoc.data()?.photoURL || avatarUrl,
              },
              { merge: true },
            );
          }
        }

        toast.success("Inicio de sesión exitoso", {
          description: "Bienvenido a Transportes Lujav.",
        });
        router.push("/dashboard");
      } else {
        if (!supabase) {
          setError("Error de configuración: Supabase no está inicializado.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (error) {
          throw error;
        }

        const user = data.user;

        if (user && db) {
          const displayName = name || user.email || "Usuario";
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            displayName,
          )}&background=111827&color=ffffff&size=128`;

          await setDoc(doc(db, "users", user.id), {
            uid: user.id,
            email: user.email,
            displayName,
            photoURL: avatarUrl,
            role: "user",
            status: "active",
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
        }

        toast.success("Registro exitoso", {
          description: "Tu cuenta ha sido creada correctamente.",
        });
        router.push("/dashboard");
      }
    } catch (err: any) {
      let errorMessage = "Ocurrió un error inesperado";
      const message = err?.message || "";
      if (message.toLowerCase().includes("invalid login")) {
        errorMessage = "Credenciales incorrectas (correo o contraseña no válidos)";
      } else if (message.toLowerCase().includes("email already registered") || message.toLowerCase().includes("already registered")) {
        errorMessage = "El correo ya está registrado";
      }

      setError(errorMessage);
      toast.error("Error de autenticación", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-white">
      {/* Left Side - Red Background with Grid Pattern */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#8B0000] text-white flex-col justify-center px-20 overflow-hidden">
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Transportes <br /> Lujav
          </h1>
          <p className="text-red-100 text-lg leading-relaxed font-light mb-8 max-w-md">
            Transformamos la logística en eficiencia. Accede a tu panel de control para gestionar rutas, cotizaciones y servicios de transporte.
          </p>
          
          {/* Slider Indicators (Decorative) */}
          <div className="flex gap-2">
            <div className="h-1.5 w-8 bg-white/90 rounded-full"></div>
            <div className="h-1.5 w-2 bg-white/30 rounded-full"></div>
            <div className="h-1.5 w-2 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isLogin ? "Bienvenido de nuevo" : "Crear cuenta"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isLogin 
                ? "Ingresa tus credenciales para acceder" 
                : "Ingresa tus datos para registrarte"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 text-sm py-2">
              <AlertTitle className="text-red-900 font-medium text-xs uppercase tracking-wide">Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium text-gray-600 ml-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">Aa</span>
                  </div>
                  <input
                    id="name"
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white placeholder:text-gray-300 text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-gray-600 ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@transporteslujav.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white placeholder:text-gray-300 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-gray-600 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white placeholder:text-gray-300 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor="remember" className="text-xs text-gray-500 cursor-pointer">
                  Recordarme
                </label>
              </div>
              {isLogin && (
                <button type="button" className="text-xs text-gray-500 hover:text-black font-medium">
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 text-sm"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <>
                  {isLogin ? "Iniciar Sesión" : "Registrarse"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-gray-400 text-xs">
              {isLogin ? "¿No tienes una cuenta? " : "¿Ya tienes una cuenta? "}
              <button
                onClick={toggleMode}
                className="text-black font-bold hover:underline"
              >
                {isLogin ? "Regístrate ahora" : "Inicia sesión"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
