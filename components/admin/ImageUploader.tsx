"use client";

import { useRef, useState } from "react";
import { labelClass } from "./ui";

/**
 * Shrink a photo in the browser so uploads stay small:
 * max 1200px on the long edge, JPEG quality 0.72.
 * Returns a data-URL ready to store.
 */
export async function compressImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("read"));
      el.src = objectUrl;
    });
    const maxDim = 1200;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    // Flatten transparency onto white so JPEG has no black background.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ImageUploader({
  images,
  onChange,
  max = 3,
  label = `Photos (up to ${3})`,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setImgError(null);
    const remaining = max - images.length;
    if (remaining <= 0) {
      setImgError(`At most ${max} photo${max === 1 ? "" : "s"}.`);
      return;
    }
    const picked = Array.from(fileList).slice(0, remaining);
    setBusy(true);
    try {
      const compressed: string[] = [];
      for (const f of picked) {
        if (!f.type.startsWith("image/")) {
          throw new Error("Only image files can be uploaded.");
        }
        if (f.size > 12 * 1024 * 1024) {
          throw new Error(`"${f.name}" is larger than 12 MB.`);
        }
        compressed.push(await compressImage(f));
      }
      onChange([...images, ...compressed]);
    } catch {
      setImgError("Could not read that photo. Please try a JPG or PNG image.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  }

  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={`${i}-${src.slice(0, 24)}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Photo ${i + 1}`}
              className="h-24 w-24 rounded-xl border border-stone-200 object-cover"
            />
            {i === 0 && max > 1 && (
              <span className="absolute left-1 top-1 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Main
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/85 text-sm font-bold text-white shadow hover:bg-red-600"
            >
              ×
            </button>
            {max > 1 && (
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move photo left"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-stone-700 shadow disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move photo right"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-stone-700 shadow disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 transition hover:border-green-500 hover:text-green-700 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="px-1 text-center text-[11px] font-semibold leading-tight">
              {busy ? "Compressing…" : images.length === 0 ? "Add photo" : "Add more"}
            </span>
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {imgError && <p className="mt-1.5 text-sm text-red-600">{imgError}</p>}
      <p className="mt-1.5 text-xs text-stone-400">
        Photos are compressed automatically before upload.
      </p>
    </div>
  );
}
