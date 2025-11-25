import { Hero } from "@/components/Hero";
import { DetectionCard, AnalysisResult } from "@/components/DetectionCard";
import { FileText, Image, Music, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const analyzeContent = async (
    input: File | string,
    contentType: "text" | "image" | "audio" | "video"
  ): Promise<AnalysisResult> => {
    try {
      let requestBody: any = { contentType };

      if (typeof input === "string") {
        // Text content
        requestBody.content = input;
      } else {
        // File content - convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(input);
        });
        requestBody.fileData = base64;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

      // Navigate to results page with data
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

      <section id="detection" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Detection Type
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

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 FakeGuard. Protecting truth with AI technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
