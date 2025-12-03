import { Hero } from "@/components/Hero";
import { DetectionCard, AnalysisResult } from "@/components/DetectionCard";
import { FileText, Image, Music, Video, Shield, Lock, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const analyzeContent = async (
    input: File | string,
    contentType: "text" | "image" | "audio" | "video"
  ): Promise<AnalysisResult> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to analyze content",
        variant: "destructive",
      });
      navigate("/auth");
      throw new Error("Not authenticated");
    }

    try {
      let requestBody: any = { contentType };

      if (typeof input === "string") {
        requestBody.content = input;
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(input);
        });
        requestBody.fileData = base64;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const result = await response.json();

      toast({
        title: "Analysis Complete",
        description: `Authenticity: ${result.authenticity}%`,
      });

      navigate("/results", {
        state: {
          ...result,
          contentPreview: typeof input === "string" ? input.substring(0, 300) : `${contentType} file analyzed`,
        },
      });

      return result;
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Analysis failed",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Hero />

      <section id="detection" className="py-24 px-4 relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(280_100%_65%/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(280_100%_65%/0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[150px]" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Cpu className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Neural Network Analysis</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
              <span className="text-gradient">CHOOSE YOUR</span>
              <br />
              <span className="text-foreground">DETECTION TYPE</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select the type of content you want to verify for authenticity
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <DetectionCard
              icon={<FileText className="h-6 w-6" />}
              title="News Article"
              description="Analyze text content for fake news and misinformation"
              contentType="text"
              onAnalyze={analyzeContent}
              showTextInput
            />

            <DetectionCard
              icon={<Image className="h-6 w-6" />}
              title="Image Detection"
              description="Detect manipulated or AI-generated images"
              acceptType="image/*"
              contentType="image"
              onAnalyze={analyzeContent}
            />

            <DetectionCard
              icon={<Music className="h-6 w-6" />}
              title="Audio Analysis"
              description="Verify audio authenticity and detect deepfakes"
              acceptType="audio/*"
              contentType="audio"
              onAnalyze={analyzeContent}
              warningMessage="⚠️ Experimental feature with limited accuracy. Results should be verified through additional methods."
            />

            <DetectionCard
              icon={<Video className="h-6 w-6" />}
              title="Video Verification"
              description="Identify manipulated or synthetic video content"
              acceptType="video/*"
              contentType="video"
              onAnalyze={analyzeContent}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Military-Grade Security",
                description: "Your data is protected with end-to-end encryption and never stored permanently"
              },
              {
                icon: Cpu,
                title: "Advanced AI Models",
                description: "Powered by state-of-the-art neural networks trained on millions of samples"
              },
              {
                icon: Lock,
                title: "Privacy First",
                description: "Analysis happens in real-time with no data retention or third-party sharing"
              }
            ].map((feature, i) => (
              <div key={i} className="gradient-border p-8 text-center group hover:scale-105 transition-all duration-500">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 group-hover:glow-primary transition-all duration-500">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="container mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-black tracking-tight">FAKEGUARD</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 FakeGuard. Protecting truth with AI technology.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
