import { navigate } from "./router.js";

// An anchor that navigates client-side but still behaves like a real link
// (right-click, open-in-new-tab and modified clicks all keep working).
export function Link({ to, children, className, style }) {
  const onClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={onClick} className={className} style={style}>
      {children}
    </a>
  );
}
