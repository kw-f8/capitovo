"""
Text Generator Modul

Generiert automatisch neutrale, rechtssichere Beschreibungstexte
für die Aktien-Einschätzungen.

WICHTIG: Keine Handlungsempfehlungen, keine Kursziele,
keine Performance-Prognosen!
"""

from typing import Dict, Optional
from .scorer import ScoreResult
from .sector_ranker import SectorRanking
from .config import QUALITY_LABELS, VALUATION_LABELS, TRAFFIC_LIGHT_THRESHOLDS


def _get_quality_label(score: float) -> str:
    """
    Wandelt einen numerischen Score in ein qualitatives Label um.
    
    Args:
        score: Numerischer Score (0-100)
    
    Returns:
        Qualitatives Label (z.B. "hoch", "solide")
    """
    for (low, high), label in QUALITY_LABELS.items():
        if low <= score <= high:
            return label
    return "moderat"


def _get_valuation_label(score: float) -> str:
    """
    Wandelt einen Bewertungs-Score in ein qualitatives Label um.
    Bei Bewertung: hoher Score = günstig, niedriger Score = teuer
    
    Args:
        score: Numerischer Score (0-100)
    
    Returns:
        Qualitatives Label (z.B. "fair", "anspruchsvoll")
    """
    for (low, high), label in VALUATION_LABELS.items():
        if low <= score <= high:
            return label
    return "fair"


def get_traffic_light(total_score: float) -> str:
    """
    Bestimmt die Ampelfarbe basierend auf dem Gesamt-Score.
    
    Args:
        total_score: Gesamt-Score (0-100)
    
    Returns:
        Ampelfarbe ("green", "yellow", "red")
    """
    if total_score >= TRAFFIC_LIGHT_THRESHOLDS["green"]:
        return "green"
    elif total_score >= TRAFFIC_LIGHT_THRESHOLDS["yellow"]:
        return "yellow"
    else:
        return "red"


class TextGenerator:
    """
    Generiert automatische, rechtssichere Beschreibungstexte.
    
    Alle Texte sind:
    - Neutral und sachlich
    - Ohne Handlungsempfehlungen
    - Ohne Kursziele oder Renditeversprechen
    - Rein beschreibend
    """
    
    def __init__(self):
        # Textbausteine für verschiedene Score-Bereiche
        self._quality_phrases = {
            "hervorragend": "Das Unternehmen weist eine hervorragende Profitabilität und Kapitalrendite auf.",
            "sehr hoch": "Das Unternehmen zeigt eine überdurchschnittlich hohe Profitabilität.",
            "hoch": "Das Unternehmen überzeugt durch hohe Qualitätskennzahlen.",
            "solide": "Das Unternehmen verfügt über eine solide Profitabilität.",
            "moderat": "Die Profitabilität des Unternehmens liegt im moderaten Bereich.",
            "schwach": "Die Qualitätskennzahlen des Unternehmens sind unterdurchschnittlich.",
            "sehr schwach": "Das Unternehmen weist schwache Qualitätskennzahlen auf."
        }
        
        self._stability_phrases = {
            "hervorragend": "Die Stabilität und Finanzstärke sind hervorragend.",
            "sehr hoch": "Das Unternehmen zeigt eine sehr hohe finanzielle Stabilität.",
            "hoch": "Die Finanzstabilität ist hoch und die Cashflows sind konsistent.",
            "solide": "Die Finanzlage ist solide und stabil.",
            "moderat": "Die Stabilität liegt im durchschnittlichen Bereich.",
            "schwach": "Die finanzielle Stabilität ist unterdurchschnittlich.",
            "sehr schwach": "Die Stabilität und Finanzstärke sind kritisch zu bewerten."
        }
        
        self._growth_phrases = {
            "hervorragend": "Das Wachstum ist außergewöhnlich stark.",
            "sehr hoch": "Das Unternehmen wächst deutlich überdurchschnittlich.",
            "hoch": "Das Wachstum ist solide und überdurchschnittlich.",
            "solide": "Das Wachstum entwickelt sich solide.",
            "moderat": "Das Wachstum liegt im moderaten Bereich.",
            "schwach": "Das Wachstum ist unterdurchschnittlich.",
            "sehr schwach": "Das Wachstum ist schwach oder rückläufig."
        }
        
        self._valuation_phrases = {
            "sehr günstig": "Die Bewertung erscheint im Branchenvergleich sehr günstig.",
            "günstig": "Die Bewertung ist im Sektorvergleich günstig.",
            "fair": "Die Bewertung liegt im fairen Bereich.",
            "leicht erhöht": "Die Bewertung ist leicht erhöht.",
            "erhöht": "Die Bewertung ist im Vergleich zum Sektor erhöht.",
            "anspruchsvoll": "Die Bewertung ist ambitioniert.",
            "sehr anspruchsvoll": "Die Bewertung ist sehr anspruchsvoll."
        }
        
        self._sector_position_phrases = {
            "Spitzengruppe": "Im Branchenvergleich gehört das Unternehmen zur Spitzengruppe.",
            "oberes Viertel": "Im Branchenvergleich liegt das Unternehmen im oberen Viertel.",
            "oberes Drittel": "Im Branchenvergleich liegt das Unternehmen im oberen Drittel.",
            "obere Hälfte": "Im Branchenvergleich liegt das Unternehmen über dem Durchschnitt.",
            "untere Hälfte": "Im Branchenvergleich liegt das Unternehmen unter dem Durchschnitt.",
            "unteres Drittel": "Im Branchenvergleich liegt das Unternehmen im unteren Drittel.",
            "unteres Viertel": "Im Branchenvergleich liegt das Unternehmen im unteren Viertel."
        }
    
    def generate_summary(
        self, 
        score_result: ScoreResult, 
        sector_ranking: Optional[SectorRanking] = None
    ) -> str:
        """
        Generiert einen zusammenfassenden Text für das Unternehmen.
        
        Der Text ist neutral, sachlich und enthält:
        - Einschätzung zur Qualität/Stabilität
        - Branchenvergleich
        - Bewertungseinschätzung
        
        Args:
            score_result: Die berechneten Scores
            sector_ranking: Optional, das Sektor-Ranking
        
        Returns:
            Automatisch generierter Beschreibungstext
        """
        sentences = []
        
        # 1. Satz: Qualität und Stabilität
        quality_label = _get_quality_label(score_result.quality_score)
        stability_label = _get_quality_label(score_result.stability_score)
        
        # Kombiniere Qualität und Stabilität intelligent
        if quality_label in ["hervorragend", "sehr hoch", "hoch"]:
            if stability_label in ["hervorragend", "sehr hoch", "hoch"]:
                sentences.append(
                    f"Das Unternehmen überzeugt durch {quality_label.replace('hervorragend', 'hervorragende').replace('sehr hoch', 'sehr hohe').replace('hoch', 'hohe')} Qualität und stabile Cashflows."
                )
            else:
                sentences.append(self._quality_phrases.get(quality_label, "Das Unternehmen zeigt eine solide Profitabilität."))
        elif quality_label in ["solide", "moderat"]:
            sentences.append(self._quality_phrases.get(quality_label, "Das Unternehmen verfügt über eine solide Profitabilität."))
        else:
            sentences.append(self._quality_phrases.get(quality_label, "Die Qualitätskennzahlen sind verbesserungswürdig."))
        
        # 2. Satz: Branchenvergleich
        if sector_ranking:
            position_phrase = self._sector_position_phrases.get(
                sector_ranking.position_description,
                f"Im Branchenvergleich liegt das Unternehmen auf Platz {sector_ranking.rank} von {sector_ranking.total_in_sector}."
            )
            sentences.append(position_phrase)
        else:
            # Fallback basierend auf Perzentil
            if score_result.sector_percentile >= 75:
                sentences.append("Im Branchenvergleich liegt das Unternehmen im oberen Viertel.")
            elif score_result.sector_percentile >= 50:
                sentences.append("Im Branchenvergleich liegt das Unternehmen über dem Durchschnitt.")
            elif score_result.sector_percentile >= 25:
                sentences.append("Im Branchenvergleich liegt das Unternehmen unter dem Durchschnitt.")
            else:
                sentences.append("Im Branchenvergleich liegt das Unternehmen im unteren Viertel.")
        
        # 3. Satz: Bewertung
        valuation_label = _get_valuation_label(score_result.valuation_score)
        valuation_phrase = self._valuation_phrases.get(
            valuation_label,
            "Die Bewertung liegt im durchschnittlichen Bereich."
        )
        sentences.append(valuation_phrase)
        
        return " ".join(sentences)
    
    def generate_score_labels(self, score_result: ScoreResult) -> Dict[str, str]:
        """
        Generiert qualitative Labels für alle Teil-Scores.
        
        Args:
            score_result: Die berechneten Scores
        
        Returns:
            Dict mit qualitativen Labels für jeden Bereich
        """
        return {
            "quality": _get_quality_label(score_result.quality_score),
            "growth": _get_quality_label(score_result.growth_score),
            "stability": _get_quality_label(score_result.stability_score),
            "valuation": _get_valuation_label(score_result.valuation_score)
        }
    
    def generate_short_description(self, score_result: ScoreResult) -> str:
        """
        Generiert eine kurze Einzeilenbeschreibung.
        
        Args:
            score_result: Die berechneten Scores
        
        Returns:
            Kurze Beschreibung (max. 50 Zeichen)
        """
        traffic_light = get_traffic_light(score_result.total_score)
        
        if traffic_light == "green":
            return "Attraktives Gesamtprofil"
        elif traffic_light == "yellow":
            return "Ausgewogenes Gesamtprofil"
        else:
            return "Schwaches Gesamtprofil"


# Singleton-Instanz
_text_generator: Optional[TextGenerator] = None

def get_text_generator() -> TextGenerator:
    """Gibt eine Singleton-Instanz des TextGenerators zurück."""
    global _text_generator
    if _text_generator is None:
        _text_generator = TextGenerator()
    return _text_generator
