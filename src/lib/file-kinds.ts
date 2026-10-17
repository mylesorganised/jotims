/** PowerPoint files we can show in the browser (not the old binary .ppt). */
export function isSlideDeck(file: { fileName: string; contentType: string }) {
  return (
    /\.(pptx|ppsx|potx|pptm)$/i.test(file.fileName) ||
    /presentationml\.(presentation|slideshow|template)/.test(file.contentType)
  );
}
