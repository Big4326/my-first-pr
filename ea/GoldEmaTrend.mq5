//+------------------------------------------------------------------+
//|                                                 GoldEmaTrend.mq5 |
//|  EA ตัวอย่างสำหรับ XAUUSD (MT5)                                    |
//|  กลยุทธ์: EMA เร็วตัด EMA ช้า + กรองเทรนด์ด้วย EMA 200             |
//|  SL/TP ตาม ATR, คำนวณ lot ตาม % ความเสี่ยง, จำกัดขาดทุนรายวัน       |
//|  *** ทดสอบใน Strategy Tester / บัญชี Demo ก่อนใช้เงินจริงเสมอ ***   |
//+------------------------------------------------------------------+
#property version   "1.00"
#property description "Gold EMA trend EA with ATR stops and risk-based lot sizing"

#include <Trade/Trade.mqh>

//--- ตั้งค่ากลยุทธ์
input group "=== กลยุทธ์ ==="
input ENUM_TIMEFRAMES InpTimeframe   = PERIOD_M15; // ไทม์เฟรม
input int             InpFastEMA     = 9;          // EMA เร็ว
input int             InpSlowEMA     = 21;         // EMA ช้า
input int             InpTrendEMA    = 200;        // EMA กรองเทรนด์

//--- ตั้งค่าความเสี่ยง
input group "=== ความเสี่ยง ==="
input double InpRiskPercent     = 1.0;   // เสี่ยงต่อไม้ (% ของ balance)
input double InpFixedLot        = 0.0;   // lot คงที่ (>0 = ใช้ค่านี้แทนการคำนวณ)
input bool   InpAllowMinLot     = false; // ถ้า lot ที่คำนวณได้ต่ำกว่าขั้นต่ำ ให้ใช้ lot ขั้นต่ำแทน
input int    InpATRPeriod       = 14;    // ATR period
input double InpSL_ATR          = 1.5;   // SL = ATR x ค่านี้
input double InpRR              = 2.0;   // TP = SL x ค่านี้ (Risk:Reward)
input double InpMaxDailyLossPct = 5.0;   // ขาดทุนสูงสุดต่อวัน (%) แล้วหยุดเทรด
input int    InpMaxTradesPerDay = 3;     // จำนวนไม้สูงสุดต่อวัน

//--- ตัวกรอง
input group "=== ตัวกรอง ==="
input int    InpStartHour    = 7;    // เริ่มเทรด (เวลาเซิร์ฟเวอร์, Exness = GMT+0 -> 14:00 ไทย)
input int    InpEndHour      = 16;   // หยุดเปิดไม้ใหม่ (เวลาเซิร์ฟเวอร์ -> 23:00 ไทย)
input double InpMaxSpreadUSD = 0.50; // spread สูงสุดที่ยอมรับ (หน่วยราคา เช่น $0.50)

//--- อื่นๆ
input group "=== อื่นๆ ==="
input bool   InpUseTrailing = true;     // ใช้ Trailing Stop
input double InpTrailATR    = 1.0;      // ระยะ trailing = ATR x ค่านี้
input ulong  InpMagic       = 20261119; // Magic number

//--- ตัวแปรภายใน
CTrade   trade;
int      hFast = INVALID_HANDLE, hSlow = INVALID_HANDLE;
int      hTrend = INVALID_HANDLE, hATR = INVALID_HANDLE;
datetime lastBarTime = 0;

//+------------------------------------------------------------------+
int OnInit()
{
   hFast  = iMA(_Symbol, InpTimeframe, InpFastEMA,  0, MODE_EMA, PRICE_CLOSE);
   hSlow  = iMA(_Symbol, InpTimeframe, InpSlowEMA,  0, MODE_EMA, PRICE_CLOSE);
   hTrend = iMA(_Symbol, InpTimeframe, InpTrendEMA, 0, MODE_EMA, PRICE_CLOSE);
   hATR   = iATR(_Symbol, InpTimeframe, InpATRPeriod);

   if(hFast == INVALID_HANDLE || hSlow == INVALID_HANDLE ||
      hTrend == INVALID_HANDLE || hATR == INVALID_HANDLE)
   {
      Print("สร้าง indicator ไม่สำเร็จ");
      return INIT_FAILED;
   }

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(30);
   trade.SetTypeFillingBySymbol(_Symbol);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   IndicatorRelease(hFast);
   IndicatorRelease(hSlow);
   IndicatorRelease(hTrend);
   IndicatorRelease(hATR);
}

//+------------------------------------------------------------------+
void OnTick()
{
   if(InpUseTrailing)
      ManageTrailing();

   //--- ทำงานครั้งเดียวต่อแท่งใหม่
   datetime barTime = iTime(_Symbol, InpTimeframe, 0);
   if(barTime == lastBarTime)
      return;
   lastBarTime = barTime;

   if(HasOpenPosition()) return;
   if(!InSession())      return;
   if(!SpreadOK())       return;
   if(DailyLimitHit())   return;

   double fast[], slow[], trend[], atr[];
   if(!GetBuf(hFast, 3, fast) || !GetBuf(hSlow, 3, slow) ||
      !GetBuf(hTrend, 3, trend) || !GetBuf(hATR, 3, atr))
      return;

   double close1 = iClose(_Symbol, InpTimeframe, 1);

   //--- ใช้แท่งที่ปิดแล้ว (index 1 และ 2) เพื่อไม่ให้สัญญาณกระพริบ
   bool crossUp   = fast[2] <= slow[2] && fast[1] > slow[1];
   bool crossDown = fast[2] >= slow[2] && fast[1] < slow[1];
   double slDist  = atr[1] * InpSL_ATR;

   if(crossUp && close1 > trend[1])
      OpenTrade(ORDER_TYPE_BUY, slDist);
   else if(crossDown && close1 < trend[1])
      OpenTrade(ORDER_TYPE_SELL, slDist);
}

//+------------------------------------------------------------------+
bool GetBuf(const int handle, const int count, double &buf[])
{
   ArraySetAsSeries(buf, true);
   return CopyBuffer(handle, 0, 0, count, buf) == count;
}

//+------------------------------------------------------------------+
//| คำนวณ lot จากเงินที่ยอมเสียต่อไม้                                 |
//+------------------------------------------------------------------+
double CalcLot(const double slDist)
{
   if(InpFixedLot > 0)
      return NormalizeLot(InpFixedLot);

   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE_LOSS);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickValue <= 0 || tickSize <= 0 || slDist <= 0)
      return 0;

   double riskMoney  = AccountInfoDouble(ACCOUNT_BALANCE) * InpRiskPercent / 100.0;
   double lossPerLot = slDist / tickSize * tickValue; // เสียเท่าไหร่ถ้า 1 lot โดน SL
   return NormalizeLot(riskMoney / lossPerLot);
}

//+------------------------------------------------------------------+
double NormalizeLot(double lot)
{
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   double minL = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxL = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);

   lot = MathFloor(lot / step) * step;
   if(lot < minL)
   {
      if(!InpAllowMinLot)
         return 0; // ทุนน้อยเกินไปสำหรับความเสี่ยงที่ตั้งไว้ -> ไม่เข้า
      lot = minL;
   }
   return MathMin(lot, maxL);
}

//+------------------------------------------------------------------+
void OpenTrade(const ENUM_ORDER_TYPE type, const double slDist)
{
   double lot = CalcLot(slDist);
   if(lot <= 0)
   {
      Print("lot ที่คำนวณได้ต่ำกว่าขั้นต่ำ: ทุนน้อยเกินไปสำหรับ ",
            InpRiskPercent, "% risk กับ SL ระยะ ", DoubleToString(slDist, 2),
            " -> ข้ามสัญญาณนี้");
      return;
   }

   int    digits    = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   double minStop   = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL) * _Point;
   if(slDist <= minStop)
      return;

   bool   isBuy = (type == ORDER_TYPE_BUY);
   double price = isBuy ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                        : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl    = isBuy ? price - slDist : price + slDist;
   double tp    = isBuy ? price + slDist * InpRR : price - slDist * InpRR;

   sl = NormalizeDouble(sl, digits);
   tp = NormalizeDouble(tp, digits);

   bool ok = isBuy ? trade.Buy(lot, _Symbol, price, sl, tp, "GoldEmaTrend")
                   : trade.Sell(lot, _Symbol, price, sl, tp, "GoldEmaTrend");
   if(!ok)
      Print("เปิดออเดอร์ไม่สำเร็จ: ", trade.ResultRetcodeDescription());
}

//+------------------------------------------------------------------+
bool HasOpenPosition()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) == _Symbol &&
         (ulong)PositionGetInteger(POSITION_MAGIC) == InpMagic)
         return true;
   }
   return false;
}

//+------------------------------------------------------------------+
bool InSession()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   if(InpStartHour < InpEndHour)
      return dt.hour >= InpStartHour && dt.hour < InpEndHour;
   return dt.hour >= InpStartHour || dt.hour < InpEndHour; // ช่วงข้ามเที่ยงคืน
}

//+------------------------------------------------------------------+
bool SpreadOK()
{
   double spread = SymbolInfoDouble(_Symbol, SYMBOL_ASK) - SymbolInfoDouble(_Symbol, SYMBOL_BID);
   return spread <= InpMaxSpreadUSD;
}

//+------------------------------------------------------------------+
//| เช็คขาดทุนรายวัน และจำนวนไม้ต่อวัน                                 |
//+------------------------------------------------------------------+
bool DailyLimitHit()
{
   datetime dayStart = iTime(_Symbol, PERIOD_D1, 0);
   if(!HistorySelect(dayStart, TimeCurrent() + 60))
      return false;

   double pnl    = 0;
   int    trades = 0;
   for(int i = HistoryDealsTotal() - 1; i >= 0; i--)
   {
      ulong deal = HistoryDealGetTicket(i);
      if(deal == 0) continue;
      if(HistoryDealGetString(deal, DEAL_SYMBOL) != _Symbol) continue;
      if((ulong)HistoryDealGetInteger(deal, DEAL_MAGIC) != InpMagic) continue;

      if(HistoryDealGetInteger(deal, DEAL_ENTRY) == DEAL_ENTRY_IN)
         trades++;

      pnl += HistoryDealGetDouble(deal, DEAL_PROFIT)
           + HistoryDealGetDouble(deal, DEAL_SWAP)
           + HistoryDealGetDouble(deal, DEAL_COMMISSION);
   }

   if(trades >= InpMaxTradesPerDay)
      return true;

   double startBalance = AccountInfoDouble(ACCOUNT_BALANCE) - pnl;
   if(pnl < 0 && startBalance > 0 && -pnl >= startBalance * InpMaxDailyLossPct / 100.0)
      return true;

   return false;
}

//+------------------------------------------------------------------+
//| Trailing Stop ตาม ATR (ขยับ SL ไปทางกำไรเท่านั้น)                 |
//+------------------------------------------------------------------+
void ManageTrailing()
{
   double atr[];
   if(!GetBuf(hATR, 2, atr))
      return;

   double trail  = atr[1] * InpTrailATR;
   int    digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if((ulong)PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;

      double open = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl   = PositionGetDouble(POSITION_SL);
      double tp   = PositionGetDouble(POSITION_TP);

      if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY)
      {
         double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
         if(bid - open > trail)
         {
            double newSL = NormalizeDouble(bid - trail, digits);
            if(newSL > sl + _Point)
               trade.PositionModify(ticket, newSL, tp);
         }
      }
      else
      {
         double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         if(open - ask > trail)
         {
            double newSL = NormalizeDouble(ask + trail, digits);
            if(sl == 0 || newSL < sl - _Point)
               trade.PositionModify(ticket, newSL, tp);
         }
      }
   }
}
//+------------------------------------------------------------------+
