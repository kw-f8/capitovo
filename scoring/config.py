"""
Konfiguration für das Capitovo Scoring-System

Enthält alle Konstanten, Gewichtungen und Schwellenwerte.
"""

# ============================================================================
# SCORE-GEWICHTUNGEN
# ============================================================================

SCORE_WEIGHTS = {
    "quality": 0.30,      # Qualität: 30%
    "growth": 0.25,       # Wachstum: 25%
    "stability": 0.25,    # Stabilität: 25%
    "valuation": 0.20     # Bewertung: 20%
}

# ============================================================================
# AMPEL-SCHWELLENWERTE
# ============================================================================

TRAFFIC_LIGHT_THRESHOLDS = {
    "green": 70,   # >= 70: Attraktives Gesamtprofil
    "yellow": 50,  # 50-69: Ausgewogenes Gesamtprofil
    # < 50: Rot - Schwaches Gesamtprofil
}

TRAFFIC_LIGHT_TEXTS = {
    "green": "Attraktives Gesamtprofil",
    "yellow": "Ausgewogenes Gesamtprofil",
    "red": "Schwaches Gesamtprofil"
}

# ============================================================================
# QUALITATIVE BEWERTUNGSSTUFEN (für Output)
# ============================================================================

# Mapping von Perzentil-Bereichen zu qualitativen Begriffen
QUALITY_LABELS = {
    (90, 100): "hervorragend",
    (75, 89): "sehr hoch",
    (60, 74): "hoch",
    (40, 59): "solide",
    (25, 39): "moderat",
    (10, 24): "schwach",
    (0, 9): "sehr schwach"
}

# Spezielle Labels für Bewertung (umgekehrte Logik - niedriger ist besser)
VALUATION_LABELS = {
    (90, 100): "sehr günstig",
    (75, 89): "günstig",
    (60, 74): "fair",
    (40, 59): "leicht erhöht",
    (25, 39): "erhöht",
    (10, 24): "anspruchsvoll",
    (0, 9): "sehr anspruchsvoll"
}

# ============================================================================
# WINSORIZING GRENZEN
# ============================================================================

WINSORIZE_PERCENTILES = {
    "lower": 5,   # Untere Grenze: 5. Perzentil
    "upper": 95   # Obere Grenze: 95. Perzentil
}

# ============================================================================
# SEKTOREN
# ============================================================================

VALID_SECTORS = [
    "Technology",
    "Healthcare",
    "Financials",
    "Consumer Discretionary",
    "Consumer Staples",
    "Industrials",
    "Energy",
    "Materials",
    "Real Estate",
    "Utilities",
    "Communication Services"
]

# ============================================================================
# RECHTLICHER DISCLAIMER
# ============================================================================

DISCLAIMER = (
    "Die Bewertung basiert auf einem quantitativen Modell und stellt "
    "keine Anlageberatung dar."
)

# ============================================================================
# DATENQUELLEN-KONFIGURATION
# ============================================================================

DATA_SOURCE_CONFIG = {
    "use_mock": True,  # Für Entwicklung/Tests auf True setzen
    "cache_ttl_hours": 24,  # Cache-Gültigkeit in Stunden
}
