import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  sendEmailVerification 
} from 'firebase/auth';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Calendar, 
  Clock, 
  Edit2, 
  Shield, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setVerificationSent(false);

    try {
      // First, reauthenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Then update email
      await updateEmail(user, newEmail);
      
      // Send verification email
      await sendEmailVerification(user);
      
      setVerificationSent(true);
      setSuccess('Un email de vérification a été envoyé à votre nouvelle adresse. Veuillez vérifier votre boîte de réception.');
      setNewEmail('');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        setError('Pour des raisons de sécurité, veuillez vous reconnecter avant de modifier votre email.');
      } else if (error.code === 'auth/invalid-email') {
        setError('L\'adresse email n\'est pas valide.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà utilisée.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess('Mot de passe mis à jour avec succès !');
      setNewPassword('');
      setCurrentPassword('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-xl transform hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-inner">
                  <User className="w-12 h-12 text-blue-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 p-1.5 rounded-full">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-white">
                  {user.displayName || 'Utilisateur Admin'} ✨
                </h1>
                <p className="text-blue-100 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Account Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-[1.02] transition-all duration-300">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 mb-6">
                <User className="text-blue-600" />
                Informations du compte
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Créé le: {formatDate(user.metadata.creationTime)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Dernière connexion: {formatDate(user.metadata.lastSignInTime)}</span>
                </div>
              </div>
            </div>

            {/* Update Forms */}
            <div className="md:col-span-2 space-y-6">
              {/* Email Update */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 mb-6">
                  <Mail className="text-blue-600" />
                  Changer l'email
                </h2>
                <form onSubmit={handleChangeEmail} className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Nouvel email"
                        required
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Mot de passe actuel (pour confirmation)"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4" />
                          Mettre à jour l'email
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Update */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 mb-6">
                  <Lock className="text-blue-600" />
                  Changer le mot de passe
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Mot de passe actuel"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nouveau mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Mettre à jour le mot de passe
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            {error && (
              <div className="animate-shake bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            {success && (
              <div className="animate-fade-in bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}