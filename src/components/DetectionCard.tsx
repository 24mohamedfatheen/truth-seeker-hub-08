import { ReactNode, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetectionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  acceptType?: string;
  contentType: "text" | "image" | "audio" | "video";
  onAnalyze: (file: File | string, contentType: "text" | "image" | "audio" | "video") => Promise<AnalysisResult>;
  showTextInput?: boolean;
}

export interface AnalysisResult {
  authenticity: number;
  status: "authentic" | "suspicious" | "fake";
  details: string;
}

export const DetectionCard = ({
  icon,
  title,
  description,
  acceptType = "*",
  contentType,
  onAnalyze,
  showTextInput = false,
}: DetectionCardProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file && !textInput) return;
    
    setAnalyzing(true);
    try {
      const analysisResult = await onAnalyze(file || textInput, contentType);
      setResult(analysisResult);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status: AnalysisResult["status"]) => {
    switch (status) {
      case "authentic":
        return "text-success";
      case "suspicious":
        return "text-warning";
      case "fake":
        return "text-destructive";
    }
  };

  const getStatusIcon = (status: AnalysisResult["status"]) => {
    switch (status) {
      case "authentic":
        return <CheckCircle className="h-6 w-6" />;
      case "suspicious":
      case "fake":
        return <AlertCircle className="h-6 w-6" />;
    }
  };

  return (
    <Card className="p-6 hover:shadow-elevated transition-all duration-300 bg-gradient-to-br from-card to-card/50 border-border/50">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          {showTextInput ? (
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste the news article text here..."
              className="w-full min-h-[120px] p-4 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <div className="relative">
              <input
                type="file"
                accept={acceptType}
                onChange={handleFileChange}
                className="hidden"
                id={`file-${title}`}
              />
              <label
                htmlFor={`file-${title}`}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "Click to upload or drag and drop"}
                </span>
              </label>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={analyzing || (!file && !textInput)}
            className="w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Content"
            )}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="h-px bg-border" />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Authenticity Score</span>
                <span className={cn("text-sm font-bold", getStatusColor(result.status))}>
                  {result.authenticity}%
                </span>
              </div>
              <Progress 
                value={result.authenticity} 
                className={cn(
                  "h-2",
                  result.status === "authentic" && "[&>div]:bg-success",
                  result.status === "suspicious" && "[&>div]:bg-warning",
                  result.status === "fake" && "[&>div]:bg-destructive"
                )}
              />
            </div>

            <div className={cn("flex items-start gap-3 p-4 rounded-lg", getStatusColor(result.status))}>
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <p className="font-semibold mb-1 capitalize">{result.status}</p>
                <p className="text-sm opacity-90">{result.details}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
