export function Toolbar({ children }) {
  return <section className="toolbar">{children}</section>;
}

export function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}
