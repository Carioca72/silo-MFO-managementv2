export interface Asset {
  id: string;
  ticker: string;
  name: string;
  class: string;
  value: number;
  pct: number;
  price?: number;
  ret12m?: number;
  vol12m?: number;
}
