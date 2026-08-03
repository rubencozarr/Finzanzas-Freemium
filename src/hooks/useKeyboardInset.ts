import { useEffect, useState } from "react";

// En móvil, al abrir el teclado virtual el visual viewport se encoge pero el layout viewport (y por
// tanto 100dvh) no siempre se actualiza en el mismo frame — con la barra de navegación en
// position: sticky dentro del flujo normal, eso se traducía en un salto visible que solo se corregía
// al hacer scroll (lo único que fuerza a Safari/Chrome a recalcular la posición sticky). Rastrear
// visualViewport directamente y aplicar el hueco resultante como "bottom" de una barra en
// position: fixed evita depender de que el navegador reajuste el layout viewport a tiempo: la barra
// se ancla siempre justo encima de lo que sea visible de verdad, teclado incluido.
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(Math.max(0, Math.round(gap)));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
