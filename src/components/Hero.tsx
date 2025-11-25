import { Shield, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-detection.jpg";

export const Hero = () => {
  const navigate = useNavigate();
  
  const scrollToDetection = () => {
    document.getElementById("detection")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Fake content detection technology" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/95 to-background/90" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Content Authentication</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Detect Fake Content
            <span className="block text-primary mt-2">With Confidence</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Advanced AI technology to authenticate news articles, images, audio, and video content in seconds
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={scrollToDetection}
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-elevated transition-all duration-300 group"
            >
              <Shield className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Start Detection
            </Button>
            <Button size="lg" variant="outline" onClick={scrollToDetection}>
              See How It Works
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/dashboard")}>
              <BarChart3 className="mr-2 h-5 w-5" />
              View Analytics
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-8 justify-center items-center pt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>99.8% Accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Instant Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Privacy Focused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};
