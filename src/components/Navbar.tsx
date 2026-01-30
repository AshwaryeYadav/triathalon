"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Settings,
  Bell,
  User,
  Activity,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/whoop", label: "Whoop", icon: Activity },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--swim-blue)] via-[var(--bike-orange)] to-[var(--run-green)] flex items-center justify-center">
                <span className="text-xl font-black text-white">T</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--run-green)] border-2 border-[var(--bg-primary)]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white">TriCoach</h1>
              <p className="text-xs text-[var(--text-muted)] -mt-0.5">Sprint Training</p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative"
                >
                  <motion.div
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors
                      ${isActive 
                        ? "text-white" 
                        : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]"
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-[var(--bg-tertiary)] rounded-xl -z-10"
                        layoutId="navbar-active"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="notification-badge">2</span>
            </button>
            <Link
              href="/settings"
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <Link
              href="/profile"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--swim-blue)] to-[var(--lift-purple)] flex items-center justify-center"
            >
              <User className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
