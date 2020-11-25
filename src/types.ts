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
