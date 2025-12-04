-- Create feedback table for user corrections
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.analysis_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_correct BOOLEAN NOT NULL,
  user_verdict TEXT CHECK (user_verdict IN ('real', 'fake')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.user_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert feedback
CREATE POLICY "Users can insert feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_feedback_analysis ON public.user_feedback(analysis_id);
CREATE INDEX idx_user_feedback_user ON public.user_feedback(user_id);