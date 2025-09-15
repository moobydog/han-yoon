"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
    setTheme(savedTheme)
    
    if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    } else {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
  }, [])

  const changeTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-1 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg p-1 shadow-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changeTheme('light')}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200",
          theme === 'light' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-muted/50"
        )}
      >
        <Sun className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changeTheme('dark')}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200",
          theme === 'dark' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-muted/50"
        )}
      >
        <Moon className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changeTheme('system')}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200",
          theme === 'system' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-muted/50"
        )}
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  )
}
