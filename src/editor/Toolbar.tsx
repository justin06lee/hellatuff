import type { ToolbarAction } from "../types";

interface ToolbarProps {
  actions: ToolbarAction[];
  onAction: (action: ToolbarAction) => void;
  trailing?: React.ReactNode;
}

export function Toolbar({ actions, onAction, trailing }: ToolbarProps) {
  return (
    <div className="hlt-toolbar">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="hlt-toolbar-button"
          onClick={() => onAction(action)}
        >
          {action.label}
        </button>
      ))}
      {trailing ? <span className="hlt-toolbar-trailing">{trailing}</span> : null}
    </div>
  );
}
