import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Building2, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
    } catch (err) {
      setError("Identifiants incorrects ou problème de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform hover:scale-[1.01] transition-transform duration-300">
        {/* Left Side */}
        <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174')] opacity-10 bg-cover bg-center" />
          <div className="relative z-10 text-center">
            <Building2 className="w-20 h-20 mb-8 mx-auto animate-float" />
            <h2 className="text-4xl font-bold mb-6">Gestion RH Pro 👥</h2>
            <p className="text-xl mb-8 leading-relaxed">
              Gérez les <span className="text-yellow-300 font-semibold">absences</span> de vos employés 
              avec simplicité et efficacité ✨
            </p>
            <div className="space-y-4 text-lg">
              <p className="flex items-center gap-2">
                <span className="text-2xl">📊</span> Tableau de bord intuitif
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">🔄</span> Suivi en temps réel
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">📱</span> Accessible partout
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="md:w-1/2 p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold mb-2">Bon retour! 👋</h2>
            <p className="text-gray-600 mb-8">Nous sommes ravis de vous revoir.</p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Email"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 animate-shake">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-gray-600">Se souvenir de moi</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">
                  Mot de passe oublié?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all duration-200"
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;