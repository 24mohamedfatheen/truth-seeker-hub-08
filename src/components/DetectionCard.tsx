import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Upload, Loader2, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetectionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  acceptType?: string;
  contentType: "text" | "image" | "audio" | "video";
  onAnalyze: (file: File | string, contentType: "text" | "image" | "audio" | "video") => Promise<AnalysisResult>;
  showTextInput?: boolean;
  warningMessage?: string;
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
  warningMessage,
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
    <div className="gradient-border group hover:scale-[1.02] transition-all duration-500">
      <div className="p-6 bg-card rounded-[calc(var(--radius)-1px)]">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary group-hover:glow-primary transition-all duration-500">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1 tracking-tight">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {/* Warning Message */}
          {warningMessage && (
            <Alert className="bg-warning/10 border-warning/30 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm text-warning">
                {warningMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Input Area */}
          <div className="space-y-4">
            {showTextInput ? (
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste the news article text here..."
                className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-secondary/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
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
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border/70 rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 group/upload"
                >
                  <div className="p-3 rounded-full bg-secondary mb-3 group-hover/upload:bg-primary/20 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground group-hover/upload:text-primary transition-colors" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover/upload:text-foreground transition-colors">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </span>
                </label>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={analyzing || (!file && !textInput)}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-30 transition-all duration-300"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Analyze Content
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Authenticity Score</span>
                  <span className={cn("text-lg font-black", getStatusColor(result.status))}>
                    {result.authenticity}%
                  </span>
                </div>
                <Progress 
                  value={result.authenticity} 
                  className={cn(
                    "h-3 rounded-full bg-secondary",
                    result.status === "authentic" && "[&>div]:bg-gradient-to-r [&>div]:from-success [&>div]:to-accent",
                    result.status === "suspicious" && "[&>div]:bg-gradient-to-r [&>div]:from-warning [&>div]:to-destructive",
                    result.status === "fake" && "[&>div]:bg-gradient-to-r [&>div]:from-destructive [&>div]:to-primary"
                  )}
                />
              </div>

              <div className={cn(
                "flex items-start gap-3 p-4 rounded-xl border",
                result.status === "authentic" && "bg-success/10 border-success/30",
                result.status === "suspicious" && "bg-warning/10 border-warning/30",
                result.status === "fake" && "bg-destructive/10 border-destructive/30"
              )}>
                <div className={getStatusColor(result.status)}>
                  {getStatusIcon(result.status)}
                </div>
                <div className="flex-1">
                  <p className={cn("font-bold mb-1 capitalize", getStatusColor(result.status))}>
                    {result.status}
                  </p>
                  <p className="text-sm text-muted-foreground">{result.details}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
