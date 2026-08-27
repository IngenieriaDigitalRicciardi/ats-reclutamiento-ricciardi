import { useAuth } from '../lib/AuthContext'
import Login from '../pages/Login'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) return <p style={{ padding: '2rem' }}>Cargando...</p>
  if (!session) return <Login />

  return children
}