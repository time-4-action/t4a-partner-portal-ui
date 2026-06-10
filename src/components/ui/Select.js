"use client";

/**
 * Select — the portal's custom dropdown (shared).
 *
 * A fully-styled combobox that replaces the native <select> everywhere (first built for the
 * Shopify integration page, now shared). Accepts plain <option> children like a native select
 * and renders its own button + portaled listbox: keyboard navigation (arrows/home/end/enter/
 * escape), outside-click close, scroll/resize tracking, cyan focus ring, check on the selected
 * row. onChange receives `{ target: { value } }` so existing native-select handlers work as-is.
 */

import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ChevronDownIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function Select({ value, onChange, ariaLabel, disabled, children }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // keyboard-highlighted index
  const [rect, setRect] = useState(null); // button viewport rect → fixed-positioned menu
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  // Flatten <option> children into plain descriptors so we can render our own rows.
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((el) => ({
      value: el.props.value ?? "",
      label: typeof el.props.children === "string" ? el.props.children : String(el.props.children ?? ""),
      disabled: !!el.props.disabled,
    }));

  const selected = options.find((o) => String(o.value) === String(value ?? ""));
  const isPlaceholder = !selected || selected.value === "";

  // While open: close on outside click (the menu is portaled to <body>, so check both refs),
  // and keep the menu pinned to the button as the page scrolls or resizes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const inRoot = rootRef.current?.contains(e.target);
      const inList = listRef.current?.contains(e.target);
      if (!inRoot && !inList) setOpen(false);
    };
    const sync = () => {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [open]);

  // Open the menu, highlighting the current selection (or the first selectable row).
  const openMenu = () => {
    const cur = options.findIndex((o) => String(o.value) === String(value ?? ""));
    setActive(cur >= 0 ? cur : options.findIndex((o) => !o.disabled));
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(true);
  };

  const commit = (opt) => {
    if (opt.disabled) return;
    onChange?.({ target: { value: opt.value } });
    setOpen(false);
  };

  const step = (dir) => {
    setActive((cur) => {
      let i = cur;
      for (let n = 0; n < options.length; n++) {
        i = (i + dir + options.length) % options.length;
        if (!options[i].disabled) return i;
      }
      return cur;
    });
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        step(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        step(-1);
        break;
      case "Home":
        e.preventDefault();
        setActive(options.findIndex((o) => !o.disabled));
        break;
      case "End":
        e.preventDefault();
        setActive(options.map((o) => !o.disabled).lastIndexOf(true));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (options[active]) commit(options[active]);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-neutral-900/60 px-4 py-3.5 text-left text-sm backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? "border-[#01a0be]/60 ring-1 ring-[#01a0be]/20" : "border-neutral-700 hover:border-neutral-600"
        }`}
      >
        <span className={`truncate ${isPlaceholder ? "text-neutral-500" : "text-white"}`}>
          {selected ? selected.label : options[0]?.label ?? ""}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${open ? "rotate-180 text-[#01a0be]" : ""}`}
        />
      </button>

      {open && rect && typeof document !== "undefined" && createPortal(
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "fixed",
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
          }}
          className="animate-dropdown z-[999] max-h-64 overflow-auto rounded-xl border border-neutral-700 bg-neutral-900/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {options.map((o, i) => {
            const isSel = String(o.value) === String(value ?? "");
            const isActive = i === active;
            return (
              <li
                key={`${o.value}-${i}`}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.disabled || undefined}
                onClick={() => commit(o)}
                onMouseEnter={() => !o.disabled && setActive(i)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  o.disabled
                    ? "cursor-default text-neutral-600"
                    : isActive
                      ? "bg-[#01a0be]/15 text-white"
                      : "text-neutral-300"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {isSel && !o.disabled && <CheckIcon className="h-4 w-4 shrink-0 text-[#01a0be]" />}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}
