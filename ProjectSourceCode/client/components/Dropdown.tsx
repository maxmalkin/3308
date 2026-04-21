"use client";

import { useEffect, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
  hint?: string;
};

type SingleProps = {
  label: string;
  options: DropdownOption[];
  multi?: false;
  value: string;
  onChange: (next: string) => void;
};

type MultiProps = {
  label: string;
  options: DropdownOption[];
  multi: true;
  value: string[];
  onChange: (next: string[]) => void;
  emptyLabel?: string;
};

export default function Dropdown(props: SingleProps | MultiProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const triggerLabel = props.multi
    ? props.value.length === 0
      ? (props.emptyLabel ?? "All")
      : props.value.length === 1
        ? (props.options.find((o) => o.value === props.value[0])?.label ??
          props.value[0])
        : `${props.value.length} selected`
    : (props.options.find((o) => o.value === props.value)?.label ??
      props.value);

  function isSelected(v: string) {
    return props.multi ? props.value.includes(v) : props.value === v;
  }

  function pick(v: string) {
    if (props.multi) {
      const set = new Set(props.value);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      props.onChange(Array.from(set));
    } else {
      props.onChange(v);
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative inline-flex items-center gap-2">
      <span className="eyebrow">{props.label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="relative inline-flex items-center rounded-xl border border-line bg-oat py-2.5 pl-4 pr-10 text-left text-[13px] text-ink-2 transition hover:border-ink hover:text-ink focus:border-ink focus:outline-none"
      >
        <span className="truncate">{triggerLabel}</span>
        {props.multi && props.value.length > 1 && (
          <span className="ml-2 rounded-full bg-ink px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-paper">
            {props.value.length}
          </span>
        )}
        <svg
          role="img"
          aria-label="Toggle"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 opacity-60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <title>Toggle</title>
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable={props.multi || undefined}
          className="absolute left-0 top-[110%] z-50 mt-1 max-h-80 min-w-full overflow-y-auto rounded-xl border border-line bg-cream py-1 shadow-[0_20px_40px_-18px_rgba(36,35,31,0.3)]"
          style={{ minWidth: "12rem" }}
        >
          {props.multi && (
            <div className="flex justify-between border-b border-line-soft px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <button
                type="button"
                onClick={() => props.onChange([])}
                className="transition hover:text-ink"
                disabled={props.value.length === 0}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="transition hover:text-ink"
              >
                Done
              </button>
            </div>
          )}
          <ul>
            {props.options.map((o) => {
              const selected = isSelected(o.value);
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pick(o.value)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] transition hover:bg-oat ${
                      selected ? "text-ink" : "text-ink-2"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                        selected
                          ? "border-(--accent) bg-(--accent) text-paper"
                          : "border-line bg-cream"
                      }`}
                    >
                      {selected && (
                        <svg
                          role="img"
                          aria-label="Selected"
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <title>Selected</title>
                          <path d="M2 5l2 2 4-4" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 truncate">{o.label}</span>
                    {o.hint && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                        {o.hint}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
