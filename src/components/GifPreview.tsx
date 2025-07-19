
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";

interface GifPreviewProps {
  gifBlob: Blob;
  onReset: () => void;
}

export const GifPreview = ({ gifBlob, onReset }: GifPreviewProps) => {
  const downloadGif = () => {
    const url = URL.createObjectURL(gifBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elimination-animated.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Animated GIF downloaded! 📥");
  };

  const shareGif = async () => {
    try {
      if (navigator.share) {
        const file = new File([gifBlob], 'elimination-animated.gif', {
          type: 'image/gif'
        });
        
        await navigator.share({
          title: 'My Elimination GIF',
          text: 'Check out my animated elimination GIF!',
          files: [file]
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/gif': gifBlob
          })
        ]);
        toast.success("GIF copied to clipboard! 📋");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Sharing not supported on this device");
    }
  };

  return (
    <Card className="p-6 text-center">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Your Animated GIF is Ready! 🎬
          </h3>
          <p className="text-muted-foreground">
            Your continuously looping elimination GIF has been generated successfully!
          </p>
        </div>

        <div className="relative group">
          <img
            src={URL.createObjectURL(gifBlob)}
            alt="Generated Animated GIF"
            className="w-full max-w-md mx-auto rounded-lg shadow-red border border-primary/20"
            style={{ 
              imageRendering: 'auto',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
            <p className="text-white font-semibold">Animated Elimination GIF</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="squid"
            onClick={downloadGif}
            className="flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4" />
            Download Animated GIF
          </Button>
          
          <Button
            variant="outline"
            onClick={shareGif}
            className="flex-1 sm:flex-none"
          >
            <Share2 className="w-4 h-4" />
            Share Animation
          </Button>
          
          <Button
            variant="ghost"
            onClick={onReset}
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="w-4 h-4" />
            Create Another
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>🎬 Your GIF loops continuously - perfect for sharing that dramatic elimination moment!</p>
        </div>
      </div>
    </Card>
  );
};
