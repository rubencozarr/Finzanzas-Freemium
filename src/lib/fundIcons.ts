import {
  Baby,
  Briefcase,
  Car,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Music,
  PartyPopper,
  PawPrint,
  PiggyBank,
  Plane,
  Smartphone,
  Star,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { DEFAULT_FUND_ICON } from "./constants";

export const FUND_ICON_COMPONENTS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  "piggy-bank": PiggyBank,
  plane: Plane,
  car: Car,
  house: House,
  gift: Gift,
  heart: Heart,
  "graduation-cap": GraduationCap,
  baby: Baby,
  wrench: Wrench,
  smartphone: Smartphone,
  star: Star,
  briefcase: Briefcase,
  music: Music,
  "heart-pulse": HeartPulse,
  "paw-print": PawPrint,
  "party-popper": PartyPopper,
};

/** Componente de icono para un fondo. Si `icon` es null/no reconocido, usa el icono por defecto. */
export function fundIconComponent(icon: string | null | undefined) {
  return FUND_ICON_COMPONENTS[icon ?? ""] ?? FUND_ICON_COMPONENTS[DEFAULT_FUND_ICON];
}
