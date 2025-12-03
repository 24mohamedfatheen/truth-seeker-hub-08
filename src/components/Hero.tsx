import { Shield, Sparkles, BarChart3, Zap, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AuthHeader } from "@/components/AuthHeader";

export const Hero = () => {
  const navigate = useNavigate();
  
  const scrollToDetection = () => {
    document.getElementById("detection")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Auth Header */}
      <div className="absolute top-6 right-6 z-20">
        <AuthHeader />
      </div>

      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(280_100%_65%/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(280_100%_65%/0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-[200px]" />
        
        {/* Scanline effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-[scanline_8s_linear_infinite]" />
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl space-y-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 text-sm font-medium animate-float">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-gradient font-semibold">AI-Powered Authentication</span>
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
              <span className="text-foreground">DETECT</span>
              <br />
              <span className="text-gradient">FAKE CONTENT</span>
            </h1>
            <div className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-light text-muted-foreground">
              <Scan className="h-6 w-6 text-primary" />
              <span>WITH CONFIDENCE</span>
              <Scan className="h-6 w-6 text-accent" />
            </div>
          </div>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Advanced neural networks analyze news articles, images, audio, and video 
            to protect you from misinformation and deepfakes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              size="lg" 
              onClick={scrollToDetection}
              className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary transition-all duration-300 group"
            >
              <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Start Detection
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={scrollToDetection}
              className="h-14 px-8 text-base font-semibold border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
            >
              <Shield className="mr-2 h-5 w-5" />
              How It Works
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="h-14 px-8 text-base font-semibold hover:bg-accent/10 hover:text-accent transition-all duration-300"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Analytics
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-16 max-w-3xl mx-auto">
            {[
              { value: "99.8%", label: "Accuracy Rate" },
              { value: "<2s", label: "Analysis Time" },
              { value: "256-bit", label: "Encryption" },
            ].map((stat, i) => (
              <div key={i} className="gradient-border p-6 text-center">
                <div className="text-3xl md:text-4xl font-black text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};
