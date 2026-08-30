import React, { useState } from "react";

// `visible`/`onToggleVisible` let a parent share one show/hide toggle across
// multiple fields (e.g. password + confirm password); otherwise it manages
// its own state.
export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  showToggle = true,
  visible,
  onToggleVisible,
  inputClassName = "",
  ...props
}) {
  const [internalVisible, setInternalVisible] = useState(false);
  const isControlled = visible !== undefined;
  const show = isControlled ? visible : internalVisible;
  const toggle = () => (isControlled ? onToggleVisible?.(!visible) : setInternalVisible((v) => !v));

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm outline-none transition-all ${showToggle ? "pr-11" : ""} ${inputClassName}`}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <i className={`ti ${show ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 17 }} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

