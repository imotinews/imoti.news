const SOURCE_LABELS: Record<string, string> = {
  imot_bg: "Imot.bg",
  imoti_net: "Imoti.net",
  alo_bg: "Alo.bg",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}
