import { PostModel } from './posts.model.js';
import { PostRepository } from './posts.repository.js';
import { PostsService } from './posts.service.js';
import { PostsController } from './posts.controller.js';
import { ScheduledPostModel } from '../scheduler/scheduled-post.model.js';
import { ScheduledPostRepository } from '../scheduler/scheduled-post.repository.js';
import { PublishEventPublisher } from '../scheduler/publish-event.publisher.js';
import { imageUploadMiddleware } from "./posts.image-upload.middleware.js";
import { createPostSchema, updatePostSchema, listPostsQuerySchema, schedulePostSchema } from './posts.validation.js';

/**
 * `ScheduledPost` is conceptually the scheduler module's collection, but
 * it's registered here (rather than a separate scheduler.module.js) since
 * `postsService` is its only writer via HTTP — the worker process reads
 * it directly through its own manual wiring (see `app/worker.js`), which
 * has no Silay `AppBuilder`/DI container of its own since it serves no
 * HTTP routes.
 *
 * @type {Array<object>}
 */
export const postsModuleConfigs = [
  { key: "postModel", type: "model", Class: PostModel, dependencies: [] },
  {
    key: "postRepository",
    type: "repository",
    Class: PostRepository,
    dependencies: ["postModel"],
  },

  {
    key: "scheduledPostModel",
    type: "model",
    Class: ScheduledPostModel,
    dependencies: [],
  },
  {
    key: "scheduledPostRepository",
    type: "repository",
    Class: ScheduledPostRepository,
    dependencies: ["scheduledPostModel"],
  },
  {
    key: "publishEventPublisher",
    type: "service",
    Class: PublishEventPublisher,
    dependencies: [],
  },

  {
    key: "postsService",
    type: "service",
    Class: PostsService,
    dependencies: [
      "postRepository",
      "scheduledPostRepository",
      "publishEventPublisher",
    ],
  },
  {
    key: "postsController",
    type: "controller",
    Class: PostsController,
    dependencies: ["postsService"],
  },
  {
    key: "imageUploadMiddleware",
    type: "middleware",
    dependencies: [],
    fn: imageUploadMiddleware,
  },
  { key: "createPostSchema", type: "schema", schema: createPostSchema },
  { key: "updatePostSchema", type: "schema", schema: updatePostSchema },
  { key: "listPostsQuerySchema", type: "schema", schema: listPostsQuerySchema },
  { key: "schedulePostSchema", type: "schema", schema: schedulePostSchema },
];

/** @type {{ configs: { prefix: string, controller: string }, routes: Array<object> }} */
export const postsRoutes = {
  configs: { prefix: "/api/posts", controller: "postsController" },
  routes: [
    {
      url: "/",
      httpMethod: "get",
      methodName: "list",
      middlewares: [
        { name: "requireAuth" },
        { name: "validate", args: ["listPostsQuerySchema", "query"] },
      ],
    },
    {
      url: "/",
      httpMethod: "post",
      methodName: "create",
      middlewares: [
        { name: "requireAuth" },
        { name: "validate", args: ["createPostSchema", "body"] },
      ],
    },
    {
      url: "/:id",
      httpMethod: "get",
      methodName: "getById",
      middlewares: [{ name: "requireAuth" }],
    },
    {
      url: "/:id",
      httpMethod: "patch",
      methodName: "update",
      middlewares: [
        { name: "requireAuth" },
        { name: "validate", args: ["updatePostSchema", "body"] },
      ],
    },
    {
      url: "/:id",
      httpMethod: "delete",
      methodName: "remove",
      middlewares: [{ name: "requireAuth" }],
    },
    {
      url: "/:id/approve",
      httpMethod: "post",
      methodName: "approve",
      middlewares: [{ name: "requireAuth" }],
    },
    {
      url: "/:id/publish",
      httpMethod: "post",
      methodName: "publish",
      middlewares: [{ name: "requireAuth" }],
    },
    {
      url: "/:id/schedule",
      httpMethod: "post",
      methodName: "schedule",
      middlewares: [
        { name: "requireAuth" },
        { name: "validate", args: ["schedulePostSchema", "body"] },
      ],
    },
    {
      url: "/:id/cancel",
      httpMethod: "post",
      methodName: "cancel",
      middlewares: [{ name: "requireAuth" }],
    },
    {
      url: "/:id/cancel",
      httpMethod: "post",
      methodName: "cancel",
      middlewares: [{ name: "requireAuth" }],
    },
    {
      url: "/:id/image",
      httpMethod: "post",
      methodName: "uploadImage",
      middlewares: [{ name: "requireAuth" }, { name: "imageUploadMiddleware" }],
    },
    {
      url: "/:id/image",
      httpMethod: "delete",
      methodName: "removeImage",
      middlewares: [{ name: "requireAuth" }],
    },
    {
      url: "/:id/image",
      httpMethod: "get",
      methodName: "getImage",
      middlewares: [{ name: "requireAuth" }],
    },
  ],
};
