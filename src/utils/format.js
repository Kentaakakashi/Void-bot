function truncate(text, maxLength) {
  const value = String(text ?? "");

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function splitMessage(text, maxLength = 1900) {
  const value = String(text ?? "").trim();

  if (!value) {
    return [];
  }

  if (value.length <= maxLength) {
    return [value];
  }

  const chunks = [];
  let remaining = value;

  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf("\n", maxLength);

    if (cut < Math.floor(maxLength * 0.55)) {
      cut = remaining.lastIndexOf(" ", maxLength);
    }

    if (cut < Math.floor(maxLength * 0.55)) {
      cut = maxLength;
    }

    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trimStart();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

module.exports = {
  truncate,
  splitMessage
};