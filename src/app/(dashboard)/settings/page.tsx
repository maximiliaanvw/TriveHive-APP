"use client"

import { User, Shield, Loader2 } from "lucide-react"
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
import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { updateProfileWithAvatar, changePassword } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

// Profile form schema
const profileSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre es requerido" })
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
})

// Business settings form schema
const businessSettingsSchema = z.object({
  forwardingPhone: z.string().optional(),
  businessName: z.string().optional(),
})

// Password change form schema
const passwordChangeSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, { message: "La contraseña es requerida" })
      .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirma tu contraseña" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type BusinessSettingsFormData = z.infer<typeof businessSettingsSchema>
type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userInitials, setUserInitials] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Password change dialog
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  
  // Form hooks
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const businessSettingsForm = useForm<BusinessSettingsFormData>({
    resolver: zodResolver(businessSettingsSchema),
  })

  const passwordChangeForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  })

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const email = user.email || ""
        const name = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     email.split("@")[0]
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "U"
        
        // Get avatar URL from user metadata or user_settings
        let avatar = user.user_metadata?.avatar_url || null
        
        if (!avatar) {
          // Try to fetch from user_settings
          const { data: settings } = await supabase
            .from("user_settings")
            .select("avatar_url")
            .eq("user_id", user.id)
            .single()
          
          if (settings?.avatar_url) {
            avatar = settings.avatar_url
          }
        }
        
        setUserName(name)
        setUserEmail(email)
        setUserInitials(initials)
        setAvatarUrl(avatar)
        setAvatarPreview(avatar)
        
        // Set form default values
        profileForm.reset({ name })
        
        // Fetch business settings
        const { data: userSettings } = await supabase
          .from("user_settings")
          .select("business_name")
          .eq("user_id", user.id)
          .single()
        
        if (userSettings?.business_name) {
          businessSettingsForm.reset({
            businessName: userSettings.business_name,
            forwardingPhone: "",
          })
        }
      }
      setLoading(false)
    }
    
    fetchUserData()
  }, [])

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "El archivo debe ser una imagen",
        variant: "destructive",
      })
      return
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo debe ser menor a 1MB",
        variant: "destructive",
      })
      return
    }

    setSelectedAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleProfileSave = async (data: ProfileFormData) => {
    setSavingProfile(true)

    try {
      const result = await updateProfileWithAvatar(data.name, selectedAvatarFile)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Perfil actualizado",
          description: "Tu perfil se ha actualizado correctamente",
          variant: "success",
        })
        
        // Update local state
        setUserName(data.name)
        
        // Update avatar URL if a new one was uploaded
        if (result.avatarUrl) {
          setAvatarUrl(result.avatarUrl)
        }
        
        // Clear selected file
        setSelectedAvatarFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        
        // Refresh the page to update user-nav
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleBusinessSettingsSave = async (data: BusinessSettingsFormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast({
        title: "Error",
        description: "No autenticado",
        variant: "destructive",
      })
      return
    }

    try {
      // Update user_settings
      const { error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            business_name: data.businessName || null,
          },
          {
            onConflict: "user_id",
          }
        )

      if (error) {
        toast({
          title: "Error",
          description: `Error al guardar: ${error.message}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Configuración guardada",
          description: "La configuración de negocio se ha guardado correctamente",
          variant: "success",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la configuración",
        variant: "destructive",
      })
    }
  }

  const handlePasswordChange = async (data: PasswordChangeFormData) => {
    setChangingPassword(true)

    try {
      const result = await changePassword(data.newPassword)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña se ha cambiado correctamente",
          variant: "success",
        })
        setIsPasswordDialogOpen(false)
        passwordChangeForm.reset()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al cambiar la contraseña",
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Cargando...</p>
        </div>
      </div>
    )
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
          <form onSubmit={profileForm.handleSubmit(handleProfileSave)} noValidate className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarPreview || avatarUrl || ""} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={savingProfile}
                >
                  {selectedAvatarFile ? "Cambiar Foto" : "Subir Foto"}
                </Button>
                <p className="text-muted-foreground text-xs mt-1">
                  JPG o PNG. Máx. 5MB.
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tu Nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ingresa tu nombre"
                disabled={savingProfile}
                aria-invalid={profileForm.formState.errors.name ? "true" : "false"}
                className={profileForm.formState.errors.name ? "border-red-500" : ""}
                {...profileForm.register("name")}
              />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>
              )}
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

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
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
          <form onSubmit={businessSettingsForm.handleSubmit(handleBusinessSettingsSave)} noValidate className="space-y-6">
            {/* Forwarding Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="forwarding-phone">Número de Teléfono de Reenvío</Label>
              <Input
                id="forwarding-phone"
                type="tel"
                placeholder="+34 612 345 678"
                aria-invalid={businessSettingsForm.formState.errors.forwardingPhone ? "true" : "false"}
                className={businessSettingsForm.formState.errors.forwardingPhone ? "border-red-500" : ""}
                {...businessSettingsForm.register("forwardingPhone")}
              />
              {businessSettingsForm.formState.errors.forwardingPhone && (
                <p className="text-sm text-red-500 mt-1">{businessSettingsForm.formState.errors.forwardingPhone.message}</p>
              )}
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="business-name">Nombre del Negocio</Label>
              <Input
                id="business-name"
                type="text"
                placeholder="Ingresa el nombre de tu negocio"
                aria-invalid={businessSettingsForm.formState.errors.businessName ? "true" : "false"}
                className={businessSettingsForm.formState.errors.businessName ? "border-red-500" : ""}
                {...businessSettingsForm.register("businessName")}
              />
              {businessSettingsForm.formState.errors.businessName && (
                <p className="text-sm text-red-500 mt-1">{businessSettingsForm.formState.errors.businessName.message}</p>
              )}
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
              <form onSubmit={passwordChangeForm.handleSubmit(handlePasswordChange)} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Ingresa nueva contraseña"
                    disabled={changingPassword}
                    aria-invalid={passwordChangeForm.formState.errors.newPassword ? "true" : "false"}
                    className={passwordChangeForm.formState.errors.newPassword ? "border-red-500" : ""}
                    {...passwordChangeForm.register("newPassword")}
                  />
                  {passwordChangeForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordChangeForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirma nueva contraseña"
                    disabled={changingPassword}
                    aria-invalid={passwordChangeForm.formState.errors.confirmPassword ? "true" : "false"}
                    className={passwordChangeForm.formState.errors.confirmPassword ? "border-red-500" : ""}
                    {...passwordChangeForm.register("confirmPassword")}
                  />
                  {passwordChangeForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordChangeForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsPasswordDialogOpen(false)
                      passwordChangeForm.reset()
                    }}
                    disabled={changingPassword}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cambiando...
                      </>
                    ) : (
                      "Cambiar Contraseña"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
