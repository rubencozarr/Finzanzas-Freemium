import { useState } from "react";
import { GroupHeader } from "./GroupHeader";
import { FundUsageCard } from "./FundUsageCard";
import type { FundUsage } from "../lib/calculations";

export function FundUsageGroup({ total, funds }: { total: number; funds: FundUsage[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-5">
      <GroupHeader title="Uso de ahorro" total={total} tone="ahorro" expanded={expanded} onToggle={() => setExpanded((e) => !e)} />
      {expanded &&
        (funds.length === 0 ? (
          <p className="text-stone-400 text-xs mb-2">Ningún gasto pagado con fondos este mes.</p>
        ) : (
          funds.map((f) => <FundUsageCard key={f.id} f={f} />)
        ))}
    </div>
  );
}
