from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import date
import pytesseract
from PIL import Image
import re
import io
import os
import pillow_heif


pillow_heif.register_heif_opener()

app = FastAPI()

# In-memory data stores
weight_entries = {}
meal_entries = {}

# ---------- Models ----------

class WeightRequest(BaseModel):
    weight: float

class MealRequest(BaseModel):
    name: str
    protein_per_serving: float
    carbs_per_serving: float
    fat_per_serving: float
    calories_per_serving: float
    servings: float

class MealEntry(BaseModel):
    name: str
    protein: float
    carbs: float
    fat: float
    calories: float
    servings: float

# ---------- Utility ----------

def today():
    return str(date.today())

import unicodedata

def normalize_text(text: str) -> str:
    return unicodedata.normalize('NFKD', text.lower()).encode('ascii', 'ignore').decode('ascii')

def extract_calories(text):
    # Try to extract kcal directly
    kcal_match = re.search(r'(\d+(?:[.,]\d+)?)\s?kcal', text, re.IGNORECASE)
    if kcal_match:
        return float(kcal_match.group(1).replace(',', '.'))

    # Fallback: try to extract kJ and convert to kcal
    kj_match = re.search(r'(\d+(?:[.,]\d+)?)\s?kJ', text, re.IGNORECASE)
    if kj_match:
        kj_value = float(kj_match.group(1).replace(',', '.'))
        return round(kj_value / 4.184, 2)

    # Final fallback if labeled just as "calories"
    generic = re.search(r'calories[^0-9]*([\d.]+)', text, re.IGNORECASE)
    if generic:
        return float(generic.group(1))

    return 0


def parse_nutrition_text(text: str) -> MealRequest:
    text = normalize_text(text)

    def extract(keywords):
        pattern = r"(" + "|".join(keywords) + r")[^0-9]*([\d\.]+)"
        match = re.search(pattern, text, re.IGNORECASE)
        return float(match.group(2)) if match else 0

    return MealRequest(
    name="Scanned Label",
    protein_per_serving=extract("protein"),
    carbs_per_serving=extract("carbohydrate|carbohydrates|total carbs?"),
    fat_per_serving=extract("total fat"),
    calories_per_serving=extract_calories(text),
    servings=1
)



# ---------- Routes ----------

@app.post("/weight")
def log_weight(req: WeightRequest):
    weight_entries[today()] = req.weight
    return {"date": today(), "weight": req.weight}

@app.get("/weight/today")
def get_today_weight():
    if today() not in weight_entries:
        raise HTTPException(status_code=404, detail="No weight entry for today")
    return {"date": today(), "weight": weight_entries[today()]}

@app.post("/meals")
def log_meal(req: MealRequest):
    meal = MealEntry(
        name=req.name,
        protein=req.protein_per_serving * req.servings,
        carbs=req.carbs_per_serving * req.servings,
        fat=req.fat_per_serving * req.servings,
        calories=req.calories_per_serving * req.servings,
        servings=req.servings,
    )
    meal_entries.setdefault(today(), []).append(meal)
    return meal

@app.get("/meals/today")
def get_today_meals():
    meals = meal_entries.get(today(), [])
    totals = {
        "total_protein": sum(m.protein for m in meals),
        "total_carbs": sum(m.carbs for m in meals),
        "total_fat": sum(m.fat for m in meals),
        "total_calories": sum(m.calories for m in meals),
    }
    return {"meals": meals, **totals}

@app.post("/nutrition-label")
async def scan_nutrition_label(image: UploadFile = File(...)):
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        contents = await image.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Try to open the image
        try:
            img = Image.open(io.BytesIO(contents))
            # Convert to RGB if necessary (some formats like PNG with transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")
        
        # Extract text using OCR
        try:
            text = pytesseract.image_to_string(img)
            if not text.strip():
                raise HTTPException(status_code=400, detail="No text found in image. Please ensure the nutrition label is clearly visible.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
        
        # Parse the extracted text
        try:
            parsed = parse_nutrition_text(text)
            return parsed
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse nutrition data from text: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
