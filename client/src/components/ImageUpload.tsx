import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  label?: string;
  description?: string;
}

export function ImageUpload({ 
  value = [], 
  onChange, 
  maxImages = 10, 
  label = "Product Images",
  description = "Upload product images (max 5MB each, JPEG/PNG/GIF/WebP)"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${maxImages} images`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const newUrls = data.files.map((file: any) => file.url);
      onChange([...value, ...newUrls]);

      toast({
        title: "Success",
        description: `${files.length} image(s) uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (index: number, url: string) => {
    try {
      // Extract filename from URL
      const filename = url.split('/').pop();
      if (filename) {
        await fetch(`/api/upload/${filename}`, {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
    }

    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleUrlAdd = (url: string) => {
    if (!url.trim()) return;

    if (value.length >= maxImages) {
      toast({
        title: "Too many images",
        description: `You can add a maximum of ${maxImages} images`,
        variant: "destructive",
      });
      return;
    }

    onChange([...value, url.trim()]);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('image-upload-input')?.click()}
          disabled={uploading || value.length >= maxImages}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </>
          )}
        </Button>
        <Input
          id="image-upload-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Add URL Manually */}
      <div className="flex gap-2">
        <Input
          id="image-url-input"
          placeholder="Or paste image URL..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const input = e.target as HTMLInputElement;
              handleUrlAdd(input.value);
              input.value = '';
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const input = document.getElementById('image-url-input') as HTMLInputElement;
            if (input) {
              handleUrlAdd(input.value);
              input.value = '';
            }
          }}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                  (e.target as HTMLImageElement).className = 'w-full h-full object-contain p-8 opacity-20';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(index, url)}
              >
                <X className="h-4 w-4" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <ImagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No images added yet</p>
          <p className="text-sm mt-1">Upload images or paste URLs above</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length} / {maxImages} images
      </p>
    </div>
  );
}

