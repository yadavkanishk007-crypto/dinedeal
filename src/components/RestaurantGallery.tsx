import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ImagePlus, 
  Trash2, 
  Loader2, 
  GripVertical, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Images
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

interface RestaurantGalleryProps {
  restaurantId: string;
  editable?: boolean;
}

const RestaurantGallery = ({ restaurantId, editable = false }: RestaurantGalleryProps) => {
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  useEffect(() => {
    fetchImages();
  }, [restaurantId]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_images")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${restaurantId}/${Date.now()}-${index}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from("restaurant-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("restaurant-images")
          .getPublicUrl(fileName);

        return {
          restaurant_id: restaurantId,
          image_url: publicUrl,
          sort_order: images.length + index,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      const { error: insertError } = await supabase
        .from("restaurant_images")
        .insert(uploadedImages);

      if (insertError) throw insertError;

      toast({ title: `${files.length} image(s) uploaded successfully` });
      fetchImages();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string, imageUrl: string) => {
    try {
      // Extract path from URL
      const urlParts = imageUrl.split("/restaurant-images/");
      if (urlParts.length > 1) {
        const path = urlParts[1];
        await supabase.storage.from("restaurant-images").remove([path]);
      }

      const { error } = await supabase
        .from("restaurant_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;

      setImages(images.filter(img => img.id !== imageId));
      toast({ title: "Image deleted" });
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  // Gallery View (non-editable)
  if (!editable) {
    if (images.length === 0) return null;

    return (
      <>
        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Images className="w-5 h-5 text-primary" />
            Gallery
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {images.slice(0, 6).map((image, index) => (
              <motion.button
                key={image.id}
                className="relative aspect-square rounded-lg overflow-hidden"
                onClick={() => setSelectedImage(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src={image.image_url}
                  alt={image.caption || `Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 5 && images.length > 6 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">+{images.length - 6}</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage !== null && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
            >
              <button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-6 h-6" />
              </button>
              
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(prev => prev !== null ? (prev - 1 + images.length) % images.length : 0);
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <motion.img
                key={selectedImage}
                src={images[selectedImage].image_url}
                alt={images[selectedImage].caption || "Gallery image"}
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              />

              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(prev => prev !== null ? (prev + 1) % images.length : 0);
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedImage ? "bg-white" : "bg-white/30"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(index);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Editable View (for restaurant dashboard)
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Images className="w-5 h-5 text-primary" />
            Photo Gallery
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {images.length} photo{images.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <Button variant="outline" className="w-full" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4 mr-2" />
                Upload Photos
              </>
            )}
          </Button>
        </div>

        {/* Images Grid */}
        {images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Images className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No photos yet. Upload some to showcase your restaurant!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((image) => (
              <motion.div
                key={image.id}
                className="relative aspect-square rounded-lg overflow-hidden group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <img
                  src={image.image_url}
                  alt={image.caption || "Gallery image"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image.id, image.image_url)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RestaurantGallery;
