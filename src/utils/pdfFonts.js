// utils/pdfFonts.js
import pdfMake from "pdfmake/build/pdfmake.min";
import { PROMPT_REGULAR_BASE64 } from "../fonts/promptRegularBase64";
import { PROMPT_BOLD_BASE64 } from "../fonts/promptBoldBase64";

pdfMake.vfs = {
  "Prompt-Regular.ttf": PROMPT_REGULAR_BASE64,
  "Prompt-Bold.ttf": PROMPT_BOLD_BASE64,
};

pdfMake.fonts = {
  Prompt: {
    normal: "Prompt-Regular.ttf",
    bold: "Prompt-Bold.ttf",
    italics: "Prompt-Regular.ttf",
    bolditalics: "Prompt-Bold.ttf",
  },
};

export default pdfMake;
