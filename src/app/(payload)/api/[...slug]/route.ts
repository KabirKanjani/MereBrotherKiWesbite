import config from "@payload-config";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";

/**
 * Payload's REST API.
 *
 * Permissions are not enforced here. Each collection declares who may read and
 * write in its own access rules, so an open GET on a published product is
 * intended, while any write without a valid staff session is rejected by the
 * collection rather than by this file.
 */

export const GET = REST_GET(config);
export const POST = REST_POST(config);
export const DELETE = REST_DELETE(config);
export const PATCH = REST_PATCH(config);
export const PUT = REST_PUT(config);
export const OPTIONS = REST_OPTIONS(config);