import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for database operations
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch past feedback patterns to learn from
async function getFeedbackLearnings(contentType: string): Promise<string> {
  try {
    // Get recent incorrect analyses and user corrections
    const { data: feedback, error } = await supabase
      .from('user_feedback')
      .select(`
        is_correct,
        user_verdict,
        comment,
        analysis_results!inner(
          content_type,
          authenticity_score,
          detailed_analysis
        )
      `)
      .eq('is_correct', false)
      .eq('analysis_results.content_type', contentType)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !feedback || feedback.length === 0) {
      return '';
    }

    const patterns = feedback.map((f: any) => {
      const wasReal = f.analysis_results?.authenticity_score > 70;
      const shouldBe = f.user_verdict || (wasReal ? 'fake' : 'real');
      const reason = f.comment || 'No details provided';
      return `- AI said ${wasReal ? 'REAL' : 'FAKE'} but user corrected to ${shouldBe.toUpperCase()}. Reason: ${reason}`;
    }).join('\n');

    return `
LEARN FROM PAST MISTAKES - Users corrected these analyses:
${patterns}

Use these corrections to improve your accuracy. Pay special attention to patterns where the AI was wrong.
`;
  } catch (e) {
    console.error('Error fetching feedback:', e);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, content, fileData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SEARCH1API_KEY = Deno.env.get('SEARCH1API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing content type:', contentType);

    // Get feedback learnings for this content type
    const feedbackLearnings = await getFeedbackLearnings(contentType);
    console.log('Feedback learnings loaded:', feedbackLearnings ? 'yes' : 'no');

    let analysisPrompt = '';
    let messages: any[] = [];
    let model = 'google/gemini-2.5-flash';
    let apiKeyUsed: number | undefined = undefined; // Track which API key was used for text analysis

    // Multiple Search1API keys for fallback
    const search1ApiKeys = [
      SEARCH1API_KEY,
      '3128939A-7BC7-4E25-9D2D-5B1DBC56388C',
      'DF50ACC8-B148-4ECD-9A70-68B814BA22B5',
      '9FB564F9-8307-4878-B90E-7AE12149A714'
    ].filter(Boolean);

    switch (contentType) {
      case 'text':
        // Use search1api to verify news articles with fallback keys
        if (search1ApiKeys.length === 0) {
          throw new Error('No Search1API keys configured');
        }

        console.log('Using search1api for news article verification');
        
        let searchResults: any[] = [];
        let searchSuccess = false;
        let apiKeyUsed = 0; // Track which key was used (1-indexed for display)
        
        // Try each API key until one works
        for (let i = 0; i < search1ApiKeys.length; i++) {
          const apiKey = search1ApiKeys[i];
          try {
            console.log(`Trying Search1API key ${i + 1}...`);
            const searchResponse = await fetch('https://api.search1api.com/search', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: content.substring(0, 500),
                max_results: 5,
                search_service: 'google'
              }),
            });

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              searchResults = searchData.results || [];
              searchSuccess = true;
              apiKeyUsed = i + 1; // 1-indexed
              console.log(`Search1API succeeded with key #${apiKeyUsed}`);
              break;
            } else {
              console.log(`Search1API key ${i + 1} failed with status ${searchResponse.status}, trying next...`);
            }
          } catch (e) {
            console.log(`Search1API key ${i + 1} error, trying next...`, e);
          }
        }
        
        if (!searchSuccess) {
          console.error('All Search1API keys failed');
          throw new Error('Failed to verify article - all API keys exhausted');
        }
        
        analysisPrompt = `Analyze if this news article contains TRUE or FALSE information by comparing it against reference sources.

Article to verify:
${content}

Reference Sources Found:
${searchResults.map((r: any, i: number) => `${i + 1}. ${r.title} - ${r.snippet} (URL: ${r.url})`).join('\n')}

${feedbackLearnings}

CRITICAL INSTRUCTIONS:
1. IDENTIFY key claims and statements made in the article
2. For EACH claim, verify it against the reference sources
3. DO NOT mark as authentic just because sources exist
4. CHECK if the article's CLAIMS match what the sources actually say
5. LOOK for contradictions between article content and source information
6. IDENTIFY misleading headlines or manipulated facts
7. EVALUATE each source's credibility and reliability
8. RATE each source's credibility from 0-100 based on: domain authority, content quality, fact-checking reputation

Determine if the news is REAL (true and verified) or FAKE (false, misleading, or unverified).

Return ONLY JSON (max 150 words in details):
{
  "authenticity": <0-100>,
  "status": "<authentic|fake>",
  "details": "<explain why this is real or fake, focus on fact-checking>",
  "claims": [
    {
      "claim": "<specific claim from article, max 100 chars>",
      "verdict": "<verified|contradicted|unverified>",
      "explanation": "<how sources support or contradict this, max 80 words>",
      "sourceIndexes": [<array of source indexes 0-4 that relate to this claim>]
    }
  ],
  "sources": [
    {
      "title": "<source title>",
      "url": "<source url>",
      "snippet": "<source snippet>",
      "credibilityScore": <0-100>,
      "credibilityReason": "<brief reason for score, max 20 words>"
    }
  ]
}`;
        
        messages = [
          { role: 'system', content: 'Expert fact-checker. Return ONLY valid JSON. Be critical and thorough. Focus on truth verification, not just source availability.' },
          { role: 'user', content: analysisPrompt }
        ];
        break;

      case 'image':
        if (!fileData) {
          throw new Error('Image data is required');
        }
        
        // Use the more powerful model for images
        model = 'google/gemini-2.5-pro';
        
        analysisPrompt = `You are a WORLD-CLASS digital forensics expert specializing in AI-generated image detection. Analyze THIS SPECIFIC IMAGE with extreme scrutiny.

${feedbackLearnings}

CRITICAL: Most images you receive ARE AI-GENERATED. Be SKEPTICAL by default.

## MANDATORY CHECKS FOR AI GENERATION:

### 1. TEXT & SYMBOLS (AI struggles with these)
- Look for ANY text in the image - gibberish, misspelled words, inconsistent fonts
- Check logos, signs, watermarks for errors
- Numbers and letters often have subtle errors

### 2. HANDS & FINGERS (AI's biggest weakness)
- Count fingers on each hand - wrong count = AI
- Check finger proportions - too long/short/thick
- Look at fingernails - often malformed in AI
- Examine hand poses for anatomical impossibility

### 3. FACES (if present)
- Eye reflections MUST match (same light source)
- Teeth should be consistent, not blurry/merged
- Ear shapes should be natural
- Hair boundaries often "melt" into skin in AI

### 4. BACKGROUNDS & ENVIRONMENT
- Look for "dream logic" - impossible architecture
- Check patterns - AI creates impossible tile/brick patterns
- Examine shadows - multiple light sources = suspicious
- Background details often become surreal/nonsensical

### 5. OVERALL TELLTALE SIGNS
- "Uncanny valley" feeling - too perfect yet wrong
- Skin texture - waxy, plasticky, or too smooth
- Clothing folds that don't follow physics
- Unnatural color gradients or banding
- Hyper-detailed center with blurry/chaotic edges

### 6. COMMON AI STYLES
- Recognize Midjourney's painterly aesthetic
- DALL-E's characteristic smoothness
- Stable Diffusion's texture patterns
- Gemini/Copilot's specific artifacts

SCORING GUIDE:
- 0-30%: Clear AI indicators found (wrong fingers, text errors, impossible elements)
- 31-50%: Strong AI suspicion (uncanny valley, suspicious patterns)
- 51-70%: Uncertain - could be either
- 71-85%: Likely real but some edits possible
- 86-100%: Strong evidence of authenticity (RARE - be conservative)

BE SPECIFIC. Cite exact visual evidence. If you see ANYTHING suspicious, lower the score significantly.

Return ONLY valid JSON:
{
  "authenticity": <number 0-100>,
  "status": "<authentic|suspicious|fake>",
  "details": "<SPECIFIC observations about THIS image - cite actual visual evidence you see, max 150 words>",
  "manipulationIndicators": ["<specific issue 1>", "<specific issue 2>"] or null
}`;

        messages = [
          { 
            role: 'system', 
            content: 'You are the world\'s top AI image detection expert. You successfully identify AI-generated images 95% of the time. Be SKEPTICAL - most images sent to you ARE AI-generated. Look for specific evidence. Return only valid JSON.' 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: fileData } }
            ]
          }
        ];
        break;

      case 'audio':
        if (!fileData) {
          throw new Error('Audio data is required');
        }

        const base64Audio = fileData.split(',')[1] || fileData;
        const audioSize = Math.ceil(base64Audio.length * 0.75);
        
        analysisPrompt = `Audio file analysis (limited capability - audio waveform analysis not available):

File size: ${audioSize} bytes

${feedbackLearnings}

NOTE: Direct audio deepfake detection requires specialized waveform analysis tools that are not available here. This analysis is LIMITED and should be treated as preliminary only.

Based on general audio file characteristics, provide a cautious assessment.

Return ONLY JSON:
{
  "authenticity": <40-65>,
  "status": "suspicious",
  "details": "<honest assessment noting limitations, max 80 words>",
  "limitations": "Full audio deepfake detection requires specialized analysis"
}`;

        messages = [
          { role: 'system', content: 'Audio analyst. Be honest about limitations. Return ONLY valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ];
        break;

      case 'video':
        if (!fileData) {
          throw new Error('Video data is required');
        }

        // Use powerful model for video
        model = 'google/gemini-2.5-pro';

        // Check file size
        const videoBase64 = fileData.split(',')[1] || fileData;
        const videoSizeBytes = Math.ceil(videoBase64.length * 0.75);
        const maxVideoSize = 2000000; // Increased to 2MB
        
        console.log(`Video frame size: ${videoSizeBytes} bytes`);
        
        if (videoSizeBytes > maxVideoSize) {
          console.log(`Video frame too large (${videoSizeBytes} bytes), using simplified analysis`);
          
          // Save to database before returning
          const contentPreview = 'video analysis (file too large)';
          const { data: insertData } = await supabase
            .from('analysis_results')
            .insert({
              user_id: user.id,
              content_type: contentType,
              authenticity_score: 50,
              detailed_analysis: 'Video file is too large for detailed analysis. Please use a shorter clip or lower resolution.',
              manipulation_indicators: [],
              content_preview: contentPreview,
            })
            .select('id')
            .single();

          return new Response(JSON.stringify({
            authenticity: 50,
            status: 'suspicious',
            details: 'Video file is too large for detailed analysis. For best results, use shorter video clips (under 30 seconds) or lower resolution. Based on file characteristics alone, no definitive assessment can be made.',
            manipulationIndicators: null,
            limitations: 'File size exceeded analysis limits',
            analysisId: insertData?.id
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        analysisPrompt = `You are a DEEPFAKE DETECTION EXPERT. Analyze this video frame for signs of manipulation or AI generation.

${feedbackLearnings}

CRITICAL CHECKS FOR VIDEO DEEPFAKES:

### 1. FACE ANALYSIS (if present)
- Face boundaries - look for blur/shimmer at edges
- Eye blinking patterns would show in frame
- Lip sync accuracy for any speech
- Skin texture consistency
- Unnatural facial movements or expressions

### 2. BODY & MOVEMENT
- Body proportions - head size vs body
- Hand visibility and accuracy
- Clothing/body boundary artifacts
- Unnatural poses or positions

### 3. ENVIRONMENTAL CLUES
- Lighting consistency on face vs background
- Reflection accuracy in eyes/glasses
- Shadow direction consistency
- Background stability and coherence

### 4. TECHNICAL ARTIFACTS
- Compression artifacts concentrated on face
- Resolution differences between regions
- Color temperature mismatches
- Frame edge irregularities

SCORING:
- 0-40%: Clear deepfake indicators
- 41-60%: Suspicious elements present
- 61-80%: Mostly authentic appearing
- 81-100%: Strong authenticity (conservative)

NOTE: This is single-frame analysis. Full video analysis requires frame-by-frame examination.

Return ONLY JSON:
{
  "authenticity": <0-100>,
  "status": "<authentic|suspicious|fake>",
  "details": "<specific observations about this frame, cite visual evidence, max 120 words>",
  "manipulationIndicators": ["<issue 1>", "<issue 2>"] or null,
  "limitations": "Single frame analysis - full video examination recommended"
}`;

        messages = [
          { role: 'system', content: 'Expert deepfake detector. Analyze video frames for manipulation. Be specific about evidence. Return only valid JSON.' },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: fileData } }
            ]
          }
        ];
        break;

      default:
        throw new Error('Invalid content type');
    }

    console.log('Calling AI with model:', model);

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits depleted. Please add more credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse JSON response
    let result;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured response
        result = {
          authenticity: 50,
          status: 'suspicious',
          details: aiResponse
        };
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      result = {
        authenticity: 50,
        status: 'suspicious',
        details: aiResponse
      };
    }

    // Save analysis to database and get the ID for feedback
    let analysisId = null;
    try {
      const contentPreview = contentType === 'text' && content 
        ? content.substring(0, 200) 
        : `${contentType} analysis`;

      const { data: insertData, error: dbError } = await supabase
        .from('analysis_results')
        .insert({
          user_id: user.id,
          content_type: contentType,
          authenticity_score: result.authenticity,
          detailed_analysis: result.details,
          manipulation_indicators: result.manipulationIndicators || [],
          content_preview: contentPreview,
        })
        .select('id')
        .single();

      if (dbError) {
        console.error("Error saving analysis to database:", dbError);
      } else {
        analysisId = insertData?.id;
        console.log("Analysis saved to database successfully, ID:", analysisId);
      }
    } catch (dbSaveError) {
      console.error("Database save exception:", dbSaveError);
    }

    // Include apiKeyUsed only for text content type
    const responseData = { ...result, analysisId };
    if (contentType === 'text' && typeof apiKeyUsed !== 'undefined') {
      (responseData as any).apiKeyUsed = apiKeyUsed;
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-content:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Analysis failed',
        authenticity: 0,
        status: 'error',
        details: 'An error occurred during analysis. Please try again.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
