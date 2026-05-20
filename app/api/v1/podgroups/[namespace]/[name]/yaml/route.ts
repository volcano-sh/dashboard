import { getPodGroupYaml } from "../../../../../../../lib/server/volcano-api";
import { withRead } from "../../../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead(async (request, context) => {
    const { namespace, name } = await context.params;
    return getPodGroupYaml(namespace, name);
});
