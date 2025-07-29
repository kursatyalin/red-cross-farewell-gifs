import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
// @ts-ignore
import GIF from "gif.js";

interface GifGeneratorProps {
  frames: File[];
  onGifGenerated: (gifBlob: Blob) => void;
}

export const GifGenerator = ({ frames, onGifGenerated }: GifGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateGif = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      console.log('Starting GIF generation from frames...');
      
      if (frames.length === 0) {
        throw new Error('No frames provided');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Load all frame images
      const frameImages = await Promise.all(
        frames.map(frame => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(frame);
          });
        })
      );

      // Set canvas size based on first frame (max 800px)
      const firstImg = frameImages[0];
      const maxSize = 800;
      let { width, height } = firstImg;
      
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
        quality: 15,
        width: width,
        height: height,
        workerScript: '/gif.worker.js',
        repeat: 0,
        transparent: null
      });

      // Add each frame to the GIF
      frameImages.forEach((img, index) => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Default frame delay of 100ms (adjust as needed)
        gif.addFrame(ctx, { delay: 100, copy: true });
        
        const progressPercent = ((index + 1) / frameImages.length) * 90;
        setProgress(progressPercent);
      });

      setProgress(95);

      // Render GIF
      gif.on('progress', (p: number) => {
        setProgress(95 + p * 5);
      });

      gif.on('finished', (blob: Blob) => {
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
            Layoff Games GIF Generator
          </h3>
          <p className="text-muted-foreground">
            Generate GIF from {frames.length} PNG frames
          </p>
        </div>

        {isGenerating && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Generating elimination GIF... {Math.round(progress)}%
            </p>
          </div>
        )}

        <Button
          variant="destructive"
          size="lg"
          onClick={generateGif}
          disabled={isGenerating || frames.length === 0}
          className="animate-pulse-red"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating GIF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate GIF from Frames
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};