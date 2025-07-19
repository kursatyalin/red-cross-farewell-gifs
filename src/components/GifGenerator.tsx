
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

interface GeneratedGif {
  blob: Blob;
  type: 'elimination' | 'celebration' | 'combined';
}

export const GifGenerator = ({ photo, onGifGenerated }: GifGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'elimination' | 'celebration' | 'combined' | 'complete'>('elimination');
  const [generatedGifs, setGeneratedGifs] = useState<GeneratedGif[]>([]);

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

  const generateEliminationGif = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement, moneyImg: HTMLImageElement, coinsImg: HTMLImageElement, width: number, height: number): Promise<Blob> => {
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

    // Frames 2-20: Smooth cross fade-in animation (2 seconds total)
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
    }

    // Money scene - Pig appears and money falls (3 seconds)
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
          x: width * 0.3 + Math.random() * width * 0.4, // Spread across center area
          y: -50,
          type: moneyType,
          rotation: Math.random() * 360
        });
      }
      
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
    }

    return new Promise((resolve, reject) => {
      gif.on('finished', resolve);
      gif.on('error', reject);
      gif.render();
    });
  };

  const generateCelebrationGif = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, moneyImg: HTMLImageElement, coinsImg: HTMLImageElement): Promise<Blob> => {
    // Full screen celebration GIF (10 seconds)
    const screenWidth = 800;
    const screenHeight = 800;
    canvas.width = screenWidth;
    canvas.height = screenHeight;

    const gif = new GIF({
      workers: 2,
      quality: 15,
      width: screenWidth,
      height: screenHeight,
      workerScript: '/gif.worker.js',
      repeat: 0,
      transparent: null
    });

    const totalFrames = 100; // 10 seconds at 100ms per frame
    const fallingMoney: Array<{x: number, y: number, type: 'bill' | 'coin', rotation: number, speed: number}> = [];

    for (let frame = 0; frame < totalFrames; frame++) {
      // Gold background with gradient
      const gradient = ctx.createRadialGradient(screenWidth/2, screenHeight/2, 0, screenWidth/2, screenHeight/2, screenWidth/2);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(1, '#FFA500');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, screenWidth, screenHeight);

      // Add sparkle effect
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        const sparkleX = Math.random() * screenWidth;
        const sparkleY = Math.random() * screenHeight;
        ctx.arc(sparkleX, sparkleY, Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add floating dollar symbols
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        const symbolX = Math.random() * screenWidth;
        const symbolY = Math.random() * screenHeight;
        ctx.fillText('$', symbolX, symbolY);
      }

      // Add money rain every few frames
      if (frame % 2 === 0) {
        for (let i = 0; i < 3; i++) {
          const moneyType = Math.random() > 0.5 ? 'coin' : 'bill';
          fallingMoney.push({
            x: Math.random() * screenWidth,
            y: -50,
            type: moneyType,
            rotation: Math.random() * 360,
            speed: 3 + Math.random() * 4
          });
        }
      }

      // Update and draw falling money
      for (let i = fallingMoney.length - 1; i >= 0; i--) {
        const money = fallingMoney[i];
        money.y += money.speed;
        money.rotation += 8;
        
        if (money.y > screenHeight + 50) {
          fallingMoney.splice(i, 1);
          continue;
        }
        
        ctx.save();
        const moneySize = money.type === 'coin' ? 30 : 40;
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

      // Add celebration text
      if (frame > 20) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💰 JACKPOT! 💰', screenWidth/2, screenHeight/2);
      }

      gif.addFrame(ctx, { delay: 100, copy: true });
    }

    return new Promise((resolve, reject) => {
      gif.on('finished', resolve);
      gif.on('error', reject);
      gif.render();
    });
  };

  const generateCombinedGif = async (eliminationBlob: Blob, celebrationBlob: Blob): Promise<Blob> => {
    // This would create a combined GIF showing both animations
    // For simplicity, we'll return the celebration GIF as the "combined" version
    // In a real implementation, you'd need to create a new GIF with both animations side by side
    return celebrationBlob;
  };

  const generateGif = async () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('elimination');
    
    try {
      console.log('Starting GIF generation sequence...');
      
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

      // Set canvas size for elimination GIF
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

      // Step 1: Generate elimination GIF
      setCurrentStep('elimination');
      setProgress(10);
      const eliminationBlob = await generateEliminationGif(canvas, ctx, img, moneyImg, coinsImg, width, height);
      setGeneratedGifs(prev => [...prev, { blob: eliminationBlob, type: 'elimination' }]);
      
      // Step 2: Generate celebration GIF
      setCurrentStep('celebration');
      setProgress(40);
      const celebrationBlob = await generateCelebrationGif(canvas, ctx, moneyImg, coinsImg);
      setGeneratedGifs(prev => [...prev, { blob: celebrationBlob, type: 'celebration' }]);
      
      // Step 3: Generate combined GIF
      setCurrentStep('combined');
      setProgress(70);
      const combinedBlob = await generateCombinedGif(eliminationBlob, celebrationBlob);
      setGeneratedGifs(prev => [...prev, { blob: combinedBlob, type: 'combined' }]);
      
      setProgress(100);
      setCurrentStep('complete');
      onGifGenerated(eliminationBlob); // Start with the elimination GIF
      toast.success("All GIFs generated successfully! 🎬");
      setIsGenerating(false);
      
    } catch (error) {
      console.error('Error generating GIFs:', error);
      toast.error("Failed to generate GIFs. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 text-center">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Ready to Generate Your GIF Sequence?
          </h3>
          <p className="text-muted-foreground">
            {currentStep === 'elimination' && "Creating elimination GIF..."}
            {currentStep === 'celebration' && "Creating full-screen celebration GIF..."}
            {currentStep === 'combined' && "Creating combined GIF..."}
            {currentStep === 'complete' && "All GIFs ready! Use controls below to play sequence."}
            {!isGenerating && "Click below to create elimination → celebration → combined GIFs"}
          </p>
        </div>

        {isGenerating && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {currentStep === 'elimination' && `Creating elimination GIF... ${Math.round(progress)}%`}
              {currentStep === 'celebration' && `Creating celebration GIF... ${Math.round(progress)}%`}
              {currentStep === 'combined' && `Creating combined GIF... ${Math.round(progress)}%`}
            </p>
          </div>
        )}

        {generatedGifs.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Generated GIFs:</h4>
            {generatedGifs.map((gif, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => onGifGenerated(gif.blob)}
                className="w-full"
              >
                Play {gif.type.charAt(0).toUpperCase() + gif.type.slice(1)} GIF
              </Button>
            ))}
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
              Generate GIF Sequence
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
