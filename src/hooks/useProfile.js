// Jalon 1 : profil fictif
// Jalon 4 : Firebase Auth
export const useProfile = () => {
  return {
    user: { id: 'dev-user', pseudo: 'Léo', avatar: 'avatar-01' },
    isLoggedIn: true,
    login: () => {},
    logout: () => {},
  }
}
