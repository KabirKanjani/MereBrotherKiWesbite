import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import sharp from "sharp";

import { Products } from "./collections/Products";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { Users } from "./collections/Users";
import { Enquiries } from "./collections/Enquiries";
import { StockistApplications } from "./collections/StockistApplications";
import { SocialPosts } from "./collections/SocialPosts";
import { SeasonalCollections } from "./collections/SeasonalCollections";
import { Buyers } from "./collections/Buyers";
import { Orders } from "./collections/Orders";
import { Payments } from "./collections/Payments";
import { StockMovements } from "./collections/StockMovements";
import { TeamMembers } from "./collections/TeamMembers";
import { ProductionTasks } from "./collections/ProductionTasks";
import { Settings } from "./globals/Settings";
import { resolveLogoSrc } from "./src/lib/logo";

/**
 * Custom admin components are referenced by path so they land in the admin
 * bundle. `npm run generate:types` and `generate:importmap` keep the generated
 * files in step with these paths.
 */
const SHOP_OVERVIEW_WIDGET = "@/components/admin/ShopOverview#default";

/**
 * Two further dashboard panels: the money and stock figures, and the factory
 * floor board. Both are read-only views over the same collections staff edit
 * through Payload's own forms.
 */
const OPS_OVERVIEW_WIDGET = "@/components/admin/OpsOverview#default";
const JOB_BOARD_WIDGET = "@/components/admin/JobBoard#default";

/**
 * Replaces the Payload logo on the admin sign-in screen with the shop's own.
 *
 * Without this the sign-in page says "Payload", which tells your brother
 * nothing about where he is signing in to.
 */
const ADMIN_LOGO = {
  path: "@/components/admin/AdminLogo#default",
  serverProps: { src: resolveLogoSrc() },
};

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The database differs by environment on purpose.
 *
 * Locally there is no Postgres server to run, so development uses a SQLite file
 * in the project. In production on Render we point at Postgres, because Render's
 * filesystem is ephemeral and a SQLite file would be wiped on every deploy.
 *
 * Set DATABASE_URI to force Postgres. Leave it unset for local SQLite.
 */
const databaseURI = process.env.DATABASE_URI;

/**
 * The SQLite client only accepts URLs, so the Windows path needs a file:
 * scheme and forward slashes. Left as a bare "C:\..." it fails with
 * URL_SCHEME_NOT_SUPPORTED the moment Payload tries to open the database.
 */
const sqlitePath = process.env.SQLITE_PATH ?? path.join(dirname, "payload.db");
const sqliteURL = sqlitePath.startsWith("file:")
  ? sqlitePath
  : `file:${path.resolve(sqlitePath).replace(/\\/g, "/")}`;

const adapter = databaseURI
  ? postgresAdapter({
      pool: {
        connectionString: databaseURI,
        // Render's free Postgres closes idle connections; keep a floor on how long
        // the pool holds them so requests do not fail on a cold connection.
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      },
      /*
       * Render gives the shop a completely empty Postgres database. Without a
       * schema push, the very first request to /admin would fail because none of
       * the tables exist.
       *
       * This is the right choice for a small shop with no migrations yet: the
       * schema is reconciled from the collections on each boot, so adding a
       * field in the admin panel is enough to change the database.
       *
       * It is not the right choice for a large database with real money in it.
       * Once orders and payments carry live figures, replace this with generated
       * migration files (payload migrate:create) run by a release command, so a
       * deploy can never silently drop a column.
       */
      push: true,
    })
  : sqliteAdapter({
      client: { url: sqliteURL },
      /*
       * Payload can reconcile the schema automatically in development, which is
       * convenient. It must not do so in production, and it also must not run in
       * two processes at once: with a dev server and a production server sharing
       * one SQLite file, both try to create the same indexes and the loser dies
       * with "index already exists".
       */
      push: process.env.NODE_ENV !== "production" && process.env.PAYLOAD_NO_PUSH !== "1",
    });

export default buildConfig({
  // Payload refuses to start in production without this set. It is only used for
  // cookie security, so a placeholder is fine and is injected per deploy.
  secret: process.env.PAYLOAD_SECRET ?? "dev-only-secret-change-me-in-production",

  serverURL: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000",

  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " — Kivia Designs",
    },
    /**
     * A panel that answers the questions staff actually log in to check, in
     * place of Payload's default list of every collection.
     */
    components: {
      graphics: {
        Logo: ADMIN_LOGO,
      },
    },
    dashboard: {
      widgets: [
        {
          slug: "shop-overview",
          label: "Shop overview",
          Component: SHOP_OVERVIEW_WIDGET,
          minWidth: "medium",
          maxWidth: "full",
        },
        {
          slug: "ops-overview",
          label: "Orders and money",
          Component: OPS_OVERVIEW_WIDGET,
          minWidth: "medium",
          maxWidth: "full",
        },
        {
          slug: "job-board",
          label: "Factory floor",
          Component: JOB_BOARD_WIDGET,
          minWidth: "medium",
          maxWidth: "full",
        },
      ],
      defaultLayout: [
        { widgetSlug: "shop-overview", width: "full" },
        { widgetSlug: "ops-overview", width: "full" },
        { widgetSlug: "job-board", width: "full" },
      ],
    },
    // Keeps the admin out of search results.
    livePreview: {
      url: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000",
      breakpoints: [
        { name: "mobile", label: "Mobile", width: 390, height: 844 },
        { name: "tablet", label: "Tablet", width: 834, height: 1112 },
        { name: "desktop", label: "Desktop", width: 1440, height: 900 },
      ],
    },
  },

  collections: [
  Users,
  Media,
  Products,
  Pages,
  SeasonalCollections,
  SocialPosts,
  Enquiries,
  StockistApplications,
  // Operations: wholesale trading, stock and the factory floor.
  Buyers,
  Orders,
  Payments,
  StockMovements,
  TeamMembers,
  ProductionTasks,
],

  globals: [Settings],

  editor: lexicalEditor(),

  /**
   * Uploaded photographs.
   *
   * In development these go to a local folder. In production that folder would be
   * wiped on every deploy, so object storage is used instead. Cloudflare R2 and
   * AWS S3 both speak the same API, so either works.
   *
   * When these variables are absent the local folder is used, which is why this
   * is conditional rather than always configured.
   */
  ...(process.env.IMAGE_STORAGE_BUCKET
    ? {
        plugins: [
          s3Storage({
            collections: { media: true },
            bucket: process.env.IMAGE_STORAGE_BUCKET!,
            acl: "public-read",
            // The AWS SDK takes credentials nested under `credentials`, not as
            // top-level keys.
            config: {
              endpoint: process.env.IMAGE_STORAGE_ENDPOINT,
              region: process.env.IMAGE_STORAGE_REGION ?? "auto",
              credentials: {
                accessKeyId: process.env.IMAGE_STORAGE_ACCESS_KEY_ID!,
                secretAccessKey: process.env.IMAGE_STORAGE_SECRET_ACCESS_KEY!,
              },
            },
          }),
        ],
      }
    : {}),

  db: adapter,

  // Without this the upload collection silently skips generating the thumbnail
  // and card sizes defined on Media.
  sharp,

  typescript: {
    outputFile: path.join(dirname, "payload-types.ts"),
  },

  graphQL: {
    schemaOutputFile: path.join(dirname, "generated-schema.graphql"),
  },
});

/**
 * Access rules are declared per collection rather than globally, because the
 * requirement is specific: anyone may read the published site, but only a
 * signed-in member of staff may change anything.
 *
 * Those helpers are attached to each collection so the rules read the same way
 * everywhere instead of being retyped slightly differently in three places.
 */
export const isAdmin = ({ req: { user } }: { req: { user?: unknown } }) =>
  Boolean(user);

export const adminOrSelf = ({ id, req: { user } }: { id: unknown; req: { user?: { id?: unknown } } }) =>
  Boolean(user) && (user as { id?: unknown }).id === id;