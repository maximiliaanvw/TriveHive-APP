"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "No autenticado" };
  }

  const fullName = formData.get("fullName") as string;

  if (!fullName || fullName.trim().length === 0) {
    return { error: "El nombre es requerido" };
  }

  // Update user metadata
  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName.trim(),
    },
  });

  if (updateError) {
    return { error: `Error al actualizar el perfil: ${updateError.message}` };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "No autenticado" };
  }

  const file = formData.get("avatar") as File;

  if (!file) {
    return { error: "No se seleccionó ningún archivo" };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen" };
  }

  // Validate file size (1MB max)
  if (file.size > 1024 * 1024) {
    return { error: "El archivo debe ser menor a 1MB" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return { error: `Error al subir la imagen: ${uploadError.message}` };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Check if user_settings exists and update avatar_url
  const { data: existingSettings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existingSettings) {
    // Update existing record
    const { error: updateError } = await supabase
      .from("user_settings")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    if (updateError) {
      return { error: `Error al actualizar el avatar: ${updateError.message}` };
    }
  } else {
    // If user_settings doesn't exist, we can't create it without vapi_assistant_id
    // So we'll just store it in user metadata (which we already do below)
    // This is acceptable - avatar will still work from metadata
    console.warn("user_settings record not found, storing avatar in metadata only");
  }

  // Also update user metadata for easy access
  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      avatar_url: publicUrl,
    },
  });

  if (metadataError) {
    console.error("Error updating user metadata:", metadataError);
    // Don't fail the whole operation if metadata update fails
  }

  revalidatePath("/settings");
  return { success: true, avatarUrl: publicUrl };
}

export async function updateProfileWithAvatar(
  fullName: string,
  avatarFile: File | null
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "No autenticado" };
  }

  let avatarUrl: string | undefined;

  // Upload avatar if provided
  if (avatarFile) {
    // Validate file type
    if (!avatarFile.type.startsWith("image/")) {
      return { error: "El archivo debe ser una imagen" };
    }

    // Validate file size (1MB max)
    if (avatarFile.size > 1024 * 1024) {
      return { error: "El archivo debe ser menor a 1MB" };
    }

    // Generate unique filename
    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return { error: `Error al subir la imagen: ${uploadError.message}` };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);
    avatarUrl = publicUrl;
  }

  // Update user metadata
  const updateData: { data: { full_name: string; avatar_url?: string } } = {
    data: {
      full_name: fullName.trim(),
    },
  };

  if (avatarUrl) {
    updateData.data.avatar_url = avatarUrl;
  }

  const { error: updateError } = await supabase.auth.updateUser(updateData);

  if (updateError) {
    return { error: `Error al actualizar el perfil: ${updateError.message}` };
  }

  // Update user_settings table if avatar was uploaded
  if (avatarUrl) {
    // Check if user_settings exists
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingSettings) {
      // Update existing record
      const { error: settingsError } = await supabase
        .from("user_settings")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);

      if (settingsError) {
        console.error("Error updating user_settings:", settingsError);
        // Don't fail the whole operation - avatar is stored in metadata
      }
    } else {
      // If user_settings doesn't exist, we can't create it without vapi_assistant_id
      // So we'll just store it in user metadata (which we already did above)
      // This is fine - avatar will work from metadata
    }
  }

  revalidatePath("/settings");
  return { success: true, avatarUrl };
}

export async function changePassword(newPassword: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "No autenticado" };
  }

  // Validate password length
  if (!newPassword || newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return {
      error: `Error al cambiar la contraseña: ${updateError.message}`,
    };
  }

  return { success: true };
}
