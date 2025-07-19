import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  selectedPhoto: File | null;
  onClear: () => void;
}

export const PhotoUpload = ({ onPhotoSelect, selectedPhoto, onClear }: PhotoUploadProps) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onPhotoSelect(imageFile);
      toast.success("Photo uploaded successfully!");
    } else {
      toast.error("Please upload an image file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onPhotoSelect(file);
      toast.success("Photo uploaded successfully!");
    } else {
      toast.error("Please upload an image file");
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card
        className={`
          relative border-2 border-dashed transition-all duration-300 cursor-pointer
          ${dragOver ? 'border-primary bg-primary/5 scale-105' : 'border-primary/30 hover:border-primary/50'}
          ${selectedPhoto ? 'border-solid border-primary' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <div className="p-8 text-center">
          {selectedPhoto ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={URL.createObjectURL(selectedPhoto)}
                  alt="Selected"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Click to change photo
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Upload Your Photo
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your photo here, or click to browse
                </p>
                <Button variant="squid" size="sm">
                  Choose Photo
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};