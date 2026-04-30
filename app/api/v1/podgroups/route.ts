import {
    createPodGroup,
    listPodGroups,
} from "../../../../lib/server/volcano-api";
import { withRead, withWrite } from "../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead((request) => {
    return listPodGroups(request);
});

export const POST = withWrite((request) => {
    return createPodGroup(request);
});
