"""
Scorer Modul

Berechnet die Teil-Scores (Qualität, Wachstum, Stabilität, Bewertung)
und den Gesamt-Score für Unternehmen.

WICHTIG: Die Berechnung erfolgt relativ zum Sektor (Perzentil-basiert).
Einzelne Finanzkennzahlen werden NIEMALS ausgegeben.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import statistics

from .data_loader import CompanyFinancials
from .config import SCORE_WEIGHTS, WINSORIZE_PERCENTILES


@dataclass
class ScoreResult:
    """
    Internes Score-Ergebnis mit numerischen Werten.
    Diese Werte werden später in qualitative Begriffe umgewandelt.
    """
    symbol: str
    sector: str
    
    # Numerische Scores (0-100) - NUR INTERN
    quality_score: float
    growth_score: float
    stability_score: float
    valuation_score: float
    total_score: float
    
    # Perzentil im Sektor (0-100)
    sector_percentile: float


def winsorize(values: List[float], lower_pct: int = 5, upper_pct: int = 95) -> List[float]:
    """
    Begrenzt Extremwerte auf definierte Perzentile.
    
    Args:
        values: Liste der zu bereinigenden Werte
        lower_pct: Untere Perzentilgrenze
        upper_pct: Obere Perzentilgrenze
    
    Returns:
        Liste mit begrenzten Werten
    """
    if len(values) < 2:
        return values
    
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    
    lower_idx = int(n * lower_pct / 100)
    upper_idx = int(n * upper_pct / 100) - 1
    
    lower_bound = sorted_vals[max(0, lower_idx)]
    upper_bound = sorted_vals[min(n-1, upper_idx)]
    
    return [max(lower_bound, min(upper_bound, v)) for v in values]


def calculate_percentile_score(value: float, all_values: List[float], inverse: bool = False) -> float:
    """
    Berechnet den Perzentil-Score eines Wertes innerhalb einer Gruppe.
    
    Args:
        value: Der zu bewertende Wert
        all_values: Alle Werte der Vergleichsgruppe
        inverse: Wenn True, ist ein niedrigerer Wert besser (z.B. KGV)
    
    Returns:
        Perzentil-Score (0-100)
    """
    if len(all_values) < 2:
        return 50.0
    
    # Winsorizing anwenden
    winsorized = winsorize(all_values)
    
    # Wert ebenfalls begrenzen
    sorted_vals = sorted(winsorized)
    lower_bound = sorted_vals[0]
    upper_bound = sorted_vals[-1]
    bounded_value = max(lower_bound, min(upper_bound, value))
    
    # Anzahl Werte kleiner als der gegebene Wert
    count_below = sum(1 for v in winsorized if v < bounded_value)
    
    # Perzentil berechnen
    percentile = (count_below / len(winsorized)) * 100
    
    if inverse:
        percentile = 100 - percentile
    
    return percentile


class Scorer:
    """
    Berechnet Scores für Unternehmen basierend auf Finanzkennzahlen.
    
    Alle Berechnungen erfolgen relativ zum Sektor mittels Perzentil-Ranking.
    Die internen Kennzahlen werden NIEMALS nach außen gegeben.
    """
    
    def __init__(self):
        self._weights = SCORE_WEIGHTS
    
    def _extract_quality_metrics(self, company: CompanyFinancials) -> List[float]:
        """Extrahiert Qualitätsmetriken für die Score-Berechnung."""
        return [
            company.operating_margin,
            company.net_margin,
            company.roic,
            company.fcf_margin
        ]
    
    def _extract_growth_metrics(self, company: CompanyFinancials) -> List[float]:
        """Extrahiert Wachstumsmetriken für die Score-Berechnung."""
        return [
            company.revenue_growth_3y,
            company.earnings_growth_3y,
            company.fcf_growth_3y
        ]
    
    def _extract_stability_metrics(self, company: CompanyFinancials) -> Tuple[List[float], List[bool]]:
        """
        Extrahiert Stabilitätsmetriken für die Score-Berechnung.
        Gibt auch an, welche Metriken invers sind (niedriger = besser).
        """
        metrics = [
            company.debt_to_equity,      # inverse: niedriger ist besser
            company.interest_coverage,   # höher ist besser
            company.cashflow_volatility, # inverse: niedriger ist besser
            company.earnings_stability   # höher ist besser
        ]
        inverse_flags = [True, False, True, False]
        return metrics, inverse_flags
    
    def _extract_valuation_metrics(self, company: CompanyFinancials) -> List[float]:
        """
        Extrahiert Bewertungsmetriken für die Score-Berechnung.
        Alle Bewertungsmetriken sind invers (niedriger = besser).
        """
        return [
            company.pe_ratio,
            company.ev_ebitda,
            company.fcf_multiple
        ]
    
    def calculate_quality_score(
        self, 
        company: CompanyFinancials, 
        sector_companies: List[CompanyFinancials]
    ) -> float:
        """
        Berechnet den Qualitäts-Score relativ zum Sektor.
        
        Berücksichtigt: Operative Marge, Nettomarge, ROIC, FCF-Marge
        """
        scores = []
        company_metrics = self._extract_quality_metrics(company)
        
        for i, metric in enumerate(company_metrics):
            sector_values = [self._extract_quality_metrics(c)[i] for c in sector_companies]
            score = calculate_percentile_score(metric, sector_values, inverse=False)
            scores.append(score)
        
        return statistics.mean(scores) if scores else 50.0
    
    def calculate_growth_score(
        self, 
        company: CompanyFinancials, 
        sector_companies: List[CompanyFinancials]
    ) -> float:
        """
        Berechnet den Wachstums-Score relativ zum Sektor.
        
        Berücksichtigt: Umsatzwachstum, Gewinnwachstum, FCF-Wachstum
        """
        scores = []
        company_metrics = self._extract_growth_metrics(company)
        
        for i, metric in enumerate(company_metrics):
            sector_values = [self._extract_growth_metrics(c)[i] for c in sector_companies]
            score = calculate_percentile_score(metric, sector_values, inverse=False)
            scores.append(score)
        
        return statistics.mean(scores) if scores else 50.0
    
    def calculate_stability_score(
        self, 
        company: CompanyFinancials, 
        sector_companies: List[CompanyFinancials]
    ) -> float:
        """
        Berechnet den Stabilitäts-Score relativ zum Sektor.
        
        Berücksichtigt: Verschuldungsgrad, Zinsdeckung, Volatilität, Gewinnstabilität
        """
        scores = []
        company_metrics, inverse_flags = self._extract_stability_metrics(company)
        
        for i, (metric, inverse) in enumerate(zip(company_metrics, inverse_flags)):
            sector_data = [self._extract_stability_metrics(c) for c in sector_companies]
            sector_values = [d[0][i] for d in sector_data]
            score = calculate_percentile_score(metric, sector_values, inverse=inverse)
            scores.append(score)
        
        return statistics.mean(scores) if scores else 50.0
    
    def calculate_valuation_score(
        self, 
        company: CompanyFinancials, 
        sector_companies: List[CompanyFinancials]
    ) -> float:
        """
        Berechnet den Bewertungs-Score relativ zum Sektor.
        
        Berücksichtigt: KGV, EV/EBITDA, FCF-Multiple
        Alle Metriken sind invers (niedriger = besser = höherer Score)
        """
        scores = []
        company_metrics = self._extract_valuation_metrics(company)
        
        for i, metric in enumerate(company_metrics):
            sector_values = [self._extract_valuation_metrics(c)[i] for c in sector_companies]
            # Bewertungsmetriken sind invers: niedriger ist besser
            score = calculate_percentile_score(metric, sector_values, inverse=True)
            scores.append(score)
        
        return statistics.mean(scores) if scores else 50.0
    
    def calculate_total_score(
        self,
        quality: float,
        growth: float,
        stability: float,
        valuation: float
    ) -> float:
        """
        Berechnet den gewichteten Gesamt-Score.
        
        Gewichtung:
        - Qualität: 30%
        - Wachstum: 25%
        - Stabilität: 25%
        - Bewertung: 20%
        """
        total = (
            self._weights["quality"] * quality +
            self._weights["growth"] * growth +
            self._weights["stability"] * stability +
            self._weights["valuation"] * valuation
        )
        return round(total, 1)
    
    def calculate_sector_percentile(
        self,
        company_total_score: float,
        all_sector_total_scores: List[float]
    ) -> float:
        """
        Berechnet das Perzentil des Unternehmens innerhalb seines Sektors.
        
        Beispiel: Wenn 90% der Unternehmen einen niedrigeren Score haben,
        liegt das Unternehmen im 90. Perzentil.
        """
        if len(all_sector_total_scores) < 2:
            return 50.0
        
        count_below = sum(1 for s in all_sector_total_scores if s < company_total_score)
        percentile = (count_below / len(all_sector_total_scores)) * 100
        
        return round(percentile, 0)
    
    def score_company(
        self, 
        company: CompanyFinancials, 
        sector_companies: List[CompanyFinancials]
    ) -> ScoreResult:
        """
        Berechnet alle Scores für ein Unternehmen.
        
        Args:
            company: Das zu bewertende Unternehmen
            sector_companies: Alle Unternehmen im gleichen Sektor (inkl. company)
        
        Returns:
            ScoreResult mit allen berechneten Scores
        """
        # Teil-Scores berechnen
        quality = self.calculate_quality_score(company, sector_companies)
        growth = self.calculate_growth_score(company, sector_companies)
        stability = self.calculate_stability_score(company, sector_companies)
        valuation = self.calculate_valuation_score(company, sector_companies)
        
        # Gesamt-Score berechnen
        total = self.calculate_total_score(quality, growth, stability, valuation)
        
        # Sektor-Perzentil berechnen
        # Dafür müssen wir die Total-Scores aller Sektor-Unternehmen berechnen
        all_sector_totals = []
        for c in sector_companies:
            if c.symbol == company.symbol:
                all_sector_totals.append(total)
            else:
                c_quality = self.calculate_quality_score(c, sector_companies)
                c_growth = self.calculate_growth_score(c, sector_companies)
                c_stability = self.calculate_stability_score(c, sector_companies)
                c_valuation = self.calculate_valuation_score(c, sector_companies)
                c_total = self.calculate_total_score(c_quality, c_growth, c_stability, c_valuation)
                all_sector_totals.append(c_total)
        
        sector_percentile = self.calculate_sector_percentile(total, all_sector_totals)
        
        return ScoreResult(
            symbol=company.symbol,
            sector=company.sector,
            quality_score=round(quality, 1),
            growth_score=round(growth, 1),
            stability_score=round(stability, 1),
            valuation_score=round(valuation, 1),
            total_score=total,
            sector_percentile=sector_percentile
        )


# Singleton-Instanz
_scorer: Optional[Scorer] = None

def get_scorer() -> Scorer:
    """Gibt eine Singleton-Instanz des Scorers zurück."""
    global _scorer
    if _scorer is None:
        _scorer = Scorer()
    return _scorer
