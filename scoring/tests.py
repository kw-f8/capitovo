"""
Tests für das Capitovo Scoring-System

Testet alle Module auf korrekte Funktionalität.
"""

import unittest
from scoring.data_loader import DataLoader, MockDataSource, get_data_loader
from scoring.scorer import Scorer, get_scorer, calculate_percentile_score, winsorize
from scoring.sector_ranker import SectorRanker, get_sector_ranker
from scoring.text_generator import TextGenerator, get_text_generator, get_traffic_light
from scoring.api import ScoringAPI, get_scoring_api, score_company


class TestDataLoader(unittest.TestCase):
    """Tests für den DataLoader."""
    
    def setUp(self):
        self.loader = DataLoader(use_mock=True)
    
    def test_get_company_data(self):
        """Test: Unternehmensdaten laden."""
        company = self.loader.get_company_data("AAPL")
        self.assertIsNotNone(company)
        self.assertEqual(company.symbol, "AAPL")
        self.assertEqual(company.sector, "Technology")
    
    def test_get_company_data_case_insensitive(self):
        """Test: Symbole sind case-insensitive."""
        company = self.loader.get_company_data("aapl")
        self.assertIsNotNone(company)
        self.assertEqual(company.symbol, "AAPL")
    
    def test_get_nonexistent_company(self):
        """Test: Nicht existierendes Unternehmen."""
        company = self.loader.get_company_data("NONEXISTENT")
        self.assertIsNone(company)
    
    def test_get_sector_companies(self):
        """Test: Alle Unternehmen eines Sektors."""
        tech_companies = self.loader.get_sector_companies("Technology")
        self.assertGreater(len(tech_companies), 0)
        for company in tech_companies:
            self.assertEqual(company.sector, "Technology")
    
    def test_get_all_companies(self):
        """Test: Alle Unternehmen laden."""
        all_companies = self.loader.get_all_companies()
        self.assertGreater(len(all_companies), 10)


class TestScorer(unittest.TestCase):
    """Tests für den Scorer."""
    
    def setUp(self):
        self.loader = DataLoader(use_mock=True)
        self.scorer = Scorer()
    
    def test_winsorize(self):
        """Test: Winsorizing funktioniert korrekt."""
        values = [1, 2, 3, 100, 5, 6, 7, 8, 9, 10]
        result = winsorize(values, lower_pct=10, upper_pct=90)
        # Der Ausreißer 100 sollte begrenzt werden
        self.assertLess(max(result), 100)
    
    def test_calculate_percentile_score(self):
        """Test: Perzentil-Berechnung."""
        values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        
        # Höchster Wert sollte hohe Perzentile haben
        high_score = calculate_percentile_score(100, values, inverse=False)
        self.assertGreaterEqual(high_score, 80)
        
        # Niedrigster Wert sollte niedrige Perzentile haben
        low_score = calculate_percentile_score(10, values, inverse=False)
        self.assertLessEqual(low_score, 20)
    
    def test_calculate_percentile_inverse(self):
        """Test: Inverse Perzentil-Berechnung (niedriger = besser)."""
        values = [10, 20, 30, 40, 50]
        
        # Bei inverse=True ist niedriger Wert besser
        low_score = calculate_percentile_score(10, values, inverse=True)
        high_score = calculate_percentile_score(50, values, inverse=True)
        
        self.assertGreater(low_score, high_score)
    
    def test_score_company(self):
        """Test: Vollständiges Scoring eines Unternehmens."""
        company = self.loader.get_company_data("AAPL")
        sector_companies = self.loader.get_sector_companies("Technology")
        
        result = self.scorer.score_company(company, sector_companies)
        
        # Alle Scores sollten zwischen 0 und 100 liegen
        self.assertGreaterEqual(result.quality_score, 0)
        self.assertLessEqual(result.quality_score, 100)
        self.assertGreaterEqual(result.growth_score, 0)
        self.assertLessEqual(result.growth_score, 100)
        self.assertGreaterEqual(result.stability_score, 0)
        self.assertLessEqual(result.stability_score, 100)
        self.assertGreaterEqual(result.valuation_score, 0)
        self.assertLessEqual(result.valuation_score, 100)
        self.assertGreaterEqual(result.total_score, 0)
        self.assertLessEqual(result.total_score, 100)
    
    def test_total_score_weights(self):
        """Test: Gewichtung des Gesamt-Scores."""
        # Bei gleichen Teil-Scores sollte Total = Teil-Scores sein
        total = self.scorer.calculate_total_score(50, 50, 50, 50)
        self.assertEqual(total, 50)


class TestSectorRanker(unittest.TestCase):
    """Tests für den SectorRanker."""
    
    def setUp(self):
        self.ranker = SectorRanker()
    
    def test_get_sector_ranking(self):
        """Test: Sektor-Ranking abrufen."""
        ranking = self.ranker.get_sector_ranking("AAPL")
        
        self.assertIsNotNone(ranking)
        self.assertEqual(ranking.symbol, "AAPL")
        self.assertEqual(ranking.sector, "Technology")
        self.assertGreater(ranking.total_in_sector, 0)
        self.assertGreaterEqual(ranking.rank, 1)
        self.assertLessEqual(ranking.rank, ranking.total_in_sector)
    
    def test_sector_overview(self):
        """Test: Sektor-Überblick."""
        overview = self.ranker.get_sector_overview("Technology")
        
        self.assertEqual(overview["sector"], "Technology")
        self.assertGreater(overview["company_count"], 0)
        self.assertIn("top_performers", overview)
        self.assertIn("score_distribution", overview)


class TestTextGenerator(unittest.TestCase):
    """Tests für den TextGenerator."""
    
    def setUp(self):
        self.text_gen = TextGenerator()
        self.loader = DataLoader(use_mock=True)
        self.scorer = Scorer()
    
    def test_get_traffic_light(self):
        """Test: Ampellogik."""
        self.assertEqual(get_traffic_light(80), "green")
        self.assertEqual(get_traffic_light(70), "green")
        self.assertEqual(get_traffic_light(60), "yellow")
        self.assertEqual(get_traffic_light(50), "yellow")
        self.assertEqual(get_traffic_light(40), "red")
        self.assertEqual(get_traffic_light(0), "red")
    
    def test_generate_summary(self):
        """Test: Text-Generierung."""
        company = self.loader.get_company_data("AAPL")
        sector_companies = self.loader.get_sector_companies("Technology")
        score_result = self.scorer.score_company(company, sector_companies)
        
        summary = self.text_gen.generate_summary(score_result)
        
        # Text sollte nicht leer sein
        self.assertGreater(len(summary), 50)
        
        # Text sollte keine verbotenen Begriffe enthalten
        forbidden_terms = ["kaufen", "verkaufen", "halten", "signal", "kursziel"]
        summary_lower = summary.lower()
        for term in forbidden_terms:
            self.assertNotIn(term, summary_lower)
    
    def test_generate_score_labels(self):
        """Test: Qualitative Labels."""
        company = self.loader.get_company_data("AAPL")
        sector_companies = self.loader.get_sector_companies("Technology")
        score_result = self.scorer.score_company(company, sector_companies)
        
        labels = self.text_gen.generate_score_labels(score_result)
        
        self.assertIn("quality", labels)
        self.assertIn("growth", labels)
        self.assertIn("stability", labels)
        self.assertIn("valuation", labels)
        
        # Labels sollten qualitative Begriffe sein, keine Zahlen
        for key, value in labels.items():
            self.assertIsInstance(value, str)
            self.assertFalse(value.isdigit())


class TestScoringAPI(unittest.TestCase):
    """Tests für die Haupt-API."""
    
    def setUp(self):
        self.api = ScoringAPI(use_mock_data=True)
    
    def test_get_company_score(self):
        """Test: Komplettes Scoring abrufen."""
        result = self.api.get_company_score("AAPL")
        
        self.assertIsNotNone(result)
        
        # Alle erwarteten Felder prüfen
        expected_fields = [
            "symbol", "sector", "score_total",
            "score_quality", "score_growth", "score_stability", "score_valuation",
            "sector_percentile", "traffic_light", "summary_text"
        ]
        for field in expected_fields:
            self.assertIn(field, result)
        
        # Datentypen prüfen
        self.assertIsInstance(result["symbol"], str)
        self.assertIsInstance(result["sector"], str)
        self.assertIsInstance(result["score_total"], int)
        self.assertIsInstance(result["score_quality"], str)
        self.assertIsInstance(result["sector_percentile"], int)
        self.assertIsInstance(result["traffic_light"], str)
        self.assertIsInstance(result["summary_text"], str)
    
    def test_output_contains_no_financials(self):
        """Test: Output enthält keine Finanzkennzahlen."""
        result = self.api.get_company_score("AAPL")
        
        # Diese Felder dürfen NICHT im Output sein
        forbidden_fields = [
            "operating_margin", "net_margin", "roic", "fcf_margin",
            "revenue_growth", "earnings_growth", "fcf_growth",
            "debt_to_equity", "interest_coverage",
            "pe_ratio", "ev_ebitda", "fcf_multiple",
            "revenue", "earnings", "cashflow", "margin"
        ]
        
        result_str = str(result).lower()
        for field in forbidden_fields:
            self.assertNotIn(field, result_str)
    
    def test_traffic_light_values(self):
        """Test: Ampelwerte sind valide."""
        symbols = self.api.get_available_symbols()
        
        valid_lights = ["green", "yellow", "red"]
        for symbol in symbols[:5]:  # Nur erste 5 testen
            result = self.api.get_company_score(symbol)
            self.assertIn(result["traffic_light"], valid_lights)
    
    def test_score_range(self):
        """Test: Scores liegen im gültigen Bereich."""
        result = self.api.get_company_score("AAPL")
        
        self.assertGreaterEqual(result["score_total"], 0)
        self.assertLessEqual(result["score_total"], 100)
        self.assertGreaterEqual(result["sector_percentile"], 0)
        self.assertLessEqual(result["sector_percentile"], 100)
    
    def test_batch_score(self):
        """Test: Batch-Scoring."""
        symbols = ["AAPL", "MSFT", "GOOGL"]
        results = self.api.batch_score(symbols)
        
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertIn("symbol", result)
            self.assertIn("score_total", result)
    
    def test_convenience_function(self):
        """Test: Convenience-Funktion score_company()."""
        result = score_company("AAPL")
        
        self.assertIsNotNone(result)
        self.assertEqual(result["symbol"], "AAPL")


class TestLegalCompliance(unittest.TestCase):
    """Tests für rechtliche Compliance."""
    
    def setUp(self):
        self.api = ScoringAPI(use_mock_data=True)
    
    def test_no_buy_sell_recommendations(self):
        """Test: Keine Kauf-/Verkaufsempfehlungen."""
        symbols = self.api.get_available_symbols()
        
        forbidden_terms = [
            "kaufen", "verkaufen", "halten",
            "buy", "sell", "hold",
            "signal", "empfehlung", "sollte"
        ]
        
        for symbol in symbols[:10]:
            result = self.api.get_company_score(symbol)
            summary = result["summary_text"].lower()
            
            for term in forbidden_terms:
                self.assertNotIn(
                    term, summary,
                    f"Verbotener Begriff '{term}' gefunden für {symbol}"
                )
    
    def test_disclaimer_available(self):
        """Test: Disclaimer ist verfügbar."""
        disclaimer = self.api.get_disclaimer()
        
        self.assertIsNotNone(disclaimer)
        self.assertGreater(len(disclaimer), 20)
        self.assertIn("Anlageberatung", disclaimer)


if __name__ == "__main__":
    unittest.main()
