/**
 * A minimal JSX-to-HTML renderer for the public recruitment page.
 *
 * Why not react-dom/server
 * -----------------------
 * Next refuses the import inside app code — route handlers run in the React
 * Server Components graph, where `react-dom/server` is excluded by the
 * `react-server` export condition. The alternatives were to add a second UI
 * runtime (preact-render-to-string) purely to serialise one page, or to rewrite
 * the page as template strings and lose type checking on the content.
 *
 * This is the third option, and it is small because the job is small: the tree
 * it renders is a static document. No hooks, no state, no context, no Suspense,
 * no client components — a function of props to markup. React elements are
 * plain objects, so walking them is a page of code.
 *
 * It is deliberately strict: anything it does not understand throws rather than
 * rendering silently wrong. A page that fails loudly in CI is better than one
 * that quietly drops the commission terms.
 */

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "source", "track", "wbr",
]);

/** Props that are React's own bookkeeping and never reach the DOM. */
const SKIPPED_PROPS = new Set(["children", "key", "ref", "dangerouslySetInnerHTML"]);

/** React prop name -> HTML attribute name, where they differ. */
const ATTRIBUTE_NAMES: Record<string, string> = {
  className: "class",
  htmlFor: "for",
  crossOrigin: "crossorigin",
  autoComplete: "autocomplete",
  enterKeyHint: "enterkeyhint",
  defaultValue: "value",
  defaultChecked: "checked",
  maxLength: "maxlength",
  minLength: "minlength",
  readOnly: "readonly",
  tabIndex: "tabindex",
  colSpan: "colspan",
  rowSpan: "rowspan",
  noValidate: "novalidate",
  acceptCharset: "accept-charset",
  httpEquiv: "http-equiv",
};

const FRAGMENT = Symbol.for("react.fragment");

interface ElementLike {
  type: unknown;
  props: Record<string, unknown>;
}

function isElement(value: unknown): value is ElementLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "props" in value
  );
}

export function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** camelCase style keys become kebab-case CSS, numbers get no unit guessing. */
function styleToString(style: Record<string, unknown>): string {
  return Object.entries(style)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => {
      const property = key.startsWith("--")
        ? key
        : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      return `${property}:${String(value)}`;
    })
    .join(";");
}

function renderAttributes(
  tag: string,
  props: Record<string, unknown>,
): string {
  const parts: string[] = [];

  // React lets you write <select value=...>; HTML does not. Emitting it produces
  // a select that renders but ignores the value, which is the kind of bug that
  // only shows up as "the dropdown forgot my choice". Mark the option instead.
  if (tag === "select" && ("value" in props || "defaultValue" in props)) {
    throw new Error(
      "<select> takes no value attribute. Put `selected` on the intended <option>.",
    );
  }

  for (const [name, value] of Object.entries(props)) {
    if (SKIPPED_PROPS.has(name)) continue;
    if (value === null || value === undefined || value === false) continue;

    if (name === "style") {
      if (typeof value !== "object") {
        throw new Error("style must be an object");
      }
      const css = styleToString(value as Record<string, unknown>);
      if (css) parts.push(` style="${escapeAttribute(css)}"`);
      continue;
    }

    const attribute = ATTRIBUTE_NAMES[name] ?? name;

    // A boolean attribute is present or absent, never ="true".
    if (value === true) {
      parts.push(` ${attribute}`);
      continue;
    }

    if (typeof value === "function") {
      // An event handler on a page that ships no JavaScript would silently do
      // nothing. Surface it instead.
      throw new Error(
        `Event handler "${name}" on a statically rendered element. This page ships no JavaScript.`,
      );
    }

    parts.push(` ${attribute}="${escapeAttribute(String(value))}"`);
  }

  return parts.join("");
}

export function renderToStaticHtml(node: unknown): string {
  if (node === null || node === undefined || node === false || node === true) {
    return "";
  }

  if (typeof node === "string") return escapeText(node);
  if (typeof node === "number") return escapeText(String(node));

  if (Array.isArray(node)) {
    return node.map(renderToStaticHtml).join("");
  }

  if (!isElement(node)) {
    throw new Error(`Cannot render value of type ${typeof node}`);
  }

  const { type, props } = node;

  if (type === FRAGMENT) {
    return renderToStaticHtml(props.children);
  }

  // A component: call it and render what it returns. Only plain function
  // components exist in this tree; an async one would return a promise, which
  // the check below turns into a clear error rather than "[object Promise]".
  if (typeof type === "function") {
    const rendered = (type as (p: unknown) => unknown)(props);
    if (rendered instanceof Promise) {
      throw new Error(
        `Component "${type.name || "anonymous"}" is async. Static rendering needs synchronous components — fetch in the route handler and pass data as props.`,
      );
    }
    return renderToStaticHtml(rendered);
  }

  if (typeof type !== "string") {
    throw new Error(`Unsupported element type: ${String(type)}`);
  }

  const attributes = renderAttributes(type, props);

  if (VOID_ELEMENTS.has(type)) {
    return `<${type}${attributes}>`;
  }

  const raw = props.dangerouslySetInnerHTML as { __html?: string } | undefined;
  const inner =
    raw?.__html !== undefined ? raw.__html : renderToStaticHtml(props.children);

  return `<${type}${attributes}>${inner}</${type}>`;
}
