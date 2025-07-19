
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

  const convertToGrayscale = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = gray;     // red
      data[i + 1] = gray; // green
      data[i + 2] = gray; // blue
      // alpha channel (data[i + 3]) stays the same
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const generateGif = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      console.log('Starting GIF generation...');
      
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

      // Initialize GIF with proper settings for animation
      const gif = new GIF({
        workers: 2,
        quality: 15,
        width: width,
        height: height,
        workerScript: '/gif.worker.js',
        repeat: 0, // 0 = infinite loop
        transparent: null
      });

      console.log('GIF initialized with dimensions:', width, 'x', height);

      // Frame 1: Original image (2 seconds)
      ctx.drawImage(img, 0, 0, width, height);
      gif.addFrame(ctx, { delay: 2000, copy: true });
      setProgress(10);
      console.log('Added frame 1: Original image');

      // Frames 2-16: Smooth cross fade-in animation (2 seconds total)
      const fadeFrames = 15;
      const fadeDelay = Math.round(2000 / fadeFrames); // ~133ms per frame
      
      for (let i = 0; i < fadeFrames; i++) {
        // Clear and redraw original image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Calculate smooth opacity progression
        const opacity = (i + 1) / fadeFrames;
        
        // Draw red cross with progressive opacity
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.lineWidth = Math.max(6, width / 120);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const crossSize = Math.min(width, height) * 0.7;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Draw cross lines
        ctx.beginPath();
        ctx.moveTo(centerX - crossSize / 2, centerY - crossSize / 2);
        ctx.lineTo(centerX + crossSize / 2, centerY + crossSize / 2);
        ctx.moveTo(centerX + crossSize / 2, centerY - crossSize / 2);
        ctx.lineTo(centerX - crossSize / 2, centerY + crossSize / 2);
        ctx.stroke();
        ctx.restore();
        
        gif.addFrame(ctx, { delay: fadeDelay, copy: true });
        setProgress(10 + (i + 1) * 4);
        console.log(`Added fade frame ${i + 1}/${fadeFrames}, opacity: ${opacity.toFixed(2)}`);
      }

      // Final frames: Black and white image with red cross (loop back)
      for (let loop = 0; loop < 3; loop++) {
        // Create grayscale version
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        convertToGrayscale(canvas, ctx);
        
        // Draw final red cross
        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = Math.max(6, width / 120);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const crossSize = Math.min(width, height) * 0.7;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.beginPath();
        ctx.moveTo(centerX - crossSize / 2, centerY - crossSize / 2);
        ctx.lineTo(centerX + crossSize / 2, centerY + crossSize / 2);
        ctx.moveTo(centerX + crossSize / 2, centerY - crossSize / 2);
        ctx.lineTo(centerX - crossSize / 2, centerY + crossSize / 2);
        ctx.stroke();
        ctx.restore();
        
        gif.addFrame(ctx, { delay: 1000, copy: true });
        setProgress(70 + loop * 5);
        console.log(`Added final frame ${loop + 1}/3`);
      }

      setProgress(85);

      // Render GIF
      gif.on('progress', (p: number) => {
        setProgress(85 + p * 15);
        console.log('Rendering progress:', Math.round(p * 100) + '%');
      });

      gif.on('finished', (blob: Blob) => {
        console.log('GIF generation completed, blob size:', blob.size);
        setProgress(100);
        onGifGenerated(blob);
        toast.success("Animated GIF generated successfully! 🎬");
        setIsGenerating(false);
      });

      gif.on('error', (error: any) => {
        console.error('GIF generation error:', error);
        toast.error("Failed to generate GIF. Please try again.");
        setIsGenerating(false);
      });

      console.log('Starting GIF render...');
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
            Ready to Generate Your Animated GIF?
          </h3>
          <p className="text-muted-foreground">
            Click below to create your continuously looping elimination GIF
          </p>
        </div>

        {isGenerating && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Generating animated GIF... {Math.round(progress)}%
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
              Generating Animation...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate Animated GIF
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
