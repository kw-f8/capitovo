"""
Data Loader Modul

Abstrahierte Datenschicht für Finanzkennzahlen.
Unterstützt Mock-Daten und echte API-Quellen.

WICHTIG: Die geladenen Kennzahlen werden NUR intern verwendet
und NIEMALS im Frontend angezeigt.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from abc import ABC, abstractmethod
import json
import os
from datetime import datetime


@dataclass
class CompanyFinancials:
    """
    Interne Datenstruktur für Finanzkennzahlen.
    Diese Daten werden NUR für die Score-Berechnung verwendet.
    """
    symbol: str
    name: str
    sector: str
    
    # Qualitäts-Metriken (INTERN)
    operating_margin: float
    net_margin: float
    roic: float
    fcf_margin: float
    
    # Wachstums-Metriken (INTERN)
    revenue_growth_3y: float
    earnings_growth_3y: float
    fcf_growth_3y: float
    
    # Stabilitäts-Metriken (INTERN)
    debt_to_equity: float
    interest_coverage: float
    cashflow_volatility: float
    earnings_stability: float
    
    # Bewertungs-Metriken (INTERN)
    pe_ratio: float
    ev_ebitda: float
    fcf_multiple: float
    
    # Metadaten
    last_updated: Optional[str] = None


class DataSourceBase(ABC):
    """Abstrakte Basisklasse für Datenquellen."""
    
    @abstractmethod
    def get_company_data(self, symbol: str) -> Optional[CompanyFinancials]:
        """Lädt Daten für ein einzelnes Unternehmen."""
        pass
    
    @abstractmethod
    def get_sector_companies(self, sector: str) -> List[CompanyFinancials]:
        """Lädt alle Unternehmen eines Sektors."""
        pass
    
    @abstractmethod
    def get_all_companies(self) -> List[CompanyFinancials]:
        """Lädt alle verfügbaren Unternehmen."""
        pass


class MockDataSource(DataSourceBase):
    """
    Mock-Datenquelle für Entwicklung und Tests.
    Enthält realistische Beispieldaten für verschiedene Sektoren.
    """
    
    def __init__(self):
        self._companies = self._generate_mock_data()
    
    def _generate_mock_data(self) -> Dict[str, CompanyFinancials]:
        """Generiert realistische Mock-Daten."""
        mock_data = {
            # Technology Sektor
            "AAPL": CompanyFinancials(
                symbol="AAPL", name="Apple Inc.", sector="Technology",
                operating_margin=0.30, net_margin=0.25, roic=0.45, fcf_margin=0.28,
                revenue_growth_3y=0.08, earnings_growth_3y=0.10, fcf_growth_3y=0.12,
                debt_to_equity=1.5, interest_coverage=25.0, cashflow_volatility=0.15, earnings_stability=0.90,
                pe_ratio=28.0, ev_ebitda=20.0, fcf_multiple=25.0,
                last_updated=datetime.now().isoformat()
            ),
            "MSFT": CompanyFinancials(
                symbol="MSFT", name="Microsoft Corporation", sector="Technology",
                operating_margin=0.42, net_margin=0.35, roic=0.35, fcf_margin=0.32,
                revenue_growth_3y=0.14, earnings_growth_3y=0.18, fcf_growth_3y=0.20,
                debt_to_equity=0.5, interest_coverage=40.0, cashflow_volatility=0.10, earnings_stability=0.95,
                pe_ratio=32.0, ev_ebitda=22.0, fcf_multiple=28.0,
                last_updated=datetime.now().isoformat()
            ),
            "GOOGL": CompanyFinancials(
                symbol="GOOGL", name="Alphabet Inc.", sector="Technology",
                operating_margin=0.28, net_margin=0.22, roic=0.25, fcf_margin=0.25,
                revenue_growth_3y=0.12, earnings_growth_3y=0.15, fcf_growth_3y=0.14,
                debt_to_equity=0.3, interest_coverage=50.0, cashflow_volatility=0.12, earnings_stability=0.88,
                pe_ratio=25.0, ev_ebitda=16.0, fcf_multiple=22.0,
                last_updated=datetime.now().isoformat()
            ),
            "NVDA": CompanyFinancials(
                symbol="NVDA", name="NVIDIA Corporation", sector="Technology",
                operating_margin=0.55, net_margin=0.48, roic=0.60, fcf_margin=0.45,
                revenue_growth_3y=0.50, earnings_growth_3y=0.70, fcf_growth_3y=0.55,
                debt_to_equity=0.4, interest_coverage=60.0, cashflow_volatility=0.25, earnings_stability=0.75,
                pe_ratio=55.0, ev_ebitda=40.0, fcf_multiple=50.0,
                last_updated=datetime.now().isoformat()
            ),
            "META": CompanyFinancials(
                symbol="META", name="Meta Platforms Inc.", sector="Technology",
                operating_margin=0.35, net_margin=0.28, roic=0.22, fcf_margin=0.30,
                revenue_growth_3y=0.10, earnings_growth_3y=0.08, fcf_growth_3y=0.12,
                debt_to_equity=0.2, interest_coverage=80.0, cashflow_volatility=0.20, earnings_stability=0.82,
                pe_ratio=22.0, ev_ebitda=14.0, fcf_multiple=20.0,
                last_updated=datetime.now().isoformat()
            ),
            "ORCL": CompanyFinancials(
                symbol="ORCL", name="Oracle Corporation", sector="Technology",
                operating_margin=0.25, net_margin=0.18, roic=0.18, fcf_margin=0.22,
                revenue_growth_3y=0.06, earnings_growth_3y=0.08, fcf_growth_3y=0.07,
                debt_to_equity=3.0, interest_coverage=8.0, cashflow_volatility=0.18, earnings_stability=0.85,
                pe_ratio=18.0, ev_ebitda=12.0, fcf_multiple=16.0,
                last_updated=datetime.now().isoformat()
            ),
            "CRM": CompanyFinancials(
                symbol="CRM", name="Salesforce Inc.", sector="Technology",
                operating_margin=0.18, net_margin=0.12, roic=0.12, fcf_margin=0.28,
                revenue_growth_3y=0.18, earnings_growth_3y=0.25, fcf_growth_3y=0.22,
                debt_to_equity=0.3, interest_coverage=15.0, cashflow_volatility=0.22, earnings_stability=0.78,
                pe_ratio=45.0, ev_ebitda=25.0, fcf_multiple=30.0,
                last_updated=datetime.now().isoformat()
            ),
            "ADBE": CompanyFinancials(
                symbol="ADBE", name="Adobe Inc.", sector="Technology",
                operating_margin=0.35, net_margin=0.28, roic=0.30, fcf_margin=0.40,
                revenue_growth_3y=0.12, earnings_growth_3y=0.14, fcf_growth_3y=0.15,
                debt_to_equity=0.4, interest_coverage=35.0, cashflow_volatility=0.12, earnings_stability=0.92,
                pe_ratio=35.0, ev_ebitda=24.0, fcf_multiple=28.0,
                last_updated=datetime.now().isoformat()
            ),
            "INTC": CompanyFinancials(
                symbol="INTC", name="Intel Corporation", sector="Technology",
                operating_margin=0.05, net_margin=0.02, roic=0.03, fcf_margin=0.05,
                revenue_growth_3y=-0.10, earnings_growth_3y=-0.25, fcf_growth_3y=-0.20,
                debt_to_equity=0.5, interest_coverage=5.0, cashflow_volatility=0.40, earnings_stability=0.50,
                pe_ratio=80.0, ev_ebitda=15.0, fcf_multiple=60.0,
                last_updated=datetime.now().isoformat()
            ),
            "IBM": CompanyFinancials(
                symbol="IBM", name="IBM Corporation", sector="Technology",
                operating_margin=0.15, net_margin=0.10, roic=0.12, fcf_margin=0.15,
                revenue_growth_3y=0.02, earnings_growth_3y=0.04, fcf_growth_3y=0.03,
                debt_to_equity=2.5, interest_coverage=10.0, cashflow_volatility=0.15, earnings_stability=0.88,
                pe_ratio=15.0, ev_ebitda=10.0, fcf_multiple=12.0,
                last_updated=datetime.now().isoformat()
            ),
            
            # Healthcare Sektor
            "JNJ": CompanyFinancials(
                symbol="JNJ", name="Johnson & Johnson", sector="Healthcare",
                operating_margin=0.25, net_margin=0.20, roic=0.18, fcf_margin=0.22,
                revenue_growth_3y=0.05, earnings_growth_3y=0.06, fcf_growth_3y=0.04,
                debt_to_equity=0.4, interest_coverage=30.0, cashflow_volatility=0.10, earnings_stability=0.95,
                pe_ratio=16.0, ev_ebitda=12.0, fcf_multiple=18.0,
                last_updated=datetime.now().isoformat()
            ),
            "UNH": CompanyFinancials(
                symbol="UNH", name="UnitedHealth Group", sector="Healthcare",
                operating_margin=0.08, net_margin=0.06, roic=0.22, fcf_margin=0.07,
                revenue_growth_3y=0.12, earnings_growth_3y=0.14, fcf_growth_3y=0.10,
                debt_to_equity=0.7, interest_coverage=15.0, cashflow_volatility=0.12, earnings_stability=0.90,
                pe_ratio=20.0, ev_ebitda=14.0, fcf_multiple=22.0,
                last_updated=datetime.now().isoformat()
            ),
            "PFE": CompanyFinancials(
                symbol="PFE", name="Pfizer Inc.", sector="Healthcare",
                operating_margin=0.15, net_margin=0.10, roic=0.08, fcf_margin=0.12,
                revenue_growth_3y=-0.05, earnings_growth_3y=-0.10, fcf_growth_3y=-0.08,
                debt_to_equity=0.6, interest_coverage=12.0, cashflow_volatility=0.30, earnings_stability=0.65,
                pe_ratio=12.0, ev_ebitda=8.0, fcf_multiple=10.0,
                last_updated=datetime.now().isoformat()
            ),
            "LLY": CompanyFinancials(
                symbol="LLY", name="Eli Lilly and Company", sector="Healthcare",
                operating_margin=0.28, net_margin=0.22, roic=0.35, fcf_margin=0.20,
                revenue_growth_3y=0.20, earnings_growth_3y=0.30, fcf_growth_3y=0.25,
                debt_to_equity=1.2, interest_coverage=20.0, cashflow_volatility=0.18, earnings_stability=0.85,
                pe_ratio=65.0, ev_ebitda=45.0, fcf_multiple=55.0,
                last_updated=datetime.now().isoformat()
            ),
            "ABBV": CompanyFinancials(
                symbol="ABBV", name="AbbVie Inc.", sector="Healthcare",
                operating_margin=0.30, net_margin=0.18, roic=0.15, fcf_margin=0.25,
                revenue_growth_3y=0.04, earnings_growth_3y=0.02, fcf_growth_3y=0.05,
                debt_to_equity=4.0, interest_coverage=8.0, cashflow_volatility=0.20, earnings_stability=0.80,
                pe_ratio=14.0, ev_ebitda=10.0, fcf_multiple=12.0,
                last_updated=datetime.now().isoformat()
            ),
            
            # Consumer Discretionary
            "AMZN": CompanyFinancials(
                symbol="AMZN", name="Amazon.com Inc.", sector="Consumer Discretionary",
                operating_margin=0.08, net_margin=0.06, roic=0.12, fcf_margin=0.10,
                revenue_growth_3y=0.12, earnings_growth_3y=0.40, fcf_growth_3y=0.30,
                debt_to_equity=0.6, interest_coverage=15.0, cashflow_volatility=0.25, earnings_stability=0.75,
                pe_ratio=45.0, ev_ebitda=18.0, fcf_multiple=35.0,
                last_updated=datetime.now().isoformat()
            ),
            "TSLA": CompanyFinancials(
                symbol="TSLA", name="Tesla Inc.", sector="Consumer Discretionary",
                operating_margin=0.12, net_margin=0.10, roic=0.15, fcf_margin=0.08,
                revenue_growth_3y=0.30, earnings_growth_3y=0.25, fcf_growth_3y=0.20,
                debt_to_equity=0.2, interest_coverage=25.0, cashflow_volatility=0.35, earnings_stability=0.65,
                pe_ratio=70.0, ev_ebitda=35.0, fcf_multiple=60.0,
                last_updated=datetime.now().isoformat()
            ),
            "NKE": CompanyFinancials(
                symbol="NKE", name="Nike Inc.", sector="Consumer Discretionary",
                operating_margin=0.12, net_margin=0.10, roic=0.30, fcf_margin=0.12,
                revenue_growth_3y=0.05, earnings_growth_3y=0.03, fcf_growth_3y=0.04,
                debt_to_equity=0.8, interest_coverage=18.0, cashflow_volatility=0.18, earnings_stability=0.85,
                pe_ratio=28.0, ev_ebitda=18.0, fcf_multiple=25.0,
                last_updated=datetime.now().isoformat()
            ),
            "MCD": CompanyFinancials(
                symbol="MCD", name="McDonald's Corporation", sector="Consumer Discretionary",
                operating_margin=0.45, net_margin=0.32, roic=0.20, fcf_margin=0.28,
                revenue_growth_3y=0.08, earnings_growth_3y=0.10, fcf_growth_3y=0.08,
                debt_to_equity=5.0, interest_coverage=10.0, cashflow_volatility=0.12, earnings_stability=0.92,
                pe_ratio=24.0, ev_ebitda=18.0, fcf_multiple=22.0,
                last_updated=datetime.now().isoformat()
            ),
            "SBUX": CompanyFinancials(
                symbol="SBUX", name="Starbucks Corporation", sector="Consumer Discretionary",
                operating_margin=0.15, net_margin=0.10, roic=0.25, fcf_margin=0.12,
                revenue_growth_3y=0.10, earnings_growth_3y=0.08, fcf_growth_3y=0.06,
                debt_to_equity=6.0, interest_coverage=8.0, cashflow_volatility=0.15, earnings_stability=0.88,
                pe_ratio=22.0, ev_ebitda=15.0, fcf_multiple=20.0,
                last_updated=datetime.now().isoformat()
            ),
            
            # Financials
            "JPM": CompanyFinancials(
                symbol="JPM", name="JPMorgan Chase & Co.", sector="Financials",
                operating_margin=0.35, net_margin=0.30, roic=0.15, fcf_margin=0.25,
                revenue_growth_3y=0.08, earnings_growth_3y=0.12, fcf_growth_3y=0.10,
                debt_to_equity=1.2, interest_coverage=5.0, cashflow_volatility=0.20, earnings_stability=0.85,
                pe_ratio=12.0, ev_ebitda=8.0, fcf_multiple=10.0,
                last_updated=datetime.now().isoformat()
            ),
            "V": CompanyFinancials(
                symbol="V", name="Visa Inc.", sector="Financials",
                operating_margin=0.65, net_margin=0.52, roic=0.35, fcf_margin=0.55,
                revenue_growth_3y=0.10, earnings_growth_3y=0.12, fcf_growth_3y=0.14,
                debt_to_equity=0.5, interest_coverage=30.0, cashflow_volatility=0.08, earnings_stability=0.95,
                pe_ratio=28.0, ev_ebitda=22.0, fcf_multiple=26.0,
                last_updated=datetime.now().isoformat()
            ),
            "MA": CompanyFinancials(
                symbol="MA", name="Mastercard Inc.", sector="Financials",
                operating_margin=0.58, net_margin=0.45, roic=0.40, fcf_margin=0.50,
                revenue_growth_3y=0.12, earnings_growth_3y=0.14, fcf_growth_3y=0.15,
                debt_to_equity=1.5, interest_coverage=25.0, cashflow_volatility=0.10, earnings_stability=0.93,
                pe_ratio=32.0, ev_ebitda=25.0, fcf_multiple=30.0,
                last_updated=datetime.now().isoformat()
            ),
            "BAC": CompanyFinancials(
                symbol="BAC", name="Bank of America Corp.", sector="Financials",
                operating_margin=0.28, net_margin=0.25, roic=0.10, fcf_margin=0.20,
                revenue_growth_3y=0.05, earnings_growth_3y=0.08, fcf_growth_3y=0.06,
                debt_to_equity=1.0, interest_coverage=4.0, cashflow_volatility=0.25, earnings_stability=0.80,
                pe_ratio=10.0, ev_ebitda=6.0, fcf_multiple=8.0,
                last_updated=datetime.now().isoformat()
            ),
            
            # Consumer Staples
            "PG": CompanyFinancials(
                symbol="PG", name="Procter & Gamble Co.", sector="Consumer Staples",
                operating_margin=0.22, net_margin=0.18, roic=0.18, fcf_margin=0.20,
                revenue_growth_3y=0.04, earnings_growth_3y=0.06, fcf_growth_3y=0.05,
                debt_to_equity=0.6, interest_coverage=20.0, cashflow_volatility=0.08, earnings_stability=0.95,
                pe_ratio=26.0, ev_ebitda=18.0, fcf_multiple=24.0,
                last_updated=datetime.now().isoformat()
            ),
            "KO": CompanyFinancials(
                symbol="KO", name="The Coca-Cola Company", sector="Consumer Staples",
                operating_margin=0.30, net_margin=0.22, roic=0.15, fcf_margin=0.25,
                revenue_growth_3y=0.06, earnings_growth_3y=0.08, fcf_growth_3y=0.07,
                debt_to_equity=1.5, interest_coverage=12.0, cashflow_volatility=0.10, earnings_stability=0.92,
                pe_ratio=24.0, ev_ebitda=20.0, fcf_multiple=22.0,
                last_updated=datetime.now().isoformat()
            ),
            "PEP": CompanyFinancials(
                symbol="PEP", name="PepsiCo Inc.", sector="Consumer Staples",
                operating_margin=0.15, net_margin=0.12, roic=0.18, fcf_margin=0.14,
                revenue_growth_3y=0.08, earnings_growth_3y=0.06, fcf_growth_3y=0.05,
                debt_to_equity=2.0, interest_coverage=10.0, cashflow_volatility=0.12, earnings_stability=0.90,
                pe_ratio=22.0, ev_ebitda=16.0, fcf_multiple=20.0,
                last_updated=datetime.now().isoformat()
            ),
            "WMT": CompanyFinancials(
                symbol="WMT", name="Walmart Inc.", sector="Consumer Staples",
                operating_margin=0.04, net_margin=0.02, roic=0.12, fcf_margin=0.04,
                revenue_growth_3y=0.05, earnings_growth_3y=0.08, fcf_growth_3y=0.10,
                debt_to_equity=0.6, interest_coverage=12.0, cashflow_volatility=0.15, earnings_stability=0.88,
                pe_ratio=28.0, ev_ebitda=14.0, fcf_multiple=30.0,
                last_updated=datetime.now().isoformat()
            ),
            
            # Industrials
            "CAT": CompanyFinancials(
                symbol="CAT", name="Caterpillar Inc.", sector="Industrials",
                operating_margin=0.20, net_margin=0.15, roic=0.25, fcf_margin=0.18,
                revenue_growth_3y=0.12, earnings_growth_3y=0.18, fcf_growth_3y=0.15,
                debt_to_equity=1.8, interest_coverage=15.0, cashflow_volatility=0.22, earnings_stability=0.80,
                pe_ratio=16.0, ev_ebitda=12.0, fcf_multiple=14.0,
                last_updated=datetime.now().isoformat()
            ),
            "HON": CompanyFinancials(
                symbol="HON", name="Honeywell International", sector="Industrials",
                operating_margin=0.18, net_margin=0.14, roic=0.20, fcf_margin=0.16,
                revenue_growth_3y=0.05, earnings_growth_3y=0.08, fcf_growth_3y=0.06,
                debt_to_equity=1.2, interest_coverage=18.0, cashflow_volatility=0.15, earnings_stability=0.88,
                pe_ratio=22.0, ev_ebitda=16.0, fcf_multiple=20.0,
                last_updated=datetime.now().isoformat()
            ),
            "UPS": CompanyFinancials(
                symbol="UPS", name="United Parcel Service", sector="Industrials",
                operating_margin=0.10, net_margin=0.08, roic=0.30, fcf_margin=0.10,
                revenue_growth_3y=0.03, earnings_growth_3y=0.02, fcf_growth_3y=0.01,
                debt_to_equity=1.5, interest_coverage=12.0, cashflow_volatility=0.18, earnings_stability=0.82,
                pe_ratio=18.0, ev_ebitda=10.0, fcf_multiple=16.0,
                last_updated=datetime.now().isoformat()
            ),
            
            # Energy
            "XOM": CompanyFinancials(
                symbol="XOM", name="Exxon Mobil Corporation", sector="Energy",
                operating_margin=0.15, net_margin=0.12, roic=0.15, fcf_margin=0.14,
                revenue_growth_3y=0.08, earnings_growth_3y=0.10, fcf_growth_3y=0.12,
                debt_to_equity=0.2, interest_coverage=30.0, cashflow_volatility=0.35, earnings_stability=0.70,
                pe_ratio=12.0, ev_ebitda=6.0, fcf_multiple=10.0,
                last_updated=datetime.now().isoformat()
            ),
            "CVX": CompanyFinancials(
                symbol="CVX", name="Chevron Corporation", sector="Energy",
                operating_margin=0.14, net_margin=0.10, roic=0.12, fcf_margin=0.12,
                revenue_growth_3y=0.06, earnings_growth_3y=0.08, fcf_growth_3y=0.10,
                debt_to_equity=0.15, interest_coverage=35.0, cashflow_volatility=0.38, earnings_stability=0.68,
                pe_ratio=14.0, ev_ebitda=5.0, fcf_multiple=12.0,
                last_updated=datetime.now().isoformat()
            ),
        }
        return mock_data
    
    def get_company_data(self, symbol: str) -> Optional[CompanyFinancials]:
        """Lädt Daten für ein einzelnes Unternehmen."""
        return self._companies.get(symbol.upper())
    
    def get_sector_companies(self, sector: str) -> List[CompanyFinancials]:
        """Lädt alle Unternehmen eines Sektors."""
        return [c for c in self._companies.values() if c.sector == sector]
    
    def get_all_companies(self) -> List[CompanyFinancials]:
        """Lädt alle verfügbaren Unternehmen."""
        return list(self._companies.values())
    
    def get_available_symbols(self) -> List[str]:
        """Gibt alle verfügbaren Symbole zurück."""
        return list(self._companies.keys())
    
    def get_available_sectors(self) -> List[str]:
        """Gibt alle verfügbaren Sektoren zurück."""
        return list(set(c.sector for c in self._companies.values()))


class DataLoader:
    """
    Haupt-Datenloader mit austauschbarer Datenquelle.
    
    Verwendung:
        loader = DataLoader(use_mock=True)
        company = loader.get_company_data("AAPL")
        sector_companies = loader.get_sector_companies("Technology")
    """
    
    def __init__(self, use_mock: bool = True, data_source: Optional[DataSourceBase] = None):
        """
        Initialisiert den DataLoader.
        
        Args:
            use_mock: Wenn True, werden Mock-Daten verwendet
            data_source: Optionale eigene Datenquelle
        """
        if data_source:
            self._source = data_source
        elif use_mock:
            self._source = MockDataSource()
        else:
            # Hier könnte später eine echte API-Datenquelle eingebunden werden
            raise NotImplementedError("Echte Datenquellen sind noch nicht implementiert")
    
    def get_company_data(self, symbol: str) -> Optional[CompanyFinancials]:
        """Lädt Finanzdaten für ein Unternehmen."""
        return self._source.get_company_data(symbol)
    
    def get_sector_companies(self, sector: str) -> List[CompanyFinancials]:
        """Lädt alle Unternehmen eines Sektors."""
        return self._source.get_sector_companies(sector)
    
    def get_all_companies(self) -> List[CompanyFinancials]:
        """Lädt alle verfügbaren Unternehmen."""
        return self._source.get_all_companies()


# Singleton-Instanz für einfachen Zugriff
_default_loader: Optional[DataLoader] = None

def get_data_loader(use_mock: bool = True) -> DataLoader:
    """Gibt eine Singleton-Instanz des DataLoaders zurück."""
    global _default_loader
    if _default_loader is None:
        _default_loader = DataLoader(use_mock=use_mock)
    return _default_loader
