import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface FrameUploadProps {
  onFramesSelect: (files: File[]) => void;
  selectedFrames: File[];
  onClear: () => void;
}

export const FrameUpload = ({ onFramesSelect, selectedFrames, onClear }: FrameUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const frameFiles = Array.from(files).filter(file => {
      if (file.type.startsWith('image/')) {
        return true;
      } else {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
    });

    if (frameFiles.length > 0) {
      onFramesSelect(frameFiles);
      toast.success(`${frameFiles.length} frames uploaded successfully!`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFrame = (index: number) => {
    const newFrames = selectedFrames.filter((_, i) => i !== index);
    onFramesSelect(newFrames);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Upload GIF Frames
          </h3>
          <p className="text-muted-foreground text-sm">
            Upload PNG frames to create your GIF animation
          </p>
        </div>

        {selectedFrames.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-medium">
                  Drop your PNG frames here or click to browse
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Supports PNG, JPG, JPEG formats
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedFrames.length} frames uploaded
              </p>
              <Button variant="outline" size="sm" onClick={onClear}>
                <X className="w-4 h-4" />
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {selectedFrames.map((frame, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(frame)}
                      alt={`Frame ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFrame(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    {index + 1}
                  </p>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleClick}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add More Frames
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        )}
      </div>
    </Card>
  );
};