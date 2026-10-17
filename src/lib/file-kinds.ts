/** PowerPoint files we can show in the browser (not the old binary .ppt). */
export function isSlideDeck(file: { fileName: string; contentType: string }) {
  return (
    /\.(pptx|ppsx|potx|pptm)$/i.test(file.fileName) ||
    /presentationml\.(presentation|slideshow|template)/.test(file.contentType)
  );
}

/** Word files we can show in the browser (not the old binary .doc). */
export function isWordDoc(file: { fileName: string; contentType: string }) {
  return /\.(docx|dotx|docm)$/i.test(file.fileName) || /wordprocessingml\.(document|template)/.test(file.contentType);
}

export type ViewerKind = "slides" | "document";

export function viewerKind(file: { fileName: string; contentType: string }): ViewerKind | null {
  return isSlideDeck(file) ? "slides" : isWordDoc(file) ? "document" : null;
}
