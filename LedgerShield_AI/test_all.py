"""Full integration test for all modules."""
import sys, os, warnings
warnings.filterwarnings('ignore')

print('=== Test 1: Data Generators ===')
from data.data_generator import generate_credit_data, generate_network_data
credit = generate_credit_data(500)
network = generate_network_data(500)
print(f'Credit: {credit.shape}, delinquency: {credit["is_delinquent"].mean():.1%}')
print(f'Network: {network.shape}, attacks: {network["is_attack"].mean():.1%}')
print('PASS\n')

print('=== Test 2: Helpers ===')
from utils.helpers import format_risk_score, get_severity_color
print(f'Risk: {format_risk_score(0.75)}')
print('PASS\n')

print('=== Test 3: Correlation Engine ===')
from models.correlation_engine import CrossDomainCorrelationEngine
engine = CrossDomainCorrelationEngine()
score = engine.calculate_unified_risk_score(0.7, 0.8, 0.5)
print(f'Unified: {score:.4f}')
print('PASS\n')

print('=== Test 4: Credit Risk ===')
from models.credit_risk import CreditRiskPredictor
predictor = CreditRiskPredictor()
print(f'Category 0.8: {CreditRiskPredictor.get_risk_category(0.8)}')
results = predictor.train(credit)
print(f'Accuracy: {results["metrics"]["accuracy"]:.4f}')
print(f'AUC-ROC: {results["metrics"]["auc_roc"]:.4f}')
print('PASS\n')

print('=== Test 5: DDoS Detector ===')
from models.ddos_detector import DDoSDetector
detector = DDoSDetector()
attack = detector.simulate_attack('syn_flood', duration_seconds=5)
print(f'Attack sim: {attack.shape}')
net_train = network.rename(columns={'is_attack': 'label'})
res = detector.train(net_train)
print(f'NN Accuracy: {res["cnn_lstm"]["accuracy"]:.4f}')
print(f'RF Accuracy: {res["random_forest"]["accuracy"]:.4f}')
print('PASS\n')

print('=' * 50)
print('ALL 5 MODULES PASSED')
print('=' * 50)
