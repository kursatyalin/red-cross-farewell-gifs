import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
// @ts-ignore
import GIF from "gif.js";

interface PigGifGeneratorProps {
  onGifGenerated: (gifBlob: Blob) => void;
}

export const PigGifGenerator = ({ onGifGenerated }: PigGifGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFrames, setUploadedFrames] = useState<File[]>([]);

  const handleFrameUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFrames(files);
    toast.success(`${files.length} frames uploaded!`);
  };

  const generateGif = async () => {
    if (uploadedFrames.length === 0) {
      toast.error("Please upload frame images first!");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    
    try {
      console.log('Starting GIF generation from frames...');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Load all frame images
      const frameImages: HTMLImageElement[] = [];
      
      for (let i = 0; i < uploadedFrames.length; i++) {
        const img = new Image();
        img.src = URL.createObjectURL(uploadedFrames[i]);
        await new Promise((resolve) => { img.onload = resolve; });
        frameImages.push(img);
        setProgress((i + 1) / uploadedFrames.length * 30);
      }

      // Set canvas size based on first frame
      const firstFrame = frameImages[0];
      canvas.width = firstFrame.width;
      canvas.height = firstFrame.height;

      // Initialize GIF
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: '/gif.worker.js',
        repeat: 0,
        transparent: null
      });

      setProgress(40);

      // Add all frames to the GIF
      frameImages.forEach((img, index) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        gif.addFrame(ctx, { delay: 200, copy: true }); // 200ms per frame
        setProgress(40 + (index + 1) / frameImages.length * 50);
      });

      setProgress(95);

      // Render GIF
      gif.on('progress', (p: number) => {
        setProgress(95 + p * 5);
      });

      gif.on('finished', (blob: Blob) => {
        setProgress(100);
        onGifGenerated(blob);
        toast.success("Pig bank GIF generated successfully! 🐷💰");
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
            Pig Bank GIF Generator
          </h3>
          <p className="text-muted-foreground">
            Upload your pig bank frames and create an animated GIF
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFrameUpload}
              className="hidden"
              id="frame-upload"
            />
            <label htmlFor="frame-upload" className="cursor-pointer">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload frame images (PNG/JPG)
                </p>
                {uploadedFrames.length > 0 && (
                  <p className="text-sm text-primary font-medium">
                    {uploadedFrames.length} frames uploaded
                  </p>
                )}
              </div>
            </label>
          </div>

          {isGenerating && (
            <div className="space-y-3">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Generating pig bank GIF... {Math.round(progress)}%
              </p>
            </div>
          )}

          <Button
            variant="default"
            size="lg"
            onClick={generateGif}
            disabled={isGenerating || uploadedFrames.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Animation...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate Pig Bank GIF
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};