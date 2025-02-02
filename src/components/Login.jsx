import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Building2, ArrowRight, UserPlus } from "lucide-react";
import Register from "./Register";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
    } catch (err) {
      setError("Identifiants incorrects ou problème de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center perspective-1000">
      <div className="relative w-[90%] max-w-5xl h-[90vh] max-h-[700px] transition-all duration-500 preserve-3d">
        <div 
          className={`absolute inset-0 backface-hidden transition-all duration-500 ${
            showRegister ? 'rotate-y-180 opacity-0' : 'rotate-y-0 opacity-100'
          }`}
        >
          <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform hover:scale-[1.01] transition-transform duration-300">
            {/* Left Side */}
            <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174')] opacity-10 bg-cover bg-center" />
              <div className="relative z-10 text-center">
                <Building2 className="w-16 h-16 mb-6 mx-auto animate-[float_2s_ease-in-out_infinite]" />
                <h2 className="text-3xl font-bold mb-4 animate-[fadeIn_0.5s_ease-out]">Gestion RH Pro 👥</h2>
                <p className="text-lg mb-6 leading-relaxed animate-[slideUp_0.5s_ease-out]">
                  Gérez les <span className="text-yellow-300 font-semibold">absences</span> de vos employés 
                  avec simplicité et efficacité ✨
                </p>
                <div className="space-y-3 text-base">
                  <p className="flex items-center gap-2 animate-[slideUp_0.3s_ease-out]">
                    <span className="text-xl">📊</span> Tableau de bord intuitif
                  </p>
                  <p className="flex items-center gap-2 animate-[slideUp_0.4s_ease-out]">
                    <span className="text-xl">🔄</span> Suivi en temps réel
                  </p>
                  <p className="flex items-center gap-2 animate-[slideUp_0.5s_ease-out]">
                    <span className="text-xl">📱</span> Accessible partout
                  </p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500 animate-[shimmer_2s_linear_infinite]"></div>
            </div>

            {/* Right Side */}
            <div className="md:w-1/2 p-8 flex items-center">
              <div className="w-full max-w-md mx-auto">
                <h2 className="text-3xl font-bold mb-2 animate-[fadeIn_0.5s_ease-out]">Bon retour! 👋</h2>
                <p className="text-gray-600 mb-6 animate-[fadeIn_0.6s_ease-out]">
                  Nous sommes ravis de vous revoir.
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative group animate-[slideUp_0.3s_ease-out]">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Email"
                      required
                    />
                  </div>

                  <div className="relative group animate-[slideUp_0.4s_ease-out]">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Mot de passe"
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 animate-[shake_0.5s_ease-in-out] text-sm">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between animate-[fadeIn_0.5s_ease-out]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-600 text-sm">Se souvenir de moi</span>
                    </label>
                    <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors text-sm">
                      Mot de passe oublié?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all duration-200 animate-[slideUp_0.5s_ease-out]"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="relative animate-[fadeIn_0.6s_ease-out]">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Ou</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="w-full bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors duration-200 animate-[slideUp_0.6s_ease-out]"
                  >
                    <UserPlus className="w-5 h-5" />
                    Créer un compte
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Register Component with 3D Flip Animation */}
        <div 
          className={`absolute inset-0 backface-hidden transition-all duration-500 ${
            showRegister ? 'rotate-y-0 opacity-100' : 'rotate-y-[-180deg] opacity-0'
          }`}
        >
          <Register onBack={() => setShowRegister(false)} />
        </div>
      </div>
    </div>
  );
};

export default Login;