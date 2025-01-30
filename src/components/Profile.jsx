import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  AccountCircle as AccountIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

export default function Profile() {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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

    try {
      await updateEmail(user, newEmail);
      setSuccess('Email mis à jour avec succès !');
      setNewEmail('');
    } catch (error) {
      setError(error.message);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
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
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        py: 4,
        px: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
              }}
            >
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'white',
                    color: 'primary.main',
                  }}
                >
                  <AccountIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {user.displayName || 'Utilisateur Admin'}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Account Info */}
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountIcon color="primary" />
                  Informations du compte
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ '& > div': { mb: 2 } }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon color="action" />
                    <Typography variant="body1">{user.email}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon color="action" />
                    <Typography variant="body1">
                      Créé le: {formatDate(user.metadata.creationTime)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimeIcon color="action" />
                    <Typography variant="body1">
                      Dernière connexion: {formatDate(user.metadata.lastSignInTime)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Update Forms */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {/* Email Update */}
              <Grid item xs={12}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon color="primary" />
                      Changer l'email
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <form onSubmit={handleChangeEmail}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          fullWidth
                          type="email"
                          label="Nouvel email"
                          variant="outlined"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                        />
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={loading}
                          startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
                        >
                          Mettre à jour
                        </Button>
                      </Box>
                    </form>
                  </CardContent>
                </Card>
              </Grid>

              {/* Password Update */}
              <Grid item xs={12}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LockIcon color="primary" />
                      Changer le mot de passe
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <form onSubmit={handleChangePassword}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            type={showCurrentPassword ? 'text' : 'password'}
                            label="Mot de passe actuel"
                            variant="outlined"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  edge="end"
                                >
                                  {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            type={showNewPassword ? 'text' : 'password'}
                            label="Nouveau mot de passe"
                            variant="outlined"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  edge="end"
                                >
                                  {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
                          >
                            Mettre à jour le mot de passe
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Notifications */}
        <Box sx={{ mt: 3 }}>
          <Fade in={!!error}>
            <Box sx={{ mb: error ? 2 : 0 }}>
              {error && <Alert severity="error" variant="filled">{error}</Alert>}
            </Box>
          </Fade>
          <Fade in={!!success}>
            <Box>
              {success && <Alert severity="success" variant="filled">{success}</Alert>}
            </Box>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
}