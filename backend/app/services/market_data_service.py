from decimal import Decimal
from typing import Optional


async def get_latest_quote(ticker: str) -> Optional[Decimal]:
    """
    Stub: sem provedor de cotações em tempo real integrado ainda.
    Quando ligares a um provedor (ex. Finnhub, Alpha Vantage), implementa
    aqui a chamada HTTP e devolve o preço mais recente. Nenhum outro
    ficheiro precisa de mudar — o valor de mercado continua a ser
    calculado como shares_quantity * average_price até esta função
    deixar de devolver None.
    """
    return None
