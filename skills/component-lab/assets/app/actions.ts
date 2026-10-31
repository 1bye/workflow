import type { ControlMap } from "../schema/index";

export async function runAction(controls: ControlMap, key: string, elements: HTMLElement[]) {
  const control = Object.hasOwn(controls, key) ? controls[key] : undefined;

  if (control?.type !== "action") throw new Error("Unknown action.");

  if (!elements.length) throw new Error("The preview is not ready.");

  await Promise.all(elements.map((element) => control.onClick({ element })));
}
