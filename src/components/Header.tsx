import { Link, NavLink } from "react-router-dom";

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-3 py-2 rounded-md text-sm font-medium",
          isActive
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        ].join(" ")
      }
      end
    >
      {children}
    </NavLink>
  );
}

export default function Header() {
  return (
    <div className="flex items-center justify-between h-14">
      <Link to="/" className="text-lg font-semibold">
        GloWell
      </Link>

      <nav className="flex items-center gap-1">
        <NavItem to="/">Home</NavItem>
        <NavItem to="/health-form">Health Form</NavItem>
        <NavItem to="/health-plan">Health Plan</NavItem>
        {/* ✅ New: quick access to saved plans */}
        <NavItem to="/plans">Plans</NavItem>
        <NavItem to="/dashboard">Dashboard</NavItem>
        <NavItem to="/settings">Settings</NavItem>
      </nav>
    </div>
  );
}
