import React from 'react'
import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="max-w-md mx-auto bg-white shadow-xl min-h-screen relative">
        <Header />
        <main className="pb-20 pt-16">
          <Outlet />
        </main>
        <Navigation />
      </div>
    </div>
  )
}