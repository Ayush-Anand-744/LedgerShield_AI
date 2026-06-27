"""
Cross-Domain Correlation Engine for LedgerShield_AI banking security system

This module implements a novel correlation engine that detects and analyzes
relationships between financial risk events and cybersecurity incidents in
a banking environment. By synthesizing data from both domains, the engine
identifies coordinated attacks, temporal anomalies, and emerging systemic risks
that might be missed by single-domain analysis.

Key Innovation: Rather than treating financial and cybersecurity events in
isolation, this engine recognizes that sophisticated attacks often involve
coordination between financial fraud and network-level disruptions. This
correlation analysis enables faster response to complex, multi-vector threats.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Tuple, Optional
import statistics


class AlertSeverity(Enum):
    """Alert severity levels for unified risk assessment."""
    INFO = 0
    WARNING = 1
    HIGH = 2
    CRITICAL = 3


class CorrelationType(Enum):
    """Types of correlations detected between domains."""
    TEMPORAL = "temporal"           # Events within same time window
    VOLUMETRIC = "volumetric"       # Simultaneous spike in both domains
    BEHAVIORAL = "behavioral"       # Unusual patterns in both domains
    NONE = "none"                   # No correlation detected


@dataclass
class CorrelationEvent:
    """
    Represents a single event (financial or cybersecurity) for correlation analysis.

    Attributes:
        timestamp: When the event occurred
        event_type: Description of what happened (e.g., "high_risk_application", "ddos_spike")
        source_domain: Either "financial" or "cyber"
        severity: Severity level from the originating domain
        description: Human-readable event description
        correlation_id: Unique identifier for this event
        metadata: Domain-specific additional information
    """
    timestamp: datetime
    event_type: str
    source_domain: str  # "financial" or "cyber"
    severity: AlertSeverity
    description: str
    correlation_id: str
    metadata: Dict = field(default_factory=dict)

    def __hash__(self):
        """Make events hashable for set operations."""
        return hash(self.correlation_id)

    def __eq__(self, other):
        """Compare events by ID."""
        if not isinstance(other, CorrelationEvent):
            return False
        return self.correlation_id == other.correlation_id


@dataclass
class UnifiedAlert:
    """
    Represents an alert synthesized from cross-domain analysis.

    Attributes:
        alert_id: Unique identifier for this alert
        severity: Unified severity level
        unified_risk_score: Combined 0-1 risk score
        correlation_type: Type of correlation detected
        financial_context: Description of financial domain findings
        cyber_context: Description of cybersecurity domain findings
        recommendation: Suggested action
        affected_events: Correlation events that triggered this alert
        timestamp: When the alert was generated
    """
    alert_id: str
    severity: AlertSeverity
    unified_risk_score: float
    correlation_type: CorrelationType
    financial_context: str
    cyber_context: str
    recommendation: str
    affected_events: List[CorrelationEvent]
    timestamp: datetime


class CrossDomainCorrelationEngine:
    """
    Analyzes correlations between financial risk events and cybersecurity incidents.

    This engine identifies patterns that suggest coordinated or related threats
    across both domains. For example, a DDoS attack might be a distraction for
    concurrent fraudulent transaction attempts, or unusual credit applications
    might correlate with network reconnaissance activity.

    Configuration Parameters:
        temporal_threshold_minutes: Time window for temporal correlation
        volumetric_spike_percentile: Detection threshold for traffic/application spikes
        behavioral_std_devs: Standard deviations above mean to flag behavioral anomalies
        credit_risk_weight: Weight of credit risk in unified score (default 0.4)
        ddos_weight: Weight of DDoS threat in unified score (default 0.35)
        correlation_bonus: Additional weight for detected correlations (default 0.25)
    """

    def __init__(
        self,
        temporal_threshold_minutes: int = 30,
        volumetric_spike_percentile: float = 75.0,
        behavioral_std_devs: float = 2.0,
        credit_risk_weight: float = 0.4,
        ddos_weight: float = 0.35,
        correlation_bonus: float = 0.25,
    ):
        """
        Initialize the correlation engine with configurable thresholds.

        Args:
            temporal_threshold_minutes: Events within this window are temporally correlated
            volumetric_spike_percentile: Percentile threshold for spike detection
            behavioral_std_devs: Standard deviations for anomaly detection
            credit_risk_weight: Weight for credit risk in unified scoring
            ddos_weight: Weight for DDoS threat in unified scoring
            correlation_bonus: Additional weight applied when correlation exists
        """
        self.temporal_threshold = timedelta(minutes=temporal_threshold_minutes)
        self.volumetric_spike_percentile = volumetric_spike_percentile
        self.behavioral_std_devs = behavioral_std_devs

        # Unified scoring weights (should sum to ~1.0 without bonus)
        self.credit_risk_weight = credit_risk_weight
        self.ddos_weight = ddos_weight
        self.correlation_bonus = correlation_bonus

        # Historical data for baseline calculations
        self._financial_event_history: List[CorrelationEvent] = []
        self._cyber_event_history: List[CorrelationEvent] = []
        self._correlation_stats: Dict[str, int] = {
            "temporal_correlations": 0,
            "volumetric_correlations": 0,
            "behavioral_correlations": 0,
            "total_alerts_generated": 0,
        }
        self._alert_counter = 0

    def analyze_correlation(
        self,
        credit_alerts: List[CorrelationEvent],
        ddos_alerts: List[CorrelationEvent],
        time_window_minutes: Optional[int] = None,
    ) -> List[Tuple[CorrelationEvent, CorrelationEvent, CorrelationType]]:
        """
        Find temporal correlations between credit/financial alerts and DDoS/network alerts.

        Temporal correlation occurs when events from different domains happen within
        the same time window, suggesting they might be related parts of a coordinated
        attack or systemic event.

        Args:
            credit_alerts: List of financial risk events
            ddos_alerts: List of cybersecurity/network events
            time_window_minutes: Override default temporal window (uses init value if None)

        Returns:
            List of tuples: (credit_event, cyber_event, correlation_type)
            representing identified correlations
        """
        time_window = timedelta(minutes=time_window_minutes or self.temporal_threshold.total_seconds() / 60)
        correlations = []

        for credit_event in credit_alerts:
            for cyber_event in ddos_alerts:
                # Check temporal proximity
                time_diff = abs((credit_event.timestamp - cyber_event.timestamp).total_seconds() / 60)

                if time_diff <= time_window.total_seconds() / 60:
                    # Temporal correlation found
                    correlations.append((credit_event, cyber_event, CorrelationType.TEMPORAL))
                    self._correlation_stats["temporal_correlations"] += 1

        # Update historical data
        self._financial_event_history.extend(credit_alerts)
        self._cyber_event_history.extend(ddos_alerts)

        return correlations

    def calculate_unified_risk_score(
        self,
        credit_risk_score: float,
        ddos_threat_level: float,
        correlation_factor: float,
    ) -> float:
        """
        Combine financial and cybersecurity risk scores into a unified 0-1 risk metric.

        The unified score uses a weighted formula that considers both individual domain
        risks and the interaction between them. Correlated events receive a bonus
        reflecting the increased systemic risk of coordinated threats.

        Formula:
            base_score = (credit_risk_score * w_credit) + (ddos_threat_level * w_ddos)
            unified_score = base_score * (1 + correlation_factor * correlation_bonus)

        where correlation_factor ∈ [0, 1] indicates strength of correlation.

        Args:
            credit_risk_score: Financial risk score [0, 1]
            ddos_threat_level: Network threat level [0, 1]
            correlation_factor: Strength of detected correlation [0, 1]

        Returns:
            Unified risk score [0, 1]
        """
        # Ensure inputs are valid
        credit_risk_score = max(0.0, min(1.0, credit_risk_score))
        ddos_threat_level = max(0.0, min(1.0, ddos_threat_level))
        correlation_factor = max(0.0, min(1.0, correlation_factor))

        # Calculate base risk from both domains
        base_score = (
            credit_risk_score * self.credit_risk_weight +
            ddos_threat_level * self.ddos_weight
        )

        # Apply correlation amplification: correlated events are more dangerous
        # because they suggest coordinated/sophisticated threats
        amplification = 1.0 + (correlation_factor * self.correlation_bonus)
        unified_score = base_score * amplification

        # Normalize to [0, 1] range
        return min(1.0, unified_score)

    def detect_coordinated_attack(
        self,
        credit_events: List[CorrelationEvent],
        network_events: List[CorrelationEvent],
    ) -> Tuple[bool, float, str]:
        """
        Detect if financial and network events indicate a coordinated attack.

        A coordinated attack has these hallmarks:
        1. Network disruption (DDoS/reconnaissance) providing cover
        2. Simultaneous fraudulent financial activity (applications, transactions)
        3. Targeting common infrastructure/customer base
        4. Temporal synchronization of activities

        Sophisticated attackers combine network-level attacks with financial fraud
        to maximize impact while overwhelming defenses. This method identifies such
        multi-vector attacks.

        Args:
            credit_events: List of financial anomalies/fraud indicators
            network_events: List of network/DDoS incidents

        Returns:
            Tuple of (is_coordinated: bool, confidence: float, reasoning: str)
        """
        if not credit_events or not network_events:
            return False, 0.0, "Insufficient events in one or both domains"

        # Metric 1: Temporal clustering
        temporal_overlaps = len(self.analyze_correlation(credit_events, network_events))
        overlap_ratio = temporal_overlaps / max(len(credit_events), len(network_events))

        # Metric 2: Severity alignment
        # Coordinated attacks show high severity in BOTH domains simultaneously
        high_severity_credit = sum(
            1 for e in credit_events
            if e.severity in [AlertSeverity.HIGH, AlertSeverity.CRITICAL]
        )
        high_severity_network = sum(
            1 for e in network_events
            if e.severity in [AlertSeverity.HIGH, AlertSeverity.CRITICAL]
        )

        severity_alignment = min(
            high_severity_credit / len(credit_events) if credit_events else 0,
            high_severity_network / len(network_events) if network_events else 0
        )

        # Metric 3: Event volume surge
        # Both domains show abnormal volume increases
        avg_credit_severity = (
            sum(e.severity.value for e in credit_events) / len(credit_events)
        )
        avg_network_severity = (
            sum(e.severity.value for e in network_events) / len(network_events)
        )
        volume_correlation = min(avg_credit_severity, avg_network_severity) / 3.0

        # Compute coordinated attack confidence
        # Weighted combination of evidence factors
        confidence = (
            0.4 * overlap_ratio +
            0.4 * severity_alignment +
            0.2 * volume_correlation
        )

        # Threshold for declaring coordinated attack
        is_coordinated = confidence > 0.5 and temporal_overlaps > 0

        # Generate detailed reasoning
        reasoning_parts = []
        if temporal_overlaps > 0:
            reasoning_parts.append(f"{temporal_overlaps} temporal overlaps detected")
        if severity_alignment > 0.6:
            reasoning_parts.append("High severity events synchronized across domains")
        if volume_correlation > 0.5:
            reasoning_parts.append("Abnormal volume increase in both domains")

        reasoning = "; ".join(reasoning_parts) or "No coordinated attack indicators"

        return is_coordinated, confidence, reasoning

    def generate_alerts(
        self,
        unified_score: float,
        credit_data: Dict,
        network_data: Dict,
    ) -> List[UnifiedAlert]:
        """
        Generate prioritized alerts based on unified cross-domain analysis.

        This method synthesizes information from both financial and cybersecurity
        domains into actionable alerts for security teams. The alert includes
        context from both domains, unified risk assessment, and recommendations.

        Args:
            unified_score: Combined risk score [0, 1] from calculate_unified_risk_score()
            credit_data: Dict with keys:
                - 'events': List[CorrelationEvent]
                - 'high_risk_apps': int (number of high-risk applications)
                - 'unusual_transactions': int (count)
                - 'details': str (description)
            network_data: Dict with keys:
                - 'events': List[CorrelationEvent]
                - 'ddos_intensity': float [0, 1]
                - 'affected_services': List[str]
                - 'details': str (description)

        Returns:
            List of UnifiedAlert objects sorted by severity
        """
        alerts = []

        # Determine severity level based on unified score
        if unified_score >= 0.8:
            severity = AlertSeverity.CRITICAL
        elif unified_score >= 0.6:
            severity = AlertSeverity.HIGH
        elif unified_score >= 0.4:
            severity = AlertSeverity.WARNING
        else:
            severity = AlertSeverity.INFO

        # Detect correlation type if score indicates it
        correlation_type = CorrelationType.NONE
        if unified_score > 0.5:
            # Analyze what kind of correlation led to high score
            credit_events = credit_data.get('events', [])
            network_events = network_data.get('events', [])

            # Check for volumetric correlation
            if (credit_data.get('high_risk_apps', 0) > 5 and
                network_data.get('ddos_intensity', 0) > 0.6):
                correlation_type = CorrelationType.VOLUMETRIC
                self._correlation_stats["volumetric_correlations"] += 1
            # Check for behavioral correlation
            elif credit_data.get('unusual_transactions', 0) > 3:
                correlation_type = CorrelationType.BEHAVIORAL
                self._correlation_stats["behavioral_correlations"] += 1
            # Check for temporal correlation
            elif credit_events and network_events:
                temporal_correlations = self.analyze_correlation(
                    credit_events, network_events
                )
                if temporal_correlations:
                    correlation_type = CorrelationType.TEMPORAL

        # Collect all affected events
        affected_events = (
            credit_data.get('events', []) +
            network_data.get('events', [])
        )

        # Generate recommendation based on findings
        recommendation = self._generate_recommendation(
            severity, correlation_type, credit_data, network_data
        )

        # Create alert
        self._alert_counter += 1
        alert = UnifiedAlert(
            alert_id=f"ALERT_{self._alert_counter:06d}",
            severity=severity,
            unified_risk_score=unified_score,
            correlation_type=correlation_type,
            financial_context=credit_data.get('details', 'No financial alerts'),
            cyber_context=network_data.get('details', 'No cyber alerts'),
            recommendation=recommendation,
            affected_events=affected_events,
            timestamp=datetime.now(),
        )

        alerts.append(alert)
        self._correlation_stats["total_alerts_generated"] += 1

        return alerts

    def get_risk_timeline(
        self,
        events: List[CorrelationEvent],
        window_hours: int = 24,
    ) -> Dict[str, float]:
        """
        Generate time-bucketed risk levels for visualization and trend analysis.

        This produces a timeline of risk scores at regular intervals, useful for
        dashboards, trend analysis, and understanding how risk evolved over time.
        The risk in each bucket is determined by the maximum severity of events
        occurring in that time window.

        Args:
            events: List of correlation events to analyze
            window_hours: Total time period to analyze (default 24 hours)

        Returns:
            Dict mapping timestamp (ISO format) -> risk_score [0, 1]
            with one entry per hour (or suitable granularity based on window)
        """
        if not events:
            return {}

        # Determine granularity based on window size
        if window_hours <= 6:
            bucket_size = timedelta(minutes=10)
        elif window_hours <= 48:
            bucket_size = timedelta(minutes=30)
        else:
            bucket_size = timedelta(hours=1)

        # Find earliest and latest events
        earliest = min(e.timestamp for e in events)
        latest = max(e.timestamp for e in events)

        # Initialize timeline buckets
        timeline = {}
        current = earliest.replace(minute=0, second=0, microsecond=0)
        end = latest + bucket_size

        while current <= end:
            timeline[current.isoformat()] = 0.0
            current += bucket_size

        # Populate risk scores based on events in each bucket
        for event in events:
            # Find the appropriate bucket for this event
            bucket = event.timestamp.replace(minute=0, second=0, microsecond=0)
            if bucket.isoformat() not in timeline:
                timeline[bucket.isoformat()] = 0.0

            # Update bucket with this event's severity normalized to [0, 1]
            event_risk = event.severity.value / 3.0
            timeline[bucket.isoformat()] = max(
                timeline[bucket.isoformat()],
                event_risk
            )

        return dict(sorted(timeline.items()))

    def get_summary_stats(self) -> Dict:
        """
        Return summary statistics of correlations found by the engine.

        Provides metrics on engine activity, detection performance, and
        correlation distribution for monitoring and debugging.

        Returns:
            Dict with keys:
                - 'temporal_correlations': Count of temporal correlations
                - 'volumetric_correlations': Count of volumetric correlations
                - 'behavioral_correlations': Count of behavioral correlations
                - 'total_alerts_generated': Count of alerts produced
                - 'financial_events_processed': Total financial events seen
                - 'cyber_events_processed': Total cyber events seen
                - 'correlation_rate': Percentage of events with correlations
                - 'avg_events_per_alert': Average events per alert
        """
        total_events = (
            len(self._financial_event_history) +
            len(self._cyber_event_history)
        )

        total_correlations = (
            self._correlation_stats["temporal_correlations"] +
            self._correlation_stats["volumetric_correlations"] +
            self._correlation_stats["behavioral_correlations"]
        )

        correlation_rate = (
            (total_correlations / total_events * 100)
            if total_events > 0 else 0.0
        )

        avg_events_per_alert = (
            (total_events / self._correlation_stats["total_alerts_generated"])
            if self._correlation_stats["total_alerts_generated"] > 0 else 0.0
        )

        return {
            "temporal_correlations": self._correlation_stats["temporal_correlations"],
            "volumetric_correlations": self._correlation_stats["volumetric_correlations"],
            "behavioral_correlations": self._correlation_stats["behavioral_correlations"],
            "total_alerts_generated": self._correlation_stats["total_alerts_generated"],
            "financial_events_processed": len(self._financial_event_history),
            "cyber_events_processed": len(self._cyber_event_history),
            "correlation_rate": f"{correlation_rate:.2f}%",
            "avg_events_per_alert": f"{avg_events_per_alert:.2f}",
        }

    def _generate_recommendation(
        self,
        severity: AlertSeverity,
        correlation_type: CorrelationType,
        credit_data: Dict,
        network_data: Dict,
    ) -> str:
        """
        Generate actionable recommendations based on alert characteristics.

        Args:
            severity: Alert severity level
            correlation_type: Type of correlation detected
            credit_data: Financial domain data
            network_data: Network domain data

        Returns:
            Recommendation string
        """
        recommendations = []

        # Severity-based recommendations
        if severity == AlertSeverity.CRITICAL:
            recommendations.append("ESCALATE to security leadership immediately")
        elif severity == AlertSeverity.HIGH:
            recommendations.append("Initiate incident response protocol")

        # Correlation-type-specific recommendations
        if correlation_type == CorrelationType.TEMPORAL:
            recommendations.append(
                "Investigate temporal relationship between events; "
                "may indicate coordinated attack"
            )
        elif correlation_type == CorrelationType.VOLUMETRIC:
            recommendations.append(
                "Scale DDoS mitigation and increase fraud detection sensitivity"
            )
        elif correlation_type == CorrelationType.BEHAVIORAL:
            recommendations.append(
                "Review customer behavior patterns; may indicate account takeover campaign"
            )

        # Domain-specific recommendations
        if credit_data.get('high_risk_apps', 0) > 5:
            recommendations.append(
                "Block new high-risk applications; review recent applicants"
            )

        if network_data.get('ddos_intensity', 0) > 0.7:
            recommendations.append(
                "Activate DDoS mitigation; redirect traffic to backup infrastructure"
            )

        return "; ".join(recommendations) if recommendations else "Continue monitoring"
