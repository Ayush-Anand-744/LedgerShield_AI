"""
Utility Helper Functions for AI-Based Pre-Delinquency Detection and DDoS Simulation System

This module provides utility functions for model evaluation, visualization, and alert
formatting in a FinTech banking environment.

Author: AI Project Team
Date: 2026
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple, List, Union, Any
from datetime import datetime
import plotly.graph_objects as go
import plotly.express as px
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    roc_curve,
    auc,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)


# Severity levels and color mapping
SEVERITY_COLORS = {
    'critical': '#D32F2F',    # Red
    'high': '#F57C00',        # Orange
    'medium': '#FBC02D',      # Yellow
    'low': '#388E3C',         # Green
    'info': '#1976D2',        # Blue
}

RISK_SCORE_COLORS = {
    'critical': '#D32F2F',    # Red (0.8-1.0)
    'high': '#F57C00',        # Orange (0.6-0.8)
    'medium': '#FBC02D',      # Yellow (0.4-0.6)
    'low': '#388E3C',         # Green (0.0-0.4)
}


def format_risk_score(score: float) -> Dict[str, Union[str, float]]:
    """
    Format a 0-1 risk score as a percentage with color coding.

    Args:
        score (float): Risk score between 0 and 1

    Returns:
        Dict: Dictionary containing formatted score, percentage, color, and severity
              Example: {
                  'score': 0.75,
                  'percentage': '75.0%',
                  'color': '#F57C00',
                  'severity': 'high'
              }
    """
    score = np.clip(score, 0, 1)
    percentage = f'{score * 100:.1f}%'

    if score >= 0.8:
        severity = 'critical'
        color = RISK_SCORE_COLORS['critical']
    elif score >= 0.6:
        severity = 'high'
        color = RISK_SCORE_COLORS['high']
    elif score >= 0.4:
        severity = 'medium'
        color = RISK_SCORE_COLORS['medium']
    else:
        severity = 'low'
        color = RISK_SCORE_COLORS['low']

    return {
        'score': score,
        'percentage': percentage,
        'color': color,
        'severity': severity,
    }


def get_severity_color(severity: str) -> str:
    """
    Get hex color code for a severity level.

    Args:
        severity (str): Severity level - 'critical', 'high', 'medium', 'low', or 'info'

    Returns:
        str: Hex color code for the severity level
    """
    return SEVERITY_COLORS.get(severity.lower(), SEVERITY_COLORS['info'])


def calculate_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray = None,
) -> Dict[str, float]:
    """
    Calculate comprehensive ML evaluation metrics.

    Metrics calculated:
        - Accuracy: Overall correctness
        - Precision: True positives / (True positives + False positives)
        - Recall: True positives / (True positives + False negatives)
        - F1-Score: Harmonic mean of precision and recall
        - ROC-AUC: Area under ROC curve (only if y_prob provided)
        - Specificity: True negatives / (True negatives + False positives)
        - Sensitivity: Same as recall

    Args:
        y_true (np.ndarray): True labels
        y_pred (np.ndarray): Predicted labels
        y_prob (np.ndarray, optional): Predicted probabilities for positive class

    Returns:
        Dict[str, float]: Dictionary of all calculated metrics
                         Example: {
                             'accuracy': 0.92,
                             'precision': 0.88,
                             'recall': 0.85,
                             'f1_score': 0.86,
                             'roc_auc': 0.94,
                             'specificity': 0.95,
                             'sensitivity': 0.85
                         }
    """
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    metrics = {
        'accuracy': accuracy_score(y_true, y_pred),
        'precision': precision_score(y_true, y_pred, zero_division=0),
        'recall': recall_score(y_true, y_pred, zero_division=0),
        'f1_score': f1_score(y_true, y_pred, zero_division=0),
    }

    # Calculate ROC-AUC if probabilities provided
    if y_prob is not None:
        y_prob = np.array(y_prob)
        try:
            metrics['roc_auc'] = roc_auc_score(y_true, y_prob)
        except ValueError:
            metrics['roc_auc'] = np.nan

    # Calculate specificity and sensitivity
    cm = confusion_matrix(y_true, y_pred)
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
        metrics['specificity'] = specificity
        metrics['sensitivity'] = sensitivity

    return metrics


def create_confusion_matrix_fig(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    labels: List[str] = None,
) -> go.Figure:
    """
    Create an interactive confusion matrix visualization using Plotly.

    Args:
        y_true (np.ndarray): True labels
        y_pred (np.ndarray): Predicted labels
        labels (List[str], optional): Class labels for axes
                                     Default: ['Negative', 'Positive']

    Returns:
        go.Figure: Plotly figure object with heatmap
    """
    if labels is None:
        labels = ['Negative', 'Positive']

    cm = confusion_matrix(y_true, y_pred)

    fig = go.Figure(data=go.Heatmap(
        z=cm,
        x=labels,
        y=labels,
        text=cm,
        texttemplate='%{text}',
        textfont={"size": 14},
        colorscale='Blues',
        hoverongaps=False,
    ))

    fig.update_layout(
        title='Confusion Matrix',
        xaxis_title='Predicted Label',
        yaxis_title='True Label',
        width=500,
        height=500,
        font=dict(size=12),
    )

    return fig


def create_roc_curve_fig(
    y_true: np.ndarray,
    y_prob: np.ndarray,
) -> go.Figure:
    """
    Create an interactive ROC curve visualization using Plotly.

    Args:
        y_true (np.ndarray): True labels (binary)
        y_prob (np.ndarray): Predicted probabilities for positive class

    Returns:
        go.Figure: Plotly figure object with ROC curve
    """
    y_true = np.array(y_true)
    y_prob = np.array(y_prob)

    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    roc_auc = auc(fpr, tpr)

    fig = go.Figure()

    # ROC curve
    fig.add_trace(go.Scatter(
        x=fpr,
        y=tpr,
        mode='lines',
        name=f'ROC Curve (AUC = {roc_auc:.3f})',
        line=dict(color='#1f77b4', width=2),
        hovertemplate='FPR: %{x:.3f}<br>TPR: %{y:.3f}<extra></extra>',
    ))

    # Diagonal reference line
    fig.add_trace(go.Scatter(
        x=[0, 1],
        y=[0, 1],
        mode='lines',
        name='Random Classifier',
        line=dict(color='gray', width=1, dash='dash'),
        hoverinfo='skip',
    ))

    fig.update_layout(
        title='ROC Curve',
        xaxis_title='False Positive Rate',
        yaxis_title='True Positive Rate',
        width=600,
        height=600,
        font=dict(size=12),
        hovermode='closest',
    )

    fig.update_xaxes(range=[0, 1])
    fig.update_yaxes(range=[0, 1])

    return fig


def create_feature_importance_fig(
    importances: Union[np.ndarray, List[float]],
    feature_names: List[str],
    top_n: int = 15,
) -> go.Figure:
    """
    Create a feature importance visualization using Plotly.

    Args:
        importances (Union[np.ndarray, List[float]]): Feature importance scores
        feature_names (List[str]): Names of features
        top_n (int): Number of top features to display (default: 15)

    Returns:
        go.Figure: Plotly bar chart figure
    """
    importances = np.array(importances)
    feature_names = np.array(feature_names)

    # Sort by importance and select top N
    sorted_indices = np.argsort(importances)[::-1][:top_n]
    sorted_importances = importances[sorted_indices]
    sorted_names = feature_names[sorted_indices]

    fig = go.Figure(data=[
        go.Bar(
            x=sorted_importances,
            y=sorted_names,
            orientation='h',
            marker=dict(
                color=sorted_importances,
                colorscale='Viridis',
                showscale=True,
            ),
        )
    ])

    fig.update_layout(
        title=f'Feature Importance (Top {top_n})',
        xaxis_title='Importance Score',
        yaxis_title='Feature',
        width=700,
        height=500,
        font=dict(size=11),
        yaxis={'categoryorder': 'total ascending'},
    )

    return fig


def create_shap_summary_fig(
    shap_values: np.ndarray,
    feature_names: List[str],
    plot_type: str = 'bar',
) -> go.Figure:
    """
    Create a SHAP summary visualization using Plotly.

    This creates a simplified SHAP summary that doesn't require the shap library.
    Uses aggregated SHAP values to show feature importance and direction of impact.

    Args:
        shap_values (np.ndarray): SHAP values array (n_samples x n_features)
        feature_names (List[str]): Names of features
        plot_type (str): Type of plot - 'bar' or 'beeswarm' (default: 'bar')

    Returns:
        go.Figure: Plotly figure object
    """
    shap_values = np.array(shap_values)

    if plot_type == 'bar':
        # Calculate mean absolute SHAP values for each feature
        mean_abs_shap = np.mean(np.abs(shap_values), axis=0)
        sorted_indices = np.argsort(mean_abs_shap)[::-1][:15]

        sorted_values = mean_abs_shap[sorted_indices]
        sorted_names = np.array(feature_names)[sorted_indices]

        fig = go.Figure(data=[
            go.Bar(
                x=sorted_values,
                y=sorted_names,
                orientation='h',
                marker=dict(color='#1f77b4'),
            )
        ])

        fig.update_layout(
            title='SHAP Summary - Mean Absolute Impact',
            xaxis_title='Mean |SHAP value|',
            yaxis_title='Feature',
            width=700,
            height=500,
            font=dict(size=11),
            yaxis={'categoryorder': 'total ascending'},
        )

    else:  # beeswarm-style scatter
        # Create scatter plot showing distribution of SHAP values
        fig = go.Figure()

        for i, feature_name in enumerate(feature_names[:15]):
            fig.add_trace(go.Scatter(
                y=[feature_name] * len(shap_values),
                x=shap_values[:, i],
                mode='markers',
                name=feature_name,
                marker=dict(size=5, opacity=0.6),
                hovertemplate=f'{feature_name}: %{{x:.3f}}<extra></extra>',
            ))

        fig.update_layout(
            title='SHAP Summary - Value Distribution',
            xaxis_title='SHAP Value',
            yaxis_title='Feature',
            width=700,
            height=600,
            font=dict(size=11),
            showlegend=False,
        )

    return fig


def format_alert(
    alert_type: str,
    severity: str,
    message: str,
    timestamp: datetime = None,
) -> Dict[str, Any]:
    """
    Format an alert as a structured dictionary.

    Args:
        alert_type (str): Type of alert - 'delinquency_risk', 'ddos_attack', etc.
        severity (str): Severity level - 'critical', 'high', 'medium', 'low', 'info'
        message (str): Alert message text
        timestamp (datetime, optional): Alert timestamp (default: current time)

    Returns:
        Dict[str, Any]: Structured alert dictionary
                       Example: {
                           'id': 'ALT_20260412_001',
                           'type': 'delinquency_risk',
                           'severity': 'high',
                           'color': '#F57C00',
                           'message': 'Customer at risk of delinquency',
                           'timestamp': '2026-04-12T14:30:45.123456',
                           'readable_time': 'Today at 2:30 PM'
                       }
    """
    if timestamp is None:
        timestamp = datetime.now()

    alert_id = f"ALT_{timestamp.strftime('%Y%m%d')}_{np.random.randint(100, 999)}"

    # Format readable timestamp
    now = datetime.now()
    time_diff = now - timestamp
    if time_diff.total_seconds() < 60:
        readable_time = 'Just now'
    elif time_diff.total_seconds() < 3600:
        minutes = int(time_diff.total_seconds() / 60)
        readable_time = f'{minutes} minute{"s" if minutes > 1 else ""} ago'
    elif time_diff.total_seconds() < 86400:
        hours = int(time_diff.total_seconds() / 3600)
        readable_time = f'{hours} hour{"s" if hours > 1 else ""} ago'
    else:
        readable_time = timestamp.strftime('%b %d at %I:%M %p')

    alert = {
        'id': alert_id,
        'type': alert_type,
        'severity': severity.lower(),
        'color': get_severity_color(severity),
        'message': message,
        'timestamp': timestamp.isoformat(),
        'readable_time': readable_time,
    }

    return alert


def create_classification_report_dict(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    target_names: List[str] = None,
) -> Dict[str, Any]:
    """
    Create a detailed classification report as a dictionary.

    Args:
        y_true (np.ndarray): True labels
        y_pred (np.ndarray): Predicted labels
        target_names (List[str], optional): Names for classes

    Returns:
        Dict[str, Any]: Classification report with metrics per class
    """
    if target_names is None:
        target_names = ['Negative', 'Positive']

    report_str = classification_report(
        y_true,
        y_pred,
        target_names=target_names,
        output_dict=False,
    )

    report_dict = classification_report(
        y_true,
        y_pred,
        target_names=target_names,
        output_dict=True,
    )

    return {
        'report_string': report_str,
        'report_dict': report_dict,
        'overall_accuracy': report_dict['accuracy'],
    }


def create_performance_summary(
    metrics: Dict[str, float],
    threshold: float = 0.5,
) -> Dict[str, Any]:
    """
    Create a performance summary from metrics dictionary.

    Args:
        metrics (Dict[str, float]): Metrics dictionary from calculate_metrics()
        threshold (float): Decision threshold used

    Returns:
        Dict[str, Any]: Performance summary with formatted values and insights
    """
    summary = {
        'threshold': threshold,
        'accuracy': f"{metrics.get('accuracy', 0):.1%}",
        'precision': f"{metrics.get('precision', 0):.1%}",
        'recall': f"{metrics.get('recall', 0):.1%}",
        'f1_score': f"{metrics.get('f1_score', 0):.1%}",
        'roc_auc': f"{metrics.get('roc_auc', 0):.3f}",
        'specificity': f"{metrics.get('specificity', 0):.1%}",
        'sensitivity': f"{metrics.get('sensitivity', 0):.1%}",
    }

    # Add performance interpretation
    auc = metrics.get('roc_auc', 0)
    if auc >= 0.9:
        auc_rating = 'Excellent'
    elif auc >= 0.8:
        auc_rating = 'Good'
    elif auc >= 0.7:
        auc_rating = 'Fair'
    else:
        auc_rating = 'Poor'

    summary['roc_auc_rating'] = auc_rating

    return summary


def validate_predictions(
    y_pred: np.ndarray,
    y_prob: np.ndarray = None,
) -> Dict[str, Any]:
    """
    Validate prediction arrays for consistency and quality.

    Args:
        y_pred (np.ndarray): Predicted labels
        y_prob (np.ndarray, optional): Predicted probabilities

    Returns:
        Dict[str, Any]: Validation report with any issues found
    """
    issues = []

    if y_pred is None or len(y_pred) == 0:
        issues.append('Predictions array is empty')
        return {'valid': False, 'issues': issues}

    # Check prediction values
    unique_values = np.unique(y_pred)
    if not all(v in [0, 1] for v in unique_values):
        issues.append('Predictions contain non-binary values')

    # Check probabilities if provided
    if y_prob is not None:
        if np.any(y_prob < 0) or np.any(y_prob > 1):
            issues.append('Probabilities contain values outside [0, 1]')

        if len(y_prob) != len(y_pred):
            issues.append('Probability array length mismatch with predictions')

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'n_predictions': len(y_pred),
    }


# Demo/testing function
if __name__ == '__main__':
    # Example usage
    print("Testing helper functions...\n")

    # Test risk score formatting
    print("Risk Score Formatting:")
    for score in [0.15, 0.45, 0.65, 0.85]:
        formatted = format_risk_score(score)
        print(f"  Score {score}: {formatted['percentage']} ({formatted['severity']})")

    # Test alert formatting
    print("\nAlert Formatting:")
    alert = format_alert(
        'delinquency_risk',
        'high',
        'Customer showing signs of payment difficulties'
    )
    print(f"  Alert ID: {alert['id']}")
    print(f"  Type: {alert['type']}")
    print(f"  Message: {alert['message']}")

    # Test metrics
    print("\nMetrics Calculation:")
    y_true = np.array([0, 1, 1, 0, 1, 0, 1, 1, 0, 0])
    y_pred = np.array([0, 1, 1, 0, 1, 0, 0, 1, 0, 1])
    y_prob = np.array([0.1, 0.9, 0.8, 0.2, 0.85, 0.15, 0.3, 0.95, 0.1, 0.6])

    metrics = calculate_metrics(y_true, y_pred, y_prob)
    print(f"  Accuracy: {metrics['accuracy']:.1%}")
    print(f"  Precision: {metrics['precision']:.1%}")
    print(f"  Recall: {metrics['recall']:.1%}")
    print(f"  F1-Score: {metrics['f1_score']:.1%}")
    print(f"  ROC-AUC: {metrics['roc_auc']:.3f}")

    print("\nHelper functions loaded successfully!")
