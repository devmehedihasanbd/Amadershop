interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  id?: string;
}

/** Consistent eyebrow + title + subtitle pattern for page sections. */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  id,
}: SectionHeaderProps) {
  const alignCls = align === "center" ? "text-center" : "text-left";
  return (
    <div className={alignCls}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-green-700">
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className="mt-1.5 text-2xl font-extrabold tracking-tight text-stone-900 md:text-3xl"
      >
        {title}
      </h2>
      {subtitle && <p className="mt-1.5 text-stone-500">{subtitle}</p>}
    </div>
  );
}
