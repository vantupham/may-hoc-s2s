import { describe, expect, it } from 'vitest';
import { highlightPython } from '../src/lib/pyhl';

const strip = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tokens = (h: string) => [...h.matchAll(/<span class="tok-(\w+)">([^<]*)<\/span>/g)].map((m) => `${m[1]}:${m[2]}`);

describe('highlightPython', () => {
  const code = `import numpy as np  # thư viện
def lr(x, w=0.5):
    print(f"w = {w:.3f}", 'a<b', len(x), 1e-3)
    return np.sum(x) > 2`;

  it('giữ nguyên văn bản gốc sau khi bỏ thẻ (để lớp tô màu khớp từng ký tự với textarea)', () => {
    expect(strip(highlightPython(code))).toBe(code);
    expect(strip(highlightPython('s = """dòng 1\ndòng 2"""\n'))).toBe('s = """dòng 1\ndòng 2"""\n');
    expect(strip(highlightPython('x = "chưa đóng'))).toBe('x = "chưa đóng');
  });

  it('nhận đúng từ khoá, chuỗi, số, chú thích, hàm', () => {
    const t = tokens(highlightPython(code));
    expect(t).toContain('kw:import');
    expect(t).toContain('kw:def');
    expect(t).toContain('def:lr');
    expect(t).toContain('com:# thư viện');
    expect(t).toContain('str:f"w = {w:.3f}"');
    expect(t).toContain("str:'a&lt;b'");
    expect(t).toContain('bi:print');
    expect(t).toContain('fn:sum');
    expect(t).toContain('num:0.5');
    expect(t).toContain('num:1e-3');
    expect(t).toContain('kw:return');
  });

  it('escape HTML, không có thẻ lạ', () => {
    expect(highlightPython('a < b and "<script>"')).not.toContain('<script>');
  });

  it('dấu # trong chuỗi không phải chú thích', () => {
    expect(tokens(highlightPython('s = "#không"'))).toEqual(['op:=', 'str:"#không"']);
  });
});
