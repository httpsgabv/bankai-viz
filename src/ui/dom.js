/** Tiny element factory: el('div', { class, text, html, attrs, on }, children) */
export function el(tag, { class: className, text, html, attrs = {}, on = {} } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (html !== undefined) node.innerHTML = html;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  for (const [event, handler] of Object.entries(on)) node.addEventListener(event, handler);
  node.append(...children);
  return node;
}

export function iconButton(icon, label, onClick) {
  return el('button', {
    class: 'icon-button',
    html: icon,
    attrs: { type: 'button', 'aria-label': label, title: label },
    on: { click: onClick },
  });
}
