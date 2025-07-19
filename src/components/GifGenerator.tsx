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

      // Money scene (3 seconds)
      const moneyFrames = 30;
      const moneyDelay = 100;
      const fallingMoney: Array<{x: number, y: number, type: 'bill' | 'coin', rotation: number}> = [];
      
      for (let frame = 0; frame < moneyFrames; frame++) {
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
        
        // Add new falling money from top center
        if (frame % 3 === 0) {
          const moneyType = Math.random() > 0.6 ? 'coin' : 'bill';
          fallingMoney.push({
            x: width * 0.3 + Math.random() * width * 0.4,
            y: -50,
            type: moneyType,
            rotation: Math.random() * 360
          });
        }
        
        // Update and draw falling money
        for (let i = fallingMoney.length - 1; i >= 0; i--) {
          const money = fallingMoney[i];
          money.y += height * 0.05;
          money.rotation += 5;
          
          if (money.y > height + 50) {
            fallingMoney.splice(i, 1);
            continue;
          }
          
          ctx.save();
          const moneySize = money.type === 'coin' ? 25 : 35;
          ctx.translate(money.x, money.y);
          ctx.rotate((money.rotation * Math.PI) / 180);
          ctx.globalAlpha = 0.9;
          
          if (money.type === 'coin') {
            ctx.drawImage(coinsImg, -moneySize/2, -moneySize/2, moneySize, moneySize);
          } else {
            ctx.drawImage(moneyImg, -moneySize/2, -moneySize/2, moneySize, moneySize);
          }
          ctx.restore();
        }
        
        gif.addFrame(ctx, { delay: moneyDelay, copy: true });
        setProgress(78 + frame * 0.5);
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
            Ready to Generate Your Elimination GIF?
          </h3>
          <p className="text-muted-foreground">
            Click below to create your 10-second elimination GIF with money falling
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