/**
 * Tô màu cú pháp Python tối giản, không phụ thuộc thư viện: trả về HTML đã escape,
 * mỗi token bọc trong <span class="tok-…">. Đủ cho các đoạn mã ngắn trong bài học.
 */

const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del',
  'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]);
const BUILTINS = new Set([
  'abs', 'all', 'any', 'bool', 'dict', 'enumerate', 'filter', 'float', 'int', 'isinstance', 'len', 'list', 'map',
  'max', 'min', 'open', 'print', 'range', 'round', 'set', 'sorted', 'str', 'sum', 'tuple', 'type', 'zip', 'self',
]);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Thứ tự quan trọng: chú thích, chuỗi ba nháy, chuỗi thường, số, tên, toán tử
const TOKEN = new RegExp(
  [
    String.raw`(?<com>#[^\n]*)`,
    String.raw`(?<str>(?:[rRbBuUfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))`,
    String.raw`(?<num>\b(?:0[xXoObB][\da-fA-F_]+|\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?j?|\.\d+(?:[eE][+-]?\d+)?)\b)`,
    String.raw`(?<name>[A-Za-z_]\w*)`,
    String.raw`(?<op>[-+*/%=<>!&|^~@:]+)`,
  ].join('|'),
  'g',
);

export function highlightPython(src: string): string {
  let out = '';
  let last = 0;
  let prevWord = '';
  for (const m of src.matchAll(TOKEN)) {
    const i = m.index!;
    out += esc(src.slice(last, i));
    const t = m[0];
    const g = m.groups!;
    let cls = '';
    if (g.com) cls = 'com';
    else if (g.str) cls = 'str';
    else if (g.num) cls = 'num';
    else if (g.name) {
      if (KEYWORDS.has(t)) cls = 'kw';
      else if (prevWord === 'def' || prevWord === 'class') cls = 'def';
      else {
        const call = /^\s*\(/.test(src.slice(i + t.length));
        const attr = src[i - 1] === '.'; // np.sum: phương thức, không phải hàm có sẵn
        if (!attr && BUILTINS.has(t)) cls = 'bi';
        else if (call) cls = 'fn';
      }
    } else if (g.op) cls = 'op';
    out += cls ? `<span class="tok-${cls}">${esc(t)}</span>` : esc(t);
    if (g.name) prevWord = t;
    else if (!/^\s+$/.test(t)) prevWord = '';
    last = i + t.length;
  }
  return out + esc(src.slice(last));
}
