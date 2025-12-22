from fastapi import FastAPI
from pydantic import BaseModel
import torch
import torch.nn as nn

app = FastAPI()

# Request model
class AdherenceRequest(BaseModel):
    missed_doses: int
    stress_level: float
    sleep_hours: float

# Simple neural network model
class SimpleModel(nn.Module):
    def __init__(self):
        super(SimpleModel, self).__init__()
        self.fc = nn.Linear(3, 1)

    def forward(self, x):
        return torch.sigmoid(self.fc(x))

# Initialize model
model = SimpleModel()

@app.post("/predict")
def predict(data: AdherenceRequest):
    # Prepare input tensor
    x = torch.tensor([[data.missed_doses, data.stress_level, data.sleep_hours]], dtype=torch.float32)
    prediction = model(x).item()
    return {"adherence_probability": prediction}
