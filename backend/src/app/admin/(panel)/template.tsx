// Remounts on every move between admin sections, so each page fades in.
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
