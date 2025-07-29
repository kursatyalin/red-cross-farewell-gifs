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
import pigBankImg from "@/assets/pig-bank.png";

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
      
      const pigImg = new Image();
      pigImg.src = pigBankImg;
      
      await Promise.all([
        new Promise((resolve) => { img.onload = resolve; }),
        new Promise((resolve) => { moneyImg.onload = resolve; }),
        new Promise((resolve) => { coinsImg.onload = resolve; }),
        new Promise((resolve) => { pigImg.onload = resolve; })
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

      // Pig animation frames (3 seconds)
      const pigFrames = 30;
      const pigDelay = 100;
      
      for (let i = 0; i < pigFrames; i++) {
        ctx.clearRect(0, 0, width, height);
        
        // Dark background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        // Draw pig bank in center (bigger size)
        const pigSize = Math.min(width, height) * 0.6;
        const pigX = (width - pigSize) / 2;
        const pigY = (height - pigSize) / 2;
        
        // Add slight bounce animation to pig
        const bounce = Math.sin(i * 0.2) * 3;
        ctx.drawImage(pigImg, pigX, pigY + bounce, pigSize, pigSize);
        
        // Draw falling money bills with realistic physics
        const numBills = 12;
        for (let j = 0; j < numBills; j++) {
          const fallSpeed = 2 + (j % 3);
          const sway = Math.sin((i + j * 30) * 0.1) * 20;
          const billX = (j * width / numBills) + sway + (j * 13) % 50;
          const billY = ((i * fallSpeed + j * 50) % (height + 150)) - 100;
          const billSize = 40 + (j % 4) * 15;
          
          if (billY > -50 && billY < height + 50) {
            ctx.save();
            ctx.translate(billX + billSize/2, billY + billSize/2);
            ctx.rotate((i * 0.05 + j * 0.3) % (Math.PI * 2));
            ctx.globalAlpha = 0.9;
            ctx.drawImage(moneyImg, -billSize/2, -billSize/2, billSize, billSize * 0.6);
            ctx.restore();
          }
        }
        
        // Draw falling coins with gravity effect
        const numCoins = 10;
        for (let k = 0; k < numCoins; k++) {
          const gravity = 3 + (k % 2);
          const coinX = (k * width / numCoins) + Math.sin((i + k * 20) * 0.15) * 15 + (k * 17) % 40;
          const coinY = ((i * gravity + k * 40) % (height + 120)) - 80;
          const coinSize = 25 + (k % 3) * 10;
          
          if (coinY > -30 && coinY < height + 30) {
            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.drawImage(coinsImg, coinX, coinY, coinSize, coinSize);
            ctx.restore();
          }
        }
        
        gif.addFrame(ctx, { delay: pigDelay, copy: true });
        setProgress(78 + (i + 1) * 0.5);
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