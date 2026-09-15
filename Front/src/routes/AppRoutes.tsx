import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { Account } from '../pages/Account'
import { AdminCategories } from '../pages/AdminCategories'
import { AdminClients } from '../pages/AdminClients'
import { AdminDashboard } from '../pages/AdminDashboard'
import { AdminProviders } from '../pages/AdminProviders'
import { AdminRequests } from '../pages/AdminRequests'
import { AdminReviews } from '../pages/AdminReviews'
import { ClientProfile } from '../pages/ClientProfile'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { MyRequests } from '../pages/MyRequests'
import { NewRequest } from '../pages/NewRequest'
import { NotFound } from '../pages/NotFound'
import { ProviderDetails } from '../pages/ProviderDetails'
import { ProviderDashboard } from '../pages/ProviderDashboard'
import { ProviderProfile } from '../pages/ProviderProfile'
import { Providers } from '../pages/Providers'
import { Register } from '../pages/Register'
import { RequestDetails } from '../pages/RequestDetails'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="prestadores" element={<Providers />} />
        <Route path="prestadores/:id" element={<ProviderDetails />} />
        <Route path="entrar" element={<Login />} />
        <Route path="cadastro" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="minha-area" element={<Account />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
          <Route path="solicitacoes/nova" element={<NewRequest />} />
          <Route path="minhas-solicitacoes" element={<MyRequests />} />
          <Route path="perfil" element={<ClientProfile />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['CLIENT', 'PROVIDER', 'ADMIN']} />}>
          <Route path="solicitacoes/:id" element={<RequestDetails />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['PROVIDER']} />}>
          <Route path="prestador" element={<ProviderDashboard />} />
          <Route path="prestador/solicitacoes" element={<MyRequests />} />
          <Route path="prestador/perfil" element={<ProviderProfile />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/prestadores" element={<AdminProviders />} />
          <Route path="admin/solicitacoes" element={<AdminRequests />} />
          <Route path="admin/avaliacoes" element={<AdminReviews />} />
          <Route path="admin/clientes" element={<AdminClients />} />
          <Route path="admin/categorias" element={<AdminCategories />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
