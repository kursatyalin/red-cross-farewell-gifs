import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
// @ts-ignore
import GIF from "gif.js";
import moneyBillsImg from "@/assets/money-bills.png";
import goldCoinsImg from "@/assets/gold-coins.png";

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
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Load required images
      const img = new Image();
      img.src = URL.createObjectURL(photo);
      
      const moneyImg = new Image();
      moneyImg.src = moneyBillsImg;
      
      const coinsImg = new Image();
      coinsImg.src = goldCoinsImg;
      
      await Promise.all([
        new Promise((resolve) => { img.onload = resolve; }),
        new Promise((resolve) => { moneyImg.onload = resolve; }),
        new Promise((resolve) => { coinsImg.onload = resolve; })
      ]);

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
        quality: 15,
        width: width,
        height: height,
        workerScript: '/gif.worker.js',
        repeat: 0,
        transparent: null
      });

      // Frame 1: Original image (3 seconds)
      ctx.drawImage(img, 0, 0, width, height);
      gif.addFrame(ctx, { delay: 3000, copy: true });
      setProgress(10);

      // Frames 2-20: Smooth cross fade-in animation (2 seconds)
      const fadeFrames = 20;
      const fadeDelay = Math.round(2000 / fadeFrames);
      
      for (let i = 0; i < fadeFrames; i++) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const opacity = (i + 1) / fadeFrames;
        
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.lineWidth = Math.min(width, height) * 0.02;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        ctx.restore();
        
        gif.addFrame(ctx, { delay: fadeDelay, copy: true });
        setProgress(10 + (i + 1) * 3);
      }

      // Final frames: Black and white image with red cross (2 seconds)
      for (let loop = 0; loop < 4; loop++) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        convertToGrayscale(canvas, ctx);
        
        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = Math.min(width, height) * 0.02;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        ctx.restore();
        
        gif.addFrame(ctx, { delay: 500, copy: true });
        setProgress(70 + loop * 2);
      }

      // Add pig bank money animation at the end (3 seconds)
      const pigFrames = 30; // 30 frames for smooth animation
      for (let i = 0; i < pigFrames; i++) {
        ctx.clearRect(0, 0, width, height);
        
        // Create a dark background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        // Draw pig bank
        const pigSize = Math.min(width, height) * 0.3;
        const pigX = width / 2;
        const pigY = height / 2;
        
        // Pig body
        ctx.save();
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.ellipse(pigX, pigY, pigSize * 0.8, pigSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pig snout
        ctx.fillStyle = '#ff8e8e';
        ctx.beginPath();
        ctx.ellipse(pigX, pigY + pigSize * 0.2, pigSize * 0.3, pigSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pig eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(pigX - pigSize * 0.2, pigY - pigSize * 0.1, pigSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pigX + pigSize * 0.2, pigY - pigSize * 0.1, pigSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Animated money falling
        const numBills = 15;
        for (let j = 0; j < numBills; j++) {
          const x = (width / numBills) * j + (Math.sin(i * 0.3 + j) * 20);
          const y = (i * 10 + j * 50) % (height + 100) - 50;
          
          // Draw money bill
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((i + j) * 0.1);
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(-15, -8, 30, 16);
          ctx.fillStyle = '#388E3C';
          ctx.fillRect(-12, -5, 24, 10);
          ctx.fillStyle = '#fff';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('$', 0, 2);
          ctx.restore();
        }
        
        // Add coins
        const numCoins = 10;
        for (let k = 0; k < numCoins; k++) {
          const x = (width / numCoins) * k + (Math.cos(i * 0.2 + k) * 30);
          const y = (i * 8 + k * 60) % (height + 100) - 50;
          
          // Draw coin
          ctx.save();
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFA000';
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        
        ctx.restore();
        
        gif.addFrame(ctx, { delay: 100, copy: true });
        setProgress(78 + (i / pigFrames) * 17);
      }

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
            Click below to create your layoff game GIF
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
              Generate Elimination GIF
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};