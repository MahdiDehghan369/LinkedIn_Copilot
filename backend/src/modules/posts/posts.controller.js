export class PostsController {
  /** @param {import('./posts.service.js').PostsService} postsService */
  constructor(postsService) {
    this.posts = postsService;
  }

  /** GET /api/posts */
  async list(req, res) {
    const result = await this.posts.list(req.userId, req.query);
    res.sendResponse(200, result);
  }

  /** POST /api/posts */
  async create(req, res) {
    const post = await this.posts.create(req.userId, req.body);
    res.sendResponse(201, { post });
  }

  /** GET /api/posts/:id */
  async getById(req, res) {
    const post = await this.posts.getById(req.userId, req.params.id);
    res.sendResponse(200, { post });
  }

  /** PATCH /api/posts/:id */
  async update(req, res) {
    const post = await this.posts.updateContent(
      req.userId,
      req.params.id,
      req.body,
    );
    res.sendResponse(200, { post });
  }

  /** DELETE /api/posts/:id */
  async remove(req, res) {
    await this.posts.delete(req.userId, req.params.id);
    res.sendResponse(200, { message: "Post deleted." });
  }

  /** POST /api/posts/:id/approve */
  async approve(req, res) {
    const post = await this.posts.approve(req.userId, req.params.id);
    res.sendResponse(200, { post });
  }

  /** POST /api/posts/:id/publish */
  async publish(req, res) {
    const post = await this.posts.requestPublish(req.userId, req.params.id);
    res.sendResponse(202, { post });
  }

  /** POST /api/posts/:id/schedule */
  async schedule(req, res) {
    const post = await this.posts.schedule(
      req.userId,
      req.params.id,
      req.body.scheduledFor,
    );
    res.sendResponse(200, { post });
  }

  /** POST /api/posts/:id/cancel */
  async cancel(req, res) {
    const post = await this.posts.cancel(req.userId, req.params.id);
    res.sendResponse(200, { post });
  }

  /** POST /api/posts/:id/image (multipart, field name "image") */
  async uploadImage(req, res) {
    const post = await this.posts.attachImage(
      req.userId,
      req.params.id,
      req.file,
    );
    res.sendResponse(200, { post });
  }

  /** DELETE /api/posts/:id/image */
  async removeImage(req, res) {
    const post = await this.posts.removeImage(req.userId, req.params.id);
    res.sendResponse(200, { post });
  }

  /** GET /api/posts/:id/image — streams the stored image back (for the editor preview) */
  async getImage(req, res) {
    const { post, buffer } = await this.posts.getImageFile(
      req.userId,
      req.params.id,
    );
    res.set("Content-Type", post.image.mimeType);
    res.set("Cache-Control", "private, max-age=3600");
    res.send(buffer);
  }
}
