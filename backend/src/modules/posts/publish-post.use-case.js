import { readImage } from "../../infrastructure/storage/local-file-storage.js";

/**
 * Composes a Post's structured content into the plain text LinkedIn's
 * API accepts.
 * @param {{ hook?: string, body?: string, cta?: string, hashtags?: string[] }} content
 * @returns {string}
 */
export function composePostText({ hook, body, cta, hashtags }) {
  const paragraphs = [hook, body, cta].filter(Boolean).join("\n\n");
  const tagLine = hashtags?.length
    ? "\n\n" +
      hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ")
    : "";
  return paragraphs + tagLine;
}

export class PublishPostUseCase {
  constructor(postRepository, linkedinService) {
    this.posts = postRepository;
    this.linkedin = linkedinService;
  }

  async execute({ postId, userId }) {
    const post = await this.posts.findByIdForUser(postId, userId);
    if (!post) return;

    if (post.status !== "PUBLISHING") return;

    const text = composePostText(post.content);
    const image = post.image?.storageKey
      ? {
          buffer: await readImage(post.image.storageKey),
          mimeType: post.image.mimeType,
        }
      : undefined;
    const result = await this.linkedin.publish(userId, text, image);

    post.status = "PUBLISHED";
    post.linkedin.postId = result.linkedinPostId;
    post.linkedin.publishedAt = new Date();
    await post.save();
  }
}
