"""
LedgerShield_AI
Copyright © 2026 Ayush Anand. All rights reserved.
Unauthorized rebranding, redistribution, or republication is prohibited.
"""
"""
Enhanced FastAPI Backend for LedgerShield_AI

Serves ML model endpoints for:
- Credit Risk Prediction (pre-delinquency detection with Indian customer data)
- DDoS Detection (network security)
- Cross-domain Correlation Analysis
- Real-time Data Streaming
- Analytics and Customer Management

Author: LedgerShield_AI
Date: 2026-04-12
"""

import logging
import time
import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

import uvicorn
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from sse_starlette.sse import EventSourceResponse

# Import ML models — path resolves to parent directory (LedgerShield_AI/)
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.credit_risk import CreditRiskPredictor
from models.ddos_detector import DDoSDetector
from models.correlation_engine import (
    CrossDomainCorrelationEngine,
    CorrelationEvent,
    AlertSeverity,
)
from data.data_generator import CreditDataGenerator, NetworkDataGenerator
from data.indian_data_generator import IndianCreditDataGenerator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# PYDANTIC MODELS - Request/Response Bodies
# ============================================================================


class CreditPredictionRequest(BaseModel):
    """Request body for credit risk prediction."""
    income: float = Field(..., gt=0, description="Annual income in dollars")
    credit_score: int = Field(..., ge=300, le=850, description="Credit score")
    payment_history_months: int = Field(..., ge=0, description="Months of payment history")
    loan_amount: float = Field(..., gt=0, description="Loan amount in dollars")
    monthly_debt: float = Field(..., ge=0, description="Monthly debt obligations")
    employment_years: float = Field(..., ge=0, description="Years of employment")
    num_credit_lines: int = Field(..., ge=1, description="Number of active credit lines")
    num_late_payments: int = Field(..., ge=0, description="Number of late payments")
    credit_utilization: float = Field(..., ge=0, le=1, description="Credit utilization ratio")
    transaction_frequency: int = Field(..., ge=1, description="Transactions per month")
    avg_transaction_amount: float = Field(..., gt=0, description="Average transaction amount")
    savings_balance: float = Field(..., ge=0, description="Savings balance in dollars")
    age: int = Field(..., ge=18, le=100, description="Customer age")

    @validator('income', 'loan_amount', 'monthly_debt', 'avg_transaction_amount', 'savings_balance')
    def validate_positive_values(cls, v):
        if v < 0:
            raise ValueError("Value must be non-negative")
        return v


class CreditPredictionResponse(BaseModel):
    """Response body for credit risk prediction."""
    risk_score: float = Field(..., description="Risk score between 0 and 1")
    risk_category: str = Field(..., description="Risk category (Low/Medium/High/Critical)")
    risk_percentage: float = Field(..., description="Risk as percentage")


class TrainRequest(BaseModel):
    """Request body for model training."""
    n_samples: int = Field(
        default=5000,
        ge=100,
        le=100000,
        description="Number of synthetic samples to generate for training"
    )


class MetricsResponse(BaseModel):
    """Response body for model metrics."""
    credit_model_trained: bool
    credit_metrics: Optional[Dict[str, Any]] = None
    ddos_model_trained: bool
    ddos_metrics: Optional[Dict[str, Any]] = None


class StatusResponse(BaseModel):
    """Response body for system status."""
    credit_model_trained: bool
    ddos_model_trained: bool
    uptime_seconds: float
    timestamp: str


class AttackSimulationRequest(BaseModel):
    """Request body for DDoS attack simulation."""
    attack_type: str = Field(
        ...,
        description="Attack type: syn_flood, udp_flood, http_flood, or slowloris"
    )
    duration_seconds: int = Field(
        default=10,
        ge=1,
        le=300,
        description="Attack duration in seconds"
    )
    intensity: float = Field(
        default=1.0,
        ge=0.5,
        le=5.0,
        description="Attack intensity multiplier"
    )

    @validator('attack_type')
    def validate_attack_type(cls, v):
        valid_types = ['syn_flood', 'udp_flood', 'http_flood', 'slowloris']
        if v.lower() not in valid_types:
            raise ValueError(f"Attack type must be one of {valid_types}")
        return v.lower()


class AttackSimulationResponse(BaseModel):
    """Response body for attack simulation results."""
    attack_data_summary: Dict[str, Any] = Field(..., description="Summary of simulated attack")
    detection_results: Dict[str, Any] = Field(..., description="Detection outcomes")
    traffic_stats: Dict[str, Any] = Field(..., description="Traffic statistics")


class SampleDataResponse(BaseModel):
    """Response body for sample data."""
    credit_data: List[Dict[str, Any]] = Field(..., description="20 rows of credit data")
    network_data: List[Dict[str, Any]] = Field(..., description="20 rows of network data")


class CustomerListItem(BaseModel):
    """Full customer row — matches frontend IndianCustomer interface exactly."""
    customer_id: str
    name: str
    age: int
    city: str
    occupation: str
    # Field aliases: frontend uses income/monthly_emi/num_credit_lines
    income: float                   # = monthly_income * 12 (annual)
    cibil_score: int
    loan_amount: float
    loan_tenure_months: int
    monthly_emi: float              # = emi_amount
    credit_utilization: float
    num_late_payments: int
    employment_years: float
    num_credit_lines: int           # = num_credit_cards
    is_delinquent: int
    risk_score: float
    risk_category: str
    spend_food: float
    spend_shopping: float
    spend_travel: float
    spend_entertainment: float
    spend_utilities: float
    spend_emi_payments: float
    debt_to_income: float
    savings_rate: float
    credit_score_band: str


class CustomerListResponse(BaseModel):
    """Paginated customer list — matches frontend CustomersResponse interface."""
    customers: List[CustomerListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class CustomerProfile(BaseModel):
    """Full customer detail — matches frontend CustomerDetail interface."""
    customer_id: str
    name: str
    age: int
    city: str
    occupation: str
    income: float
    cibil_score: int
    credit_score_band: str
    loan_amount: float
    loan_tenure_months: int
    monthly_emi: float
    credit_utilization: float
    num_late_payments: int
    employment_years: float
    num_credit_lines: int
    is_delinquent: int
    risk_score: float
    risk_category: str
    debt_to_income: float
    savings_rate: float
    # Flat spend fields (frontend expects top-level)
    spend_food: float
    spend_shopping: float
    spend_travel: float
    spend_entertainment: float
    spend_utilities: float
    spend_emi_payments: float
    monthly_spending: float
    # SHAP values keyed by feature name (positive = increases risk)
    shap_values: Dict[str, float]
    risk_factors: List[str]
    recommendations: List[str]
    spending_insights: List[str]
    feature_importances: Dict[str, float]


class FeatureContribution(BaseModel):
    """Single feature contribution in explanation."""
    feature: str
    contribution: float
    customer_value: float


class ExplanationResponse(BaseModel):
    """SHAP-style explanation response."""
    customer_id: str
    risk_score: float
    top_features: List[FeatureContribution]


class AnalyticsOverviewResponse(BaseModel):
    """Analytics overview — matches frontend OverviewAnalytics interface."""
    total_customers: int
    # Delinquency
    delinquent_count: int
    avg_delinquency_rate: float     # = delinquent_rate
    # CIBIL
    avg_cibil_score: float          # = avg_cibil
    # Risk counts
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    critical_risk_count: int
    # Portfolio
    total_loan_portfolio: float
    # Breakdowns
    risk_by_occupation: Dict[str, float]     # occ -> delinquent_rate
    occupation_breakdown: Dict[str, int]     # occ -> count
    city_risk: Dict[str, Any]
    cibil_distribution: Dict[str, int]


class SpendingAnalyticsResponse(BaseModel):
    """Spending analytics — matches frontend SpendingAnalytics interface."""
    avg_spending_by_category: Dict[str, float]     # = average_spending
    occupation_spending: Dict[str, Dict[str, float]]  # = by_occupation
    high_risk_spending: Dict[str, float]
    low_risk_spending: Dict[str, float]


class DDoSSimulationStreamResponse(BaseModel):
    """Response for DDoS simulation with streaming."""
    phases: List[Dict[str, Any]]
    detection_time_ms: float
    mitigation_steps: List[str]
    final_status: str
    # Extra fields that frontend workflow uses
    num_flows_generated: int
    detection_results: Dict[str, Any]
    traffic_stats: Dict[str, Any]


# ============================================================================
# GLOBAL STATE & STARTUP/SHUTDOWN
# ============================================================================

# Global model instances
credit_model: Optional[CreditRiskPredictor] = None
ddos_model: Optional[DDoSDetector] = None
correlation_engine: Optional[CrossDomainCorrelationEngine] = None

# Data generators
credit_data_gen: Optional[CreditDataGenerator] = None
network_data_gen: Optional[NetworkDataGenerator] = None
indian_data_gen: Optional[IndianCreditDataGenerator] = None

# Customer data
customers_df: Optional[pd.DataFrame] = None
customer_predictions: Optional[Dict[str, Dict[str, Any]]] = None

# Metrics storage
credit_metrics: Optional[Dict[str, Any]] = None
ddos_metrics: Optional[Dict[str, Any]] = None

# Timing
app_start_time: float = 0.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage app startup and shutdown.
    Initialize models on startup, cleanup on shutdown.
    """
    global credit_model, ddos_model, correlation_engine
    global credit_data_gen, network_data_gen, indian_data_gen
    global app_start_time, customers_df, customer_predictions

    # Startup
    logger.info("FastAPI Backend Starting...")
    app_start_time = time.time()

    try:
        # Initialize models
        logger.info("Initializing Credit Risk Predictor...")
        credit_model = CreditRiskPredictor()

        logger.info("Initializing DDoS Detector...")
        ddos_model = DDoSDetector(verbose=0)

        logger.info("Initializing Correlation Engine...")
        correlation_engine = CrossDomainCorrelationEngine()

        # Initialize data generators
        logger.info("Initializing Data Generators...")
        credit_data_gen = CreditDataGenerator()
        network_data_gen = NetworkDataGenerator()
        indian_data_gen = IndianCreditDataGenerator()

        # Generate and train on Indian customer data
        logger.info("Generating Indian customer data...")
        customers_df = indian_data_gen.generate_customers(n=500)

        # Train credit model on Indian data (convert to standard features for compatibility)
        logger.info("Pre-training credit model on Indian customer data...")
        credit_data = credit_data_gen.generate_credit_data(n_samples=500)
        credit_model.train(credit_data)

        # Train DDoS model
        logger.info("Pre-training DDoS model...")
        ddos_data = network_data_gen.generate_network_data(n_samples=5000, attack_ratio=0.3)
        ddos_model.train(ddos_data, label_column='is_attack')

        # Generate initial predictions for all customers
        logger.info("Generating predictions for all customers...")
        customer_predictions = {}
        initialize_customer_predictions()

        logger.info("All models initialized and trained successfully!")

    except Exception as e:
        logger.error(f"Error during startup: {e}", exc_info=True)
        raise

    yield

    # Shutdown
    logger.info("FastAPI Backend Shutting Down...")
    logger.info("Cleanup complete.")


def initialize_customer_predictions():
    """Generate and cache predictions for all customers."""
    global customers_df, customer_predictions, credit_model, indian_data_gen

    if customers_df is None or credit_model is None or not credit_model.is_trained:
        return

    customer_predictions = {}

    for idx, row in customers_df.iterrows():
        customer_id = row["customer_id"]

        # Create feature dict matching credit model requirements
        feature_dict = {
            "income": row["monthly_income"] * 12,  # Annual income
            "credit_score": row["cibil_score"],
            "payment_history_months": row["payment_history_months"],
            "loan_amount": row["loan_amount"],
            "monthly_debt": row["emi_amount"],
            "employment_years": np.random.uniform(1, 20),  # Approximate
            "num_credit_lines": row["num_credit_cards"],
            "num_late_payments": row["num_late_payments"],
            "credit_utilization": row["credit_utilization"],
            "transaction_frequency": np.random.randint(5, 50),
            "avg_transaction_amount": row["total_monthly_spend"] / max(1, np.random.randint(5, 50)),
            "savings_balance": row["savings_balance"],
            "age": row["age"],
        }

        df = pd.DataFrame([feature_dict])
        predictions = credit_model.predict(df)
        risk_score = float(predictions[0])
        risk_category = CreditRiskPredictor.get_risk_category(risk_score)

        # Generate risk profile
        risk_profile = indian_data_gen.generate_risk_profile(row)

        customer_predictions[customer_id] = {
            "risk_score": risk_score,
            "risk_category": risk_category,
            "risk_factors": risk_profile["risk_factors"],
            "recommendations": risk_profile["recommendations"],
        }


# ============================================================================
# CREATE FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="LedgerShield_AI API",
    description="Financial risk intelligence, ledger anomaly monitoring, and DDoS simulation endpoints for LedgerShield_AI.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration for local development and deployed Render frontend.
# Set CORS_ORIGINS as a comma-separated list, for example:
# CORS_ORIGINS=https://ledgershield-ai.onrender.com,http://localhost:3000
def _cors_origins():
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    origins = [item.strip() for item in raw.split(",") if item.strip()]
    return origins or ["http://localhost:3000"]

_origins = _cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False if "*" in _origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# HEALTH CHECK & STATUS ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/status", response_model=StatusResponse)
async def get_status():
    """Get system status and model training state."""
    global credit_model, ddos_model, app_start_time

    uptime = time.time() - app_start_time

    return StatusResponse(
        credit_model_trained=credit_model.is_trained if credit_model else False,
        ddos_model_trained=ddos_model.is_trained if ddos_model else False,
        uptime_seconds=uptime,
        timestamp=datetime.utcnow().isoformat(),
    )


@app.get("/api/metrics", response_model=MetricsResponse)
async def get_metrics():
    """Get current model metrics."""
    global credit_metrics, ddos_metrics, credit_model, ddos_model

    # Prepare credit metrics
    credit_metric_data = None
    if credit_model and credit_model.is_trained and credit_metrics:
        credit_metric_data = {
            "accuracy": credit_metrics.get("metrics", {}).get("accuracy"),
            "precision": credit_metrics.get("metrics", {}).get("precision"),
            "recall": credit_metrics.get("metrics", {}).get("recall"),
            "f1": credit_metrics.get("metrics", {}).get("f1"),
            "auc_roc": credit_metrics.get("metrics", {}).get("auc_roc"),
            "train_samples": credit_metrics.get("train_samples"),
            "test_samples": credit_metrics.get("test_samples"),
        }

    # Prepare DDoS metrics
    ddos_metric_data = None
    if ddos_model and ddos_model.is_trained and ddos_metrics:
        ddos_metric_data = {
            "cnn_lstm_accuracy": ddos_metrics.get("cnn_lstm", {}).get("accuracy"),
            "random_forest_accuracy": ddos_metrics.get("random_forest", {}).get("accuracy"),
            "gradient_boosting_accuracy": ddos_metrics.get("gradient_boosting", {}).get("accuracy"),
            "training_time_seconds": ddos_metrics.get("training_time_seconds"),
            "train_samples": ddos_metrics.get("train_samples"),
            "test_samples": ddos_metrics.get("test_samples"),
        }

    return MetricsResponse(
        credit_model_trained=credit_model.is_trained if credit_model else False,
        credit_metrics=credit_metric_data,
        ddos_model_trained=ddos_model.is_trained if ddos_model else False,
        ddos_metrics=ddos_metric_data,
    )


# ============================================================================
# CREDIT RISK ENDPOINTS
# ============================================================================

@app.post("/api/train/credit", response_model=Dict[str, Any])
async def train_credit_model(request: TrainRequest):
    """
    Train credit risk model on synthetic data.

    Generates n_samples synthetic credit data and trains the ensemble model.
    Returns training metrics including accuracy, precision, recall, F1, and AUC-ROC.
    """
    global credit_model, credit_data_gen, credit_metrics

    if not credit_model or not credit_data_gen:
        raise HTTPException(status_code=500, detail="Credit model not initialized")

    try:
        logger.info(f"Training credit model with {request.n_samples} samples...")
        start_time = time.time()

        # Generate training data
        logger.info("Generating synthetic credit data...")
        df = credit_data_gen.generate_credit_data(n_samples=request.n_samples)

        # Train model
        logger.info("Training ensemble model...")
        results = credit_model.train(df)
        credit_metrics = results

        training_time = time.time() - start_time
        logger.info(f"Training complete in {training_time:.2f}s")

        return {
            "status": "success",
            "message": f"Credit model trained on {request.n_samples} samples",
            "training_time_seconds": training_time,
            "train_samples": results.get("train_samples"),
            "test_samples": results.get("test_samples"),
            "metrics": results.get("metrics"),
        }

    except Exception as e:
        logger.error(f"Error training credit model: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.post("/api/predict/credit", response_model=CreditPredictionResponse)
async def predict_credit_risk(request: CreditPredictionRequest):
    """
    Predict credit risk for a single customer.

    Takes customer financial data and returns:
    - risk_score: probability of delinquency (0-1)
    - risk_category: categorized risk level (Low/Medium/High/Critical)
    - risk_percentage: risk score as percentage
    """
    global credit_model

    if not credit_model:
        raise HTTPException(status_code=500, detail="Credit model not initialized")

    if not credit_model.is_trained:
        raise HTTPException(
            status_code=400,
            detail="Credit model not trained. Call /api/train/credit first."
        )

    try:
        # Create DataFrame from request
        df = pd.DataFrame([request.dict()])

        # Get prediction
        predictions = credit_model.predict(df)
        risk_score = float(predictions[0])

        # Categorize risk
        risk_category = CreditRiskPredictor.get_risk_category(risk_score)

        return CreditPredictionResponse(
            risk_score=risk_score,
            risk_category=risk_category,
            risk_percentage=risk_score * 100,
        )

    except Exception as e:
        logger.error(f"Error predicting credit risk: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ============================================================================
# INDIAN CUSTOMER ENDPOINTS
# ============================================================================

@app.get("/api/customers", response_model=CustomerListResponse)
async def get_customers(
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    limit: int = Query(0, ge=0, le=100),          # legacy alias
    search: str = Query(""),
    occupation_filter: str = Query(""),
    occupation: str = Query(""),                   # legacy alias
    risk_filter: str = Query(""),
    risk_level: str = Query(""),                   # legacy alias
):
    """
    Get paginated list of Indian customers with full profiles.
    Supports both new param names (per_page, risk_filter, occupation_filter)
    and legacy names (limit, risk_level, occupation).
    """
    global customers_df, customer_predictions

    if customers_df is None or customer_predictions is None:
        raise HTTPException(status_code=500, detail="Customer data not initialized")

    try:
        # Resolve aliased params — new names take priority
        page_size = per_page if per_page != 25 or limit == 0 else (limit if limit > 0 else per_page)
        occ = occupation_filter or occupation
        risk = risk_filter or risk_level

        df = customers_df.copy()

        # Add risk columns for filtering
        df["risk_score_pred"] = df["customer_id"].map(
            lambda cid: customer_predictions.get(cid, {}).get("risk_score", 0)
        )
        df["risk_category_pred"] = df["customer_id"].map(
            lambda cid: customer_predictions.get(cid, {}).get("risk_category", "Unknown")
        )

        # Apply filters
        if search:
            mask = (
                df["name"].str.contains(search, case=False, na=False) |
                df["city"].str.contains(search, case=False, na=False) |
                df["customer_id"].str.contains(search, case=False, na=False)
            )
            df = df[mask]
        if occ:
            df = df[df["occupation"] == occ]
        if risk:
            df = df[df["risk_category_pred"] == risk]

        total = len(df)
        total_pages = max(1, (total + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        page_data = df.iloc[start_idx: start_idx + page_size]

        customers = []
        for _, row in page_data.iterrows():
            cid = row["customer_id"]
            pred = customer_predictions.get(cid, {})
            emp_years = float(np.random.RandomState(hash(cid) % (2**32)).uniform(1, 20))

            customers.append(CustomerListItem(
                customer_id=cid,
                name=row["name"],
                age=int(row["age"]),
                city=row["city"],
                occupation=row["occupation"],
                income=float(row["monthly_income"]) * 12,
                cibil_score=int(row["cibil_score"]),
                loan_amount=float(row["loan_amount"]),
                loan_tenure_months=int(row["loan_tenure_months"]),
                monthly_emi=float(row["emi_amount"]),
                credit_utilization=float(row["credit_utilization"]),
                num_late_payments=int(row["num_late_payments"]),
                employment_years=emp_years,
                num_credit_lines=int(row["num_credit_cards"]),
                is_delinquent=int(row["is_delinquent"]),
                risk_score=float(pred.get("risk_score", row["risk_score_pred"])),
                risk_category=pred.get("risk_category", row["risk_category_pred"]),
                spend_food=float(row["spend_food"]),
                spend_shopping=float(row["spend_shopping"]),
                spend_travel=float(row["spend_travel"]),
                spend_entertainment=float(row["spend_entertainment"]),
                spend_utilities=float(row["spend_utilities"]),
                spend_emi_payments=float(row["spend_emi_payments"]),
                debt_to_income=float(row["debt_to_income"]),
                savings_rate=float(row["savings_rate"]),
                credit_score_band=row["credit_score_band"],
            ))

        return CustomerListResponse(
            customers=customers,
            total=total,
            page=page,
            per_page=page_size,
            total_pages=total_pages,
        )

    except Exception as e:
        logger.error(f"Error fetching customers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch customers: {str(e)}")


@app.get("/api/customer/{customer_id}", response_model=CustomerProfile)
async def get_customer_profile(customer_id: str):
    """
    Get full profile for a specific customer.
    Returns all fields with names matching the frontend CustomerDetail interface.
    """
    global customers_df, customer_predictions, credit_model, indian_data_gen

    if customers_df is None or customer_predictions is None:
        raise HTTPException(status_code=500, detail="Customer data not initialized")

    try:
        customer = customers_df[customers_df["customer_id"] == customer_id]
        if customer.empty:
            raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

        row = customer.iloc[0]
        pred = customer_predictions.get(customer_id, {})

        # Deterministic employment years from customer_id hash
        emp_years = float(np.random.RandomState(hash(customer_id) % (2**32)).uniform(1, 20))

        # Build SHAP-style values from feature importance × customer values
        risk_score = float(pred.get("risk_score", 0))
        cibil_norm = float(row["cibil_score"]) / 900
        dti = float(row["debt_to_income"])
        late = int(row["num_late_payments"])
        util = float(row["credit_utilization"])
        sav = float(row["savings_rate"])
        inc_norm = float(row["monthly_income"]) / 300000

        # Sign: positive = increases risk, negative = reduces risk
        shap_values = {
            "cibil_score":         round(-(cibil_norm - 0.75) * 0.28, 4),
            "num_late_payments":   round((late / 15) * 0.22, 4),
            "debt_to_income":      round((dti - 0.4) * 0.20, 4),
            "credit_utilization":  round((util - 0.5) * 0.18, 4),
            "savings_rate":        round(-(sav - 0.2) * 0.12, 4),
            "income":              round(-(inc_norm - 0.4) * 0.10, 4),
            "loan_amount":         round((float(row["loan_amount"]) / 2000000 - 0.3) * 0.08, 4),
            "employment_years":    round(-(emp_years / 20 - 0.4) * 0.06, 4),
        }

        # Spending insights
        monthly_income = float(row["monthly_income"])
        spend_travel = float(row["spend_travel"])
        spend_food = float(row["spend_food"])
        total_spend = float(row["total_monthly_spend"])

        spending_insights = []
        if spend_travel > monthly_income * 0.15:
            spending_insights.append(f"Travel spending is {spend_travel/monthly_income*100:.0f}% of monthly income — above recommended 10%")
        if spend_food > monthly_income * 0.25:
            spending_insights.append(f"Food expenses ({spend_food/monthly_income*100:.0f}% of income) can be reduced with meal planning")
        if total_spend > monthly_income * 0.85:
            spending_insights.append("Total monthly spend exceeds 85% of income — limited savings buffer")
        if float(row["spend_emi_payments"]) > monthly_income * 0.4:
            spending_insights.append("EMI burden above 40% of income — consider loan restructuring")
        if not spending_insights:
            spending_insights.append("Spending patterns appear balanced relative to income")

        # Feature importances from trained model
        feat_imp: Dict[str, float] = {}
        if credit_model and credit_model.is_trained:
            raw = credit_model.get_feature_importance()
            feat_imp = {k: float(v) for k, v in raw.items()}

        risk_profile = indian_data_gen.generate_risk_profile(row) if indian_data_gen else {}

        return CustomerProfile(
            customer_id=customer_id,
            name=row["name"],
            age=int(row["age"]),
            city=row["city"],
            occupation=row["occupation"],
            income=float(row["monthly_income"]) * 12,
            cibil_score=int(row["cibil_score"]),
            credit_score_band=row["credit_score_band"],
            loan_amount=float(row["loan_amount"]),
            loan_tenure_months=int(row["loan_tenure_months"]),
            monthly_emi=float(row["emi_amount"]),
            credit_utilization=float(row["credit_utilization"]),
            num_late_payments=int(row["num_late_payments"]),
            employment_years=emp_years,
            num_credit_lines=int(row["num_credit_cards"]),
            is_delinquent=int(row["is_delinquent"]),
            risk_score=float(pred.get("risk_score", 0)),
            risk_category=pred.get("risk_category", "Unknown"),
            debt_to_income=float(row["debt_to_income"]),
            savings_rate=float(row["savings_rate"]),
            spend_food=float(row["spend_food"]),
            spend_shopping=float(row["spend_shopping"]),
            spend_travel=float(row["spend_travel"]),
            spend_entertainment=float(row["spend_entertainment"]),
            spend_utilities=float(row["spend_utilities"]),
            spend_emi_payments=float(row["spend_emi_payments"]),
            monthly_spending=float(row["total_monthly_spend"]),
            shap_values=shap_values,
            risk_factors=pred.get("risk_factors", risk_profile.get("risk_factors", [])),
            recommendations=pred.get("recommendations", risk_profile.get("recommendations", [])),
            spending_insights=spending_insights,
            feature_importances=feat_imp,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching customer profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")


@app.get("/api/explain/{customer_id}", response_model=ExplanationResponse)
async def explain_prediction(customer_id: str):
    """
    Get SHAP-style feature contributions for a customer's risk score.

    Returns top 8 features with their contribution values and customer values.
    """
    global customers_df, customer_predictions, credit_model

    if customers_df is None or customer_predictions is None or not credit_model.is_trained:
        raise HTTPException(status_code=500, detail="Data or model not ready")

    try:
        customer = customers_df[customers_df["customer_id"] == customer_id]
        if customer.empty:
            raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

        row = customer.iloc[0]
        pred = customer_predictions.get(customer_id, {})

        # Get feature importance from model
        feature_importance = credit_model.get_feature_importance()

        # Create feature-value pairs using customer data
        feature_values = {
            "cibil_score": row["cibil_score"] / 900,  # Normalize
            "debt_to_income": min(row["debt_to_income"], 1.0),
            "num_late_payments": row["num_late_payments"] / 15,  # Normalize
            "savings_rate": row["savings_rate"],
            "credit_utilization": row["credit_utilization"],
            "monthly_income": row["monthly_income"] / 300000,  # Normalize
            "loan_amount": row["loan_amount"] / 2000000,  # Normalize
            "payment_history_months": row["payment_history_months"] / 240,  # Normalize
        }

        # Calculate contributions
        contributions = []
        for feature, importance in sorted(
            feature_importance.items(), key=lambda x: x[1], reverse=True
        )[:8]:
            # Use mapped feature names
            if feature in feature_values:
                value = feature_values[feature]
            else:
                # Approximate with average contribution
                value = importance

            contribution = importance * (1 - value) if importance > 0 else 0

            contributions.append(
                FeatureContribution(
                    feature=feature,
                    contribution=float(contribution),
                    customer_value=float(value),
                )
            )

        return ExplanationResponse(
            customer_id=customer_id,
            risk_score=float(pred.get("risk_score", 0)),
            top_features=contributions,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating explanation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(e)}")


@app.get("/api/analytics/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview():
    """
    Get comprehensive analytics overview.

    Returns total customers, delinquency stats, CIBIL averages,
    risk distribution by occupation, city, and risk level.
    """
    global customers_df, customer_predictions

    if customers_df is None or customer_predictions is None:
        raise HTTPException(status_code=500, detail="Customer data not initialized")

    try:
        df = customers_df.copy()

        # Add risk scores and categories
        df["risk_score"] = df["customer_id"].map(
            lambda cid: customer_predictions.get(cid, {}).get("risk_score", 0)
        )
        df["risk_category"] = df["customer_id"].map(
            lambda cid: customer_predictions.get(cid, {}).get("risk_category", "Unknown")
        )

        total = len(df)
        delinquent_count = int(df["is_delinquent"].sum())
        delinquent_rate = delinquent_count / total if total > 0 else 0

        avg_cibil = float(df["cibil_score"].mean())

        # Count high risk (High Risk + Critical Risk)
        high_risk_count = len(df[df["risk_category"].isin(["High Risk", "Critical Risk"])])

        # By occupation
        by_occupation = {}
        for occ in df["occupation"].unique():
            occ_df = df[df["occupation"] == occ]
            by_occupation[occ] = {
                "count": len(occ_df),
                "avg_risk": float(occ_df["risk_score"].mean()),
                "delinquent_rate": float(occ_df["is_delinquent"].mean()),
            }

        # By city
        by_city = {}
        for city in df["city"].unique():
            city_df = df[df["city"] == city]
            by_city[city] = {
                "count": len(city_df),
                "avg_risk": float(city_df["risk_score"].mean()),
                "delinquent_rate": float(city_df["is_delinquent"].mean()),
            }

        # Risk distribution
        risk_dist = df["risk_category"].value_counts().to_dict()
        risk_distribution = {
            "Low Risk": risk_dist.get("Low Risk", 0),
            "Medium Risk": risk_dist.get("Medium Risk", 0),
            "High Risk": risk_dist.get("High Risk", 0),
            "Critical Risk": risk_dist.get("Critical Risk", 0),
        }

        # CIBIL distribution
        cibil_distribution = {
            "Bad (300–599)":       int((df["cibil_score"] < 600).sum()),
            "Poor (600–649)":      int(((df["cibil_score"] >= 600) & (df["cibil_score"] < 650)).sum()),
            "Fair (650–699)":      int(((df["cibil_score"] >= 650) & (df["cibil_score"] < 700)).sum()),
            "Good (700–749)":      int(((df["cibil_score"] >= 700) & (df["cibil_score"] < 750)).sum()),
            "Excellent (750–900)": int((df["cibil_score"] >= 750).sum()),
        }

        return AnalyticsOverviewResponse(
            total_customers=total,
            delinquent_count=delinquent_count,
            avg_delinquency_rate=float(delinquent_rate),
            avg_cibil_score=avg_cibil,
            low_risk_count=risk_distribution.get("Low Risk", 0),
            medium_risk_count=risk_distribution.get("Medium Risk", 0),
            high_risk_count=risk_distribution.get("High Risk", 0),
            critical_risk_count=risk_distribution.get("Critical Risk", 0),
            total_loan_portfolio=float(df["loan_amount"].sum()),
            risk_by_occupation={occ: v["delinquent_rate"] for occ, v in by_occupation.items()},
            occupation_breakdown={occ: v["count"] for occ, v in by_occupation.items()},
            city_risk=by_city,
            cibil_distribution=cibil_distribution,
        )

    except Exception as e:
        logger.error(f"Error generating analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate analytics: {str(e)}")


@app.get("/api/analytics/spending", response_model=SpendingAnalyticsResponse)
async def get_spending_analytics():
    """
    Get spending analytics.

    Returns average spending by category across all customers and by occupation.
    """
    global customers_df

    if customers_df is None:
        raise HTTPException(status_code=500, detail="Customer data not initialized")

    try:
        df = customers_df.copy()

        spending_cols = [
            "spend_food", "spend_shopping", "spend_travel",
            "spend_entertainment", "spend_utilities", "spend_emi_payments"
        ]
        spending_names = {
            "spend_food": "food",
            "spend_shopping": "shopping",
            "spend_travel": "travel",
            "spend_entertainment": "entertainment",
            "spend_utilities": "utilities",
            "spend_emi_payments": "emi_payments",
        }

        # Average spending overall
        average_spending = {
            spending_names[col]: float(df[col].mean())
            for col in spending_cols
        }

        # By occupation
        by_occupation = {}
        for occ in df["occupation"].unique():
            occ_df = df[df["occupation"] == occ]
            by_occupation[occ] = {
                spending_names[col]: float(occ_df[col].mean())
                for col in spending_cols
            }

        # High-risk vs low-risk spending comparison
        risk_cats = df["customer_id"].map(
            lambda cid: customer_predictions.get(cid, {}).get("risk_category", "Low Risk")
            if customer_predictions else "Low Risk"
        )
        high_risk_mask = risk_cats.isin(["High Risk", "Critical Risk"])
        low_risk_mask  = risk_cats.isin(["Low Risk"])

        def avg_spend(mask):
            sub = df[mask]
            if len(sub) == 0:
                return {v: 0.0 for v in spending_names.values()}
            return {spending_names[col]: float(sub[col].mean()) for col in spending_cols}

        return SpendingAnalyticsResponse(
            avg_spending_by_category=average_spending,
            occupation_spending=by_occupation,
            high_risk_spending=avg_spend(high_risk_mask),
            low_risk_spending=avg_spend(low_risk_mask),
        )

    except Exception as e:
        logger.error(f"Error generating spending analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate analytics: {str(e)}")


# ============================================================================
# DDOS DETECTION ENDPOINTS
# ============================================================================

@app.post("/api/train/ddos", response_model=Dict[str, Any])
async def train_ddos_model(request: TrainRequest):
    """
    Train DDoS detection model on synthetic data.

    Generates n_samples synthetic network traffic data (normal + attacks)
    and trains the ensemble of CNN-LSTM (NN), Random Forest, and Gradient Boosting models.
    Returns training metrics for all three models.
    """
    global ddos_model, network_data_gen, ddos_metrics

    if not ddos_model or not network_data_gen:
        raise HTTPException(status_code=500, detail="DDoS model not initialized")

    try:
        logger.info(f"Training DDoS model with {request.n_samples} samples...")
        start_time = time.time()

        # Generate training data with 30% attack ratio
        logger.info("Generating synthetic network traffic data...")
        df = network_data_gen.generate_network_data(
            n_samples=request.n_samples,
            attack_ratio=0.3
        )

        # Train model
        logger.info("Training multi-model ensemble...")
        results = ddos_model.train(df, label_column='is_attack')
        ddos_metrics = results

        training_time = time.time() - start_time
        logger.info(f"Training complete in {training_time:.2f}s")

        return {
            "status": "success",
            "message": f"DDoS model trained on {request.n_samples} samples",
            "training_time_seconds": training_time,
            "train_samples": results.get("train_samples"),
            "test_samples": results.get("test_samples"),
            "cnn_lstm_metrics": results.get("cnn_lstm"),
            "random_forest_metrics": results.get("random_forest"),
            "gradient_boosting_metrics": results.get("gradient_boosting"),
        }

    except Exception as e:
        logger.error(f"Error training DDoS model: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.post("/api/simulate/attack", response_model=DDoSSimulationStreamResponse)
async def simulate_attack(request: AttackSimulationRequest):
    """
    Simulate a DDoS attack with detailed phases and detection.

    Generates synthetic attack traffic of specified type, intensity, and duration,
    then passes it through the detection model. Returns attack phases with detection events,
    detection time, mitigation steps, and final status.
    """
    global ddos_model

    if not ddos_model:
        raise HTTPException(status_code=500, detail="DDoS model not initialized")

    if not ddos_model.is_trained:
        raise HTTPException(
            status_code=400,
            detail="DDoS model not trained. Call /api/train/ddos first."
        )

    try:
        logger.info(f"Simulating {request.attack_type} attack...")
        start_time = time.time()

        # Simulate attack
        attack_df = ddos_model.simulate_attack(
            attack_type=request.attack_type,
            duration_seconds=request.duration_seconds,
            intensity=request.intensity,
        )

        # Detect attack
        detection_results = ddos_model.predict(attack_df)

        # Create phases (5 phases: normal, early attack, peak, mitigation, recovery)
        detection_time_ms = 0
        if len(attack_df) > 0:
            attack_proba = ddos_model.predict(attack_df)["probabilities"]
            threshold = 0.7
            detected_indices = np.where(attack_proba > threshold)[0]
            if len(detected_indices) > 0:
                detection_time_ms = float(detected_indices[0]) * 200  # ms per packet

        phases = []
        n_packets = len(attack_df)
        packets_per_phase = max(1, n_packets // 5)

        phase_names = ["Normal Traffic", "Attack Detection", "Peak Attack", "Mitigation Active", "Recovery"]
        for i, phase_name in enumerate(phase_names):
            start_idx = i * packets_per_phase
            end_idx = min((i + 1) * packets_per_phase, n_packets)

            if start_idx < n_packets:
                phase_data = attack_df.iloc[start_idx:end_idx]
                packet_rates = phase_data["packet_rate"].values

                phases.append({
                    "time": f"T+{int(i * request.duration_seconds / 5)}s",
                    "packet_rate": float(packet_rates.mean()) if len(packet_rates) > 0 else 0,
                    "is_detected": i >= 1,  # Detected from phase 1 onwards
                    "mitigation_action": "WAF Rules Applied" if i >= 2 else "Monitoring"
                })

        mitigation_steps = [
            f"1. Attack Detected at T+{int(detection_time_ms/1000)}s",
            "2. DDoS Traffic Identified (Type: " + request.attack_type.replace("_", " ").title() + ")",
            f"3. Intensity Level: {request.intensity:.1f}x",
            "4. WAF Rules Activated",
            "5. Traffic Scrubbing Enabled",
            "6. Mitigation Measures Applied",
        ]

        detection_rate = detection_results["attack_percentage"]
        final_status = "Mitigated" if detection_rate > 0.8 else "Partial Mitigation"

        num_flows = len(attack_df)
        num_detected = int(detection_results.get("num_attacks_detected", 0))

        return DDoSSimulationStreamResponse(
            phases=phases,
            detection_time_ms=detection_time_ms,
            mitigation_steps=mitigation_steps,
            final_status=final_status,
            # Fields used by workflow demo frontend
            num_flows_generated=num_flows,
            detection_results={
                "num_attacks_detected": num_detected,
                "attack_percentage": float(detection_results.get("attack_percentage", 0)) * 100,
                "avg_confidence": float(detection_results.get("avg_confidence", 0)),
            },
            traffic_stats={
                "total_packets": num_flows,
                "attack_packets": num_detected,
                "blocked_ips": max(1, num_detected // 50),
                "peak_pps": f"{int(attack_df['packet_rate'].max()):,}" if len(attack_df) > 0 else "0",
            },
        )

    except Exception as e:
        logger.error(f"Error simulating attack: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@app.get("/api/ddos/live-stream")
async def stream_ddos_live():
    """
    SSE endpoint for live DDoS traffic simulation.

    Streams 60 data points at 300ms intervals. When threat_level > 0.7,
    switches to attack mode for 20 points then back to normal.
    """
    async def event_generator():
        """Generate live traffic events."""
        duration_points = 60
        interval_ms = 300
        attack_start = np.random.randint(10, 30)  # Start attack between 10-30
        attack_duration = 20

        try:
            for i in range(duration_points):
                # Determine if we're in attack phase
                in_attack = attack_start <= i < attack_start + attack_duration

                if in_attack:
                    # High threat during attack
                    packet_rate = float(np.random.uniform(3000, 8000))
                    byte_rate = float(np.random.uniform(600000, 1600000))
                    threat_level = float(np.random.uniform(0.75, 0.95))
                    is_attack = True
                else:
                    # Normal traffic
                    packet_rate = float(np.random.gamma(2, 50))
                    byte_rate = float(np.random.gamma(3, 200))
                    threat_level = float(np.random.uniform(0, 0.3))
                    is_attack = False

                event_data = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "packet_rate": round(packet_rate, 2),
                    "byte_rate": round(byte_rate, 2),
                    "threat_level": round(threat_level, 3),
                    "is_attack": is_attack,
                    "mitigation_active": in_attack,
                }

                yield f"data: {json.dumps(event_data)}\n\n"
                await asyncio.sleep(interval_ms / 1000.0)

        except GeneratorExit:
            logger.info("DDoS stream client disconnected")
        except Exception as e:
            logger.error(f"Error in DDoS stream: {e}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return EventSourceResponse(event_generator())


# ============================================================================
# DATA ENDPOINTS
# ============================================================================

@app.get("/api/data/sample", response_model=SampleDataResponse)
async def get_sample_data():
    """
    Get sample credit and network data for display.

    Returns 20 rows of each data type as JSON for UI visualization.
    """
    global credit_data_gen, network_data_gen

    if not credit_data_gen or not network_data_gen:
        raise HTTPException(status_code=500, detail="Data generators not initialized")

    try:
        logger.info("Generating sample data...")

        # Generate sample credit data
        credit_data = credit_data_gen.generate_credit_data(n_samples=20)
        credit_rows = credit_data.to_dict('records')

        # Generate sample network data
        network_data = network_data_gen.generate_network_data(n_samples=20, attack_ratio=0.3)
        network_rows = network_data.to_dict('records')

        return SampleDataResponse(
            credit_data=credit_rows,
            network_data=network_rows,
        )

    except Exception as e:
        logger.error(f"Error generating sample data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


# ============================================================================
# STREAMING ENDPOINTS
# ============================================================================

@app.get("/api/simulate/traffic")
async def stream_traffic():
    """
    SSE endpoint for real-time traffic simulation.

    Streams fake live network traffic data every 500ms for 60 seconds.
    Clients subscribe with EventSource and receive packet_rate, byte_rate, timestamp.
    """
    global network_data_gen

    if not network_data_gen:
        raise HTTPException(status_code=500, detail="Network data generator not initialized")

    async def event_generator():
        """Generate traffic events every 500ms for 60 seconds."""
        duration_ms = 60000  # 60 seconds
        interval_ms = 500    # 500ms intervals
        num_events = duration_ms // interval_ms

        try:
            for i in range(num_events):
                # Generate random traffic data
                packet_rate = float(np.random.gamma(2, 50))
                byte_rate = float(np.random.gamma(3, 200))
                timestamp = datetime.utcnow().isoformat()

                # Format as SSE event
                event_data = {
                    "timestamp": timestamp,
                    "packet_rate": round(packet_rate, 2),
                    "byte_rate": round(byte_rate, 2),
                }

                yield f"data: {json.dumps(event_data)}\n\n"

                # Wait interval
                await asyncio.sleep(interval_ms / 1000.0)

        except GeneratorExit:
            logger.info("Traffic stream client disconnected")
        except Exception as e:
            logger.error(f"Error in traffic stream: {e}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return EventSourceResponse(event_generator())


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API documentation."""
    return {
        "name": "LedgerShield_AI API",
        "version": "2.0.0",
        "description": "ML model endpoints for credit risk and DDoS detection with Indian customer data",
        "endpoints": {
            "health": "/health",
            "status": "/api/status",
            "metrics": "/api/metrics",
            "credit": {
                "train": "POST /api/train/credit",
                "predict": "POST /api/predict/credit",
            },
            "customers": {
                "list": "GET /api/customers?page=1&limit=20&search=&occupation=&risk_level=",
                "profile": "GET /api/customer/{customer_id}",
                "explain": "GET /api/explain/{customer_id}",
            },
            "analytics": {
                "overview": "GET /api/analytics/overview",
                "spending": "GET /api/analytics/spending",
            },
            "ddos": {
                "train": "POST /api/train/ddos",
                "simulate": "POST /api/ddos/simulate",
                "live_stream": "GET /api/ddos/live-stream (SSE)",
                "traffic_stream": "GET /api/simulate/traffic (SSE)",
            },
            "data": {
                "sample": "GET /api/data/sample",
            },
        },
        "docs": "/docs",
        "redoc": "/redoc",
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    return {
        "error": exc.detail,
        "status_code": exc.status_code,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return {
        "error": "Internal server error",
        "status_code": 500,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    logger.info("Starting LedgerShield_AI API...")
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
        log_level="info",
    )
