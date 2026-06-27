"""
Indian Credit Risk Dataset Generator for LedgerShield_AI

This module generates realistic Indian customer profiles with credit-related features
tailored to the Indian financial system (CIBIL scores, Indian cities, Indian occupations).

Author: LedgerShield_AI
Date: 2026
"""

import numpy as np
import pandas as pd
from typing import Dict, List
from datetime import datetime


class IndianCreditDataGenerator:
    """Generate realistic synthetic Indian credit risk data for delinquency detection."""

    # Indian male and female names
    MALE_NAMES = [
        "Rajesh", "Kumar", "Amit", "Arjun", "Vikram", "Anil", "Suresh", "Harsha",
        "Deepak", "Sanjay", "Pradeep", "Anand", "Naveen", "Rohan", "Ashok", "Manish",
        "Karan", "Nitin", "Rahul", "Akshay", "Sameer", "Varun", "Jitendar", "Mahesh",
        "Prakash", "Siddharth", "Vaibhav", "Arun", "Sharad", "Girish", "Hemant",
        "Rajeev", "Sandeep", "Bhavesh", "Gaurav", "Devendra", "Kamal", "Mohan", "Sharma",
        "Iyengar", "Gupta", "Patel", "Singh", "Kumar", "Verma", "Yadav", "Khanna",
        "Jain", "Mittal", "Bansal", "Malhotra"
    ]

    FEMALE_NAMES = [
        "Priya", "Ananya", "Neha", "Isha", "Divya", "Megha", "Pooja", "Sneha",
        "Riya", "Kavya", "Anjali", "Swati", "Shruthi", "Nisha", "Aditi", "Shreya",
        "Aisha", "Sakshi", "Aadhya", "Niti", "Meera", "Savitri", "Jaya", "Lakshmi",
        "Rani", "Deepa", "Leela", "Sunita", "Vidya", "Chithra", "Shalini", "Varsha",
        "Pooja", "Amrita", "Asha", "Bhavna", "Chitra", "Daksha", "Esha", "Fatima",
        "Gita", "Harini", "Indira", "Jasmeet", "Kamini", "Lata", "Malini", "Nikita"
    ]

    # Indian cities with states
    CITIES_STATES = {
        "Mumbai": "Maharashtra",
        "Delhi": "Delhi",
        "Bangalore": "Karnataka",
        "Chennai": "Tamil Nadu",
        "Hyderabad": "Telangana",
        "Pune": "Maharashtra",
        "Kolkata": "West Bengal",
        "Ahmedabad": "Gujarat",
        "Jaipur": "Rajasthan",
        "Lucknow": "Uttar Pradesh",
        "Chandigarh": "Chandigarh",
        "Indore": "Madhya Pradesh",
        "Surat": "Gujarat",
        "Bhopal": "Madhya Pradesh",
        "Vadodara": "Gujarat",
        "Kochi": "Kerala",
        "Visakhapatnam": "Andhra Pradesh",
        "Nagpur": "Maharashtra",
        "Thane": "Maharashtra",
        "Gurgaon": "Haryana",
    }

    OCCUPATIONS = [
        "Salaried-IT",
        "Salaried-NonIT",
        "Self-Employed",
        "Business-Owner",
        "Government-Employee",
        "Farmer",
        "Student",
        "Retired",
    ]

    def __init__(self, random_state: int = 42):
        """
        Initialize the Indian credit data generator.

        Args:
            random_state (int): Seed for reproducibility
        """
        self.random_state = random_state
        np.random.seed(random_state)

    def generate_customers(self, n: int = 500) -> pd.DataFrame:
        """
        Generate realistic Indian customer profiles.

        Args:
            n (int): Number of customers to generate

        Returns:
            pd.DataFrame: DataFrame with Indian customer profiles and credit features
        """
        np.random.seed(self.random_state)

        # Initialize arrays
        customer_ids = [f"CUST_{i:05d}" for i in range(1, n + 1)]
        names = []
        ages = np.random.uniform(22, 65, n).astype(int)
        cities = np.random.choice(list(self.CITIES_STATES.keys()), n)
        states = [self.CITIES_STATES[city] for city in cities]
        occupations = np.random.choice(self.OCCUPATIONS, n)

        # Generate names (50% male, 50% female)
        for i in range(n):
            if np.random.random() < 0.5:
                names.append(np.random.choice(self.MALE_NAMES))
            else:
                names.append(np.random.choice(self.FEMALE_NAMES))

        # Generate monthly income based on occupation
        monthly_income = []
        for occ in occupations:
            if occ == "Salaried-IT":
                income = np.random.uniform(40000, 300000)
            elif occ == "Salaried-NonIT":
                income = np.random.uniform(20000, 100000)
            elif occ == "Self-Employed":
                income = np.random.uniform(30000, 200000)
            elif occ == "Business-Owner":
                income = np.random.uniform(50000, 500000)
            elif occ == "Government-Employee":
                income = np.random.uniform(25000, 80000)
            elif occ == "Farmer":
                income = np.random.uniform(8000, 25000)
            elif occ == "Student":
                income = np.random.uniform(0, 15000)
            else:  # Retired
                income = np.random.uniform(15000, 60000)
            monthly_income.append(income)

        monthly_income = np.array(monthly_income)

        # CIBIL score (Indian credit score range: 300-900)
        cibil_score = np.random.normal(680, 100, n)
        cibil_score = np.clip(cibil_score, 300, 900).astype(int)

        # Loan features
        loan_amount = np.random.uniform(50000, 5000000, n)
        loan_tenure_months = np.random.randint(12, 361, n)
        existing_emis = np.random.randint(0, 6, n)

        # EMI amount (proportional to loan amount and tenure)
        emi_amount = (loan_amount / loan_tenure_months) * 1.05
        emi_amount = emi_amount * (1 + existing_emis * 0.2)  # Scale by number of EMIs

        # Credit features
        credit_utilization = np.random.beta(2, 2, n)
        num_late_payments = np.random.negative_binomial(5, 0.7, n)
        num_late_payments = np.clip(num_late_payments, 0, 15).astype(int)
        payment_history_months = np.random.randint(6, 241, n)
        num_credit_cards = np.random.randint(0, 6, n)

        # Savings balance
        savings_balance = np.random.exponential(200000, n)
        savings_balance = np.clip(savings_balance, 0, 2000000)

        # Spending categories (in Rs)
        spend_food = np.random.uniform(2000, 15000, n)
        spend_shopping = np.random.uniform(1000, 30000, n)
        spend_travel = np.random.uniform(500, 20000, n)
        spend_entertainment = np.random.uniform(500, 10000, n)
        spend_utilities = np.random.uniform(1000, 8000, n)

        # EMI spending (proportional to actual EMI amount)
        spend_emi_payments = np.clip(emi_amount, 0, 80000)

        # Derived features
        debt_to_income = (emi_amount * 12) / (monthly_income * 12)
        total_monthly_spend = (
            spend_food + spend_shopping + spend_travel +
            spend_entertainment + spend_utilities + spend_emi_payments
        )
        savings_rate = savings_balance / (monthly_income * 12 + 1e-6)

        # Risk score for delinquency target
        risk_score = (
            (1 - cibil_score / 900) * 0.25
            + np.clip(debt_to_income / 2, 0, 1) * 0.25
            + (num_late_payments / 15) * 0.25
            + (1 - np.clip(savings_rate, 0, 1)) * 0.15
            + (total_monthly_spend / monthly_income) * 0.10
        )

        # Add noise
        noise = np.random.normal(0, 0.05, n)
        risk_score = np.clip(risk_score + noise, 0, 1)

        # Delinquency target (~18% positive class)
        threshold = np.percentile(risk_score, 82)
        is_delinquent = (risk_score > threshold).astype(int)

        # Credit score band
        credit_score_band = []
        for score in cibil_score:
            if score >= 750:
                band = "Excellent"
            elif score >= 700:
                band = "Good"
            elif score >= 650:
                band = "Fair"
            elif score >= 600:
                band = "Poor"
            else:
                band = "Bad"
            credit_score_band.append(band)

        # Create DataFrame
        df = pd.DataFrame({
            "customer_id": customer_ids,
            "name": names,
            "age": ages,
            "city": cities,
            "state": states,
            "occupation": occupations,
            "monthly_income": monthly_income,
            "cibil_score": cibil_score,
            "loan_amount": loan_amount,
            "loan_tenure_months": loan_tenure_months,
            "existing_emis": existing_emis,
            "emi_amount": emi_amount,
            "credit_utilization": credit_utilization,
            "num_late_payments": num_late_payments,
            "payment_history_months": payment_history_months,
            "num_credit_cards": num_credit_cards,
            "savings_balance": savings_balance,
            "spend_food": spend_food,
            "spend_shopping": spend_shopping,
            "spend_travel": spend_travel,
            "spend_entertainment": spend_entertainment,
            "spend_utilities": spend_utilities,
            "spend_emi_payments": spend_emi_payments,
            "debt_to_income": debt_to_income,
            "total_monthly_spend": total_monthly_spend,
            "savings_rate": savings_rate,
            "credit_score_band": credit_score_band,
            "is_delinquent": is_delinquent,
        })

        return df

    def generate_risk_profile(self, customer_row: pd.Series) -> Dict:
        """
        Generate a risk profile for a customer with factors and recommendations.

        Args:
            customer_row (pd.Series): A row from the customer DataFrame

        Returns:
            Dict: Risk profile with factors, recommendations, and spending insights
        """
        risk_factors = []
        recommendations = []

        # Analyze CIBIL score
        cibil = customer_row.get("cibil_score", 0)
        if cibil < 600:
            risk_factors.append(f"CIBIL score in Bad range ({cibil})")
            recommendations.append("Improve credit score by making timely payments")
        elif cibil < 650:
            risk_factors.append(f"CIBIL score in Poor range ({cibil})")
            recommendations.append("Focus on consistent payment history")
        elif cibil < 700:
            risk_factors.append(f"CIBIL score in Fair range ({cibil})")
            recommendations.append("Gradually build credit score")

        # Analyze debt-to-income ratio
        dti = customer_row.get("debt_to_income", 0)
        if dti > 0.6:
            risk_factors.append(f"High debt-to-income ratio ({dti:.1%})")
            recommendations.append("Reduce EMI burden or increase income")
        elif dti > 0.4:
            risk_factors.append(f"Moderate debt-to-income ratio ({dti:.1%})")
            recommendations.append("Monitor debt levels carefully")

        # Analyze late payments
        late_payments = customer_row.get("num_late_payments", 0)
        if late_payments > 5:
            risk_factors.append(f"High late payment history ({late_payments} instances)")
            recommendations.append("Set up automatic payment reminders")
        elif late_payments > 0:
            risk_factors.append(f"Some late payment history ({late_payments} instances)")
            recommendations.append("Ensure timely bill payments")

        # Analyze savings
        savings_rate = customer_row.get("savings_rate", 0)
        if savings_rate < 0.1:
            risk_factors.append(f"Low savings rate ({savings_rate:.1%})")
            recommendations.append("Build emergency fund with at least 3-6 months expenses")
        elif savings_rate < 0.3:
            risk_factors.append(f"Moderate savings rate ({savings_rate:.1%})")
            recommendations.append("Increase savings for better financial stability")

        # Analyze occupation
        occupation = customer_row.get("occupation", "")
        if occupation in ["Farmer", "Student", "Self-Employed"]:
            risk_factors.append(f"Variable income from {occupation} occupation")
            recommendations.append("Maintain higher savings buffer due to income variability")

        # Spending insights
        spending_categories = {
            "Food": customer_row.get("spend_food", 0),
            "Shopping": customer_row.get("spend_shopping", 0),
            "Travel": customer_row.get("spend_travel", 0),
            "Entertainment": customer_row.get("spend_entertainment", 0),
            "Utilities": customer_row.get("spend_utilities", 0),
            "EMI Payments": customer_row.get("spend_emi_payments", 0),
        }

        highest_category = max(spending_categories, key=spending_categories.get)
        highest_amount = spending_categories[highest_category]
        monthly_income = customer_row.get("monthly_income", 1)
        highest_pct = (highest_amount / monthly_income) * 100

        spending_insights = (
            f"{highest_category} is highest expense (Rs {highest_amount:,.0f}, "
            f"{highest_pct:.1f}% of income)"
        )

        return {
            "risk_factors": risk_factors if risk_factors else ["No significant risk factors"],
            "recommendations": recommendations if recommendations else ["Maintain current financial discipline"],
            "spending_insights": spending_insights,
        }


# Convenience function
def generate_indian_customers(n: int = 500) -> pd.DataFrame:
    """
    Convenience function to generate Indian customer data.

    Args:
        n (int): Number of customers to generate

    Returns:
        pd.DataFrame: Indian customer dataset
    """
    generator = IndianCreditDataGenerator()
    return generator.generate_customers(n)


if __name__ == "__main__":
    print("Generating Indian customer data...")
    gen = IndianCreditDataGenerator()
    df = gen.generate_customers(10)
    print(df.head())
    print(f"\nDelinquency rate: {df['is_delinquent'].mean():.2%}")

    print("\n" + "=" * 80)
    print("Sample Risk Profile:")
    risk_profile = gen.generate_risk_profile(df.iloc[0])
    print(f"Customer: {df.iloc[0]['name']}")
    print(f"Risk Factors: {risk_profile['risk_factors']}")
    print(f"Recommendations: {risk_profile['recommendations']}")
    print(f"Spending Insights: {risk_profile['spending_insights']}")
