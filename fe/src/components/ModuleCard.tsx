import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  badge?: string;
}

export function ModuleCard({ title, description, icon, href, badge }: ModuleCardProps) {
  return (
    <Link
      to={href}
      className="group glass-card p-8 flex flex-col gap-6 transition-all duration-300 hover:border-primary/50 hover:scale-[1.02] glow-effect"
    >
      <div className="flex items-start justify-between">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        {badge && (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
            {badge}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-primary text-sm font-medium mt-auto">
        <span>Get Started</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
