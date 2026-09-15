import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f7fbfe]">
      <Header />
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Me Socorre — serviços locais, de um jeito simples.</p>
          <p>Atendimento seguro começa com uma boa escolha.</p>
        </div>
      </footer>
    </div>
  )
}
