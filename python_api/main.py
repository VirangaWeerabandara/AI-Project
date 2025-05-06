from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
import logging
import time
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Deepfake Detection API",
    description="API for detecting deepfake images using a trained neural network",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model
try:
    model = tf.keras.models.load_model(
        'fake_image_detector.h5',
        custom_objects=None,
        compile=False
    )
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    model = None

def preprocess_image(image_bytes) -> np.ndarray:
    """
    Preprocess the image to match the model's input requirements.
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        Preprocessed image as numpy array
    """
    # Convert bytes to PIL Image
    img = Image.open(io.BytesIO(image_bytes))
    
    # Convert RGBA to RGB if needed
    if img.mode == 'RGBA':
        img = img.convert('RGB')
    
    # Resize to match model input size
    img = img.resize((224, 224))
    
    # Convert to numpy array and normalize
    img_array = np.array(img) / 255.0
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

@app.get("/")
async def root():
    """Health check endpoint to verify API is running."""
    return {"status": "online", "message": "Deepfake Detection API is running"}

@app.post("/predict", response_model=dict)
async def predict(file: UploadFile = File(...)):
    """
    Endpoint to predict whether an image is fake or real.
    
    Args:
        file: The uploaded image file
        
    Returns:
        JSON response with prediction result and confidence score
    """
    # Check if model is loaded
    if model is None:
        raise HTTPException(status_code=503, detail="Model not available")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image")

    try:
        # Start timing
        start_time = time.time()
        
        # Read image file
        image_bytes = await file.read()
        
        # Preprocess the image
        processed_image = preprocess_image(image_bytes)
        
        # Perform prediction
        prediction = model.predict(processed_image)
        prediction_value = float(prediction[0][0])
        
        # Determine result
        result = "Fake" if prediction_value > 0.5 else "Real"
        
        # Calculate confidence percentage
        confidence = prediction_value if result == "Fake" else 1 - prediction_value
        confidence_percentage = round(confidence * 100, 2)
        
        # Calculate processing time
        processing_time = round((time.time() - start_time) * 1000, 2)  # in milliseconds
        
        logger.info(f"Prediction: {result} with {confidence_percentage}% confidence in {processing_time}ms")
        
        return JSONResponse(content={
            "result": result,
            "confidence": confidence_percentage,
            "processing_time_ms": processing_time
        })
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/status")
async def status():
    """Endpoint to check system status."""
    return {
        "status": "operational",
        "model_loaded": model is not None,
        "api_version": "1.0.0"
    }

# Run the application
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
