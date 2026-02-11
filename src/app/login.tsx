"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { auth, googleProvider, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    if (!auth || !googleProvider || !db) {
      setError("Error de configuración: Firebase Auth, Google Provider o Firestore no inicializado.");
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth!, googleProvider!);
      const user = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db!, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user doc
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: "user", // Default role
          status: "active",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        // Update last login
        await setDoc(userDocRef, {
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

      toast.success("Inicio de sesión exitoso", {
        description: "Bienvenido a Transportes Lujav.",
      });
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar sesión con Google");
      toast.error("Error de autenticación", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!auth || !db) {
      setError("Error de configuración: Firebase Auth o Firestore no está inicializado. Verifica las variables de entorno.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth!, email, password);
        const user = userCredential.user;
        
        // Update last login or create if missing (for legacy users)
        const userDocRef = doc(db!, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
           await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || name || "Usuario",
            role: "user",
            status: "active",
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });
        } else {
          await setDoc(userDocRef, {
            lastLogin: serverTimestamp()
          }, { merge: true });
        }

        toast.success("Inicio de sesión exitoso", {
          description: "Bienvenido a Transportes Lujav.",
        });
        router.push("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
        const user = userCredential.user;
        
        if (name) {
          await updateProfile(user, {
            displayName: name,
          });
        }

        // Create user in Firestore
        await setDoc(doc(db!, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: "user",
          status: "active",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });

        toast.success("Registro exitoso", {
          description: "Tu cuenta ha sido creada correctamente.",
        });
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Ocurrió un error inesperado";
      if (err.code === 'auth/wrong-password') errorMessage = "Contraseña incorrecta";
      if (err.code === 'auth/user-not-found') errorMessage = "Usuario no encontrado";
      if (err.code === 'auth/email-already-in-use') errorMessage = "El correo ya está registrado";
      if (err.code === 'auth/invalid-credential') errorMessage = "Credenciales incorrectas (correo o contraseña no válidos)";
      if (err.code === 'auth/too-many-requests') errorMessage = "Demasiados intentos fallidos. Intenta más tarde.";
      
      if (err.code === 'permission-denied') errorMessage = "Permiso denegado: No tienes autorización para acceder a la base de datos.";
      
      setError(errorMessage);
      console.error("Login Error Full Object:", err);
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white px-2 text-gray-400">O continuar con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>

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
