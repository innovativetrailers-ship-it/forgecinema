export interface ModelVerification {
    markdown: string;
    missing: string[];
    deprecated: string[];
}
export interface ListedModel {
    id: string;
    deprecated?: boolean;
}
export interface EndpointSchemaReport {
    registryId: string;
    note: string;
}
/** Turns fetched lists into the report. The script performs the fetches. */
export declare function reportModelVerification(input: {
    listed: ListedModel[] | null;
    listError?: string;
    endpoints: EndpointSchemaReport[];
}): ModelVerification;
