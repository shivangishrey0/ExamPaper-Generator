import React, { createContext, useCallback, useContext, useRef, useState } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { message, title, danger, confirmLabel }
  const resolverRef = useRef(null);

  // confirmDialog("Delete this exam?", { title, danger: true, confirmLabel: "Delete" })
  const confirmDialog = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ message, ...options });
    });
  }, []);

  const handle = (result) => {
    resolverRef.current?.(result);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
          onClick={() => handle(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {dialog.title && <h3 className="text-lg font-bold text-stone-900 mb-2">{dialog.title}</h3>}
            <p className="text-stone-600 text-sm mb-6 whitespace-pre-line">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handle(false)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handle(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
                  dialog.danger ? "bg-red-600 hover:bg-red-700" : "bg-stone-900 hover:bg-stone-800"
                }`}
              >
                {dialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// Returns confirmDialog(message, options) => Promise<boolean>
// eslint-disable-next-line react-refresh/only-export-components -- context + hook live together intentionally
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
