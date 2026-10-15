"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Sun, Moon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [gems, setGems] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState("/profile-placeholder.jpg");

  // Fetch gems
  useEffect(() => {
    let mounted = true;
    async function fetchGems() {
      try {
  const res = await fetch('http://localhost:3001/clash/gems/me', { credentials: 'include' });
        if (! mounted) return;
        if (! res.ok) {
          setGems(null);
          return;
        }
        const data = await res.json();
        if (mounted && typeof data. gems === 'number') setGems(data.gems);
      } catch (e) {
        if (mounted) setGems(null);
      }
    }
    fetchGems();
    const t = setInterval(fetchGems, 10000); // refresh every 10s
    return () => { mounted = false; clearInterval(t); };
  }, []);

  // Live update gems when a task awards gems
  useEffect(() => {
    const onAward = (ev: Event) => {
      const e = ev as CustomEvent<{ amount?: number; total?: number }>;
      const total = e.detail?.total;
      const amount = e.detail?.amount ?? 0;
      setGems(prev => {
        if (typeof total === 'number') return total;
        if (typeof prev === 'number') return prev + (typeof amount === 'number' ? amount : 0);
        return prev; // keep as is until next poll
      });
    };
    window.addEventListener('etodo:gems-awarded' as any, onAward as EventListener);
    return () => window.removeEventListener('etodo:gems-awarded' as any, onAward as EventListener);
  }, []);

  // Fetch profile image
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:3001/user', {
          credentials: 'include'
        });

        if (! res.ok) return;
        const data = await res.json();
        if (data.profile_image) {
          setProfileImage(data. profile_image);
        }
      } catch (err) {
        console.error('Erreur récupération profil:', err);
      }
    };

    fetchProfile();
  }, []);

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleHome = () => {
    router. push("/");
  };

  const handleLogout = () => {
    // Supprimer le cookie token
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Rediriger vers la page de connexion
    window.location.href = "http://localhost:3001";
  };

  const isSettingsPage = pathname === "/settings";

  return (
    <header className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-white shadow-lg border-b border-slate-200 dark:border-[#30363d]" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div 
        onClick={isSettingsPage ?  handleHome : undefined}
        className={isSettingsPage ? "cursor-pointer hover:opacity-80 transition" : ""}
        style={{fontWeight: 700, fontSize: '1.125rem'}}
      >
        E-todo
      </div>
      <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
        {/* Gemme link to local clash page (UI aligned with /clash/index.html) */}
        <a href="/clash/index.html" title="Clash des boss" className="inline-flex items-center justify-center hover:opacity-90 transition" style={{marginRight: 6}}>
          <div className="gemmes" style={{display: 'inline-flex', alignItems: 'center', border: 'none', background: 'transparent', padding: 0}}>
            <span style={{fontWeight:800, fontSize: 25, minWidth:1, textAlign: 'right', display: 'inline-block'}}>
              {gems === null ? '—' : gems}
            </span>
            <img className="gemme-image" src="/clash/image_fond/gems-icon-r-removebg-preview.png" alt="Gemme" style={{width: 48, height: 48, objectFit: 'contain'}} />
          </div>
        </a>
        {/* Bouton pour changer le thème */}
        <button 
          className="hover:bg-slate-100 dark:hover:bg-white/20 transition-colors text-slate-900 dark:text-white text-4xl" 
          aria-label="Toggle theme" 
          title="Toggle theme"
          onClick={toggleTheme}
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: 6,
            border:'none',
            background:'transparent',
            cursor: 'pointer'
          }}>
            {theme === "light" ? (
              <Moon className="h-8 w-8" />
            ) : (
              <Sun className="h-8 w-8" />
            )}
        </button>
        
        {/* Menu utilisateur avec avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-slate-300 dark:hover:ring-gray-300 transition">
              <AvatarImage src={profileImage} alt="Photo de profil" />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-sm">
                U
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}