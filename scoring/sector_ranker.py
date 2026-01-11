"""
Sector Ranker Modul

Verwaltet Branchenvergleiche und Ranking innerhalb von Sektoren.
Berechnet Perzentile und relative Positionierung.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict

from .data_loader import DataLoader, CompanyFinancials, get_data_loader
from .scorer import Scorer, ScoreResult, get_scorer


@dataclass
class SectorRanking:
    """Ranking-Informationen eines Unternehmens innerhalb seines Sektors."""
    symbol: str
    sector: str
    rank: int                    # Platzierung (1 = beste)
    total_in_sector: int         # Gesamtzahl Unternehmen im Sektor
    percentile: float            # Perzentil (0-100)
    position_description: str    # z.B. "oberes Drittel"


class SectorRanker:
    """
    Berechnet und verwaltet Rankings innerhalb von Sektoren.
    
    Alle Vergleiche erfolgen nur innerhalb desselben Sektors,
    um faire und aussagekräftige Einordnungen zu ermöglichen.
    """
    
    def __init__(self, data_loader: Optional[DataLoader] = None, scorer: Optional[Scorer] = None):
        """
        Initialisiert den SectorRanker.
        
        Args:
            data_loader: Optional, DataLoader-Instanz
            scorer: Optional, Scorer-Instanz
        """
        self._loader = data_loader or get_data_loader()
        self._scorer = scorer or get_scorer()
        self._sector_scores_cache: Dict[str, Dict[str, ScoreResult]] = {}
    
    def _get_sector_scores(self, sector: str) -> Dict[str, ScoreResult]:
        """
        Berechnet alle Scores für Unternehmen eines Sektors (gecacht).
        
        Returns:
            Dict mit Symbol -> ScoreResult Mapping
        """
        if sector in self._sector_scores_cache:
            return self._sector_scores_cache[sector]
        
        sector_companies = self._loader.get_sector_companies(sector)
        
        if not sector_companies:
            return {}
        
        results = {}
        for company in sector_companies:
            score_result = self._scorer.score_company(company, sector_companies)
            results[company.symbol] = score_result
        
        self._sector_scores_cache[sector] = results
        return results
    
    def get_sector_ranking(self, symbol: str) -> Optional[SectorRanking]:
        """
        Ermittelt das Ranking eines Unternehmens in seinem Sektor.
        
        Args:
            symbol: Aktiensymbol
        
        Returns:
            SectorRanking oder None wenn nicht gefunden
        """
        company = self._loader.get_company_data(symbol)
        if not company:
            return None
        
        sector = company.sector
        sector_scores = self._get_sector_scores(sector)
        
        if symbol not in sector_scores:
            return None
        
        company_score = sector_scores[symbol]
        
        # Alle Total-Scores sortieren (absteigend)
        sorted_scores = sorted(
            sector_scores.values(),
            key=lambda x: x.total_score,
            reverse=True
        )
        
        # Rang ermitteln
        rank = next(
            (i + 1 for i, s in enumerate(sorted_scores) if s.symbol == symbol),
            len(sorted_scores)
        )
        
        total_in_sector = len(sorted_scores)
        percentile = company_score.sector_percentile
        
        # Position beschreiben
        position_description = self._describe_position(percentile)
        
        return SectorRanking(
            symbol=symbol,
            sector=sector,
            rank=rank,
            total_in_sector=total_in_sector,
            percentile=percentile,
            position_description=position_description
        )
    
    def _describe_position(self, percentile: float) -> str:
        """
        Erzeugt eine qualitative Beschreibung der Position.
        
        Args:
            percentile: Perzentil-Wert (0-100)
        
        Returns:
            Qualitative Beschreibung
        """
        if percentile >= 90:
            return "Spitzengruppe"
        elif percentile >= 75:
            return "oberes Viertel"
        elif percentile >= 66:
            return "oberes Drittel"
        elif percentile >= 50:
            return "obere Hälfte"
        elif percentile >= 33:
            return "untere Hälfte"
        elif percentile >= 25:
            return "unteres Drittel"
        else:
            return "unteres Viertel"
    
    def get_sector_overview(self, sector: str) -> Dict[str, any]:
        """
        Gibt einen Überblick über alle Unternehmen eines Sektors.
        
        Args:
            sector: Name des Sektors
        
        Returns:
            Dict mit Sektor-Statistiken
        """
        sector_scores = self._get_sector_scores(sector)
        
        if not sector_scores:
            return {
                "sector": sector,
                "company_count": 0,
                "average_score": 0,
                "top_performers": [],
                "score_distribution": {}
            }
        
        scores = [s.total_score for s in sector_scores.values()]
        
        # Sortiere nach Score
        sorted_companies = sorted(
            sector_scores.values(),
            key=lambda x: x.total_score,
            reverse=True
        )
        
        # Top 3 Performer (nur Symbole, keine Scores offenlegen)
        top_performers = [s.symbol for s in sorted_companies[:3]]
        
        # Score-Verteilung in Kategorien (ohne genaue Zahlen)
        distribution = {
            "high": sum(1 for s in scores if s >= 70),     # Grün
            "medium": sum(1 for s in scores if 50 <= s < 70),  # Gelb
            "low": sum(1 for s in scores if s < 50)        # Rot
        }
        
        return {
            "sector": sector,
            "company_count": len(sector_scores),
            "top_performers": top_performers,
            "score_distribution": distribution
        }
    
    def compare_to_sector(self, symbol: str) -> Dict[str, str]:
        """
        Vergleicht ein Unternehmen qualitativ mit seinem Sektor.
        
        Args:
            symbol: Aktiensymbol
        
        Returns:
            Dict mit qualitativen Vergleichsaussagen
        """
        company = self._loader.get_company_data(symbol)
        if not company:
            return {}
        
        sector = company.sector
        sector_scores = self._get_sector_scores(sector)
        
        if symbol not in sector_scores:
            return {}
        
        company_score = sector_scores[symbol]
        
        # Vergleiche jede Dimension mit dem Sektor-Median
        all_quality = [s.quality_score for s in sector_scores.values()]
        all_growth = [s.growth_score for s in sector_scores.values()]
        all_stability = [s.stability_score for s in sector_scores.values()]
        all_valuation = [s.valuation_score for s in sector_scores.values()]
        
        import statistics
        
        comparisons = {}
        
        # Qualität
        quality_median = statistics.median(all_quality)
        if company_score.quality_score > quality_median + 10:
            comparisons["quality"] = "überdurchschnittlich"
        elif company_score.quality_score < quality_median - 10:
            comparisons["quality"] = "unterdurchschnittlich"
        else:
            comparisons["quality"] = "durchschnittlich"
        
        # Wachstum
        growth_median = statistics.median(all_growth)
        if company_score.growth_score > growth_median + 10:
            comparisons["growth"] = "überdurchschnittlich"
        elif company_score.growth_score < growth_median - 10:
            comparisons["growth"] = "unterdurchschnittlich"
        else:
            comparisons["growth"] = "durchschnittlich"
        
        # Stabilität
        stability_median = statistics.median(all_stability)
        if company_score.stability_score > stability_median + 10:
            comparisons["stability"] = "überdurchschnittlich"
        elif company_score.stability_score < stability_median - 10:
            comparisons["stability"] = "unterdurchschnittlich"
        else:
            comparisons["stability"] = "durchschnittlich"
        
        # Bewertung
        valuation_median = statistics.median(all_valuation)
        if company_score.valuation_score > valuation_median + 10:
            comparisons["valuation"] = "günstiger als Durchschnitt"
        elif company_score.valuation_score < valuation_median - 10:
            comparisons["valuation"] = "teurer als Durchschnitt"
        else:
            comparisons["valuation"] = "durchschnittlich bewertet"
        
        return comparisons
    
    def clear_cache(self):
        """Leert den internen Cache für Neuberechnungen."""
        self._sector_scores_cache.clear()


# Singleton-Instanz
_sector_ranker: Optional[SectorRanker] = None

def get_sector_ranker() -> SectorRanker:
    """Gibt eine Singleton-Instanz des SectorRankers zurück."""
    global _sector_ranker
    if _sector_ranker is None:
        _sector_ranker = SectorRanker()
    return _sector_ranker
