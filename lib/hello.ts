import { AsyncAPI } from "@/types";

async function hello(message:string) {
    console.log(message);
}

interface HelloAPI extends AsyncAPI {
    hello(message:string): Promise<void>;
}

export { hello };
export type { HelloAPI };
