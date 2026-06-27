# Lazy imports to avoid TensorFlow loading on every import
# Import individual modules directly when needed:
#   from models.credit_risk import CreditRiskPredictor
#   from models.ddos_detector import DDoSDetector
#   from models.correlation_engine import CrossDomainCorrelationEngine

__all__ = [
    'CreditRiskPredictor',
    'DDoSDetector',
    'CrossDomainCorrelationEngine',
]

def __getattr__(name):
    if name == 'CreditRiskPredictor':
        from .credit_risk import CreditRiskPredictor
        return CreditRiskPredictor
    elif name == 'DDoSDetector':
        from .ddos_detector import DDoSDetector
        return DDoSDetector
    elif name == 'CrossDomainCorrelationEngine':
        from .correlation_engine import CrossDomainCorrelationEngine
        return CrossDomainCorrelationEngine
    raise AttributeError(f"module 'models' has no attribute {name}")
