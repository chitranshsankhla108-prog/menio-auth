import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export function useStorage() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadMenuImage = async (file: File) => {
    try {
      setIsUploading(true);

      // 1. Generate a unique name so images don't overwrite each other
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2. Upload the file to your 'menu-images' bucket
      const { error: uploadError, data } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 3. Get the Public URL so customers can see it
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed: " + (error.message || "Unknown error"));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadMenuImage, isUploading };
}