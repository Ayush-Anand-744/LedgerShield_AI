"""
DDoS Detection Module - CNN-LSTM Hybrid System
LedgerShield_AI: DDoS Simulation and Detection for Banking Security

This module implements a hybrid deep learning approach combining a Neural Network
(MLP as CNN-LSTM proxy) and Random Forest for detecting DDoS attacks in network
traffic data, with support for multiple attack simulation types.

The architecture uses:
- Primary: Multi-Layer Perceptron (Neural Network) for pattern detection
- Secondary: Random Forest for comparison and ensemble methods
- Attack Simulation: Synthetic traffic generation for testing

Note: For production deployment, replace MLPClassifier with a TensorFlow/Keras
CNN-LSTM model. The interface remains identical.

Author: AI System
Date: 2026-04-12
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple, Optional, List
import time
from datetime import datetime, timedelta

from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, classification_report
)

import warnings
warnings.filterwarnings('ignore')


class DDoSDetector:
    """
    Hybrid DDoS Detection System for FinTech Banking Applications

    This class implements a multi-model approach:
    - Primary: Neural Network (MLP) for complex pattern detection
    - Secondary: Random Forest for comparison and ensemble methods
    - Tertiary: Gradient Boosting for additional validation
    - Attack Simulation: Synthetic traffic generation for testing

    The MLP architecture mimics the feature extraction capability of CNN-LSTM:
    - Hidden layers act as feature extractors (analogous to CNN filters)
    - Sequential processing captures temporal patterns (analogous to LSTM cells)

    Attributes:
        nn_model: Scikit-learn MLPClassifier (Neural Network)
        rf_model: Scikit-learn Random Forest classifier
        gb_model: Scikit-learn Gradient Boosting classifier
        scaler: StandardScaler for feature normalization
        history: Training history dictionary
    """

    # Expected network features for preprocessing
    REQUIRED_FEATURES = [
        'packet_rate', 'byte_rate', 'packet_size_mean', 'packet_size_std',
        'flow_duration', 'protocol_type', 'src_ip_entropy', 'dst_port_entropy',
        'syn_flag_count', 'ack_flag_count', 'fin_flag_count', 'rst_flag_count',
        'flow_packets_per_sec', 'avg_inter_arrival_time'
    ]

    # Attack type configurations for simulation
    ATTACK_CONFIGS = {
        'syn_flood': {
            'packet_rate_multiplier': 10,
            'syn_flag_multiplier': 20,
            'packet_size': 40,
            'byte_rate_multiplier': 3
        },
        'udp_flood': {
            'packet_rate_multiplier': 8,
            'byte_rate_multiplier': 15,
            'packet_size': 1000,
            'flow_packets_per_sec_multiplier': 12
        },
        'http_flood': {
            'packet_rate_multiplier': 6,
            'flow_packets_per_sec_multiplier': 8,
            'packet_size': 512,
            'byte_rate_multiplier': 8
        },
        'slowloris': {
            'packet_rate_multiplier': 0.2,
            'flow_duration_multiplier': 50,
            'packet_size': 100,
            'avg_inter_arrival_time_multiplier': 3
        }
    }

    def __init__(self, verbose: int = 0):
        """
        Initialize DDoS Detector with model architectures.

        Args:
            verbose: Verbosity level (0=silent, 1=progress)
        """
        self.verbose = verbose

        # Model instances
        self.nn_model = None  # Neural Network (MLP - CNN-LSTM proxy)
        self.rf_model = None  # Random Forest
        self.gb_model = None  # Gradient Boosting

        # Preprocessing components
        self.scaler = StandardScaler()

        # Training tracking
        self.history = {}
        self.is_trained = False
        self.feature_names = None
        self._train_metrics = {}

        print("[DDoSDetector] Initialized - Multi-model DDoS Detection System")

    def preprocess(self, df: pd.DataFrame, fit: bool = True) -> np.ndarray:
        """
        Preprocess network traffic features for model input.

        Steps:
        1. Validate required features exist
        2. Handle missing values
        3. Normalize features using StandardScaler
        4. Engineer additional features (ratios, interactions)

        Args:
            df: DataFrame with network traffic features
            fit: Whether to fit the scaler (True for training, False for inference)

        Returns:
            Preprocessed feature array
        """
        # Validate features
        required_cols = [col for col in self.REQUIRED_FEATURES if col in df.columns]
        if not required_cols:
            raise ValueError(
                "DataFrame missing required features. Expected any of: {}".format(
                    self.REQUIRED_FEATURES
                )
            )

        # Store feature names on first run
        if self.feature_names is None:
            self.feature_names = required_cols

        df_features = df[required_cols].copy()

        # Handle missing values
        df_features = df_features.fillna(df_features.mean())

        # Feature engineering: create interaction features
        if 'packet_rate' in df_features.columns and 'byte_rate' in df_features.columns:
            df_features['bytes_per_packet'] = df_features['byte_rate'] / (df_features['packet_rate'] + 1)
        if 'syn_flag_count' in df_features.columns and 'ack_flag_count' in df_features.columns:
            df_features['syn_ack_ratio'] = df_features['syn_flag_count'] / (df_features['ack_flag_count'] + 1)
        if 'packet_rate' in df_features.columns and 'flow_duration' in df_features.columns:
            df_features['packets_per_duration'] = df_features['packet_rate'] * df_features['flow_duration']
        if 'src_ip_entropy' in df_features.columns and 'dst_port_entropy' in df_features.columns:
            df_features['entropy_product'] = df_features['src_ip_entropy'] * df_features['dst_port_entropy']

        # Normalize features
        if fit:
            normalized_features = self.scaler.fit_transform(df_features)
        else:
            # Handle new engineered features during inference
            if df_features.shape[1] != self.scaler.n_features_in_:
                self.scaler = StandardScaler()
                normalized_features = self.scaler.fit_transform(df_features)
            else:
                normalized_features = self.scaler.transform(df_features)

        return normalized_features

    def build_nn_model(self) -> MLPClassifier:
        """
        Build Neural Network (MLP) model mimicking CNN-LSTM architecture.

        Architecture layers (analogous to CNN-LSTM):
        - Layer 1 (256 units): Feature extraction (like Conv1D filters)
        - Layer 2 (128 units): Pattern compression (like MaxPooling)
        - Layer 3 (64 units): Temporal pattern learning (like LSTM)
        - Layer 4 (32 units): Classification preparation
        - Output: Binary classification (normal=0, attack=1)

        Returns:
            Configured MLPClassifier
        """
        model = MLPClassifier(
            hidden_layer_sizes=(256, 128, 64, 32),
            activation='relu',
            solver='adam',
            alpha=0.001,  # L2 regularization
            batch_size=32,
            learning_rate='adaptive',
            learning_rate_init=0.001,
            max_iter=200,
            shuffle=True,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.15,
            n_iter_no_change=10,
            verbose=False
        )
        return model

    def build_random_forest(self, n_estimators: int = 200) -> RandomForestClassifier:
        """
        Build Random Forest classifier for comparison.

        Args:
            n_estimators: Number of trees in the forest

        Returns:
            Configured RandomForestClassifier
        """
        rf_model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=20,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )
        return rf_model

    def build_gradient_boosting(self) -> GradientBoostingClassifier:
        """
        Build Gradient Boosting classifier for additional validation.

        Returns:
            Configured GradientBoostingClassifier
        """
        gb_model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42
        )
        return gb_model

    def train(self, df: pd.DataFrame, label_column: str = 'label',
              test_size: float = 0.2) -> Dict:
        """
        Train all three models on the provided data.

        Args:
            df: DataFrame with features and label column
            label_column: Name of the target label column (0=normal, 1=attack)
            test_size: Proportion of data for testing

        Returns:
            Dictionary with training results and model performance metrics
        """
        print("[Train] Starting multi-model training...")

        if label_column not in df.columns:
            raise ValueError("Label column '{}' not found in DataFrame".format(label_column))

        # Extract labels
        y = df[label_column].values.astype(int)

        # Preprocess features
        X = self.preprocess(df, fit=True)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        start_time = time.time()

        # Train Neural Network (CNN-LSTM proxy)
        print("[Train] Training Neural Network (CNN-LSTM architecture)...")
        self.nn_model = self.build_nn_model()
        self.nn_model.fit(X_train, y_train)

        # Train Random Forest
        print("[Train] Training Random Forest...")
        self.rf_model = self.build_random_forest()
        self.rf_model.fit(X_train, y_train)

        # Train Gradient Boosting
        print("[Train] Training Gradient Boosting...")
        self.gb_model = self.build_gradient_boosting()
        self.gb_model.fit(X_train, y_train)

        training_time = time.time() - start_time

        # Evaluate all models
        nn_metrics = self._evaluate_model(self.nn_model, X_test, y_test, "CNN-LSTM (NN)")
        rf_metrics = self._evaluate_model(self.rf_model, X_test, y_test, "Random Forest")
        gb_metrics = self._evaluate_model(self.gb_model, X_test, y_test, "Gradient Boosting")

        # Store history
        self.history = {
            'X_test': X_test,
            'y_test': y_test,
            'training_time': training_time,
            'nn_loss_curve': self.nn_model.loss_curve_ if hasattr(self.nn_model, 'loss_curve_') else [],
        }

        self._train_metrics = {
            'cnn_lstm': nn_metrics,
            'random_forest': rf_metrics,
            'gradient_boosting': gb_metrics
        }

        self.is_trained = True

        results = {
            'training_time_seconds': training_time,
            'cnn_lstm': nn_metrics,
            'random_forest': rf_metrics,
            'gradient_boosting': gb_metrics,
            'train_samples': len(X_train),
            'test_samples': len(X_test),
        }

        print("[Train] Training complete in {:.2f}s".format(training_time))
        print("[Train] CNN-LSTM (NN) Accuracy: {:.4f}".format(nn_metrics['accuracy']))
        print("[Train] Random Forest Accuracy: {:.4f}".format(rf_metrics['accuracy']))
        print("[Train] Gradient Boosting Accuracy: {:.4f}".format(gb_metrics['accuracy']))

        return results

    def _evaluate_model(self, model, X_test, y_test, model_name="Model"):
        """Evaluate a single model and return metrics dict."""
        start_time = time.time()
        y_pred = model.predict(X_test)
        detection_time = (time.time() - start_time) / len(X_test) * 1000

        y_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else y_pred.astype(float)

        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0

        metrics = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, zero_division=0)),
            'f1': float(f1_score(y_test, y_pred, zero_division=0)),
            'false_positive_rate': float(fpr),
            'detection_time_ms': float(detection_time),
            'true_positives': int(tp),
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'auc_roc': float(roc_auc_score(y_test, y_proba)) if len(np.unique(y_test)) > 1 else 0.0
        }

        return metrics

    def predict(self, df: pd.DataFrame, threshold: float = 0.5) -> Dict:
        """
        Predict DDoS attacks using ensemble of all three models.

        Args:
            df: DataFrame with network traffic features
            threshold: Classification threshold for binary prediction (0-1)

        Returns:
            Dictionary with predictions and confidence scores
        """
        if self.nn_model is None:
            raise RuntimeError("Model not trained. Call train() first.")

        X = self.preprocess(df, fit=False)

        # Get predictions from all models
        nn_proba = self.nn_model.predict_proba(X)[:, 1]
        rf_proba = self.rf_model.predict_proba(X)[:, 1]
        gb_proba = self.gb_model.predict_proba(X)[:, 1]

        # Ensemble: weighted average (NN gets highest weight)
        ensemble_proba = 0.5 * nn_proba + 0.3 * rf_proba + 0.2 * gb_proba
        predictions = (ensemble_proba > threshold).astype(int)

        num_attacks = int(np.sum(predictions))

        return {
            'predictions': predictions,
            'probabilities': ensemble_proba,
            'nn_probabilities': nn_proba,
            'rf_probabilities': rf_proba,
            'gb_probabilities': gb_proba,
            'num_attacks_detected': num_attacks,
            'attack_percentage': float(num_attacks / len(predictions) * 100) if len(predictions) > 0 else 0.0
        }

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray,
                 threshold: float = 0.5) -> Dict:
        """
        Evaluate primary model (Neural Network) performance on test data.

        Args:
            X_test: Test features (preprocessed)
            y_test: Test labels (0/1)
            threshold: Classification threshold

        Returns:
            Dictionary with evaluation metrics
        """
        if self.nn_model is None:
            raise RuntimeError("Model not trained. Call train() first.")

        return self._evaluate_model(self.nn_model, X_test, y_test, "CNN-LSTM")

    def simulate_attack(self, attack_type: str, duration_seconds: int = 10,
                        intensity: float = 1.0, base_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        Simulate realistic DDoS attack traffic.

        Supports attack types:
        - 'syn_flood': TCP SYN packet floods, high syn_flag_count
        - 'udp_flood': Large volume of UDP packets, high byte_rate
        - 'http_flood': HTTP request floods, moderate packet_rate
        - 'slowloris': Slow connection attacks, very long flow_duration

        Args:
            attack_type: Type of attack to simulate
            duration_seconds: Duration of attack in seconds
            intensity: Intensity multiplier (1.0 = normal, 2.0 = twice as intense)
            base_df: Optional baseline normal traffic to modify

        Returns:
            DataFrame with simulated attack traffic
        """
        if attack_type.lower() not in self.ATTACK_CONFIGS:
            raise ValueError(
                "Unsupported attack type: {}. Supported: {}".format(
                    attack_type, list(self.ATTACK_CONFIGS.keys())
                )
            )

        attack_type = attack_type.lower()
        config = self.ATTACK_CONFIGS[attack_type]

        # Generate base traffic
        if base_df is None:
            num_flows = max(10, duration_seconds * 5)
            base_data = {
                'packet_rate': np.random.uniform(100, 500, num_flows),
                'byte_rate': np.random.uniform(5000, 50000, num_flows),
                'packet_size_mean': np.random.uniform(100, 800, num_flows),
                'packet_size_std': np.random.uniform(20, 200, num_flows),
                'flow_duration': np.random.uniform(1, 10, num_flows),
                'protocol_type': np.random.choice([6, 17], num_flows),
                'src_ip_entropy': np.random.uniform(2, 8, num_flows),
                'dst_port_entropy': np.random.uniform(1, 10, num_flows),
                'syn_flag_count': np.random.uniform(5, 50, num_flows),
                'ack_flag_count': np.random.uniform(5, 50, num_flows),
                'fin_flag_count': np.random.uniform(1, 20, num_flows),
                'rst_flag_count': np.random.uniform(1, 10, num_flows),
                'flow_packets_per_sec': np.random.uniform(10, 100, num_flows),
                'avg_inter_arrival_time': np.random.uniform(0.001, 0.1, num_flows)
            }
            attack_df = pd.DataFrame(base_data)
        else:
            attack_df = base_df.copy()

        # Apply attack patterns
        if attack_type == 'syn_flood':
            attack_df['packet_rate'] *= config['packet_rate_multiplier'] * intensity
            attack_df['syn_flag_count'] *= config['syn_flag_multiplier'] * intensity
            attack_df['packet_size_mean'] = config['packet_size']
            attack_df['byte_rate'] *= config['byte_rate_multiplier'] * intensity
            attack_df['protocol_type'] = 6
            attack_df['src_ip_entropy'] = np.random.uniform(0.5, 2, len(attack_df))

        elif attack_type == 'udp_flood':
            attack_df['packet_rate'] *= config['packet_rate_multiplier'] * intensity
            attack_df['byte_rate'] *= config['byte_rate_multiplier'] * intensity
            attack_df['packet_size_mean'] = config['packet_size']
            attack_df['flow_packets_per_sec'] *= config['flow_packets_per_sec_multiplier'] * intensity
            attack_df['protocol_type'] = 17
            attack_df['syn_flag_count'] = np.random.uniform(0, 5, len(attack_df))

        elif attack_type == 'http_flood':
            attack_df['packet_rate'] *= config['packet_rate_multiplier'] * intensity
            attack_df['flow_packets_per_sec'] *= config['flow_packets_per_sec_multiplier'] * intensity
            attack_df['packet_size_mean'] = config['packet_size']
            attack_df['byte_rate'] *= config['byte_rate_multiplier'] * intensity
            attack_df['protocol_type'] = 6
            attack_df['dst_port_entropy'] = np.random.uniform(0.5, 2, len(attack_df))

        elif attack_type == 'slowloris':
            attack_df['packet_rate'] *= config['packet_rate_multiplier'] * intensity
            attack_df['flow_duration'] *= config['flow_duration_multiplier'] * intensity
            attack_df['packet_size_mean'] = config['packet_size']
            attack_df['avg_inter_arrival_time'] *= config['avg_inter_arrival_time_multiplier'] * intensity
            attack_df['protocol_type'] = 6
            attack_df['ack_flag_count'] *= 2

        # Add labels and metadata
        attack_df['label'] = 1
        attack_df['attack_type'] = attack_type
        attack_df['timestamp'] = pd.date_range(
            start=datetime.now(),
            periods=len(attack_df),
            freq='{}ms'.format(max(1, int((duration_seconds * 1000) / len(attack_df))))
        )

        return attack_df

    def get_traffic_stats(self, df: pd.DataFrame) -> Dict:
        """
        Generate real-time traffic statistics and anomaly indicators.

        Args:
            df: DataFrame with network traffic features

        Returns:
            Dictionary with traffic statistics and anomaly flags
        """
        stats = {}

        # Core statistics
        for col in ['packet_rate', 'byte_rate', 'flow_duration']:
            if col in df.columns:
                stats['{}_stats'.format(col)] = {
                    'mean': float(df[col].mean()),
                    'std': float(df[col].std()),
                    'min': float(df[col].min()),
                    'max': float(df[col].max()),
                    'median': float(df[col].median()),
                    'p95': float(df[col].quantile(0.95))
                }

        # Protocol distribution
        if 'protocol_type' in df.columns:
            protocol_counts = df['protocol_type'].value_counts().to_dict()
            stats['protocol_distribution'] = {int(k): int(v) for k, v in protocol_counts.items()}

        # Entropy statistics
        entropy_stats = {}
        for col in ['src_ip_entropy', 'dst_port_entropy']:
            if col in df.columns:
                entropy_stats[col] = {
                    'mean': float(df[col].mean()),
                    'min': float(df[col].min()),
                    'max': float(df[col].max())
                }
        stats['entropy_stats'] = entropy_stats

        # Flag statistics
        flag_stats = {}
        for flag_col in ['syn_flag_count', 'ack_flag_count', 'fin_flag_count', 'rst_flag_count']:
            if flag_col in df.columns:
                flag_stats[flag_col] = {
                    'total': int(df[flag_col].sum()),
                    'mean': float(df[flag_col].mean())
                }
        stats['flag_statistics'] = flag_stats

        # Anomaly indicators
        anomalies = {
            'high_packet_rate': False,
            'high_byte_rate': False,
            'high_syn_count': False,
            'low_entropy': False,
            'prolonged_flow': False
        }

        if 'packet_rate_stats' in stats:
            anomalies['high_packet_rate'] = stats['packet_rate_stats']['mean'] > 1000

        if 'byte_rate_stats' in stats:
            anomalies['high_byte_rate'] = stats['byte_rate_stats']['mean'] > 100000

        if 'syn_flag_count' in flag_stats:
            anomalies['high_syn_count'] = flag_stats['syn_flag_count']['mean'] > 50

        if entropy_stats.get('src_ip_entropy', {}).get('min', 10) < 2:
            anomalies['low_entropy'] = True

        if 'flow_duration_stats' in stats:
            anomalies['prolonged_flow'] = stats['flow_duration_stats']['mean'] > 30

        stats['anomaly_indicators'] = anomalies
        stats['num_anomalies'] = sum(anomalies.values())

        return stats

    def get_model_comparison(self) -> Dict:
        """
        Get comparison metrics across all trained models.

        Returns:
            Dictionary with model comparison data
        """
        if not self.is_trained:
            return {}

        return self._train_metrics

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance from Random Forest model.

        Returns:
            Dictionary of feature names to importance scores
        """
        if self.rf_model is None:
            return {}

        feature_cols = list(self.feature_names) if self.feature_names else self.REQUIRED_FEATURES
        # Add engineered features
        feature_cols = feature_cols + ['bytes_per_packet', 'syn_ack_ratio',
                                        'packets_per_duration', 'entropy_product']
        importances = self.rf_model.feature_importances_

        # Trim to match
        n = min(len(feature_cols), len(importances))
        importance_dict = dict(zip(feature_cols[:n], importances[:n].tolist()))
        return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))


if __name__ == "__main__":
    print("=" * 60)
    print("DDoS Detection System - Test")
    print("=" * 60)

    detector = DDoSDetector()

    # Generate normal traffic
    np.random.seed(42)
    normal = pd.DataFrame({
        'packet_rate': np.random.uniform(100, 400, 500),
        'byte_rate': np.random.uniform(5000, 40000, 500),
        'packet_size_mean': np.random.uniform(100, 800, 500),
        'packet_size_std': np.random.uniform(20, 200, 500),
        'flow_duration': np.random.uniform(0.5, 20, 500),
        'protocol_type': np.random.choice([6, 17], 500),
        'src_ip_entropy': np.random.uniform(4, 8, 500),
        'dst_port_entropy': np.random.uniform(4, 10, 500),
        'syn_flag_count': np.random.uniform(5, 30, 500),
        'ack_flag_count': np.random.uniform(5, 30, 500),
        'fin_flag_count': np.random.uniform(1, 15, 500),
        'rst_flag_count': np.random.uniform(1, 10, 500),
        'flow_packets_per_sec': np.random.uniform(10, 80, 500),
        'avg_inter_arrival_time': np.random.uniform(0.001, 0.1, 500),
        'label': 0
    })

    # Generate attacks
    attacks = []
    for atype in ['syn_flood', 'udp_flood', 'http_flood', 'slowloris']:
        attacks.append(detector.simulate_attack(atype, duration_seconds=10, intensity=1.5))
    attack_data = pd.concat(attacks, ignore_index=True)

    # Combine
    data = pd.concat([normal, attack_data], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)
    print(f"Training data: {data.shape}, Attack ratio: {data['label'].mean():.2%}")

    # Train
    results = detector.train(data)

    # Test prediction
    test_attack = detector.simulate_attack('syn_flood', duration_seconds=5)
    preds = detector.predict(test_attack)
    print(f"\nAttack detection: {preds['num_attacks_detected']}/{len(preds['predictions'])} detected")
    print(f"Mean confidence: {preds['probabilities'].mean():.4f}")

    print("\n" + "=" * 60)
    print("All tests passed!")
    print("=" * 60)
