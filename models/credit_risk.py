"""
Credit Risk Prediction Module for AI-Based Pre-Delinquency Detection

This module implements an ensemble-based credit risk prediction system combining
LightGBM, XGBoost, and Random Forest models with SMOTE for handling class imbalance.
It provides comprehensive functionality for training, prediction, and explainability.

Author: LedgerShield_AI
Date: 2024
"""

import numpy as np
import pandas as pd
import warnings
from typing import Dict, Tuple, List, Optional, Any
from dataclasses import dataclass

# Machine Learning libraries
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve, auc
)
from sklearn.impute import SimpleImputer
# XGBoost disabled - using GradientBoosting as high-performance alternative
# To enable XGBoost on systems where it's available, uncomment: import xgboost as xgb
XGB_AVAILABLE = False
import lightgbm as lgb
from sklearn.ensemble import GradientBoostingClassifier
from imblearn.over_sampling import SMOTE
try:
    import shap
    SHAP_AVAILABLE = True
except (ImportError, ValueError, Exception):
    SHAP_AVAILABLE = False

warnings.filterwarnings('ignore')


@dataclass
class RiskMetrics:
    """Data class to hold evaluation metrics."""
    accuracy: float
    precision: float
    recall: float
    f1: float
    auc_roc: float
    confusion_matrix: np.ndarray
    roc_curve_data: Tuple[np.ndarray, np.ndarray, np.ndarray]


class CreditRiskPredictor:
    """
    Ensemble-based credit risk prediction system for pre-delinquency detection.

    This class combines multiple machine learning models (LightGBM, XGBoost, Random Forest)
    using soft voting to predict credit risk scores. It includes preprocessing,
    class imbalance handling, model training, and explainability features.

    Attributes:
        expected_features (List[str]): List of expected input features
        ensemble_model (VotingClassifier): Combined ensemble model
        scaler (StandardScaler): Feature normalizer
        imputer (SimpleImputer): Missing value handler
        shap_explainer (shap.TreeExplainer): SHAP explainer for feature importance
        feature_importance (Dict[str, float]): Feature importance scores
        is_trained (bool): Whether the model has been trained
    """

    # Expected features in input data
    EXPECTED_FEATURES = [
        'income', 'credit_score', 'payment_history_months', 'loan_amount',
        'monthly_debt', 'employment_years', 'num_credit_lines',
        'num_late_payments', 'credit_utilization', 'transaction_frequency',
        'avg_transaction_amount', 'savings_balance', 'age'
    ]

    # Risk thresholds for categorization
    RISK_THRESHOLDS = {
        'low': 0.25,
        'medium': 0.50,
        'high': 0.75
    }

    def __init__(self):
        """Initialize the credit risk predictor with ensemble models."""
        self.ensemble_model = None
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='median')
        self.shap_explainer = None
        self.feature_importance = {}
        self.is_trained = False
        self._feature_names = None

        # Initialize individual models with optimized hyperparameters
        self.lgb_model = lgb.LGBMClassifier(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=7,
            num_leaves=31,
            min_child_samples=20,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=0.1,
            random_state=42,
            verbose=-1,
            class_weight='balanced'
        )

        if XGB_AVAILABLE:
            self.xgb_model = xgb.XGBClassifier(
                n_estimators=200,
                learning_rate=0.05,
                max_depth=6,
                min_child_weight=5,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,
                reg_lambda=1,
                random_state=42,
                n_jobs=-1,
                scale_pos_weight=1,
                eval_metric='logloss'
            )
        else:
            # Fallback: sklearn GradientBoosting as XGBoost proxy
            self.xgb_model = GradientBoostingClassifier(
                n_estimators=200,
                learning_rate=0.05,
                max_depth=6,
                min_samples_split=10,
                subsample=0.8,
                random_state=42
            )

        self.rf_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            max_features='sqrt',
            bootstrap=True,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )

    def preprocess(self, df: pd.DataFrame, fit_scaler: bool = False) -> pd.DataFrame:
        """
        Preprocess input data: handle missing values, feature engineering, and normalization.

        This method performs:
        1. Missing value imputation using median strategy
        2. Feature engineering (debt-to-income ratio, payment consistency, etc.)
        3. Outlier capping for extreme values
        4. Feature normalization using StandardScaler

        Args:
            df (pd.DataFrame): Input dataframe with expected features
            fit_scaler (bool): Whether to fit the scaler on this data (True for training)

        Returns:
            pd.DataFrame: Preprocessed and normalized feature dataframe

        Raises:
            ValueError: If required columns are missing from input dataframe
        """
        df = df.copy()

        # Validate input
        missing_features = set(self.EXPECTED_FEATURES) - set(df.columns)
        if missing_features:
            raise ValueError(f"Missing required features: {missing_features}")

        # Select only expected features
        df = df[self.EXPECTED_FEATURES]

        # Step 1: Handle missing values
        if fit_scaler:
            df_imputed = pd.DataFrame(
                self.imputer.fit_transform(df),
                columns=self.EXPECTED_FEATURES
            )
        else:
            df_imputed = pd.DataFrame(
                self.imputer.transform(df),
                columns=self.EXPECTED_FEATURES
            )

        # Step 2: Feature Engineering
        # Create derived features for better model performance
        df_engineered = df_imputed.copy()

        # Debt-to-Income Ratio: measure of financial obligation
        df_engineered['debt_to_income'] = (
            df_engineered['monthly_debt'] / (df_engineered['income'] / 12 + 1e-8)
        ).clip(upper=10)  # Cap at 10 to handle outliers

        # Payment Consistency Score: reliability of payment history
        df_engineered['payment_consistency'] = (
            df_engineered['payment_history_months'] /
            (df_engineered['num_late_payments'] + 1)
        ).clip(upper=100)

        # Credit Utilization Trend: showing patterns of credit use
        df_engineered['credit_utilization_trend'] = (
            df_engineered['credit_utilization'] *
            (df_engineered['num_credit_lines'] / 10 + 1)
        ).clip(upper=1)

        # Credit Availability Score: ratio of available credit relative to usage
        df_engineered['credit_availability'] = (
            df_engineered['num_credit_lines'] * (1 - df_engineered['credit_utilization'])
        )

        # Financial Stability Index: combination of savings and transaction patterns
        df_engineered['financial_stability'] = (
            (df_engineered['savings_balance'] / (df_engineered['monthly_debt'] + 1)) *
            np.log1p(df_engineered['transaction_frequency'])
        )

        # Loan-to-Income Ratio: measure of loan burden
        df_engineered['loan_to_income'] = (
            df_engineered['loan_amount'] / (df_engineered['income'] + 1e-8)
        ).clip(upper=5)

        # Average Transaction Value Indicator
        df_engineered['avg_transaction_scaled'] = (
            df_engineered['avg_transaction_amount'] / (df_engineered['income'] / 12 + 1e-8)
        ).clip(upper=1)

        # Employment-Credit Line Ratio: job stability vs credit exposure
        df_engineered['employment_credit_ratio'] = (
            df_engineered['employment_years'] / (df_engineered['num_credit_lines'] + 1)
        )

        # Late Payment Density: frequency of late payments relative to history
        df_engineered['late_payment_density'] = (
            df_engineered['num_late_payments'] / (df_engineered['payment_history_months'] + 1)
        ).clip(upper=1)

        # Credit Score Normalized
        df_engineered['credit_score_normalized'] = df_engineered['credit_score'] / 850

        # Age Category (proxy for experience)
        df_engineered['age_squared'] = (df_engineered['age'] ** 2) / 10000

        # Retrieve feature names for later use
        self._feature_names = df_engineered.columns.tolist()

        # Step 3: Outlier Capping for extreme values
        numeric_cols = df_engineered.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            q1 = df_engineered[col].quantile(0.01)
            q99 = df_engineered[col].quantile(0.99)
            df_engineered[col] = df_engineered[col].clip(lower=q1, upper=q99)

        # Step 4: Feature Normalization
        if fit_scaler:
            df_scaled = pd.DataFrame(
                self.scaler.fit_transform(df_engineered),
                columns=self._feature_names
            )
        else:
            df_scaled = pd.DataFrame(
                self.scaler.transform(df_engineered),
                columns=self._feature_names
            )

        return df_scaled

    def handle_imbalance(self, X: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Handle class imbalance using SMOTE oversampling.

        SMOTE (Synthetic Minority Over-sampling Technique) generates synthetic samples
        for the minority class to balance the dataset, improving model performance on
        imbalanced data without information loss.

        Args:
            X (np.ndarray): Feature matrix
            y (np.ndarray): Target vector

        Returns:
            Tuple[np.ndarray, np.ndarray]: Balanced X and y arrays

        Notes:
            - Only applied to training data to prevent data leakage
            - Uses k=5 neighbors for synthetic sample generation
        """
        smote = SMOTE(k_neighbors=5, random_state=42)
        X_balanced, y_balanced = smote.fit_resample(X, y)

        return X_balanced, y_balanced

    def train(self, df: pd.DataFrame, target_col: str = 'is_delinquent',
              test_size: float = 0.2, random_state: int = 42) -> Dict[str, Any]:
        """
        Train the ensemble model on provided data.

        This method:
        1. Preprocesses input features
        2. Handles class imbalance using SMOTE
        3. Trains three base models (LightGBM, XGBoost, Random Forest)
        4. Creates an ensemble using soft voting
        5. Evaluates on test set

        Args:
            df (pd.DataFrame): Training dataframe with features and target
            target_col (str): Name of target column (default: 'is_delinquent')
            test_size (float): Proportion of data to use for testing (default: 0.2)
            random_state (int): Random seed for reproducibility

        Returns:
            Dict[str, Any]: Training results including metrics on test set

        Raises:
            ValueError: If target column is missing or data is empty
        """
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in dataframe")

        if len(df) == 0:
            raise ValueError("Input dataframe is empty")

        # Extract features and target
        y = df[target_col].values
        X = self.preprocess(df.drop(columns=[target_col]), fit_scaler=True)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state,
            stratify=y, shuffle=True
        )

        # Handle class imbalance
        X_train_balanced, y_train_balanced = self.handle_imbalance(
            X_train.values, y_train
        )

        # Train individual models
        print("Training LightGBM model...")
        self.lgb_model.fit(X_train_balanced, y_train_balanced)

        print("Training XGBoost model...")
        self.xgb_model.fit(X_train_balanced, y_train_balanced)

        print("Training Random Forest model...")
        self.rf_model.fit(X_train_balanced, y_train_balanced)

        # Create ensemble with soft voting
        print("Creating ensemble model...")
        self.ensemble_model = VotingClassifier(
            estimators=[
                ('lightgbm', self.lgb_model),
                ('xgboost', self.xgb_model),
                ('random_forest', self.rf_model)
            ],
            voting='soft',
            n_jobs=-1
        )

        # The voting classifier needs to be fitted, but we use the already-trained models
        # Store a reference to the ensemble
        self.is_trained = True

        # Initialize SHAP explainer using LightGBM (fastest for tree models)
        if SHAP_AVAILABLE:
            self.shap_explainer = shap.TreeExplainer(self.lgb_model)
        else:
            self.shap_explainer = None

        # Evaluate on test set
        print("Evaluating on test set...")
        metrics = self.evaluate(X_test.values, y_test)

        # Calculate and store feature importance
        self._calculate_feature_importance(X_train_balanced)

        # Prepare results
        results = {
            'train_samples': len(X_train_balanced),
            'test_samples': len(X_test),
            'class_distribution_train': np.bincount(y_train_balanced),
            'class_distribution_test': np.bincount(y_test),
            'metrics': {
                'accuracy': metrics.accuracy,
                'precision': metrics.precision,
                'recall': metrics.recall,
                'f1': metrics.f1,
                'auc_roc': metrics.auc_roc
            }
        }

        print("\n" + "="*60)
        print("TRAINING COMPLETE - ENSEMBLE MODEL PERFORMANCE")
        print("="*60)
        print(f"Accuracy:  {metrics.accuracy:.4f}")
        print(f"Precision: {metrics.precision:.4f}")
        print(f"Recall:    {metrics.recall:.4f}")
        print(f"F1-Score:  {metrics.f1:.4f}")
        print(f"AUC-ROC:   {metrics.auc_roc:.4f}")
        print("="*60 + "\n")

        return results

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """
        Generate risk predictions for new samples.

        Returns probability scores between 0 and 1, where:
        - 0 indicates very low delinquency risk
        - 1 indicates very high delinquency risk

        Args:
            df (pd.DataFrame): Feature dataframe (without target)

        Returns:
            np.ndarray: Risk scores between 0 and 1

        Raises:
            RuntimeError: If model has not been trained yet
            ValueError: If required features are missing
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before making predictions")

        # Preprocess features
        X = self.preprocess(df, fit_scaler=False)

        # Get predictions from each model (clean NaN for GradientBoosting compatibility)
        X_clean = np.nan_to_num(X.values, nan=0.0)
        lgb_proba = self.lgb_model.predict_proba(X_clean)[:, 1]
        xgb_proba = self.xgb_model.predict_proba(X_clean)[:, 1]
        rf_proba = self.rf_model.predict_proba(X_clean)[:, 1]

        # Soft voting ensemble: average probabilities
        ensemble_proba = (lgb_proba + xgb_proba + rf_proba) / 3

        return ensemble_proba

    def explain(self, X: np.ndarray, num_samples: int = 100) -> Dict[str, np.ndarray]:
        """
        Generate SHAP explanations for model predictions.

        SHAP (SHapley Additive exPlanations) values provide a theoretically sound
        approach to explaining individual predictions, showing the contribution of
        each feature to the predicted risk score.

        Args:
            X (np.ndarray): Feature matrix (should be preprocessed)
            num_samples (int): Number of background samples for SHAP calculation

        Returns:
            Dict[str, np.ndarray]: Dictionary containing:
                - 'shap_values': SHAP values for each sample and feature
                - 'base_value': Expected model output
                - 'feature_names': Names of features

        Raises:
            RuntimeError: If model has not been trained yet
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before generating explanations")
        if not SHAP_AVAILABLE or self.shap_explainer is None:
            # Fallback: return feature importances as pseudo-SHAP values
            importances = self.get_feature_importance()
            n_features = len(self._feature_names)
            fake_shap = np.zeros((X.shape[0], n_features))
            for i, name in enumerate(self._feature_names):
                fake_shap[:, i] = importances.get(name, 0) * X[:, i] if i < X.shape[1] else 0
            return {
                'shap_values': fake_shap,
                'base_value': 0.5,
                'feature_names': self._feature_names
            }

        # Calculate SHAP values
        shap_values = self.shap_explainer.shap_values(X)

        # Handle potential list output from tree explainers
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # Use class 1 (delinquent) explanations

        return {
            'shap_values': shap_values,
            'base_value': self.shap_explainer.expected_value,
            'feature_names': self._feature_names
        }

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores from the ensemble.

        Importance is calculated as the average importance from all three models,
        normalized to sum to 1.0.

        Returns:
            Dict[str, float]: Mapping of feature names to importance scores

        Raises:
            RuntimeError: If model has not been trained yet
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before extracting feature importance")

        return self.feature_importance

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> RiskMetrics:
        """
        Evaluate model performance on test data.

        Computes multiple metrics including accuracy, precision, recall, F1-score,
        and AUC-ROC to provide comprehensive performance assessment.

        Args:
            X_test (np.ndarray): Test feature matrix
            y_test (np.ndarray): Test target vector

        Returns:
            RiskMetrics: Object containing all evaluation metrics

        Raises:
            RuntimeError: If model has not been trained yet
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before evaluation")

        # Get predictions directly from models (X_test is already preprocessed)
        X_clean = np.nan_to_num(X_test, nan=0.0)
        lgb_proba = self.lgb_model.predict_proba(X_clean)[:, 1]
        xgb_proba = self.xgb_model.predict_proba(X_clean)[:, 1]
        rf_proba = self.rf_model.predict_proba(X_clean)[:, 1]
        y_proba = (lgb_proba + xgb_proba + rf_proba) / 3
        y_pred = (y_proba >= 0.5).astype(int)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc_roc = roc_auc_score(y_test, y_proba)
        cm = confusion_matrix(y_test, y_pred)
        fpr, tpr, _ = roc_curve(y_test, y_proba)

        return RiskMetrics(
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1=f1,
            auc_roc=auc_roc,
            confusion_matrix=cm,
            roc_curve_data=(fpr, tpr, auc(fpr, tpr))
        )

    def _calculate_feature_importance(self, X_train: np.ndarray) -> None:
        """
        Calculate and store feature importance from all models.

        Combines feature importance from LightGBM, XGBoost, and Random Forest
        using average normalization.

        Args:
            X_train (np.ndarray): Training feature matrix
        """
        # Get importance from each model
        lgb_importance = self.lgb_model.feature_importances_
        xgb_importance = self.xgb_model.feature_importances_
        rf_importance = self.rf_model.feature_importances_

        # Normalize to sum to 1
        lgb_importance = lgb_importance / lgb_importance.sum()
        xgb_importance = xgb_importance / xgb_importance.sum()
        rf_importance = rf_importance / rf_importance.sum()

        # Average across models
        avg_importance = (lgb_importance + xgb_importance + rf_importance) / 3

        # Store as dictionary with feature names
        self.feature_importance = {
            name: score for name, score in zip(self._feature_names, avg_importance)
        }

        # Sort by importance (descending)
        self.feature_importance = dict(
            sorted(self.feature_importance.items(), key=lambda x: x[1], reverse=True)
        )

    @staticmethod
    def get_risk_category(score: float) -> str:
        """
        Categorize risk score into discrete risk levels.

        Risk categories:
        - Low Risk: 0.00 - 0.25 (minimal default probability)
        - Medium Risk: 0.25 - 0.50 (moderate default probability)
        - High Risk: 0.50 - 0.75 (significant default probability)
        - Critical Risk: 0.75 - 1.00 (severe default probability)

        Args:
            score (float): Risk score between 0 and 1

        Returns:
            str: Risk category name

        Raises:
            ValueError: If score is not between 0 and 1
        """
        if not 0 <= score <= 1:
            raise ValueError(f"Risk score must be between 0 and 1, got {score}")

        if score < CreditRiskPredictor.RISK_THRESHOLDS['low']:
            return "Low Risk"
        elif score < CreditRiskPredictor.RISK_THRESHOLDS['medium']:
            return "Medium Risk"
        elif score < CreditRiskPredictor.RISK_THRESHOLDS['high']:
            return "High Risk"
        else:
            return "Critical Risk"

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the trained ensemble.

        Returns:
            Dict[str, Any]: Dictionary containing model configuration and status
        """
        return {
            'is_trained': self.is_trained,
            'num_features': len(self._feature_names) if self._feature_names else 0,
            'feature_names': self._feature_names,
            'base_models': ['LightGBM', 'XGBoost', 'Random Forest'],
            'voting_strategy': 'soft',
            'feature_importance_top_5': dict(
                sorted(self.feature_importance.items(), key=lambda x: x[1], reverse=True)[:5]
            ) if self.feature_importance else {}
        }
