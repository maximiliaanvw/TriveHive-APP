"use client"

import { User, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"

export default function SettingsPage() {
  // TODO: Replace with actual user data from Supabase
  const [userName, setUserName] = useState("John Doe")
  const [userEmail] = useState("john@company.com") // Read-only
  const [userInitials] = useState("JD")
  
  // Business settings
  const [forwardingPhone, setForwardingPhone] = useState("")
  const [businessName, setBusinessName] = useState("")
  
  // Password change dialog
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement save to Supabase
    console.log("Saving profile:", { userName, userEmail })
  }

  const handleBusinessSettingsSave = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement save to Supabase
    console.log("Saving business settings:", { forwardingPhone, businessName })
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }
    // TODO: Implement password change in Supabase
    console.log("Changing password")
    setIsPasswordDialogOpen(false)
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona la configuración y preferencias de tu cuenta.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Gestiona los detalles y preferencias de tu cuenta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button type="button" variant="outline" size="sm">
                  Subir Foto
                </Button>
                <p className="text-muted-foreground text-xs mt-1">
                  JPG, GIF o PNG. Máx. 1MB.
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tu Nombre</Label>
              <Input
                id="name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ingresa tu nombre"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <Button type="submit">Guardar Cambios</Button>
          </form>
        </CardContent>
      </Card>

      {/* Business Settings Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Configuración de Negocio</CardTitle>
            <CardDescription>
              La IA transferirá las llamadas a este número cuando se solicite un humano.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBusinessSettingsSave} className="space-y-6">
            {/* Forwarding Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="forwarding-phone">Número de Teléfono de Reenvío</Label>
              <Input
                id="forwarding-phone"
                type="tel"
                value={forwardingPhone}
                onChange={(e) => setForwardingPhone(e.target.value)}
                placeholder="+34 612 345 678"
              />
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="business-name">Nombre del Negocio</Label>
              <Input
                id="business-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ingresa el nombre de tu negocio"
              />
            </div>

            <Button type="submit">Guardar Cambios</Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>Contraseña, autenticación de dos factores y sesiones</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Cambiar Contraseña</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <DialogDescription>
                  Ingresa tu nueva contraseña. Asegúrate de que sea fuerte y segura.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa nueva contraseña"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma nueva contraseña"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Cambiar Contraseña</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
