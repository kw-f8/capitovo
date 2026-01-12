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
        # Interpretationstexte für Teil-Scores (1 Satz)
        self._quality_interpretations = {
            "hervorragend": "Die Profitabilität liegt deutlich über dem Branchendurchschnitt.",
            "sehr hoch": "Die Profitabilität liegt deutlich über dem Branchendurchschnitt.",
            "hoch": "Die Profitabilität liegt über dem Branchendurchschnitt.",
            "solide": "Die Profitabilität bewegt sich im Branchendurchschnitt.",
            "fair": "Die Profitabilität bewegt sich im Branchendurchschnitt.",
            "moderat": "Die Profitabilität liegt leicht unter dem Branchendurchschnitt.",
            "schwach": "Die Profitabilität liegt unter dem Branchendurchschnitt.",
            "sehr schwach": "Die Profitabilität liegt deutlich unter dem Branchendurchschnitt."
        }
        
        self._growth_interpretations = {
            "hervorragend": "Die Umsatz- und Ergebnisentwicklung übertrifft deutlich die Mehrheit der Wettbewerber.",
            "sehr hoch": "Die Umsatz- und Ergebnisentwicklung übertrifft deutlich die Mehrheit der Wettbewerber.",
            "hoch": "Die Umsatz- und Ergebnisentwicklung übertrifft die Mehrheit der Wettbewerber.",
            "solide": "Die Umsatz- und Ergebnisentwicklung liegt im Sektordurchschnitt.",
            "fair": "Die Umsatz- und Ergebnisentwicklung liegt im Sektordurchschnitt.",
            "moderat": "Die Umsatz- und Ergebnisentwicklung bleibt hinter vielen Wettbewerbern zurück.",
            "schwach": "Die Umsatz- und Ergebnisentwicklung liegt unter dem Sektordurchschnitt.",
            "sehr schwach": "Die Umsatz- und Ergebnisentwicklung liegt deutlich unter dem Sektordurchschnitt."
        }
        
        self._stability_interpretations = {
            "hervorragend": "Die Cashflow-Stabilität liegt deutlich über dem Sektorniveau.",
            "sehr hoch": "Die Cashflow-Stabilität liegt deutlich über dem Sektorniveau.",
            "hoch": "Die Cashflow-Stabilität liegt über dem Sektorniveau.",
            "solide": "Die Cashflow-Stabilität liegt im Sektordurchschnitt.",
            "fair": "Die Cashflow-Stabilität liegt im Sektordurchschnitt.",
            "moderat": "Die Cashflow-Stabilität liegt leicht unter dem Sektorniveau.",
            "schwach": "Die Cashflow-Stabilität liegt unter dem Sektorniveau.",
            "sehr schwach": "Die Cashflow-Stabilität liegt deutlich unter dem Sektorniveau."
        }
        
        self._valuation_interpretations = {
            "sehr günstig": "Das Bewertungsniveau liegt deutlich unter dem Branchendurchschnitt.",
            "günstig": "Das Bewertungsniveau liegt unter dem Branchendurchschnitt.",
            "fair": "Das Bewertungsniveau liegt im fairen Bereich des Branchendurchschnitts.",
            "leicht erhöht": "Das Bewertungsniveau liegt leicht über dem Branchendurchschnitt.",
            "erhöht": "Das Bewertungsniveau liegt über dem Branchendurchschnitt.",
            "anspruchsvoll": "Das Bewertungsniveau liegt deutlich über dem Branchendurchschnitt.",
            "sehr anspruchsvoll": "Das Bewertungsniveau liegt deutlich über dem Branchendurchschnitt."
        }
        
        # Legacy-Textbausteine (für Abwärtskompatibilität)
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
        Generiert einen zusammenfassenden 3-Satz-Text für das Unternehmen.
        
        Struktur:
        - Satz 1: Was stabil/positiv ist (Stärke)
        - Satz 2: Wo der strukturelle Nachteil liegt (Schwäche)
        - Satz 3: Gesamteinordnung im Sektor
        
        Args:
            score_result: Die berechneten Scores
            sector_ranking: Optional, das Sektor-Ranking
        
        Returns:
            Automatisch generierter 3-Satz-Beschreibungstext
        """
        sentences = []
        
        # Bestimme Labels
        quality_label = _get_quality_label(score_result.quality_score)
        growth_label = _get_quality_label(score_result.growth_score)
        stability_label = _get_quality_label(score_result.stability_score)
        valuation_label = _get_valuation_label(score_result.valuation_score)
        
        # Satz 1: Stärken (Was ist positiv/solide?)
        strengths = []
        if quality_label in ["hervorragend", "sehr hoch", "hoch"]:
            strengths.append("Qualität")
        if growth_label in ["hervorragend", "sehr hoch", "hoch"]:
            strengths.append("Wachstum")
        if stability_label in ["hervorragend", "sehr hoch", "hoch"]:
            strengths.append("Stabilität")
        
        if len(strengths) >= 2:
            sentence1 = f"Das Unternehmen zeigt in den Bereichen {' und '.join(strengths)} Werte deutlich über Branchenniveau."
        elif len(strengths) == 1:
            if strengths[0] == "Wachstum":
                sentence1 = "Das Wachstum positioniert sich über dem Sektorniveau."
            elif strengths[0] == "Stabilität":
                sentence1 = f"Die {strengths[0]} des Unternehmens liegt deutlich über dem Sektorniveau."
            else:
                sentence1 = f"Die {strengths[0]} des Unternehmens liegt über dem Branchendurchschnitt."
        else:
            # Fallback: Solide Bereiche
            if quality_label in ["solide", "fair"]:
                sentence1 = "Die Profitabilität und Stabilität des Unternehmens liegen im Branchendurchschnitt."
            elif stability_label in ["solide", "fair"]:
                sentence1 = "Die Stabilität liegt über dem Sektorniveau und die Bewertung unter dem Branchendurchschnitt." if valuation_label in ["günstig", "sehr günstig"] else "Die Stabilität des Unternehmens liegt im Branchendurchschnitt."
            else:
                sentence1 = "Das Gesamtprofil bewegt sich im mittleren Bereich des Sektors."
        
        sentences.append(sentence1)
        
        # Satz 2: Schwächen / Kontext (Was ist verbesserungswürdig?)
        weaknesses = []
        if quality_label in ["schwach", "sehr schwach"]:
            weaknesses.append(("quality", "Die Qualitätskennzahlen liegen unter dem Branchendurchschnitt"))
        if growth_label in ["schwach", "sehr schwach", "moderat"]:
            weaknesses.append(("growth", "Das Wachstum fällt im Vergleich zu vielen Wettbewerbern schwächer aus"))
        if valuation_label in ["anspruchsvoll", "sehr anspruchsvoll", "erhöht", "leicht erhöht"]:
            weaknesses.append(("valuation", f"Die Bewertung liegt {'allerdings ebenfalls ' if len(strengths) >= 2 else ''}deutlich über dem Sektordurchschnitt" if "sehr" in valuation_label or "anspruchsvoll" in valuation_label else "leicht über dem Sektordurchschnitt"))
        
        if weaknesses:
            if len(weaknesses) == 1:
                sentence2 = weaknesses[0][1] + "."
            else:
                # Priorisiere Qualität vor Wachstum
                sentence2 = weaknesses[0][1] + "."
        else:
            # Kein klarer Nachteil → Neutraler Kontext
            sentence2 = f"Das Wachstum liegt {'leicht ' if growth_label == 'moderat' else ''}{'unter' if growth_label in ['moderat', 'schwach'] else 'über'} dem Niveau vergleichbarer Unternehmen."
        
        sentences.append(sentence2)
        
        # Satz 3: Gesamteinordnung
        if score_result.sector_percentile >= 80:
            sentence3 = "Im Gesamtbild positioniert es sich klar im oberen Segment des Technologiesektors."
        elif score_result.sector_percentile >= 60:
            sentence3 = "Insgesamt positioniert sich das Unternehmen solide im oberen Mittelfeld des Technologiesektors."
        elif score_result.sector_percentile >= 40:
            sentence3 = "Insgesamt positioniert sich das Unternehmen im mittleren Bereich des Technologiesektors."
        elif score_result.sector_percentile >= 20:
            sentence3 = "Insgesamt ergibt sich daraus eine unterdurchschnittliche Positionierung im Technologiesektor."
        else:
            sentence3 = "Insgesamt ordnet sich das Unternehmen im unteren Bereich seines Sektors ein."
        
        sentences.append(sentence3)
        
        return " ".join(sentences)
    
    def generate_interpretations(self, score_result: ScoreResult) -> Dict[str, str]:
        """
        Generiert 1-Satz-Interpretationen für alle Teil-Scores.
        
        Args:
            score_result: Die berechneten Scores
        
        Returns:
            Dict mit Interpretationstexten für jeden Bereich
        """
        quality_label = _get_quality_label(score_result.quality_score)
        growth_label = _get_quality_label(score_result.growth_score)
        stability_label = _get_quality_label(score_result.stability_score)
        valuation_label = _get_valuation_label(score_result.valuation_score)
        
        return {
            "interpretation_quality": self._quality_interpretations.get(quality_label, "—"),
            "interpretation_growth": self._growth_interpretations.get(growth_label, "—"),
            "interpretation_stability": self._stability_interpretations.get(stability_label, "—"),
            "interpretation_valuation": self._valuation_interpretations.get(valuation_label, "—")
        }
    
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
