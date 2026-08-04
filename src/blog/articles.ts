import type { ComponentType } from "react";
import { MejoresAppsControlarGastosSinBanco } from "./posts/MejoresAppsControlarGastosSinBanco";

export interface BlogArticle {
  slug: string;
  title: string;
  summary: string;
  metaTitle: string;
  metaDescription: string;
  Component: ComponentType;
}

export const ARTICLES: BlogArticle[] = [
  {
    slug: "mejores-apps-controlar-gastos-sin-banco",
    title: "Las 5 mejores apps para controlar gastos sin conectar tu banco (2026)",
    summary: "Comparativa de las mejores apps de control de gastos con entrada manual, sin dar acceso a tu banco.",
    metaTitle: "Las 5 mejores apps para controlar gastos sin banco (2026)",
    metaDescription:
      "Comparativa de las mejores apps de control de gastos con entrada manual, sin dar acceso a tu banco. Monefy, Goodbudget, Money Manager y más.",
    Component: MejoresAppsControlarGastosSinBanco,
  },
];
