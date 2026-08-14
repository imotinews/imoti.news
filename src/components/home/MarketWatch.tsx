"use client";

import { useState } from "react";
import Container from "@/components/layout/Container";

// Placeholder numbers only -- there is no real data source wired up yet.
// The plan (per project owner) is a manual weekly screenshot -> AI analysis
// pipeline feeding this section; until that exists, treat everything here
// as illustrative, not factual, and do not present it to real visitors as
// verified market data.

type CityData = {
  pricePerM2: number;
  changePct: number;
  months: { label: string; value: number }[];
};

const CITY_DATA: Record<string, CityData> = {
  София: {
    pricePerM2: 1643,
    changePct: 8.2,
    months: [
      { label: "НОЕ", value: 30 },
      { label: "ДЕК", value: 45 },
      { label: "ЯН", value: 38 },
      { label: "ФЕВ", value: 52 },
      { label: "МАР", value: 48 },
      { label: "АПР", value: 60 },
      { label: "МАЙ", value: 66 },
    ],
  },
  Пловдив: {
    pricePerM2: 1180,
    changePct: 5.4,
    months: [
      { label: "НОЕ", value: 34 },
      { label: "ДЕК", value: 36 },
      { label: "ЯН", value: 40 },
      { label: "ФЕВ", value: 39 },
      { label: "МАР", value: 44 },
      { label: "АПР", value: 47 },
      { label: "МАЙ", value: 50 },
    ],
  },
  Варна: {
    pricePerM2: 1420,
    changePct: 3.1,
    months: [
      { label: "НОЕ", value: 40 },
      { label: "ДЕК", value: 42 },
      { label: "ЯН", value: 41 },
      { label: "ФЕВ", value: 44 },
      { label: "МАР", value: 43 },
      { label: "АПР", value: 46 },
      { label: "МАЙ", value: 48 },
    ],
  },
  Бургас: {
    pricePerM2: 1250,
    changePct: -1.2,
    months: [
      { label: "НОЕ", value: 46 },
      { label: "ДЕК", value: 44 },
      { label: "ЯН", value: 45 },
      { label: "ФЕВ", value: 42 },
      { label: "МАР", value: 43 },
      { label: "АПР", value: 41 },
      { label: "МАЙ", value: 40 },
    ],
  },
};

const STAT_TILES = [
  { label: "Жилищни цени (€/m²)", value: "1,643", changePct: 8.2 },
  { label: "Ипотечни кредити (млрд. €)", value: "7.27", changePct: 5.6 },
  { label: "Сделки (брой)", value: "18,742", changePct: -3.1 },
  { label: "Ново строителство (брой)", value: "5,102", changePct: 11.4 },
  { label: "Отдавани под наем (€/m²)", value: "7.8", changePct: 4.7 },
];

function ChangeBadge({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span className={`text-xs font-semibold ${positive ? "text-primary" : "text-red-600"}`}>
      {positive ? "+" : ""}
      {pct.toFixed(1)}% {positive ? "▲" : "▼"}
    </span>
  );
}

function Sparkline({ months }: { months: CityData["months"] }) {
  const values = months.map((m) => m.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 280;
  const height = 60;

  const points = months
    .map((m, i) => {
      const x = (i / (months.length - 1)) * width;
      const y = height - ((m.value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full">
      <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
      {months.map((m, i) => {
        const x = (i / (months.length - 1)) * width;
        const y = height - ((m.value - min) / range) * height;
        return <circle key={m.label} cx={x} cy={y} r="2.5" fill="var(--color-primary)" />;
      })}
    </svg>
  );
}

export default function MarketWatch() {
  const cities = Object.keys(CITY_DATA);
  const [activeCity, setActiveCity] = useState(cities[0]);
  const data = CITY_DATA[activeCity];

  return (
    <section className="border-y border-border py-8">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m3 17 6-6 4 4 8-8M15 7h6v6" />
              </svg>
              Market Watch
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
              {STAT_TILES.map((tile) => (
                <div key={tile.label} className="border-l border-border pl-3 first:border-l-0 first:pl-0">
                  <p className="text-xs text-muted-foreground">{tile.label}</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{tile.value}</p>
                  <ChangeBadge pct={tile.changePct} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex gap-4">
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setActiveCity(city)}
                    className={`text-xs font-semibold uppercase tracking-wide transition-colors ${
                      city === activeCity ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-end gap-6">
              <div className="flex-1">
                <Sparkline months={data.months} />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  {data.months.map((m) => (
                    <span key={m.label}>{m.label}</span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold text-foreground">{data.pricePerM2.toLocaleString("bg-BG")} €/m²</p>
                <ChangeBadge pct={data.changePct} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
