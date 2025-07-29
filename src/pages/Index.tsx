import { useState } from "react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { GifGenerator } from "@/components/GifGenerator";
import { PigGifGenerator } from "@/components/PigGifGenerator";
import { GifPreview } from "@/components/GifPreview";
import { Button } from "@/components/ui/button";
import { X, Github, Heart } from "lucide-react";

const Index = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [generatedGif, setGeneratedGif] = useState<Blob | null>(null);

  const handlePhotoSelect = (file: File) => {
    setSelectedPhoto(file);
    setGeneratedGif(null);
  };

  const handleClearPhoto = () => {
    setSelectedPhoto(null);
    setGeneratedGif(null);
  };

  const handleGifGenerated = (gifBlob: Blob) => {
    setGeneratedGif(gifBlob);
  };

  const handleReset = () => {
    setSelectedPhoto(null);
    setGeneratedGif(null);
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-danger rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Elimination GIF</h1>
                <p className="text-xs text-muted-foreground">Squid Game Style</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-block p-3 bg-gradient-danger rounded-full mb-4">
              <X className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Layoff Elimination GIF Generator
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Turn your workplace frustration into a therapeutic Squid Game-style elimination GIF.
              Upload your photo and get your dramatic exit scene!
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className={`flex items-center space-x-2 ${selectedPhoto ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPhoto ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                1
              </div>
              <span>Upload Photo</span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className={`flex items-center space-x-2 ${generatedGif ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${generatedGif ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                2
              </div>
              <span>Generate GIF</span>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            {!generatedGif ? (
              <>
                <PhotoUpload
                  onPhotoSelect={handlePhotoSelect}
                  selectedPhoto={selectedPhoto}
                  onClear={handleClearPhoto}
                />
                
                {selectedPhoto && (
                  <div className="animate-fade-in">
                    <GifGenerator
                      photo={selectedPhoto}
                      onGifGenerated={handleGifGenerated}
                    />
                  </div>
                )}
                
                <div className="animate-fade-in">
                  <PigGifGenerator onGifGenerated={handleGifGenerated} />
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <GifPreview
                  gifBlob={generatedGif}
                  onReset={handleReset}
                />
              </div>
            )}
          </div>

          {/* Info Card */}
          {!selectedPhoto && (
            <div className="text-center p-6 bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm">
              <h3 className="font-semibold text-foreground mb-2">How it works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <div className="text-primary font-semibold">1. Upload</div>
                  <p>Select a photo you want to eliminate</p>
                </div>
                <div>
                  <div className="text-primary font-semibold">2. Generate</div>
                  <p>We add the iconic red cross animation</p>
                </div>
                <div>
                  <div className="text-primary font-semibold">3. Share</div>
                  <p>Download and share your elimination GIF</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center space-x-2">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>for those who got eliminated at work</span>
            </p>
            <p className="mt-2 text-xs">
              Remember: Every ending is a new beginning! 💪
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
