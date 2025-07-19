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

      // Frame 1: Original image (2 seconds)
      ctx.drawImage(img, 0, 0, width, height);
      gif.addFrame(canvas, { delay: 2000 });
      setProgress(25);

      // Frames 2-7: Cross fade-in animation (0.2 seconds each)
      for (let i = 0; i < 6; i++) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Draw red cross with smooth fade-in opacity
        const opacity = (i + 1) / 6;
        ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.lineWidth = Math.max(8, width / 100);
        ctx.lineCap = 'round';
        
        const crossSize = Math.min(width, height) * 0.8;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.beginPath();
        // Draw complete cross with varying opacity
        ctx.moveTo(centerX - crossSize / 2, centerY - crossSize / 2);
        ctx.lineTo(centerX + crossSize / 2, centerY + crossSize / 2);
        ctx.moveTo(centerX + crossSize / 2, centerY - crossSize / 2);
        ctx.lineTo(centerX - crossSize / 2, centerY + crossSize / 2);
        ctx.stroke();
        
        gif.addFrame(canvas, { delay: 200 });
        setProgress(25 + (i + 1) * 10);
      }

      // Final frame: Black and white image with red cross (2 seconds)
      ctx.clearRect(0, 0, width, height);
      
      // Convert image to black and white
      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(img, 0, 0, width, height);
      ctx.filter = 'none';
      
      // Draw complete red cross on black and white image
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