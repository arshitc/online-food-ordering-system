const normalizeCategory = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const formatCategoryLabel = (value = "") => {
  const normalized = normalizeCategory(value);

  if (!normalized) {
    return "";
  }

  const words = normalized.split(" ");
  const formattedWords = [];

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];

    if (word === "non" && words[index + 1] === "veg") {
      formattedWords.push("Non-Veg");
      index += 1;
      continue;
    }

    if (word === "veg") {
      formattedWords.push("Veg");
      continue;
    }

    if (word === "bbq") {
      formattedWords.push("BBQ");
      continue;
    }

    formattedWords.push(word.charAt(0).toUpperCase() + word.slice(1));
  }

  return formattedWords.join(" ");
};

export { normalizeCategory };
export default formatCategoryLabel;
