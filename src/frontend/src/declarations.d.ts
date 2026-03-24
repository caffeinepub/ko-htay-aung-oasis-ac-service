declare module "jspdf" {
  interface jsPDF {
    text(text: string, x: number, y: number, options?: any): jsPDF;
    setFontSize(size: number): jsPDF;
    setFont(fontName: string, fontStyle?: string): jsPDF;
    setTextColor(r: number, g?: number, b?: number): jsPDF;
    setFillColor(r: number, g?: number, b?: number): jsPDF;
    setDrawColor(r: number, g?: number, b?: number): jsPDF;
    setLineWidth(width: number): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: string): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    addPage(): jsPDF;
    save(filename: string): jsPDF;
    internal: {
      pageSize: {
        width: number;
        height: number;
        getWidth(): number;
        getHeight(): number;
      };
    };
    splitTextToSize(text: string, maxWidth: number): string[];
    getStringUnitWidth(text: string): number;
    getFontSize(): number;
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      w: number,
      h: number,
    ): jsPDF;
  }

  interface jsPDFOptions {
    orientation?: "portrait" | "landscape" | "p" | "l";
    unit?: "pt" | "mm" | "cm" | "in" | "px" | "pc" | "em" | "ex";
    format?: string | number[];
    compress?: boolean;
  }

  interface jsPDFConstructor {
    new (options?: jsPDFOptions): jsPDF;
    new (
      orientation?: string,
      unit?: string,
      format?: string | number[],
    ): jsPDF;
  }

  const jsPDF: jsPDFConstructor;
  export default jsPDF;
}
