"""
Data Generator Module for AI-Based Pre-Delinquency Detection and DDoS Simulation System

This module provides synthetic data generation for both credit risk assessment and
network traffic analysis in a FinTech banking environment.

Author: AI Project Team
Date: 2026
"""

import numpy as np
import pandas as pd
from typing import Tuple, Dict, List
from datetime import datetime, timedelta


class CreditDataGenerator:
    """Generate realistic synthetic credit risk data for delinquency detection."""

    def __init__(self, random_state: int = 42):
        """
        Initialize the credit data generator.

        Args:
            random_state (int): Seed for reproducibility
        """
        self.random_state = random_state
        np.random.seed(random_state)

    def generate_credit_data(self, n_samples: int = 5000) -> pd.DataFrame:
        """
        Generate realistic credit risk data with features correlated to delinquency.

        Features:
            - income: Annual income in dollars (20k-200k)
            - credit_score: Credit score (300-850)
            - payment_history_months: Months of payment history (0-360)
            - loan_amount: Loan amount in dollars (1k-500k)
            - monthly_debt: Monthly debt obligations (100-5000)
            - employment_years: Years of employment (0-40)
            - num_credit_lines: Number of active credit lines (1-20)
            - num_late_payments: Number of late payments in history (0-20)
            - credit_utilization: Ratio of used credit to available (0-1)
            - transaction_frequency: Transactions per month (1-100)
            - avg_transaction_amount: Average transaction amount in dollars (10-5000)
            - savings_balance: Savings account balance in dollars (0-100000)
            - age: Customer age in years (18-75)

        Target:
            - is_delinquent: Binary target (0=non-delinquent, 1=delinquent)
              Realistic class distribution with ~15% positive class

        Args:
            n_samples (int): Number of samples to generate (default: 5000)

        Returns:
            pd.DataFrame: DataFrame with features and target variable
        """
        np.random.seed(self.random_state)

        # Generate base features
        income = np.random.uniform(20000, 200000, n_samples)
        credit_score = np.random.normal(680, 120, n_samples)
        credit_score = np.clip(credit_score, 300, 850)

        payment_history_months = np.random.randint(0, 361, n_samples)
        loan_amount = np.random.uniform(1000, 500000, n_samples)
        monthly_debt = np.random.uniform(100, 5000, n_samples)
        employment_years = np.random.uniform(0, 40, n_samples)
        num_credit_lines = np.random.randint(1, 21, n_samples)
        num_late_payments = np.random.negative_binomial(5, 0.7, n_samples)
        num_late_payments = np.clip(num_late_payments, 0, 20)

        credit_utilization = np.random.beta(2, 2, n_samples)
        transaction_frequency = np.random.randint(1, 101, n_samples)
        avg_transaction_amount = np.random.lognormal(3.5, 1.2, n_samples)
        avg_transaction_amount = np.clip(avg_transaction_amount, 10, 5000)

        savings_balance = np.random.exponential(10000, n_samples)
        savings_balance = np.clip(savings_balance, 0, 100000)
        age = np.random.normal(45, 15, n_samples)
        age = np.clip(age, 18, 75).astype(int)

        # Calculate debt-to-income ratio as a risk factor
        debt_to_income = monthly_debt * 12 / (income + 1)

        # Create delinquency target based on risk factors
        risk_score = (
            (1 - credit_score / 850) * 0.25  # Low score = high risk
            + (debt_to_income / 2) * 0.25  # High debt-to-income = high risk
            + (num_late_payments / 20) * 0.25  # Previous late payments = high risk
            + (credit_utilization) * 0.15  # High utilization = high risk
            + (1 - savings_balance / 100000) * 0.10  # Low savings = high risk
        )

        # Add realistic noise
        noise = np.random.normal(0, 0.1, n_samples)
        risk_score = np.clip(risk_score + noise, 0, 1)

        # Convert risk score to binary delinquency with ~15% positive class
        threshold = np.percentile(risk_score, 85)  # Top 15% are delinquent
        is_delinquent = (risk_score > threshold).astype(int)

        # Create DataFrame
        data = pd.DataFrame({
            'income': income,
            'credit_score': credit_score.astype(int),
            'payment_history_months': payment_history_months,
            'loan_amount': loan_amount,
            'monthly_debt': monthly_debt,
            'employment_years': employment_years,
            'num_credit_lines': num_credit_lines,
            'num_late_payments': num_late_payments,
            'credit_utilization': credit_utilization,
            'transaction_frequency': transaction_frequency,
            'avg_transaction_amount': avg_transaction_amount,
            'savings_balance': savings_balance,
            'age': age,
            'is_delinquent': is_delinquent
        })

        return data


class NetworkDataGenerator:
    """Generate realistic synthetic network traffic data for DDoS detection."""

    def __init__(self, random_state: int = 42):
        """
        Initialize the network data generator.

        Args:
            random_state (int): Seed for reproducibility
        """
        self.random_state = random_state
        np.random.seed(random_state)

        self.protocols = ['TCP', 'UDP', 'ICMP', 'Other']
        self.protocol_encoding = {p: i for i, p in enumerate(self.protocols)}

    def generate_network_data(
        self, n_samples: int = 10000, attack_ratio: float = 0.3
    ) -> pd.DataFrame:
        """
        Generate realistic network traffic data with normal and attack patterns.

        Features:
            - packet_rate: Packets per second (varies by traffic type)
            - byte_rate: Bytes per second (varies by traffic type)
            - packet_size_mean: Mean packet size in bytes
            - packet_size_std: Standard deviation of packet sizes
            - flow_duration: Flow duration in seconds
            - protocol_type: Protocol encoded as integer (TCP=0, UDP=1, ICMP=2, Other=3)
            - src_ip_entropy: Entropy of source IP addresses (0-8 bits)
            - dst_port_entropy: Entropy of destination ports (0-16 bits)
            - syn_flag_count: Count of SYN flags
            - ack_flag_count: Count of ACK flags
            - fin_flag_count: Count of FIN flags
            - rst_flag_count: Count of RST flags
            - flow_packets_per_sec: Packets per second within flow
            - avg_inter_arrival_time: Average inter-packet arrival time (ms)

        Target:
            - is_attack: Binary target (0=normal, 1=attack)

        Args:
            n_samples (int): Number of samples to generate (default: 10000)
            attack_ratio (float): Proportion of attack samples (default: 0.3)

        Returns:
            pd.DataFrame: DataFrame with network features and target variable
        """
        np.random.seed(self.random_state)

        n_attacks = int(n_samples * attack_ratio)
        n_normal = n_samples - n_attacks

        # Generate normal traffic
        normal_data = self._generate_normal_traffic(n_normal)
        normal_data['is_attack'] = 0

        # Generate attack traffic (various attack types)
        attack_data = self._generate_attack_traffic(n_attacks)
        attack_data['is_attack'] = 1

        # Combine and shuffle
        data = pd.concat([normal_data, attack_data], ignore_index=True)
        data = data.sample(frac=1).reset_index(drop=True)

        return data

    def _generate_normal_traffic(self, n_samples: int) -> pd.DataFrame:
        """Generate normal network traffic patterns."""
        # Normal traffic characteristics
        packet_rate = np.random.gamma(shape=2, scale=50, size=n_samples)
        byte_rate = packet_rate * np.random.gamma(shape=3, scale=200, size=n_samples)
        packet_size_mean = np.random.normal(500, 200, n_samples)
        packet_size_mean = np.clip(packet_size_mean, 20, 1500)
        packet_size_std = np.random.gamma(shape=2, scale=100, size=n_samples)
        flow_duration = np.random.exponential(scale=30, size=n_samples)
        flow_duration = np.clip(flow_duration, 0.1, 300)

        # Protocol distribution for normal traffic
        protocol_type = np.random.choice(
            [0, 1, 2, 3], size=n_samples, p=[0.6, 0.3, 0.05, 0.05]
        )

        # IP and port entropy
        src_ip_entropy = np.random.beta(2, 5, n_samples) * 8
        dst_port_entropy = np.random.beta(3, 3, n_samples) * 16

        # TCP flags (moderate values for normal traffic)
        syn_flag_count = np.random.poisson(3, n_samples)
        ack_flag_count = np.random.poisson(8, n_samples)
        fin_flag_count = np.random.poisson(2, n_samples)
        rst_flag_count = np.random.poisson(0.5, n_samples)

        # Flow metrics
        flow_packets_per_sec = packet_rate / (flow_duration + 1)
        avg_inter_arrival_time = 1000.0 / (packet_rate + 1)

        data = pd.DataFrame({
            'packet_rate': packet_rate,
            'byte_rate': byte_rate,
            'packet_size_mean': packet_size_mean,
            'packet_size_std': packet_size_std,
            'flow_duration': flow_duration,
            'protocol_type': protocol_type,
            'src_ip_entropy': src_ip_entropy,
            'dst_port_entropy': dst_port_entropy,
            'syn_flag_count': syn_flag_count,
            'ack_flag_count': ack_flag_count,
            'fin_flag_count': fin_flag_count,
            'rst_flag_count': rst_flag_count,
            'flow_packets_per_sec': flow_packets_per_sec,
            'avg_inter_arrival_time': avg_inter_arrival_time,
        })

        return data

    def _generate_attack_traffic(self, n_samples: int) -> pd.DataFrame:
        """Generate attack network traffic with realistic DDoS patterns."""
        attack_type = np.random.choice(
            ['syn_flood', 'udp_flood', 'icmp_flood', 'dns_flood'], size=n_samples
        )

        data_list = []

        for attack in np.unique(attack_type):
            mask = attack_type == attack
            n = mask.sum()

            if attack == 'syn_flood':
                packet_rate = np.random.uniform(500, 5000, n)
                byte_rate = packet_rate * np.random.uniform(40, 100, n)
                syn_flag_count = np.random.poisson(100, n)
                ack_flag_count = np.random.poisson(5, n)
                protocol = np.full(n, 0)  # TCP
                dst_port_entropy = np.random.uniform(0, 4, n)

            elif attack == 'udp_flood':
                packet_rate = np.random.uniform(1000, 10000, n)
                byte_rate = packet_rate * np.random.uniform(100, 500, n)
                syn_flag_count = np.random.poisson(0, n)
                ack_flag_count = np.random.poisson(0, n)
                protocol = np.full(n, 1)  # UDP
                dst_port_entropy = np.random.uniform(0, 8, n)

            elif attack == 'icmp_flood':
                packet_rate = np.random.uniform(2000, 8000, n)
                byte_rate = packet_rate * np.random.uniform(50, 200, n)
                syn_flag_count = np.random.poisson(0, n)
                ack_flag_count = np.random.poisson(0, n)
                protocol = np.full(n, 2)  # ICMP
                dst_port_entropy = np.random.uniform(1, 3, n)

            else:  # dns_flood
                packet_rate = np.random.uniform(500, 3000, n)
                byte_rate = packet_rate * np.random.uniform(50, 150, n)
                syn_flag_count = np.random.poisson(2, n)
                ack_flag_count = np.random.poisson(2, n)
                protocol = np.full(n, 1)  # UDP (DNS uses UDP)
                dst_port_entropy = np.random.uniform(0, 2, n)

            # Common attack characteristics
            packet_size_mean = np.random.normal(300, 100, n)
            packet_size_mean = np.clip(packet_size_mean, 20, 1000)
            packet_size_std = np.random.gamma(1, 50, n)
            flow_duration = np.random.exponential(5, n)
            flow_duration = np.clip(flow_duration, 0.1, 60)

            src_ip_entropy = np.random.uniform(0, 2, n)  # Low entropy = attack
            fin_flag_count = np.random.poisson(0.1, n)
            rst_flag_count = np.random.poisson(0.2, n)
            flow_packets_per_sec = packet_rate / (flow_duration + 1)
            avg_inter_arrival_time = 1000.0 / (packet_rate + 1)

            attack_data = pd.DataFrame({
                'packet_rate': packet_rate,
                'byte_rate': byte_rate,
                'packet_size_mean': packet_size_mean,
                'packet_size_std': packet_size_std,
                'flow_duration': flow_duration,
                'protocol_type': protocol,
                'src_ip_entropy': src_ip_entropy,
                'dst_port_entropy': dst_port_entropy,
                'syn_flag_count': syn_flag_count,
                'ack_flag_count': ack_flag_count,
                'fin_flag_count': fin_flag_count,
                'rst_flag_count': rst_flag_count,
                'flow_packets_per_sec': flow_packets_per_sec,
                'avg_inter_arrival_time': avg_inter_arrival_time,
            })

            data_list.append(attack_data)

        data = pd.concat(data_list, ignore_index=True)
        return data

    def generate_realtime_stream(
        self, data_type: str, n_points: int = 100
    ) -> List[Dict]:
        """
        Generate streaming data points for real-time dashboard simulation.

        Args:
            data_type (str): Type of stream - 'credit' or 'network'
            n_points (int): Number of data points to generate (default: 100)

        Returns:
            List[Dict]: List of data point dictionaries with timestamp
        """
        stream_data = []
        base_time = datetime.now()

        if data_type == 'credit':
            for i in range(n_points):
                timestamp = base_time + timedelta(seconds=i * 60)
                stream_data.append({
                    'timestamp': timestamp.isoformat(),
                    'risk_score': np.random.uniform(0, 1),
                    'income': np.random.uniform(20000, 200000),
                    'credit_score': np.random.normal(680, 120),
                    'debt_to_income': np.random.uniform(0, 2),
                    'num_late_payments': np.random.randint(0, 20),
                    'savings_balance': np.random.exponential(10000),
                })

        elif data_type == 'network':
            for i in range(n_points):
                timestamp = base_time + timedelta(seconds=i * 5)
                stream_data.append({
                    'timestamp': timestamp.isoformat(),
                    'packet_rate': np.random.gamma(2, 50),
                    'byte_rate': np.random.gamma(3, 200),
                    'src_ip_entropy': np.random.uniform(0, 8),
                    'dst_port_entropy': np.random.uniform(0, 16),
                    'flow_packets_per_sec': np.random.gamma(2, 5),
                    'syn_flag_count': np.random.poisson(5),
                })

        return stream_data


# Convenience functions for direct usage
def generate_credit_data(n_samples: int = 5000) -> pd.DataFrame:
    """
    Convenience function to generate credit risk data.

    Args:
        n_samples (int): Number of samples to generate

    Returns:
        pd.DataFrame: Credit risk dataset
    """
    generator = CreditDataGenerator()
    return generator.generate_credit_data(n_samples)


def generate_network_data(
    n_samples: int = 10000, attack_ratio: float = 0.3
) -> pd.DataFrame:
    """
    Convenience function to generate network traffic data.

    Args:
        n_samples (int): Number of samples to generate
        attack_ratio (float): Proportion of attack samples

    Returns:
        pd.DataFrame: Network traffic dataset
    """
    generator = NetworkDataGenerator()
    return generator.generate_network_data(n_samples, attack_ratio)


def generate_realtime_stream(data_type: str, n_points: int = 100) -> List[Dict]:
    """
    Convenience function to generate streaming data.

    Args:
        data_type (str): Type of stream - 'credit' or 'network'
        n_points (int): Number of data points to generate

    Returns:
        List[Dict]: List of streaming data points
    """
    generator = NetworkDataGenerator()
    return generator.generate_realtime_stream(data_type, n_points)


if __name__ == '__main__':
    # Example usage
    print("Generating credit risk data...")
    credit_df = generate_credit_data(100)
    print(credit_df.head())
    print(f"\nDelinquency rate: {credit_df['is_delinquent'].mean():.2%}")

    print("\n" + "="*80)
    print("Generating network traffic data...")
    network_df = generate_network_data(500, attack_ratio=0.3)
    print(network_df.head())
    print(f"\nAttack rate: {network_df['is_attack'].mean():.2%}")

    print("\n" + "="*80)
    print("Generating real-time credit stream...")
    credit_stream = generate_realtime_stream('credit', n_points=5)
    for point in credit_stream:
        print(point)
