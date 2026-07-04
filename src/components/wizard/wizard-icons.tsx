import {
  Gem,
  Shirt,
  Sparkles,
  Cpu,
  Sofa,
  UtensilsCrossed,
  ChefHat,
  Scissors,
  Dumbbell,
  Stethoscope,
  Building2,
  Car,
  Smartphone,
  PartyPopper,
  Clapperboard,
  MonitorPlay,
  SquarePlay,
  Camera,
  type LucideIcon,
} from "lucide-react";

// Maps the lucide icon names carried by the domain data (ad categories,
// platform presets) to actual components. A couple of platform ids point at
// brand icons this lucide-react version no longer ships, so we substitute
// the closest visual match instead of touching the read-only domain data.
const ICON_MAP: Record<string, LucideIcon> = {
  gem: Gem,
  shirt: Shirt,
  sparkles: Sparkles,
  cpu: Cpu,
  sofa: Sofa,
  "utensils-crossed": UtensilsCrossed,
  "chef-hat": ChefHat,
  scissors: Scissors,
  dumbbell: Dumbbell,
  stethoscope: Stethoscope,
  "building-2": Building2,
  car: Car,
  smartphone: Smartphone,
  "party-popper": PartyPopper,
  clapperboard: Clapperboard,
  "monitor-play": MonitorPlay,
  youtube: SquarePlay,
  instagram: Camera,
};

export function getDomainIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Sparkles;
}
