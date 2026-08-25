import os
import uuid
import time
import shutil
import asyncio
from typing import List, Optional
import cv2
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
import google.generativeai as genai
from google.generativeai.types import RequestOptions
import edge_tts
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Creator Copilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
KEYFRAMES_DIR = os.path.join(STATIC_DIR, "keyframes")
TTS_DIR = os.path.join(STATIC_DIR, "tts")
TEMP_DIR = os.path.join(BASE_DIR, "temp")

for d in [STATIC_DIR, KEYFRAMES_DIR, TTS_DIR, TEMP_DIR]:
    os.makedirs(d, exist_ok=True)

# Pydantic Schemas for Structured Output
class VisualQuality(BaseModel):
    lighting: str = Field(description="Analysis of lighting quality (e.g. highlights, shadows, exposure)")
    composition: str = Field(description="Analysis of composition, rule of thirds, symmetry, angles")
    framing: str = Field(description="Camera framing (e.g. close-up, medium shot, head room)")
    background: str = Field(description="Background distractions, noise, elements to remove")
    text_readability: str = Field(description="Analysis of readability of on-screen captions or text overlays")
    face_visibility: str = Field(description="Analysis of face visibility, expression clarity, eye contact")
    dominant_colors: List[str] = Field(description="List of 3 dominant color hex codes (e.g. '#FF0000')")
    contrast_brightness: str = Field(description="Description of contrast levels and overall brightness")
    visual_aesthetics_score: int = Field(description="Aesthetics quality score from 0 to 100", ge=0, le=100)

class ContentMetrics(BaseModel):
    hook_strength: int = Field(description="Score from 0 to 100", ge=0, le=100)
    hook_explanation: str = Field(description="Why this hook score was given")
    visual_clarity: int = Field(description="Score from 0 to 100", ge=0, le=100)
    visual_clarity_explanation: str = Field(description="Why this visual clarity score was given")
    caption_quality: int = Field(description="Score from 0 to 100", ge=0, le=100)
    caption_quality_explanation: str = Field(description="Why this caption score was given")
    editing_readiness: int = Field(description="Score from 0 to 100", ge=0, le=100)
    editing_readiness_explanation: str = Field(description="Why this editing readiness score was given")
    engagement_potential: int = Field(description="Score from 0 to 100", ge=0, le=100)
    engagement_potential_explanation: str = Field(description="Why this engagement score was given")
    overall_score: int = Field(description="Overall rating score out of 100", ge=0, le=100)
    overall_explanation: str = Field(description="Comprehensive explanation of the overall score")

class ContentSuggestions(BaseModel):
    stronger_hook: str = Field(description="An improved, high-impact hook suggestion")
    script_improvements: str = Field(description="Specific script adjustments or text rewrites")
    caption: str = Field(description="Ready-to-use optimized social media caption")
    cta: str = Field(description="Clear call to action (e.g., 'Comment GROW below')")
    hashtags: List[str] = Field(description="5 to 8 relevant trending hashtags")
    music_recommendation: str = Field(description="Recommended mood/genre of audio track (e.g. Lofi Chill, Emotional Piano)")
    tone_suggestions: str = Field(description="Aesthetic or emotional tone adjustments")
    retention_tips: List[str] = Field(description="3 tactics to improve audience retention rate")
    b_roll_ideas: List[str] = Field(description="3 suggestions for B-roll footage inserts")
    thumbnail_suggestions: str = Field(description="Suggestions for design, text, or visual layout of the thumbnail")

class EditingTimelineItem(BaseModel):
    timestamp: str = Field(description="Time interval or timestamp (e.g., '00:00 - 00:02', '00:05')")
    instruction: str = Field(description="Clear and actionable editing recommendation")
    rationale: str = Field(description="Explanation of why this edit improves performance")

class BeforeAfterComparison(BaseModel):
    before_hook_score: int = Field(ge=0, le=100)
    after_hook_score: int = Field(ge=0, le=100)
    before_retention: str = Field(description="Engagement readiness before suggestions (e.g., 'Low', 'Average')")
    after_retention: str = Field(description="Engagement readiness after suggestions (e.g., 'High', 'Excellent')")
    before_caption: str = Field(description="Caption strength description before suggestions")
    after_caption: str = Field(description="Caption strength description after suggestions")
    improvement_percentage: int = Field(description="Calculated average percentage improvement (e.g., 45)")

class CreatorCopilotAnalysis(BaseModel):
    transcript: str = Field(description="Word-for-word transcript of the video audio. Write 'No audio detected' if silent.")
    visual_analysis: VisualQuality
    metrics: ContentMetrics
    suggestions: ContentSuggestions
    editing_timeline: List[EditingTimelineItem]
    comparison: BeforeAfterComparison

# API Key Dependency Injection
def get_api_key(request: Request):
    api_key = request.headers.get("X-Gemini-API-Key")
    if not api_key:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            api_key = auth.split(" ")[1]
    if not api_key:
        api_key = os.getenv("GEMINI_API_KEY")
    return api_key

def extract_keyframes_cv2(video_path: str, session_id: str) -> List[str]:
    """Extracts 5 keyframes evenly across the video duration using OpenCV."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video file.")
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        raise HTTPException(status_code=400, detail="Invalid video frame count.")
        
    session_keyframes_dir = os.path.join(KEYFRAMES_DIR, session_id)
    os.makedirs(session_keyframes_dir, exist_ok=True)
    
    # Calculate indexes for 5 keyframes (at 10%, 30%, 50%, 70%, 90% mark)
    frame_indices = [
        int(total_frames * 0.1),
        int(total_frames * 0.3),
        int(total_frames * 0.5),
        int(total_frames * 0.7),
        int(total_frames * 0.9)
    ]
    
    extracted_urls = []
    
    for i, idx in enumerate(frame_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            filename = f"frame_{i}.jpg"
            filepath = os.path.join(session_keyframes_dir, filename)
            cv2.imwrite(filepath, frame)
            # URL path for front-end
            extracted_urls.append(f"/static/keyframes/{session_id}/{filename}")
        else:
            # Fallback to frame 0 or close frame if read fails
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret_fb, frame_fb = cap.read()
            if ret_fb:
                filename = f"frame_{i}.jpg"
                filepath = os.path.join(session_keyframes_dir, filename)
                cv2.imwrite(filepath, frame_fb)
                extracted_urls.append(f"/static/keyframes/{session_id}/{filename}")
                
    cap.release()
    return extracted_urls

@app.post("/api/analyze")
async def analyze_video(
    video: UploadFile = File(...),
    thumbnail: Optional[UploadFile] = File(None),
    voice_note: Optional[UploadFile] = File(None),
    goal: Optional[str] = Form(None),
    api_key: Optional[str] = Depends(get_api_key)
):
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Gemini API Key is missing. Please add it in the settings or config."
        )

    # Initialize Gemini client
    genai.configure(api_key=api_key)
    
    session_id = str(uuid.uuid4())
    video_temp_path = os.path.join(TEMP_DIR, f"{session_id}_{video.filename}")
    
    # Track latencies
    latencies = {
        "keyframe_extraction": 0,
        "stt": 0,
        "vision": 0,
        "llm": 0,
        "total": 0
    }
    
    total_start = time.time()
    
    # Save uploaded video file
    try:
        with open(video_temp_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")

    # Step 1: Keyframe Extraction
    kf_start = time.time()
    try:
        keyframes_urls = extract_keyframes_cv2(video_temp_path, session_id)
    except Exception as e:
        # Cleanup
        if os.path.exists(video_temp_path):
            os.remove(video_temp_path)
        raise HTTPException(status_code=500, detail=f"Keyframe extraction failed: {str(e)}")
    latencies["keyframe_extraction"] = int((time.time() - kf_start) * 1000)

    # Step 2: Speech-to-Text / Transcription
    # Upload video file to Gemini File API to get the native speech transcription
    stt_start = time.time()
    try:
        uploaded_video_file = genai.upload_file(path=video_temp_path)
        # Wait for file processing in Gemini
        while uploaded_video_file.state.name == "PROCESSING":
            await asyncio.sleep(1.0)
            uploaded_video_file = genai.get_file(uploaded_video_file.name)
            
        if uploaded_video_file.state.name == "FAILED":
            raise Exception("Gemini video file processing failed.")
    except Exception as e:
        if os.path.exists(video_temp_path):
            os.remove(video_temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to upload video to Gemini File API: {str(e)}")
    
    # Transcribe Voice Note if exists
    voice_note_text = ""
    if voice_note:
        voice_temp_path = os.path.join(TEMP_DIR, f"{session_id}_{voice_note.filename}")
        try:
            with open(voice_temp_path, "wb") as buffer:
                shutil.copyfileobj(voice_note.file, buffer)
            
            uploaded_voice = genai.upload_file(path=voice_temp_path)
            while uploaded_voice.state.name == "PROCESSING":
                await asyncio.sleep(0.5)
                uploaded_voice = genai.get_file(uploaded_voice.name)
            
            model = genai.GenerativeModel("gemini-1.5-flash")
            voice_response = model.generate_content(
                ["Transcribe this voice note exactly. Output ONLY the transcript.", uploaded_voice]
            )
            voice_note_text = voice_response.text
            # Cleanup voice note
            try:
                genai.delete_file(uploaded_voice.name)
                os.remove(voice_temp_path)
            except:
                pass
        except Exception as e:
            print(f"Voice note transcription error (skipping): {e}")

    latencies["stt"] = int((time.time() - stt_start) * 1000)

    # Step 3 & 4: Multimodal Analysis (Vision & LLM Pipeline)
    llm_start = time.time()
    
    # Optional thumbnail inclusion
    thumbnail_data = None
    if thumbnail:
        thumbnail_temp_path = os.path.join(TEMP_DIR, f"{session_id}_{thumbnail.filename}")
        try:
            with open(thumbnail_temp_path, "wb") as buffer:
                shutil.copyfileobj(thumbnail.file, buffer)
            thumbnail_data = genai.upload_file(path=thumbnail_temp_path)
            while thumbnail_data.state.name == "PROCESSING":
                await asyncio.sleep(0.5)
                thumbnail_data = genai.get_file(thumbnail_data.name)
        except Exception as e:
            print(f"Thumbnail upload error: {e}")

    # Build prompt instructions
    user_goal = goal or ""
    if voice_note_text:
        user_goal += f" (Voice note instruction: {voice_note_text})"
        
    prompt = f"""
    You are Creator Copilot AI, a premium content strategist and creative coach for Instagram Reels, TikTok, and YouTube Shorts.
    Your mission is to perform a detailed audit of the user's video, visual components, audio transcript, and goals.
    
    USER GOAL OR STYLE PREFERENCE: "{user_goal or 'Maximize engagement, build a clean cohesive brand presence'}"
    
    Instructions:
    1. First, provide an accurate word-for-word transcript of the video's audio track.
    2. Analyze the video's visual qualities (composition, lighting, framing, text readability, camera movement, aesthetic style, distractions).
    3. Detect exactly 3 dominant colors that match the aesthetic visual palette (represent them as valid CSS hex codes).
    4. Provide content suggestions (stronger hook, script adjustments, a high-converting caption, CTAs, hashtags, matching background music vibes, tone, retention tips, B-roll suggestions, and custom thumbnail ideas).
    5. Construct an AI Editing Plan Timeline: a structured list of actionable edits with timestamps (e.g. remove filler, insert zoomed frame, add text overlay, etc.) to optimize pace and flow. Do NOT edit the video yourself, give precise time-referenced orders.
    6. Evaluate 5 distinct quality categories (Hook Strength, Visual Clarity, Caption Quality, Editing Readiness, Engagement Potential) and calculate a weighted Overall Score out of 100.
    7. Provide a detailed, realistic 'Before AI' vs 'After AI Suggestions' assessment comparing hook score, caption quality, retention, and calculating an estimated improvement percentage.
    
    You must output a structured JSON that strictly conforms to the requested schema.
    """
    
    # Call Gemini model
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        contents = [prompt, uploaded_video_file]
        if thumbnail_data:
            contents.append(thumbnail_data)
            
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=CreatorCopilotAnalysis,
            temperature=0.2
        )
        
        response = model.generate_content(
            contents,
            generation_config=generation_config
        )
        
        raw_json_str = response.text
        # Parse and validate with Pydantic
        validated_analysis = CreatorCopilotAnalysis.model_validate_json(raw_json_str)
        
    except Exception as e:
        # Cleanup
        try:
            genai.delete_file(uploaded_video_file.name)
            if thumbnail_data:
                genai.delete_file(thumbnail_data.name)
        except:
            pass
        if os.path.exists(video_temp_path):
            os.remove(video_temp_path)
            
        raise HTTPException(
            status_code=500,
            detail=f"Gemini generation or schema validation failed: {str(e)}"
        )

    # Clean up uploaded files from Gemini
    try:
        genai.delete_file(uploaded_video_file.name)
        if thumbnail_data:
            genai.delete_file(thumbnail_data.name)
            os.remove(thumbnail_temp_path)
    except:
        pass
    
    # Cleanup temp local video
    if os.path.exists(video_temp_path):
        os.remove(video_temp_path)

    # Record remaining latencies
    latencies["llm"] = int((time.time() - llm_start) * 1000)
    latencies["vision"] = int(latencies["llm"] * 0.4) # Approximation of the vision portion of the LLM call
    latencies["total"] = int((time.time() - total_start) * 1000)

    # Prepare response payload
    response_payload = {
        "session_id": session_id,
        "keyframes": keyframes_urls,
        "analysis": validated_analysis.model_dump(),
        "latencies": latencies,
        "validation": {
            "success": True,
            "errors": None
        }
    }
    
    return JSONResponse(content=response_payload)

# Pydantic schemas for Chat
class ChatRequest(BaseModel):
    message: str
    session_id: str
    video_context: str
    current_analysis: dict
    history: List[dict] = []

@app.post("/api/chat")
async def chat_copilot(
    payload: ChatRequest,
    api_key: Optional[str] = Depends(get_api_key)
):
    if not api_key:
        raise HTTPException(status_code=401, detail="API Key is missing.")
        
    genai.configure(api_key=api_key)
    
    # Setup prompt
    history_str = ""
    for msg in payload.history:
        role = "Creator" if msg.get("role") == "user" else "Copilot"
        history_str += f"{role}: {msg.get('content')}\n"
        
    system_prompt = f"""
    You are Creator Copilot AI, a premium content strategist and creative coach.
    You are discussing the user's uploaded video.
    
    TRANSCRIPT OF VIDEO:
    {payload.video_context}
    
    CURRENT COPILOT ANALYSIS:
    {payload.current_analysis}
    
    CHAT HISTORY:
    {history_str}
    
    USER'S NEW REQUEST:
    "{payload.message}"
    
    Your goal is to answer the user's follow-up questions, provide detailed script revisions, stronger hooks, captions tailored to specific groups, or explain details of the editing plan.
    Keep your answers concise, practical, and highly encouraging, matching the vibe of a premier SaaS creative partner.
    If they ask you to rewrite a caption, hook, or script, provide the raw rewritten text inside a markdown code block so they can copy it easily.
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(system_prompt)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat generation failed: {str(e)}")

@app.get("/api/tts")
async def text_to_speech(text: str):
    if not text:
        raise HTTPException(status_code=400, detail="Text parameter is required.")
        
    session_id = str(uuid.uuid4())
    filename = f"{session_id}.mp3"
    filepath = os.path.join(TTS_DIR, filename)
    
    try:
        # Use edge-tts neural voice for natural presentation
        communicate = edge_tts.Communicate(text, "en-US-GuyNeural")
        await communicate.save(filepath)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")
        
    # Return file URL
    return {"audio_url": f"/static/tts/{filename}"}

# Serve Frontend static assets
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
