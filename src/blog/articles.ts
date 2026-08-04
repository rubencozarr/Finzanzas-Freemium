import type { ComponentType } from "react";
import { MejoresAppsControlarGastosSinBanco } from "./posts/MejoresAppsControlarGastosSinBanco";
import { EnQueGastasTuDinero } from "./posts/EnQueGastasTuDinero";

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
  {
    slug: "en-que-gastas-tu-dinero",
    title: "Cómo saber en qué gastas tu dinero cada mes",
    summary: "Un método práctico en 5 pasos para descubrir en qué se va tu dinero cada mes.",
    metaTitle: "Cómo saber en qué gastas tu dinero cada mes — Método en 5 pasos",
    metaDescription:
      "Un método práctico paso a paso para descubrir en qué se va tu dinero cada mes. Sin hojas de cálculo, sin conectar tu banco. Empieza hoy.",
    Component: EnQueGastasTuDinero,
  },
];
