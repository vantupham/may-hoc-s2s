import katex from 'katex';

/**
 * Macro màu dùng chung: mỗi đại lượng có một lớp CSS (v-w, v-b, ...).
 * Màu được định nghĩa trong global.css, và cùng một lớp được dùng trong
 * hình vẽ, bảng số và mã nguồn để người học nối các dạng biểu diễn lại với nhau.
 */
export const macros: Record<string, string> = {
  '\\cw': '\\htmlClass{v-w}{#1}',
  '\\cb': '\\htmlClass{v-b}{#1}',
  '\\cx': '\\htmlClass{v-x}{#1}',
  '\\cy': '\\htmlClass{v-y}{#1}',
  '\\cyh': '\\htmlClass{v-yh}{#1}',
  '\\ce': '\\htmlClass{v-e}{#1}',
  '\\cL': '\\htmlClass{v-L}{#1}',
  '\\cg': '\\htmlClass{v-g}{#1}',
  '\\ceta': '\\htmlClass{v-eta}{#1}',
  '\\cz': '\\htmlClass{v-z}{#1}',
  '\\cp': '\\htmlClass{v-p}{#1}',
};

export function renderTex(src: string, displayMode = false): string {
  return katex.renderToString(src, {
    displayMode,
    throwOnError: false,
    trust: (ctx) => ctx.command === '\\htmlClass',
    strict: false,
    macros: { ...macros },
  });
}
