'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function ThemeColorApplier() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const currentTheme = theme === 'system' ? resolvedTheme : theme
    const root = document.documentElement

    const applyColors = () => {
      const lightPrimary = localStorage.getItem('theme-light-primary') || '#000000'
      const darkPrimary = localStorage.getItem('theme-dark-primary') || '#ffffff'
      const lightBorder = localStorage.getItem('theme-light-border') || '#000000'
      const darkBorder = localStorage.getItem('theme-dark-border') || '#ffffff'

      if (currentTheme === 'dark') {
        root.style.setProperty('--primary', darkPrimary)
        root.style.setProperty('--border', darkBorder)
        // Also update primary-foreground if needed, or other variables
      } else {
        root.style.setProperty('--primary', lightPrimary)
        root.style.setProperty('--border', lightBorder)
      }
    }

    applyColors()

    // Listen for changes in localStorage from other tabs/pages
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('theme-')) {
        applyColors()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Create a custom event listener for local changes in the same tab
    const handleLocalThemeChange = () => applyColors()
    window.addEventListener('theme-color-change', handleLocalThemeChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('theme-color-change', handleLocalThemeChange)
    }
  }, [theme, resolvedTheme, mounted])

  return null
}
