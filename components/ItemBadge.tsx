import Image from "next/image";
import type { MenuItem } from "@/lib/menu";

// Menu picture with a quantity tag in the corner.
export default function ItemBadge({
  item,
  count,
  size,
  highlight = false,
  note,
}: {
  item: MenuItem;
  count: number;
  size: number;
  highlight?: boolean;
  note?: string;
}) {
  return (
    <div className="item-badge" style={{ width: size }}>
      <div
        className={highlight ? "item-badge-img outlined" : "item-badge-img"}
        style={{ width: size, height: size }}
      >
        <Image src={item.image} alt={item.name} width={size} height={size} />
        <span className="qty-tag">{count}</span>
      </div>
      {note && <span className="item-badge-note">{note}</span>}
    </div>
  );
}
