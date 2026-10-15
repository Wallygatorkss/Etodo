"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, Trash2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState("/profile-placeholder.jpg");
  const [userId, setUserId] = useState<number | null>(null);
  // Informations du compte (email, nom, prénom)
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [firstname, setFirstname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // récupère le profil (email/nom/prénom/image) depuis le backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
  const res = await fetch('http://localhost:3001/user', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.id) setUserId(Number(data.id));
        if (data.email) setEmail(data.email);
  if (data.name) setName(data.name);
  if (data.firstname) setFirstname(data.firstname);
        if (data.profile_image) setProfileImage(data.profile_image);
      } catch (err) {
        console.error('Erreur récupération profil:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("❌ L'image est trop grande. Maximum 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageDataUrl = reader.result as string;
      setProfileImage(imageDataUrl);
      try {
        // Envoie l'image au backend (PUT /profile-image)
        const response = await fetch('http://localhost:3001/profile-image', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ image: imageDataUrl })
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erreur serveur:", errorText);
          alert("❌ Erreur serveur : " + (errorText || response.statusText));
          return;
        }
        await response.json().catch(() => null);
        alert("✅ Photo de profil mise à jour avec succès");
      } catch (error) {
        console.error('Erreur complète:', error);
        alert("❌ Erreur de connexion au serveur: " + (error instanceof Error ? error.message : String(error)));
      }
    };
    reader.onerror = () => {
      alert("❌ Erreur lors de la lecture du fichier");
    };
    reader.readAsDataURL(file);
  };

  // Sauvegarde des infos du compte (email/nom/prénom)
  const handleSaveProfile = async () => {
    try {
      if (!userId) {
        alert("❌ Utilisateur non chargé");
        return;
      }
      // PUT /users/:id avec les infos mises à jour
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, name, firstname })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
  alert("✅ Profil mis à jour avec succès");
      } else {
        alert("❌ Erreur : " + (data.message || response.statusText));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("❌ Erreur de connexion au serveur");
    }
  };

  // Changement du mot de passe: vérifie, puis PUT /password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        alert("✅ Mot de passe modifié avec succès");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert("❌ Erreur : " + (data.message || response.statusText));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("❌ Erreur de connexion au serveur");
    }
  };

  // Suppression du compte (DELETE /users/:id) + nettoyage cookie + redirection
  const handleDeleteAccount = async () => {
    try {
      if (!userId) {
        alert("❌ Utilisateur non chargé");
        return;
      }
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        alert("✅ Compte supprimé avec succès");
        window.location.href = "http://localhost:3001";
      } else {
        alert("❌ Erreur : " + data.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert("❌ Erreur de connexion au serveur");
    }
  };

  // Déconnexion: efface le cookie token et redirige
  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "http://localhost:3001";
  };

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-[#0d1117] py-1.5">
      <Header />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-[#c9d1d9]">Paramètres du compte</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Photo de profil</CardTitle>
            <CardDescription>Modifiez votre photo de profil</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileImage} alt="Photo de profil" />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                U
              </AvatarFallback>
            </Avatar>
            <div>
              <Input
                id="picture"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Label htmlFor="picture">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Changer la photo
                  </span>
                </Button>
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>Modifiez votre email et vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstname">Prénom</Label>
              <Input
                id="firstname"
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="Votre prénom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveProfile} className="bg-black hover:bg-black/90 text-white">
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </CardFooter>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Changer le mot de passe</CardTitle>
            <CardDescription>Mettez à jour votre mot de passe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleChangePassword} className="bg-black hover:bg-black/90 text-white">
              Modifier le mot de passe
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-transparent">
          <CardHeader>
            <CardTitle className="text-red-600">Zone de danger</CardTitle>
            <CardDescription>Actions irréversibles sur votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer mon compte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Cela supprimera définitivement votre compte
                    et toutes vos données de nos serveurs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                    Oui, supprimer mon compte
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}