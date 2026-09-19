function isImageAttachment(attachment) {
  if (!attachment) {
    return false;
  }

  const contentType =
    String(attachment.contentType || "").toLowerCase();

  if (contentType.startsWith("image/")) {
    return true;
  }

  const name =
    String(attachment.name || "").toLowerCase();

  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

module.exports = {
  isImageAttachment
};