import type { ComponentType } from "react";
import { MejoresAppsControlarGastosSinBanco } from "./posts/MejoresAppsControlarGastosSinBanco";
import { EnQueGastasTuDinero } from "./posts/EnQueGastasTuDinero";
import { Regla503020 } from "./posts/Regla503020";

export interface BlogArticle {
  slug: string;
  title: string;
  summary: string;
  metaTitle: string;
  metaDescription: string;
  Component: ComponentType;
}

// Ordenados del más reciente al más antiguo: el índice del blog lista este array tal cual, sin
// reordenar por fecha aparte, así que un artículo nuevo va siempre primero en esta lista.
export const ARTICLES: BlogArticle[] = [
  {
    slug: "regla-50-30-20",
    title: "La regla del 50-30-20: cómo aplicarla de verdad",
    summary: "La regla 50-30-20 explicada con un método práctico para aplicarla de verdad, no solo en teoría.",
    metaTitle: "Regla 50-30-20: cómo aplicarla de verdad a tus finanzas",
    metaDescription:
      "La regla del 50-30-20 explicada con un método práctico para aplicarla mes a mes. Sin hojas de cálculo, sin complicaciones. Con ejemplos reales.",
    Component: Regla503020,
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
