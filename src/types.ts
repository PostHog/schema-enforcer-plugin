import { PluginMeta, PluginAttachment } from 'posthog-plugins'

interface SchemaProp {
    type: string
    required?: boolean
}

export interface SchemaEvent {
    acceptOnlySchemaProps?: boolean
    schema: {
        [key: string]: SchemaProp
    }
}

export interface SchemaObject {
    onlyIngestEventsFromFile?: boolean
    eventSchemas: {
        [key: string]: SchemaEvent
    }
}

export interface Meta extends PluginMeta {
    attachments: {
        eventSchemaFile?: PluginAttachment
    }
    global: {
        schemaFile?: SchemaObject
    }
}
