import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
// @ts-ignore
import GIF from "gif.js";

interface GifGeneratorProps {
  photo: File;
  onGifGenerated: (gifBlob: Blob) => void;
}

export const GifGenerator = ({ photo, onGifGenerated }: GifGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateGif = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Load the image
      const img = new Image();
      img.src = URL.createObjectURL(photo);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Set canvas size to match image (max 800px)
      const maxSize = 800;
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;

      // Initialize GIF
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: width,
        height: height,
        workerScript: '/gif.worker.js'
      });

      // Frame 1: Original image (1 second)
      ctx.drawImage(img, 0, 0, width, height);
      gif.addFrame(canvas, { delay: 1000 });
      setProgress(20);

      // Frames 2-4: Cross animation (0.3 seconds each)
      for (let i = 0; i < 3; i++) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Draw red cross
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = Math.max(8, width / 100);
        ctx.lineCap = 'round';
        
        // Animate cross drawing
        const progress = (i + 1) / 3;
        const crossSize = Math.min(width, height) * 0.8;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.beginPath();
        // First line (top-left to bottom-right)
        if (progress >= 0.5) {
          ctx.moveTo(centerX - crossSize / 2, centerY - crossSize / 2);
          ctx.lineTo(centerX + crossSize / 2, centerY + crossSize / 2);
        } else {
          const lineProgress = progress * 2;
          ctx.moveTo(centerX - crossSize / 2, centerY - crossSize / 2);
          ctx.lineTo(
            centerX - crossSize / 2 + (crossSize * lineProgress),
            centerY - crossSize / 2 + (crossSize * lineProgress)
          );
        }
        
        // Second line (top-right to bottom-left)
        if (progress === 1) {
          ctx.moveTo(centerX + crossSize / 2, centerY - crossSize / 2);
          ctx.lineTo(centerX - crossSize / 2, centerY + crossSize / 2);
        } else if (progress > 0.5) {
          const lineProgress = (progress - 0.5) * 2;
          ctx.moveTo(centerX + crossSize / 2, centerY - crossSize / 2);
          ctx.lineTo(
            centerX + crossSize / 2 - (crossSize * lineProgress),
            centerY - crossSize / 2 + (crossSize * lineProgress)
          );
        }
        
        ctx.stroke();
        
        gif.addFrame(canvas, { delay: 300 });
        setProgress(20 + (i + 1) * 20);
      }

      // Final frame: Complete cross (2 seconds)
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Draw complete red cross
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = Math.max(8, width / 100);
      ctx.lineCap = 'round';
      
      const crossSize = Math.min(width, height) * 0.8;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX - crossSize / 2, centerY - crossSize / 2);
      ctx.lineTo(centerX + crossSize / 2, centerY + crossSize / 2);
      ctx.moveTo(centerX + crossSize / 2, centerY - crossSize / 2);
      ctx.lineTo(centerX - crossSize / 2, centerY + crossSize / 2);
      ctx.stroke();
      
      gif.addFrame(canvas, { delay: 2000 });
      setProgress(90);

      // Render GIF
      gif.on('progress', (p: number) => {
        setProgress(90 + p * 10);
      });

      gif.on('finished', (blob: Blob) => {
        setProgress(100);
        onGifGenerated(blob);
        toast.success("GIF generated successfully! 🎬");
        setIsGenerating(false);
      });

      gif.render();
      
    } catch (error) {
      console.error('Error generating GIF:', error);
      toast.error("Failed to generate GIF. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 text-center">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Ready to Generate Your GIF?
          </h3>
          <p className="text-muted-foreground">
            Click below to create your Squid Game elimination GIF
          </p>
        </div>

        {isGenerating && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Generating GIF... {Math.round(progress)}%
            </p>
          </div>
        )}

        <Button
          variant="destructive"
          size="lg"
          onClick={generateGif}
          disabled={isGenerating}
          className="animate-pulse-red"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate GIF
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};