/**
 * Remove HTML tags from a string.
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};
