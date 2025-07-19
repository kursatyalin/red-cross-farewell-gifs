
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
// @ts-ignore
import GIF from "gif.js";
import pigBankImg from "@/assets/pig-bank.png";
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
      
      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Load all images
      const img = new Image();
      img.src = URL.createObjectURL(photo);
      
      const pigImg = new Image();
      pigImg.src = pigBankImg;
      
      const moneyImg = new Image();
      moneyImg.src = moneyBillsImg;
      
      const coinsImg = new Image();
      coinsImg.src = goldCoinsImg;
      
      await Promise.all([
        new Promise((resolve) => { img.onload = resolve; }),
        new Promise((resolve) => { pigImg.onload = resolve; }),
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

      // Frame 1: Original image (3 seconds)
      ctx.drawImage(img, 0, 0, width, height);
      gif.addFrame(ctx, { delay: 3000, copy: true });
      setProgress(10);
      console.log('Added frame 1: Original image');

      // Frames 2-20: Smooth cross fade-in animation (2 seconds total)
      const fadeFrames = 20;
      const fadeDelay = Math.round(2000 / fadeFrames); // ~100ms per frame
      
      for (let i = 0; i < fadeFrames; i++) {
        // Clear and redraw original image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Calculate smooth opacity progression
        const opacity = (i + 1) / fadeFrames;
        
        // Draw red cross with progressive opacity - stretch to edges and thicker
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.lineWidth = Math.min(width, height) * 0.02; // Thicker line
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        // Diagonal from top-left to bottom-right
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        // Diagonal from top-right to bottom-left  
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        ctx.restore();
        
        gif.addFrame(ctx, { delay: fadeDelay, copy: true });
        setProgress(10 + (i + 1) * 4);
        console.log(`Added fade frame ${i + 1}/${fadeFrames}, opacity: ${opacity.toFixed(2)}`);
      }

      // Final frames: Black and white image with red cross (2 seconds)
      for (let loop = 0; loop < 4; loop++) {
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
        
        // Make cross stretch to edges and thicker
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.lineWidth = Math.min(width, height) * 0.02; // Thicker line
        
        ctx.beginPath();
        // Diagonal from top-left to bottom-right
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height);
        // Diagonal from top-right to bottom-left  
        ctx.moveTo(width, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        ctx.restore();
        
        gif.addFrame(ctx, { delay: 500, copy: true });
        setProgress(60 + loop * 2);
        console.log(`Added final frame ${loop + 1}/4`);
      }

      // NEW: Money scene - Pig appears and money falls (3 seconds)
      const moneyFrames = 30; // 3 seconds at 100ms per frame
      const moneyDelay = 100;
      
      // Create array to track falling money positions
      const fallingMoney: Array<{x: number, y: number, type: 'bill' | 'coin', rotation: number}> = [];
      
      for (let frame = 0; frame < moneyFrames; frame++) {
        // Start with grayscale eliminated image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        convertToGrayscale(canvas, ctx);
        
        // Draw red cross
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
        
        // Calculate pig animation (slides in from top)
        const pigProgress = Math.min(frame / 8, 1); // Pig fully appears by frame 8
        const pigSize = Math.min(width, height) * 0.15;
        const pigX = width * 0.75 - pigSize / 2;
        const pigY = -pigSize + (pigSize * 1.2 * pigProgress); // Slides down from top
        
        // Draw pig bank
        if (pigProgress > 0) {
          ctx.save();
          ctx.globalAlpha = pigProgress;
          ctx.drawImage(pigImg, pigX, pigY, pigSize, pigSize);
          ctx.restore();
        }
        
        // Add new falling money every 2-3 frames
        if (frame > 5 && frame % 3 === 0) {
          const moneyType = Math.random() > 0.6 ? 'coin' : 'bill';
          fallingMoney.push({
            x: pigX + pigSize / 2 + (Math.random() - 0.5) * pigSize,
            y: pigY + pigSize,
            type: moneyType,
            rotation: Math.random() * 360
          });
        }
        
        // Update and draw falling money
        for (let i = fallingMoney.length - 1; i >= 0; i--) {
          const money = fallingMoney[i];
          money.y += height * 0.05; // Fall speed
          money.rotation += 5; // Spinning effect
          
          // Remove money that has fallen off screen
          if (money.y > height + 50) {
            fallingMoney.splice(i, 1);
            continue;
          }
          
          // Draw the money
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
        setProgress(70 + frame * 0.5);
        console.log(`Added money frame ${frame + 1}/${moneyFrames}`);
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
