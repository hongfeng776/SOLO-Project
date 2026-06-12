class DownloadUtil {
  blob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    this._download(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  text(content: string, filename: string, type = 'text/plain;charset=utf-8'): void {
    const blob = new Blob([content], { type });
    this.blob(blob, filename);
  }

  json<T>(data: T, filename: string): void {
    this.text(JSON.stringify(data, null, 2), filename, 'application/json;charset=utf-8');
  }

  csv(data: Record<string, any>[], filename: string, headers?: string[]): void {
    const keys = headers || Object.keys(data[0] || {});
    const head = keys.join(',');
    const rows = data.map((row) =>
      keys.map((k) => {
        const val = row[k];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(','),
    );
    const bom = '\uFEFF';
    this.text(bom + [head, ...rows].join('\n'), filename, 'text/csv;charset=utf-8');
  }

  url(url: string, filename?: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    if (filename) link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  canvas(canvas: HTMLCanvasElement, filename: string, type = 'image/png', quality = 0.92): void {
    canvas.toBlob((blob) => {
      if (blob) this.blob(blob, filename);
    }, type, quality);
  }

  element(selector: string, filename: string): void {
    const el = document.querySelector(selector);
    if (!el) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${el.outerHTML}</body></html>`;
    this.text(html, filename, 'text/html;charset=utf-8');
  }

  private _download(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const download = new DownloadUtil();
export default download;
