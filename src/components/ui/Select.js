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
        className={`flex w-full items-center justify-between gap-3 rounded-md border bg-transparent dark:bg-input/30 dark:hover:bg-input/50 px-3 h-9 text-left text-sm shadow-xs transition-[color,box-shadow,background-color] outline-none disabled:pointer-events-none disabled:opacity-50 ${
 open ? "border-ring ring-[3px] ring-ring/50" : "border-input"
 }`}
      >
        <span className={`truncate ${isPlaceholder ? "text-muted-foreground" : "text-foreground"}`}>
          {selected ? selected.label : options[0]?.label ?? ""}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
          className="animate-dropdown z-[999] max-h-64 overflow-auto rounded-md border border-border bg-popover text-popover-foreground p-1 shadow-md"
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
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${
 o.disabled
 ? "cursor-default text-muted-foreground/70"
 : isActive
 ? "bg-accent text-accent-foreground"
 :"text-foreground"
 }`}
              >
                <span className="truncate">{o.label}</span>
                {isSel && !o.disabled && <CheckIcon className="h-4 w-4 shrink-0 text-accent-brand" />}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}
