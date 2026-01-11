"""
Capitovo Scoring API

Hauptmodul das alle Komponenten verbindet und das finale
JSON-Output für die Frontend-Integration liefert.

WICHTIG: Diese API gibt NUR qualitative Bewertungen aus,
KEINE Finanzkennzahlen!
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import json
from datetime import datetime

from .data_loader import DataLoader, get_data_loader
from .scorer import Scorer, ScoreResult, get_scorer
from .sector_ranker import SectorRanker, get_sector_ranker
from .text_generator import TextGenerator, get_text_generator, get_traffic_light
from .config import DISCLAIMER


@dataclass
class ScoringOutput:
    """
    Das finale Output-Format für das Frontend.
    
    Enthält NUR:
    - Symbol und Sektor
    - Gesamt-Score (numerisch)
    - Qualitative Teil-Scores (Text)
    - Sektor-Perzentil
    - Ampelfarbe
    - Beschreibungstext
    
    Enthält KEINE Finanzkennzahlen!
    """
    symbol: str
    sector: str
    score_total: int
    score_quality: str
    score_growth: str
    score_stability: str
    score_valuation: str
    sector_percentile: int
    traffic_light: str
    summary_text: str


class ScoringAPI:
    """
    Haupt-API für das Capitovo Scoring-System.
    
    Diese Klasse orchestriert alle Module und liefert
    das finale, rechtssichere Output.
    """
    
    def __init__(
        self,
        use_mock_data: bool = True,
        data_loader: Optional[DataLoader] = None,
        scorer: Optional[Scorer] = None,
        sector_ranker: Optional[SectorRanker] = None,
        text_generator: Optional[TextGenerator] = None
    ):
        """
        Initialisiert die Scoring-API.
        
        Args:
            use_mock_data: Wenn True, werden Mock-Daten verwendet
            data_loader: Optional, eigener DataLoader
            scorer: Optional, eigener Scorer
            sector_ranker: Optional, eigener SectorRanker
            text_generator: Optional, eigener TextGenerator
        """
        self._loader = data_loader or get_data_loader(use_mock=use_mock_data)
        self._scorer = scorer or get_scorer()
        self._ranker = sector_ranker or get_sector_ranker()
        self._text_gen = text_generator or get_text_generator()
    
    def get_company_score(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Berechnet und liefert das Scoring für ein Unternehmen.
        
        Args:
            symbol: Aktiensymbol (z.B. "AAPL")
        
        Returns:
            Dict im definierten Output-Format oder None
        
        Beispiel-Output:
            {
                "symbol": "AAPL",
                "sector": "Technology",
                "score_total": 78,
                "score_quality": "hoch",
                "score_growth": "solide",
                "score_stability": "sehr hoch",
                "score_valuation": "anspruchsvoll",
                "sector_percentile": 72,
                "traffic_light": "green",
                "summary_text": "Das Unternehmen überzeugt durch hohe Qualität..."
            }
        """
        # Unternehmensdaten laden
        company = self._loader.get_company_data(symbol.upper())
        if not company:
            return None
        
        # Sektor-Unternehmen laden
        sector_companies = self._loader.get_sector_companies(company.sector)
        if not sector_companies:
            return None
        
        # Scores berechnen
        score_result = self._scorer.score_company(company, sector_companies)
        
        # Sektor-Ranking ermitteln
        sector_ranking = self._ranker.get_sector_ranking(symbol.upper())
        
        # Qualitative Labels generieren
        labels = self._text_gen.generate_score_labels(score_result)
        
        # Beschreibungstext generieren
        summary = self._text_gen.generate_summary(score_result, sector_ranking)
        
        # Ampelfarbe bestimmen
        traffic_light = get_traffic_light(score_result.total_score)
        
        # Output erstellen
        output = ScoringOutput(
            symbol=company.symbol,
            sector=company.sector,
            score_total=int(round(score_result.total_score)),
            score_quality=labels["quality"],
            score_growth=labels["growth"],
            score_stability=labels["stability"],
            score_valuation=labels["valuation"],
            sector_percentile=int(score_result.sector_percentile),
            traffic_light=traffic_light,
            summary_text=summary
        )
        
        return asdict(output)
    
    def get_company_score_json(self, symbol: str) -> str:
        """
        Wie get_company_score(), aber als JSON-String.
        
        Args:
            symbol: Aktiensymbol
        
        Returns:
            JSON-String oder leeres Objekt
        """
        result = self.get_company_score(symbol)
        if result:
            return json.dumps(result, ensure_ascii=False, indent=2)
        return "{}"
    
    def get_sector_overview(self, sector: str) -> Dict[str, Any]:
        """
        Liefert einen Überblick über einen Sektor.
        
        Args:
            sector: Sektorname
        
        Returns:
            Dict mit Sektor-Statistiken (keine Einzelkennzahlen)
        """
        return self._ranker.get_sector_overview(sector)
    
    def get_available_symbols(self) -> List[str]:
        """Gibt alle verfügbaren Aktien-Symbole zurück."""
        return self._loader._source.get_available_symbols()
    
    def get_available_sectors(self) -> List[str]:
        """Gibt alle verfügbaren Sektoren zurück."""
        return self._loader._source.get_available_sectors()
    
    def batch_score(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """
        Berechnet Scores für mehrere Unternehmen.
        
        Args:
            symbols: Liste von Aktiensymbolen
        
        Returns:
            Liste von Score-Dicts
        """
        results = []
        for symbol in symbols:
            score = self.get_company_score(symbol)
            if score:
                results.append(score)
        return results
    
    def get_disclaimer(self) -> str:
        """Gibt den rechtlichen Disclaimer zurück."""
        return DISCLAIMER
    
    def refresh_cache(self):
        """Aktualisiert alle gecachten Daten."""
        self._ranker.clear_cache()


# Singleton-Instanz
_api: Optional[ScoringAPI] = None

def get_scoring_api(use_mock: bool = True) -> ScoringAPI:
    """
    Gibt eine Singleton-Instanz der Scoring-API zurück.
    
    Args:
        use_mock: Wenn True, werden Mock-Daten verwendet
    
    Returns:
        ScoringAPI-Instanz
    """
    global _api
    if _api is None:
        _api = ScoringAPI(use_mock_data=use_mock)
    return _api


# ============================================================================
# CONVENIENCE-FUNKTIONEN
# ============================================================================

def score_company(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Schnelle Funktion zum Scoren eines Unternehmens.
    
    Beispiel:
        from scoring import score_company
        result = score_company("AAPL")
        print(result)
    """
    api = get_scoring_api()
    return api.get_company_score(symbol)


def score_company_json(symbol: str) -> str:
    """
    Schnelle Funktion zum Scoren als JSON.
    
    Beispiel:
        from scoring import score_company_json
        json_result = score_company_json("AAPL")
    """
    api = get_scoring_api()
    return api.get_company_score_json(symbol)


# ============================================================================
# CLI-INTERFACE
# ============================================================================

def main():
    """
    Kommandozeilen-Interface für das Scoring-System.
    
    Verwendung:
        python -m scoring.api AAPL
        python -m scoring.api AAPL MSFT GOOGL
        python -m scoring.api --all
        python -m scoring.api --sector Technology
    """
    import sys
    
    api = get_scoring_api(use_mock=True)
    
    if len(sys.argv) < 2:
        print("Verwendung:")
        print("  python -m scoring.api <SYMBOL>")
        print("  python -m scoring.api <SYMBOL1> <SYMBOL2> ...")
        print("  python -m scoring.api --all")
        print("  python -m scoring.api --sector <SECTOR>")
        print("  python -m scoring.api --list-symbols")
        print("  python -m scoring.api --list-sectors")
        return
    
    arg = sys.argv[1]
    
    if arg == "--all":
        symbols = api.get_available_symbols()
        results = api.batch_score(symbols)
        print(json.dumps(results, ensure_ascii=False, indent=2))
    
    elif arg == "--sector":
        if len(sys.argv) < 3:
            print("Fehler: Sektor angeben")
            return
        sector = sys.argv[2]
        overview = api.get_sector_overview(sector)
        print(json.dumps(overview, ensure_ascii=False, indent=2))
    
    elif arg == "--list-symbols":
        symbols = api.get_available_symbols()
        print("\n".join(sorted(symbols)))
    
    elif arg == "--list-sectors":
        sectors = api.get_available_sectors()
        print("\n".join(sorted(sectors)))
    
    elif arg == "--disclaimer":
        print(api.get_disclaimer())
    
    else:
        # Ein oder mehrere Symbole
        symbols = sys.argv[1:]
        if len(symbols) == 1:
            result = api.get_company_score(symbols[0])
            if result:
                print(json.dumps(result, ensure_ascii=False, indent=2))
            else:
                print(f"Symbol '{symbols[0]}' nicht gefunden.")
        else:
            results = api.batch_score(symbols)
            print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
